import { Fragment, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, del, get, post, put } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import { TUTORIAL_STATUS_LABELS } from '../../shared/constants'
import { fmtNum, fmtTime } from '../../shared/format'
import type { AdminTutorial, Category, Page, TutorialStatus } from '../../shared/types'
import { REVIEW_CHANGED_EVENT } from '../components/Sidebar'
import { ToastHost, useToasts } from '../components/Toast'
import CategorySelect from '../components/CategorySelect'

/**
 * 教程管理列表（FE-03）：全态筛选 / 四态标签 + 按状态差异化行内操作（UI-ELEM-07）/
 * 置顶星标与排序值 / 下架·删除自绘二次确认（非 confirm()）/ 分页状态计数汇总。
 * 复刻源：docs/ui/ui_admin_tutorial_list.html；数据口径 GET /api/tutorials?all=1。
 */

const PAGE_SIZE = 10

/** 分页汇总文案状态顺序（已发布 + 待审核 + 草稿 + 已下架，设计稿口径） */
const SUMMARY_STATUSES: readonly TutorialStatus[] = ['published', 'pending', 'draft', 'offline']

interface Filters {
  status: '' | TutorialStatus
  categoryId: number | ''
  keyword: string
}

const EMPTY_FILTERS: Filters = { status: '', categoryId: '', keyword: '' }

/** 行内直接执行的操作（下架/删除走二次确认弹窗，编辑走路由跳转） */
type RowActionKind = 'copy' | 'withdraw' | 'submit' | 'republish'

const ROW_ACTION_META: Record<
  RowActionKind,
  { run: (t: AdminTutorial) => Promise<unknown>; okText: string; reviewChanged?: boolean }
> = {
  copy: {
    run: (t) => post(`/api/tutorials/${t.id}/copy`, {}),
    okText: '已复制为新草稿（副本）· 浏览 / 收藏计数清零',
  },
  withdraw: {
    run: (t) => post(`/api/tutorials/${t.id}/withdraw`, {}),
    okText: '已撤回，状态回到草稿，可继续编辑后重新提审',
    reviewChanged: true,
  },
  submit: {
    run: (t) => post(`/api/tutorials/${t.id}/submit`, {}),
    okText: '已提交审核，进入审核队列（侧栏角标 +1）',
    reviewChanged: true,
  },
  republish: {
    run: (t) => post(`/api/tutorials/${t.id}/republish`, {}),
    okText: '已重新发布（内容未变不重审），前台/小程序下一次请求即恢复可见，浏览/收藏计数延续',
  },
}

/** 下架/删除二次确认弹窗配置（自绘 Modal，标题动态填充教程标题） */
const CONFIRM_META = {
  offline: {
    title: '⬇️ 下架确认',
    lead: '确认下架',
    confirmText: '确认下架',
    note: '下架后前台不可见（PC / 小程序即时同步隐藏），收藏该教程的用户将在收藏夹看到「已下架」标注；下架操作留痕，可随时重新发布。',
  },
  delete: {
    title: '🗑 删除教程',
    lead: '确认删除草稿',
    confirmText: '确认删除',
    note: '仅"从未通过审核的纯草稿"可删除，删除后不可恢复；存在线上过审版本的教程不提供删除，以下架归档代替。',
  },
} as const

type ConfirmKind = keyof typeof CONFIRM_META

function buildListUrl(filters: Filters, page: number): string {
  const params = new URLSearchParams({ all: '1', page: String(page), pageSize: String(PAGE_SIZE) })
  if (filters.status) params.set('status', filters.status)
  if (filters.categoryId !== '') params.set('categoryId', String(filters.categoryId))
  const keyword = filters.keyword.trim()
  if (keyword) params.set('keyword', keyword)
  return `/api/tutorials?${params.toString()}`
}

/** 有帮助率 = yes/(yes+no)，1 位小数；零反馈 null（显示"—"）；<50%（没帮助>50%）标红 */
function calcHelpfulRate(t: AdminTutorial): { text: string; low: boolean } | null {
  const total = t.helpfulYes + t.helpfulNo
  if (total === 0) return null
  const rate = (t.helpfulYes / total) * 100
  return { text: `${rate.toFixed(1)}%`, low: rate < 50 }
}

