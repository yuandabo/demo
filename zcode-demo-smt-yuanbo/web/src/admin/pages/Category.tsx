import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { ApiError, del, get, post, put } from '../../shared/api'
import { ERP_MODULE_LABELS, ERP_MODULES } from '../../shared/constants'
import type { AdminTutorial, Category, CategoryCreated, CategoryUpdated, ErpModule, Page } from '../../shared/types'
import { ToastHost, useToasts } from '../components/Toast'

/**
 * 目录管理（FE-06，admin 专属）：左两级分类树（折叠/选中/角标/启停/删除/同级拖拽排序）+
 * 右编辑表单（名称≤50/父分类限一级/模块映射 8 选 1/排序值/启停）。
 * 删除保护（AC-FN-13）：DELETE 409 → 阻断弹窗（N 篇教程 + 迁移建议），空分类二次确认后删除；
 * 模块映射保存提示推荐/内嵌入口生效（AC-OP-04）；新增二级不进宫格仅进筛选树（AC-OP-08）；
 * 停用行灰显 + 前台影响提示（AC-RULE-06/07）；拖拽与排序值双通道调序（UI-IXD-12）。
 * 复刻源：docs/ui/ui_admin_category.html；原型部分树行无删除按钮，按任务页面元素表统一所有行提供删除入口。
 */

const NAME_MAX = 50
const SORT_MIN = 1
const SORT_MAX = 999
const MSG_NAME_INVALID = '分类名称不能为空且不超过 50 字'
const MSG_SORT_INVALID = '排序值须为 1-999 的整数'
const TOAST_SAVED = '已保存分类：前台宫格与列表顺序按排序值即时更新'
const TOAST_MODULE_EFFECT = '模块映射已更新：角色推荐与 ERP 内嵌入口将按新映射生效'
const TOAST_CHILD_NOT_IN_GRID = '二级分类不进入首页宫格，仅出现在前台筛选树'
const TOAST_SORT_SAVED = '排序已保存：前台宫格与列表顺序同步更新'
const BLOCK_SUB_TUTORIALS = '删除保护命中：分类下存在任意状态的教程（含草稿）即阻断删除。'
const BLOCK_SUB_CHILDREN = '该分类下存在子分类，需先处理子分类后才能删除（防止两级树悬挂孤儿节点）。'
const ADVICE_CHILDREN = '处理建议：请先删除或迁移其下子分类后，再删除该分类。'
const ADVICE_LOADING = '正在获取该分类下的教程清单…'
const ADVICE_FALLBACK = '处理建议：请将该分类下的教程迁移到其它分类后重试删除。'

/** 表单草稿：'' 表示「不限/无」（erpModule=null / 一级分类），sort 以字符串承接输入态 */
interface CatForm {
  name: string
  parentId: number | ''
  erpModule: ErpModule | ''
  sort: string
  status: 'enabled' | 'disabled'
}

/** 右卡模式：编辑选中节点 / 新增态 / 未选中期（初始与删除选中节点后） */
type FormMode = { kind: 'edit'; id: number } | { kind: 'create' } | null

/** 删除弹窗：空分类二次确认 / 409 阻断（message 为后端契约文案，含 N）/ null 关闭 */
type DelModal =
  | { kind: 'confirm'; node: Category }
  | { kind: 'blocked'; message: string; advice: string | null }
  | null

const EMPTY_FORM: CatForm = { name: '', parentId: '', erpModule: '', sort: '', status: 'enabled' }

/** 深度遍历找节点（两级树） */
function findNode(list: Category[], id: number): Category | null {
  for (const root of list) {
    if (root.id === id) return root
    const hit = root.children.find((c) => c.id === id)
    if (hit) return hit
  }
  return null
}

/** 同级排序目标值：新增默认排在同级末尾（max+1，UI-IXD-12 排序值通道） */
function nextSort(siblings: Category[]): number {
  return siblings.reduce((max, c) => Math.max(max, c.sort), 0) + 1
}

