import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, get, post } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import { fmtTime } from '../../shared/format'
import { sanitizeRichText } from '../../shared/sanitize'
import type { AdminTutorial, Category, Page, ReviewResult, TutorialDetail } from '../../shared/types'
import CategorySelect from '../components/CategorySelect'
import { REVIEW_CHANGED_EVENT } from '../components/Sidebar'
import { ToastHost, useToasts } from '../components/Toast'

/**
 * 审核队列（FE-05）：双 Tab（人工审核带待审数角标 / AI 生成 mock 不可操作）；
 * 待审卡片按提交时间倒序排列（updatedAt DESC），v2+ 回审标识（UI-ELEM-09）；
 * 通过（防抖 AC-EG-19）/ 驳回（原因 ≥5 字前端阻断 + 后端 400 双重校验，AC-FN-09/AC-RULE-19）；
 * 409 并发互斥 toast + 刷新队列（AC-EG-04）；operator 直达渲染 403 提示（AC-FN-18，CHANGE-9）。
 * 复刻源：docs/ui/ui_admin_review.html；列表无 content 列，卡片正文按 GET /:id?all=1 取当前编辑值（CHANGE-10）。
 */

const PAGE_SIZE = 20
const REJECT_MIN = 5
const REJECT_MAX = 200
const MIN_TIP_SHORT = '原因必填，不少于 5 个字'
const MIN_TIP_OK = '已满足最少 5 字要求'
const REJECT_DONE_TEXT = '已驳回：教程回到草稿状态，原因已写入编辑页顶部告警条'

/** AI 生成 Tab 唯一 mock 卡（UI-ELEM-08：本期内仅展示不可操作，v1.1+ 开放） */
const AI_MOCK = {
  cate: '库存管理',
  source: 'AI 自动生成 · 2026-08-16 03:00',
  title: '库位三级管理操作指南',
  sum: 'AI 根据操作日志与功能文档自动生成的草稿：仓库/库区/库位三级建模步骤、批量导入模板与扫码找料入口说明。',
  steps: ['新建仓库档案', '划分库区', '生成库位编码', '绑定物料默认库位'],
  note: '🤖 AI 自动生成教程（预留）：本期内仅展示不可操作。AI 生成内容需先经人工事实校验后才能进入审核流，开放时间见版本规划（v1.1+）。',
} as const

// ── 正文按步骤标题拆分（卡片缩略预览与全文弹窗共用）──────────────────────────

interface ParsedContent {
  /** 首个步骤标题前的导语 HTML（可为空） */
  lead: string
  steps: Array<{ title: string; html: string }>
}

const STEP_NO_PREFIX_RE = /^第\s*\d+\s*步\s*[·:：\-—]?\s*/

/** h2=编辑器"步骤标题"工具产出，h3=种子正文步骤标题；净化后按标题切块，标题剥"第 N 步 ·"前缀改用统一圆点序号 */
function parseContent(rawContent: string): ParsedContent {
  const html = sanitizeRichText(rawContent ?? '')
  if (!html.trim()) return { lead: '', steps: [] }
  const body = new DOMParser().parseFromString(html, 'text/html').body
  const leadParts: string[] = []
  const steps: Array<{ title: string; parts: string[] }> = []
  Array.from(body.children).forEach((el) => {
    if (el.tagName === 'H2' || el.tagName === 'H3') {
      steps.push({ title: (el.textContent ?? '').trim().replace(STEP_NO_PREFIX_RE, ''), parts: [] })
      return
    }
    if (!el.outerHTML.trim()) return
    ;(steps.length > 0 ? steps[steps.length - 1].parts : leadParts).push(el.outerHTML)
  })
  return { lead: leadParts.join(''), steps: steps.map(({ title, parts }) => ({ title, html: parts.join('') })) }
}

// ── 子组件（模块级定义，避免父组件刷新导致弹窗输入丢焦点）────────────────────

/** 卡片动作后的结果行数据：approve 携带审核留痕时间，reject 为固定文案 */
type ReviewDone = { kind: 'approve'; at: string } | { kind: 'reject' }

