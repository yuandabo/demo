import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { del, get, post, put } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import { sanitizeRichText } from '../../shared/sanitize'
import { TUTORIAL_STATUS_LABELS } from '../../shared/constants'
import { fmtNum, fmtTime } from '../../shared/format'
import type {
  Category,
  TutorialDetail,
  TutorialSaveResult,
  TutorialStatus,
  TutorialSubmitResult,
  TutorialTopResult,
} from '../../shared/types'
import { REVIEW_CHANGED_EVENT } from '../components/Sidebar'
import { ToastHost, useToasts } from '../components/Toast'
import RichEditor from '../components/RichEditor'

/**
 * 教程编辑器页 #/tutorial/edit/:id（FE-04）：:id=new 为新建。
 * 复刻源：docs/ui/ui_admin_tutorial_edit.html；编辑取数走管理口径详情
 * GET /api/tutorials/:id?all=1（当前编辑值含 content，CHANGE-7）。
 * 核心机制：30s 自动保存草稿（内容变化才发 PUT）/ localStorage 快照崩溃恢复（AC-EG-16）/
 * 提审四项必填前置校验 + 按钮防抖（AC-EG-01 / AC-EG-03 / AC-RULE-18）/
 * 已发布·已下架保存回审分流（AC-FN-10）/ baseUpdatedAt 乐观锁 409 提示（AC-EG-05）/
 * 驳回原因黄条（AC-RULE-19）。
 */

const TITLE_MAX = 100
const SUMMARY_MAX = 200
const TAGS_MAX = 5
const SORT_MIN = 0
const SORT_MAX = 999
/** PRD §9：编辑器每 30 秒自动保存草稿（防抖：内容变化才发） */
const AUTOSAVE_INTERVAL_MS = 30_000
const MSG_SUBMIT_INCOMPLETE = '请补全标题/分类/摘要/正文后再提交'

/** 提审必填 / 长度校验可高亮的字段（AC-EG-01） */
type FieldKey = 'title' | 'category' | 'summary' | 'content' | 'tags'

interface EditForm {
  title: string
  categoryId: number | ''
  summary: string
  videoUrl: string
  tags: string[]
  /** 富文本 HTML（编辑区非受控，onInput 向父组件上抛最新 html；服务端入库前剥离脚本） */
  content: string
}

/** 右侧操作卡展示的服务端态（保存/置顶后局部刷新） */
interface EditMeta {
  status: TutorialStatus
  rejectReason: string | null
  isTop: number
  sort: number
  updatedAt: string | null
  createdAt: string | null
  authorName: string
  hasOnlineVersion: boolean
  viewCount: number
  favCount: number
  helpfulYes: number
  helpfulNo: number
}

/** 本地未提交快照（AC-EG-16：误关标签页 / 崩溃后再次进入恢复） */
interface DraftSnapshot extends EditForm {
  savedAt: number
}

const EMPTY_FORM: EditForm = { title: '', categoryId: '', summary: '', videoUrl: '', tags: [], content: '' }

// ── localStorage 快照存取（键名收口；写失败静默降级，不阻塞编辑） ──────────────

function snapKey(id: number | 'new'): string {
  return `erp_edit_snap_${id}`
}

function readSnapshot(key: string): DraftSnapshot | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as DraftSnapshot) : null
  } catch {
    return null
  }
}

function writeSnapshot(key: string, snap: DraftSnapshot): void {
  try {
    localStorage.setItem(key, JSON.stringify(snap))
  } catch {
    /* 存储配额满等极端情形：静默降级为无快照 */
  }
}

function clearSnapshot(key: string): void {
  localStorage.removeItem(key)
}

/** 富文本非空判定（提审必填"正文"）：剥标签后含可见字符，&nbsp; 视为空白 */
function htmlToText(html: string): string {
  const box = document.createElement('div')
  box.innerHTML = html
  return (box.textContent ?? '').replace(/\u00a0/g, ' ')
}