function fromNode(node: Category): CatForm {
  return {
    name: node.name,
    parentId: node.parentId ?? '',
    erpModule: node.erpModule ?? '',
    sort: String(node.sort),
    status: node.status,
  }
}

// ── 树行（一级/二级共用；二级 child=true 缩进且折叠箭头隐藏） ──────────────────

interface RowHandlers {
  onSelect: () => void
  onToggle: () => void
  onFlipStatus: () => void
  onAskDelete: () => void
  onDragStart: () => void
  onDragOver: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
  onDragEnd: () => void
}

function CategoryRow({
  node,
  child,
  selected,
  expanded,
  switchBusy,
  dragOver,
  dragging,
  handlers,
}: {
  node: Category
  child: boolean
  selected: boolean
  expanded: boolean
  switchBusy: boolean
  dragOver: boolean
  dragging: boolean
  handlers: RowHandlers
}) {
  const count = node.tutorialCount ?? 0
  const hasChildren = node.children.length > 0
  return (
    <div
      className={`tree-row${child ? ' child-row' : ''}${selected ? ' selected' : ''}${node.status === 'disabled' ? ' disabled-row' : ''}${dragOver ? ' drag-over' : ''}${dragging ? ' dragging' : ''}`}
      data-testid={`cate-row-${node.id}`}
      onClick={handlers.onSelect}
      onDragOver={handlers.onDragOver}
      onDrop={handlers.onDrop}
    >
      <span
        className="grip"
        title="拖拽排序（同级）"
        draggable
        onDragStart={handlers.onDragStart}
        onDragEnd={handlers.onDragEnd}
        data-testid={`cate-grip-${node.id}`}
      >
        ⠿
      </span>
      <span
        className={`caret${hasChildren && !child ? (expanded ? ' open' : '') : ' leaf'}`}
        onClick={
          hasChildren && !child
            ? (e) => {
                e.stopPropagation() // 原型 toggleKids 同口径：点箭头仅折叠/展开，不触发行选中
                handlers.onToggle()
              }
            : undefined
        }
        data-testid={`cate-caret-${node.id}`}
      >
        ▶
      </span>
      <span className="node-name">{node.name}</span>
      <span className="sort-no">#{node.sort}</span>
      <span className="mod-tag">{node.erpModule ? ERP_MODULE_LABELS[node.erpModule] : '不限'}</span>
      <span className={`cnt-tag${count === 0 ? ' zero' : ''}`} data-testid={`cate-count-${node.id}`}>
        {count === 0 ? '0 篇 · 待补充' : `${count} 篇`}
      </span>
      <div className="node-ops">
        <label
          className="switch"
          onClick={(e) => e.stopPropagation()}
          title={node.status === 'enabled' ? '停用（前台隐藏，教程仍可经收藏/历史/直达访问）' : '启用（前台恢复显示）'}
        >
          <input
            type="checkbox"
            checked={node.status === 'enabled'}
            disabled={switchBusy}
            onChange={handlers.onFlipStatus}
            data-testid={`cate-switch-${node.id}`}
          />
          <span className="slider" />
        </label>
        <button
          type="button"
          className="op op-danger"
          onClick={(e) => {
            e.stopPropagation()
            handlers.onAskDelete()
          }}
          data-testid={`cate-del-${node.id}`}
        >
          删除
        </button>
      </div>
    </div>
  )
}

// ── 删除弹窗（confirm / blocked 两态，复刻原型阻断样式） ─────────────────────

