import type { Role } from '../shared/types'

/** 后台路由/菜单元数据：Sidebar 渲染、AdminLayout 角色守卫与面包屑标题的单一来源 */
export interface AdminRouteMeta {
  path: string
  label: string
  icon: string
  /** 可访问的后台角色（operator 无审核/目录，按角色显隐菜单） */
  roles: ReadonlyArray<Role>
  /** pending = 右侧待审角标（GET /api/tutorials?status=pending 的 total） */
  badge?: 'pending'
  /** 'page' = 无权角色放行挂载，由页面自渲染 403"无权限执行该操作"提示（AC-FN-18 前端侧，CHANGE-9） */
  roleGate?: 'page'
}

export const ADMIN_MENU: ReadonlyArray<AdminRouteMeta> = [
  { path: '/dashboard', label: '统计看板', icon: '📊', roles: ['admin', 'operator'] },
  { path: '/tutorial', label: '教程管理', icon: '📚', roles: ['admin', 'operator'] },
  { path: '/review', label: '审核队列', icon: '✅', roles: ['admin'], badge: 'pending', roleGate: 'page' },
  { path: '/category', label: '目录管理', icon: '🌲', roles: ['admin'] },
]

/** 非菜单内容页（教程编辑，:id=new 为新建） */
export const EDIT_ROUTE = { path: '/tutorial/edit/:id', label: '教程编辑' } as const

/** 登录后落位：admin→#/dashboard，operator→#/tutorial */
export function homePath(role: Role): string {
  return role === 'operator' ? '/tutorial' : '/dashboard'
}
