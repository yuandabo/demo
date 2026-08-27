/**
 * 浏览历史与阅读进度（IT-04/BE-02）：POST / GET /api/histories 两端点
 * 契约：docs/design/api/post-api-histories-tutorialId.md、get-api-histories.md
 * 核心规则：histories 联合主键 (user_id, tutorial_id) 进度单值覆盖（AC-RULE-11 跨端取最新值）、
 * 仅可对前台可见教程保存进度（AC-RULE-02 → 404）、列表按最近阅读时间倒序带进度百分比与
 * isOffline 下架标注（AC-FN-23 / AC-EG-10 数据来源）、upsert 幂等支撑前端静默重试（AC-EG-17）。
 * 挂载：由 routes/index.ts 统一挂载（并行任务协调点，本文件只导出 router）。
 */
import type { DatabaseSync } from 'node:sqlite'
import type { Request } from 'express'
import { Router } from 'express'
import { openDb, VISIBLE_SQL } from '../db.js'
import { requireAuth } from '../auth.js'
import { HttpError, ok } from '../response.js'

const router = Router()

// ── service 层（tech-design §11 冻结命名：upsertProgress / listHistories）──────

export interface ProgressSaveResult {
  tutorialId: number
  progress: number
  updatedAt: string
}

/**
 * 进度保存 upsert（AC-RULE-11 单值覆盖）：同一用户同一教程仅一条历史记录，
 * ON CONFLICT 覆盖 progress 并刷新 updated_at（最近阅读时间），不追加历史行；
 * 单语句原子无需显式事务；重复提交同值幂等（updated_at 照常刷新），支撑 AC-EG-17 前端静默重试。
 * progress 在服务层自校验（0-100 整数，与表 CHECK 约束同口径），入口前置失败 400；
 * 仅可对前台可见教程保存（VISIBLE_SQL 口径，AC-RULE-02，不可见 404）。
 */
export function upsertProgress(
  db: DatabaseSync,
  userId: number,
  tutorialId: number,
  progress: unknown
): ProgressSaveResult {
  // typeof 先行收窄（Number.isInteger 的 lib 签名无类型谓词），字符串/小数/越界统一 400
  if (typeof progress !== 'number' || !Number.isInteger(progress) || progress < 0 || progress > 100) {
    throw new HttpError(400, 'progress 必须为 0-100 的整数')
  }
  if (!db.prepare(`SELECT id FROM tutorials WHERE id = ? AND ${VISIBLE_SQL}`).get(tutorialId)) {
    throw new HttpError(404, '该教程不存在或暂不可见')
  }
  db.prepare(
    `INSERT INTO histories (user_id, tutorial_id, progress, updated_at)
     VALUES (?, ?, ?, datetime('now','localtime'))
     ON CONFLICT(user_id, tutorial_id) DO UPDATE SET
       progress = excluded.progress,
       updated_at = datetime('now','localtime')`
  ).run(userId, tutorialId, progress)
  const saved = db
    .prepare('SELECT progress, updated_at AS updatedAt FROM histories WHERE user_id = ? AND tutorial_id = ?')
    .get(userId, tutorialId) as { progress: number; updatedAt: string } | undefined
  // 联合主键行刚完成 upsert 必然可读回；读不到属服务端数据异常，兜底 500
  if (!saved) throw new HttpError(500, '进度保存失败')
  return { tutorialId, progress: Number(saved.progress), updatedAt: saved.updatedAt }
}

export interface HistoryItem {
  tutorialId: number
  title: string
  summary: string
  tags: string[]
  categoryId: number
  categoryName: string | null
  progress: number
  isOffline: boolean
  updatedAt: string
}

export interface HistoryPage {
  list: HistoryItem[]
  total: number
  page: number
  pageSize: number
}

/** 列表行：tutorials 经子查询按 VISIBLE_SQL 派生 isOffline（NOT 可见），杜绝口径漂移 */
interface HistoryRow {
  tutorialId: number
  title: string
  summary: string | null
  tags: string
  categoryId: number
  categoryName: string | null
  progress: number
  isOffline: number
  updatedAt: string
}

