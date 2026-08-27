import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import type { Request, RequestHandler, Response } from 'express'

import { authRequired, findUserByToken, findUserByUsername, issueToken, requireRole, revokeToken } from './auth.js'
import type { AuthUser } from './auth.js'
import { HttpError } from './response.js'
import { closeDb, openDb } from './db.js'

/**
 * 认证域单测（AC-NF-04 token 机制 / AC-RULE-26 登录口径）：
 * token 签发/作废/查库校验 + authRequired / requireRole 门卫。
 * 期望值来自 API 契约（docs/design/api/*auth*.md）与 db.md §6 种子，不从实现反推。
 */

/** 种子固定账号（db.md §6：admin id=1，密码 123456，displayName 系统管理员） */
const ADMIN_ID = 1

/** 以伪造请求调用中间件，捕获 next 结果（passed=无参放行 / err=错误对象） */
function invoke(middleware: RequestHandler, req: Partial<Request>): { req: Request; err?: unknown; passed: boolean } {
  let err: unknown
  let passed = false
  middleware(req as Request, {} as Response, (e?: unknown) => {
    passed = e === undefined
    err = e
  })
  return { req: req as Request, err, passed }
}

/** 伪造带 Authorization 头的请求（token 省略时无 header） */
function reqWithToken(token?: string): Partial<Request> {
  const headers: Record<string, string> = token === undefined ? {} : { authorization: `Bearer ${token}` }
  return { headers } as unknown as Partial<Request>
}

test('issueToken：生成 16 位 hex 且 auth_tokens 入库', () => {
  const token = issueToken(ADMIN_ID)
  assert.match(token, /^[0-9a-f]{16}$/)
  const row = openDb().prepare('SELECT user_id FROM auth_tokens WHERE token = ?').get(token) as
    | { user_id: number }
    | undefined
  assert.equal(row?.user_id, ADMIN_ID)
  revokeToken(token)
})

test('findUserByToken：有效 token JOIN users 返回 camelCase 六字段投影；伪造/已作废返回 null', () => {
  const token = issueToken(ADMIN_ID)
  const user = findUserByToken(token)
  assert.deepEqual(Object.keys(user ?? {}).sort(), ['createdAt', 'displayName', 'erpRole', 'id', 'role', 'username'])
  assert.equal(user?.username, 'admin')
  assert.equal(user?.role, 'admin')
  assert.equal(user?.erpRole, null)
  assert.equal(user?.displayName, '系统管理员')
  revokeToken(token)
  assert.equal(findUserByToken(token), null, '作废后即失效（logout 语义）')
  assert.equal(findUserByToken('deadbeefdeadbeef'), null)
})

test('findUserByUsername：命中种子账号 / 未命中返回 null', () => {
  const operator = findUserByUsername('operator')
  assert.equal(operator?.role, 'operator')
  assert.equal(operator?.password, '123456')
  assert.equal(findUserByUsername('no_such_user'), null)
})

test('authRequired：无 header / 非 Bearer / 伪造 token → 401 未登录或登录已失效', () => {
  const cases: ReadonlyArray<Partial<Request>> = [
    reqWithToken(),
    reqWithToken('deadbeefdeadbeef'),
    { headers: { authorization: 'Basic zzz' } } as unknown as Partial<Request>,
  ]
  for (const req of cases) {
    const { err, passed, req: afterReq } = invoke(authRequired, req)
    assert.equal(passed, false, JSON.stringify(req))
    assert.ok(err instanceof HttpError, '应抛 HttpError')
    assert.equal(err.status, 401)
    assert.equal(err.code, 401)
    assert.equal(err.message, '未登录或登录已失效')
    assert.equal(afterReq.user, undefined)
  }
})

test('authRequired：有效 token 放行并挂 req.user / req.authToken', () => {
  const token = issueToken(ADMIN_ID)
  const { err, passed, req } = invoke(authRequired, reqWithToken(token))
  assert.equal(passed, true)
  assert.equal(err, undefined)
  assert.equal(req.user?.id, ADMIN_ID)
  assert.equal(req.authToken, token)
  revokeToken(token)
})

test('requireRole：角色命中放行；不符 / 未登录态 → 403 无权限执行该操作', () => {
  const adminOnly = requireRole('admin')
  const adminUser: AuthUser = {
    id: ADMIN_ID, username: 'admin', role: 'admin', erpRole: null,
    displayName: '系统管理员', createdAt: '2026-07-01 09:00:00',
  }
  const operatorUser: AuthUser = { ...adminUser, id: 2, username: 'operator', role: 'operator' }

  assert.equal(invoke(adminOnly, { user: adminUser }).passed, true, 'admin 应放行')

  for (const req of [{ user: operatorUser }, {}]) {
    const { err, passed } = invoke(adminOnly, req)
    assert.equal(passed, false, JSON.stringify(req))
    assert.ok(err instanceof HttpError, '应抛 HttpError')
    assert.equal(err.status, 403)
    assert.equal(err.message, '无权限执行该操作')
  }
})

after(() => closeDb())
