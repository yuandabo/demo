/**
 * 统计看板（IT-02/BE-06）：GET /api/stats/overview | feedback | coverage 三端点
 * 契约：docs/design/api/get-api-stats-{overview,feedback,coverage}.md
 * 核心规则：三端点教程行全部限定 VISIBLE_SQL（前台可见口径：已下架不计入、
 * 回审期间旧版计入，与列表/推荐可对账，AC-RULE-08/09）；admin/operator 可访问
 * （operator 只读同数据，AC-RULE-23），user 403；空库返回 0/null/[] 不报错（AC-EG-12）。
 * 挂载：由 routes/index.ts 统一挂载（并行任务协调点，本文件只导出 router）。
 */
import type { DatabaseSync } from 'node:sqlite'
import { Router } from 'express'
import { openDb, VISIBLE_SQL } from '../db.js'
import { requireAuth, requireRole } from '../auth.js'
import { ok } from '../response.js'

// ── service 层（tech-design §11 冻结命名：buildOverview / buildFeedbackAnalysis / buildCoverage）──

/** 浏览量条形图条数上限（PRD §7.9 Top10） */
const TOP_VIEWED_LIMIT = 10

/**
 * 没帮助占比标红阈值：严格大于 50% 才标红，恰好 50% 不标（UI-ELEM-03）。
 * 与标红判定一律用取整后的响应值比较，保证前端"看到的占比"与红标自洽。
 */
const NOT_HELPFUL_RED_THRESHOLD = 50

/** 百分比保留 1 位小数（AC-RULE-10 精度；聚合后一次性取整，避免逐条取整累计误差） */
function round1(value: number): number {
  return Math.round(value * 10) / 10
}

// ── 总览（GET /api/stats/overview）──────────────────────────────

/** 浏览量 Top10 条目（条形图数据源，get-api-stats-overview.md 契约字段） */
export interface TopViewedItem {
  id: number
  title: string
  viewCount: number
}

export interface OverviewData {
  publishedCount: number
  totalViewCount: number
  totalFavCount: number
  /** 平均有帮助率：逐教程 rate 的算术平均（AC-RULE-10）；零反馈教程不计分母，全部零反馈为 null（前端显示"—"） */
  avgHelpfulRate: number | null
  topViewed: TopViewedItem[]
}

/**
 * 总览 4 指标 + Top10（AC-FN-14）：教程行全部限定 VISIBLE_SQL——已下架教程历史浏览
 * 不计入、回审期间旧版计入，与前台列表可对账（AC-RULE-08）。
 * 平均有帮助率必须"逐教程 rate 再算术平均"而非全局 SUM 比值（AC-RULE-10 按教程算术后
 * 平均），故走子查询 AVG；分母为 0 的教程被 WHERE 过滤，全零反馈时 AVG 返回 NULL。
 * 总收藏量 = favorites 表当前有效行数（取消即减，AC-RULE-09），非 tutorials.fav_count 冗余列。
 */
export function buildOverview(): OverviewData {
  const db = openDb()
  const metrics = db
    .prepare(
      `SELECT COUNT(*) AS publishedCount, COALESCE(SUM(view_count), 0) AS totalViewCount
       FROM tutorials WHERE ${VISIBLE_SQL}`
    )
    .get() as { publishedCount: number; totalViewCount: number }
  const { avgRate } = db
    .prepare(
      `SELECT AVG(CAST(helpful_yes AS REAL) / (helpful_yes + helpful_no) * 100) AS avgRate
       FROM tutorials WHERE ${VISIBLE_SQL} AND helpful_yes + helpful_no > 0`
    )
    .get() as { avgRate: number | null }
  const { totalFavCount } = db.prepare('SELECT COUNT(*) AS totalFavCount FROM favorites').get() as {
    totalFavCount: number
  }
  const topViewed = db
    .prepare(
      `SELECT id, title, view_count AS viewCount FROM tutorials
       WHERE ${VISIBLE_SQL} ORDER BY view_count DESC, id ASC LIMIT ${TOP_VIEWED_LIMIT}`
    )
    .all() as unknown as TopViewedItem[]
  return {
    publishedCount: Number(metrics.publishedCount),
    totalViewCount: Number(metrics.totalViewCount),
    totalFavCount: Number(totalFavCount),
    avgHelpfulRate: avgRate === null ? null : round1(avgRate),
    topViewed,
  }
}