/**
 * 浏览历史列表：按最近阅读时间倒序（同秒按 tutorial_id 决胜负，AC-FN-23）；
 * 标题读 published_* 快照列；摘要 COALESCE(published_summary, summary) 保持前台口径
 * （CHANGE-3：无 v2 快照的教程回退工作列，与 favorites/recommend 同口径）；isOffline 供前端灰显"已下架"（AC-EG-10）；
 * 空列表返回 list:[] / total:0（非异常）。
 */
export function listHistories(
  db: DatabaseSync,
  userId: number,
  page: number,
  pageSize: number
): HistoryPage {
  const rows = db
    .prepare(
      `SELECT h.tutorial_id AS tutorialId, t.title, t.summary, t.tags, t.category_id AS categoryId,
              c.name AS categoryName, h.progress, t.isOffline, h.updated_at AS updatedAt
       FROM histories h
       JOIN (SELECT id, title, COALESCE(published_summary, summary) AS summary, tags, category_id,
                    NOT (${VISIBLE_SQL}) AS isOffline
             FROM tutorials) t ON t.id = h.tutorial_id
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE h.user_id = ?
       ORDER BY h.updated_at DESC, h.tutorial_id DESC
       LIMIT ? OFFSET ?`
    )
    .all(userId, pageSize, (page - 1) * pageSize) as unknown as HistoryRow[]
  const { total } = db
    .prepare('SELECT COUNT(*) AS total FROM histories WHERE user_id = ?')
    .get(userId) as { total: number }
  return {
    list: rows.map((row) => ({
      tutorialId: row.tutorialId,
      title: row.title,
      summary: row.summary ?? '',
      tags: parseTags(row.tags),
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      progress: Number(row.progress),
      isOffline: Boolean(row.isOffline),
      updatedAt: row.updatedAt,
    })),
    total: Number(total),
    page,
    pageSize,
  }
}

/** tags 列为 JSON 数组文本；脏数据（非法 JSON / 非数组）兜底空数组，不因单行坏数据 500 整页 */
function parseTags(raw: unknown): string[] {
  try {
    const parsed: unknown = JSON.parse(typeof raw === 'string' ? raw : '[]')
    return Array.isArray(parsed) ? parsed.map((tag) => String(tag)) : []
  } catch {
    return []
  }
}

// ── 路由层（参数校验 + 鉴权 + 编排）──────────────────────────────

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

/** requireAuth 已保证登录；本兜底防御路由未挂中间件被直接调用的场景 */
function currentUserId(req: Request): number {
  if (!req.user) throw new HttpError(401, '未登录或登录已失效')
  return req.user.id
}

/** 路径参数解析：非正整数（abc/0/-1/3.5/重复参数数组）一律按目标教程不存在处理 */
function parseTutorialId(raw: unknown): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/** 分页参数解析：缺省取默认值，出现即必须为范围内整数，否则 400（page≥1 / pageSize 1-100） */
function parsePagination(query: Record<string, unknown>): { page: number; pageSize: number } {
  const page = query.page === undefined ? DEFAULT_PAGE : toIntInRange(query.page, DEFAULT_PAGE, Number.MAX_SAFE_INTEGER)
  const pageSize =
    query.pageSize === undefined ? DEFAULT_PAGE_SIZE : toIntInRange(query.pageSize, 1, MAX_PAGE_SIZE)
  if (page === null || pageSize === null) {
    throw new HttpError(400, '查询参数不合法')
  }
  return { page, pageSize }
}

function toIntInRange(raw: unknown, min: number, max: number): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n >= min && n <= max ? n : null
}

router.post('/:tutorialId', requireAuth, (req, res) => {
  const tutorialId = parseTutorialId(req.params.tutorialId)
  if (tutorialId === null) throw new HttpError(404, '该教程不存在或暂不可见')
  const body = (req.body ?? {}) as { progress?: unknown }
  ok(res, upsertProgress(openDb(), currentUserId(req), tutorialId, body.progress))
})

router.get('/', requireAuth, (req, res) => {
  const { page, pageSize } = parsePagination(req.query)
  ok(res, listHistories(openDb(), currentUserId(req), page, pageSize))
})

export default router
