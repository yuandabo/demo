/**
 * DB token 鉴权与认证域基础（tech-design §1 选型：登录发随机 token 入库，服务端查库校验）
 *
 * 所有权说明：本模块归 IT-01/BE-01（认证 4 端点 login/role-login/logout/me + 本模块全部导出）。
 * IT-04/BE-01 曾按跨任务约定先行落地"校验中间件"部分，本文件已合并其实现并保留导出契约：
 *   - authRequired：解析 `Authorization: Bearer {token}` → prepared 查 auth_tokens JOIN users
 *     → 挂 req.user（另挂 req.authToken 供 logout 作废）；无/失效 token 统一 401 "未登录或登录已失效"
 *   - requireAuth：authRequired 的约定别名（IT-04 业务路由统一按此名引用）
 */
import { randomBytes } from 'node:crypto'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { openDb } from './db.js'
import { HttpError } from './response.js'

/** users 表行（node:sqlite 按列名返回，snake_case；login/role-login 校验密码用） */
export interface UserRow {
  id: number
  username: string
  password: string
  role: 'admin' | 'operator' | 'user'
  erp_role: string | null
  display_name: string
  created_at: string
}

/** 当前登录用户（auth_tokens JOIN users 的投影，auth 域与业务路由共用；GET /api/auth/me 响应结构） */
export interface AuthUser {
  id: number
  username: string
  role: UserRow['role']
  erpRole: string | null
  displayName: string
  createdAt: string
}

declare global {
  namespace Express {
    interface Request {
      /** 鉴权中间件注入的当前登录用户（requireAuth/authRequired 之后必有） */
      user?: AuthUser
      /** authRequired 解析出的原始 Bearer token（logout 作废用） */
      authToken?: string
    }
  }
}

const BEARER_PREFIX = 'Bearer '
/** 随机 token 字节数：16 位 hex（契约示例同长度） */
const TOKEN_BYTES = 8

/** 签发 DB token：随机 16 hex 写入 auth_tokens 并返回 */
export function issueToken(userId: number): string {
  const token = randomBytes(TOKEN_BYTES).toString('hex')
  openDb().prepare('INSERT INTO auth_tokens (token, user_id) VALUES (?, ?)').run(token, userId)
  return token
}

/** 作废 token（登出即作废，后续携带该 token 的请求 401） */
export function revokeToken(token: string): void {
  openDb().prepare('DELETE FROM auth_tokens WHERE token = ?').run(token)
}

/** 按用户名查账号（login / role-login 共用；未命中返回 null） */
export function findUserByUsername(username: string): UserRow | null {
  const row = openDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined
  return row ?? null
}

/** token 查库校验（authRequired 共用口径；失效/伪造返回 null） */
export function findUserByToken(token: string): AuthUser | null {
  return (
    (openDb()
      .prepare(
        `SELECT u.id, u.username, u.role, u.erp_role AS erpRole, u.display_name AS displayName,
                u.created_at AS createdAt
         FROM auth_tokens t JOIN users u ON u.id = t.user_id WHERE t.token = ?`
      )
      .get(token) as AuthUser | undefined) ?? null
  )
}

export function authRequired(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length).trim() : ''
  const user = token ? findUserByToken(token) : null
  if (!user) {
    next(new HttpError(401, '未登录或登录已失效'))
    return
  }
  req.user = user
  req.authToken = token
  next()
}

/** 约定别名（见文件头注释）：与 authRequired 同一实现，禁止另写一份 */
export const requireAuth: typeof authRequired = authRequired

/** 角色门卫工厂：业务路由按 requireRole('admin') / requireRole('admin', 'operator') 使用（BE-02 起） */
export function requireRole(...roles: ReadonlyArray<UserRow['role']>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // 防御：未经 authRequired 直接挂 requireRole 时不放行，避免接口裸奔
    if (!req.user || !roles.includes(req.user.role)) {
      next(new HttpError(403, '无权限执行该操作'))
      return
    }
    next()
  }
}
