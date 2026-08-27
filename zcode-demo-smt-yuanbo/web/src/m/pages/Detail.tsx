import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, del, get, getToken, post } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import { fmtNum } from '../../shared/format'
import { sanitizeRichText } from '../../shared/sanitize'
import type {
  DetailNotVisibleData,
  FavoriteResult,
  FeedbackResult,
  HistoryResult,
  RelatedItem,
  TutorialDetail,
} from '../../shared/types'
import FontSizePanel, { readFontSize } from '../components/FontSizePanel'
import PhoneShell from '../components/PhoneShell'
import { useRoleSheet } from '../components/RoleSheet'
import TabBar from '../components/TabBar'

/** 滚动保存：滚动停止后防抖窗口与两次保存最小间隔（交互 2「间隔 ≥2s 或滚动停止」） */
const PROGRESS_DEBOUNCE_MS = 800
const PROGRESS_MIN_INTERVAL_MS = 2000
/** 保存失败静默重试一次；仍失败不弹窗、进度回退最近成功值（AC-EG-17 同规则） */
const PROGRESS_RETRY_MS = 1000
/** 留言上限（AC-RULE-20：选填 ≤200 字） */
const COMMENT_MAX = 200

/** 详情页四态：加载骨架 / 网络失败可重试 / 404 提示页（AC-EG-10）/ 正常 */
type NotVisibleState = { reason: 'offline' | 'invisible'; related: RelatedItem[] }
type DetailState =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'notVisible'; data: NotVisibleState }
  | { phase: 'ok'; detail: TutorialDetail }

/** 404 负载防御性归位：reason 仅 offline/invisible，related 非数组按空集处理 */
function parseNotVisible(data: unknown): NotVisibleState {
  const payload = (data ?? {}) as Partial<DetailNotVisibleData>
  const related = Array.isArray(payload.related) ? (payload.related as RelatedItem[]) : []
  return { reason: payload.reason === 'offline' ? 'offline' : 'invisible', related }
}

/** 视频时长角标 mm:ss；Infinity/NaN（直播流等）不显示 */
function fmtDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * m 详情页 #/detail/:id（ui_m_detail.html，FE-04）：
 * 快照正文 sanitize 白名单渲染（AC-NF-04）+ 字号三档（AC-RULE-21）+ 进度续读跨端同步
 * （AC-RULE-11 / AC-FN-04 / UI-IXD-11）+ 评价收藏与 PC 共用记录（AC-FN-25 / AC-FN-03）
 * + 已下架提示页（AC-FN-20 / AC-EG-10）+ 视频不自动播放与失效占位（AC-EG-02）。
 */
