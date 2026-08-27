import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../shared/AuthContext'
import { homePath } from '../routes'

/** 登录失败统一文案：不区分账号不存在/密码错误/角色不符，防账号枚举（PRD §7.11） */
const LOGIN_FAILED_MSG = '账号或密码错误'
const LOGIN_EMPTY_MSG = '请输入账号和密码'

/** 管理后台登录页（复刻 ui/ui_admin_login.html）：账号密码 → POST /api/auth/login → 按角色落位 */
export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const accountRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // 登录成功（含已登录再访 #/login）按角色跳转：admin→#/dashboard，operator→#/tutorial
  useEffect(() => {
    if (user && user.role !== 'user') navigate(homePath(user.role), { replace: true })
  }, [user, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const acc = username.trim()
    const pwd = password.trim()
    if (!acc || !pwd) {
      setError(LOGIN_EMPTY_MSG)
      ;(acc ? passwordRef : accountRef).current?.focus()
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await login(acc, pwd)
      // 跳转交给上方 user effect（AuthContext 更新后触发）
    } catch {
      setError(LOGIN_FAILED_MSG) // 统一文案，表单值保留
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="bg-grid" />
      <div className="bg-glow g1" />
      <div className="bg-glow g2" />

      <div className="login-wrap">
        <div className="login-brand">
          <div className="login-brand-logo">📚</div>
          <div className="login-brand-name">云ERP教程中心</div>
          <div className="login-brand-sub">管理后台</div>
        </div>

        <div className="login-card">
          <h1>管理员登录</h1>
          <div className="sub">账号密码登录 · 两级角色（管理员 / 运营编辑）</div>

          {error && (
            <div className="error-tip" data-testid="login-error-tip" role="alert">
              ⚠ <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-item">
              <label htmlFor="login-username">账号</label>
              <div className="input-wrap">
                <span className="lead-ico">👤</span>
                <input
                  ref={accountRef}
                  id="login-username"
                  className="input"
                  type="text"
                  placeholder="请输入账号"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  data-testid="login-username-input"
                />
              </div>
            </div>
            <div className="form-item">
              <label htmlFor="login-password">密码</label>
              <div className="input-wrap">
                <span className="lead-ico">🔒</span>
                <input
                  ref={passwordRef}
                  id="login-password"
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  className="eye"
                  title="显示/隐藏密码"
                  aria-label={showPwd ? '隐藏密码' : '显示密码'}
                  onClick={() => setShowPwd((v) => !v)}
                  data-testid="login-eye-btn"
                >
                  👁
                </button>
              </div>
            </div>
            <button className="btn-login" type="submit" disabled={submitting} data-testid="login-submit-btn">
              {submitting ? '登录中…' : '登 录'}
            </button>
          </form>

          <div className="demo-account">
            演示账号 <span className="code">admin / 123456</span> 或{' '}
            <span className="code">operator / 123456</span>
            <br />
            admin 为平台管理员（审核/发布/看板）· operator 为运营编辑（建稿/提审，登录后仅见「教程管理」+「看板」只读，按角色显隐菜单）
            <br />
            前台 / 小程序「选角色快速登录」（销售/采购/生产/仓库/管理/财务 6 角色卡）已内嵌于 portal 与 m 端页面顶栏，无需本页登录
          </div>
        </div>

        <div className="login-foot">云ERP教程中心 · 演示环境 · 仅用于原型演示</div>
      </div>
    </div>
  )
}
