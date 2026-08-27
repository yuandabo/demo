/**
 * 杂项路由（tech-design §11 routes/misc.ts：recommend / messages / checkins / system）
 * 已交付：GET /api/recommend（IT-03/BE-07）、GET /api/messages（IT-05/BE-01）、
 * POST/GET /api/checkins（IT-05/BE-02）；system 由后续任务填充。
 * 挂载（routes/index.ts，由主 agent 统一落盘）：apiRouter.use('/', misc)
 */
import type { DatabaseSync } from 'node:sqlite'
import type { Request } from 'express'
import { Router } from 'express'
import { findUserByToken, requireAuth } from '../auth.js'
import { openDb, VISIBLE_SQL } from '../db.js'
import { HttpError, ok } from '../response.js'

/** 云ERP 8 大模块标识（与 categories.erp_module / GET·PUT /api/categories 契约枚举一致，PRD §2） */
type ErpModule =
  | 'sales'
  | 'project'
  | 'file'
  | 'produce'
  | 'purchase'
  | 'inventory'
  | 'hrFinance'
  | 'system'

/** ERP 六角色（erpRole 参数枚举，与登录账号口径一致，AC-RULE-26） */
type ErpRole = 'sales' | 'purchase' | 'produce' | 'warehouse' | 'manage' | 'finance'

/** manage 角色命中集 = 全部 8 模块（PRD §7.1） */
const ALL_ERP_MODULES: ReadonlyArray<ErpModule> = [
  'sales', 'project', 'file', 'produce', 'purchase', 'inventory', 'hrFinance', 'system',
]

/**
 * 角色→模块映射（PRD §7.1，推荐位命中集依据）：
 * 销售→销售管理；采购→采购管理、库存管理；生产→生产制造、项目管理；仓库→库存管理；
 * 财务→人事财务、销售管理；管理→全部 8 模块。与 web/src/shared/constants.ts ROLE_MODULE_MAP 同口径。
 */
const ROLE_MODULE_MAP: Readonly<Record<ErpRole, ReadonlyArray<ErpModule>>> = {
  sales: ['sales'],
  purchase: ['purchase', 'inventory'],
  produce: ['produce', 'project'],
  warehouse: ['inventory'],
  finance: ['hrFinance', 'sales'],
  manage: ALL_ERP_MODULES,
}

/** 推荐位展示条数上限（浏览量 Top6，不足时返回实际数量，AC-RULE-16） */
const RECOMMEND_LIMIT = 6

/** 推荐卡片：字段与 GET /api/tutorials 前台卡片公开口径一致（get-api-recommend.md） */
export interface RecommendCard {
  id: number
  title: string
  summary: string
  tags: string[]
  categoryId: number
  categoryName: string
  viewCount: number
  favCount: number
  publishedAt: string | null
}

export interface RecommendResult {
  source: 'role' | 'global'
  erpRole: ErpRole | null
  list: RecommendCard[]
}

/** tutorials 表原始行（SELECT 别名后的最小字段集） */
interface RecommendRow extends Omit<RecommendCard, 'tags' | 'categoryName'> {
  tags: string
}

/**
 * erpRole 参数解析：未传 / null / 空串 → 全站口径（null）；命中六角色枚举返回角色；
 * 其余（含非字符串、重复参数数组）一律 400，与契约"erpRole 不在枚举内"一致。
 */
function resolveErpRole(raw: unknown): ErpRole | null {
  if (raw === undefined || raw === null || raw === '') return null
  if (typeof raw === 'string' && raw in ROLE_MODULE_MAP) return raw as ErpRole
  throw new HttpError(400, 'erpRole 参数不合法')
}

/** tags 列 JSON 反序列化（脏数据兜底空数组，单条坏数据不拖垮整个列表） */
function parseTags(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value.map(String) : []
  } catch {
    return []
  }
}

