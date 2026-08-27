// BE-06 统计三端点自测脚本（接口测试，直接对 http://localhost:3000 断言）
// 运行：node be-06-test.mjs  （前置：服务已启动、种子已初始化）
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
  if (r.status !== 200) throw new Error(`login ${username} failed: ${r.status} ${JSON.stringify(r.json)}`)
  return r.json.data.token
}
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// ── 0. 登录 ────────────────────────────────────────────────
const admin = await login('admin')
const operator = await login('operator')
const salesLogin = await req('POST', '/api/auth/role-login', { body: { erpRole: 'sales' } })
const sales = salesLogin.json.data.token
record('登录 admin/operator/sales 获取 token', true, { admin: 'ok', operator: 'ok', sales: 'ok' })

// ── 1. 异常：未登录 401（三端点） ──────────────────────────
for (const ep of ['overview', 'feedback', 'coverage']) {
  const r = await req('GET', `/api/stats/${ep}`)
  record(`401 未登录 GET /api/stats/${ep}`, r.status === 401 && r.json?.code === 401 && r.json?.message === '未登录或登录已失效',
    { status: r.status, message: r.json?.message })
}
// ── 2. 异常：user 角色 403（三端点） ────────────────────────
for (const ep of ['overview', 'feedback', 'coverage']) {
  const r = await req('GET', `/api/stats/${ep}`, { token: sales })
  record(`403 user 角色 GET /api/stats/${ep}`, r.status === 403 && r.json?.code === 403 && r.json?.message === '无权限执行该操作',
    { status: r.status, message: r.json?.message })
}

// ── 3. 正向：admin overview（种子基线 19/31590/0/88.0） ─────
const ov = await req('GET', '/api/stats/overview', { token: admin })
const od = ov.json?.data ?? {}
record('overview 200 + 信封结构 {code,message,data}', ov.status === 200 && ov.json?.code === 0 && ov.json?.message === 'ok',
  { status: ov.status, code: ov.json?.code })
record('overview publishedCount=19（18 已发布 + 回审 v2 #19）', od.publishedCount === 19, { publishedCount: od.publishedCount })
record('overview totalViewCount=31590', od.totalViewCount === 31590, { totalViewCount: od.totalViewCount })
record('overview totalFavCount=0（种子无收藏）', od.totalFavCount === 0, { totalFavCount: od.totalFavCount })
record('overview avgHelpfulRate=88.0（逐教程算术平均）', od.avgHelpfulRate === 88.0, { avgHelpfulRate: od.avgHelpfulRate })
record('overview topViewed 10 条且按 viewCount 倒序', Array.isArray(od.topViewed) && od.topViewed.length === 10
  && od.topViewed.every((x, i) => i === 0 || od.topViewed[i - 1].viewCount >= x.viewCount)
  && od.topViewed[0].id === 1 && od.topViewed[0].viewCount === 5023,
  { len: od.topViewed?.length, top: od.topViewed?.[0] })
record('overview topViewed 含回审中 #19（旧版计入口径）', od.topViewed?.some(x => x.id === 19), { hit19: od.topViewed?.filter(x => x.id === 19) })

// ── 4. 正向：admin feedback ────────────────────────────────
const fb = await req('GET', '/api/stats/feedback', { token: admin })
const fl = fb.json?.data?.list ?? []
record('feedback 200 + list 19 条', fb.status === 200 && fb.json?.code === 0 && fl.length === 19, { len: fl.length })
const first = fl[0] ?? {}
record('feedback 首条 #19 没帮助占比 55.0 且 isRed=true', first.tutorialId === 19 && first.notHelpfulRate === 55.0 && first.isRed === true,
  { tutorialId: first.tutorialId, notHelpfulRate: first.notHelpfulRate, isRed: first.isRed, yes: first.helpfulYes, no: first.helpfulNo })
record('feedback 按 notHelpfulRate 倒序', fl.every((x, i) => i === 0 || (fl[i - 1].notHelpfulRate ?? -1) >= (x.notHelpfulRate ?? -1)),
  { rates: fl.slice(0, 5).map(x => x.notHelpfulRate) })
const t14 = fl.find(x => x.tutorialId === 14)
record('feedback #14 占比 22.5 = 18/(62+18) 保留 1 位', t14?.notHelpfulRate === 22.5 && t14?.isRed === false, { t14 })
record('feedback 字段结构（helpfulYes/No/comments 数组）', fl.every(x => typeof x.helpfulYes === 'number' && typeof x.helpfulNo === 'number' && Array.isArray(x.comments)), {})
const redCount = fl.filter(x => x.isRed).length
record('feedback 仅 >50% 标红（种子仅 #19）', redCount === 1, { redCount })

