import type { ErpModule, ErpRole, Role, TutorialStatus } from './types'

/** 后台两级角色展示名（admin 顶栏/角色说明共用；user 为前台角色不进后台） */
export const ROLE_LABELS = {
  admin: '平台管理员',
  operator: '运营编辑',
  user: '普通用户',
} as const satisfies Record<Role, string>

/** ERP 六角色（前台/小程序选角色登录的演示账号，AC-RULE-26） */
export const ERP_ROLE_LABELS = {
  sales: '销售',
  purchase: '采购',
  produce: '生产',
  warehouse: '仓库',
  manage: '管理',
  finance: '财务',
} as const satisfies Record<ErpRole, string>

export const ERP_ROLES: ReadonlyArray<{ value: ErpRole; label: string }> = Object.entries(
  ERP_ROLE_LABELS,
).map(([value, label]) => ({ value: value as ErpRole, label }))

/**
 * 六演示角色的卡片文案（图标 + 人格名，UI 设计稿 ui_portal_home.html 口径）。
 * 选角色登录弹窗角色卡与顶栏角色徽章共用；后端 displayName 为「角色·演示用户」，
 * 展示层按设计稿统一使用人格名（FE-01 implementation-notes 有记录）。
 */
export const ERP_ROLE_DEMOS: Readonly<Record<ErpRole, { icon: string; persona: string }>> = {
  sales: { icon: '📈', persona: '李娜' },
  purchase: { icon: '🛒', persona: '张伟' },
  produce: { icon: '🏭', persona: '王强' },
  warehouse: { icon: '📦', persona: '赵敏' },
  manage: { icon: '⚙️', persona: '陈涛' },
  finance: { icon: '💰', persona: '周莉' },
}

/** 云ERP 8 大模块（分类模块映射的可选项，PRD §2/§7.8） */
export const ERP_MODULE_LABELS = {
  sales: '销售管理',
  project: '项目管理',
  file: '文件管理',
  produce: '生产制造',
  purchase: '采购管理',
  inventory: '库存管理',
  hrFinance: '人事财务',
  system: '系统设置',
} as const satisfies Record<ErpModule, string>

export const ERP_MODULES: ReadonlyArray<{ value: ErpModule; label: string }> = Object.entries(
  ERP_MODULE_LABELS,
).map(([value, label]) => ({ value: value as ErpModule, label }))

/** 「角色 · 人格名」展示口径（顶栏角色徽章与我的页页头共用；后台账号无 ERP 角色回退展示名） */
export function rolePersonaText(user: { erpRole: ErpRole | null; displayName: string }): string {
  return user.erpRole
    ? `${ERP_ROLE_LABELS[user.erpRole]} · ${ERP_ROLE_DEMOS[user.erpRole].persona}`
    : user.displayName
}

/** 人格名（我的页头像首字来源；后台账号无 ERP 角色回退展示名） */
export function personaName(user: { erpRole: ErpRole | null; displayName: string }): string {
  return user.erpRole ? ERP_ROLE_DEMOS[user.erpRole].persona : user.displayName
}

/**
 * 角色→模块映射：角色推荐位（GET /api/recommend）与 ERP 工作台内嵌入口的
 * 命中集依据（PRD §7.1）；manage 为全部 8 模块。
 */
export const ROLE_MODULE_MAP: Record<ErpRole, ErpModule[]> = {
  sales: ['sales'],
  purchase: ['purchase', 'inventory'],
  produce: ['produce', 'project'],
  warehouse: ['inventory'],
  finance: ['hrFinance', 'sales'],
  manage: ERP_MODULES.map((m) => m.value),
}

/** 首页分类宫格图标（设计稿 ui_portal_home.html .ccell .ic 口径，模块分类用） */
const CELL_ICON_BY_MODULE: Record<ErpModule, string> = {
  sales: '📈',
  project: '📁',
  file: '🗂️',
  produce: '🏭',
  purchase: '🛒',
  inventory: '📦',
  hrFinance: '💰',
  system: '⚙️',
}

/** 首页宫格副题（模块分类，设计稿 .ccell .cnt 口径） */
const CELL_SUB_BY_MODULE: Record<ErpModule, string> = {
  sales: '报价/订单/报表',
  project: '立项/排期/交付',
  file: '成果物/权限',
  produce: 'BOM/算料/报工',
  purchase: '申请/下单/检验',
  inventory: '库位/出入库/盘点',
  hrFinance: '员工/权限/对账',
  system: '审批流/打印模板',
}

/** 通用四分类（erpModule=null）按分类名匹配图标与副题 */
const CELL_META_BY_NAME: Record<string, { icon: string; sub: string }> = {
  新手入门: { icon: '🚀', sub: '产品总览/快速上手' },
  最佳实践: { icon: '🏆', sub: '行业方案/标杆案例' },
  常见问题: { icon: '❓', sub: '高频问题速查' },
  开放平台: { icon: '🔌', sub: 'API/对接指南' },
}

/**
 * 首页宫格格视觉（图标+副题）：模块分类按 erpModule 取，通用分类按名称匹配，
 * 未知分类兜底通用图标（后台新增分类前台不白板）。
 */
export function categoryCellMeta(name: string, erpModule: ErpModule | null): { icon: string; sub: string } {
  if (erpModule) {
    return { icon: CELL_ICON_BY_MODULE[erpModule], sub: CELL_SUB_BY_MODULE[erpModule] }
  }
  return CELL_META_BY_NAME[name] ?? { icon: '📄', sub: '' }
}

/** 分类名 → erpModule（八大模块分类按展示名反查；通用分类/未知名返回 null） */
const moduleByLabel: ReadonlyMap<string, ErpModule> = new Map(
  ERP_MODULES.map((m) => [ERP_MODULE_LABELS[m.value], m.value]),
)

/**
 * 分类缩略图标（m 收藏/历史卡片 52×52 缩略位）：仅按分类名取——favorites/histories
 * 契约不返回 erpModule，先按模块展示名反查，再按通用分类名，未知兜底 📄 不白板。
 */
export function categoryIcon(name: string | null): string {
  if (!name) return '📄'
  const mod = moduleByLabel.get(name)
  if (mod) return CELL_ICON_BY_MODULE[mod]
  return CELL_META_BY_NAME[name]?.icon ?? '📄'
}

/** 教程四态（tech-design §4 状态机；label 供后台列表/筛选标签用） */
export const TUTORIAL_STATUS_LABELS = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  offline: '已下架',
} as const satisfies Record<TutorialStatus, string>

export const TUTORIAL_STATUS: ReadonlyArray<{ value: TutorialStatus; label: string }> =
  Object.entries(TUTORIAL_STATUS_LABELS).map(([value, label]) => ({
    value: value as TutorialStatus,
    label,
  }))