/**
 * 推荐位取数（tech-design §11 冻结命名，AC-RULE-16 / AC-FN-17 / AC-FN-22）：
 * 游客/未传 erpRole → 全站前台可见教程；角色 → 命中集（启用分类 ∩ 模块映射）内前台可见教程。
 * 统一 VISIBLE_SQL 口径（回审期间旧版参与排序、已下架/从未过审不可见），按浏览量倒序 Top6，
 * 不足 6 条返回实际数量；摘要读线上过审版本（published_summary 优先，回审展示旧版）。
 * @param erpRole 查询参数原值（express query 值可为 string/array/对象，非字符串一律按非法枚举 400）
 */
export function buildRecommend(erpRole?: unknown): RecommendResult {
  const role = resolveErpRole(erpRole)
  const db = openDb()

  // 命中分类：启用状态过滤恒定（AC-EG-14 停用分类不进推荐位），角色分支再按模块映射收敛
  const modules = role === null ? null : ROLE_MODULE_MAP[role]
  const moduleFilter = modules === null ? '' : ` AND erp_module IN (${modules.map(() => '?').join(',')})`
  const categoryRows = db
    .prepare(`SELECT id, name FROM categories WHERE status='enabled'${moduleFilter}`)
    .all(...(modules ?? [])) as Array<{ id: number; name: string }>

  const source: RecommendResult['source'] = role === null ? 'global' : 'role'
  if (categoryRows.length === 0) {
    return { source, erpRole: role, list: [] }
  }

  // 主查询保持单表：VISIBLE_SQL 为无前缀片段，与 categories JOIN 会产生 status 列名歧义，
  // 故启用+模块过滤经命中分类 id 集下推（固定两次查询，无 N+1）
  const categoryIds = categoryRows.map((c) => c.id)
  const categoryNames = new Map(categoryRows.map((c) => [c.id, c.name]))
  const rows = db
    .prepare(
      `SELECT id, title, COALESCE(published_summary, summary) AS summary, tags,
              category_id AS categoryId, view_count AS viewCount, fav_count AS favCount,
              published_at AS publishedAt
       FROM tutorials
       WHERE ${VISIBLE_SQL} AND category_id IN (${categoryIds.map(() => '?').join(',')})
       ORDER BY view_count DESC, id ASC
       LIMIT ${RECOMMEND_LIMIT}`
    )
    .all(...categoryIds) as unknown as Array<RecommendRow>

  return {
    source,
    erpRole: role,
    list: rows.map((row) => ({
      ...row,
      tags: parseTags(row.tags),
      categoryName: categoryNames.get(row.categoryId) ?? '',
    })),
  }
}

// ── GET /api/messages（BE-01，m 首页消息入口预留卡片数据源）──────────────

/** 消息卡片（get-api-messages.md 契约：驼峰字段；tutorialId/tutorialTitle 预留 null 场景） */
export interface MessageItem {
  id: number
  erpRole: ErpRole
  title: string
  tutorialId: number | null
  tutorialTitle: string | null
  isRead: number
  createdAt: string
}

export interface MessageResult {
  list: MessageItem[]
}

/** 六角色枚举集合：Set 命中规避对象原型链（如 ?erpRole=constructor 被 `in` 误判为合法） */
const ERP_ROLE_SET: ReadonlySet<string> = new Set(Object.keys(ROLE_MODULE_MAP))

/**
 * messages 的 erpRole 入参校验（与 recommend 的"空串=缺省"口径不同，本契约把显式空串视为非法）：
 * 未传（undefined）→ null，交由登录用户角色兜底；显式传入（含空串 / 数组 / 非枚举字符串）一律 400。
 */
function assertErpRoleParam(raw: unknown): ErpRole | null {
  if (raw === undefined) return null
  if (typeof raw === 'string' && ERP_ROLE_SET.has(raw)) return raw as ErpRole
  throw new HttpError(400, 'erpRole 参数不合法')
}

