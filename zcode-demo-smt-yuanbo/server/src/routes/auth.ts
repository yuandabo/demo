/**
 * 认证 4 端点（契约 docs/design/api/post-api-auth-login.md 等 4 篇，AC-RULE-26）：
 * login 后台账号密码 / role-login 选角色快速登录 / logout 作废 token / me 恢复登录态。
 * 挂载：routes/index.ts 公开路由组 use('/auth')；logout / me 在路由内自挂 authRequired。
 */
import { Router } from 'express'
import { authRequired, findUserByUsername, issueToken, revokeToken, type UserRow } from '../auth.js'
import { HttpError, ok } from '../response.js'

const router = Router()

/** 6 个选角色演示账号（username 与 erpRole 同名，db.md §6；注意与 state-machine 的 ERP_MODULES 是两套口径） */
const ERP_ROLES = ['sales', 'purchase', 'produce', 'warehouse', 'manage', 'finance'] as const

/** 防枚举统一文案：不区分"账号不存在"与"密码错误"（PRD §7.11，login / role-login 共用） */
const MSG_BAD_CREDENTIALS = '账号或密码错误'

// POST /api/auth/login 后台账号密码登录（仅 admin / operator；user 账号引导走选角色登录）
router.post('/login', (req, res) => {
  const { username, password } = (req.body ?? {}) as Record<string, unknown>
  if (!isNonBlank(username) || !isNonBlank(password)) {
    throw new HttpError(400, '请输入账号和密码')
  }
  const user = findUserByUsername(username)
  if (!user || user.password !== password) {
    throw new HttpError(401, MSG_BAD_CREDENTIALS)
  }
  if (user.role === 'user') {
    throw new HttpError(403, '请使用选角色登录')
  }
  ok(res, loginData(issueToken(user.id), user))
})

// POST /api/auth/role-login 前台/小程序选角色快速登录（6 个演示账号，role 固定 user）
router.post('/role-login', (req, res) => {
  const { erpRole } = (req.body ?? {}) as Record<string, unknown>
  if (typeof erpRole !== 'string' || !(ERP_ROLES as readonly string[]).includes(erpRole)) {
    throw new HttpError(400, 'erpRole 参数不合法')
  }
  const user = findUserByUsername(erpRole)
  if (!user || user.role !== 'user') {
    // 对应角色演示账号不存在（种子未初始化场景）
    throw new HttpError(401, MSG_BAD_CREDENTIALS)
  }
  ok(res, loginData(issueToken(user.id), user))
})

// POST /api/auth/logout 登出作废（契约 message 为"已退出登录"而非 ok，直接组装信封）
router.post('/logout', authRequired, (req, res) => {
  revokeToken(req.authToken ?? '')
  res.status(200).json({ code: 0, message: '已退出登录', data: null })
})

// GET /api/auth/me 恢复登录态（authRequired 已挂 req.user，结构与契约六字段一致）
router.get('/me', authRequired, (req, res) => {
  ok(res, req.user)
})

export default router

/** 契约入参校验：非空白字符串且长度 1-50（username / password 共用） */
function isNonBlank(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 50
}

/** 登录成功响应：token + 用户五字段（无 createdAt，me 接口才返回） */
function loginData(token: string, user: UserRow): { token: string; user: object } {
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      erpRole: user.erp_role,
      displayName: user.display_name,
    },
  }
}
