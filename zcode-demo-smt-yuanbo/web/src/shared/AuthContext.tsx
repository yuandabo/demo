import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { clearToken, get, getToken, post, setToken } from './api'
import type { ErpRole, LoginResult, User } from './types'

const USER_KEY = 'erp_user'

interface AuthContextValue {
  user: User | null
  /** 刷新恢复登录态中（/me 在途）：顶栏角色徽章显示骨架占位 */
  restoring: boolean
  /** 后台账号密码登录（admin/operator，AC-RULE-26） */
  login: (username: string, password: string) => Promise<void>
  /** 前台/小程序选角色快速登录（六角色演示账号，AC-RULE-26） */
  loginByRole: (erpRole: ErpRole) => Promise<void>
  /** 登出：作废服务端 token 并清本地登录态 */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** localStorage 恢复用户快照；脏数据（手改/旧结构）兜底为游客 */
function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)
  // 携带 token 刷新时 /me 在途标记：无 token 直接游客态，不进入恢复期
  const [restoring, setRestoring] = useState(() => !!getToken())

  const applyLogin = useCallback((result: LoginResult) => {
    setToken(result.token)
    localStorage.setItem(USER_KEY, JSON.stringify(result.user))
    setUser(result.user)
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      applyLogin(await post<LoginResult>('/api/auth/login', { username, password }))
    },
    [applyLogin],
  )

  const loginByRole = useCallback(
    async (erpRole: ErpRole) => {
      applyLogin(await post<LoginResult>('/api/auth/role-login', { erpRole }))
    },
    [applyLogin],
  )

  const logout = useCallback(async () => {
    // 服务端作废 DB token；即便接口失败也保证本地登出
    await post<unknown>('/api/auth/logout').catch(() => undefined)
    clearToken()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    // 页面刷新恢复登录态：游客（无 token）不调用，直接走游客口径（AC-RULE-25）
    if (!getToken()) return
    get<User>('/api/auth/me')
      .then((me) => {
        localStorage.setItem(USER_KEY, JSON.stringify(me))
        setUser(me)
      })
      .catch(() => {
        // token 失效（api.ts 已清 token）→ 回游客；401 时 api.ts 已广播 auth:required
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setRestoring(false))
  }, [])

  const value = useMemo(
    () => ({ user, restoring, login, loginByRole, logout }),
    [user, restoring, login, loginByRole, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 <AuthProvider> 内使用')
  return ctx
}
