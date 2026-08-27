/**
 * 与 db.md 实体 / design/api 契约对齐的共享类型（三端共用）。
 * 命名口径：后端 snake_case 序列化为 camelCase 返回。
 */

/** 统一响应信封：code 0 成功；400/401/403/404/409 业务失败（tech-design §3） */
export interface ApiResp<T> {
  code: number
  message: string
  data: T
}

/** 后台角色（驱动前端功能开关与后端权限校验，AC-RULE-22/23/24） */
export type Role = 'admin' | 'operator' | 'user'

/** ERP 六角色（前台/小程序选角色登录的演示账号，AC-RULE-26） */
export type ErpRole = 'sales' | 'purchase' | 'produce' | 'warehouse' | 'manage' | 'finance'

/** 云ERP 8 大模块标识（分类的模块映射 erpModule，PRD §2） */
export type ErpModule =
  | 'sales'
  | 'project'
  | 'file'
  | 'produce'
  | 'purchase'
  | 'inventory'
  | 'hrFinance'
  | 'system'

/** 用户（login/role-login 的 data.user 与 GET /api/auth/me 返回对齐） */
export interface User {
  id: number
  username: string
  role: Role
  /** 后台账号为 null；普通用户六选一 */
  erpRole: ErpRole | null
  displayName: string
}

/** 登录响应 data（POST /api/auth/login 与 /api/auth/role-login 同构） */
export interface LoginResult {
  token: string
  user: User
}

/** 分类树节点（GET /api/categories，两级，children 最多一层） */
export interface Category {
  id: number
  name: string
  parentId: number | null
  sort: number
  status: 'enabled' | 'disabled'
  erpModule: ErpModule | null
  /** 仅 withCount=1 返回：前台可见教程数角标，0 篇前端显示"待补充" */
  tutorialCount?: number
  children: Category[]
}

/** 教程四态（tutorials.status，tech-design §4 状态机） */
export type TutorialStatus = 'draft' | 'pending' | 'published' | 'offline'

