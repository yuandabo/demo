import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../shared/AuthContext'
import Layout from './Layout'
import Detail from './pages/Detail'
import Home from './pages/Home'
import List from './pages/List'
import My from './pages/My'
import Workbench from './pages/Workbench'
import './portal.css'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* 模拟 ERP 壳为独立全屏路由：自带顶栏/侧栏/fab，不套 portal 布局（设计稿整页即 ERP 壳） */}
          <Route path="/workbench" element={<Workbench />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/list" element={<List />} />
            <Route path="/my" element={<My />} />
            <Route path="/detail/:id" element={<Detail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