/** 标题副行文案（按状态+提审次数+线上版本派生，设计稿口径） */
function titleSubText(t: AdminTutorial): string {
  switch (t.status) {
    case 'pending':
      return t.hasOnlineVersion ? '前台仍展示线上过审版本' : '首次提审 · 全新教程'
    case 'draft':
      return t.submitCount > 0 ? '被驳回后修改中 · 仅作者与管理员可见' : '纯草稿 · 从未提审 · 仅作者与管理员可见'
    case 'offline':
      return '已下架：三端即时不可见，收藏夹标注「已下架」'
    default:
      return t.summary
  }
}

// ── 单元格与子组件（模块级定义，避免父组件刷新导致排序输入框重挂载丢焦点）──────────

interface RowHandlers {
  onAction: (t: AdminTutorial, kind: RowActionKind) => void
  onEdit: (t: AdminTutorial) => void
  onOffline: (t: AdminTutorial) => void
  onDelete: (t: AdminTutorial) => void
  onToggleTop: (t: AdminTutorial) => void
  onSaveSort: (t: AdminTutorial, raw: string) => void
}

/** 标题单元格：标题 + 置顶/回审角标 + 副行（标签或状态说明）+ 驳回原因提示（UI-ELEM-07） */
function TitleCell({ t }: { t: AdminTutorial }) {
  return (
    <td>
      <div className={`t-title${t.status === 'offline' ? ' offline' : ''}`}>
        {t.title}
        {t.isTop === 1 && <span className="tag tag-top">置顶</span>}
        {t.status === 'pending' && t.hasOnlineVersion && t.submitCount >= 2 && (
          <span className="tag tag-v2">修改版 v{t.submitCount} · 回审中</span>
        )}
      </div>
      <div className="t-sub">
        {t.status === 'published' && t.tags.length > 0
          ? t.tags.map((tag) => (
              <span className="tag tag-cat" key={tag} style={{ marginLeft: 0 }}>
                {tag}
              </span>
            ))
          : titleSubText(t)}
      </div>
      {t.status === 'draft' && t.rejectReason && (
        <div className="reject-tip">
          ⚠ <span><b>驳回原因</b>：{t.rejectReason}</span>
        </div>
      )}
    </td>
  )
}

/** 置顶/排序单元格：星标仅已发布可点（否则禁用+提示），排序值 0-999 失焦保存 */
function TopSortCell({
  t,
  busy,
  onToggleTop,
  onSaveSort,
}: {
  t: AdminTutorial
  busy: boolean
  onToggleTop: RowHandlers['onToggleTop']
  onSaveSort: RowHandlers['onSaveSort']
}) {
  const topLocked = t.status !== 'published'
  return (
    <td>
      <div className="top-cell">
        <button
          type="button"
          className={`star${t.isTop === 1 ? ' on' : ''}`}
          disabled={topLocked || busy}
          title={topLocked ? '仅已发布教程可置顶' : t.isTop === 1 ? '点击取消置顶' : '点击置顶'}
          onClick={() => onToggleTop(t)}
          data-testid={`row-${t.id}-star-btn`}
        >
          ★
        </button>
        <input
          className="sort-input"
          type="number"
          min={0}
          max={999}
          defaultValue={t.sort}
          disabled={busy}
          title="排序值（越小越靠前）"
          onBlur={(e) => onSaveSort(t, e.target.value)}
          data-testid={`row-${t.id}-sort-input`}
        />
      </div>
    </td>
  )
}

/**
 * 操作列（UI-ELEM-07 删除保护入口语义）：published→编辑/下架(admin)/复制；
 * pending→编辑(禁用)/撤回/复制；draft→编辑/提审/复制/删除(仅 hasOnlineVersion=false)；
 * offline→编辑/重新发布(admin)/复制。operator 不渲染下架/重发布入口（403 兜底 toast）。
 */
