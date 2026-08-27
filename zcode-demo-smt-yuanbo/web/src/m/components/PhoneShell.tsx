import type { ReactNode } from 'react'

/** 状态栏配色：dark=首页深色头部（白字），light=白底页（深字），默认 light */
export type StatusbarTheme = 'dark' | 'light'

interface PhoneShellProps {
  /** 滚动区内容（页面主体） */
  children: ReactNode
  /** 状态栏主题（ui_m_home.html 为白字，其余 4 页为深字） */
  statusbarTheme?: StatusbarTheme
  /** 固定头部（渲染在状态栏与滚动区之间、不随内容滚动；如首页深色头部） */
  header?: ReactNode
  /** 固定底部操作条（如详情页评价条），渲染在滚动区与 TabBar 之间、不随内容滚动 */
  footer?: ReactNode
  /** 底部导航（<TabBar />），渲染在 footer 与 homebar 之间 */
  tabBar?: ReactNode
}

/**
 * m 端手机壳：375×812（≤500px 视口自适应铺满，AC-NF-03），
 * notch / 状态栏 / 滚动容器 / home indicator，5 页共用（ui_m_home.html）。
 */
export default function PhoneShell({
  children,
  statusbarTheme = 'light',
  header,
  footer,
  tabBar,
}: PhoneShellProps) {
  return (
    <div className="phone">
      <div className="screen">
        <div className="notch" />
        <div className={`statusbar${statusbarTheme === 'dark' ? ' dark' : ''}`}>
          <span className="time">9:41</span>
          <span className="sicons">
            <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
              <rect x="0" y="6" width="3" height="4" rx="1" />
              <rect x="4.3" y="4" width="3" height="6" rx="1" />
              <rect x="8.6" y="2" width="3" height="8" rx="1" />
              <rect x="12.9" y="0" width="3" height="10" rx="1" />
            </svg>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
              <circle cx="7.5" cy="9.4" r="1.5" />
              <path d="M4.6 6.6a4.6 4.6 0 0 1 5.8 0l-1.1 1.3a3 3 0 0 0-3.6 0z" />
              <path d="M1.9 3.9a8.6 8.6 0 0 1 11.2 0l-1.1 1.3a6.9 6.9 0 0 0-9 0z" />
            </svg>
            <svg width="23" height="11" viewBox="0 0 23 11" fill="none">
              <rect x=".5" y=".5" width="19" height="10" rx="2.5" stroke="currentColor" opacity=".4" />
              <rect x="2" y="2" width="13" height="7" rx="1.2" fill="currentColor" />
              <rect x="20.5" y="3.2" width="2" height="4.6" rx="1" fill="currentColor" opacity=".4" />
            </svg>
          </span>
        </div>
        {header}
        <main className="scroll">{children}</main>
        {footer}
        {tabBar}
        <div className="homebar">
          <i />
        </div>
      </div>
    </div>
  )
}