/** 脏检查序列化（与 lastSaved 对比，自动保存"内容变化才发"的依据） */
function serializeForm(f: EditForm): string {
  return JSON.stringify([f.title, f.categoryId, f.summary, f.videoUrl, f.tags, f.content])
}

/** 保存阻断项（AC-RULE-18：长度越界保存草稿同样阻断；POST/PUT 契约必填标题 + 启用分类） */
function saveBlockers(f: EditForm): Array<{ field: FieldKey; msg: string }> {
  const problems: Array<{ field: FieldKey; msg: string }> = []
  if (f.title.trim() === '') problems.push({ field: 'title', msg: '请填写标题' })
  else if (f.title.length > TITLE_MAX) problems.push({ field: 'title', msg: `标题不超过 ${TITLE_MAX} 字` })
  if (f.categoryId === '') problems.push({ field: 'category', msg: '请选择所属分类' })
  if (f.summary.length > SUMMARY_MAX) problems.push({ field: 'summary', msg: `摘要不超过 ${SUMMARY_MAX} 字` })
  if (f.tags.length > TAGS_MAX) problems.push({ field: 'tags', msg: `标签最多 ${TAGS_MAX} 个` })
  return problems
}

/** 有帮助率展示（零反馈为 '—'） */
function helpfulRateText(yes: number, no: number): string {
  const total = yes + no
  if (total === 0) return '—'
  return `${((yes / total) * 100).toFixed(1)}%`
}

function toEditForm(d: TutorialDetail): EditForm {
  return {
    title: d.title,
    categoryId: d.categoryId,
    summary: d.summary,
    videoUrl: d.videoUrl ?? '',
    tags: Array.isArray(d.tags) ? d.tags.slice(0, TAGS_MAX) : [],
    content: sanitizeRichText(d.content),
  }
}

function toEditMeta(d: TutorialDetail): EditMeta {
  return {
    status: d.status,
    rejectReason: d.rejectReason,
    isTop: d.isTop,
    sort: d.sort,
    updatedAt: d.updatedAt,
    createdAt: d.createdAt ?? null,
    authorName: d.authorName ?? '',
    hasOnlineVersion: d.hasOnlineVersion ?? false,
    viewCount: d.viewCount,
    favCount: d.favCount,
    helpfulYes: d.helpfulYes,
    helpfulNo: d.helpfulNo,
  }
}

/** 表单骨架（Loading 态，复用 .sk shimmer） */
function EditSkeleton() {
  return (
    <div className="edit-grid" data-testid="edit-skeleton">
      <div className="card">
        <div className="sk sk-line big" />
        <div className="sk sk-line" />
        <div className="sk sk-line" />
        <div className="sk sk-block" />
      </div>
      <div className="side-card">
        <div className="card">
          <div className="sk sk-line" />
          <div className="sk sk-block" />
        </div>
      </div>
    </div>
  )
}