function OpsCell({ t, isAdmin, busy, h }: { t: AdminTutorial; isAdmin: boolean; busy: boolean; h: RowHandlers }) {
  const parts: ReactNode[] = []
  if (t.status === 'pending') {
    parts.push(
      <button type="button" key="edit" className="op" disabled title="待审核状态请先撤回" data-testid={`row-${t.id}-edit-btn`}>
        编辑
      </button>,
      <button
        type="button"
        key="withdraw"
        className="op op-warn"
        disabled={busy}
        onClick={() => h.onAction(t, 'withdraw')}
        data-testid={`row-${t.id}-withdraw-btn`}
      >
        撤回
      </button>,
    )
  } else {
    parts.push(
      <button
        type="button"
        key="edit"
        className="op"
        disabled={busy}
        onClick={() => h.onEdit(t)}
        data-testid={`row-${t.id}-edit-btn`}
      >
        编辑
      </button>,
    )
    if (isAdmin && t.status === 'published')
      parts.push(
        <button
          type="button"
          key="offline"
          className="op op-warn"
          disabled={busy}
          onClick={() => h.onOffline(t)}
          data-testid={`row-${t.id}-offline-btn`}
        >
          下架
        </button>,
      )
    if (isAdmin && t.status === 'offline')
      parts.push(
        <button
          type="button"
          key="republish"
          className="op op-cta"
          disabled={busy}
          onClick={() => h.onAction(t, 'republish')}
          data-testid={`row-${t.id}-republish-btn`}
        >
          重新发布
        </button>,
      )
    if (t.status === 'draft')
      parts.push(
        <button
          type="button"
          key="submit"
          className="op"
          disabled={busy}
          onClick={() => h.onAction(t, 'submit')}
          data-testid={`row-${t.id}-submit-btn`}
        >
          提审
        </button>,
      )
  }
  parts.push(
    <button
      type="button"
      key="copy"
      className="op"
      disabled={busy}
      onClick={() => h.onAction(t, 'copy')}
      data-testid={`row-${t.id}-copy-btn`}
    >
      复制
    </button>,
  )
  // 删除保护：仅"从未通过审核的纯草稿"渲染入口（AC-OP-06）
  if (t.status === 'draft' && !t.hasOnlineVersion)
    parts.push(
      <button
        type="button"
        key="delete"
        className="op op-danger"
        disabled={busy}
        onClick={() => h.onDelete(t)}
        data-testid={`row-${t.id}-delete-btn`}
      >
        删除
      </button>,
    )

  return (
    <td className="ops">
      {parts.map((node, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="dot-sep">·</span>}
          {node}
        </Fragment>
      ))}
    </td>
  )
}

/** 单行：无前台数据（无线上版本）计数列显示"—"；已下架计数灰显 */
function TutorialRow({ t, isAdmin, busy, h }: { t: AdminTutorial; isAdmin: boolean; busy: boolean; h: RowHandlers }) {
  const noData = !t.hasOnlineVersion
  const toneCls = noData || t.status === 'offline' ? ' muted' : ''
  const rate = calcHelpfulRate(t)
  return (
    <tr data-status={t.status}>
      <TitleCell t={t} />
      <td>{t.categoryName}</td>
      <td>{t.authorName}</td>
      <td>
        <span className={`badge badge-${t.status}`} data-testid={`row-${t.id}-status-badge`}>
          {TUTORIAL_STATUS_LABELS[t.status]}
        </span>
      </td>
      <td className={`num${toneCls}`}>{noData ? '—' : fmtNum(t.viewCount)}</td>
      <td className={`num${toneCls}`}>{noData ? '—' : fmtNum(t.favCount)}</td>
      <td className={`num${toneCls}${rate?.low ? ' rate-low' : ''}`}>{noData || !rate ? '—' : rate.text}</td>
      <TopSortCell t={t} busy={busy} onToggleTop={h.onToggleTop} onSaveSort={h.onSaveSort} />
      <td className="num">{fmtTime(t.updatedAt)}</td>
      <OpsCell t={t} isAdmin={isAdmin} busy={busy} h={h} />
    </tr>
  )
}

