/**
 * 收藏管理（IT-04/BE-01）：POST / DELETE / GET /api/favorites 三端点
 * 契约：docs/design/api/{post,delete}-api-favorites-tutorialId.md、get-api-favorites.md
 * 核心规则：联合主键幂等、fav_count 事务联动（AC-RULE-09 当前有效收藏数）、
 * 已下架条目列表保留并派生 isOffline（AC-RULE-04 / AC-FN-20 / AC-EG-10 数据来源）。
 * 挂载：由 routes/index.ts 统一挂载（并行任务协调点，本文件只导出 router）。
 */
import type { DatabaseSync } from 'node:sqlite'
import type { Request } from 'express'
import { Router } from 'express'
import { openDb, VISIBLE_SQL } from '../db.js'
import { requireAuth } from '../auth.js'
import { HttpError, ok } from '../response.js'

const router = Router()

// ── service 层（tech-design §11 冻结命名：toggleFavorite / listFavorites）──────

export interface FavoriteToggleResult {
  tutorialId: number
  favorited: boolean
  favCount: number
}

/**
 * 收藏/取消收藏（增删合一），关系写入与 fav_count 联动在同一事务（计数与关系永不分家）：
 * - 收藏：仅限前台可见教程（VISIBLE_SQL 口径，AC-FN-20 不可见不可收藏），
 *   INSERT OR IGNORE 幂等，仅首次插入 +1；
 * - 取消：不校验可见性（已下架教程的收藏也可取消，AC-EG-10），仅首次删除 -1，
 *   fav_count > 0 条件兜底不落负。
 */
export function toggleFavorite(
  db: DatabaseSync,
  userId: number,
  tutorialId: number,
  favorited: boolean
): FavoriteToggleResult {
  const existsSql = favorited
    ? `SELECT id FROM tutorials WHERE id = ? AND ${VISIBLE_SQL}`
    : 'SELECT id FROM tutorials WHERE id = ?'
  if (!db.prepare(existsSql).get(tutorialId)) {
    throw new HttpError(404, favorited ? '该教程不存在或暂不可见' : '教程不存在')
  }

  db.exec('BEGIN')
  try {
    if (favorited) {
      // 联合主键幂等：changes=0 表示已收藏过，跳过计数联动
      const { changes } = db
        .prepare('INSERT OR IGNORE INTO favorites (user_id, tutorial_id) VALUES (?, ?)')
        .run(userId, tutorialId)
      if (Number(changes) === 1) {
        db.prepare('UPDATE tutorials SET fav_count = fav_count + 1 WHERE id = ?').run(tutorialId)
      }
    } else {
      const { changes } = db
        .prepare('DELETE FROM favorites WHERE user_id = ? AND tutorial_id = ?')
        .run(userId, tutorialId)
      if (Number(changes) === 1) {
        db.prepare('UPDATE tutorials SET fav_count = fav_count - 1 WHERE id = ? AND fav_count > 0').run(tutorialId)
      }
    }
    const { favCount } = db
      .prepare('SELECT fav_count AS favCount FROM tutorials WHERE id = ?')
      .get(tutorialId) as { favCount: number }
    db.exec('COMMIT')
    return { tutorialId, favorited, favCount: Number(favCount) }
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export interface FavoriteItem {
  tutorialId: number
  title: string
  summary: string
  tags: string[]
  categoryId: number
  categoryName: string | null
  isOffline: boolean
  viewCount: number
  favCount: number
  publishedAt: string | null
  updatedAt: string
  favoritedAt: string
}

export interface FavoritePage {
  list: FavoriteItem[]
  total: number
  page: number
  pageSize: number
}

/** 列表行：tutorials 经子查询按 VISIBLE_SQL 派生 isOffline（NOT 可见），杜绝口径漂移 */
interface FavoriteRow {
  tutorialId: number
  title: string
  summary: string | null
  tags: string
  categoryId: number
  categoryName: string | null
  viewCount: number
  favCount: number
  publishedAt: string | null
  updatedAt: string
  favoritedAt: string
  isOffline: number
}

/** 我的收藏列表：收藏时间倒序（同秒按 tutorial_id 决胜负）；摘要 COALESCE(published_summary, summary) 保持前台口径（CHANGE-3，与 recommend 同口径） */
export function listFavorites(
  db: DatabaseSync,
  userId: number,
  page: number,
  pageSize: number
): FavoritePage {
  const rows = db
    .prepare(
      `SELECT f.tutorial_id AS tutorialId, t.title, t.summary, t.tags, t.category_id AS categoryId,
              c.name AS categoryName, t.view_count AS viewCount, t.fav_count AS favCount,
              t.published_at AS publishedAt, t.updated_at AS updatedAt, f.created_at AS favoritedAt,
              t.isOffline
       FROM favorites f
       JOIN (SELECT id, title, COALESCE(published_summary, summary) AS summary, tags, category_id,
                    view_count, fav_count, published_at, updated_at,
                    NOT (${VISIBLE_SQL}) AS isOffline
             FROM tutorials) t ON t.id = f.tutorial_id
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC, f.tutorial_id DESC
       LIMIT ? OFFSET ?`
    )
    .all(userId, pageSize, (page - 1) * pageSize) as unknown as FavoriteRow[]
  const { total } = db
    .prepare('SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?')
    .get(userId) as { total: number }
  return {
    list: rows.map((row) => ({
      tutorialId: row.tutorialId,
      title: row.title,
      summary: row.summary ?? '',
      tags: parseTags(row.tags),
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      isOffline: Boolean(row.isOffline),
      viewCount: row.viewCount,
      favCount: row.favCount,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
      favoritedAt: row.favoritedAt,
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

/** 路径参数解析：非正整数（abc/0/-1/3.5）一律按目标教程不存在处理（Express 5 params 值可为数组，取首项） */
function parseTutorialId(raw: string | string[]): number | null {
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
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
  ok(res, toggleFavorite(openDb(), currentUserId(req), tutorialId, true))
})

router.delete('/:tutorialId', requireAuth, (req, res) => {
  const tutorialId = parseTutorialId(req.params.tutorialId)
  if (tutorialId === null) throw new HttpError(404, '教程不存在')
  ok(res, toggleFavorite(openDb(), currentUserId(req), tutorialId, false))
})

router.get('/', requireAuth, (req, res) => {
  const { page, pageSize } = parsePagination(req.query)
  ok(res, listFavorites(openDb(), currentUserId(req), page, pageSize))
})

export default router
