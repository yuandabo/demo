/**
 * 教程路由（IT-02）——查询侧（BE-02）+ 写入侧（BE-03 起串行追加）：
 *   GET /            列表双口径（无管理参数=前台可见池；status/all=admin|operator 全态+扩展列）
 *   GET /:id         详情（快照+上下篇+关联+浏览计数；?all=1 管理口径读当前编辑值）
 *   POST /:id/share  分享打点（公开，仅前台可见教程计数）
 *   POST / PUT /:id / DELETE /:id（BE-03）：新建即草稿 / 保存回审分流+乐观锁 / 纯草稿删除保护
 *   POST /:id/submit / withdraw / review（BE-04）：提审 / 撤回 / 审核通过快照拷贝+驳回原因校验
 *   POST /:id/offline / republish / copy、PUT /:id/top（BE-05）：下架留痕 / 不重审恢复 / 副本清零 / 置顶排序
 * 契约：docs/design/api/{get-api-tutorials,get-api-tutorials-id,post-api-tutorials-id-share,
 *   post-api-tutorials,put-api-tutorials-id,delete-api-tutorials-id,
 *   post-api-tutorials-id-submit,post-api-tutorials-id-withdraw,post-api-tutorials-id-review,
 *   post-api-tutorials-id-offline,post-api-tutorials-id-republish,post-api-tutorials-id-copy,
 *   put-api-tutorials-id-top}.md
 * 挂载：routes/index.ts 挂载行由主 agent 统一落盘（apiRouter.use('/tutorials', tutorials)），本文件只导出 router。
 */
import type { DatabaseSync } from 'node:sqlite'
import type { Request, Response } from 'express'
import { Router } from 'express'
import { openDb, VISIBLE_SQL } from '../db.js'
import { findUserByToken, requireAuth, requireRole } from '../auth.js'
import type { AuthUser } from '../auth.js'
import { HttpError, ok } from '../response.js'
import { assertTutorialTransition, TUTORIAL_ACTIONS } from '../state-machine.js'

// ── 类型（与 web/src/shared/types.ts 卡片/详情口径对齐）─────────────────────

export type TutorialStatus = 'draft' | 'pending' | 'published' | 'offline'
export type TutorialSort = 'latest' | 'hot'

/** 列表筛选（路由层完成校验后传入 service；sort/page/pageSize 必填带默认值） */
export interface TutorialFilters {
  /** 命中该分类及其子分类（公开口径命中集排除停用分类） */
  categoryId?: number
  /** 标题 / 摘要（published_summary 或 summary）/ 标签 三字段任一命中 */
  keyword?: string
  /** 逗号多值按交集（每值都须命中 tags） */
  tags?: string[]
  topOnly?: boolean
  /** 管理参数：status 精确过滤（优先于 allStates） */
  status?: TutorialStatus
  /** 管理参数：all=1 全状态 */
  allStates?: boolean
  sort: TutorialSort
  page: number
  pageSize: number
}

/** 前台教程卡片（公开列表项） */
export interface TutorialCard {
  id: number
  title: string
  summary: string
  tags: string[]
  videoUrl: string | null
  categoryId: number
  categoryName: string
  isTop: number
  sort: number
  viewCount: number
  favCount: number
  helpfulYes: number
  helpfulNo: number
  shareCount: number
  publishedAt: string | null
  updatedAt: string
}

/** 管理列表卡片：公开卡片 + 全态/审核队列扩展列（UI-ELEM-07/09 数据源） */
export interface TutorialAdminCard extends TutorialCard {
  status: TutorialStatus
  rejectReason: string | null
  submitCount: number
  authorId: number
  authorName: string
  hasOnlineVersion: boolean
  lastOfflineAt: string | null
  createdAt: string
}

export interface TutorialPage {
  list: Array<TutorialCard | TutorialAdminCard>
  total: number
  page: number
  pageSize: number
}

export interface Neighbor {
  id: number
  title: string
}

/** 关联推荐卡片（详情 related / 已下架提示页推荐共用） */
export interface RelatedItem {
  id: number
  title: string
  summary: string
  viewCount: number
}

/** 详情负载：卡片列之上补充正文快照 / 管理列 / 上下篇 / 关联 / 登录态个性化（my* 由路由层合并） */
export interface TutorialDetail extends TutorialCard {
  content: string
  status: TutorialStatus
  rejectReason: string | null
  submitCount: number
  authorId: number
  authorName: string | null
  hasOnlineVersion?: boolean
  lastOfflineAt?: string | null
  createdAt?: string
  prev: Neighbor | null
  next: Neighbor | null
  related: RelatedItem[]
}

/** 详情可见性判定结果：offline 分支携带提示页推荐数据（tech-design §6） */
export type VisibleTutorialResult =
  | { kind: 'ok'; detail: TutorialDetail }
  | { kind: 'offline'; related: RelatedItem[] }
  | { kind: 'invisible' }

// ── 常量 ────────────────────────────────────────────────────────────

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100
const RELATED_LIMIT = 4
const TUTORIAL_STATUSES: ReadonlyArray<TutorialStatus> = ['draft', 'pending', 'published', 'offline']
const TUTORIAL_SORTS: ReadonlyArray<TutorialSort> = ['latest', 'hot']
const MSG_INVISIBLE = '该教程不存在或暂不可见'
const MSG_OFFLINE = '该教程已下架'
const MSG_BAD_QUERY = '查询参数不合法'
/** share 契约专用业务码（HTTP 404，code 40404） */
const CODE_NOT_VISIBLE = 40404

// ── 内部工具 ────────────────────────────────────────────────────────

/** tags 列 JSON 数组文本反序列化（脏数据兜底空数组，单条坏数据不拖垮整页） */
function parseTags(raw: unknown): string[] {
  try {
    const parsed: unknown = JSON.parse(typeof raw === 'string' ? raw : '[]')
    return Array.isArray(parsed) ? parsed.map((tag) => String(tag)) : []
  } catch {
    return []
  }
}

/** LIKE 通配符转义（配合 ESCAPE '\'，用户输入按字面量匹配，防 % _ 全表放大） */
function escapeLike(raw: string): string {
  return raw.replace(/[\\%_]/g, (ch) => `\\${ch}`)
}

function likeContains(raw: string): string {
  return `%${escapeLike(raw)}%`
}

/** tags 精确元素匹配模式：JSON.stringify 补引号与转义，使 "BOM" 不误中 "BOM2" */
function likeHasTag(tag: string): string {
  return likeContains(JSON.stringify(tag))
}

