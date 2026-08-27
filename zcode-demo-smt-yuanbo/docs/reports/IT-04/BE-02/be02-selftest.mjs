/**
 * BE-02 系统重置接口 POST /api/system/reset 自测脚本（真实 HTTP 调用）
 * 用法：node be02-selftest.mjs   （服务须已在 http://localhost:3000 运行）
 * 说明：reset 会清空 auth_tokens（所有登录态作废），因此每次 reset 前都重新登录。
 */
const BASE = 'http://localhost:3000'
const EXPECT = { categories: 12, tutorials: 24, users: 8, messages: 3, checkins: 5 }

let pass = 0
let fail = 0
function check(id, name, cond, detail) {
  const ok = !!cond
  if (ok) pass++
  else fail++
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${id} ${name}${ok ? '' : '  <== ' + detail}`)
}

async function call(method, path, { body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token !== undefined) headers.Authorization = `Bearer ${token}`
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

async function loginAdmin() {
  const r = await call('POST', '/api/auth/login', { body: { username: 'admin', password: '123456' } })
  return r.json?.data?.token
}

// ══ 前置：取得三类角色 token ════════════════════════════════
const t0 = await loginAdmin()
const op = await call('POST', '/api/auth/login', { body: { username: 'operator', password: '123456' } })
const opToken = op.json?.data?.token
const us = await call('POST', '/api/auth/role-login', { body: { erpRole: 'sales' } })
const userToken = us.json?.data?.token
check('S0', '前置：admin/operator/user 三类 token 就绪', !!t0 && !!opToken && !!userToken,
  `t0=${t0} op=${opToken} user=${userToken}`)

// ══ 1. 异常场景：门卫 401/403 ═══════════════════════════════
const g4 = await call('POST', '/api/system/reset', { body: {} })
check('G4', '未携带 token → 401 "未登录或登录已失效"',
  g4.status === 401 && g4.json?.code === 401 && g4.json?.message === '未登录或登录已失效', JSON.stringify(g4))
const g5 = await call('POST', '/api/system/reset', { body: {}, token: 'deadbeef' })
check('G5', '伪造 token → 401',
  g5.status === 401 && g5.json?.message === '未登录或登录已失效', JSON.stringify(g5))
const g2 = await call('POST', '/api/system/reset', { body: {}, token: opToken })
check('G2', 'operator token → 403 "无权限执行该操作"',
  g2.status === 403 && g2.json?.code === 403 && g2.json?.message === '无权限执行该操作', JSON.stringify(g2))
const g3 = await call('POST', '/api/system/reset', { body: {}, token: userToken })
check('G3', 'user(role-login) token → 403 "无权限执行该操作"',
  g3.status === 403 && g3.json?.message === '无权限执行该操作', JSON.stringify(g3))

// ══ 2. 正向：admin reset + 计数契约 ═════════════════════════
const f1 = await call('POST', '/api/system/reset', { body: {}, token: t0 })
const d1 = f1.json?.data
check('F1', 'admin reset 正向：code0/message "重置成功"/五项计数 12/24/8/3/5',
  f1.status === 200 && f1.json?.code === 0 && f1.json?.message === '重置成功'
  && d1 && Object.keys(EXPECT).every((k) => d1[k] === EXPECT[k]),
  JSON.stringify(f1))

// ══ 3. 登录态作废（reset 清空 auth_tokens）══════════════════
const m1 = await call('GET', '/api/auth/me', { token: t0 })
check('H1', 'reset 后旧 admin token 调 me → 401（登录态作废）',
  m1.status === 401 && m1.json?.message === '未登录或登录已失效', JSON.stringify(m1))
const m2 = await call('GET', '/api/auth/me', { token: opToken })
check('H2', 'reset 后旧 operator token 调 me → 401（全部登录态作废）',
  m2.status === 401, JSON.stringify(m2))
const reLogin = await loginAdmin()
const m3 = await call('GET', '/api/auth/me', { token: reLogin })
check('H3', '重新 login 后新 token 可用（me 200）',
  m3.status === 200 && m3.json?.data?.username === 'admin', JSON.stringify(m3))

// ══ 4. 幂等：重复执行计数恒定（AC-OP-01 第 2 点）═════════════
const f2tok = await loginAdmin()
const f2 = await call('POST', '/api/system/reset', { body: {}, token: f2tok })
const d2 = f2.json?.data
check('F2', '重复执行第二遍：计数仍 12/24/8/3/5 不增加',
  f2.status === 200 && f2.json?.code === 0
  && d2 && Object.keys(EXPECT).every((k) => d2[k] === EXPECT[k]),
  JSON.stringify(f2))

const snaps = []
for (let i = 1; i <= 3; i++) {
  const tk = await loginAdmin()
  const r = await call('POST', '/api/system/reset', { body: {}, token: tk })
  snaps.push(JSON.stringify(r.json?.data))
  console.log(`INFO reset#${i} -> ${snaps[i - 1]}`)
}
check('H4', '连续 3 次 reset 计数恒定（幂等复验）',
  snaps.length === 3 && snaps.every((s) => s === snaps[0])
  && JSON.parse(snaps[0]).categories === 12 && JSON.parse(snaps[0]).tutorials === 24,
  snaps.join(' | '))

console.log(`\nSUMMARY pass=${pass} fail=${fail}`)
process.exit(fail > 0 ? 1 : 0)
