import { HttpError } from './response.js'

/**
 * 教程领域共享基础：状态枚举 / 行类型 / 状态机转移表与合法性校验。
 * 消费方：IT-02 BE-01~BE-06（类型与枚举唯一来源，禁止各自重复定义）。
 * 关联：AC-RULE-05（合法迁移集）、AC-EG-09（非法迁移 409）、tech-design §4/§5/§11。
 */

// ── 共享领域枚举与类型（与 design/db/db.md §2 DDL 对齐） ──────────────────────

/** 教程四态（tutorials.status CHECK 约束一致，PRD §3.5） */
export const TUTORIAL_STATUSES = ['draft', 'pending', 'published', 'offline'] as const
export type TutorialStatus = (typeof TUTORIAL_STATUSES)[number]

/** 分类两态（categories.status CHECK 约束一致） */
export const CATEGORY_STATUSES = ['enabled', 'disabled'] as const
export type CategoryStatus = (typeof CATEGORY_STATUSES)[number]

/** 云ERP 8 大模块（categories.erp_module 取值，PRD §7.1 映射；可空列用 ErpModule | null） */
export const ERP_MODULES = [
  'sales',
  'project',
  'file',
  'produce',
  'purchase',
  'inventory',
  'hrFinance',
  'system',
] as const
export type ErpModule = (typeof ERP_MODULES)[number]

/** tutorials 表行（node:sqlite 按列名返回：tags 为 JSON 数组字符串，is_top 为 0/1） */
export interface TutorialRow {
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
  /** 线上过审版本快照：可见性口径（VISIBLE_SQL）与"是否存在旧版"判定均依赖此列 */
  published_content: string | null
  published_summary: string | null
  published_at: string | null
  /** 下架时间戳：回审来源为已下架时可见性需排除（规则④），重发布/过审时清空 */
  last_offline_at: string | null
  created_at: string
  updated_at: string
}

/** categories 表行 */
export interface CategoryRow {
  id: number
  name: string
  parent_id: number | null
  sort: number
  status: CategoryStatus
  erp_module: ErpModule | null
  created_at: string
  updated_at: string
}

/** 后台列表项扩展字段（BE-02 管理态列表/审核队列 v2 标识数据源，UI-ELEM-07/09；camelCase API 投影） */
export interface AdminTutorialListItem {
  status: TutorialStatus
  rejectReason: string | null
  submitCount: number
  authorId: number
  /** LEFT JOIN users.display_name，作者行缺失时为 null */
  authorName: string | null
  /** 是否存在线上过审版本（published_content IS NOT NULL 派生） */
  hasOnlineVersion: boolean
  lastOfflineAt: string | null
  createdAt: string
}

// ── 状态机（AC-RULE-05 合法迁移集） ──────────────────────────────────────────

/** 状态机动作（§11 冻结命名；editResubmit = PUT 保存触发的编辑回审） */
export const TUTORIAL_ACTIONS = [
  'submit',
  'withdraw',
  'reviewApprove',
  'reviewReject',
  'editResubmit',
  'offline',
  'republish',
] as const
export type TutorialAction = (typeof TUTORIAL_ACTIONS)[number]

/**
 * 合法迁移表（AC-RULE-05 全集 8 条迁移，与 PRD §3.5 / tech-design §4 状态图一致）。
 * delete 不入表：草稿删除是路由级行为（仅 published_content IS NULL 的纯草稿可删，
 * 前置判定留给 BE-03 删除路由），不存在目标状态。
 */
type TransitionTable = Readonly<
  Record<TutorialStatus, Readonly<Partial<Record<TutorialAction, TutorialStatus>>>>
>
const TUTORIAL_TRANSITIONS: TransitionTable = {
  draft: {
    submit: 'pending', // 提审
  },
  pending: {
    reviewApprove: 'published', // 审核通过（快照拷贝由 reviewTutorial 事务处理）
    reviewReject: 'draft', // 审核驳回
    withdraw: 'draft', // 运营撤回
  },
  published: {
    editResubmit: 'pending', // 编辑保存回审（前台旧版不断供）
    offline: 'offline', // 下架（last_offline_at=now）
  },
  offline: {
    republish: 'published', // 重新发布（内容未变不重审，清 last_offline_at）
    editResubmit: 'pending', // 编辑保存回审（内容已变需重审）
  },
}

/** 四态运行时判定（DB 读出的 status 属外部输入，防脏数据落入 409 误报） */
const TUTORIAL_STATUS_SET = new Set<string>(TUTORIAL_STATUSES)

/**
 * 校验状态迁移合法性：命中转移表返回目标状态，供调用方落库。
 * 未命中一律 409 "该教程状态已变化，请刷新"（AC-EG-09，教程状态保持不变）。
 * status 落在四态之外 → 500（服务端数据异常，理论不可达，仅兜底）。
 */
export function assertTutorialTransition(current: TutorialStatus, action: TutorialAction): TutorialStatus {
  if (!TUTORIAL_STATUS_SET.has(current)) {
    throw new HttpError(500, '教程状态数据异常')
  }
  const next = TUTORIAL_TRANSITIONS[current][action]
  if (next === undefined) {
    throw new HttpError(409, '该教程状态已变化，请刷新')
  }
  return next
}