// ── 5. 正向：admin coverage ────────────────────────────────
const cv = await req('GET', '/api/stats/coverage', { token: admin })
const cd = cv.json?.data ?? {}
const matrix = cd.matrix ?? []
const modules = cd.modules ?? {}
record('coverage 200 + matrix 12 行（启用分类全量）', cv.status === 200 && cv.json?.code === 0 && matrix.length === 12, { len: matrix.length })
record('coverage matrix 按 sort 升序（id 1..12）', matrix.every((c, i) => c.categoryId === i + 1), { ids: matrix.map(c => c.categoryId) })
const expect = { 1: 4, 2: 2, 3: 1, 4: 3, 5: 3, 6: 2, 7: 1, 8: 0, 9: 1, 10: 1, 11: 1, 12: 0 }
record('coverage 各分类 tutorialCount 与种子一致（#19 计入 cat1）',
  matrix.every(c => c.tutorialCount === expect[c.categoryId]), { got: Object.fromEntries(matrix.map(c => [c.categoryId, c.tutorialCount])) })
record('coverage 空白区 cat8/cat12 isBlank=true（UI-ELEM-04）',
  matrix.find(c => c.categoryId === 8)?.isBlank === true && matrix.find(c => c.categoryId === 12)?.isBlank === true, {})
record('coverage 非空白分类 isBlank=false', matrix.filter(c => c.tutorialCount > 0).every(c => c.isBlank === false), {})
record('coverage modules 8 模块（无映射分类不进）', modules.length === 8, { len: modules.length, mods: modules.map(m => `${m.erpModule}:${m.tutorialCount}`) })
const sysMod = modules.find(m => m.erpModule === 'system')
record('coverage system 模块 tutorialCount=0 isBlank=true', sysMod?.tutorialCount === 0 && sysMod?.isBlank === true, { sysMod })
const salesMod = modules.find(m => m.erpModule === 'sales')
record('coverage sales 模块 categoryCount=1 tutorialCount=4', salesMod?.categoryCount === 1 && salesMod?.tutorialCount === 4, { salesMod })
const modSum = modules.reduce((s, m) => s + m.tutorialCount, 0)
record('coverage 模块聚合 = 模块内启用分类计数之和（16，通用分类 3 篇不进模块）', modSum === 16, { modSum })

// ── 6. operator 同 admin（只读同数据，AC-RULE-23） ──────────
const ovOp = await req('GET', '/api/stats/overview', { token: operator })
const fbOp = await req('GET', '/api/stats/feedback', { token: operator })
const cvOp = await req('GET', '/api/stats/coverage', { token: operator })
record('operator 三端点放行且数据与 admin 完全一致',
  ovOp.status === 200 && fbOp.status === 200 && cvOp.status === 200
  && deepEq(ovOp.json.data, od) && deepEq(fbOp.json.data, fb.json.data) && deepEq(cvOp.json.data, cd), {})

// ── 7. 口径对账：与前台列表 total 一致（AC-RULE-08） ─────────
const list = await req('GET', '/api/tutorials')
record('前台列表 total=19 与 publishedCount 对账一致', list.json?.data?.total === 19 && od.publishedCount === 19,
  { listTotal: list.json?.data?.total, publishedCount: od.publishedCount })

// ── 8. AC-RULE-09：收藏即加、取消即减 ──────────────────────
const favAdd = await req('POST', '/api/favorites/1', { token: sales })
const ovFav = await req('GET', '/api/stats/overview', { token: admin })
record('新增收藏后 totalFavCount=1', favAdd.status === 200 && ovFav.json.data.totalFavCount === 1,
  { fav: favAdd.status, totalFavCount: ovFav.json.data.totalFavCount })
const favDel = await req('DELETE', '/api/favorites/1', { token: sales })
const ovFav2 = await req('GET', '/api/stats/overview', { token: admin })
record('取消收藏后 totalFavCount 归 0（取消即减，AC-RULE-09）', favDel.status === 200 && ovFav2.json.data.totalFavCount === 0,
  { totalFavCount: ovFav2.json.data.totalFavCount })

// ── 9. 口径对账：下架 #18 → 指标同步下降 ───────────────────
const offline = await req('POST', '/api/tutorials/18/offline', { token: admin })
const ovOff = await req('GET', '/api/stats/overview', { token: admin })
const listOff = await req('GET', '/api/tutorials')
const allOff = await req('GET', '/api/tutorials?all=1', { token: admin })
const fbOff = await req('GET', '/api/stats/feedback', { token: admin })
const cvOff = await req('GET', '/api/stats/coverage', { token: admin })
record('下架 #18 后 publishedCount 19→18（历史计数不计入）', offline.status === 200 && ovOff.json.data.publishedCount === 18,
  { publishedCount: ovOff.json.data.publishedCount })
