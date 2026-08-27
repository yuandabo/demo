// BE-01 GET /api/messages 自测脚本（公开接口 + 角色过滤优先级 + 边界）
// 运行：node be-01-test.mjs（前置：服务已启动、种子已初始化）
import { DatabaseSync } from 'node:sqlite'

const BASE = 'http://localhost:3000'
const DB_PATH = 'D:/code/demo/zcode-demo-smt-yuanbo/server/erp.db'

const results = []
function record(name, pass, detail) {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + JSON.stringify(detail) : ''}`)
}
async function req(method, path, { token, body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  let json = null
  try { json = await res.json() } catch { /* non-json */ }
  return { status: res.status, json }
}
async function login(username) {
  const r = await req('POST', '/api/auth/login', { body: { username, password: '123456' } })
  return r.json.data.token
}
async function roleLogin(erpRole) {
  const r = await req('POST', '/api/auth/role-login', { body: { erpRole } })
  return r.json.data.token
}
const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA busy_timeout = 5000')
const countMsg = () => (db.prepare('SELECT COUNT(*) AS n FROM messages').get()).n

// ── 1. 正向：无登录态全量（公开接口） ──────────────────────
const all = await req('GET', '/api/messages')
const list = all.json?.data?.list ?? []
record('公开可读：无 Authorization → 200 {code:0,message:"ok",data.list}',
  all.status === 200 && all.json?.code === 0 && all.json?.message === 'ok' && Array.isArray(list), { status: all.status, code: all.json?.code })
record('种子 3 条 mock 消息', list.length === 3, { len: list.length })
record('按 createdAt 倒序（id 1→3→2：08-18 09:30 > 08-18 09:06 > 08-17 15:00）',
  list.map(x => x.id).join(',') === '1,3,2', { order: list.map(x => x.id) })
const keysOk = list.every(x => ['id', 'erpRole', 'title', 'tutorialId', 'tutorialTitle', 'isRead', 'createdAt'].every(k => k in x)
  && !Object.keys(x).some(k => k.includes('_')))
record('字段驼峰命名符合契约（7 字段、无蛇形残留）', keysOk, { sample: list[0] })
record('关联教程标题 JOIN 正确（id1→教程7）',
  list[0].tutorialId === 7 && list[0].tutorialTitle === '采购申请到一键下单', { first: list[0] })

// ── 2. 正向：显式角色过滤（6 枚举逐一） ────────────────────
const expectByRole = { purchase: [1], sales: [2], produce: [3], warehouse: [], manage: [], finance: [] }
for (const [role, ids] of Object.entries(expectByRole)) {
  const r = await req('GET', `/api/messages?erpRole=${role}`)
  const got = (r.json?.data?.list ?? []).map(x => x.id)
  record(`erpRole=${role} → ${ids.length ? 'id ' + ids.join(',') : '空数组'}`,
    r.status === 200 && got.join(',') === ids.join(','), { got })
}

// ── 3. 参数校验：非法枚举 → 400 ────────────────────────────
const bad = ['xxx', '', 'MANAGE', 'sales ', 'constructor']
for (const v of bad) {
  const r = await req('GET', `/api/messages?erpRole=${encodeURIComponent(v)}`)
  record(`erpRole="${v === '' ? '(空串)' : v}" → 400 "erpRole 参数不合法"`,
    r.status === 400 && r.json?.code === 400 && r.json?.message === 'erpRole 参数不合法',
    { status: r.status, message: r.json?.message })
}
const arr = await req('GET', '/api/messages?erpRole=purchase&erpRole=sales')
record('erpRole 重复参数（数组）→ 400', arr.status === 400 && arr.json?.message === 'erpRole 参数不合法', { status: arr.status })
const long = await req('GET', `/api/messages?erpRole=${'x'.repeat(300)}`)
record('erpRole 超长串（300 字符）→ 400', long.status === 400 && long.json?.message === 'erpRole 参数不合法', { status: long.status })

// ── 4. 过滤优先级：显式 > 登录角色 > 全部 ──────────────────
const purchaseToken = await roleLogin('purchase')
const implicit = await req('GET', '/api/messages', { token: purchaseToken })
record('登录角色隐式过滤：purchase token 不传参 → 仅 id 1',
  implicit.status === 200 && implicit.json.data.list.map(x => x.id).join(',') === '1',
  { ids: implicit.json.data.list.map(x => x.id) })
const explicit = await req('GET', '/api/messages?erpRole=produce', { token: purchaseToken })
record('显式参数优先于登录角色：purchase token + erpRole=produce → id 3',
  explicit.status === 200 && explicit.json.data.list.map(x => x.id).join(',') === '3',
  { ids: explicit.json.data.list.map(x => x.id) })
const adminToken = await login('admin')
const adminAll = await req('GET', '/api/messages', { token: adminToken })
record('admin 登录（erpRole=null）不过滤 → 3 条', adminAll.json.data.list.length === 3, { len: adminAll.json.data.list.length })
const fake = await req('GET', '/api/messages', { token: 'deadbeefdeadbeef' })
record('失效 token 降级游客不 401 → 3 条', fake.status === 200 && fake.json.data.list.length === 3, { status: fake.status })

// ── 5. 只读校验：接口调用不改变 messages 行数 ───────────────
const before = countMsg()
await req('GET', '/api/messages')
await req('GET', '/api/messages?erpRole=purchase', { token: purchaseToken })
await req('GET', '/api/messages', { token: adminToken })
record('纯只读：全部调用后 COUNT(*) 不变（3==3）', before === 3 && countMsg() === 3, { before, after: countMsg() })

// ── 6. 边界：tutorial_id 为 null 的预留消息（手工插库） ─────
db.exec('BEGIN')
db.prepare(`INSERT INTO messages (erp_role, title, tutorial_id, is_read, created_at) VALUES ('finance', '预留场景·无关联教程消息', NULL, 0, datetime('now','localtime'))`).run()
db.exec('COMMIT')
const nullMsg = await req('GET', '/api/messages?erpRole=finance')
const nullItem = nullMsg.json?.data?.list?.[0]
record('tutorialId=null 消息 → 200 且 tutorialTitle=null 不报错',
  nullMsg.status === 200 && nullItem?.tutorialId === null && nullItem?.tutorialTitle === null,
  { item: nullItem })
const allAfter = await req('GET', '/api/messages')
record('null 关联消息计入全量（4 条）且居首（createdAt 最新）',
  allAfter.json.data.list.length === 4 && allAfter.json.data.list[0].tutorialId === null,
  { len: allAfter.json.data.list.length, first: allAfter.json.data.list[0]?.title })
db.close()

const failed = results.filter(r => !r.pass)
console.log(`\n===== BE-01 总计: ${results.length - failed.length}/${results.length} 通过 =====`)
if (failed.length) { console.log('FAILED:', failed.map(f => f.name)); process.exit(1) }
