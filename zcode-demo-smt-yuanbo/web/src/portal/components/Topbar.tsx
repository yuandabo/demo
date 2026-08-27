import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../shared/AuthContext'
import { rolePersonaText } from '../../shared/constants'
import type { User } from '../../shared/types'

/** 顶栏导航项（路由 hash 与 tech-design §7 路由表对齐；「我的」本迭代为占位路由） */
const NAV_ITEMS = [
  { to: '/', key: 'home', label: '教程首页', end: true },
  { to: '/list', key: 'list', label: '全部教程' },
  { to: '/workbench', key: 'workbench', label: '模拟工作台' },
  { to: '/my', key: 'my', label: '我的' },
] as const

interface TopbarProps {
  /** 点击角色徽章：打开选角色登录弹窗（Layout 持有弹窗单例） */
  onOpenLogin: () => void
}

/** 角色徽章文案：登录取共享「角色 · 人格名」口径（constants，与我的页页头共用），游客引导登录 */
function pillText(user: User | null): string {
  if (!user) return '游客 · 选角色登录'
  return rolePersonaText(user)
}

/** 顶部导航：logo（点击回教程首页，UI-IXD-15）+ 4 导航项（当前路由高亮）+ 角色徽章 */
export default function Topbar({ onOpenLogin }: TopbarProps) {
  const { user, restoring } = useAuth()
  const { pathname } = useLocation()
  // 详情页 #/detail/:id 属列表域（自列表/面包屑进入）：「全部教程」保持高亮（复刻评审 P1-#5）
  const detailAsList = pathname.startsWith('/detail/')

  return (
    <header className="topbar">
      <div className="wrap bar">
        <Link className="logo" to="/" data-testid="portal-logo-link">
          <span className="mark">ERP</span>嘉立创云ERP · 教程中心
        </Link>
        <nav className="nav">
          {NAV_ITEMS.map(({ to, key, label, ...rest }) => (
            <NavLink
              key={key}
              to={to}
              data-testid={`portal-nav-${key}`}
              className={({ isActive }) =>
                isActive || (key === 'list' && detailAsList) ? 'on' : undefined
              }
              {...rest}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {restoring && !user ? (
          <button type="button" className="who skel" data-testid="role-pill-skeleton" disabled>
            <i />
            <span className="sk" />
          </button>
        ) : (
          <button
            type="button"
            className="who"
            data-testid="role-pill-btn"
            onClick={onOpenLogin}
            title="点击切换演示角色（选角色快速登录）"
          >
            <i />
            {pillText(user)}
            {user && (
              <span className="caret" aria-hidden>
                ▾
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
