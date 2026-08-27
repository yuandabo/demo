import { useState } from 'react'
import { useAuth } from '../../shared/AuthContext'
import { ERP_ROLE_DEMOS, ERP_ROLES } from '../../shared/constants'
import type { ErpRole } from '../../shared/types'

/** 登录失败兜底文案（任务 FE-01 交互 3：非 401 失败时弹窗内提示，弹窗不关闭） */
const LOGIN_FAILED_TIP = '登录失败，请重试'
/** 缺省副文案（顶栏主动登录场景） */
const DEFAULT_SUBTITLE = '选择一个 ERP 演示角色（免密），登录后回到原页面原位置继续操作'

interface RoleLoginModalProps {
  open: boolean
  onClose: () => void
  /** 登录/切角色成功回调：Layout 接线为广播 auth:login-success，页面级监听后重取数据 */
  onLoginSuccess?: () => void
  /** 场景化副文案：未登录互动（收藏/评价）引导时由调用方传入（AC-FN-03/AC-EG-07） */
  subtitle?: string
}

/**
 * 选角色快速登录弹窗（PRD §7.11 · AC-FN-03）：六演示角色免密登录，
 * 成功后路由不动（回到原页面原位置），失败提示且弹窗不关闭。
 */
export default function RoleLoginModal({ open, onClose, onLoginSuccess, subtitle }: RoleLoginModalProps) {
  const { loginByRole } = useAuth()
  const [loadingRole, setLoadingRole] = useState<ErpRole | null>(null)
  const [error, setError] = useState('')

  if (!open) return null

  async function pickRole(erpRole: ErpRole) {
    if (loadingRole) return
    setLoadingRole(erpRole)
    setError('')
    try {
      await loginByRole(erpRole)
      // 成功回调先于 onClose：消费方可在 onClose 里清理"待重放操作"而不误伤刚投递的重放（AC-FN-03）
      onLoginSuccess?.()
      onClose()
    } catch {
      // 含 401（演示账号缺失）与非 401 失败：统一提示，弹窗保留供重试
      setError(LOGIN_FAILED_TIP)
    } finally {
      setLoadingRole(null)
    }
  }

  return (
    <div
      className="rlm-mask"
      data-testid="role-login-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="rlm">
        <button
          type="button"
          className="close"
          data-testid="role-login-close-btn"
          aria-label="关闭弹窗"
          onClick={onClose}
        >
          ✕
        </button>
        <h3>🔑 选角色快速登录</h3>
        <div className="sub">{subtitle ?? DEFAULT_SUBTITLE}</div>
        <div className="rlm-grid">
          {ERP_ROLES.map(({ value, label }) => {
            const demo = ERP_ROLE_DEMOS[value]
            const loading = loadingRole === value
            return (
              <button
                type="button"
                key={value}
                className={`rlm-card${loading ? ' loading' : ''}`}
                data-testid={`role-card-${value}`}
                disabled={loadingRole !== null}
                onClick={() => pickRole(value)}
              >
                <div className="ic">{demo.icon}</div>
                <b>{label}</b>
                <span>
                  {label} · {demo.persona}
                </span>
                {loading && <span className="ld">登录中…</span>}
              </button>
            )
          })}
        </div>
        {error && (
          <div className="rlm-err" data-testid="role-login-error">
            {error}
          </div>
        )}
        <div className="rlm-tip">演示说明：6 个角色对应 ERP 权限矩阵，切换后首页「为你推荐」按新角色匹配分类</div>
      </div>
    </div>
  )
}
