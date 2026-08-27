/**
 * BE-01 认证 4 端点自测脚本（真实 HTTP 调用 + auth_tokens 表只读断言）
 * 用法：node be01-selftest.mjs   （服务须已在 http://localhost:3000 运行）
 */
import { DatabaseSync } from 'node:sqlite'

const BASE = 'http://localhost:3000'
const DB_PATH = 'd:/code/demo/zcode-demo-smt-yuanbo/server/erp.db'

let pass = 0
let fail = 0
function check(id, name, cond, detail) {
  const ok = !!cond
  if (ok) pass++
  else fail++
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${id} ${name}${ok ? '' : '  <== ' + detail}`)
}

async function call(method, path, { body, token, rawAuth } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token !== undefined) headers.Authorization = `Bearer ${token}`
  if (rawAuth !== undefined) headers.Authorization = rawAuth
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let json = null
  try {
    json = await res.json()
  } catch {}
  return { status: res.status, json }
}

function tokenRowCount(token) {
  const db = new DatabaseSync(DB_PATH, { readOnly: true })
  try {
    return db.prepare('SELECT COUNT(*) AS n FROM auth_tokens WHERE token = ?').get(token).n
  } finally {
    db.close()
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
const HEX16_RE = /^[0-9a-f]{16}$/

// ══ 1. POST /api/auth/login ════════════════════════════════
const a1 = await call('POST', '/api/auth/login', { body: { username: 'admin', password: '123456' } })
const adminToken = a1.json?.data?.token
check('A1', 'login 正向 admin：200/code0/token16hex/user五字段',
  a1.status === 200 && a1.json?.code === 0 && a1.json?.message === 'ok'
  && HEX16_RE.test(adminToken || '')
  && a1.json?.data?.user?.id === 1 && a1.json?.data?.user?.username === 'admin'
  && a1.json?.data?.user?.role === 'admin' && a1.json?.data?.user?.erpRole === null
  && typeof a1.json?.data?.user?.displayName === 'string' && a1.json.data.user.displayName.length > 0,
  JSON.stringify(a1))
check('A1-DB', '数据持久化：admin token 已写入 auth_tokens',
  tokenRowCount(adminToken) === 1, `rowCount=${tokenRowCount(adminToken)}`)

const a2 = await call('POST', '/api/auth/login', { body: { username: 'operator', password: '123456' } })
const operatorToken = a2.json?.data?.token
check('A2', 'login 正向 operator：role=operator/erpRole=null',
  a2.status === 200 && a2.json?.code === 0 && a2.json?.data?.user?.role === 'operator'
  && a2.json?.data?.user?.erpRole === null && HEX16_RE.test(operatorToken || ''),
  JSON.stringify(a2))

const a3 = await call('POST', '/api/auth/login', { body: { password: '123456' } })
check('A3', 'login 缺 username → 400 "请输入账号和密码"',
  a3.status === 400 && a3.json?.code === 400 && a3.json?.message === '请输入账号和密码', JSON.stringify(a3))
const a4 = await call('POST', '/api/auth/login', { body: { username: 'admin' } })
check('A4', 'login 缺 password → 400 "请输入账号和密码"',
  a4.status === 400 && a4.json?.message === '请输入账号和密码', JSON.stringify(a4))
const a5 = await call('POST', '/api/auth/login', { body: { username: '', password: '123456' } })
check('A5', 'login username 空串 → 400',
  a5.status === 400 && a5.json?.message === '请输入账号和密码', JSON.stringify(a5))
const a6 = await call('POST', '/api/auth/login', { body: { username: '   ', password: '123456' } })
check('A6', 'login username 纯空白 → 400（不允许空白）',
  a6.status === 400, JSON.stringify(a6))
const a7 = await call('POST', '/api/auth/login', { body: { username: 123, password: '123456' } })
check('A7', 'login username 类型错误(数字) → 400',
  a7.status === 400, JSON.stringify(a7))
const a8 = await call('POST', '/api/auth/login', { body: { username: 'x'.repeat(51), password: '123456' } })
check('A8', 'login username 边界 51 字符（>50）→ 400',
  a8.status === 400, JSON.stringify(a8))

const a9 = await call('POST', '/api/auth/login', { body: { username: 'admin', password: 'wrong!' } })
check('A9', 'login 错误密码 → 401 "账号或密码错误"',
  a9.status === 401 && a9.json?.code === 401 && a9.json?.message === '账号或密码错误', JSON.stringify(a9))
const a10 = await call('POST', '/api/auth/login', { body: { username: 'nosuchuser', password: '123456' } })
check('A10', 'login 账号不存在 → 401 文案与错误密码完全一致（防枚举）',
  a10.status === 401 && a10.json?.message === '账号或密码错误'
  && a10.json?.message === a9.json?.message, JSON.stringify(a10))
const a11 = await call('POST', '/api/auth/login', { body: { username: 'sales', password: '123456' } })
check('A11', 'login 普通账号(role=user) → 403 "请使用选角色登录"',
  a11.status === 403 && a11.json?.code === 403 && a11.json?.message === '请使用选角色登录', JSON.stringify(a11))

// ══ 2. POST /api/auth/role-login ═══════════════════════════
const roles = ['sales', 'purchase', 'produce', 'warehouse', 'manage', 'finance']
const roleTokens = {}
for (const r of roles) {
  const b = await call('POST', '/api/auth/role-login', { body: { erpRole: r } })
  roleTokens[r] = b.json?.data?.token
  check(`B-${r}`, `role-login 正向 ${r}：role=user/erpRole回显/username同名/token16hex`,
    b.status === 200 && b.json?.code === 0 && b.json?.data?.user?.role === 'user'
    && b.json?.data?.user?.erpRole === r && b.json?.data?.user?.username === r
    && HEX16_RE.test(roleTokens[r] || ''), JSON.stringify(b))
}
const b7 = await call('POST', '/api/auth/role-login', { body: {} })
check('B7', 'role-login 缺 erpRole → 400 "erpRole 参数不合法"',
  b7.status === 400 && b7.json?.code === 400 && b7.json?.message === 'erpRole 参数不合法', JSON.stringify(b7))
const b8 = await call('POST', '/api/auth/role-login', { body: { erpRole: 'xxx' } })
check('B8', 'role-login erpRole 非法枚举 "xxx" → 400 "erpRole 参数不合法"',
  b8.status === 400 && b8.json?.message === 'erpRole 参数不合法', JSON.stringify(b8))
const b9 = await call('POST', '/api/auth/role-login', { body: { erpRole: '' } })
check('B9', 'role-login erpRole 空串 → 400（边界）',
  b9.status === 400 && b9.json?.message === 'erpRole 参数不合法', JSON.stringify(b9))
const b10 = await call('POST', '/api/auth/role-login', { body: { erpRole: 123 } })
check('B10', 'role-login erpRole 类型错误(数字) → 400',
  b10.status === 400 && b10.json?.message === 'erpRole 参数不合法', JSON.stringify(b10))

// ══ 3. GET /api/auth/me ════════════════════════════════════
const c1 = await call('GET', '/api/auth/me', { token: roleTokens.sales })
check('C1', 'me 正向 sales：六字段齐 + createdAt 格式 yyyy-MM-dd HH:mm:ss',
  c1.status === 200 && c1.json?.code === 0 && c1.json?.message === 'ok'
  && c1.json?.data?.username === 'sales' && c1.json?.data?.role === 'user'
  && c1.json?.data?.erpRole === 'sales' && typeof c1.json?.data?.displayName === 'string'
  && typeof c1.json?.data?.id === 'number' && DATE_RE.test(c1.json?.data?.createdAt || ''),
  JSON.stringify(c1))
const c2 = await call('GET', '/api/auth/me', { token: adminToken })
check('C2', 'me 正向 admin：role=admin/erpRole=null/createdAt 存在',
  c2.status === 200 && c2.json?.data?.role === 'admin' && c2.json?.data?.erpRole === null
  && DATE_RE.test(c2.json?.data?.createdAt || ''), JSON.stringify(c2))
const c3 = await call('GET', '/api/auth/me', {})
check('C3', 'me 无 token → 401 "未登录或登录已失效"',
  c3.status === 401 && c3.json?.code === 401 && c3.json?.message === '未登录或登录已失效', JSON.stringify(c3))
const c4 = await call('GET', '/api/auth/me', { token: 'deadbeef' })
check('C4', 'me 伪造 token(deadbeef) → 401',
  c4.status === 401 && c4.json?.message === '未登录或登录已失效', JSON.stringify(c4))
const c5 = await call('GET', '/api/auth/me', { rawAuth: 'Token deadbeef' })
check('C5', 'me 非 Bearer 前缀头 → 401（异常）',
  c5.status === 401, JSON.stringify(c5))

// ══ 4. POST /api/auth/logout ═══════════════════════════════
const d1 = await call('POST', '/api/auth/logout', { token: roleTokens.purchase, body: {} })
check('D1', 'logout 正向：code0/message "已退出登录"/data null',
  d1.status === 200 && d1.json?.code === 0 && d1.json?.message === '已退出登录' && d1.json?.data === null,
  JSON.stringify(d1))
check('D1-DB', '数据持久化：logout 后 auth_tokens 该 token 行已删除',
  tokenRowCount(roleTokens.purchase) === 0, `rowCount=${tokenRowCount(roleTokens.purchase)}`)
const d2 = await call('GET', '/api/auth/me', { token: roleTokens.purchase })
check('D2', '联动：logout 后同 token 调 me → 401',
  d2.status === 401 && d2.json?.message === '未登录或登录已失效', JSON.stringify(d2))
const d3 = await call('POST', '/api/auth/logout', {})
check('D3', 'logout 无 token → 401 "未登录或登录已失效"',
  d3.status === 401 && d3.json?.message === '未登录或登录已失效', JSON.stringify(d3))
const d4 = await call('POST', '/api/auth/logout', { token: 'deadbeef' })
check('D4', 'logout 伪造 token → 401',
  d4.status === 401 && d4.json?.message === '未登录或登录已失效', JSON.stringify(d4))
const d5 = await call('POST', '/api/auth/logout', { token: roleTokens.purchase })
check('D5', 'logout 重复作废（已删 token 再 logout）→ 401',
  d5.status === 401, JSON.stringify(d5))

// ══ 5. 鉴权中间件机制（AC-NF-04 就绪探针）═══════════════════
const e1 = await call('GET', '/api/stats/overview', {})
check('E1', 'authRequired 覆盖业务路由：GET /api/stats/overview 无 token → 401',
  e1.status === 401 && e1.json?.message === '未登录或登录已失效', JSON.stringify(e1))
const e1b = await call('GET', '/api/stats', {})
check('E1b', '未知 /api 路径 → 404 JSON 兜底（路由边界）',
  e1b.status === 404 && e1b.json?.code === 404 && e1b.json?.message === '接口不存在', JSON.stringify(e1b))
const e2 = await call('GET', '/api/favorites', {})
check('E2', 'authRequired 覆盖业务路由：GET /api/favorites 无 token → 401',
  e2.status === 401, JSON.stringify(e2))

console.log(`\nSUMMARY pass=${pass} fail=${fail}`)
process.exit(fail > 0 ? 1 : 0)
