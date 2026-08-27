import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { get } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import type { Page, Tutorial } from '../../shared/types'
import { ADMIN_MENU } from '../routes'

/** 审核动作后角标刷新事件（FE-04 审核页通过/驳回/撤回后 dispatch 刷新角标） */
export const REVIEW_CHANGED_EVENT = 'admin:review-changed'

/** 待审角标数：GET /api/tutorials?status=pending 取 total；total=0 或请求失败均隐藏（FE-01 交互 3） */
function usePendingTotal(enabled: boolean): number {
  const [total, setTotal] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    const load = () =>
      get<Page<Tutorial>>('/api/tutorials?status=pending&page=1&pageSize=1')
        .then((data) => alive && setTotal(data.total))
        .catch(() => alive && setTotal(0)) // 静默隐藏，不打断后台使用
    load()
    window.addEventListener(REVIEW_CHANGED_EVENT, load)
    return () => {
      alive = false
      window.removeEventListener(REVIEW_CHANGED_EVENT, load)
    }
  }, [enabled])
  return total
}

/** 240px 深色侧栏（5 个内容页共用）：品牌区 + 角色显隐菜单 + 待审角标 + AI 预留置灰 + 版本脚注 */
export default function Sidebar() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const pendingTotal = usePendingTotal(isAdmin)

  if (!user) return null // AdminLayout 守卫保证可达，TS 收窄兜底

  const visibleMenu = ADMIN_MENU.filter((m) => m.roles.includes(user.role))

  return (
    <aside className="sidebar" data-testid="admin-sidebar">
      <div className="brand">
        <div className="brand-logo">📚</div>
        <div>
          <div className="brand-name">云ERP教程中心</div>
          <div className="brand-sub">管理后台</div>
        </div>
      </div>
      <nav className="menu">
        <div className="menu-title">内容管理</div>
        {visibleMenu.map((m) => (
          <NavLink
            key={m.path}
            to={m.path}
            className={({ isActive }) => `menu-item${isActive ? ' active' : ''}`}
            data-testid={`sidebar-${m.path.slice(1)}-link`}
          >
            <span className="mi">{m.icon}</span>
            {m.label}
            {m.badge === 'pending' && pendingTotal > 0 && (
              <span className="menu-badge" data-testid="review-badge">
                {pendingTotal}
              </span>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <div className="menu-item reserved" data-testid="sidebar-ai-reserved" title="规划中，当前版本不开放">
            <span className="mi">🤖</span>AI 生成审核<span className="tag-reserved">预留</span>
          </div>
        )}
      </nav>
      <div className="side-foot">v1.0 · 演示环境</div>
    </aside>
  )
}