/** 同分类前台可见教程 N 篇（排除 excludeId，浏览量倒序，不足取实际） */
function relatedOf(db: DatabaseSync, categoryId: number, excludeId: number): RelatedItem[] {
  const rows = db
    .prepare(
      `SELECT id, title, COALESCE(published_summary, summary) AS summary, view_count AS viewCount
       FROM tutorials
       WHERE category_id = ? AND ${VISIBLE_SQL} AND id <> ?
       ORDER BY view_count DESC, id ASC
       LIMIT ${RELATED_LIMIT}`
    )
    .all(categoryId, excludeId) as unknown as Array<RelatedItem>
  // node:sqlite 行对象为 null 原型，复制为普通对象（deepEqual / 序列化契约友好）
  return rows.map((row) => ({ ...row }))
}

/** 分类名/作者名点查（详情固定两次查询，无 N+1；行缺失兜底 null 不阻断详情） */
function lookupCategoryName(db: DatabaseSync, categoryId: number): string | null {
  const row = db.prepare('SELECT name FROM categories WHERE id = ?').get(categoryId) as
    | { name: string }
    | undefined
  return row?.name ?? null
}

function lookupAuthorName(db: DatabaseSync, authorId: number): string | null {
  const row = db.prepare('SELECT display_name AS displayName FROM users WHERE id = ?').get(authorId) as
    | { displayName: string }
    | undefined
  return row?.displayName ?? null
}

/** tutorials 原始行（SELECT * 直读，snake_case；reviewer 列为 BE-04 审核留痕回读） */
interface TutorialRow {
  id: number
  title: string
  category_id: number
  summary: string
  content: string
  video_url: string | null
  tags: string
  status: TutorialStatus
  is_top: number
  sort: number
  view_count: number
  fav_count: number
  helpful_yes: number
  helpful_no: number
  share_count: number
  reject_reason: string | null
  submit_count: number
  author_id: number
  reviewer_id: number | null
  reviewed_at: string | null
  published_content: string | null
  published_summary: string | null
  published_at: string | null
  last_offline_at: string | null
  created_at: string
  updated_at: string
  isVisible?: number
}

// ── service 层（tech-design §11 冻结命名，db 首参惯例同 favorites.ts）────────

/**
 * 教程列表双口径取数（AC-RULE-01~04/07、AC-RULE-17、AC-RULE-22/23）：
 * - 公开口径（无 status/allStates）：WHERE 拼接 VISIBLE_SQL 且分类须启用，摘要读线上快照并回退（CHANGE-3）；
 * - 管理口径（status/allStates）：全态查询（status 优先于 all），摘要读当前编辑值，附审核队列扩展列；
 * - 排序：latest=isTop DESC→sort ASC→updated_at DESC；hot=isTop DESC→view_count DESC；id 决胜保证分页稳定。
 */