function ConfirmDeleteModal({ node, busy, onCancel, onConfirm }: { node: Category; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-mask show" data-testid="cate-del-modal">
      <div className="modal category-del-modal">
        <div className="modal-title">🗑 删除分类</div>
        <div className="modal-body">
          确认删除分类《<b>{node.name}</b>》？删除后不可恢复，前台分类宫格与筛选树即时移除。
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onCancel} disabled={busy} data-testid="cate-del-cancel-btn">
            取消
          </button>
          <button
            type="button"
            className="btn btn-modal-danger"
            disabled={busy}
            onClick={onConfirm}
            data-testid="cate-del-confirm-btn"
          >
            {busy ? '删除中…' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BlockedDeleteModal({ message, advice, onClose }: { message: string; advice: string | null; onClose: () => void }) {
  const isTutorials = message.includes('教程')
  return (
    <div className="modal-mask show" data-testid="cate-del-modal">
      <div className="modal category-del-modal">
        <div className="modal-title">🗑 删除分类</div>
        <div className="modal-block">
          <span>⛔</span>
          <div>
            无法删除：<b data-testid="cate-block-message">{message}</b>
            <br />
            {isTutorials ? BLOCK_SUB_TUTORIALS : BLOCK_SUB_CHILDREN}
          </div>
        </div>
        <div className="modal-body" data-testid="cate-block-advice">
          {advice ?? ADVICE_LOADING}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose} data-testid="cate-del-cancel-btn">
            取消
          </button>
          <button
            type="button"
            className="btn btn-modal-danger"
            onClick={onClose}
            data-testid="cate-del-know-btn"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 页面 ────────────────────────────────────────────────────────────────────

export default function CategoryPage() {
  const { toasts, push: toast } = useToasts()

  const [tree, setTree] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<FormMode>(null)
  const [form, setForm] = useState<CatForm>(EMPTY_FORM)
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busySwitchId, setBusySwitchId] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(new Set())
  const [delModal, setDelModal] = useState<DelModal>(null)
  const [delBusy, setDelBusy] = useState(false)
  const [dragId, setDragId] = useState<number | null>(null)
  const [overId, setOverId] = useState<number | null>(null)

  /** 全量树（含停用 + 角标计数），写操作后统一重取并返回最新列表供选中回填 */
  const loadTree = useCallback(async (): Promise<Category[]> => {
    setLoading(true)
    try {
      const d = await get<{ list: Category[] }>('/api/categories?withCount=1&all=1')
      setTree(d.list)
      setError(null)
      return d.list
    } catch (err) {
      setTree([])
      setError(err instanceof Error ? err.message : '加载失败')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTree()
  }, [loadTree])

  const selectedNode = mode?.kind === 'edit' ? findNode(tree, mode.id) : null
  const nameLen = form.name.trim().length
  const nameInvalid = nameLen < 1 || nameLen > NAME_MAX
  const sortNum = Number(form.sort)
  const sortInvalid = !/^\d+$/.test(form.sort.trim()) || !Number.isInteger(sortNum) || sortNum < SORT_MIN || sortNum > SORT_MAX
  const formInvalid = nameInvalid || sortInvalid

  /** 父分类仅一级可选（两级约束的选项即约束）；编辑一级时排除自身（防环） */
  const parentOptions = useMemo(
    () => tree.filter((c) => mode?.kind !== 'edit' || c.id !== mode.id),
    [tree, mode],
  )

  /** 树加载失败/为空时提示可重试；为空引导新增（交互 1 空态） */
  const firstLevelCount = tree.length

  // ── 选择 / 新增 / 重置 ────────────────────────────────────────────────────

  function selectNode(node: Category): void {
    setMode({ kind: 'edit', id: node.id })
    setForm(fromNode(node))
    setShowErrors(false)
  }

  function enterCreate(): void {
    setMode({ kind: 'create' })
    setForm({ ...EMPTY_FORM, sort: String(nextSort(tree)) })
    setShowErrors(false)
  }

  function resetForm(): void {
    if (mode?.kind === 'edit' && selectedNode) selectNode(selectedNode)
    else if (mode?.kind === 'create') enterCreate()
  }

  // ── 保存（新增 POST / 编辑 PUT，任务交互 2/3） ────────────────────────────

  /** 写后统一动作：重取树 + 选中目标节点回填（找不到保持未选中期） */
  async function reloadAndSelect(id: number | null): Promise<void> {
    const list = await loadTree()
    const node = id === null ? null : findNode(list, id)
    if (node) selectNode(node)
    else if (mode?.kind === 'edit') {
      setMode(null)
      setForm(EMPTY_FORM)
    }
  }

  async function save(): Promise<void> {
    if (formInvalid) {
      setShowErrors(true)
      return
    }
    setSaving(true)
    const parentId = form.parentId === '' ? null : form.parentId
    const erpModule = form.erpModule === '' ? null : form.erpModule
    const sort = sortNum
    try {
      if (mode?.kind === 'create') {
        const created = await post<CategoryCreated>('/api/categories', { name: form.name.trim(), parentId, sort, erpModule })
        toast(TOAST_SAVED)
        // 二级分类保存成功即提示不进宫格（AC-OP-08 后半）
        if (parentId !== null) toast(TOAST_CHILD_NOT_IN_GRID)
        await reloadAndSelect(created.id)
      } else if (mode?.kind === 'edit') {
        await put<CategoryUpdated>(`/api/categories/${mode.id}`, {
          name: form.name.trim(),
          parentId,
          sort,
          status: form.status,
          erpModule,
        })
        const origin = selectedNode
        toast(TOAST_SAVED)
        // 模块映射变化 → 推荐/内嵌入口提示（AC-OP-04）；启停变化 → 前台影响语义（AC-RULE-06/07）
        if (origin && (origin.erpModule ?? '') !== form.erpModule) toast(TOAST_MODULE_EFFECT)
        if (origin && origin.status !== form.status) {
          toast(
            form.status === 'disabled'
              ? `已停用「${form.name.trim()}」：前台宫格与筛选树隐藏，其下已发布教程仍可经收藏/历史/直达链接访问`
              : `已启用「${form.name.trim()}」：前台宫格与筛选树恢复显示，重新参与搜索与推荐命中`,
          )
        }
        await reloadAndSelect(mode.id)
      }
    } catch (err) {
      // 400/404/403 按后端契约文案 toast，表单数据保留（阶段 2 错误处理）
      toast(err instanceof Error ? err.message : '保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── 行内启停（PUT status 即时保存，交互 3） ───────────────────────────────

  async function flipStatus(node: Category): Promise<void> {
    if (busySwitchId !== null) return
    setBusySwitchId(node.id)
    const next = node.status === 'enabled' ? 'disabled' : 'enabled'
    try {
      await put<CategoryUpdated>(`/api/categories/${node.id}`, { status: next })
      toast(
        next === 'disabled'
          ? `已停用「${node.name}」：前台宫格与筛选树隐藏，其下已发布教程仍可经收藏/历史/直达链接访问`
          : `已启用「${node.name}」：前台宫格与筛选树恢复显示，重新参与搜索与推荐命中`,
      )
      await loadTree()
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败', 'error')
      await loadTree() // 失败回滚视觉态（树为唯一真源）
    } finally {
      setBusySwitchId(null)
    }
  }

  // ── 删除（二次确认 / 409 阻断，AC-FN-13） ────────────────────────────────

  /** 阻断弹窗迁移建议：列出该分类（含子分类）下教程名（categoryId 命中含子分类），前 3 篇 + 总数 */
  async function loadAdvice(nodeId: number): Promise<string> {
    try {
      const d = await get<Page<AdminTutorial>>(`/api/tutorials?all=1&categoryId=${nodeId}&page=1&pageSize=50`)
      const titles = d.list.map((t) => t.title)
      if (titles.length === 0) return ADVICE_FALLBACK
      const shown = titles.slice(0, 3).map((t) => `《${t}》`).join('')
      return `处理建议：将${shown}${titles.length > 3 ? ` 等 ${titles.length} 篇` : ''}教程迁移到其它分类后，方可删除该分类。`
    } catch {
      return ADVICE_FALLBACK
    }
  }

  /** 角标/子分类已可见即阻断（交互 4：直接 DELETE 取权威 409）；否则先二次确认 */
  function askDelete(node: Category): void {
    if ((node.tutorialCount ?? 0) > 0 || node.children.length > 0) void requestDelete(node)
    else setDelModal({ kind: 'confirm', node })
  }

  async function requestDelete(node: Category): Promise<void> {
    setDelBusy(true)
    try {
      await del(`/api/categories/${node.id}`)
      setDelModal(null)
      toast(`已删除分类「${node.name}」，前台宫格与筛选树即时移除`)
      await reloadAndSelect(null)
    } catch (err) {
      if (err instanceof ApiError && err.code === 409) {
        // 409 = 删除保护阻断（教程 N 篇 / 存在子分类），分类保留在树中（AC-FN-13）
        const isTutorials = err.message.includes('教程')
        setDelModal({ kind: 'blocked', message: err.message, advice: isTutorials ? null : ADVICE_CHILDREN })
        // 迁移建议（列教程名）仅教程类 409 需要；子分类 409 的建议已定，勿被空清单兜底覆盖
        if (isTutorials) {
          const advice = await loadAdvice(node.id)
          setDelModal((m) => (m?.kind === 'blocked' && m.message === err.message ? { ...m, advice } : m))
        }
      } else {
        setDelModal(null)
        toast(err instanceof Error ? err.message : '删除失败', 'error')
      }
    } finally {
      setDelBusy(false)
    }
  }

  // ── 同级拖拽排序（UI-IXD-12 拖拽通道：重排后按位置重编 1..n，仅提交变更项） ─

  function siblingsOf(node: Category): Category[] {
    return node.parentId === null ? tree : (findNode(tree, node.parentId)?.children ?? [])
  }

  function handleDragOver(target: Category, e: DragEvent): void {
    const source = dragId === null ? null : findNode(tree, dragId)
    if (!source || source.parentId !== target.parentId) return // 仅同级可放置
    e.preventDefault()
    setOverId(target.id)
  }

  async function handleDrop(target: Category, e: DragEvent): Promise<void> {
    e.preventDefault()
    const source = dragId === null ? null : findNode(tree, dragId)
    setDragId(null)
    setOverId(null)
    if (!source || source.id === target.id || source.parentId !== target.parentId) return
    const siblings = siblingsOf(source)
    const from = siblings.findIndex((c) => c.id === source.id)
    const to = siblings.findIndex((c) => c.id === target.id)
    if (from < 0 || to < 0 || from === to) return
    const reordered = [...siblings]
    reordered.splice(to, 0, ...reordered.splice(from, 1))
    // 变更判定须按「分类自身」新旧 sort 比较：位置对位置比较在相邻移动时会错位抵消（见 FE-06 实测）
    const oldSortById = new Map(siblings.map((c) => [c.id, c.sort]))
    const changed = reordered.map((c, i) => ({ id: c.id, sort: i + 1 })).filter((c) => c.sort !== oldSortById.get(c.id))
    if (changed.length === 0) return
    try {
      await Promise.all(changed.map((c) => put<CategoryUpdated>(`/api/categories/${c.id}`, { sort: c.sort })))
      toast(TOAST_SORT_SAVED)
      await loadTree()
    } catch (err) {
      toast(err instanceof Error ? err.message : '排序保存失败', 'error')
      await loadTree()
    }
  }

  // ── 渲染 ─────────────────────────────────────────────────────────────────

  const rowHandlers = (node: Category): RowHandlers => ({
    onSelect: () => selectNode(node),
    onToggle: () =>
      setCollapsed((prev) => {
        const next = new Set(prev)
        if (next.has(node.id)) next.delete(node.id)
        else next.add(node.id)
        return next
      }),
    onFlipStatus: () => void flipStatus(node),
    onAskDelete: () => askDelete(node),
    onDragStart: () => setDragId(node.id),
    onDragOver: (e) => handleDragOver(node, e),
    onDrop: (e) => void handleDrop(node, e),
    onDragEnd: () => {
      setDragId(null)
      setOverId(null)
    },
  })

  const isCreate = mode?.kind === 'create'
  const formTitle = isCreate ? '新增分类' : '编辑分类'
  const formTarget = isCreate
    ? '默认启用 · 保存后进入分类树'
    : selectedNode
      ? `当前：${selectedNode.name}`
      : '未选中（点击左侧树行，或点右上「新增分类」）'

  return (
    <div className="category-page" data-testid="category-page">
      <div className="page-head">
        <div>
          <div className="page-title">目录管理</div>
          <div className="page-desc">
            本期限两级分类树 · 同级拖拽或调整排序值影响前台宫格与列表顺序 · 分类下存在教程时禁止删除
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={enterCreate} data-testid="cate-new-btn">
          ＋ 新增分类
        </button>
      </div>

      <div className="cate-grid">
        {/* 左：分类树 */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">分类树</div>
            <div className="card-note" data-testid="cate-tree-note">
              共 {firstLevelCount} 个一级分类 · 点击行选中后右侧编辑
            </div>
          </div>
          {loading ? (
            <div data-testid="cate-skeleton">
              {Array.from({ length: 8 }, (_, i) => (
                <div className="sk sk-row" key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="region-error" data-testid="cate-error">
              加载失败：{error}
              <button
                type="button"
                className="empty-link"
                onClick={() => void loadTree()}
                data-testid="cate-retry-btn"
              >
                重试
              </button>
            </div>
          ) : tree.length === 0 ? (
            <div className="empty-box" data-testid="cate-empty">
              <div className="empty-ico">🌲</div>
              <div>暂无分类</div>
              <button type="button" className="empty-link" onClick={enterCreate} data-testid="cate-empty-new-btn">
                点击新增第一个分类
              </button>
            </div>
          ) : (
            <div className="tree" data-testid="cate-tree">
              {tree.map((root) => {
                const expanded = !collapsed.has(root.id)
                return (
                  <Fragment key={root.id}>
                    <CategoryRow
                      node={root}
                      child={false}
                      selected={mode?.kind === 'edit' && mode.id === root.id}
                      expanded={expanded}
                      switchBusy={busySwitchId === root.id}
                      dragOver={overId === root.id}
                      dragging={dragId === root.id}
                      handlers={rowHandlers(root)}
                    />
                    {root.children.length > 0 && expanded && (
                      <div className="children open">
                        {root.children.map((c) => (
                          <CategoryRow
                            key={c.id}
                            node={c}
                            child
                            selected={mode?.kind === 'edit' && mode.id === c.id}
                            expanded={false}
                            switchBusy={busySwitchId === c.id}
                            dragOver={overId === c.id}
                            dragging={dragId === c.id}
                            handlers={rowHandlers(c)}
                          />
                        ))}
                      </div>
                    )}
                  </Fragment>
                )
              })}
            </div>
          )}
          <div className="tree-foot">
            说明：⠿ 为同级拖拽把手（拖拽与排序值二选一，均影响前台宫格与列表顺序）；停用分类前台宫格与筛选隐藏，其下已发布教程仍可经收藏/历史/直达链接访问。
          </div>
        </div>

        {/* 右：编辑表单 */}
        <div className="card">
          <div className="card-head">
            <div className="card-title" data-testid="cate-form-title">
              {formTitle}
            </div>
            <div className="card-note" data-testid="cate-form-target">
              {formTarget}
            </div>
          </div>
          <div className="form-row">
            <div className="form-label">
              <span>
                <span className="req">*</span>分类名称
              </span>
              {/* 不设 maxLength：保留超长输入以展示 ≤50 字校验提示（阶段 2 校验实测） */}
              <span className={`char-count${nameLen > NAME_MAX ? ' over' : ''}`}>{nameLen}/{NAME_MAX}</span>
            </div>
            <input
              className={`input${showErrors && nameInvalid ? ' field-error' : ''}`}
              type="text"
              value={form.name}
              placeholder="请输入分类名称"
              disabled={mode === null}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              data-testid="cate-name-input"
            />
            {showErrors && nameInvalid && (
              <div className="form-hint err" data-testid="cate-name-error">
                {MSG_NAME_INVALID}
              </div>
            )}
          </div>
          <div className="form-row">
            <div className="form-label">
              <span>父分类（本期限两级）</span>
            </div>
            <select
              className="select"
              value={form.parentId}
              disabled={mode === null}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value === '' ? '' : Number(e.target.value) }))}
              data-testid="cate-parent-select"
            >
              <option value="">无（作为一级分类）</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="form-hint">仅一级分类可作为父分类（选项即约束）；二级分类不进入首页宫格，仅出现在筛选树</div>
          </div>
          <div className="form-row">
            <div className="form-label">
              <span>ERP 模块映射（8 选 1 或不限）</span>
            </div>
            <select
              className="select"
              value={form.erpModule}
              disabled={mode === null}
              onChange={(e) =>
                setForm((f) => ({ ...f, erpModule: e.target.value === '' ? '' : (e.target.value as ErpModule) }))
              }
              data-testid="cate-module-select"
            >
              <option value="">不限</option>
              {ERP_MODULES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <div className="form-hint">映射驱动角色推荐与 ERP 工作台“查看教程”入口的命中集（如：仓库角色 → 库存管理）</div>
          </div>
          <div className="form-row">
            <div className="form-label">
              <span>排序值（同级内升序）</span>
            </div>
            <input
              className={`input${showErrors && sortInvalid ? ' field-error' : ''}`}
              type="number"
              min={SORT_MIN}
              max={SORT_MAX}
              value={form.sort}
              disabled={mode === null}
              onChange={(e) => setForm((f) => ({ ...f, sort: e.target.value }))}
              data-testid="cate-sort-input"
            />
            {showErrors && sortInvalid && (
              <div className="form-hint err" data-testid="cate-sort-error">
                {MSG_SORT_INVALID}
              </div>
            )}
            <div className="form-hint">置顶优先，其余按排序值与发布时间排列，影响前台分类宫格与上下篇顺序</div>
          </div>
          <div className="form-row">
            <div className="switch-line">
              <div>
                <div className="t">启用状态</div>
                <div className="d">停用后前台隐藏（宫格/筛选）</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.status === 'enabled'}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? 'enabled' : 'disabled' }))}
                  data-testid="cate-status-switch"
                />
                <span className="slider" />
              </label>
            </div>
          </div>
          <div className="form-foot">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving || mode === null}
              onClick={() => void save()}
              data-testid="cate-save-btn"
            >
              {saving ? '保存中…' : '保存'}
            </button>
            <button
              type="button"
              className="btn"
              disabled={mode === null}
              onClick={resetForm}
              data-testid="cate-reset-btn"
            >
              重置
            </button>
            {mode?.kind === 'edit' && (
              <button
                type="button"
                className="btn btn-ghost-danger"
                onClick={() => selectedNode && askDelete(selectedNode)}
                data-testid="cate-delete-btn"
              >
                删除该分类
              </button>
            )}
          </div>
          <div className="btn-block-warning">
            ⚠ 删除保护：分类下存在<b style={{ color: 'var(--warn)' }}>任意状态</b>
            的教程时阻断删除，提示“请先移走 N 篇教程”；存在子分类同样阻断。选中分类后点击“删除该分类”可查看保护效果。
          </div>
        </div>
      </div>

      {delModal?.kind === 'confirm' && (
        <ConfirmDeleteModal
          node={delModal.node}
          busy={delBusy}
          onCancel={() => setDelModal(null)}
          onConfirm={() => void requestDelete(delModal.node)}
        />
      )}
      {delModal?.kind === 'blocked' && (
        <BlockedDeleteModal message={delModal.message} advice={delModal.advice} onClose={() => setDelModal(null)} />
      )}
      <ToastHost toasts={toasts} />
    </div>
  )
}