/** 登录用户角色兜底：admin/operator 的 erp_role 为 null、脏数据不在六角色枚举 → 不过滤返回全部 */
function toErpRoleOrNull(raw: string | null): ErpRole | null {
  return raw !== null && ERP_ROLE_SET.has(raw) ? (raw as ErpRole) : null
}

/**
 * 消息取数（tech-design §11 冻结命名，PRD §7.10 消息联动 v1.1 迭代池预留，本期仅数据与接口）：
 * 过滤优先级 显式 erpRole 参数 > 登录用户角色 > 全部；按创建时间倒序，
 * LEFT JOIN tutorials 取标题（tutorial_id 预留 null，取不到时 tutorialTitle 为 null）。
 * @param erpRole 查询参数原值（undefined=未传；空串/数组按非法枚举 400）
 * @param erpRoleOfUser 可选鉴权解析出的登录用户角色（游客/失效 token 传 null）
 */
export function listMessages(erpRole: unknown, erpRoleOfUser: string | null): MessageResult {
  const filterRole = assertErpRoleParam(erpRole) ?? toErpRoleOrNull(erpRoleOfUser)
  const list = openDb()
    .prepare(
      `SELECT m.id, m.erp_role AS erpRole, m.title, m.tutorial_id AS tutorialId,
              t.title AS tutorialTitle, m.is_read AS isRead, m.created_at AS createdAt
       FROM messages m LEFT JOIN tutorials t ON t.id = m.tutorial_id
       WHERE (? IS NULL OR m.erp_role = ?)
       ORDER BY m.created_at DESC`
    )
    .all(filterRole, filterRole) as unknown as Array<MessageItem>
  return { list }
}

// ── POST/GET /api/checkins（IT-05/BE-02，学习激励：每日打卡 + 打卡页/徽章墙聚合）──────────────

/** 打卡积分与徽章阈值（AC-RULE-12：+10/日；坚持者=连续 7 天；百科达人=累计完成 20 篇） */
const CHECKIN_POINTS = 10
const PERSIST_BADGE_STREAK = 7
const ENCYCLOPEDIA_BADGE_TUTORIALS = 20
/** 完成口径：阅读进度 100%（与 AC-RULE-13 分子、完成率统计同一口径，禁止另立标准） */
const COMPLETED_PROGRESS = 100
/** 周历长度：本周一至周日固定 7 天（get-api-checkins 契约） */
const WEEK_CALENDAR_DAYS = 7

/** 服务器本地日期串 yyyy-MM-dd（契约口径：打卡日期按服务器本地时间） */
function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** 日期串加 n 天：按本地时间分量构造，规避 new Date('yyyy-MM-dd') 按 UTC 解析的时区漂移 */
function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return toLocalDateStr(new Date(year, month - 1, day + days))
}

/** 本周一至周日 7 个日期（getDay() 周日=0，+6 取模把周一归零） */
function currentWeekDates(today: string): string[] {
  const [year, month, day] = today.split('-').map(Number)
  const mondayOffset = (new Date(year, month - 1, day).getDay() + 6) % 7
  return Array.from({ length: WEEK_CALENDAR_DAYS }, (_, i) => addDays(today, i - mondayOffset))
}

/** 打卡记录行（UNIQUE(user_id, checkin_date) 保证同日至多 1 条） */
interface CheckinRow {
  checkinDate: string
  streak: number
}

/** 指定日期打卡记录查询（当日判定 / 昨日连续性判定共用），无则 null */
function findCheckin(db: DatabaseSync, userId: number, date: string): CheckinRow | null {
  const row = db
    .prepare('SELECT checkin_date AS checkinDate, streak FROM checkins WHERE user_id = ? AND checkin_date = ?')
    .get(userId, date) as CheckinRow | undefined
  return row ?? null
}

/** 完成教程数：progress=100 的历史条数（AC-RULE-13 分子口径，百科达人判定输入） */
function countCompletedTutorials(db: DatabaseSync, userId: number): number {
  const { done } = db
    .prepare('SELECT COUNT(*) AS done FROM histories WHERE user_id = ? AND progress = ?')
    .get(userId, COMPLETED_PROGRESS) as { done: number }
  return Number(done)
}