export default function Detail() {
  const { id } = useParams()
  const tutorialId = Number(id)
  const validId = Number.isInteger(tutorialId) && tutorialId > 0
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openRoleSheet } = useRoleSheet()

  const [state, setState] = useState<DetailState>({ phase: 'loading' })
  const [reloadTick, setReloadTick] = useState(0)
  const [fontSize, setFontSize] = useState(readFontSize)
  const [toast, setToast] = useState<string | null>(null)
  // 互动局部状态：进入时从详情派生，收藏/评价操作后局部更新（刷新与 PC 同源一致）
  const [favCount, setFavCount] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [feedback, setFeedback] = useState<number | null>(null)
  const [helpfulYes, setHelpfulYes] = useState(0)
  const [helpfulNo, setHelpfulNo] = useState(0)
  const [commentOpen, setCommentOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [progress, setProgress] = useState(0)
  const [busyFav, setBusyFav] = useState(false)
  const [busyVote, setBusyVote] = useState(false)
  const [videoState, setVideoState] = useState<'idle' | 'playing' | 'error'>('idle')
  const [videoDur, setVideoDur] = useState('')

  const articleRef = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef(0)
  /** 最近一次成功保存的进度（失败回退口径，不归零） */
  const lastSavedRef = useRef(0)
  /** 滚动实时百分比（离开页面兜底 flush 用；游客/未变化不发送） */
  const pendingPctRef = useRef<number | null>(null)
  const userRef = useRef(user)
  userRef.current = user
  /** 已展示的教程 id：同 id 登录态变化走静默刷新（不闪骨架、不丢滚动位置） */
  const shownIdRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)
  /** 登录回放引用：RoleSheet 登录成功后调用最新闭包（fresh user 态）补发被拦截操作 */
  const favReplayRef = useRef<() => void>(async () => {})
  const voteReplayRef = useRef<(helpful: 1 | 0) => void>(async () => {})

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2000)
  }, [])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  /** 详情落地：互动镜像状态整体对齐（换篇/登录态变化/重试共用） */
  const applyDetail = useCallback((detail: TutorialDetail) => {
    setState({ phase: 'ok', detail })
    setFavCount(detail.favCount ?? 0)
    setFavorited(detail.myFavorite === true)
    setFeedback(detail.myFeedback)
    setHelpfulYes(detail.helpfulYes ?? 0)
    setHelpfulNo(detail.helpfulNo ?? 0)
    setCommentOpen(false)
    setComment('')
    setProgress(detail.myProgress ?? 0)
    setVideoState('idle')
    setVideoDur('')
    lastSavedRef.current = detail.myProgress ?? 0
  }, [])

  // 取数：进入/换篇骨架屏重取；登录态变化（含 RoleSheet 回放）静默刷新 my* 个性化字段
  useEffect(() => {
    if (!validId) {
      setState({ phase: 'notVisible', data: { reason: 'invisible', related: [] } })
      return
    }
    const requestId = ++requestIdRef.current
    const silent = shownIdRef.current === tutorialId
    if (!silent) {
      setState({ phase: 'loading' })
      shownIdRef.current = tutorialId
    }
    get<TutorialDetail>(`/api/tutorials/${tutorialId}`)
      .then((detail) => {
        if (requestIdRef.current !== requestId) return
        applyDetail(detail)
        if (!silent) articleRef.current?.closest('.scroll')?.scrollTo(0, 0)
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return
        if (err instanceof ApiError && err.code === 404) {
          setState({ phase: 'notVisible', data: parseNotVisible(err.data) })
        } else {
          setState({ phase: 'error' })
        }
      })
  }, [tutorialId, validId, user?.id, reloadTick, applyDetail])

  const sanitized = useMemo(
    () => sanitizeRichText(state.phase === 'ok' ? state.detail.content : ''),
    [state.phase === 'ok' ? state.detail.content : ''],
  )

  /** 进度保存：成功更新镜像与 lastSaved；失败静默重试一次（401 不重试），仍失败保留旧值 */
  const saveProgress = useCallback(
    async (pct: number, retry = true): Promise<void> => {
      try {
        await post<HistoryResult>(`/api/histories/${tutorialId}`, { progress: pct })
        lastSavedRef.current = pct
        setProgress(pct)
      } catch (err) {
        const unrecoverable = err instanceof ApiError && err.code === 401
        if (retry && !unrecoverable) {
          await new Promise((resolve) => setTimeout(resolve, PROGRESS_RETRY_MS))
          await saveProgress(pct, false)
        }
        // 仍失败/未登录：静默不弹窗，进度不归零（AC-EG-17）
      }
    },
    [tutorialId],
  )

  // 滚动 → 防抖保存（AC-RULE-11 单值覆盖）：挂到手机壳滚动容器；离开页面兜底 flush
  const okId = state.phase === 'ok' ? state.detail.id : null
  useEffect(() => {
    const scroller = articleRef.current?.closest<HTMLElement>('.scroll')
    if (!scroller || okId === null) return
    let timer = 0
    let lastSentAt = 0
    const computePct = () => {
      const denom = scroller.scrollHeight - scroller.clientHeight
      // 内容不足一屏（无可滚动）视为已完整阅读
      return denom <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((scroller.scrollTop / denom) * 100)))
    }
    const flush = () => {
      const pct = computePct()
      pendingPctRef.current = pct
      if (!userRef.current || pct === lastSavedRef.current) return
      if (Date.now() - lastSentAt < PROGRESS_MIN_INTERVAL_MS) {
        timer = window.setTimeout(flush, PROGRESS_MIN_INTERVAL_MS)
        return
      }
      lastSentAt = Date.now()
      void saveProgress(pct)
    }
    const onScroll = () => {
      pendingPctRef.current = computePct()
      window.clearTimeout(timer)
      timer = window.setTimeout(flush, PROGRESS_DEBOUNCE_MS)
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
      // 兜底：离开详情时保存未落库的最终进度（AC-FN-04「滚动到 60% 后离开」）
      const pct = pendingPctRef.current
      if (userRef.current && pct !== null && pct !== lastSavedRef.current) void saveProgress(pct)
    }
  }, [okId, saveProgress])

  /** 续读定位：平滑滚到已保存进度位置（UI-IXD-11） */
  const resumeRead = () => {
    const scroller = articleRef.current?.closest<HTMLElement>('.scroll')
    if (!scroller) return
    const denom = scroller.scrollHeight - scroller.clientHeight
    scroller.scrollTo({ top: (progress / 100) * denom, behavior: 'smooth' })
  }

  /** 收藏切换：未登录先弹 RoleSheet，登录后回原位补发（AC-FN-03）。
   * 登录态读 getToken() 而非 render 闭包的 user——RoleSheet 回放同步执行时
   * React 尚未重渲染，闭包 user 仍为 null 会把回放操作再次拦截 */
  const toggleFavorite = useCallback(async () => {
    if (!getToken()) {
      openRoleSheet(() => void favReplayRef.current())
      return
    }
    if (busyFav) return
    setBusyFav(true)
    try {
      const result = favorited
        ? await del<FavoriteResult>(`/api/favorites/${tutorialId}`)
        : await post<FavoriteResult>(`/api/favorites/${tutorialId}`)
      setFavorited(result.favorited)
      setFavCount(result.favCount)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '操作失败，请重试')
    } finally {
      setBusyFav(false)
    }
  }, [favorited, busyFav, tutorialId, openRoleSheet, showToast])
  favReplayRef.current = () => void toggleFavorite()

  /** 评价 upsert：与 PC 共用同一条记录（AC-FN-25 / AC-RULE-15），返回是否成功。
   * 登录态同上读 getToken()（回放闭包时序） */
  const castVote = useCallback(
    async (helpful: 1 | 0, withComment?: string): Promise<boolean> => {
      if (!getToken()) {
        openRoleSheet(() => void voteReplayRef.current(helpful))
        return false
      }
      if (busyVote) return false
      setBusyVote(true)
      try {
        const result = await post<FeedbackResult>(`/api/feedbacks/${tutorialId}`, {
          helpful,
          ...(withComment !== undefined ? { comment: withComment } : {}),
        })
        setFeedback(result.helpful)
        setHelpfulYes(result.helpfulYes)
        setHelpfulNo(result.helpfulNo)
        return true
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : '评价失败，请重试')
        return false
      } finally {
        setBusyVote(false)
      }
    },
    [busyVote, tutorialId, openRoleSheet, showToast],
  )
  voteReplayRef.current = (helpful) => void castVote(helpful)

  /** 评价按钮：二选一互斥切换（UI-IXD-07）；同值重复点击不重发仅保持 UI 态 */
  const onVote = (helpful: 1 | 0) => {
    if (helpful === 1) {
      setCommentOpen(false)
      if (feedback !== 1) void castVote(1)
      return
    }
    setCommentOpen(true)
    if (feedback !== 0) void castVote(0)
  }

  /** 留言提交：仅「没帮助」时可见（UI-IXD-08），提交后收起并提示（仅后台可见） */
  const submitComment = async () => {
    const text = comment.trim().slice(0, COMMENT_MAX)
    if (!text) {
      setCommentOpen(false)
      return
    }
    const done = await castVote(0, text)
    if (done) {
      setCommentOpen(false)
      setComment('')
      showToast('留言已提交（仅平台可见），与 PC 端共用同一记录')
    }
  }

  // 留言框展开即聚焦（ui_m_detail.html focus 行为）
  useEffect(() => {
    if (commentOpen) commentInputRef.current?.focus()
  }, [commentOpen])

  /** 直达（扫码/外链进入无历史）时返回首页，避免 navigate(-1) 退出应用 */
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (idx !== undefined && idx > 0) navigate(-1)
    else navigate('/')
  }

  const retry = () => {
    shownIdRef.current = null
    setState({ phase: 'loading' })
    setReloadTick((tick) => tick + 1)
  }

  const navTitle =
    state.phase === 'ok' ? state.detail.title : state.phase === 'notVisible' ? '教程详情' : ''
  const canInteract = state.phase === 'ok'
  const totalVotes = helpfulYes + helpfulNo
  const helpfulRate = totalVotes > 0 ? `，好评 ${Math.round((helpfulYes / totalVotes) * 100)}%` : ''

  return (
    <PhoneShell
      tabBar={<TabBar />}
      header={
        <header>
          <div className="nav">
            <button type="button" className="back" data-testid="back-btn" onClick={goBack}>
              ‹
            </button>
            <span className="nav-title" data-testid="detail-nav-title">
              {navTitle}
            </span>
            {canInteract && (
              <button
                type="button"
                className={`fav${favorited ? ' on' : ''}`}
                data-testid="fav-btn"
                onClick={() => void toggleFavorite()}
                disabled={busyFav}
              >
                <svg
                  width="20"
                  height="18"
                  viewBox="0 0 24 22"
                  fill={favorited ? '#f97316' : 'none'}
                  stroke={favorited ? 'none' : '#94a3b8'}
                  strokeWidth="2"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>{favorited ? '已收藏' : '收藏'}</span>
              </button>
            )}
          </div>
          {/* 续读条（UI-IXD-11）：有进度且未读满时显示，读满 100% 消失 */}
          {canInteract && progress > 0 && progress < 100 && (
            <div className="resume" data-testid="resume-bar">
              <span className="txt">⏱ 上次读到 {progress}%</span>
              <span className="bar">
                <i style={{ width: `${progress}%` }} />
              </span>
              <button type="button" className="pct" data-testid="resume-continue-btn" onClick={resumeRead}>
                继续阅读 ›
              </button>
            </div>
          )}
        </header>
      }
      footer={
        <>
          {/* 已下架态操作条禁用（交互 7），正常态可评价（AC-FN-25） */}
          <div className="helpbar">
            <div className="votes">
              <button
                type="button"
                className={`vote${feedback === 1 ? ' on' : ''}`}
                data-testid="vote-yes-btn"
                disabled={!canInteract || busyVote}
                onClick={() => onVote(1)}
              >
                👍 有帮助 {fmtNum(helpfulYes)}
              </button>
              <button
                type="button"
                className={`vote${feedback === 0 ? ' on' : ''}`}
                data-testid="vote-no-btn"
                disabled={!canInteract || busyVote}
                onClick={() => onVote(0)}
              >
                👎 没帮助 {fmtNum(helpfulNo)}
              </button>
            </div>
            <div className={`cmt${commentOpen ? ' show' : ''}`}>
              <input
                ref={commentInputRef}
                type="text"
                data-testid="comment-input"
                maxLength={COMMENT_MAX}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="告诉我们哪里没帮助（选填，≤200 字）"
              />
              <button type="button" data-testid="comment-submit-btn" onClick={() => void submitComment()}>
                提交
              </button>
            </div>
            <div className="help-note" data-testid="help-note">
              评价与留言同 PC 端共用同一记录（当前 👍{fmtNum(helpfulYes)} / 👎{fmtNum(helpfulNo)}
              {helpfulRate}）· 进度已与 PC 端同步
            </div>
          </div>
          {/* 字号浮层锚定 .screen，随 footer 挂载在 .screen 内 */}
          {canInteract && <FontSizePanel value={fontSize} onChange={setFontSize} />}
        </>
      }
    >
      {state.phase === 'loading' && (
        <div className="d-skel" data-testid="detail-skeleton">
          <div className="sk-line w40" />
          <div className="sk-line w90 sk-lg" />
          <div className="sk-line w60" />
          <div className="sk-line w90" />
          <div className="sk-line w90" />
          <div className="sk-line w60" />
          <div className="sk-line w90" />
        </div>
      )}

      {state.phase === 'error' && (
        <div className="load-error" data-testid="load-error">
          加载失败，请稍后重试
          <button type="button" data-testid="load-retry-btn" onClick={retry}>
            重试
          </button>
        </div>
      )}

      {state.phase === 'notVisible' && (
        <div className="off-pre" data-testid="offline-banner">
          <div className="bn">
            <span className="bn-ico">⛔</span>
            <span>
              <b>
                {state.data.reason === 'offline'
                  ? '该教程已下架，正文不可见。'
                  : '该教程不存在或暂不可见。'}
              </b>
              {state.data.related.length > 0 && '可从下方同类推荐继续学习。'}
            </span>
          </div>
          {state.data.reason === 'offline' && <div className="bd">正文内容已隐藏……</div>}
          {state.data.related.length > 0 && (
            <div className="rl">
              {state.data.related.map((item) => (
                <Link key={item.id} to={`/detail/${item.id}`} data-testid={`related-item-${item.id}`}>
                  <b>{item.title}</b>
                  <span>👁 {fmtNum(item.viewCount ?? 0)} · 同类推荐</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {state.phase === 'ok' && (
        <article
          className="article"
          ref={articleRef}
          data-testid="detail-article"
          style={{ '--mfs': `${fontSize}px` } as CSSProperties}
        >
          <div className="a-top">
            <span className="a-cat">{state.detail.categoryName}</span>
            {state.detail.tags.map((tag) => (
              <span className="a-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <h1 className="a-title" data-testid="detail-title">
            {state.detail.title}
          </h1>
          <div className="a-meta" data-testid="detail-meta">
            <span>👁 浏览 {fmtNum(state.detail.viewCount)}</span>
            <span>⭐ 收藏 {fmtNum(favCount)}</span>
            <span>✍ {state.detail.authorName || '运营编辑'}</span>
            <span>更新于 {state.detail.updatedAt.slice(5, 10)}</span>
          </div>
          <p className="a-intro">{state.detail.summary}</p>

          {/* 快照正文：白名单 sanitize 后渲染（AC-NF-04），字号仅本区域随三档变化 */}
          <div
            className="rich"
            data-testid="rich-content"
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />

          {/* 视频区：不自动播放（tech-design §8）；失效占位不阻断图文（AC-EG-02） */}
          {state.detail.videoUrl && (
            <div className="v-wrap" data-testid="video-area">
              <div className="video">
                {videoState === 'playing' ? (
                  <video
                    data-testid="video-player"
                    src={state.detail.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    preload="none"
                    onError={() => setVideoState('error')}
                    onLoadedMetadata={(e) => setVideoDur(fmtDuration(e.currentTarget.duration))}
                  />
                ) : videoState === 'error' ? (
                  <div className="v-err" data-testid="video-fallback">
                    ⚠️ 视频暂不可用
                    <br />
                    可先阅读图文步骤
                  </div>
                ) : (
                  <button
                    type="button"
                    className="play"
                    data-testid="video-play-btn"
                    onClick={() => setVideoState('playing')}
                  >
                    ▶
                  </button>
                )}
                {videoDur && videoState !== 'error' && <span className="v-dur">{videoDur}</span>}
              </div>
              <div className="v-cap">视频：{state.detail.title} · 弱网环境仅提示流量，不自动播放</div>
            </div>
          )}
        </article>
      )}

      {toast && (
        <div className="mtoast" data-testid="m-toast">
          {toast}
        </div>
      )}
    </PhoneShell>
  )
}
