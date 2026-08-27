import { HashRouter, Navigate, Route, Routes, matchPath, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '../shared/AuthContext'
import { ROLE_LABELS } from '../shared/constants'
import Sidebar from './components/Sidebar'
import Category from './pages/Category'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Review from './pages/Review'
import TutorialEdit from './pages/TutorialEdit'
import TutorialList from './pages/TutorialList'
import { ADMIN_MENU, EDIT_ROUTE, homePath } from './routes'

/** 根路径落位：已登录按角色跳首页，否则去登录页 */
function RootRedirect() {
  const { user } = useAuth()
  if (user && user.role !== 'user') return <Navigate to={homePath(user.role)} replace />
  return <Navigate to="/login" replace />
}

/** 后台骨架：路由守卫（AC-EG-06）+ 侧栏 + 顶栏（面包屑/头像/角色名/登出） */
function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // 守卫 1（AC-EG-06）：无后台会话直接输入后台 URL → 跳 #/login，不渲染骨架、零数据请求
  if (!user || user.role === 'user') return <Navigate to="/login" replace />

  // 守卫 2：operator 手输审核/目录 URL → 落位其可访问首页（与菜单显隐同源 ADMIN_MENU.roles）；
  // roleGate 页（#/review）例外：放行挂载由页面自渲染 403 提示（AC-FN-18 前端侧，CHANGE-9）
  const meta = ADMIN_MENU.find((m) => matchPath(m.path, location.pathname))
  if (meta && !meta.roles.includes(user.role) && !meta.roleGate) return <Navigate to={homePath(user.role)} replace />

  const title = meta?.label ?? (matchPath(EDIT_ROUTE.path, location.pathname) ? EDIT_ROUTE.label : '')
  const initial = (user.username.slice(0, 1) || '?').toUpperCase()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <header className="topbar" data-testid="admin-topbar">
          <div className="crumb" data-testid="topbar-breadcrumb">
            管理后台
            {title && (
              <>
                <span className="sep">/</span>
                <b>{title}</b>
              </>
            )}
          </div>
          <div className="admin">
            <div className="avatar" data-testid="topbar-avatar">
              {initial}
            </div>
            <div className="admin-info">
              <div className="admin-name">{user.username}</div>
              <div className="admin-role">{ROLE_LABELS[user.role]}</div>
            </div>
            <button type="button" className="btn-logout" onClick={handleLogout} data-testid="topbar-logout-btn">
              退出登录
            </button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          <Route element={<AdminLayout />}>
            {ADMIN_MENU.map((m) => (
              <Route
                key={m.path}
                path={m.path}
                element={
                  /* ADMIN_MENU 固定四路径（routes.ts）全覆盖，末分支收敛 /category */
                  m.path === '/dashboard' ? (
                    <Dashboard />
                  ) : m.path === '/tutorial' ? (
                    <TutorialList />
                  ) : m.path === '/review' ? (
                    <Review />
                  ) : (
                    <Category />
                  )
                }
              />
            ))}
            <Route path={EDIT_ROUTE.path} element={<TutorialEdit />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