/**
 * 徽章判定（AC-RULE-12 / AC-FN-21）：
 * persist 按"历史最长连续 ≥7"而非当前连续——中断后当前 streak 清零，但已获徽章不回收
 * （AC-FN-21 兜底口径），bestStreak ≥ 当前 streak 恒成立，达标当次两口径等价；
 * encyclopedia = 累计完成 20 篇（完成口径同 countCompletedTutorials）。
 */
function judgeBadges(bestStreak: number, completedTutorials: number): string[] {
  const badges: string[] = []
  if (bestStreak >= PERSIST_BADGE_STREAK) badges.push('persist')
  if (completedTutorials >= ENCYCLOPEDIA_BADGE_TUTORIALS) badges.push('encyclopedia')
  return badges
}

/** 积分与最长连续聚合：无记录用户 SUM 为 NULL → COALESCE 归 0，不报错 */
function aggregateCheckins(db: DatabaseSync, userId: number): { totalPoints: number; bestStreak: number } {
  const { total, best } = db
    .prepare(
      'SELECT COALESCE(SUM(points), 0) AS total, COALESCE(MAX(streak), 0) AS best FROM checkins WHERE user_id = ?'
    )
    .get(userId) as { total: number; best: number }
  return { totalPoints: Number(total), bestStreak: Number(best) }
}

export interface CheckinResult {
  checkinDate: string
  pointsAdded: number
  totalPoints: number
  streak: number
  badges: string[]
  duplicated: boolean
}

/**
 * 每日打卡（tech-design §11 冻结命名，AC-FN-16 / AC-RULE-12）：
 * 首次打卡 +10 积分；当日重复幂等返回既有记录（duplicated=true、pointsAdded=0，积分不再增加）；
 * 连续天数 = 昨日有打卡则昨日 streak+1，否则重置 1（中断仅清连续天数，不清积分、不回收徽章）。
 * 写入用 INSERT OR IGNORE + changes 判定：并发同日双写触发 UNIQUE(user_id, checkin_date)
 * 时静默忽略后读回既有行转幂等分支，等价于"捕获 UNIQUE 异常转幂等"且不依赖错误文案匹配。
 */
export function checkin(db: DatabaseSync, userId: number): CheckinResult {
  const today = toLocalDateStr(new Date())

  let duplicated = false
  let streak: number
  const existing = findCheckin(db, userId, today)
  if (existing) {
    // 幂等分支：当日已有记录，直接复用，不再 INSERT、不加积分
    duplicated = true
    streak = Number(existing.streak)
  } else {
    // 昨日连续性判定：有昨日记录续连 +1，无（中断或首次打卡）重置为 1
    const yesterday = findCheckin(db, userId, addDays(today, -1))
    streak = yesterday ? Number(yesterday.streak) + 1 : 1
    const { changes } = db
      .prepare('INSERT OR IGNORE INTO checkins (user_id, checkin_date, points, streak) VALUES (?, ?, ?, ?)')
      .run(userId, today, CHECKIN_POINTS, streak)
    duplicated = changes === 0
    if (duplicated) {
      // UNIQUE 兜底：并发同日已被写入（changes=0），读回既有行按幂等口径返回
      const raced = findCheckin(db, userId, today)
      if (!raced) throw new HttpError(500, '打卡写入失败')
      streak = Number(raced.streak)
    }
  }

  const { totalPoints, bestStreak } = aggregateCheckins(db, userId)
  return {
    checkinDate: today,
    pointsAdded: duplicated ? 0 : CHECKIN_POINTS,
    totalPoints,
    streak,
    badges: judgeBadges(bestStreak, countCompletedTutorials(db, userId)),
    duplicated,
  }
}

export interface CheckinWeekDay {
  date: string
  isChecked: boolean
}