/** 待审卡片：自取正文（步骤预览 + 全文弹窗数据源），meta 行含 v2 回审/首次提审标识（UI-ELEM-09） */
function ReviewCard({
  t,
  busy,
  done,
  onApprove,
  onOpenReject,
  onViewFull,
}: {
  t: AdminTutorial
  busy: boolean
  done?: ReviewDone
  onApprove: (t: AdminTutorial) => void
  onOpenReject: (t: AdminTutorial) => void
  onViewFull: (t: AdminTutorial, content: string) => void
}) {
  // 列表无 content 列，按卡片取管理口径详情（当前编辑值）；失败静默降级为无预览（CHANGE-10）
  const [content, setContent] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    get<TutorialDetail>(`/api/tutorials/${t.id}?all=1`)
      .then((d) => alive && setContent(d.content ?? ''))
      .catch(() => alive && setContent(''))
    return () => {
      alive = false
    }
  }, [t.id])

  const steps = useMemo(() => (content === null ? null : parseContent(content).steps), [content])
  const isReReview = t.submitCount >= 2 || t.hasOnlineVersion

  return (
    <div className={`review-card${done ? ' done' : ''}`} data-testid={`review-card-${t.id}`}>
      <div className="rc-meta">
        <span className="rc-cate">{t.categoryName}</span>
        <span>作者：{t.authorName}</span>
        <span>提交时间：{fmtTime(t.updatedAt)}</span>
        {isReReview ? (
          <span className="badge-v2">
            修改版 v{t.submitCount} · 回审
          </span>
        ) : (
          <span className="badge-first">首次提审</span>
        )}
        {t.hasOnlineVersion && <span>回审期间前台仍展示线上过审版本</span>}
      </div>
      <div className="rc-title">{t.title}</div>
      <div className="rc-sum">{t.summary}</div>
      <div className="steps-preview">
        <div className="steps-title">缩略步骤预览（正文按步骤标题拆分）</div>
        {steps === null ? (
          <div className="sk sk-line" />
        ) : steps.length === 0 ? (
          <div className="step-line no-step">（正文未按步骤标题组织）</div>
        ) : (
          <div className="step-line">
            {steps.map((s, i) => (
              <span className="step-item" key={i}>
                {i > 0 && <span className="arrow">›</span>}
                <span className="step-no">{i + 1}</span>
                {s.title}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="rc-actions">
        {done ? (
          done.kind === 'approve' ? (
            <span className="done-tip" data-testid={`review-${t.id}-done-tip`}>
              ✅ 已通过并发布 · 审核人 admin · {done.at ? fmtTime(done.at) : ''} · 前台即时可见
            </span>
          ) : (
            <span className="done-tip reject" data-testid={`review-${t.id}-done-tip`}>
              {REJECT_DONE_TEXT}
            </span>
          )
        ) : (
          <>
            <button
              type="button"
              className="btn btn-success"
              disabled={busy}
              onClick={() => onApprove(t)}
              data-testid={`review-${t.id}-approve-btn`}
            >
              {busy ? '处理中…' : '✅ 通过'}
            </button>
            <button
              type="button"
              className="btn btn-danger-outline"
              disabled={busy}
              onClick={() => onOpenReject(t)}
              data-testid={`review-${t.id}-reject-btn`}
            >
              ❳ 驳回
            </button>
            <button
              type="button"
              className="link-view"
              disabled={content === null}
              title={content === null ? '正文加载中…' : '查看待审核版本全文'}
              onClick={() => content !== null && onViewFull(t, content)}
              data-testid={`review-${t.id}-view-link`}
            >
              查看全文 →
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/** 驳回弹窗：≥5 字启用确认（AC-FN-09 前端阻断）；确认按钮 loading 至请求结束 */
function RejectModal({
  tutorial,
  busy,
  onCancel,
  onConfirm,
}: {
  tutorial: AdminTutorial
  busy: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const len = reason.trim().length
  const valid = len >= REJECT_MIN
  return (
    <div className="modal-mask show" data-testid="reject-modal">
      <div className="modal">
        <div className="modal-title">❳ 驳回教程</div>
        <div className="modal-target">驳回对象：《{tutorial.title}》</div>
        <textarea
          className="reject-textarea"
          maxLength={REJECT_MAX}
          value={reason}
          placeholder="请填写驳回原因，例如：第 X 步截图与新版界面不符，请替换后重新提交"
          onChange={(e) => setReason(e.target.value)}
          data-testid="reject-reason-input"
        />
        <div className="char-row">
          <span className={`min-tip${valid ? ' ok' : ''}`} data-testid="reject-min-tip">
            {valid ? MIN_TIP_OK : MIN_TIP_SHORT}
          </span>
          <span className="cnt" data-testid="reject-count">
            {len}/{REJECT_MAX}
          </span>
        </div>
        <div className="modal-hint">
          驳回原因将展示在作者的编辑页顶部（黄色告警条），教程回到
          <b>草稿</b>状态；若驳回的是已发布教程的回审版，仅编辑版回草稿，前台继续展示线上过审版本。
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onCancel} disabled={busy} data-testid="reject-cancel-btn">
            取消
          </button>
          <button
            type="button"
            className="btn btn-reject-confirm"
            disabled={!valid || busy}
            onClick={() => onConfirm(reason.trim())}
            data-testid="reject-confirm-btn"
          >
            {busy ? '提交中…' : '确认驳回'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** 查看全文弹窗（960×640 大弹窗）：按待审核版本当前编辑值渲染，仅预览不做审核动作 */
function FullModal({ tutorial, content, onClose }: { tutorial: AdminTutorial; content: string; onClose: () => void }) {
  const parsed = useMemo(() => parseContent(content), [content])
  const isEmpty = parsed.lead === '' && parsed.steps.length === 0
  let body: ReactNode
  if (isEmpty) {
    body = <div className="empty-tip">该教程正文为空</div>
  } else {
    body = (
      <>
        {parsed.lead && <div className="fs-lead" dangerouslySetInnerHTML={{ __html: parsed.lead }} />}
        {parsed.steps.map(
          (s, i) =>
            s.title && (
              <div className="fs-block" key={i}>
                <h4>
                  <span className="step-no">{i + 1}</span>
                  {s.title}
                </h4>
                <div className="fs-body" dangerouslySetInnerHTML={{ __html: s.html }} />
              </div>
            ),
        )}
      </>
    )
  }
  return (
    <div className="modal-mask show" data-testid="full-modal">
      <div className="modal modal-full">
        <div className="modal-title">
          📄 待审核版本全文预览 <span className="full-title">《{tutorial.title}》</span>
        </div>
        <div className="modal-scroll">
          {body}
          <div className="full-foot">以上为待审核版本渲染效果 · 审核通过后前台即时替换为该版本</div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose} data-testid="full-close-btn">
            关闭
          </button>
          <button type="button" className="btn btn-success" onClick={onClose} data-testid="full-preview-btn">
            仅预览，不做审核动作
          </button>
        </div>
      </div>
    </div>
  )
}

/** AI 生成 Tab mock 卡（按钮全禁用 + 说明条，UI-ELEM-08） */
function AiMockCard() {
  return (
    <div className="review-card ai" data-testid="ai-mock-card">
      <div className="rc-meta">
        <span className="rc-cate gray">{AI_MOCK.cate}</span>
        <span>来源：{AI_MOCK.source}</span>
        <span className="tag-yuliu">预留</span>
      </div>
      <div className="rc-title">
        {AI_MOCK.title}
        <span className="tag-ai">AI 生成</span>
      </div>
      <div className="rc-sum">{AI_MOCK.sum}</div>
      <div className="steps-preview dim">
        <div className="steps-title">缩略步骤预览（AI 草稿）</div>
        <div className="step-line">
          {AI_MOCK.steps.map((s, i) => (
            <span className="step-item" key={s}>
              {i > 0 && <span className="arrow">›</span>}
              <span className="step-no">{i + 1}</span>
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="rc-actions">
        <button type="button" className="btn" disabled data-testid="ai-approve-btn">
          ✅ 通过
        </button>
        <button type="button" className="btn" disabled data-testid="ai-reject-btn">
          ❳ 驳回
        </button>
        <span className="link-view disabled" data-testid="ai-view-link">
          查看全文 →
        </span>
      </div>
      <div className="ai-note">{AI_MOCK.note}</div>
    </div>
  )
}

// ── 页面 ────────────────────────────────────────────────────────────────────

export default function Review() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { toasts, push: toast } = useToasts()

  const [activeTab, setActiveTab] = useState<'human' | 'ai'>('human')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [reloadFlag, setReloadFlag] = useState(0)

  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<AdminTutorial[]>([])
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  /** 已出结果卡片（保留展示结果行，不随服务端状态即时消失）；每次列表重取后清空 */
  const [results, setResults] = useState<Map<number, ReviewDone>>(new Map())
  const [busyId, setBusyId] = useState<number | null>(null)
  const [rejectBusy, setRejectBusy] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<AdminTutorial | null>(null)
  const [fullState, setFullState] = useState<{ tutorial: AdminTutorial; content: string } | null>(null)

  // 审核写操作同步防抖：连点仅首次生效（AC-EG-19），覆盖通过/驳回两条互斥链路
  const busyRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isAdmin) return // operator 零数据请求（AC-FN-18 前端侧）
    let alive = true
    setLoading(true)
    const params = new URLSearchParams({ status: 'pending', page: '1', pageSize: String(PAGE_SIZE) })
    if (categoryId !== '') params.set('categoryId', String(categoryId))
    get<Page<AdminTutorial>>(`/api/tutorials?${params.toString()}`)
      .then((d) => {
        if (!alive) return
        // 契约列表固定 isTop→sort→updated_at 排序；审核队列口径为提交时间倒序（任务交互 1），前端重排当前页
        setList([...d.list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
        setError(null)
        setResults(new Map())
      })
      .catch((err: unknown) => {
        if (!alive) return
        setList([])
        setError(err instanceof Error ? err.message : '加载失败')
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [isAdmin, categoryId, reloadFlag])

  useEffect(() => {
    // 分类下拉：失败静默（仅剩"全部分类"），不阻塞队列
    let alive = true
    get<{ list: Category[] }>('/api/categories')
      .then((d) => alive && setCategories(d.list))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  /** Tab 角标=当前列表中未出结果的卡片数（与服务端 total 同步于每次重取；侧栏角标走 REVIEW_CHANGED_EVENT） */
  const pendingLeft = list.filter((t) => !results.has(t.id)).length

  function toastActionError(err: unknown): void {
    toast(err instanceof Error ? err.message : '操作失败', 'error')
    // 409=与运营撤回等并发（AC-EG-04）：toast 后刷新队列对齐最新态，并同步侧栏角标（他人已处理该待审）
    if (err instanceof ApiError && err.code === 409) {
      setReloadFlag((f) => f + 1)
      window.dispatchEvent(new CustomEvent(REVIEW_CHANGED_EVENT))
    }
  }

  /** 通过：POST review approve；成功卡片置结果行 + 角标联动（AC-FN-08） */
  async function approve(t: AdminTutorial): Promise<void> {
    if (busyRef.current !== null) return
    busyRef.current = t.id
    setBusyId(t.id)
    try {
      const r = await post<ReviewResult>(`/api/tutorials/${t.id}/review`, { action: 'approve' })
      setResults((m) => new Map(m).set(t.id, { kind: 'approve', at: r.reviewedAt ?? '' }))
      toast('已通过并发布，前台列表与搜索的下一次请求即返回该教程')
      window.dispatchEvent(new CustomEvent(REVIEW_CHANGED_EVENT))
    } catch (err) {
      toastActionError(err)
    } finally {
      busyRef.current = null
      setBusyId(null)
    }
  }

  /** 驳回确认：POST review reject；400（后端 ≥5 字兜底）保留弹窗，409 关弹窗并刷新 */
  async function confirmReject(reason: string): Promise<void> {
    const t = rejectTarget
    if (!t || busyRef.current !== null) return
    busyRef.current = t.id
    setRejectBusy(true)
    try {
      await post<ReviewResult>(`/api/tutorials/${t.id}/review`, { action: 'reject', reason })
      setRejectTarget(null)
      setResults((m) => new Map(m).set(t.id, { kind: 'reject' }))
      toast(REJECT_DONE_TEXT)
      window.dispatchEvent(new CustomEvent(REVIEW_CHANGED_EVENT))
    } catch (err) {
      toastActionError(err)
      if (err instanceof ApiError && err.code === 409) setRejectTarget(null)
    } finally {
      busyRef.current = null
      setRejectBusy(false)
    }
  }

  const pageHead = (
    <div className="page-head">
      <div>
        <div className="page-title">审核队列</div>
        <div className="page-desc">
          待审核教程按提交时间倒序 · 通过后前台即时可见 · 驳回必填原因 ≥5 字 · 运营撤回与审核动作互斥
        </div>
      </div>
    </div>
  )

  // operator 直达：页面级 403 提示（与后端审核接口 403 文案一致，AC-FN-18 / CHANGE-9）
  if (!isAdmin) {
    return (
      <div className="review-page">
        {pageHead}
        <div className="card forbid-card" data-testid="review-forbidden">
          <div className="forbid-ico">🚫</div>
          <div className="forbid-text">无权限执行该操作</div>
          <p className="forbid-desc">审核（通过 / 驳回）为平台管理员专属；运营编辑可在「教程管理」查看与编辑教程内容。</p>
        </div>
        <ToastHost toasts={toasts} />
      </div>
    )
  }

  return (
    <div className="review-page" data-testid="review-page">
      {pageHead}

      <div className="tabs-bar">
        <button
          type="button"
          className={`tab${activeTab === 'human' ? ' active' : ''}${pendingLeft > 0 ? ' has-n' : ''}`}
          onClick={() => setActiveTab('human')}
          data-testid="review-tab-human"
        >
          人工审核 <span className="n" data-testid="review-pending-count">{pendingLeft}</span>
        </button>
        <button
          type="button"
          className={`tab${activeTab === 'ai' ? ' active' : ''}`}
          onClick={() => setActiveTab('ai')}
          data-testid="review-tab-ai"
        >
          AI 生成（mock） <span className="n">1</span>
        </button>
      </div>

      {activeTab === 'human' ? (
        <>
          <div className="filter-row">
            <label htmlFor="review-category">分类筛选</label>
            <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
          </div>

          {loading ? (
            <div data-testid="review-skeleton">
              {Array.from({ length: 3 }, (_, i) => (
                <div className="sk sk-card" key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="region-error" data-testid="review-error">
              加载失败：{error}
              <button
                type="button"
                className="empty-link"
                onClick={() => setReloadFlag((f) => f + 1)}
                data-testid="review-retry-btn"
              >
                重试
              </button>
            </div>
          ) : list.length === 0 ? (
            <div className="empty-box" data-testid="review-empty">
              <div className="empty-ico">📭</div>
              <div>暂无待审核教程</div>
            </div>
          ) : (
            list.map((t) => (
              <ReviewCard
                key={t.id}
                t={t}
                busy={busyId === t.id}
                done={results.get(t.id)}
                onApprove={(x) => void approve(x)}
                onOpenReject={setRejectTarget}
                onViewFull={(x, c) => setFullState({ tutorial: x, content: c })}
              />
            ))
          )}
        </>
      ) : (
        <>
          <AiMockCard />
          <div className="empty-tip">本期 AI 生成队列共 1 条 mock 数据 · 审核动作下版本开放</div>
        </>
      )}

      {rejectTarget && (
        <RejectModal
          tutorial={rejectTarget}
          busy={rejectBusy}
          onCancel={() => setRejectTarget(null)}
          onConfirm={(reason) => void confirmReject(reason)}
        />
      )}
      {fullState && <FullModal tutorial={fullState.tutorial} content={fullState.content} onClose={() => setFullState(null)} />}
      <ToastHost toasts={toasts} />
    </div>
  )
}
