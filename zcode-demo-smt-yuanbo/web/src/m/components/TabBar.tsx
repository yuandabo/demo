import { Link, useLocation } from 'react-router-dom'

/** 底部导航 4 tab（首页/分类/收藏/打卡，ui_m_home.html）；精确匹配路由，#/detail/:id 无命中 */
const TABS = [
  { to: '/', label: '首页', icon: '🏠', testid: 'tabbar-home' },
  { to: '/list', label: '分类', icon: '📚', testid: 'tabbar-list' },
  { to: '/favorite', label: '收藏', icon: '⭐', testid: 'tabbar-favorite' },
  { to: '/checkin', label: '打卡', icon: '📅', testid: 'tabbar-checkin' },
] as const

export default function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={`tab${pathname === tab.to ? ' active' : ''}`}
          data-testid={tab.testid}
        >
          <span className="ico">{tab.icon}</span>
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