export interface CheckinStatus {
  todayChecked: boolean
  totalPoints: number
  streak: number
  bestStreak: number
  completedTutorials: number
  badges: string[]
  weekCalendar: CheckinWeekDay[]
}

/**
 * 打卡页/徽章墙状态聚合（get-api-checkins.md 契约）：
 * streak 取今日记录，今日无则取昨日（连续中断后昨日也无 → 0）；
 * bestStreak = 历史最长（徽章不回收依据）；weekCalendar 覆盖本周一至周日，
 * 过去与今天按库内存在性置位、未来日期强制 false。无记录用户全指标归 0。
 */
export function buildCheckinStatus(db: DatabaseSync, userId: number): CheckinStatus {
  const today = toLocalDateStr(new Date())
  const todayRow = findCheckin(db, userId, today)
  const latestRow = todayRow ?? findCheckin(db, userId, addDays(today, -1))
  const { totalPoints, bestStreak } = aggregateCheckins(db, userId)
  const completedTutorials = countCompletedTutorials(db, userId)

  const week = currentWeekDates(today)
  const rows = db
    .prepare('SELECT checkin_date AS checkinDate FROM checkins WHERE user_id = ? AND checkin_date BETWEEN ? AND ?')
    .all(userId, week[0], week[WEEK_CALENDAR_DAYS - 1]) as Array<{ checkinDate: string }>
  const checkedDates = new Set(rows.map((row) => row.checkinDate))

  return {
    todayChecked: todayRow !== null,
    totalPoints,
    streak: latestRow ? Number(latestRow.streak) : 0,
    bestStreak,
    completedTutorials,
    badges: judgeBadges(bestStreak, completedTutorials),
    weekCalendar: week.map((date) => ({ date, isChecked: date <= today && checkedDates.has(date) })),
  }
}

const router = Router()

/**
 * GET /api/recommend：前台/小程序首页角色推荐位。公开端点（游客走全站口径，AC-RULE-25）。
 * 角色取值优先级：显式 erpRole 查询参数 > Bearer token 解析的登录用户角色（AC-RULE-16，
 * CHANGE-6：token 解析与 /messages 同口径，query 为空串时仍按原口径走全站）。
 */
router.get('/recommend', (req, res) => {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  const user = token ? findUserByToken(token) : null
  ok(res, buildRecommend(req.query.erpRole ?? user?.erpRole))
})

/**
 * GET /api/messages：m 首页「消息入口预留」卡片数据源（AC-FN-24 首页区块）。
 * 公开端点（demo 无登录态可读）：可选鉴权与 authRequired 同一查库口径，
 * 但无/失效 token 不抛 401 而降级游客（取不到角色即不过滤）。
 */
router.get('/messages', (req, res) => {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  const user = token ? findUserByToken(token) : null
  ok(res, listMessages(req.query.erpRole, user?.erpRole ?? null))
})

/** requireAuth 已保证登录；兜底防御路由未挂中间件被直接调用的场景（同 histories/favorites 约定） */
function currentUserId(req: Request): number {
  if (!req.user) throw new HttpError(401, '未登录或登录已失效')
  return req.user.id
}

/**
 * POST /api/checkins：m 打卡页每日打卡（强制鉴权，admin/operator/user 均可）。
 * 契约 message 非固定 ok（首次"打卡成功"/重复"今日已打卡"），直接组装信封（同 logout 约定）；
 * 请求体任意（空 {} 合法），打卡日期取服务器本地当日。
 */
router.post('/checkins', requireAuth, (req, res) => {
  const data = checkin(openDb(), currentUserId(req))
  res.status(200).json({ code: 0, message: data.duplicated ? '今日已打卡' : '打卡成功', data })
})

/** GET /api/checkins：打卡页/徽章墙状态聚合（积分/连续/完成数/徽章/本周日历，强制鉴权）。 */
router.get('/checkins', requireAuth, (req, res) => {
  ok(res, buildCheckinStatus(openDb(), currentUserId(req)))
})

export default router
