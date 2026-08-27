/**
 * 分类管理 4 端点（IT-02/BE-01，契约 docs/design/api/{get,post,put,delete}-api-categories*.md）：
 * GET 两级树（角标计数走 VISIBLE_SQL）/ POST 新增 / PUT 编辑（含模块映射与启停）/ DELETE 删除保护。
 * service 冻结命名（tech-design §11）：getCategoryTree / createCategory / updateCategory / deleteCategory。
 * 挂载：routes/index.ts 主 agent 统一落盘 apiRouter.use('/categories', categories)，本文件只导出 router。
 */
import type { DatabaseSync } from 'node:sqlite'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { Router } from 'express'
import { openDb, VISIBLE_SQL } from '../db.js'
import { authRequired, requireAuth, requireRole } from '../auth.js'
import { HttpError, ok } from '../response.js'
import {
  CATEGORY_STATUSES,
  ERP_MODULES,
  type CategoryRow,
  type CategoryStatus,
  type ErpModule,
} from '../state-machine.js'

const router = Router()

// ── 契约字面文案（验收断言依据，禁止改写）──────────────────────────
const MSG_NAME = '分类名称不能为空且不超过 50 字'
const MSG_PARENT_NOT_FOUND = '父分类不存在'
const MSG_NOT_FOUND = '分类不存在'
const MSG_TWO_LEVEL = '本期限两级分类，父分类必须为一级分类'
const MSG_CYCLE = '不允许将分类移动到自身或其子分类下'
const MSG_ERP_MODULE = 'erpModule 参数不合法'
const MSG_STATUS = 'status 参数不合法'
const MSG_BAD_QUERY = '查询参数不合法'
const MSG_HAS_TUTORIALS = '该分类下还有 N 篇教程，请先移走'
const MSG_HAS_CHILDREN = '该分类下存在子分类，请先处理'
const MSG_DELETED = '已删除'

const NAME_MAX_LENGTH = 50
const SORT_MIN = 0
const SORT_MAX = 9999
const DEFAULT_SORT = 0
const INITIAL_STATUS: CategoryStatus = 'enabled'

// ── service 层（纯函数 + db 参数，:memory: 可测）──────────────────

/** 树节点（GET 响应 data.list 元素；tutorialCount 仅 withCount=1 出现） */
export interface CategoryTreeNode {
  id: number
  name: string
  parentId: number | null
  sort: number
  status: CategoryStatus
  erpModule: ErpModule | null
  tutorialCount?: number
  children: CategoryTreeNode[]
}

export interface CategoryTreeOptions {
  /** withCount=1：附带前台可见口径角标（一级含树内子分类汇总，二级为直接计数） */
  withCount: boolean
  /** all=1（admin）：含停用分类全量树；缺省仅启用（前台口径） */
  includeDisabled: boolean
}

/** 写入入参原始字段（unknown：类型与业务校验收口在 service，路由层不重复校验） */
export interface CategoryPayload {
  name?: unknown
  parentId?: unknown
  sort?: unknown
  status?: unknown
  erpModule?: unknown
}

export interface CategoryCreated {
  id: number
  name: string
  parentId: number | null
  sort: number
  status: CategoryStatus
  erpModule: ErpModule | null
  createdAt: string
}

export interface CategoryUpdated extends Omit<CategoryCreated, 'createdAt'> {
  updatedAt: string
}

/**
 * 两级分类树：全表读出后内存组装（parentId=null 为一级，sort+id 升序）。
 * 非 all 口径过滤停用：停用一级整棵子树不出现、停用二级从父级 children 隐藏（AC-RULE-06/07）；
 * 角标计数按 VISIBLE_SQL 口径（回审期间旧版在线计入），且只统计树内节点——
 * 停用子分类下的教程不泄入启用父级角标。
 */
export function getCategoryTree(db: DatabaseSync, options: CategoryTreeOptions): { list: CategoryTreeNode[] } {
  const rows = db.prepare('SELECT * FROM categories ORDER BY sort ASC, id ASC').all() as unknown as CategoryRow[]
  const counts = options.withCount ? loadVisibleCounts(db) : null

  const isIncluded = (row: CategoryRow): boolean => options.includeDisabled || row.status === 'enabled'
  const directCount = (id: number): number => counts?.get(id) ?? 0
  const toNode = (row: CategoryRow): CategoryTreeNode => ({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    sort: row.sort,
    status: row.status,
    erpModule: row.erp_module,
    children: [],
  })

  const roots: CategoryRow[] = []
  const childrenByParent = new Map<number, CategoryRow[]>()
  for (const row of rows) {
    if (row.parent_id === null) {
      roots.push(row)
    } else {
      const siblings = childrenByParent.get(row.parent_id)
      if (siblings) siblings.push(row)
      else childrenByParent.set(row.parent_id, [row])
    }
  }

  const list: CategoryTreeNode[] = []
  for (const root of roots) {
    if (!isIncluded(root)) continue
    const node = toNode(root)
    node.children = (childrenByParent.get(root.id) ?? []).filter(isIncluded).map(toNode)
    if (counts) {
      node.tutorialCount = directCount(root.id) + node.children.reduce((sum, child) => sum + directCount(child.id), 0)
      for (const child of node.children) child.tutorialCount = directCount(child.id)
    }
    list.push(node)
  }
  return { list }
}