export function listTutorials(db: DatabaseSync, filters: TutorialFilters): TutorialPage {
  const management = filters.status !== undefined || filters.allStates === true
  const page = { page: filters.page, pageSize: filters.pageSize }
  const empty: TutorialPage = { list: [], total: 0, ...page }

  // 分类作用域：公开=启用分类（命中集再按 categoryId 子树收敛）；管理=全部分类
  const catRows = db
    .prepare(`SELECT id, name, parent_id AS parentId FROM categories${management ? '' : " WHERE status='enabled'"}`)
    .all() as Array<{ id: number; name: string; parentId: number | null }>
  const nameById = new Map(catRows.map((c) => [c.id, c.name]))
  let scopeIds: number[] | null = null
  if (!management) {
    if (catRows.length === 0) return empty
    scopeIds = catRows.map((c) => c.id)
  }
  if (filters.categoryId !== undefined) {
    const subtree = [filters.categoryId, ...catRows.filter((c) => c.parentId === filters.categoryId).map((c) => c.id)]
    const hit = subtree.filter((id) => nameById.has(id))
    if (hit.length === 0) return empty
    scopeIds = hit
  }

  const conds: string[] = []
  const params: Array<string | number> = []
  if (!management) conds.push(VISIBLE_SQL)
  if (filters.status !== undefined) {
    conds.push('t.status = ?')
    params.push(filters.status)
  }
  if (scopeIds) {
    conds.push(`t.category_id IN (${scopeIds.map(() => '?').join(',')})`)
    params.push(...scopeIds)
  }
  if (filters.topOnly) conds.push('t.is_top = 1')
  if (filters.keyword) {
    const kw = likeContains(filters.keyword)
    conds.push(
      `(t.title LIKE ? ESCAPE '\\' OR t.published_summary LIKE ? ESCAPE '\\' OR t.summary LIKE ? ESCAPE '\\' OR t.tags LIKE ? ESCAPE '\\')`
    )
    params.push(kw, kw, kw, kw)
  }
  for (const tag of filters.tags ?? []) {
    conds.push(`t.tags LIKE ? ESCAPE '\\'`)
    params.push(likeHasTag(tag))
  }

  // 管理态 all=1 无任何过滤时 conds 为空，WHERE 子句整体省略（防 "WHERE ORDER" 语法错误）
  const where = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : ''
  const order =
    filters.sort === 'hot'
      ? 't.is_top DESC, t.view_count DESC, t.id DESC'
      : 't.is_top DESC, t.sort ASC, t.updated_at DESC, t.id DESC'
  const summaryExpr = management ? 't.summary' : 'COALESCE(t.published_summary, t.summary)'
  const managementCols = management
    ? `, t.status, t.reject_reason AS rejectReason, t.submit_count AS submitCount,
       t.author_id AS authorId, u.display_name AS authorName,
       (t.published_content IS NOT NULL) AS hasOnlineVersion,
       t.last_offline_at AS lastOfflineAt, t.created_at AS createdAt`
    : ''
  // 公开口径无 JOIN（VISIBLE_SQL 无前缀，与 categories JOIN 会产生 status 列名歧义，见 misc.ts 同约定）；
  // 管理口径 JOIN users 取作者名（users 无 status 列，且管理态不拼 VISIBLE_SQL，无歧义）
  const rows = db
    .prepare(
      `SELECT t.id, t.title, ${summaryExpr} AS summary, t.tags, t.video_url AS videoUrl,
              t.category_id AS categoryId, t.is_top AS isTop, t.sort, t.view_count AS viewCount,
              t.fav_count AS favCount, t.helpful_yes AS helpfulYes, t.helpful_no AS helpfulNo,
              t.share_count AS shareCount, t.published_at AS publishedAt, t.updated_at AS updatedAt
              ${managementCols}
       FROM tutorials t${management ? ' LEFT JOIN users u ON u.id = t.author_id' : ''}
       ${where}
       ORDER BY ${order}
       LIMIT ? OFFSET ?`
    )
    .all(...params, filters.pageSize, (filters.page - 1) * filters.pageSize) as unknown as Array<
    TutorialCard & Partial<TutorialAdminCard> & { tags: string }
  >
  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM tutorials t ${where}`)
    .get(...params) as {
    total: number
  }

  return {
    list: rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary ?? '',
      tags: parseTags(row.tags),
      videoUrl: row.videoUrl,
      categoryId: row.categoryId,
      categoryName: nameById.get(row.categoryId) ?? '',
      isTop: row.isTop,
      sort: row.sort,
      viewCount: row.viewCount,
      favCount: row.favCount,
      helpfulYes: row.helpfulYes,
      helpfulNo: row.helpfulNo,
      shareCount: row.shareCount,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
      ...(management
        ? {
            status: row.status as TutorialStatus,
            rejectReason: row.rejectReason ?? null,
            submitCount: row.submitCount ?? 0,
            authorId: row.authorId ?? 0,
            authorName: row.authorName ?? '',
            hasOnlineVersion: Boolean(row.hasOnlineVersion),
            lastOfflineAt: row.lastOfflineAt ?? null,
            createdAt: row.createdAt ?? '',
          }
        : {}),
    })),
    total: Number(total),
    ...page,
  }
}

/**
 * 前台详情取数（AC-FN-10/19/20、AC-RULE-02 兜底）：
 * 读 published_content/published_summary 快照（回审期间旧版不断供，无快照摘要回退工作列 CHANGE-3）；
 * prev/next=同分类可见池按列表排序取相邻；related=同分类可见 4 篇排除本篇按浏览量倒序；
 * 已下架分支返回提示页推荐，其余不可见情形（不存在/首次待审/纯草稿/下架来源回审）一律 invisible。
 * view_count 不在此 +1（由路由层 incrementView 负责，service 保持只读可测）。
 */
export function getVisibleTutorial(db: DatabaseSync, id: number): VisibleTutorialResult {
  const row = db
    .prepare(`SELECT *, (${VISIBLE_SQL}) AS isVisible FROM tutorials WHERE id = ?`)
    .get(id) as TutorialRow | undefined
  if (!row || !row.isVisible) {
    if (row && row.status === 'offline' && row.published_content !== null) {
      return { kind: 'offline', related: relatedOf(db, row.category_id, row.id) }
    }
    return { kind: 'invisible' }
  }

  const siblings = db
    .prepare(
      `SELECT id, title FROM tutorials
       WHERE category_id = ? AND ${VISIBLE_SQL}
       ORDER BY is_top DESC, sort ASC, updated_at DESC, id DESC`
    )
    .all(row.category_id) as unknown as Array<Neighbor>
  const index = siblings.findIndex((s) => s.id === id)

  const detail: TutorialDetail = {
    id: row.id,
    title: row.title,
    summary: row.published_summary ?? row.summary,
    content: row.published_content ?? '',
    tags: parseTags(row.tags),
    videoUrl: row.video_url,
    categoryId: row.category_id,
    categoryName: lookupCategoryName(db, row.category_id) ?? '',
    isTop: row.is_top,
    sort: row.sort,
    viewCount: row.view_count,
    favCount: row.fav_count,
    helpfulYes: row.helpful_yes,
    helpfulNo: row.helpful_no,
    shareCount: row.share_count,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    status: row.status,
    rejectReason: row.reject_reason,
    submitCount: row.submit_count,
    authorId: row.author_id,
    authorName: lookupAuthorName(db, row.author_id),
    // 同 relatedOf：null 原型行复制为普通对象；index<0（防御）时上下篇均 null
    prev: index > 0 ? { ...siblings[index - 1] } : null,
    next: index >= 0 && index < siblings.length - 1 ? { ...siblings[index + 1] } : null,
    related: relatedOf(db, row.category_id, row.id),
  }
  return { kind: 'ok', detail }
}

/** 管理口径详情（?all=1）：任意状态可读，content/summary 读当前编辑值，不计浏览、无上下篇/关联 */
export function getTutorialEditView(db: DatabaseSync, id: number): TutorialDetail | null {
  const row = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(id) as TutorialRow | undefined
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    tags: parseTags(row.tags),
    videoUrl: row.video_url,
    categoryId: row.category_id,
    categoryName: lookupCategoryName(db, row.category_id) ?? '',
    isTop: row.is_top,
    sort: row.sort,
    viewCount: row.view_count,
    favCount: row.fav_count,
    helpfulYes: row.helpful_yes,
    helpfulNo: row.helpful_no,
    shareCount: row.share_count,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    status: row.status,
    rejectReason: row.reject_reason,
    submitCount: row.submit_count,
    authorId: row.author_id,
    authorName: lookupAuthorName(db, row.author_id),
    hasOnlineVersion: row.published_content !== null,
    lastOfflineAt: row.last_offline_at,
    createdAt: row.created_at,
    prev: null,
    next: null,
    related: [],
  }
}

/** 浏览计数 +1（不去重、含游客，AC-RULE-08）；返回自增后的新值供详情响应覆盖 */
export function incrementView(db: DatabaseSync, id: number): number {
  const { changes } = db.prepare('UPDATE tutorials SET view_count = view_count + 1 WHERE id = ?').run(id)
  if (Number(changes) === 0) throw new HttpError(404, MSG_INVISIBLE)
  const row = db.prepare('SELECT view_count AS viewCount FROM tutorials WHERE id = ?').get(id) as
    | { viewCount: number }
    | undefined
  if (!row) throw new HttpError(404, MSG_INVISIBLE)
  return Number(row.viewCount)
}

/** 分享打点：仅前台可见教程 share_count +1（按动作计数不去重）；不可见 404/code 40404（契约） */
export function shareTutorial(db: DatabaseSync, id: number): { shareCount: number } {
  const { changes } = db
    .prepare(`UPDATE tutorials SET share_count = share_count + 1 WHERE id = ? AND ${VISIBLE_SQL}`)
    .run(id)
  if (Number(changes) === 0) throw new HttpError(404, MSG_INVISIBLE, CODE_NOT_VISIBLE)
  const row = db.prepare('SELECT share_count AS shareCount FROM tutorials WHERE id = ?').get(id) as
    | { shareCount: number }
    | undefined
  if (!row) throw new HttpError(404, MSG_INVISIBLE, CODE_NOT_VISIBLE)
  return { shareCount: Number(row.shareCount) }
}

/** 登录态个性化字段（详情 my*）：无行为记录时 favorite=false / feedback/progress=null */
export function loadMyTutorialState(
  db: DatabaseSync,
  userId: number,
  tutorialId: number
): { myFavorite: boolean; myFeedback: number | null; myProgress: number | null } {
  const fav = db.prepare('SELECT 1 AS hit FROM favorites WHERE user_id = ? AND tutorial_id = ?').get(userId, tutorialId)
  const feedback = db.prepare('SELECT helpful FROM feedbacks WHERE user_id = ? AND tutorial_id = ?').get(
    userId,
    tutorialId
  ) as { helpful: number } | undefined
  const history = db.prepare('SELECT progress FROM histories WHERE user_id = ? AND tutorial_id = ?').get(
    userId,
    tutorialId
  ) as { progress: number } | undefined
  return {
    myFavorite: fav !== undefined,
    myFeedback: feedback === undefined ? null : Number(feedback.helpful),
    myProgress: history === undefined ? null : Number(history.progress),
  }
}

// ── 写入侧（BE-03）：常量 / 入参校验 / service（tech-design §11 冻结命名）────────

const TITLE_MAX_LENGTH = 100
const SUMMARY_MAX_LENGTH = 200
const TAGS_MAX = 5
/** 驳回原因最小字数（AC-RULE-19 后端双重校验侧） */
const REJECT_REASON_MIN = 5
/** 状态机动作类型（TUTORIAL_ACTIONS 冻结清单派生，BE-04 起消费） */
type StateMachineAction = (typeof TUTORIAL_ACTIONS)[number]
/** 副本标题后缀（4 字）；源标题截断保留长度 = 标题上限 - 后缀（96+4=100，AC-RULE-14） */
const COPY_SUFFIX = '（副本）'
const COPY_TITLE_KEEP = TITLE_MAX_LENGTH - COPY_SUFFIX.length
const SORT_MIN = 0
const SORT_MAX = 9999

// 契约字面文案（验收断言依据，禁止改写）
const MSG_TITLE_REQUIRED = '请填写标题'
const MSG_TITLE_MAX = '标题不超过 100 字'
const MSG_SUMMARY_MAX = '摘要不超过 200 字'
const MSG_TAGS_MAX = '标签最多 5 个'
const MSG_CATEGORY_NOT_FOUND = '所属分类不存在'
const MSG_CATEGORY_DISABLED = '所属分类已停用，请选择启用的分类'
const MSG_TUTORIAL_NOT_FOUND = '教程不存在'
const MSG_SAVED_BY_OTHER = '他人已保存新版本，请刷新后合并'
const MSG_STATE_CHANGED = '该教程状态已变化，请刷新'
const MSG_NO_PERMISSION = '无权限执行该操作'
const MSG_DELETE_PROTECTED = '存在线上过审版本的教程不可删除，请以下架归档代替'
const MSG_DELETED = '已删除'
const MSG_SUBMIT_INCOMPLETE = '请补全标题/分类/摘要/正文后再提交'
const MSG_ACTION_INVALID = 'action 参数不合法'
const MSG_REJECT_REASON = '请填写至少 5 个字的驳回原因'
const MSG_ONLY_PUBLISHED_TOP = '仅已发布教程可置顶'
const MSG_IS_TOP = 'isTop 必须为 0 或 1'

/** 写入入参原始字段（unknown：类型与业务校验收口在 service，路由层不重复校验，同 categories.ts） */
export interface TutorialPayload {
  title?: unknown
  categoryId?: unknown
  summary?: unknown
  content?: unknown
  videoUrl?: unknown
  tags?: unknown
  /** 乐观锁基线：编辑器加载时的 updatedAt（AC-EG-05） */
  baseUpdatedAt?: unknown
}

/** 标题：字符串 trim 后 1-100（AC-RULE-18：越界保存草稿同样阻断） */
function requireTitle(raw: unknown): string {
  if (typeof raw !== 'string' || raw.trim() === '') throw new HttpError(400, MSG_TITLE_REQUIRED)
  const title = raw.trim()
  if (title.length > TITLE_MAX_LENGTH) throw new HttpError(400, MSG_TITLE_MAX)
  return title
}

/** 摘要：可空（草稿落空串），trim 后 ≤200 */
function requireSummary(raw: unknown): string {
  if (raw === undefined || raw === null) return ''
  if (typeof raw !== 'string') throw new HttpError(400, MSG_SUMMARY_MAX)
  const summary = raw.trim()
  if (summary.length > SUMMARY_MAX_LENGTH) throw new HttpError(400, MSG_SUMMARY_MAX)
  return summary
}

/** 正文：可空（草稿落空串）；富文本原文不做长度校验（渲染端 sanitize，AC-NF-04） */
function requireContent(raw: unknown): string {
  if (raw === undefined || raw === null) return ''
  if (typeof raw !== 'string') throw new HttpError(400, '正文内容不合法')
  return raw
}

/** 视频外链：undefined=未传（PUT 不改）；null/空串=清除；字符串 trim 后落库（AC-EG-02 数据侧） */
function parseVideoUrl(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined
  if (raw === null) return null
  if (typeof raw !== 'string') throw new HttpError(400, '视频外链不合法')
  const url = raw.trim()
  return url === '' ? null : url
}

/** 标签：缺省 []；须为字符串数组且 ≤5 个，JSON 序列化落库 */
function parseTagsInput(raw: unknown): string[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw) || raw.length > TAGS_MAX || raw.some((tag) => typeof tag !== 'string')) {
    throw new HttpError(400, MSG_TAGS_MAX)
  }
  return raw.map((tag) => tag.trim())
}

/** 分类：须为存在的启用分类（404 不存在 / 409 停用，POST/PUT 共用） */
function resolveEnabledCategory(db: DatabaseSync, raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw <= 0) {
    throw new HttpError(404, MSG_CATEGORY_NOT_FOUND)
  }
  const row = db.prepare('SELECT id, status FROM categories WHERE id = ?').get(raw) as
    | { id: number; status: string }
    | undefined
  if (!row) throw new HttpError(404, MSG_CATEGORY_NOT_FOUND)
  if (row.status !== 'enabled') throw new HttpError(409, MSG_CATEGORY_DISABLED)
  return row.id
}

/** tutorials 行点查（写入侧共用）：不存在 404 教程不存在 */
function findTutorialRow(db: DatabaseSync, id: number): TutorialRow {
  const row = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(id) as TutorialRow | undefined
  if (!row) throw new HttpError(404, MSG_TUTORIAL_NOT_FOUND)
  return row
}

/**
 * 条件 UPDATE（WHERE 携带 status/updated_at 兜底）影响行数=0 时的复判：
 * 行已消失 → 404；否则状态已被并发动作改走 → 409（AC-EG-04/09，先到动作生效）。
 */
function recheckGuardedUpdate(db: DatabaseSync, id: number): never {
  findTutorialRow(db, id)
  throw new HttpError(409, MSG_STATE_CHANGED)
}

export interface TutorialCreated {
  id: number
  title: string
  categoryId: number
  status: TutorialStatus
  createdAt: string
  updatedAt: string
}

/** 新建教程（创建即草稿，AC-OP-05）：必填仅标题+启用分类，计数/置顶/快照/驳回原因全走 DDL 缺省值 */
export function createTutorial(db: DatabaseSync, body: TutorialPayload, authorId: number): TutorialCreated {
  const title = requireTitle(body.title)
  const summary = requireSummary(body.summary)
  const content = requireContent(body.content)
  const videoUrl = parseVideoUrl(body.videoUrl) ?? null
  const tags = JSON.stringify(parseTagsInput(body.tags))
  const categoryId = resolveEnabledCategory(db, body.categoryId)

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO tutorials (title, category_id, summary, content, video_url, tags, status, author_id)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`
    )
    .run(title, categoryId, summary, content, videoUrl, tags, authorId)
  const row = findTutorialRow(db, Number(lastInsertRowid))
  return {
    id: row.id,
    title: row.title,
    categoryId: row.category_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface TutorialUpdated {
  id: number
  status: TutorialStatus
  updatedAt: string
}

/**
 * 保存编辑（AC-OP-05 反复覆盖 / AC-FN-10 编辑回审 / AC-EG-05 乐观锁）：
 * - 分流：draft 保持 draft；published/offline 经转移表 editResubmit → pending（快照列不动，前台旧版不断供）；
 *   pending 覆盖内容、状态保持 pending（工程兜底，AC-EG-18 已下架来源回审期间维持不可见）；
 * - 乐观锁：baseUpdatedAt 非空且 ≠ 库中 updated_at → 409 覆盖告知；
 * - published_content/published_summary 永不触碰（review 是唯一快照写入方）。
 */
export function updateTutorial(db: DatabaseSync, id: number, body: TutorialPayload): TutorialUpdated {
  const current = findTutorialRow(db, id)
  const title = body.title !== undefined ? requireTitle(body.title) : undefined
  const summary = body.summary !== undefined ? requireSummary(body.summary) : undefined
  const content = body.content !== undefined ? requireContent(body.content) : undefined
  const videoUrl = parseVideoUrl(body.videoUrl)
  const tags = body.tags !== undefined ? JSON.stringify(parseTagsInput(body.tags)) : undefined

  const baseUpdatedAt = typeof body.baseUpdatedAt === 'string' ? body.baseUpdatedAt.trim() : ''
  if (baseUpdatedAt !== '' && baseUpdatedAt !== current.updated_at) {
    throw new HttpError(409, MSG_SAVED_BY_OTHER)
  }
  const categoryId = body.categoryId !== undefined ? resolveEnabledCategory(db, body.categoryId) : undefined

  const status =
    current.status === 'published' || current.status === 'offline'
      ? assertTutorialTransition(current.status, 'editResubmit')
      : current.status

  // 列名来自下方白名单字面量（非用户输入拼接），值全部参数化
  const assignments: Array<[column: string, value: string | number | null]> = []
  if (title !== undefined) assignments.push(['title', title])
  if (categoryId !== undefined) assignments.push(['category_id', categoryId])
  if (summary !== undefined) assignments.push(['summary', summary])
  if (content !== undefined) assignments.push(['content', content])
  if (videoUrl !== undefined) assignments.push(['video_url', videoUrl])
  if (tags !== undefined) assignments.push(['tags', tags])
  assignments.push(['status', status])

  const sets = assignments.map(([column]) => `${column} = ?`)
  sets.push("updated_at = datetime('now','localtime')")
  const params: Array<string | number | null> = assignments.map(([, value]) => value)
  params.push(id)
  // 乐观锁条件化：与前置校验双保险，串行化同基线的并发保存
  if (baseUpdatedAt !== '') params.push(baseUpdatedAt)
  const { changes } = db
    .prepare(
      `UPDATE tutorials SET ${sets.join(', ')} WHERE id = ?${baseUpdatedAt !== '' ? ' AND updated_at = ?' : ''}`
    )
    .run(...params)
  if (Number(changes) === 0) recheckGuardedUpdate(db, id)

  const row = findTutorialRow(db, id)
  return { id: row.id, status: row.status, updatedAt: row.updated_at }
}

/**
 * 删除教程（AC-OP-06 删除保护）：仅"从未通过审核的纯草稿"（published_content IS NULL）可物理删除；
 * 存在线上过审版本（已发布/已下架/回审驳回撤回落草稿但旧版在线）一律 403 以下架归档代替；
 * operator 仅可删本人名下纯草稿（AC-EG-08），admin 可删任意纯草稿（AC-RULE-23）。
 */
export function deleteTutorial(db: DatabaseSync, id: number, actor: Pick<AuthUser, 'id' | 'role'>): void {
  const row = findTutorialRow(db, id)
  if (row.published_content !== null) throw new HttpError(403, MSG_DELETE_PROTECTED)
  if (actor.role === 'operator' && row.author_id !== actor.id) throw new HttpError(403, MSG_NO_PERMISSION)
  db.prepare('DELETE FROM tutorials WHERE id = ?').run(id)
}

// ── 写入侧（BE-04）：审核状态机（submit / withdraw / review）──────────────

export interface TutorialSubmitted {
  id: number
  status: TutorialStatus
  submitCount: number
}

/**
 * 提审（AC-FN-07/AC-EG-01/AC-EG-09）：仅草稿可提审（转移表 submit，已下架直接提审 409）；
 * 必填四项（标题/分类/摘要/正文）齐备才可提审——草稿阶段允许为空、此处阻断（AC-RULE-18）；
 * 分类须仍为启用（停用 409）；WHERE status='draft' 兜底并发重复提审，submit_count 累计留痕。
 */
export function submitTutorial(db: DatabaseSync, id: number): TutorialSubmitted {
  const current = findTutorialRow(db, id)
  assertTutorialTransition(current.status, 'submit')
  if (current.title.trim() === '' || current.summary.trim() === '' || current.content.trim() === '') {
    throw new HttpError(400, MSG_SUBMIT_INCOMPLETE)
  }
  // 长度兜底（保存侧已阻断，防直写库脏数据绕过，AC-RULE-18）
  if (current.title.length > TITLE_MAX_LENGTH) throw new HttpError(400, MSG_TITLE_MAX)
  if (current.summary.length > SUMMARY_MAX_LENGTH) throw new HttpError(400, MSG_SUMMARY_MAX)
  if (parseTags(current.tags).length > TAGS_MAX) throw new HttpError(400, MSG_TAGS_MAX)
  const category = db
    .prepare('SELECT status FROM categories WHERE id = ?')
    .get(current.category_id) as { status: string } | undefined
  if (!category || category.status !== 'enabled') throw new HttpError(409, MSG_CATEGORY_DISABLED)

  const { changes } = db
    .prepare("UPDATE tutorials SET status = 'pending', submit_count = submit_count + 1 WHERE id = ? AND status = 'draft'")
    .run(id)
  if (Number(changes) === 0) recheckGuardedUpdate(db, id)
  const row = findTutorialRow(db, id)
  return { id: row.id, status: row.status, submitCount: row.submit_count }
}

export interface TutorialStatusResult {
  id: number
  status: TutorialStatus
}

/**
 * 撤回（AC-OP-07）：仅待审核可撤回（转移表 withdraw），pending→draft 审核队列移除；
 * 与审核动作并发时后到失效 409（WHERE status='pending' 兜底，AC-EG-04）；
 * 线上旧版（若有）由快照列保证继续在线，无需额外处理。
 */
export function withdrawTutorial(db: DatabaseSync, id: number): TutorialStatusResult {
  const current = findTutorialRow(db, id)
  assertTutorialTransition(current.status, 'withdraw')
  const { changes } = db
    .prepare("UPDATE tutorials SET status = 'draft' WHERE id = ? AND status = 'pending'")
    .run(id)
  if (Number(changes) === 0) recheckGuardedUpdate(db, id)
  return { id, status: 'draft' }
}

/** review 请求体原始字段（unknown 收口在 service） */
export interface ReviewInput {
  action?: unknown
  reason?: unknown
}

export interface TutorialReviewResult {
  id: number
  status: TutorialStatus
  /** 仅 approve 返回（快照列读取，理论非空、类型上兜底 null） */
  publishedAt?: string | null
  reviewerId?: number | null
  reviewedAt?: string | null
  /** 仅 reject 返回 */
  rejectReason?: string
}

/**
 * 审核（AC-FN-08/09/18/19，admin 专属由路由门卫保证）：
 * - action 枚举校验 → reject 原因必填 ≥5 字（AC-RULE-19 后端双重校验侧）→ 转移表校验（仅 pending）；
 * - approve = 唯一发布写入方：单语句原子完成 状态迁移 + 审核留痕 + content/summary 拷贝快照 +
 *   published_at=now + 清 last_offline_at/reject_reason（SQL 内 RHS content/summary 取旧值，天然拷贝语义）；
 * - reject：仅编辑版回草稿并留驳回原因，快照列不动（前台旧版继续在线，AC-FN-19）。
 */
export function reviewTutorial(
  db: DatabaseSync,
  id: number,
  input: ReviewInput,
  reviewerId: number
): TutorialReviewResult {
  const current = findTutorialRow(db, id) // 404 先于参数校验（契约失败表顺序）
  const { action } = input
  if (action !== 'approve' && action !== 'reject') throw new HttpError(400, MSG_ACTION_INVALID)
  const rejectReason = typeof input.reason === 'string' ? input.reason.trim() : ''
  if (action === 'reject' && rejectReason.length < REJECT_REASON_MIN) {
    throw new HttpError(400, MSG_REJECT_REASON)
  }
  const transition: StateMachineAction = action === 'approve' ? 'reviewApprove' : 'reviewReject'
  assertTutorialTransition(current.status, transition)

  if (action === 'approve') {
    const { changes } = db
      .prepare(
        `UPDATE tutorials SET status = 'published', reviewer_id = ?, reviewed_at = datetime('now','localtime'),
           published_content = content, published_summary = summary, published_at = datetime('now','localtime'),
           last_offline_at = NULL, reject_reason = NULL, updated_at = datetime('now','localtime')
         WHERE id = ? AND status = 'pending'`
      )
      .run(reviewerId, id)
    if (Number(changes) === 0) recheckGuardedUpdate(db, id)
    const row = findTutorialRow(db, id)
    return {
      id: row.id,
      status: row.status,
      publishedAt: row.published_at,
      reviewerId: row.reviewer_id,
      reviewedAt: row.reviewed_at,
    }
  }

  const { changes } = db
    .prepare(
      `UPDATE tutorials SET status = 'draft', reject_reason = ?, reviewer_id = ?, reviewed_at = datetime('now','localtime'),
         updated_at = datetime('now','localtime')
       WHERE id = ? AND status = 'pending'`
    )
    .run(rejectReason, reviewerId, id)
  if (Number(changes) === 0) recheckGuardedUpdate(db, id)
  return { id, status: 'draft', rejectReason }
}

// ── 写入侧（BE-05）：上下架 / 复制 / 置顶排序 ────────────────────────────

export interface TutorialOfflineResult {
  id: number
  status: TutorialStatus
  lastOfflineAt: string | null
}

/**
 * 下架（AC-OP-03/AC-RULE-04）：仅已发布（转移表 offline），last_offline_at=now 留痕（可见性派生列）；
 * 浏览/收藏计数保留（延续至重发布，仅复制清零）；三端下一次请求即不可见由 VISIBLE_SQL 口径保证。
 */
export function offlineTutorial(db: DatabaseSync, id: number): TutorialOfflineResult {
  const current = findTutorialRow(db, id)
  assertTutorialTransition(current.status, 'offline')
  const { changes } = db
    .prepare(
      `UPDATE tutorials SET status = 'offline', last_offline_at = datetime('now','localtime'),
         updated_at = datetime('now','localtime')
       WHERE id = ? AND status = 'published'`
    )
    .run(id)
  if (Number(changes) === 0) recheckGuardedUpdate(db, id)
  const row = findTutorialRow(db, id)
  return { id: row.id, status: row.status, lastOfflineAt: row.last_offline_at }
}

export interface TutorialRepublishResult {
  id: number
  status: TutorialStatus
  viewCount: number
  favCount: number
}

/**
 * 重新发布（AC-FN-11）：仅已下架（转移表 republish），内容未变不重审、不进审核队列、
 * 无待审核中间态；清 last_offline_at 恢复可见性，快照列与计数不动（回显=下架前数值）。
 */
export function republishTutorial(db: DatabaseSync, id: number): TutorialRepublishResult {
  const current = findTutorialRow(db, id)
  assertTutorialTransition(current.status, 'republish')
  const { changes } = db
    .prepare(
      `UPDATE tutorials SET status = 'published', last_offline_at = NULL, updated_at = datetime('now','localtime')
       WHERE id = ? AND status = 'offline'`
    )
    .run(id)
  if (Number(changes) === 0) recheckGuardedUpdate(db, id)
  const row = findTutorialRow(db, id)
  return { id: row.id, status: row.status, viewCount: row.view_count, favCount: row.fav_count }
}

export interface TutorialCopyResult {
  id: number
  title: string
  status: TutorialStatus
  viewCount: number
  favCount: number
  helpfulYes: number
  helpfulNo: number
  shareCount: number
  createdAt: string
}

/** 副本标题：源标题 + "（副本）"；源标题超 96 字截断再拼接（96+4=100 不超上限，AC-RULE-14） */
function copyTitle(sourceTitle: string): string {
  const base = sourceTitle.length > COPY_TITLE_KEEP ? sourceTitle.slice(0, COPY_TITLE_KEEP) : sourceTitle
  return base + COPY_SUFFIX
}

/**
 * 复制（AC-FN-12/AC-RULE-14）：源教程任意状态→生成新草稿；作者=当前操作人；
 * 六类计数（浏览/收藏/有帮助/没帮助/分享/提审次数）全 0、快照列与驳回原因清空（纯草稿不可见）、
 * is_top=0、sort=100 走 DDL 缺省；源记录完全不动。
 */
export function copyTutorial(db: DatabaseSync, id: number, authorId: number): TutorialCopyResult {
  const src = findTutorialRow(db, id)
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO tutorials (title, category_id, summary, content, video_url, tags, status, author_id)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`
    )
    .run(copyTitle(src.title), src.category_id, src.summary, src.content, src.video_url, src.tags, authorId)
  const created = findTutorialRow(db, Number(lastInsertRowid))
  return {
    id: created.id,
    title: created.title,
    status: created.status,
    viewCount: created.view_count,
    favCount: created.fav_count,
    helpfulYes: created.helpful_yes,
    helpfulNo: created.helpful_no,
    shareCount: created.share_count,
    createdAt: created.created_at,
  }
}

/** top 请求体原始字段（unknown 收口在 service） */
export interface TopSortInput {
  isTop?: unknown
  sort?: unknown
}

export interface TutorialTopResult {
  id: number
  isTop: number
  sort: number
  status: TutorialStatus
}

/**
 * 置顶与排序（AC-RULE-17）：isTop=1 仅已发布可置顶（409），取消置顶与调 sort 不限状态（后台列表用途）；
 * sort 缺省保持原值（COALESCE）；isTop/sort 参数不合法 400（契约同文案）。
 */
export function setTopAndSort(db: DatabaseSync, id: number, body: TopSortInput): TutorialTopResult {
  const { isTop } = body
  if (isTop !== 0 && isTop !== 1) throw new HttpError(400, MSG_IS_TOP)
  let sort: number | null = null
  if (body.sort !== undefined && body.sort !== null) {
    if (typeof body.sort !== 'number' || !Number.isInteger(body.sort) || body.sort < SORT_MIN || body.sort > SORT_MAX) {
      throw new HttpError(400, MSG_IS_TOP)
    }
    sort = body.sort
  }
  const current = findTutorialRow(db, id)
  if (isTop === 1 && current.status !== 'published') throw new HttpError(409, MSG_ONLY_PUBLISHED_TOP)
  db.prepare('UPDATE tutorials SET is_top = ?, sort = COALESCE(?, sort) WHERE id = ?').run(isTop, sort, id)
  const row = findTutorialRow(db, id)
  return { id: row.id, isTop: row.is_top, sort: row.sort, status: row.status }
}

// ── 路由层（参数校验 + 鉴权门卫 + 编排）───────────────────────────────

/** query 单值提取：重复参数取首值，非字符串（对象等）按未传处理 */
function queryValue(query: Record<string, unknown>, key: string): string | undefined {
  const raw = query[key]
  if (Array.isArray(raw)) return raw.length > 0 ? String(raw[0]) : undefined
  return typeof raw === 'string' ? raw : undefined
}

/** 整数参数：空串/缺省返回 null（视为未传），非法值由调用方抛 400 */
function toIntOrNull(raw: string | undefined): number | null {
  if (raw === undefined || raw === '') return null
  const n = Number(raw)
  return Number.isInteger(n) ? n : null
}

function badQuery(): never {
  throw new HttpError(400, MSG_BAD_QUERY)
}

function requireIntIn(raw: string | undefined, min: number, max: number): number {
  const n = toIntOrNull(raw)
  if (n === null || n < min || n > max) badQuery()
  return n
}

/** 列表 query 解析：缺省取默认值，出现即必须合法，否则 400 "查询参数不合法"（契约失败表） */
function parseListFilters(query: Record<string, unknown>): TutorialFilters {
  const categoryId = toIntOrNull(queryValue(query, 'categoryId'))
  if (categoryId !== null && categoryId < 1) badQuery()

  const topRaw = queryValue(query, 'top')
  if (topRaw !== undefined && topRaw !== '' && topRaw !== '0' && topRaw !== '1') badQuery()

  const sortRaw = queryValue(query, 'sort') ?? 'latest'
  if (!TUTORIAL_SORTS.includes(sortRaw as TutorialSort)) badQuery()

  const statusRaw = queryValue(query, 'status') ?? ''
  if (statusRaw !== '' && !TUTORIAL_STATUSES.includes(statusRaw as TutorialStatus)) badQuery()

  const allRaw = queryValue(query, 'all')
  if (allRaw !== undefined && allRaw !== '' && allRaw !== '0' && allRaw !== '1') badQuery()

  const keywordRaw = queryValue(query, 'keyword')?.trim()
  const tagRaw = queryValue(query, 'tag') ?? ''

  const pageRaw = queryValue(query, 'page')
  const pageSizeRaw = queryValue(query, 'pageSize')

  return {
    categoryId: categoryId ?? undefined,
    keyword: keywordRaw === '' ? undefined : keywordRaw,
    tags: tagRaw
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== ''),
    topOnly: topRaw === '1',
    status: statusRaw === '' ? undefined : (statusRaw as TutorialStatus),
    allStates: allRaw === '1',
    sort: sortRaw as TutorialSort,
    page: pageRaw === undefined || pageRaw === '' ? DEFAULT_PAGE : requireIntIn(pageRaw, 1, Number.MAX_SAFE_INTEGER),
    pageSize: pageSizeRaw === undefined || pageSizeRaw === '' ? DEFAULT_PAGE_SIZE : requireIntIn(pageSizeRaw, 1, MAX_PAGE_SIZE),
  }
}

/** 路径 id 解析：非正整数按目标不存在处理（同 favorites.ts 口径） */
function parseId(raw: string | string[]): number | null {
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/** 可选登录态：无/失效 token 一律按游客（详情公开读不被过期 token 阻断） */
function optionalUser(req: Request): AuthUser | null {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  return token ? findUserByToken(token) : null
}

/** 管理参数门卫：未登录 401 / user 角色 403（admin/operator 放行，AC-RULE-22/23） */
function requireManager(user: AuthUser | null): void {
  if (!user) throw new HttpError(401, '未登录或登录已失效')
  if (user.role === 'user') throw new HttpError(403, MSG_NO_PERMISSION)
}

/** 详情 404 提示页：offline 携带同类推荐，invisible 仅 reason（tech-design §6） */
function respondNotVisible(res: Response, reason: 'offline' | 'invisible', related: RelatedItem[] = []): void {
  res.status(404).json({
    code: 404,
    message: reason === 'offline' ? MSG_OFFLINE : MSG_INVISIBLE,
    data: reason === 'offline' ? { reason, related } : { reason },
  })
}

const GUEST_MY_STATE = { myFavorite: null, myFeedback: null, myProgress: null } as const

const router = Router()

/** GET /api/tutorials：双口径列表（游客/普通用户共用前台口径，AC-RULE-25） */
router.get('/', (req, res) => {
  const filters = parseListFilters(req.query)
  if (filters.status !== undefined || filters.allStates) {
    requireManager(optionalUser(req))
  }
  ok(res, listTutorials(openDb(), filters))
})

/**
 * GET /api/tutorials/:id：前台详情（快照+计数+上下篇+关联+my*）；
 * ?all=1 管理口径（admin/operator）返回当前编辑值，供后台编辑/审核场景取行。
 */
router.get('/:id', (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    respondNotVisible(res, 'invisible')
    return
  }
  const db = openDb()

  if (queryValue(req.query, 'all') === '1') {
    requireManager(optionalUser(req))
    const edit = getTutorialEditView(db, id)
    if (!edit) {
      respondNotVisible(res, 'invisible')
      return
    }
    ok(res, { ...edit, ...GUEST_MY_STATE })
    return
  }

  const result = getVisibleTutorial(db, id)
  if (result.kind === 'invisible') {
    respondNotVisible(res, 'invisible')
    return
  }
  if (result.kind === 'offline') {
    respondNotVisible(res, 'offline', result.related)
    return
  }
  const user = optionalUser(req)
  ok(res, {
    ...result.detail,
    viewCount: incrementView(db, id),
    ...(user ? loadMyTutorialState(db, user.id, id) : GUEST_MY_STATE),
  })
})

/** POST /api/tutorials/:id/share：公开打点（含游客），仅前台可见教程计数 */
router.post('/:id/share', (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) throw new HttpError(404, MSG_INVISIBLE, CODE_NOT_VISIBLE)
  ok(res, shareTutorial(openDb(), id))
})

/** requireAuth 之后的当前用户（favorites.ts 同口径 401 兜底） */
function currentUser(req: Request): AuthUser {
  if (!req.user) throw new HttpError(401, '未登录或登录已失效')
  return req.user
}

/** 路径 id 门卫：非正整数按教程不存在处理（写入口径，无 400 分支） */
function requireId(raw: string | string[]): number {
  const id = parseId(raw)
  if (id === null) throw new HttpError(404, MSG_TUTORIAL_NOT_FOUND)
  return id
}

// ── 写入侧路由（BE-03：新建 / 保存回审 / 删除保护）─────────────────────

// POST /api/tutorials 新建（admin/operator，创建即草稿不进前台与审核队列，AC-OP-05）
router.post('/', requireAuth, requireRole('admin', 'operator'), (req, res) => {
  ok(res, createTutorial(openDb(), (req.body ?? {}) as TutorialPayload, currentUser(req).id))
})

// PUT /api/tutorials/:id 保存（回审分流 + baseUpdatedAt 乐观锁，AC-FN-10/AC-EG-05）
router.put('/:id', requireAuth, requireRole('admin', 'operator'), (req, res) => {
  ok(res, updateTutorial(openDb(), requireId(req.params.id), (req.body ?? {}) as TutorialPayload))
})

// DELETE /api/tutorials/:id 删除（纯草稿保护在 service；契约 message 为"已删除"而非 ok，AC-OP-06）
router.delete('/:id', requireAuth, requireRole('admin', 'operator'), (req, res) => {
  const user = currentUser(req)
  deleteTutorial(openDb(), requireId(req.params.id), user)
  res.status(200).json({ code: 0, message: MSG_DELETED, data: null })
})

// ── 写入侧路由（BE-04：提审 / 撤回 / 审核）─────────────────────────────

// POST /api/tutorials/:id/submit 提审（admin/operator；必填校验与非法迁移 409 在 service）
router.post('/:id/submit', requireAuth, requireRole('admin', 'operator'), (req, res) => {
  ok(res, submitTutorial(openDb(), requireId(req.params.id)))
})

// POST /api/tutorials/:id/withdraw 撤回（admin/operator；仅 pending，AC-OP-07）
router.post('/:id/withdraw', requireAuth, requireRole('admin', 'operator'), (req, res) => {
  ok(res, withdrawTutorial(openDb(), requireId(req.params.id)))
})

// POST /api/tutorials/:id/review 审核（admin 专属，operator/user 403 且状态不变，AC-FN-18）
router.post('/:id/review', requireAuth, requireRole('admin'), (req, res) => {
  ok(res, reviewTutorial(openDb(), requireId(req.params.id), (req.body ?? {}) as ReviewInput, currentUser(req).id))
})

// ── 写入侧路由（BE-05：下架 / 重新发布 / 复制 / 置顶排序）─────────────────

// POST /api/tutorials/:id/offline 下架（admin 专属，operator/user 403，AC-OP-03）
router.post('/:id/offline', requireAuth, requireRole('admin'), (req, res) => {
  ok(res, offlineTutorial(openDb(), requireId(req.params.id)))
})

// POST /api/tutorials/:id/republish 重新发布（admin 专属，不重审清时间戳，AC-FN-11）
router.post('/:id/republish', requireAuth, requireRole('admin'), (req, res) => {
  ok(res, republishTutorial(openDb(), requireId(req.params.id)))
})

// POST /api/tutorials/:id/copy 复制（admin/operator，任意状态→新草稿计数清零，AC-FN-12）
router.post('/:id/copy', requireAuth, requireRole('admin', 'operator'), (req, res) => {
  ok(res, copyTutorial(openDb(), requireId(req.params.id), currentUser(req).id))
})

// PUT /api/tutorials/:id/top 置顶与排序（admin/operator；置顶仅已发布，AC-RULE-17）
router.put('/:id/top', requireAuth, requireRole('admin', 'operator'), (req, res) => {
  ok(res, setTopAndSort(openDb(), requireId(req.params.id), (req.body ?? {}) as TopSortInput))
})

export default router
