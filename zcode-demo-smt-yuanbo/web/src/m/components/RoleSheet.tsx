import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { onAuthRequired } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import type { ErpRole } from '../../shared/types'

/** 6 个演示角色卡（ui_m_home.html 选角色弹层；与 PC 前台共用同一套演示账号，AC-RULE-26） */
const ROLE_CARDS: ReadonlyArray<{ erpRole: ErpRole; icon: string; label: string; demoName: string }> = [
  { erpRole: 'sales', icon: '📈', label: '销售', demoName: '李娜' },
  { erpRole: 'purchase', icon: '🛒', label: '采购', demoName: '张伟' },
  { erpRole: 'produce', icon: '🏭', label: '生产', demoName: '王强' },
  { erpRole: 'warehouse', icon: '📦', label: '仓库', demoName: '赵敏' },
  { erpRole: 'manage', icon: '⚙️', label: '管理', demoName: '陈涛' },
  { erpRole: 'finance', icon: '💰', label: '财务', demoName: '周莉' },
]

interface RoleSheetValue {
  /**
   * 打开弹层；可携带登录成功后的重放动作（如补发被 401 拦截的收藏请求），
   * 配合弹层打开时记录的滚动位置，共同实现 AC-FN-03「回原页面原位置」。
   */
  openRoleSheet: (replay?: () => void) => void
}

const RoleSheetContext = createContext<RoleSheetValue | null>(null)

export function useRoleSheet(): RoleSheetValue {
  const ctx = useContext(RoleSheetContext)
  if (!ctx) throw new Error('useRoleSheet 必须在 <RoleSheetProvider> 内使用')
  return ctx
}

/** 找到当前页面 PhoneShell 的滚动容器（每页一个，路由切换会换新节点） */
function getScroller(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.scroll')
}

/**
 * 选角色快速登录半屏弹层（PRD §7.11 · AC-FN-03 / AC-RULE-26）：
 * 页面触发（openRoleSheet）或 401 事件（shared/api.ts 广播）打开；
 * 登录成功后关闭弹层、恢复原滚动位置并重放被拦截的操作。
 * 通过 portal 挂到 .screen 内，保证 mask/sheet 锚定手机屏而非整个视口。
 */
export function RoleSheetProvider({ children }: { children: ReactNode }) {
  const { loginByRole } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [host, setHost] = useState<HTMLElement | null>(null)
  const savedScrollRef = useRef(0)
  const replayRef = useRef<(() => void) | null>(null)

  const openRoleSheet = useCallback((replay?: () => void) => {
    // 记录打开时的滚动位置，登录成功后恢复（AC-FN-03 回原位）
    savedScrollRef.current = getScroller()?.scrollTop ?? 0
    replayRef.current = replay ?? null
    setError('')
    setOpen(true)
  }, [])

  // 401 登录引导：shared/api.ts 统一广播（无重放上下文，页面可另行调用 openRoleSheet 携带 replay）
  useEffect(() => onAuthRequired(() => openRoleSheet()), [openRoleSheet])

  // 弹层打开时才解析挂载点：路由切换后 .screen 节点会重建，须取当前节点
  useEffect(() => {
    if (open) setHost(document.querySelector<HTMLElement>('.screen'))
  }, [open])

  const close = useCallback(() => {
    if (!busy) setOpen(false)
  }, [busy])

  const pickRole = useCallback(
    async (erpRole: ErpRole) => {
      if (busy) return
      setBusy(true)
      setError('')
      try {
        await loginByRole(erpRole)
        setOpen(false)
        // 回原位：路由未变化，滚动容器仍是打开时的节点，直接恢复 scrollTop
        const scroller = getScroller()
        if (scroller) scroller.scrollTop = savedScrollRef.current
        replayRef.current?.()
        replayRef.current = null
      } catch (err) {
        // code≠0 / 网络失败：保留弹层与已选角色，提示重试
        setError(err instanceof Error ? err.message : '登录失败，请重试')
      } finally {
        setBusy(false)
      }
    },
    [busy, loginByRole],
  )

  const value = useMemo(() => ({ openRoleSheet }), [openRoleSheet])

  return (
    <RoleSheetContext.Provider value={value}>
      {children}
      {host &&
        createPortal(
          <>
            <div
              className={`sheet-mask${open ? ' show' : ''}`}
              data-testid="role-sheet-mask"
              onClick={close}
            />
            <div className={`sheet${open ? ' show' : ''}`} data-testid="role-sheet">
              <div className="bar" />
              <h4>🔑 选角色快速登录</h4>
              <div className="s-sub">选择一个 ERP 演示角色（免密），登录后回到原页面原位置</div>
              <div className={`sheet-grid${busy ? ' busy' : ''}`}>
                {ROLE_CARDS.map((card) => (
                  <button
                    key={card.erpRole}
                    type="button"
                    className="sc"
                    data-testid={`role-card-${card.erpRole}`}
                    disabled={busy}
                    onClick={() => pickRole(card.erpRole)}
                  >
                    <span className="i">{card.icon}</span>
                    <b>{card.label}</b>
                    <span>
                      {card.label} · {card.demoName}
                    </span>
                  </button>
                ))}
              </div>
              {error && (
                <div className="s-err" data-testid="role-sheet-error">
                  {error}
                </div>
              )}
              <div className="tip">演示说明：与 PC 前台共用同一套角色卡，切换后推荐位按新角色匹配分类</div>
            </div>
          </>,
          host,
        )}
    </RoleSheetContext.Provider>
  )
}
