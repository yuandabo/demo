import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { ApiError, get, post } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import { fmtNum } from '../../shared/format'
import type { DetailNotVisibleData, PortalTutorialDetail, RelatedItem } from '../../shared/types'
import DetailInteraction from './DetailInteraction'
import './Detail.css'

/** 字号档位 localStorage 键（交互 3：portal_article_fs） */
const FS_STORAGE_KEY = 'portal_article_fs'
/** 字号三档：档位 → 正文 px（AC-RULE-21 / UI-IXD-04，仅作用于正文区域） */
const FS_LEVELS = [
  { level: 1, label: '标准', px: '15px', testid: 'fs-btn-standard' },
  { level: 2, label: '大', px: '17px', testid: 'fs-btn-large' },
  { level: 3, label: '特大', px: '19px', testid: 'fs-btn-xlarge' },
] as const
/** 进度节流窗口：滚动期间至多每 3s 落一次请求（交互 5） */
const PROGRESS_FLUSH_MS = 3000
/** 吸顶头部 + 工具条预留：目录锚点 scroll-margin-top 与 IntersectionObserver rootMargin 共用（交互 2） */
const STICKY_OFFSET_PX = 150
/** 视频节锚点 id（目录首项，videoUrl 存在才有） */
const VIDEO_SEC_ID = 'sec-video'
/** 404 分支契约文案（get-api-tutorials-id.md 失败场景） */
const MSG_OFFLINE = '该教程已下架'
/** 富文本白名单（AC-NF-04：剥离 script/事件属性；覆盖管理编辑器可产出的标签集）。
 * h2 必须放行：admin RichEditor「H 步骤标题」产出 h2（种子数据为 h3），漏放行会把编辑器创作的步骤结构拍平 */
const CONTENT_ALLOWED_TAGS = [
  'p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'br', 'img', 'a', 'code', 'blockquote', 'span',
]
/** class 放行口径同 shared/sanitize.ts：仅展示类标记（种子截图占位 p.ph-img / 编辑器 img-ph），无脚本执行面 */
const CONTENT_ALLOWED_ATTR = ['src', 'alt', 'href', 'title', 'class']
/** 步骤节标题特征：管理端正文固定「第 N 步 · …」小节结构 */
const STEP_TITLE_RE = /^第\s*\d+\s*步/

/** 正文图片强制懒加载 + 异步解码（AC-EG-13）；模块级注册一次，随所有 sanitize 生效 */
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName === 'IMG') {
    node.setAttribute('loading', 'lazy')
    node.setAttribute('decoding', 'async')
  }
})

/** 富文本净化：白名单标签 + 剥离 script/事件属性（AC-NF-04 / tech-design §6） */
function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS: CONTENT_ALLOWED_TAGS,
    ALLOWED_ATTR: CONTENT_ALLOWED_ATTR,
  })
}

/** 正文小节：h2/h3 均为节标题，其后内容为节体；非「第 N 步」小节按注意事项样式渲染 */
interface ContentSection {
  id: string
  title: string
  bodyHtml: string
  isStep: boolean
}

interface ParsedContent {
  /** 首个 h2/h3 之前的散段（兜底渲染，种子数据无此形态） */
  leadHtml: string
  sections: ContentSection[]
}

/** 节标题标签集：H2（admin RichEditor「H 步骤标题」产出）与 H3（种子数据）双口径拆节，
 * 目录锚点 / 步骤勾选 / 进度分母共用同一拆分 */
const SECTION_TAGS = new Set(['H2', 'H3'])