// ── 反馈分析（GET /api/stats/feedback）──────────────────────────────

/** 留言明细（仅本端点后台可见，AC-RULE-20；displayName 联表 users） */
export interface FeedbackComment {
  userId: number
  displayName: string
  comment: string
  updatedAt: string
}

export interface FeedbackItem {
  tutorialId: number
  title: string
  helpfulYes: number
  helpfulNo: number
  /** 没帮助占比（百分比 1 位小数）；零反馈为 null（前端显示"—"）不参与标红判定 */
  notHelpfulRate: number | null
  isRed: boolean
  comments: FeedbackComment[]
}

/**
 * 没帮助优先清单：可见教程逐条算 notHelpfulRate = 没帮助÷(有帮助+没帮助)，
 * 按占比倒序、null（零反馈）沉底保留在尾部供内容治理参考（AC-RULE-10 / 工程兜底定义）。
 * 留言明细一次 IN 预取后按教程分组，避免逐教程查询的 N+1。
 */
export function buildFeedbackAnalysis(): { list: FeedbackItem[] } {
  const db = openDb()
  const rows = db
    .prepare(
      `SELECT id AS tutorialId, title, helpful_yes AS helpfulYes, helpful_no AS helpfulNo
       FROM tutorials WHERE ${VISIBLE_SQL}`
    )
    .all() as Array<Omit<FeedbackItem, 'notHelpfulRate' | 'isRed' | 'comments'>>

  const commentsByTutorial = fetchCommentsByTutorial(
    db,
    rows.map((row) => row.tutorialId),
  )

  const list: FeedbackItem[] = rows.map((row) => {
    const total = row.helpfulYes + row.helpfulNo
    // 零反馈（分母 0）→ null：不参与标红判定（AC-RULE-10），排序时沉底
    const notHelpfulRate = total > 0 ? round1((row.helpfulNo / total) * 100) : null
    return {
      ...row,
      notHelpfulRate,
      isRed: notHelpfulRate !== null && notHelpfulRate > NOT_HELPFUL_RED_THRESHOLD,
      comments: commentsByTutorial.get(row.tutorialId) ?? [],
    }
  })
  // null 以 -1 参与比较必沉底（合法占比 ∈ [0,100]）；同占比按 id 升序保证确定性
  list.sort((a, b) => {
    const rateA = a.notHelpfulRate ?? -1
    const rateB = b.notHelpfulRate ?? -1
    return rateB - rateA || a.tutorialId - b.tutorialId
  })
  return { list }
}

type CommentRow = FeedbackComment & { tutorialId: number }

/** 留言批量预取：仅 comment 非空记录，按留言时间倒序（同秒按 userId 决胜负），分组后逐条挂载 */
function fetchCommentsByTutorial(db: DatabaseSync, tutorialIds: number[]): Map<number, FeedbackComment[]> {
  const grouped = new Map<number, FeedbackComment[]>()
  if (tutorialIds.length === 0) return grouped
  const rows = db
    .prepare(
      `SELECT f.tutorial_id AS tutorialId, f.user_id AS userId, u.display_name AS displayName,
              f.comment, f.updated_at AS updatedAt
       FROM feedbacks f JOIN users u ON u.id = f.user_id
       WHERE f.comment IS NOT NULL AND f.tutorial_id IN (${tutorialIds.map(() => '?').join(',')})
       ORDER BY f.updated_at DESC, f.user_id DESC`
    )
    .all(...tutorialIds) as unknown as CommentRow[]
  // 分组键 tutorialId 不属于契约留言对象，装包时剥离
  for (const { tutorialId, ...comment } of rows) {
    const comments = grouped.get(tutorialId)
    if (comments) {
      comments.push(comment)
    } else {
      grouped.set(tutorialId, [comment])
    }
  }
  return grouped
}

// ── 覆盖度（GET /api/stats/coverage）──────────────────────────────

