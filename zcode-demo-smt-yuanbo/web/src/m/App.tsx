import { HashRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../shared/AuthContext'
import { RoleSheetProvider } from './components/RoleSheet'
import Checkin from './pages/Checkin'
import Detail from './pages/Detail'
import Favorite from './pages/Favorite'
import Home from './pages/Home'
import List from './pages/List'

/**
 * m 端骨架：AuthProvider（token 恢复/选角色登录）+ HashRouter + RoleSheet 弹层
 * + 5 条路由占位（FE-02~FE-06 逐页替换）；未命中路由回落首页。
 */
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <RoleSheetProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/list" element={<List />} />
            <Route path="/detail/:id" element={<Detail />} />
            <Route path="/favorite" element={<Favorite />} />
            <Route path="/checkin" element={<Checkin />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </RoleSheetProvider>
      </HashRouter>
    </AuthProvider>
  )
}