/** 教程卡片（GET /api/tutorials 的 list 项，前台/管理共用基础列） */
export interface Tutorial {
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

/** 教程详情（GET /api/tutorials/:id）：卡片列之上补充正文与个性化字段 */
export interface TutorialDetail extends Tutorial {
  /** 前台读线上过审版本快照 published_content */
  content: string
  status: TutorialStatus
  rejectReason: string | null
  submitCount: number
  authorId: number
  authorName?: string
  /** 是否存在线上过审版本（删除保护判定依据，管理口径返回） */
  hasOnlineVersion?: boolean
  lastOfflineAt?: string | null
  createdAt?: string
  /** 同分类相邻上/下一篇（前台口径，无则 null，UI-IXD-05）；管理口径固定 null/[] */
  prev: DetailNeighbor | null
  next: DetailNeighbor | null
  /** 同分类关联推荐 4 篇排除本篇（UI-IXD-16）；管理口径为 [] */
  related: RelatedItem[]
  /** 登录态个性化三件套；游客一律 null（AC-FN-03/04/25） */
  myFavorite: boolean | null
  /** 1 有帮助 / 0 没帮助；未评价为 null */
  myFeedback: number | null
  /** 阅读进度 0-100（AC-RULE-11 跨端单值覆盖） */
  myProgress: number | null
}

/** 收藏切换响应（POST/DELETE /api/favorites/:tutorialId） */
export interface FavoriteResult {
  tutorialId: number
  favorited: boolean
  favCount: number
}

/** 我的收藏列表项（GET /api/favorites 的 list 项，收藏时间倒序）；isOffline=true 前端灰显"已下架"且不可进正文（AC-RULE-04） */
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

/** 评价 upsert 响应（POST /api/feedbacks/:tutorialId） */
export interface FeedbackResult {
  tutorialId: number
  helpful: number
  helpfulYes: number
  helpfulNo: number
}

/** 进度保存响应（POST /api/histories/:tutorialId） */
export interface HistoryResult {
  tutorialId: number
  progress: number
  updatedAt: string
}

/** 浏览历史列表项（GET /api/histories 的 list 项，最近阅读时间倒序）；progress 0-100 跨端取最新值（AC-RULE-11） */
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

/** 上下篇相邻教程（详情 prev/next；无相邻为 null，前端按钮置灰，UI-IXD-05） */
export type DetailNeighbor = Pick<Tutorial, 'id' | 'title'>

/** 关联推荐卡（详情 related 与已下架提示页同类推荐共用，PRD §7.3） */
export type RelatedItem = Pick<Tutorial, 'id' | 'title' | 'summary' | 'viewCount'>

/** 前台详情负载（GET /api/tutorials/:id data）：卡片列 + 快照正文 + 上下篇/关联/登录态 my* 个性化 */
export interface PortalTutorialDetail extends Tutorial {
  /** 线上过审版本快照 published_content（富文本，渲染端须 sanitize） */
  content: string
  /** 作者展示名（users.displayName，无作者时 null 显示"—"） */
  authorName?: string | null
  prev: DetailNeighbor | null
  next: DetailNeighbor | null
  related: RelatedItem[]
  /** 登录态个性化字段；未登录为 null（myFavorite/myFeedback 归 FE-03 互动区消费） */
  myFavorite: boolean | null
  myFeedback: number | null
  /** 0-100 阅读进度；无记录或未登录为 null（继续阅读横幅依据） */
  myProgress: number | null
}

/** 详情 404 提示页数据（tech-design §6：offline 携带同类推荐，invisible 仅 reason） */
export interface DetailNotVisibleData {
  reason: 'offline' | 'invisible'
  related?: RelatedItem[]
}

/** 管理列表行（GET /api/tutorials?all=1 / status= 管理口径）：Tutorial 基础列 + 管理扩展列（FE-03） */
export interface AdminTutorial extends Tutorial {
  status: TutorialStatus
  /** 最近一次驳回原因（草稿且被驳回过时非空，UI-ELEM-07 驳回原因行依据） */
  rejectReason: string | null
  /** 累计提审次数（≥2 时标题旁渲染"修改版 v{n} · 回审中"角标） */
  submitCount: number
  authorName: string
  /** 是否存在线上过审版本（false 的草稿才渲染删除入口，AC-OP-06 删除保护） */
  hasOnlineVersion: boolean
}

/** 分页列表信封（GET /api/tutorials 等 data） */
export interface Page<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ── 分类写操作（design/api/{post-api-categories,put-api-categories-id}.md 契约，FE-06）──

/** 新增分类（POST /api/categories）的 data */
export interface CategoryCreated {
  id: number
  name: string
  parentId: number | null
  sort: number
  status: 'enabled' | 'disabled'
  erpModule: ErpModule | null
  createdAt: string
}

/** 保存分类（PUT /api/categories/:id，编辑/启停/排序/模块映射共用）的 data */
export interface CategoryUpdated extends Omit<CategoryCreated, 'createdAt'> {
  updatedAt: string
}

// ── 教程编辑器写操作（design/api/{post-api-tutorials,put-api-tutorials-id,
//    post-api-tutorials-id-submit,put-api-tutorials-id-top}.md 契约，FE-04）──

/** 新建（POST /api/tutorials）与保存（PUT /api/tutorials/:id）的 data */
export interface TutorialSaveResult {
  id: number
  status: TutorialStatus
  /** 仅 POST 返回 */
  createdAt?: string
  updatedAt: string
}

/** 提审（POST /api/tutorials/:id/submit）的 data */
export interface TutorialSubmitResult {
  id: number
  status: TutorialStatus
  submitCount: number
}

/** 置顶/排序（PUT /api/tutorials/:id/top）的 data */
export interface TutorialTopResult {
  id: number
  isTop: number
  sort: number
  status: TutorialStatus
}

/** 审核（POST /api/tutorials/:id/review，FE-05）：approve 与 reject 按动作返回不同字段子集 */
export interface ReviewResult {
  id: number
  /** approve 返回 published；reject 返回 draft */
  status: TutorialStatus
  /** 仅 approve：快照发布时间 */
  publishedAt?: string
  /** 审核留痕：审核人与审核时间 */
  reviewerId?: number
  reviewedAt?: string
  /** 仅 reject：驳回原因原文（展示在编辑页顶部） */
  rejectReason?: string
}

/** 消息条目（GET /api/messages，mock 审批待办，v1.1 迭代池预留） */
export interface MessageItem {
  id: number
  erpRole: ErpRole
  title: string
  tutorialId: number | null
  tutorialTitle: string | null
  isRead: number
  createdAt: string
}

/** 打卡状态聚合（GET /api/checkins data，m 首页横幅/打卡页/徽章墙共用） */
export interface CheckinStatus {
  todayChecked: boolean
  totalPoints: number
  streak: number
  bestStreak: number
  completedTutorials: number
  badges: string[]
  weekCalendar: Array<{ date: string; isChecked: boolean }>
}

/** 每日打卡响应（POST /api/checkins data）：duplicated=true 为当日重复幂等返回（pointsAdded=0，积分不再增加） */
export interface CheckinResult {
  checkinDate: string
  pointsAdded: number
  totalPoints: number
  streak: number
  badges: string[]
  duplicated: boolean
}

// ── 统计看板（GET /api/stats/*，design/api/get-api-stats-*.md 契约，FE-02）──

/** 浏览量 Top10 条目（overview.topViewed，按 viewCount 倒序） */
export interface TopViewedItem {
  id: number
  title: string
  viewCount: number
}

/** 总览 4 指标 + Top10（GET /api/stats/overview） */
export interface StatsOverview {
  publishedCount: number
  totalViewCount: number
  totalFavCount: number
  /** 平均有帮助率（%）；零反馈教程不计分母，全零反馈为 null（前端显示"—"） */
  avgHelpfulRate: number | null
  topViewed: TopViewedItem[]
}

/** "没帮助"留言明细（仅后台反馈分析可见，AC-RULE-20） */
export interface FeedbackComment {
  userId: number
  displayName: string
  comment: string
  updatedAt: string
}

/** 反馈分析行（按 notHelpfulRate 倒序，null 排尾；isRed=占比 >50% 标红，UI-ELEM-03） */
export interface FeedbackAnalysisItem {
  tutorialId: number
  title: string
  helpfulYes: number
  helpfulNo: number
  /** %，1 位小数；零反馈为 null（前端显示"—"，不参与标红） */
  notHelpfulRate: number | null
  isRed: boolean
  comments: FeedbackComment[]
}

/** 反馈分析（GET /api/stats/feedback） */
export interface StatsFeedback {
  list: FeedbackAnalysisItem[]
}

/** 覆盖度矩阵单元：启用分类 × 前台可见教程数（isBlank=0 篇标空白区，UI-ELEM-04） */
export interface CoverageCell {
  categoryId: number
  name: string
  parentId: number | null
  erpModule: string | null
  tutorialCount: number
  isBlank: boolean
}

/** 模块聚合行：erpModule 维度汇总（无模块映射的通用分类不进 modules） */
export interface CoverageModule {
  erpModule: string
  moduleName: string
  categoryCount: number
  tutorialCount: number
  isBlank: boolean
}

/** 覆盖度（GET /api/stats/coverage） */
export interface StatsCoverage {
  matrix: CoverageCell[]
  modules: CoverageModule[]
}

/** 推荐位教程卡（GET /api/recommend 的 list 项）：卡片所需子集，无 isTop/updatedAt 等列 */
export type RecommendTutorial = Pick<
  Tutorial,
  | 'id'
  | 'title'
  | 'summary'
  | 'tags'
  | 'categoryId'
  | 'categoryName'
  | 'viewCount'
  | 'favCount'
  | 'publishedAt'
>

/** GET /api/recommend 的 data：source=role 按角色映射命中集 / global 全站口径（AC-RULE-16） */
export interface RecommendResult {
  source: 'role' | 'global'
  erpRole: ErpRole | null
  list: RecommendTutorial[]
}
