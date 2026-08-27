import type { ApiResp } from './types'

/** localStorage 键名收口（token 持久化，api.ts 与 AuthContext 共用） */
export const TOKEN_KEY = 'erp_token'

/** 401 登录引导事件：各端监听后弹选角色登录，登录完成回原位（AC-FN-03） */
export const AUTH_REQUIRED_EVENT = 'auth:required'

/** 登录/切角色成功事件：RoleLoginModal 成功后广播，页面（如首页推荐区）监听后重取数据 */
export const LOGIN_SUCCESS_EVENT = 'auth:login-success'

export function emitLoginSuccess(): void {
  window.dispatchEvent(new CustomEvent(LOGIN_SUCCESS_EVENT))
}

/** code≠0 的业务错误（message 为后端统一文案，直接可用于 toast） */
export class ApiError extends Error {
  readonly code: number
  /** 失败响应信封中的 data（如详情 404 提示页的 reason/related），无则为 undefined */
  readonly data?: unknown

  constructor(code: number, message: string, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** 监听 401 登录引导事件，返回解绑函数（组件卸载时调用） */
export function onAuthRequired(handler: () => void): () => void {
  window.addEventListener(AUTH_REQUIRED_EVENT, handler)
  return () => window.removeEventListener(AUTH_REQUIRED_EVENT, handler)
}

/** 监听登录成功事件，返回解绑函数（页面级消费：重取角色相关数据） */
export function onLoginSuccess(handler: () => void): () => void {
  window.addEventListener(LOGIN_SUCCESS_EVENT, handler)
  return () => window.removeEventListener(LOGIN_SUCCESS_EVENT, handler)
}

/**
 * 统一 fetch：自动注入 Bearer token（localStorage）；HTTP 401 或业务 code=401
 * 时清本地态并广播 auth:required；code≠0 抛 ApiError；成功返回信封中的 data。
 * signal：可选中断信号（列表页搜索 1s 超时兜底竞速，AC-EG-11）。
 */
export async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const resp = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  // 后端统一 JSON 信封；代理/网关故障等极端情况解析失败时兜底为通用错误
  let json: ApiResp<T> | undefined
  try {
    json = (await resp.json()) as ApiResp<T>
  } catch {
    json = undefined
  }

  // 401 双口径（HTTP 状态码与业务码）：清态 + 广播登录引导
  if (resp.status === 401 || json?.code === 401) {
    clearToken()
    window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT))
    throw new ApiError(401, json?.message ?? '未登录或登录已失效')
  }

  if (!json) throw new ApiError(resp.status, `请求失败（HTTP ${resp.status}）`)
  if (json.code !== 0) throw new ApiError(json.code, json.message, json.data)
  return json.data
}

export const get = <T>(url: string, signal?: AbortSignal) => request<T>('GET', url, undefined, signal)
export const post = <T>(url: string, body?: unknown) => request<T>('POST', url, body)
export const put = <T>(url: string, body?: unknown) => request<T>('PUT', url, body)
export const del = <T>(url: string) => request<T>('DELETE', url)