/** 净化后的正文按 h2/h3 拆节：目录锚点 / 步骤勾选 / 进度分母共用同一拆分 */
function parseSections(sanitizedHtml: string): ParsedContent {
  if (!sanitizedHtml.trim()) return { leadHtml: '', sections: [] }
  const doc = new DOMParser().parseFromString(sanitizedHtml, 'text/html')
  const lead: string[] = []
  const sections: ContentSection[] = []
  let current: ContentSection | null = null

  Array.from(doc.body.childNodes).forEach((node) => {
    const el = node instanceof HTMLElement ? node : null
    if (el && SECTION_TAGS.has(el.tagName)) {
      const title = (el.textContent ?? '').trim()
      current = { id: `sec-${sections.length + 1}`, title, bodyHtml: '', isStep: STEP_TITLE_RE.test(title) }
      sections.push(current)
      return
    }
    // 文本节点包一层 p 保持段落样式；空白节点丢弃
    const html = el ? el.outerHTML : node.textContent?.trim() ? `<p>${node.textContent}</p>` : ''
    if (!html.trim()) return
    if (current) current.bodyHtml += html
    else lead.push(html)
  })
  return { leadHtml: lead.join(''), sections }
}

/** 滚动深度百分比：正文顶越过阅读线（视口顶 + 吸顶偏移）起按正文高度比例计数（交互 5 口径） */
function scrollDepthPct(article: HTMLElement): number {
  const rect = article.getBoundingClientRect()
  if (rect.height <= 0) return 0
  const pct = Math.round((-(rect.top - STICKY_OFFSET_PX) / rect.height) * 100)
  return Math.max(0, Math.min(100, pct))
}

type DetailState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: PortalTutorialDetail }
  | { kind: 'offline'; related: RelatedItem[] }
  | { kind: 'invisible' }
  | { kind: 'error' }

/**
 * portal 教程详情页 #/detail/:id（FE-02 阅读主体）：
 * 正文渲染（DOMPurify 白名单）/ 目录锚点（IntersectionObserver 高亮）/ 字号三档（CSS 变量 + localStorage）/
 * 步骤勾选进度（滚动节流保存 + 失败静默重试回退）/ 继续阅读横幅 / 上下篇 / 404 已下架与不可见两分支。
 * 互动区（收藏/评价/留言/分享，FE-03）见 DetailInteraction；正文底部关联推荐同分类 4 篇（UI-IXD-16）。
 */