/** 分页器：左侧总数统计（未筛选时含四态计数汇总；筛选中显示命中数），右侧页码按钮 */
function Pager({
  page,
  pageCount,
  total,
  counts,
  filtered,
  onGo,
}: {
  page: number
  pageCount: number
  total: number
  counts: Record<TutorialStatus, number> | null
  filtered: boolean
  onGo: (page: number) => void
}) {
  const summary = filtered
    ? `筛选命中 ${fmtNum(total)} 条记录`
    : `共 ${fmtNum(total)} 条记录（${SUMMARY_STATUSES.map(
        (s) => `${TUTORIAL_STATUS_LABELS[s]} ${counts ? fmtNum(counts[s]) : '—'}`,
      ).join(' + ')}）`
  return (
    <div className="pager">
      <div className="pager-info" data-testid="pager-info">
        {summary} · 当前第 {page} / {pageCount} 页
      </div>
      <div className="pager-btns">
        <button
          type="button"
          className="page-btn"
          disabled={page <= 1}
          onClick={() => onGo(page - 1)}
          data-testid="pager-prev-btn"
        >
          ‹ 上一页
        </button>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <button
            type="button"
            key={n}
            className={`page-btn${n === page ? ' current' : ''}`}
            onClick={() => onGo(n)}
            data-testid={`pager-page-${n}`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          disabled={page >= pageCount}
          onClick={() => onGo(page + 1)}
          data-testid="pager-next-btn"
        >
          下一页 ›
        </button>
      </div>
    </div>
  )
}

/** 下架/删除共用自绘二次确认弹窗 */
function ConfirmModal({
  kind,
  tutorial,
  busy,
  onCancel,
  onConfirm,
}: {
  kind: ConfirmKind
  tutorial: AdminTutorial
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const meta = CONFIRM_META[kind]
  return (
    <div className="modal-mask show" data-testid={`${kind}-modal`}>
      <div className="modal">
        <div className="modal-title">{meta.title}</div>
        <div className="modal-body">
          {meta.lead} <b>《{tutorial.title}》</b> 吗？
          <br />
          <span style={{ color: 'var(--text2)' }}>{meta.note}</span>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onCancel} data-testid={`${kind}-cancel-btn`}>
            取消
          </button>
          <button
            type="button"
            className="btn btn-modal-danger"
            disabled={busy}
            onClick={onConfirm}
            data-testid={`${kind}-confirm-btn`}
          >
            {meta.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div data-testid="tutorial-table-skeleton">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="sk sk-row" key={i} />
      ))}
    </div>
  )
}

/** 空态（AC 口径"暂无数据"+引导）：筛选中引导清空条件，否则引导新建教程 */
function EmptyState({ filtered, onCreate, onReset }: { filtered: boolean; onCreate: () => void; onReset: () => void }) {
  return (
    <div className="empty-box" data-testid="tutorial-empty">
      <div className="empty-ico">📭</div>
      <div>暂无数据</div>
      <button
        type="button"
        className="empty-link"
        onClick={filtered ? onReset : onCreate}
        data-testid="tutorial-empty-action"
      >
        {filtered ? '清空筛选条件' : '新建教程'}
      </button>
    </div>
  )
}

// ── 页面 ────────────────────────────────────────────────────────────────────