/** 新增分类（admin 路由编排）：name trim 后 1-50 落库，status 缺省 enabled，sort 缺省 0 */
export function createCategory(db: DatabaseSync, body: CategoryPayload): CategoryCreated {
  const name = requireName(body.name)
  const sort = body.sort === undefined ? DEFAULT_SORT : parseSort(body.sort)
  const status = body.status === undefined ? INITIAL_STATUS : parseStatus(body.status)
  const erpModule = body.erpModule === undefined || body.erpModule === null ? null : parseErpModule(body.erpModule)
  const parentId = resolveParentId(db, body.parentId, null)

  const { lastInsertRowid } = db
    .prepare('INSERT INTO categories (name, parent_id, sort, status, erp_module) VALUES (?, ?, ?, ?, ?)')
    .run(name, parentId, sort, status, erpModule)
  const row = findCategoryById(db, Number(lastInsertRowid))
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    sort: row.sort,
    status: row.status,
    erpModule: row.erp_module,
    createdAt: row.created_at,
  }
}

/** 编辑分类（admin 路由编排）：不传不改；parentId 支持防环/限两级校验；保存即刷新 updated_at */
export function updateCategory(db: DatabaseSync, id: number, body: CategoryPayload): CategoryUpdated {
  const current = findCategoryById(db, id)
  // 列名来自下方白名单字面量（非用户输入拼接），值全部参数化
  const assignments: Array<[column: string, value: string | number | null]> = []
  if (body.name !== undefined) assignments.push(['name', requireName(body.name)])
  if (body.sort !== undefined) assignments.push(['sort', parseSort(body.sort)])
  if (body.status !== undefined) assignments.push(['status', parseStatus(body.status)])
  if (body.erpModule !== undefined) {
    assignments.push(['erp_module', body.erpModule === null ? null : parseErpModule(body.erpModule)])
  }
  if (body.parentId !== undefined) assignments.push(['parent_id', resolveParentId(db, body.parentId, current)])

  const sets = assignments.map(([column]) => `${column} = ?`)
  sets.push("updated_at = datetime('now','localtime')")
  db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`)
    .run(...assignments.map(([, value]) => value), id)

  const row = findCategoryById(db, id)
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    sort: row.sort,
    status: row.status,
    erpModule: row.erp_module,
    updatedAt: row.updated_at,
  }
}

/**
 * 删除分类（admin 路由编排，AC-FN-13）：仅空分类放行物理删除。
 * 保护判定顺序：先统计该分类及其子分类下任意状态教程数 N（409"该分类下还有 N 篇教程，请先移走"），
 * 再判存在子分类（409"该分类下存在子分类，请先处理"，防两级树悬挂孤儿节点的工程兜底）。
 */
export function deleteCategory(db: DatabaseSync, id: number): void {
  findCategoryById(db, id)
  const childIds = (
    db.prepare('SELECT id FROM categories WHERE parent_id = ?').all(id) as unknown as Array<{ id: number }>
  ).map((row) => row.id)

  const scopeIds = [id, ...childIds]
  const { n } = db
    .prepare(`SELECT COUNT(*) AS n FROM tutorials WHERE category_id IN (${scopeIds.map(() => '?').join(',')})`)
    .get(...scopeIds) as { n: number }
  if (Number(n) >= 1) {
    throw new HttpError(409, MSG_HAS_TUTORIALS.replace('N', String(Number(n))))
  }
  if (childIds.length > 0) {
    throw new HttpError(409, MSG_HAS_CHILDREN)
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
}

// ── service 内部工具（校验与查询）──────────────────────────────────

/** 前台可见口径角标：一次 GROUP BY 消除逐分类计数（无 N+1） */
function loadVisibleCounts(db: DatabaseSync): Map<number, number> {
  const rows = db
    .prepare(
      `SELECT category_id AS categoryId, COUNT(*) AS n FROM tutorials WHERE ${VISIBLE_SQL} GROUP BY category_id`
    )
    .all() as unknown as Array<{ categoryId: number; n: number }>
  return new Map(rows.map((row) => [row.categoryId, Number(row.n)]))
}

function findCategoryById(db: DatabaseSync, id: number): CategoryRow {
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow | undefined
  if (!row) throw new HttpError(404, MSG_NOT_FOUND)
  return row
}

/** name：字符串 trim 后 1-50；其余（缺失/空白/超长/非字符串）统一 400 同文案 */
function requireName(raw: unknown): string {
  if (typeof raw !== 'string') throw new HttpError(400, MSG_NAME)
  const name = raw.trim()
  if (name.length < 1 || name.length > NAME_MAX_LENGTH) throw new HttpError(400, MSG_NAME)
  return name
}

/** sort：JSON 数值整数 0-9999（数字字符串/小数/越界一律 400，契约文案沿用"查询参数不合法"） */
function parseSort(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < SORT_MIN || raw > SORT_MAX) {
    throw new HttpError(400, MSG_BAD_QUERY)
  }
  return raw
}

function parseStatus(raw: unknown): CategoryStatus {
  if (typeof raw !== 'string' || !(CATEGORY_STATUSES as readonly string[]).includes(raw)) {
    throw new HttpError(400, MSG_STATUS)
  }
  return raw as CategoryStatus
}

function parseErpModule(raw: unknown): ErpModule {
  if (typeof raw !== 'string' || !(ERP_MODULES as readonly string[]).includes(raw)) {
    throw new HttpError(400, MSG_ERP_MODULE)
  }
  return raw as ErpModule
}

/**
 * parentId 语义解析（create/update 共用）：
 * undefined=不改/不挂（一级）；null=一级（update 表提升）；值须为存在的一级分类。
 * @param current update 时的目标分类行（防环比对），create 传 null
 */
function resolveParentId(db: DatabaseSync, raw: unknown, current: CategoryRow | null): number | null {
  if (raw === undefined) return null
  if (raw === null) return null
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw <= 0) {
    throw new HttpError(404, MSG_PARENT_NOT_FOUND)
  }
  const parent = db.prepare('SELECT * FROM categories WHERE id = ?').get(raw) as CategoryRow | undefined
  if (!parent) throw new HttpError(404, MSG_PARENT_NOT_FOUND)
  if (current && parent.id === current.id) {
    throw new HttpError(400, MSG_CYCLE)
  }
  if (parent.parent_id !== null) {
    // 父候选是二级：落在目标自身子树下 → 防环；否则 → 限两级
    if (current && parent.parent_id === current.id) throw new HttpError(400, MSG_CYCLE)
    throw new HttpError(400, MSG_TWO_LEVEL)
  }
  // 带子分类的一级挂到另一一级下：自身变二级、其子分类变三级 → 限两级拦截
  if (current && current.parent_id === null && parent.id !== current.id && hasChildren(db, current.id)) {
    throw new HttpError(400, MSG_TWO_LEVEL)
  }
  return parent.id
}

/** 是否存在直接子分类（LIMIT 1 存在性探测，仅供 parentId 迁移的限两级拦截校验用） */
function hasChildren(db: DatabaseSync, id: number): boolean {
  return db.prepare('SELECT 1 FROM categories WHERE parent_id = ? LIMIT 1').get(id) !== undefined
}

// ── 路由层（鉴权 + 参数解析 + 编排）────────────────────────────────

/** 0/1 query 开关：缺省/空串视为关；非 0/1（含重复参数数组）400 */
function parseFlag(raw: unknown): boolean {
  if (raw === undefined || raw === null || raw === '') return false
  if (raw === '0') return false
  if (raw === '1') return true
  throw new HttpError(400, MSG_BAD_QUERY)
}

/** 路径参数解析：非正整数按分类不存在处理（Express 5 params 值可为数组，取首项） */
function parseCategoryId(raw: string | string[]): number | null {
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * all=1 为管理参数：动态升权校验（未登录 401 / 非 admin 403，AC-RULE-22）；
 * 无 all 时 GET 公开（游客可读前台口径，AC-RULE-25）。
 */
const adminGateWhenAll: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (!parseFlag(req.query.all)) {
    next()
    return
  }
  authRequired(req, res, (err?: unknown) => {
    if (err !== undefined) {
      next(err)
      return
    }
    requireRole('admin')(req, res, next)
  })
}

// GET /api/categories 两级树（公开；withCount 角标 / all=1 管理态全量）
router.get('/', adminGateWhenAll, (req, res) => {
  ok(
    res,
    getCategoryTree(openDb(), {
      withCount: parseFlag(req.query.withCount),
      includeDisabled: parseFlag(req.query.all),
    })
  )
})

// POST /api/categories 新增（admin 专属，AC-OP-08 新增即启用）
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  ok(res, createCategory(openDb(), (req.body ?? {}) as CategoryPayload))
})

// PUT /api/categories/:id 编辑：名称/父分类/排序/启停/模块映射共用（AC-OP-04/09、AC-RULE-07）
router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const id = parseCategoryId(req.params.id)
  if (id === null) throw new HttpError(404, MSG_NOT_FOUND)
  ok(res, updateCategory(openDb(), id, (req.body ?? {}) as CategoryPayload))
})

// DELETE /api/categories/:id 删除（admin 专属，AC-FN-13 删除保护；契约 message 为"已删除"而非 ok）
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const id = parseCategoryId(req.params.id)
  if (id === null) throw new HttpError(404, MSG_NOT_FOUND)
  deleteCategory(openDb(), id)
  res.status(200).json({ code: 0, message: MSG_DELETED, data: null })
})

export default router