/** 覆盖度矩阵单元：启用分类 × 前台可见教程数（AC-RULE-08 可见口径，回审旧版计入） */
export interface CoverageCell {
  categoryId: number
  name: string
  parentId: number | null
  erpModule: string | null
  /** 该分类前台可见教程数；一级分类含子分类汇总 */
  tutorialCount: number
  /** 0 篇标"空白区"（UI-ELEM-04） */
  isBlank: boolean
}

/** 模块聚合视图：erpModule 维度汇总（无模块映射的通用分类不进 modules） */
export interface CoverageModule {
  erpModule: string
  /** 取该模块 sort 最靠前的启用分类名（种子口径下每模块恰一个一级分类） */
  moduleName: string
  categoryCount: number
  tutorialCount: number
  isBlank: boolean
}

export interface CoverageData {
  matrix: CoverageCell[]
  modules: CoverageModule[]
}

/**
 * 覆盖度矩阵 + 模块聚合：启用分类全量（含一二级，sort 升序）× 各分类可见教程数。
 * 一级分类计数 = 自身 + 直接子分类（AC 自测口径"模块 tutorialCount=启用分类计数之和"，
 * 故模块数为矩阵行求和，模块内同时挂一级+子级时按该口径计量）。
 */
export function buildCoverage(): CoverageData {
  const db = openDb()
  const categories = db
    .prepare(
      `SELECT id, name, parent_id AS parentId, erp_module AS erpModule
       FROM categories WHERE status = 'enabled' ORDER BY sort ASC, id ASC`
    )
    .all() as Array<{ id: number; name: string; parentId: number | null; erpModule: string | null }>
  const ownCounts = new Map(
    (
      db
        .prepare(`SELECT category_id AS categoryId, COUNT(*) AS n FROM tutorials WHERE ${VISIBLE_SQL} GROUP BY category_id`)
        .all() as Array<{ categoryId: number; n: number }>
    ).map((row) => [row.categoryId, Number(row.n)]),
  )

  // 子分类可见数向直接父级汇总（父级为 NULL 的行不参与，防孤儿 parentId 误并）
  const childCountByParent = new Map<number, number>()
  for (const cat of categories) {
    if (cat.parentId !== null) {
      childCountByParent.set(cat.parentId, (childCountByParent.get(cat.parentId) ?? 0) + (ownCounts.get(cat.id) ?? 0))
    }
  }

  const matrix: CoverageCell[] = categories.map((cat) => {
    const tutorialCount =
      (ownCounts.get(cat.id) ?? 0) + (cat.parentId === null ? childCountByParent.get(cat.id) ?? 0 : 0)
    return {
      categoryId: cat.id,
      name: cat.name,
      parentId: cat.parentId,
      erpModule: cat.erpModule,
      tutorialCount,
      isBlank: tutorialCount === 0,
    }
  })

  const moduleMap = new Map<string, CoverageModule>()
  for (const cell of matrix) {
    if (cell.erpModule === null) continue
    const existing = moduleMap.get(cell.erpModule)
    if (existing) {
      existing.categoryCount += 1
      existing.tutorialCount += cell.tutorialCount
    } else {
      moduleMap.set(cell.erpModule, {
        erpModule: cell.erpModule,
        moduleName: cell.name,
        categoryCount: 1,
        tutorialCount: cell.tutorialCount,
        isBlank: cell.tutorialCount === 0,
      })
    }
  }
  for (const module of moduleMap.values()) {
    // 聚合后再判空白：单分类非空但模块内另一分类为空时以模块汇总为准
    module.isBlank = module.tutorialCount === 0
  }
  return { matrix, modules: [...moduleMap.values()] }
}

// ── 路由层（鉴权 + 编排，无参数无写操作）──────────────────────────────

const router = Router()

// 看板为 admin/operator 专属（operator 只读同数据，AC-RULE-23）；
// requireAuth 先行：未登录必须 401 而非 403（契约失败场景表）
const statsGuard = [requireAuth, requireRole('admin', 'operator')]

router.get('/overview', ...statsGuard, (_req, res) => {
  ok(res, buildOverview())
})

router.get('/feedback', ...statsGuard, (_req, res) => {
  ok(res, buildFeedbackAnalysis())
})

router.get('/coverage', ...statsGuard, (_req, res) => {
  ok(res, buildCoverage())
})

export default router