export default function TutorialList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { toasts, push: toast } = useToasts()

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [keywordInput, setKeywordInput] = useState('')
  const [page, setPage] = useState(1)
  const [reloadFlag, setReloadFlag] = useState(0)

  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<AdminTutorial[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<TutorialStatus, number> | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  /** 行级操作互斥（提审防抖 AC-EG-03 / 弹窗确认按钮 loading 共用） */
  const [busyId, setBusyId] = useState<number | null>(null)
  const [confirmState, setConfirmState] = useState<{ kind: ConfirmKind; tutorial: AdminTutorial } | null>(null)

  const hasFilter = filters.status !== '' || filters.categoryId !== '' || filters.keyword.trim() !== ''
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    // 分类下拉数据：失败静默（仅剩"全部分类"），不阻塞主列表
    let alive = true
    get<{ list: Category[] }>('/api/categories')
      .then((d) => alive && setCategories(d.list))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    get<Page<AdminTutorial>>(buildListUrl(filters, page))
      .then((d) => {
        if (!alive) return
        setList(d.list)
        setTotal(d.total)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setList([])
        setTotal(0)
        setError(err instanceof Error ? err.message : '加载失败')
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [filters, page, reloadFlag])

  useEffect(() => {
    // 四态计数汇总（轻量 pageSize=1 计数，侧栏角标同款口径）：仅未筛选时取数，避免与命中数口径混淆
    if (hasFilter) {
      setCounts(null)
      return
    }
    let alive = true
    Promise.all(
      SUMMARY_STATUSES.map((s) =>
        get<Page<AdminTutorial>>(`/api/tutorials?status=${s}&page=1&pageSize=1`)
          .then((r) => r.total)
          .catch(() => 0),
      ),
    ).then((totals) => {
      if (!alive) return
      setCounts(Object.fromEntries(SUMMARY_STATUSES.map((s, i) => [s, totals[i]])) as Record<TutorialStatus, number>)
    })
    return () => {
      alive = false
    }
  }, [hasFilter, reloadFlag])

  /** 操作失败统一提示：403 → 后端"无权限执行该操作"；409 → 后端状态提示 + 刷新列表对齐最新态 */
  function toastActionError(err: unknown): void {
    toast(err instanceof Error ? err.message : '操作失败', 'error')
    if (err instanceof ApiError && err.code === 409) setReloadFlag((f) => f + 1)
  }

  function reload(): void {
    setReloadFlag((f) => f + 1)
  }

  /** 行内操作执行器：busyId 互斥实现提审防抖（AC-EG-03 静默防抖，仅发一次请求） */
  async function runRowAction(t: AdminTutorial, kind: RowActionKind): Promise<void> {
    if (busyId !== null) return
    const meta = ROW_ACTION_META[kind]
    setBusyId(t.id)
    try {
      await meta.run(t)
      toast(meta.okText)
      if (meta.reviewChanged) window.dispatchEvent(new CustomEvent(REVIEW_CHANGED_EVENT))
      reload()
    } catch (err) {
      toastActionError(err)
    } finally {
      setBusyId(null)
    }
  }

  /** 置顶/排序统一入口：PUT /top；成功 toast + 刷新，409（如"仅已发布教程可置顶"）走统一错误口径 */
  async function saveTopAndSort(t: AdminTutorial, patch: { isTop: number; sort: number }, okText: string): Promise<void> {
    if (busyId !== null) return
    setBusyId(t.id)
    try {
      await put(`/api/tutorials/${t.id}/top`, patch)
      toast(okText)
      reload()
    } catch (err) {
      toastActionError(err)
    } finally {
      setBusyId(null)
    }
  }

  function toggleTop(t: AdminTutorial): void {
    const isTop = t.isTop === 1 ? 0 : 1
    saveTopAndSort(
      t,
      { isTop, sort: t.sort },
      isTop === 1
        ? '已置顶，前台列表优先展示（置顶优先，其次按排序值）'
        : '已取消置顶，恢复按排序值与发布时间排列',
    )
  }

  function saveSort(t: AdminTutorial, raw: string): void {
    const parsed = Math.round(Number(raw))
    const next = Number.isFinite(parsed) ? Math.min(999, Math.max(0, parsed)) : 0
    if (next === t.sort) return // 未变化不请求
    saveTopAndSort(t, { isTop: t.isTop, sort: next }, `排序值已保存为 ${next}（同级越小越靠前，影响前台列表与上下篇）`)
  }

  /** 弹窗确认（下架/删除）：确认按钮 loading 至请求结束，成功关闭弹窗并刷新 */
  async function confirmPendingModal(): Promise<void> {
    if (!confirmState || busyId !== null) return
    const { kind, tutorial: t } = confirmState
    setBusyId(t.id)
    try {
      if (kind === 'offline') {
        await post(`/api/tutorials/${t.id}/offline`, {})
        toast('已下架，前台即时不可见，收藏夹标注「已下架」，操作已留痕')
      } else {
        await del(`/api/tutorials/${t.id}`)
        toast('已删除')
      }
      setConfirmState(null)
      reload()
    } catch (err) {
      toastActionError(err)
      setConfirmState(null) // 409 等场景行状态已变，关闭弹窗交由刷新后的操作集处理
    } finally {
      setBusyId(null)
    }
  }

  function applyFilters(patch: Partial<Filters>): void {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  function resetFilters(): void {
    setFilters(EMPTY_FILTERS)
    setKeywordInput('')
    setPage(1)
  }

  const handlers: RowHandlers = {
    onAction: (t, kind) => void runRowAction(t, kind),
    onEdit: (t) => navigate(`/tutorial/edit/${t.id}`),
    onOffline: (t) => setConfirmState({ kind: 'offline', tutorial: t }),
    onDelete: (t) => setConfirmState({ kind: 'delete', tutorial: t }),
    onToggleTop: toggleTop,
    onSaveSort: saveSort,
  }

  return (
    <div className="tutorial-list-page">
      <div className="page-head">
        <div>
          <div className="page-title">教程管理</div>
          <div className="page-desc">
            全状态展示：草稿 / 待审核 / 已发布 / 已下架 · 已发布教程编辑保存后自动回审，前台持续展示线上过审版本
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/tutorial/edit/new')}
          data-testid="create-tutorial-btn"
        >
          ＋ 新建教程
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label htmlFor="filter-status">状态</label>
            <select
              id="filter-status"
              className="select"
              value={filters.status}
              onChange={(e) => applyFilters({ status: e.target.value as Filters['status'] })}
              data-testid="filter-status-select"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="pending">待审核</option>
              <option value="published">已发布</option>
              <option value="offline">已下架</option>
            </select>
          </div>
          <div className="filter-item">
            <label htmlFor="filter-cate">分类</label>
            <CategorySelect
              categories={categories}
              value={filters.categoryId}
              onChange={(v) => applyFilters({ categoryId: v })}
            />
          </div>
          <div className="filter-item">
            <input
              className="keyword"
              type="text"
              placeholder="关键词：标题 / 摘要 / 标签"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters({ keyword: keywordInput })
              }}
              data-testid="filter-keyword-input"
            />
          </div>
          <button
            type="button"
            className="btn-search"
            onClick={() => applyFilters({ keyword: keywordInput })}
            data-testid="filter-search-btn"
          >
            🔍 搜索
          </button>
          <span
            className="link-reset"
            role="button"
            tabIndex={0}
            onClick={resetFilters}
            onKeyDown={(e) => {
              if (e.key === 'Enter') resetFilters()
            }}
            data-testid="filter-reset-btn"
          >
            重置
          </span>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="region-error" data-testid="tutorial-error">
            加载失败：{error}
            <button type="button" className="empty-link" onClick={reload} data-testid="tutorial-retry-btn">
              重试
            </button>
          </div>
        ) : list.length === 0 ? (
          <EmptyState filtered={hasFilter} onCreate={() => navigate('/tutorial/edit/new')} onReset={resetFilters} />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table table-lg" data-testid="tutorial-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>分类</th>
                    <th>作者</th>
                    <th>状态</th>
                    <th>浏览</th>
                    <th>收藏</th>
                    <th>有帮助率</th>
                    <th>置顶/排序</th>
                    <th>更新时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => (
                    <TutorialRow key={t.id} t={t} isAdmin={isAdmin} busy={busyId === t.id} h={handlers} />
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} pageCount={pageCount} total={total} counts={counts} filtered={hasFilter} onGo={setPage} />
          </>
        )}
      </div>

      {confirmState && (
        <ConfirmModal
          kind={confirmState.kind}
          tutorial={confirmState.tutorial}
          busy={busyId !== null}
          onCancel={() => setConfirmState(null)}
          onConfirm={() => void confirmPendingModal()}
        />
      )}
      <ToastHost toasts={toasts} />
    </div>
  )
}