export default function TutorialEdit() {
  const { id: rawId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toasts, push: toast } = useToasts()

  const isNew = rawId === 'new'
  const numericId = /^\d+$/.test(rawId) ? Number(rawId) : null
  const badRoute = !isNew && numericId === null

  const [loading, setLoading] = useState(!badRoute)
  const [loadError, setLoadError] = useState<string | null>(badRoute ? '教程不存在或链接不合法' : null)
  const [tutorialId, setTutorialId] = useState<number | null>(numericId)
  const [form, setForm] = useState<EditForm>(EMPTY_FORM)
  const [meta, setMeta] = useState<EditMeta | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [invalid, setInvalid] = useState<ReadonlySet<FieldKey>>(new Set())
  const [rejectBarHidden, setRejectBarHidden] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [topBusy, setTopBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [preview, setPreview] = useState(false)
  /** RichEditor 重挂载钥匙：取数完成 / 恢复快照时 +1 以换初始内容 */
  const [editorKey, setEditorKey] = useState(0)
  const [recovery, setRecovery] = useState<DraftSnapshot | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  /** 仅驱动"刚刚 / 30 秒前"自动保存文案的周期刷新 */
  const [, setNowTick] = useState(0)
  const [formReady, setFormReady] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const contentCardRef = useRef<HTMLDivElement>(null)
  const baseUpdatedAtRef = useRef<string | null>(null)
  const lastSavedSnapRef = useRef<string>(serializeForm(EMPTY_FORM))
  const savingRef = useRef(false)
  const submittingRef = useRef(false)
  /** 已取数的教程 id：POST 新建后 replace 跳转 /{id} 时不重复取数（表单内容不闪断） */
  const loadedIdRef = useRef<number | null>(null)
  const formRef = useRef(form)
  formRef.current = form
  const metaRef = useRef(meta)
  metaRef.current = meta
  const userRef = useRef(user)
  userRef.current = user
  const saveDraftRef = useRef<(silent: boolean) => Promise<number | null>>(async () => null)

  /** 纯草稿（从未通过审核且已落库）：唯一可删除形态；未保存的新建（无 id）不提供删除 */
  const isPureDraft = tutorialId !== null && meta !== null && meta.status === 'draft' && !meta.hasOnlineVersion
  const topLocked = tutorialId === null || meta?.status !== 'published'
  const currentSnapKey = snapKey(tutorialId ?? 'new')

  // ── 取数：编辑 = 管理口径详情 + 启用分类树；新建 = 仅分类树 ──────────────────
  useEffect(() => {
    if (badRoute) return
    if (numericId !== null && loadedIdRef.current === numericId) return
    let alive = true
    setLoading(true)
    setLoadError(null)
    setFormReady(false)

    async function load(): Promise<void> {
      try {
        const catsPromise = get<{ list: Category[] }>('/api/categories')
        if (numericId === null) {
          const cats = await catsPromise
          if (!alive) return
          setCategories(cats.list)
          setForm(EMPTY_FORM)
          setMeta({
            status: 'draft',
            rejectReason: null,
            isTop: 0,
            sort: 100, // db.md §2 sort 缺省值
            updatedAt: null,
            createdAt: null,
            authorName: userRef.current?.displayName ?? userRef.current?.username ?? '',
            hasOnlineVersion: false,
            viewCount: 0,
            favCount: 0,
            helpfulYes: 0,
            helpfulNo: 0,
          })
          setTutorialId(null)
          baseUpdatedAtRef.current = null
          loadedIdRef.current = null
          lastSavedSnapRef.current = serializeForm(EMPTY_FORM)
        } else {
          const detail = await get<TutorialDetail>(`/api/tutorials/${numericId}?all=1`)
          const cats = await catsPromise
          if (!alive) return
          const nextForm = toEditForm(detail)
          setCategories(cats.list)
          setForm(nextForm)
          setMeta(toEditMeta(detail))
          setTutorialId(detail.id)
          baseUpdatedAtRef.current = detail.updatedAt
          loadedIdRef.current = detail.id
          lastSavedSnapRef.current = serializeForm(nextForm)
        }
        setEditorKey((k) => k + 1)
        setLoading(false)
        setFormReady(true)
        // AC-EG-16：本地存有未提交快照 → 弹"已恢复未保存的编辑内容"确认
        const snap = readSnapshot(numericId === null ? snapKey('new') : snapKey(numericId))
        if (snap) setRecovery(snap)
      } catch (err) {
        if (!alive) return
        setLoadError(err instanceof Error ? err.message : '加载失败')
        setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawId])

  // ── 30s 自动保存（防抖：内容相对上次保存无变化不发请求） ─────────────────────
  useEffect(() => {
    if (!formReady) return
    const timer = window.setInterval(() => {
      if (serializeForm(formRef.current) !== lastSavedSnapRef.current) void saveDraftRef.current(true)
    }, AUTOSAVE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [formReady])

  // ── "刚刚 / 30 秒前"文案周期刷新 + 脏内容快照落盘（防抖 300ms） ─────────────
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick((n) => n + 1), 10_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!formReady) return
    const timer = window.setTimeout(() => {
      if (serializeForm(form) !== lastSavedSnapRef.current) {
        writeSnapshot(currentSnapKey, { ...form, savedAt: Date.now() })
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [form, formReady, currentSnapKey])

  const autosaveTip =
    lastSavedAt !== null && Date.now() - lastSavedAt < AUTOSAVE_INTERVAL_MS
      ? '刚刚已自动保存'
      : lastSavedAt !== null
        ? '30 秒前已自动保存'
        : null

  function clearFieldInvalid(field: FieldKey): void {
    setInvalid((s) => (s.has(field) ? new Set([...s].filter((k) => k !== field)) : s))
  }

  /** 表单更新 + 清除该字段的校验高亮 */
  function patchForm(patch: Partial<EditForm>, field: FieldKey): void {
    setForm((f) => ({ ...f, ...patch }))
    clearFieldInvalid(field)
  }

  // ── 保存草稿：新建 POST / 已有 PUT（回审分流 + baseUpdatedAt 乐观锁） ────────
  const saveDraft = useCallback(
    async (silent: boolean): Promise<number | null> => {
      if (savingRef.current) return null
      const f = formRef.current
      const problems = saveBlockers(f)
      if (problems.length > 0) {
        if (!silent) {
          setInvalid(new Set(problems.map((p) => p.field)))
          toast(problems.map((p) => p.msg).join(' / '), 'error')
        }
        return null
      }
      savingRef.current = true
      setSaving(true)
      try {
        const payload = {
          title: f.title.trim(),
          categoryId: f.categoryId === '' ? undefined : f.categoryId,
          summary: f.summary,
          content: f.content,
          videoUrl: f.videoUrl.trim() === '' ? null : f.videoUrl.trim(),
          tags: f.tags,
        }
        let id = tutorialId
        let result: TutorialSaveResult
        let prevStatus: TutorialStatus
        if (id === null) {
          result = await post<TutorialSaveResult>('/api/tutorials', payload)
          id = result.id
          prevStatus = 'draft'
          setTutorialId(id)
          loadedIdRef.current = id
          clearSnapshot(snapKey('new'))
          // URL 换成真实 id（loadedIdRef 已对齐，replace 不触发重复取数）
          navigate(`/tutorial/edit/${id}`, { replace: true })
        } else {
          prevStatus = metaRef.current?.status ?? 'draft'
          result = await put<TutorialSaveResult>(`/api/tutorials/${id}`, {
            ...payload,
            baseUpdatedAt: baseUpdatedAtRef.current ?? undefined,
          })
        }
        baseUpdatedAtRef.current = result.updatedAt
        lastSavedSnapRef.current = serializeForm(f)
        clearSnapshot(snapKey(id))
        setLastSavedAt(Date.now())
        setMeta((m) => (m ? { ...m, status: result.status, updatedAt: result.updatedAt } : m))
        if (!silent) {
          // 保存分流提示（AC-FN-10：已发布/已下架保存 → 回审）
          toast(
            prevStatus === 'published' || prevStatus === 'offline'
              ? '已保存，进入回审'
              : prevStatus === 'pending'
                ? '已保存，待审核版本已更新'
                : '已保存草稿（可反复保存，不影响前台）',
          )
        }
        return id
      } catch (err) {
        toast(err instanceof Error ? err.message : '保存失败', 'error')
        return null
      } finally {
        savingRef.current = false
        setSaving(false)
      }
    },
    [tutorialId, navigate, toast],
  )
  saveDraftRef.current = saveDraft

  // ── 提审：四项必填前置校验（AC-EG-01）→ 先保存 → submit；防抖仅首次生效（AC-EG-03） ──
  async function submitReview(): Promise<void> {
    if (submittingRef.current) return
    const f = formRef.current
    const contentEmpty = htmlToText(f.content).trim() === ''
    const requiredMissing = f.title.trim() === '' || f.categoryId === '' || f.summary.trim() === '' || contentEmpty
    const problems = saveBlockers(f)
    if (requiredMissing || problems.length > 0) {
      const fields = new Set<FieldKey>(problems.map((p) => p.field))
      if (f.title.trim() === '') fields.add('title')
      if (f.categoryId === '') fields.add('category')
      if (f.summary.trim() === '') fields.add('summary')
      if (contentEmpty) fields.add('content')
      setInvalid(fields)
      toast(requiredMissing ? MSG_SUBMIT_INCOMPLETE : problems.map((p) => p.msg).join(' / '), 'error')
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    try {
      // 前置：先保存最新内容（提审内容 = 服务端当前编辑值）
      const savedId = await saveDraftRef.current(true)
      if (savedId === null) return
      await post<TutorialSubmitResult>(`/api/tutorials/${savedId}/submit`, {})
      clearSnapshot(snapKey(savedId))
      window.dispatchEvent(new CustomEvent(REVIEW_CHANGED_EVENT))
      toast('已提交审核：草稿 → 待审核')
      navigate('/tutorial')
    } catch (err) {
      toast(err instanceof Error ? err.message : '提交失败', 'error')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  // ── 删除纯草稿（AC-OP-06：二次确认 + 403 删除保护由后端兜底） ────────────────
  async function deleteDraft(): Promise<void> {
    if (tutorialId === null || deleting) return
    setDeleting(true)
    try {
      await del(`/api/tutorials/${tutorialId}`)
      clearSnapshot(snapKey(tutorialId))
      toast('已删除')
      navigate('/tutorial')
    } catch (err) {
      toast(err instanceof Error ? err.message : '删除失败', 'error')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  // ── 置顶 / 排序（PUT /top：仅已发布可置顶，排序 0-999 失焦保存） ─────────────
  async function saveTopAndSort(patch: { isTop: number; sort: number }, okText: string): Promise<void> {
    if (tutorialId === null || topBusy) return
    setTopBusy(true)
    try {
      const r = await put<TutorialTopResult>(`/api/tutorials/${tutorialId}/top`, patch)
      setMeta((m) => (m ? { ...m, isTop: r.isTop, sort: r.sort, status: r.status } : m))
      toast(okText)
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败', 'error')
    } finally {
      setTopBusy(false)
    }
  }

  function toggleTop(on: boolean): void {
    saveTopAndSort(
      { isTop: on ? 1 : 0, sort: meta?.sort ?? 100 },
      on ? '已置顶，前台列表优先展示（发布后生效）' : '已取消置顶，恢复按排序值与发布时间排列',
    )
  }

  function commitSort(raw: string): void {
    if (!meta) return
    const parsed = Math.round(Number(raw))
    const next = Number.isFinite(parsed) ? Math.min(SORT_MAX, Math.max(SORT_MIN, parsed)) : meta.sort
    if (next === meta.sort) return
    saveTopAndSort(
      { isTop: meta.isTop, sort: next },
      `排序值已保存为 ${next}（0-999，同级越小越靠前，影响前台列表与上下篇）`,
    )
  }

  // ── 标签 chips：回车添加（≤5、去重），点 × 移除 ──────────────────────────────
  function addTag(): void {
    const v = tagInput.trim()
    if (v === '') return
    if (form.tags.length >= TAGS_MAX) {
      toast(`标签最多 ${TAGS_MAX} 个`, 'error')
      return
    }
    if (!form.tags.includes(v)) {
      setForm((f) => ({ ...f, tags: [...f.tags, v] }))
      clearFieldInvalid('tags')
    }
    setTagInput('')
  }

  function removeTag(tag: string): void {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))
  }

  // ── 快照恢复（AC-EG-16）/ 预览 / 驳回定位 ──────────────────────────────────
  function applyRecovery(): void {
    if (!recovery) return
    setForm({
      title: typeof recovery.title === 'string' ? recovery.title : '',
      categoryId: typeof recovery.categoryId === 'number' ? recovery.categoryId : '',
      summary: typeof recovery.summary === 'string' ? recovery.summary : '',
      videoUrl: typeof recovery.videoUrl === 'string' ? recovery.videoUrl : '',
      tags: recovery.tags?.filter((t): t is string => typeof t === 'string') ?? [],
      content: sanitizeRichText(typeof recovery.content === 'string' ? recovery.content : ''),
    })
    setEditorKey((k) => k + 1)
    setRecovery(null)
    toast('已恢复未保存的编辑内容')
  }

  function discardRecovery(): void {
    clearSnapshot(currentSnapKey)
    setRecovery(null)
  }

  function togglePreview(): void {
    setPreview((p) => !p)
  }

  function previewFront(): void {
    if (!preview) setPreview(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function locateContent(): void {
    contentCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── 渲染 ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="tutorial-edit">
        <EditSkeleton />
      </div>
    )
  }

  if (loadError !== null) {
    return (
      <div className="region-error" data-testid="tutorial-error">
        加载失败：{loadError}
        <button type="button" className="empty-link" onClick={() => navigate('/tutorial')} data-testid="back-list-btn">
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="tutorial-edit">
      {/* 驳回原因告警条（AC-RULE-19：草稿且 rejectReason 非空才显示，关闭后本次会话隐藏） */}
      {meta?.status === 'draft' && meta.rejectReason && !rejectBarHidden && (
        <div className="reject-bar" data-testid="reject-bar">
          <span>⚠</span>
          <div>
            <b>驳回原因</b>：{meta.rejectReason}{' '}
            <span
              className="link"
              role="button"
              tabIndex={0}
              onClick={locateContent}
              onKeyDown={(e) => {
                if (e.key === 'Enter') locateContent()
              }}
              data-testid="reject-locate-link"
            >
              定位到正文 →
            </span>
          </div>
          <button
            type="button"
            className="close"
            title="关闭"
            onClick={() => setRejectBarHidden(true)}
            data-testid="reject-close-btn"
          >
            ×
          </button>
        </div>
      )}

      <div className="edit-grid">
        {/* ===== 左列：基本信息 + 图文正文 ===== */}
        <div>
          <div className="card">
            <div className="card-head">
              <div className="card-title">基本信息</div>
              <div className="card-note">标 * 为提审必填项</div>
            </div>
            <div className="form-row">
              <div className="form-label">
                <span>
                  <span className="req">*</span>标题（≤100 字）
                </span>
                <span
                  className={`char-count${form.title.length > TITLE_MAX ? ' over' : ''}`}
                  data-testid="title-count"
                >
                  {form.title.length}/{TITLE_MAX}
                </span>
              </div>
              <input
                className={`input${invalid.has('title') ? ' field-error' : ''}`}
                type="text"
                value={form.title}
                onChange={(e) => patchForm({ title: e.target.value }, 'title')}
                placeholder="请输入教程标题"
                data-testid="tutorial-title-input"
              />
            </div>
            <div className="form-row">
              <div className="form-label">
                <span>
                  <span className="req">*</span>所属分类（启用节点）
                </span>
              </div>
              <select
                className={`select${invalid.has('category') ? ' field-error' : ''}`}
                value={form.categoryId}
                onChange={(e) => patchForm({ categoryId: e.target.value === '' ? '' : Number(e.target.value) }, 'category')}
                data-testid="tutorial-category-select"
              >
                <option value="">请选择分类</option>
                {categories.map((c) => (
                  <Fragment key={c.id}>
                    <option value={c.id}>{c.name}</option>
                    {c.children.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        　└ {ch.name}
                      </option>
                    ))}
                  </Fragment>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-label">
                <span>
                  <span className="req">*</span>摘要（≤200 字）
                </span>
                <span
                  className={`char-count${form.summary.length > SUMMARY_MAX ? ' over' : ''}`}
                  data-testid="summary-count"
                >
                  {form.summary.length}/{SUMMARY_MAX}
                </span>
              </div>
              <textarea
                className={`textarea${invalid.has('summary') ? ' field-error' : ''}`}
                value={form.summary}
                onChange={(e) => patchForm({ summary: e.target.value }, 'summary')}
                placeholder="一句话说明教程解决什么问题，将展示在列表卡片与搜索结果中"
                data-testid="tutorial-summary-textarea"
              />
            </div>
            <div className="form-row">
              <div className="form-label">
                <span>标签（≤5 个）</span>
                <span className="char-count" data-testid="tag-count">
                  {form.tags.length}/{TAGS_MAX}
                </span>
              </div>
              <div className={`chips${invalid.has('tags') ? ' field-error' : ''}`} data-testid="tag-chips">
                {form.tags.map((tag) => (
                  <span className="chip" key={tag}>
                    {tag}
                    <button
                      type="button"
                      className="x"
                      title={`移除标签 ${tag}`}
                      onClick={() => removeTag(tag)}
                      data-testid={`tag-remove-${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  placeholder={form.tags.length >= TAGS_MAX ? '标签最多 5 个' : '输入后回车添加'}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  data-testid="tag-input"
                />
              </div>
              <div className="form-hint">标签参与前台标签筛选与关键词搜索命中（标题/摘要/标签三字段）</div>
            </div>
            <div className="form-row">
              <div className="form-label">
                <span>视频外链（可选）</span>
                <span className="char-count">mp4 直链</span>
              </div>
              <input
                className="input"
                type="text"
                value={form.videoUrl}
                onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                placeholder="https://...mp4"
                data-testid="tutorial-video-input"
              />
              <div className="form-hint">详情页视频区渲染播放，外链失效时显示占位提示，不影响图文正文展示</div>
            </div>
          </div>

          <div className="card" ref={contentCardRef}>
            <div className="card-head">
              <div className="card-title">图文正文</div>
              <div className="card-note">按步骤标题自动拆分步骤进度条 · 支持标题/加粗/列表/图片/视频</div>
            </div>
            <RichEditor
              key={editorKey}
              initialHtml={form.content}
              onChange={(html) => patchForm({ content: html }, 'content')}
              preview={preview}
              onTogglePreview={togglePreview}
              invalid={invalid.has('content')}
            />
          </div>
        </div>

        {/* ===== 右列：操作卡 ===== */}
        <div className="side-card">
          <div className="card">
            <div className="status-row">
              {meta && (
                <span className={`badge badge-${meta.status}`} data-testid="edit-status-badge">
                  {TUTORIAL_STATUS_LABELS[meta.status]}
                </span>
              )}
              <span className={`autosave${autosaveTip ? '' : ' idle'}`} data-testid="autosave-tip">
                <i />
                {autosaveTip ?? '自动保存已开启'}
              </span>
            </div>

            {meta && (
              <div className="meta-list" data-testid="edit-meta-list">
                作者<b>{meta.authorName || '—'}</b>
                <br />
                创建时间<b>{meta.createdAt ? fmtTime(meta.createdAt) : '—'}</b>
                <br />
                最近更新<b>{meta.updatedAt ? fmtTime(meta.updatedAt) : '—'}</b>
                <br />
                浏览 / 收藏 / 有帮助率
                <b>
                  {meta.hasOnlineVersion
                    ? ` ${fmtNum(meta.viewCount)} / ${fmtNum(meta.favCount)} / ${helpfulRateText(meta.helpfulYes, meta.helpfulNo)}`
                    : ' — / — / —（草稿期无前台数据）'}
                </b>
              </div>
            )}

            {/* 置顶与排序（仅已发布可置顶——契约 409 口径；排序值 0-999 失焦保存） */}
            <div className="top-sort-block">
              <div className="form-label">
                <span>置顶与排序</span>
                <span className="card-note">发布后生效</span>
              </div>
              <div className="top-sort-row">
                <label
                  className={`switch${topLocked ? ' disabled' : ''}`}
                  title={topLocked ? '仅已发布教程可置顶' : undefined}
                >
                  <input
                    type="checkbox"
                    checked={meta ? meta.isTop === 1 : false}
                    disabled={topLocked || topBusy}
                    onChange={(e) => toggleTop(e.target.checked)}
                    data-testid="top-switch"
                  />
                  <i />
                  置顶
                </label>
                <input
                  key={tutorialId ?? 'new'}
                  className="sort-num"
                  type="number"
                  min={SORT_MIN}
                  max={SORT_MAX}
                  defaultValue={meta?.sort ?? 100}
                  disabled={tutorialId === null || topBusy}
                  title="排序值（同级越小越靠前）"
                  onBlur={(e) => commitSort(e.target.value)}
                  data-testid="sort-input"
                />
                <span className="sort-lbl">排序值</span>
              </div>
              <div className="form-hint">
                置顶教程优先展示于前台列表与分类顶部；未置顶时按排序值升序 + 发布时间倒序排列，并影响同分类上/下一篇
              </div>
            </div>

            <div className="edit-actions">
              <button
                type="button"
                className="btn btn-block"
                disabled={saving || submitting}
                onClick={() => void saveDraftRef.current(false)}
                data-testid="save-draft-btn"
              >
                {saving ? '保存中…' : '💾 保存草稿'}
              </button>
              <button
                type="button"
                className="btn btn-block btn-primary"
                disabled={submitting}
                onClick={() => void submitReview()}
                data-testid="submit-review-btn"
              >
                {submitting ? '提交中…' : '📤 提交审核'}
              </button>
              <button type="button" className="btn btn-block btn-cta" onClick={previewFront} data-testid="preview-front-btn">
                👁 预览前台效果
              </button>
              {isPureDraft && (
                <button
                  type="button"
                  className="btn btn-block btn-ghost-danger"
                  onClick={() => setConfirmDelete(true)}
                  data-testid="delete-draft-btn"
                >
                  🗑 删除草稿
                </button>
              )}
            </div>

            <div className="notice" data-testid="edit-notice">
              {isPureDraft ? (
                <>
                  提示：本篇为<b>纯草稿</b>（从未通过审核），可删除；提审必填：标题 / 分类 / 摘要 / 正文。被驳回后修改完成请重新提交审核。
                </>
              ) : (
                <>
                  提审必填：标题 / 分类 / 摘要 / 正文。已发布 / 已下架教程保存后自动回审，前台持续展示线上过审版本。
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 删除草稿二次确认（AC-OP-06，自绘 Modal 非 confirm()） */}
      {confirmDelete && (
        <div className="modal-mask show" data-testid="delete-modal">
          <div className="modal">
            <div className="modal-title">🗑 删除草稿</div>
            <div className="modal-body">
              仅"从未通过审核的纯草稿"可删除，确认删除<b>《{form.title || '未命名草稿'}》</b>？
              <br />
              <span style={{ color: 'var(--text2)' }}>删除后不可恢复；存在线上过审版本的教程不提供删除，以下架归档代替。</span>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setConfirmDelete(false)} data-testid="delete-cancel-btn">
                取消
              </button>
              <button
                type="button"
                className="btn btn-modal-danger"
                disabled={deleting}
                onClick={() => void deleteDraft()}
                data-testid="delete-confirm-btn"
              >
                {deleting ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 本地快照恢复确认（AC-EG-16） */}
      {recovery && (
        <div className="modal-mask show" data-testid="recovery-modal">
          <div className="modal">
            <div className="modal-title">⚠ 恢复未保存的编辑内容</div>
            <div className="modal-body">
              检测到本机存在未提交的编辑快照（{new Date(recovery.savedAt).toLocaleString()}）。
              点击确认恢复后，内容恢复至最近一次编辑的版本；放弃则清空本地快照，以服务端内容为准。
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={discardRecovery} data-testid="recovery-discard-btn">
                放弃本地内容
              </button>
              <button type="button" className="btn btn-primary" onClick={applyRecovery} data-testid="recovery-confirm-btn">
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastHost toasts={toasts} />
    </div>
  )
}
