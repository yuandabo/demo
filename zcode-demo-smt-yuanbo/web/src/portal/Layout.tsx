import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { emitLoginSuccess, onAuthRequired } from '../shared/api'
import RoleLoginModal from './components/RoleLoginModal'
import Topbar from './components/Topbar'

/**
 * portal 全局布局：吸顶 Topbar + 路由出口 + 页脚。
 * 挂 RoleLoginModal 全局单例：角色徽章点击或任意接口 401（auth:required 事件）时弹出。
 */
export default function PortalLayout() {
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => onAuthRequired(() => setLoginOpen(true)), [])

  return (
    <>
      <Topbar onOpenLogin={() => setLoginOpen(true)} />
      <main className="wrap">
        <Outlet />
      </main>
      <footer className="footer">嘉立创云ERP · 教程中心</footer>
      <RoleLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={emitLoginSuccess}
      />
    </>
  )
}