export default function Detail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [state, setState] = useState<DetailState>({ kind: 'loading' })
  const [retryNonce, setRetryNonce] = useState(0)
  /** 收藏数联动覆盖值：互动区操作后标题区/信息卡同步（UI-IXD-06）；重取详情后以最新响应为准 */
  const [favCountOverride, setFavCountOverride] = useState<number | null>(null)
  const [fsLevel, setFsLevel] = useState<number>(() => {
    const saved = Number(localStorage.getItem(FS_STORAGE_KEY))
    return FS_LEVELS.some((f) => f.level === saved) ? saved : 1
  })

  const articleRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [doneSteps, setDoneSteps] = useState<Set<string>>(new Set())
  const [resumeClosed, setResumeClosed] = useState(false)
  const [activeSecId, setActiveSecId] = useState('')
  const [videoFailed, setVideoFailed] = useState(false)
  const [videoStarted, setVideoStarted] = useState(false)

  // 进度保存：待发值 + 节流定时器 + 最近已发值（去重，避免同值重复落库）
  const scrollPctRef = useRef(0)
  const stepPctRef = useRef(0)
  const pendingPctRef = useRef<number | null>(null)
  const flushTimerRef = useRef<number | null>(null)
  const lastSentPctRef = useRef<number | null>(null)

  // ── 取数：id 变化 / 手动重试触发；404 按 message+reason 双口径分派两提示页（交互 1/7）──
  useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    setResumeClosed(false)
    setVideoFailed(false)
    setVideoStarted(false)
    setDoneSteps(new Set())
    scrollPctRef.current = 0
    stepPctRef.current = 0
    pendingPctRef.current = null
    lastSentPctRef.current = null

    get<PortalTutorialDetail>(`/api/tutorials/${id}`)
      .then((data) => {
        if (alive) setState({ kind: 'ok', data })
      })
      .catch((err: unknown) => {
        if (!alive) return
        if (err instanceof ApiError && err.code === 404) {
          const payload = err.data as DetailNotVisibleData | undefined
          const offline = err.message === MSG_OFFLINE || payload?.reason === 'offline'
          setState(offline ? { kind: 'offline', related: payload?.related ?? [] } : { kind: 'invisible' })
        } else {
          setState({ kind: 'error' })
        }
      })
    return () => {
      alive = false
    }
  }, [id, retryNonce])

  const detail = state.kind === 'ok' ? state.data : null

  // 详情重取后收藏数覆盖值失效，回到响应口径
  useEffect(() => {
    setFavCountOverride(null)
  }, [state])

  const parsed = useMemo(
    () => (detail ? parseSections(sanitizeContent(detail.content)) : null),
    [detail],
  )
  const stepSections = useMemo(() => parsed?.sections.filter((s) => s.isStep) ?? [], [parsed])
  const totalSteps = stepSections.length
  const tocEntries = useMemo(() => {
    if (!detail || !parsed) return [] as Array<{ id: string; title: string }>
    const entries: Array<{ id: string; title: string }> = []
    if (detail.videoUrl) entries.push({ id: VIDEO_SEC_ID, title: '视频演示' })
    parsed.sections.forEach((s) => entries.push({ id: s.id, title: s.title }))
    return entries
  }, [detail, parsed])

  // 载入即初始化：按 myProgress 预置已完成步骤（进度条初值）+ 目录首项高亮（UI-IXD-11 / 元素表）
  useEffect(() => {
    if (state.kind !== 'ok' || !parsed) return
    const p = state.data.myProgress ?? 0
    const doneCount = Math.min(totalSteps, Math.floor((p / 100) * totalSteps))
    setDoneSteps(new Set(stepSections.slice(0, doneCount).map((s) => s.id)))
    stepPctRef.current = totalSteps === 0 ? 0 : Math.round((doneCount / totalSteps) * 100)
    setActiveSecId(tocEntries[0]?.id ?? '')
    // state/parsed/tocEntries 每次载入重建；totalSteps/stepSections 随之确定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, parsed])

  // ── 进度保存（AC-RULE-11 / AC-EG-17）：节流 3s 落库，失败静默重试一次，未登录不发请求 ──
  const isLoggedIn = user != null

  /** 静默保存：失败重试一次，再失败放弃（服务端仍持有最近成功值，AC-EG-17 回退口径） */
  const saveProgress = useCallback((tutorialId: number, progress: number) => {
    post<{ tutorialId: number; progress: number }>(`/api/histories/${tutorialId}`, { progress })
      .catch(() => post(`/api/histories/${tutorialId}`, { progress }))
      .catch(() => undefined)
  }, [])

  const flushProgress = useCallback(
    (pct: number) => {
      if (!isLoggedIn || !detail || pct === lastSentPctRef.current) return
      lastSentPctRef.current = pct
      saveProgress(detail.id, pct)
    },
    [isLoggedIn, detail, saveProgress],
  )

  /** 滚动入口：仅记最新值并开 3s 尾随定时器（窗口内不重复开，到点发最新值） */
  const queueProgress = useCallback(
    (pct: number) => {
      if (!isLoggedIn) return
      pendingPctRef.current = pct
      if (flushTimerRef.current != null) return
      flushTimerRef.current = window.setTimeout(() => {
        flushTimerRef.current = null
        const pending = pendingPctRef.current
        pendingPctRef.current = null
        if (pending != null) flushProgress(pending)
      }, PROGRESS_FLUSH_MS)
    },
    [isLoggedIn, flushProgress],
  )

  /** 即时保存前清空待发队列：避免点击引发的轻微滚动把旧快照排到即时值之后覆盖（如勾选 75 后补发 54） */
  const cancelQueuedProgress = useCallback(() => {
    if (flushTimerRef.current != null) {
      window.clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
    pendingPctRef.current = null
  }, [])

  // 滚动深度实时计算 + 节流入队（与滚动口径取较大值：max(深度, 步骤完成率)）
  useEffect(() => {
    if (state.kind !== 'ok') return
    const onScroll = () => {
      const article = articleRef.current
      if (!article) return
      scrollPctRef.current = scrollDepthPct(article)
      queueProgress(Math.max(scrollPctRef.current, stepPctRef.current))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [state, queueProgress])

  // 卸载清节流定时器
  useEffect(
    () => () => {
      if (flushTimerRef.current != null) window.clearTimeout(flushTimerRef.current)
    },
    [],
  )

  // 目录高亮：IntersectionObserver 观察各节标题（rootMargin 预留吸顶 150px，UI-IXD-03）
  useEffect(() => {
    if (state.kind !== 'ok' || tocEntries.length === 0) return
    const targets = articleRef.current?.querySelectorAll<HTMLElement>('[data-sec]')
    if (!targets || targets.length === 0) return
    const inBand = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const secId = (entry.target as HTMLElement).dataset.sec
          if (!secId) return
          if (entry.isIntersecting) inBand.add(secId)
          else inBand.delete(secId)
        })
        // 当前小节 = 目录顺序中最后一个进入「标题带」的节
        for (let i = tocEntries.length - 1; i >= 0; i -= 1) {
          if (inBand.has(tocEntries[i].id)) {
            setActiveSecId(tocEntries[i].id)
            return
          }
        }
        // 带内无命中（长节滚过阅读线/页面顶部）：回退取标题顶最后越过阅读线的节，均未越过回首项
        let fallback = tocEntries[0]?.id ?? ''
        tocEntries.forEach((entryItem) => {
          const el = document.getElementById(entryItem.id)
          if (el && el.getBoundingClientRect().top < STICKY_OFFSET_PX) fallback = entryItem.id
        })
        setActiveSecId(fallback)
      },
      { rootMargin: `${-STICKY_OFFSET_PX}px 0px -55% 0px`, threshold: 0 },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [state, tocEntries])

  // ── 交互处理 ──
  const applyFs = (level: number) => {
    setFsLevel(level)
    localStorage.setItem(FS_STORAGE_KEY, String(level))
  }

  /** 步骤勾选：更新 done 态与进度条，并即时保存一次（不受 3s 节流约束，交互 5） */
  const toggleStep = (secId: string) => {
    const next = new Set(doneSteps)
    if (next.has(secId)) next.delete(secId)
    else next.add(secId)
    setDoneSteps(next)
    const pct = totalSteps === 0 ? 0 : Math.round((next.size / totalSteps) * 100)
    stepPctRef.current = pct
    cancelQueuedProgress()
    flushProgress(Math.max(scrollPctRef.current, pct))
  }

  const scrollToSec = (secId: string) => {
    document.getElementById(secId)?.scrollIntoView({ behavior: 'smooth' })
  }

  /** 继续阅读定位：按进度百分比滚动到正文对应位置（交互 6） */
  const resumeFrom = (pct: number) => {
    const article = articleRef.current
    if (!article) return
    const top =
      article.getBoundingClientRect().top + window.scrollY + (article.offsetHeight * pct) / 100 - STICKY_OFFSET_PX
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }

  const startVideo = () => {
    setVideoStarted(true)
    // 外链失效在加载/播放时经 onError 走占位（AC-EG-02）
    videoRef.current?.play().catch(() => undefined)
  }

  // ── 派生展示值 ──
  const myProgress = detail?.myProgress ?? null
  const showResume = !resumeClosed && myProgress != null && myProgress > 0 && myProgress < 100
  const resumeDoneCount =
    myProgress != null && totalSteps > 0 ? Math.min(totalSteps, Math.floor((myProgress / 100) * totalSteps)) : 0
  const resumeNextTitle = resumeDoneCount < totalSteps ? stepSections[resumeDoneCount]?.title : null
  const stepPct = totalSteps === 0 ? 0 : Math.round((doneSteps.size / totalSteps) * 100)
  const articleStyle = { '--fs-article': FS_LEVELS[fsLevel - 1].px } as CSSProperties

  // ── 分支渲染 ──
  if (state.kind === 'loading') {
    return (
      <div className="dt-skel" data-testid="detail-skeleton">
        <div className="dt-sk crumb" />
        <div className="dt-sk title" />
        <div className="dt-sk bar" />
        <div className="dt-skel-cols">
          <div className="dt-sk article" />
          <div className="dt-skel-side">
            <div className="dt-sk side" />
            <div className="dt-sk side" />
          </div>
        </div>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="dt-empty" data-testid="detail-error">
        <div className="eic">⚠️</div>
        <b>详情加载失败</b>
        <span>网络异常或服务暂不可用，请重试</span>
        <button
          type="button"
          className="btn btn-p"
          data-testid="detail-retry-btn"
          onClick={() => setRetryNonce((n) => n + 1)}
        >
          重试
        </button>
      </div>
    )
  }

  if (state.kind === 'invisible') {
    return (
      <div className="dt-empty" data-testid="detail-invisible">
        <div className="eic">📭</div>
        <b>该教程不存在或暂不可见</b>
      </div>
    )
  }

  if (state.kind === 'offline') {
    return (
      <>
        <div className="dt-off-banner" data-testid="detail-offline-banner">
          <span className="ic" aria-hidden>
            ⛔
          </span>
          <div>
            <b>该教程已下架，正文不可见。</b>
            <br />
            可能原因：内容过时或版本调整，可从下方同类推荐继续学习。
          </div>
          <div className="ops">
            <Link className="btn btn-g" to="/list" data-testid="offline-browse-more">
              浏览更多
            </Link>
          </div>
        </div>
        {state.related.length > 0 ? (
          <div className="dt-off-rel" data-testid="offline-related">
            {state.related.map((r) => (
              <Link key={r.id} to={`/detail/${r.id}`} data-testid={`offline-related-${r.id}`}>
                <b>{r.title}</b>
                <span>
                  👁 {fmtNum(r.viewCount)} · 同类推荐
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="dt-off-empty">
            暂无同类推荐
            <Link className="btn btn-g" to="/list" data-testid="offline-browse-more-empty">
              浏览更多
            </Link>
          </div>
        )}
      </>
    )
  }

  const { data } = state
  // 标题区/信息卡收藏数：互动区操作后实时联动（UI-IXD-06）
  const favCount = favCountOverride ?? data.favCount

  return (
    <>
      {/* 面包屑：分类可点回列表同分类筛选 */}
      <nav className="dt-crumb" data-testid="detail-crumb">
        <Link to="/" data-testid="crumb-home-link">
          教程中心
        </Link>{' '}
        /{' '}
        <Link to={`/list?categoryId=${data.categoryId}`} data-testid="crumb-category-link">
          {data.categoryName}
        </Link>{' '}
        / <b>{data.title}</b>
      </nav>

      {/* 标题区 */}
      <div className="dt-title-box">
        <h1 data-testid="detail-title">{data.title}</h1>
        <div className="dt-title-meta" data-testid="detail-meta">
          <span>👤 {data.authorName ?? '—'}</span>
          <span>🕒 更新于 {data.updatedAt.slice(0, 10)}</span>
          <span>👁 浏览 {fmtNum(data.viewCount)}</span>
          <span>
            ★ 收藏 <span data-testid="detail-fav-count">{fmtNum(favCount)}</span>
          </span>
          <span>
            {data.tags.map((tag) => (
              <span className="tag" key={tag}>
                #{tag}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* 工具条：字号三档 + 上下篇 */}
      <div className="dt-toolbar card">
        <span className="lbl">字号</span>
        {FS_LEVELS.map((f) => (
          <button
            type="button"
            key={f.level}
            className={`dt-fs${fsLevel === f.level ? ' on' : ''}`}
            data-testid={f.testid}
            aria-pressed={fsLevel === f.level}
            onClick={() => applyFs(f.level)}
          >
            {f.label}
          </button>
        ))}
        <span className="sp" />
        <button
          type="button"
          className="btn btn-g"
          data-testid="detail-prev-btn"
          disabled={!data.prev}
          title={data.prev?.title ?? '无上一篇'}
          onClick={() => data.prev && navigate(`/detail/${data.prev?.id}`)}
        >
          ← 上一篇
        </button>
        <button
          type="button"
          className="btn btn-g"
          data-testid="detail-next-btn"
          disabled={!data.next}
          title={data.next?.title ?? '无下一篇'}
          onClick={() => data.next && navigate(`/detail/${data.next?.id}`)}
        >
          下一篇 →
        </button>
      </div>

      <div className="dt-layout">
        {/* 左栏：图文正文 */}
        <div className="dt-article-col">
          <div className="dt-article card" ref={articleRef} style={articleStyle} data-testid="detail-article">
            {/* 继续阅读横幅（AC-FN-04 / UI-IXD-11） */}
            {showResume && (
              <div
                className="dt-resume"
                data-testid="resume-banner"
                role="button"
                tabIndex={0}
                title="定位到上次阅读位置"
                onClick={() => resumeFrom(myProgress ?? 0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') resumeFrom(myProgress ?? 0)
                }}
              >
                📌 继续上次阅读：已完成 {resumeDoneCount}/{totalSteps} 步（{myProgress}%）
                {resumeNextTitle ? `，建议从「${resumeNextTitle}」继续` : ''}
                <span
                  className="x"
                  role="button"
                  tabIndex={0}
                  aria-label="关闭继续阅读提示"
                  data-testid="resume-close-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setResumeClosed(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation()
                      setResumeClosed(true)
                    }
                  }}
                >
                  ✕
                </span>
              </div>
            )}

            {/* 导语：摘要作为正文引言段（对齐设计稿首段） */}
            <p className="dt-lead">{data.summary}</p>

            {/* 首个 h2/h3 前的散段兜底 */}
            {parsed?.leadHtml && <div dangerouslySetInnerHTML={{ __html: parsed.leadHtml }} />}

            {/* 视频区：preload=none 不自动播放；失效占位（AC-EG-02 / UI-ELEM-06） */}
            {data.videoUrl && (
              <section data-sec={VIDEO_SEC_ID} id={VIDEO_SEC_ID}>
                <h3 className="dt-sec-h">📺 视频演示</h3>
                {videoFailed ? (
                  <div className="dt-video-fallback" data-testid="video-fallback">
                    <b>📼 视频暂不可用</b>
                    <span>视频暂不可用，可先阅读图文步骤</span>
                  </div>
                ) : (
                  <div className="dt-video">
                    <span className="vt">视频外链 · mp4 直链</span>
                    <video
                      ref={videoRef}
                      controls
                      preload="none"
                      src={data.videoUrl}
                      data-testid="video-element"
                      onError={() => setVideoFailed(true)}
                      onPlay={() => setVideoStarted(true)}
                    />
                    {!videoStarted && (
                      <button
                        type="button"
                        className="play"
                        data-testid="video-play-btn"
                        aria-label="播放视频"
                        onClick={startVideo}
                      >
                        ▶
                      </button>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* 正文小节：步骤块（圆点勾选）/ 注意事项块 */}
            {parsed?.sections.map((sec) => {
              if (!sec.isStep) {
                return (
                  <div className="dt-note" id={sec.id} data-sec={sec.id} key={sec.id}>
                    <b>⚠️ {sec.title}</b>
                    <div dangerouslySetInnerHTML={{ __html: sec.bodyHtml }} />
                  </div>
                )
              }
              const stepNo = stepSections.findIndex((s) => s.id === sec.id) + 1
              const done = doneSteps.has(sec.id)
              return (
                <div className={`dt-step${done ? ' done' : ''}`} id={sec.id} data-sec={sec.id} key={sec.id}>
                  <button
                    type="button"
                    className="dt-no"
                    data-testid={`step-dot-${stepNo}`}
                    aria-pressed={done}
                    aria-label={`勾选完成${sec.title}`}
                    title={done ? '取消完成' : '标记完成'}
                    onClick={() => toggleStep(sec.id)}
                  >
                    {done ? '✓' : stepNo}
                  </button>
                  <div className="dt-step-body">
                    <h3>{sec.title}</h3>
                    <div dangerouslySetInnerHTML={{ __html: sec.bodyHtml }} />
                  </div>
                </div>
              )
            })}

            {/* 步骤进度条 */}
            {totalSteps > 0 && (
              <div className="dt-prog-box" data-testid="detail-progress">
                <div className="dt-prog-h">
                  <span>学习进度（点击步骤圆点可勾选完成，进度自动保存）</span>
                  <b data-testid="detail-progress-text">
                    {doneSteps.size}/{totalSteps} 步已完成 · {stepPct}%
                  </b>
                </div>
                <div className="dt-prog">
                  <i data-testid="detail-progress-bar" style={{ width: `${stepPct}%` }} />
                </div>
              </div>
            )}

            {/* FE-03 互动区：评价二选一互斥 + 留言条件展开 + 分享/收藏/返回列表 */}
            <DetailInteraction data={data} onFavCount={setFavCountOverride} />
          </div>

          {/* 正文底部关联推荐：同分类 4 篇排除本篇（UI-IXD-16）；不足 4 篇渲染实际数量，空则整区隐藏 */}
          {data.related.length > 0 && (
            <div className="dt-rel-btm card" data-testid="related-bottom">
              <h3>🧩 相关教程</h3>
              <div className="dt-rel-btm-grid">
                {data.related.map((r) => (
                  <Link key={r.id} to={`/detail/${r.id}`} data-testid={`related-bottom-card-${r.id}`}>
                    <b>{r.title}</b>
                    <span>
                      👁 {fmtNum(r.viewCount)} · {data.categoryName}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右栏：目录 / 信息卡 / 关联推荐 */}
        <aside className="dt-side">
          {tocEntries.length > 0 && (
            <nav className="dt-toc card" data-testid="detail-toc">
              <h3>📖 本页目录</h3>
              {tocEntries.map((entry, i) => (
                <button
                  type="button"
                  key={entry.id}
                  className={activeSecId === entry.id ? 'on' : ''}
                  data-testid={`toc-item-${i}`}
                  onClick={() => scrollToSec(entry.id)}
                >
                  {entry.title}
                </button>
              ))}
            </nav>
          )}

          <div className="dt-info card" data-testid="detail-info">
            <h3>📄 教程信息</h3>
            <div className="row">
              <span>分类</span>
              <b>{data.categoryName}</b>
            </div>
            <div className="row">
              <span>标签</span>
              <b>{data.tags.length > 0 ? data.tags.map((t) => `#${t}`).join(' ') : '—'}</b>
            </div>
            <div className="row">
              <span>浏览量</span>
              <b>{fmtNum(data.viewCount)}</b>
            </div>
            <div className="row">
              <span>收藏量</span>
              <b>{fmtNum(favCount)}</b>
            </div>
            <div className="row">
              <span>作者</span>
              <b>{data.authorName ?? '—'}</b>
            </div>
            <div className="row">
              <span>更新时间</span>
              <b>{data.updatedAt.slice(0, 10)}</b>
            </div>
          </div>

          {data.related.length > 0 && (
            <div className="dt-rel card" data-testid="related-panel">
              <h3>🧩 相关教程</h3>
              {data.related.map((r) => (
                <Link key={r.id} to={`/detail/${r.id}`} data-testid={`related-card-${r.id}`}>
                  <b>{r.title}</b>
                  <span>
                    👁 {fmtNum(r.viewCount)} · {data.categoryName}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