record('下架 #18 后 totalViewCount 31590-692=30898', ovOff.json.data.totalViewCount === 30898, { totalViewCount: ovOff.json.data.totalViewCount })
record('下架后与前台列表 total=18 对账一致（AC-RULE-08）', listOff.json.data.total === 18, { listTotal: listOff.json.data.total })
record('下架后 all=1 全态 total 仍 24（行未删仅口径排除）', allOff.json.data.total === 24, { allTotal: allOff.json.data.total })
record('下架后 feedback 不再含 #18 且 list=18', fbOff.json.data.list.length === 18 && !fbOff.json.data.list.some(x => x.tutorialId === 18), { len: fbOff.json.data.list.length })
record('下架后 coverage cat10 tutorialCount=0 isBlank=true（空白区翻转）',
  cvOff.json.data.matrix.find(c => c.categoryId === 10)?.tutorialCount === 0 && cvOff.json.data.matrix.find(c => c.categoryId === 10)?.isBlank === true, {})

// ── 10. 零反馈教程：发布新教程 → null 尾部不标红（AC-RULE-10） ─
const created = await req('POST', '/api/tutorials', { token: admin, body: { title: '统计自测·系统设置示例教程', categoryId: 8, summary: '自测构造：验证零反馈 null 尾部与空白区翻转', content: '<h3>步骤</h3><p>内容</p>', tags: ['自测'] } })
const newId = created.json?.data?.id
await req('POST', `/api/tutorials/${newId}/submit`, { token: admin, body: {} })
const approved = await req('POST', `/api/tutorials/${newId}/review`, { token: admin, body: { action: 'approve' } })
const fbNew = await req('GET', '/api/stats/feedback', { token: admin })
const newList = fbNew.json.data.list
const tail = newList[newList.length - 1]
record('新发布零反馈教程 notHelpfulRate=null isRed=false 且排尾部', approved.json?.data?.status === 'published'
  && newList.length === 19 && tail.tutorialId === newId && tail.notHelpfulRate === null && tail.isRed === false,
  { newId, tail: { tutorialId: tail.tutorialId, notHelpfulRate: tail.notHelpfulRate, isRed: tail.isRed } })
const ovNew = await req('GET', '/api/stats/overview', { token: admin })
record('新教程计入 publishedCount=19（0 浏览/0 反馈：avg 分母排除）', ovNew.json.data.publishedCount === 19, { publishedCount: ovNew.json.data.publishedCount })
const cvNew = await req('GET', '/api/stats/coverage', { token: admin })
record('新教程入 cat8 → cat8/system 模块空白翻转为 false/1',
  cvNew.json.data.matrix.find(c => c.categoryId === 8)?.isBlank === false && cvNew.json.data.modules.find(m => m.erpModule === 'system')?.tutorialCount === 1, {})

// ── 11. 空库空态（AC-EG-12）：清空 tutorials/categories 等 ──
const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA busy_timeout = 5000')
db.exec('BEGIN')
db.exec('DELETE FROM tutorials')
db.exec('DELETE FROM categories')
db.exec('DELETE FROM favorites')
db.exec('DELETE FROM feedbacks')
db.exec('COMMIT')
db.close()
const ovEmpty = await req('GET', '/api/stats/overview', { token: admin })
const fbEmpty = await req('GET', '/api/stats/feedback', { token: admin })
const cvEmpty = await req('GET', '/api/stats/coverage', { token: admin })
record('空库 overview 200 且 0/0/0/null/[] 不报错（AC-EG-12）',
  ovEmpty.status === 200 && deepEq(ovEmpty.json.data, { publishedCount: 0, totalViewCount: 0, totalFavCount: 0, avgHelpfulRate: null, topViewed: [] }),
  { data: ovEmpty.json.data })
record('空库 feedback 200 且 list=[]', fbEmpty.status === 200 && fbEmpty.json.data.list.length === 0, {})
record('空库 coverage 200 且 matrix=[] modules=[]', cvEmpty.status === 200 && cvEmpty.json.data.matrix.length === 0 && cvEmpty.json.data.modules.length === 0, {})

// ── 12. 复原：POST /api/system/reset（清 token，随后重新登录） ──
const reset = await req('POST', '/api/system/reset', { token: admin, body: {} })
record('POST /api/system/reset 复原种子', reset.status === 200 && reset.json?.data?.tutorials === 24 && reset.json?.data?.categories === 12,
  { status: reset.status, data: reset.json?.data })
const admin2 = await login('admin')
const ovReset = await req('GET', '/api/stats/overview', { token: admin2 })
record('复原后 overview 回到种子基线 19/31590', ovReset.json.data.publishedCount === 19 && ovReset.json.data.totalViewCount === 31590,
  { publishedCount: ovReset.json.data.publishedCount, totalViewCount: ovReset.json.data.totalViewCount })

const failed = results.filter(r => !r.pass)
console.log(`\n===== BE-06 总计: ${results.length - failed.length}/${results.length} 通过 =====`)
if (failed.length) { console.log('FAILED:', failed.map(f => f.name)); process.exit(1) }
