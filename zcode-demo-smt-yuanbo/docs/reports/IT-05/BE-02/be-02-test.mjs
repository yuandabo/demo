// BE-02 POST/GET /api/checkins 自测脚本（幂等+积分+连续天数+徽章+周历+并发）
// 运行：node be-02-test.mjs（前置：服务已启动、种子已初始化）
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
async function roleLogin(erpRole) {
  const r = await req('POST', '/api/auth/role-login', { body: { erpRole } })
  if (r.status !== 200) throw new Error(`role-login ${erpRole} failed`)
  return r.json.data.token
}
const pad = n => String(n).padStart(2, '0')
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d }
const today = new Date()
const TODAY = dstr(today)
const YESTERDAY = dstr(addDays(today, -1))
const mondayOffset = (today.getDay() + 6) % 7
const MONDAY = dstr(addDays(today, -mondayOffset))
console.log(`环境：服务器本地今日=${TODAY} 昨日=${YESTERDAY} 本周一=${MONDAY}`)

const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA busy_timeout = 5000')
const insCheckin = db.prepare('INSERT OR REPLACE INTO checkins (user_id, checkin_date, points, streak, created_at) VALUES (?, ?, 10, ?, ?)')
const insHistory = db.prepare('INSERT OR REPLACE INTO histories (user_id, tutorial_id, progress, updated_at) VALUES (?, ?, ?, datetime(\'now\',\'localtime\'))')

// ── 1. 异常：401 分支 ──────────────────────────────────────
const p401 = await req('POST', '/api/checkins', { body: {} })
record('POST 未登录 → 401 "未登录或登录已失效"', p401.status === 401 && p401.json?.message === '未登录或登录已失效', { status: p401.status })
const g401 = await req('GET', '/api/checkins')
record('GET 未登录 → 401', g401.status === 401 && g401.json?.message === '未登录或登录已失效', { status: g401.status })
const forged = await req('POST', '/api/checkins', { token: 'not-a-real-token', body: {} })
record('POST 伪造 token → 401', forged.status === 401, { status: forged.status })

// ── 2. 边界：无任何打卡记录的新用户 GET 全零 ────────────────
const whToken = await roleLogin('warehouse') // userId 6，种子无打卡无历史
const wh0 = await req('GET', '/api/checkins', { token: whToken })
const w0 = wh0.json?.data ?? {}
const cal0 = w0.weekCalendar ?? []
record('新用户 GET 200 全指标归 0（totalPoints/streak/bestStreak/completedTutorials=0，todayChecked=false，badges=[]）',
  wh0.status === 200 && w0.totalPoints === 0 && w0.streak === 0 && w0.bestStreak === 0 && w0.completedTutorials === 0
  && w0.todayChecked === false && Array.isArray(w0.badges) && w0.badges.length === 0, { data: w0 })
record('weekCalendar 恰 7 项且周一为首项', cal0.length === 7 && cal0[0]?.date === MONDAY, { dates: cal0.map(c => c.date) })
record('无打卡用户 weekCalendar 全 false', cal0.every(c => c.isChecked === false), {})
const futureOk = cal0.filter(c => c.date > TODAY).every(c => c.isChecked === false)
record('未来日期强制 false', futureOk, { future: cal0.filter(c => c.date > TODAY).map(c => `${c.date}:${c.isChecked}`) })

// ── 3. 种子验证：purchase 用户（5 天打卡 totalPoints=50） ────
const puToken = await roleLogin('purchase') // userId 4，种子 08-12/13/15/17/18
const pu = await req('GET', '/api/checkins', { token: puToken })
const pd = pu.json?.data ?? {}
record('种子打卡用户 totalPoints=50（5×10）', pd.totalPoints === 50, { totalPoints: pd.totalPoints })
record('种子 bestStreak=2 / streak=0（今日与昨日均无 → 连续中断清零）', pd.bestStreak === 2 && pd.streak === 0, { streak: pd.streak, bestStreak: pd.bestStreak })
const seedWeek = pd.weekCalendar ?? []
const seedChecked = seedWeek.filter(c => c.isChecked).map(c => c.date)
const inWeek = ['2026-08-17', '2026-08-18'].filter(d => d >= MONDAY && d <= seedWeek[6]?.date)
record('weekCalendar 与种子日期吻合（本周内 08-17/08-18 命中）',
  seedChecked.join(',') === inWeek.join(',') && pd.todayChecked === false,
  { seedChecked, todayChecked: pd.todayChecked })

// ── 4. 正向：首次打卡 +10（sales userId 3） ─────────────────
const saToken = await roleLogin('sales')
const first = await req('POST', '/api/checkins', { token: saToken, body: {} })
const fd = first.json?.data ?? {}
record('首次打卡 code=0 message="打卡成功" pointsAdded=10 duplicated=false',
  first.status === 200 && first.json?.code === 0 && first.json?.message === '打卡成功'
  && fd.pointsAdded === 10 && fd.duplicated === false, { message: first.json?.message, data: fd })
record('checkinDate=服务器本地今日 yyyy-MM-dd 且昨日无记录 streak=1',
  fd.checkinDate === TODAY && fd.streak === 1 && /^\d{4}-\d{2}-\d{2}$/.test(fd.checkinDate ?? ''), { checkinDate: fd.checkinDate, streak: fd.streak })
record('totalPoints=10 badges=[]（未达 7 天/20 篇）', fd.totalPoints === 10 && Array.isArray(fd.badges) && fd.badges.length === 0, { badges: fd.badges })

// ── 5. 幂等：当日重复打卡（AC-FN-16） ───────────────────────
const dup = await req('POST', '/api/checkins', { token: saToken, body: {} })
const dd = dup.json?.data ?? {}
record('重复打卡 message="今日已打卡" pointsAdded=0 duplicated=true',
  dup.status === 200 && dup.json?.message === '今日已打卡' && dd.pointsAdded === 0 && dd.duplicated === true,
  { message: dup.json?.message, data: dd })
record('幂等：totalPoints 与首次一致（积分不再增加）', dd.totalPoints === fd.totalPoints && dd.streak === fd.streak,
  { firstTotal: fd.totalPoints, dupTotal: dd.totalPoints })
const noBody = await req('POST', '/api/checkins', { token: saToken })
record('POST 不携带请求体同样幂等不 400', noBody.status === 200 && noBody.json?.data?.duplicated === true, { status: noBody.status, message: noBody.json?.message })

// ── 6. GET 状态联动 ────────────────────────────────────────
const saGet = await req('GET', '/api/checkins', { token: saToken })
const sg = saGet.json?.data ?? {}
const todayIdx = (sg.weekCalendar ?? []).findIndex(c => c.date === TODAY)
record('打卡后 GET todayChecked=true streak=1 totalPoints=10',
  sg.todayChecked === true && sg.streak === 1 && sg.totalPoints === 10, { data: sg })
record('weekCalendar 今日 isChecked=true', todayIdx >= 0 && sg.weekCalendar[todayIdx].isChecked === true,
  { today: sg.weekCalendar?.[todayIdx] })

// ── 7. 数据持久化：库内行与响应一致 ────────────────────────
const row = db.prepare('SELECT points, streak, checkin_date FROM checkins WHERE user_id = 3 AND checkin_date = ?').get(TODAY)
record('库中当日行 points=10/streak=1/checkin_date=今日 与响应一致',
  row && row.points === 10 && row.streak === 1 && row.checkin_date === TODAY, { row })

// ── 8. 并发同日重复 POST（UNIQUE 兜底） ────────────────────
const [c1, c2] = await Promise.all([
  req('POST', '/api/checkins', { token: whToken, body: {} }),
  req('POST', '/api/checkins', { token: whToken, body: {} }),
])
const dups = [c1.json?.data?.duplicated, c2.json?.data?.duplicated].sort()
record('并发两请求均 200 且其一 false 另一 true', c1.status === 200 && c2.status === 200 && dups.join(',') === 'false,true',
  { s1: c1.json?.data, s2: c2.json?.data })
const whRows = db.prepare('SELECT COUNT(*) AS n FROM checkins WHERE user_id = 6 AND checkin_date = ?').get(TODAY)
record('库中该日仅 1 条（UNIQUE(user_id,checkin_date) 兜底）', whRows.n === 1, { n: whRows.n })
const whGet1 = await req('GET', '/api/checkins', { token: whToken })
record('并发后 GET todayChecked=true totalPoints=10（只加一次分）', whGet1.json.data.todayChecked === true && whGet1.json.data.totalPoints === 10,
  { data: whGet1.json.data })

// ── 9. 跨日连续：构造昨日 streak=3 → 今日 streak=4 ──────────
const prToken = await roleLogin('produce') // userId 5
insCheckin.run(5, YESTERDAY, 3, `${YESTERDAY} 09:00:00`)
const cont = await req('POST', '/api/checkins', { token: prToken, body: {} })
record('昨日有打卡 streak=昨日+1（3→4），totalPoints=20',
  cont.json?.data?.streak === 4 && cont.json.data.totalPoints === 20 && cont.json.data.pointsAdded === 10,
  { data: cont.json?.data })

// ── 10. 中断清连续不清积分、不回收徽章（AC-RULE-12/FN-21） ──
const fiToken = await roleLogin('finance') // userId 8
// 连续 7 天：d-9 .. d-3（streak 1..7），昨日(d-1)与今日均无 → 中断后今日再打卡
db.exec('BEGIN')
for (let i = 0; i < 7; i++) {
  const d = dstr(addDays(today, -9 + i))
  insCheckin.run(8, d, i + 1, `${d} 08:00:00`)
}
db.exec('COMMIT')
const fiPre = await req('GET', '/api/checkins', { token: fiToken })
record('构造 streak=7 后 GET badges 含 persist（连续 7 天获得）',
  fiPre.json.data.bestStreak === 7 && fiPre.json.data.badges.includes('persist') && fiPre.json.data.streak === 0,
  { bestStreak: fiPre.json.data.bestStreak, streak: fiPre.json.data.streak, badges: fiPre.json.data.badges })
const fiPost = await req('POST', '/api/checkins', { token: fiToken, body: {} })
record('中断后再打卡 streak 重置为 1（非 8）', fiPost.json.data.streak === 1 && fiPost.json.data.pointsAdded === 10,
  { streak: fiPost.json.data.streak })
record('中断不清积分：totalPoints=80（8 天全量累计）', fiPost.json.data.totalPoints === 80, { totalPoints: fiPost.json.data.totalPoints })
record('已获 persist 徽章不回收（bestStreak 口径）', fiPost.json.data.badges.includes('persist'), { badges: fiPost.json.data.badges })

// ── 11. 百科达人徽章：20 篇 → 获得；19 篇 → 不含 ───────────
const maToken = await roleLogin('manage') // userId 7
db.exec('BEGIN')
for (let t = 1; t <= 20; t++) insHistory.run(7, t, 100)
for (let t = 1; t <= 19; t++) insHistory.run(5, t, 100)
db.exec('COMMIT')
const maGet = await req('GET', '/api/checkins', { token: maToken })
record('20 篇 progress=100 → badges 含 encyclopedia 且 completedTutorials=20',
  maGet.json.data.completedTutorials === 20 && maGet.json.data.badges.includes('encyclopedia'),
  { completedTutorials: maGet.json.data.completedTutorials, badges: maGet.json.data.badges })
const prGet = await req('GET', '/api/checkins', { token: prToken })
record('19 篇 progress=100 → 不含 encyclopedia（阈值 20）',
  prGet.json.data.completedTutorials === 19 && !prGet.json.data.badges.includes('encyclopedia'),
  { completedTutorials: prGet.json.data.completedTutorials, badges: prGet.json.data.badges })

// ── 12. completedTutorials 口径 = 仅 progress=100（AC-RULE-13） ──
db.exec('BEGIN')
insHistory.run(6, 1, 100)
insHistory.run(6, 2, 100)
insHistory.run(6, 3, 60)
insHistory.run(6, 4, 30)
db.exec('COMMIT')
const whGet2 = await req('GET', '/api/checkins', { token: whToken })
record('60%/30% 不计入：completedTutorials=2（仅 100% 条目）', whGet2.json.data.completedTutorials === 2,
  { completedTutorials: whGet2.json.data.completedTutorials })

// ── 13. 种子只读保护：user 4 的 5 条种子打卡未被接口改动 ────
const seedRows = db.prepare('SELECT COUNT(*) AS n FROM checkins WHERE user_id = 4').get()
record('purchase 用户种子 5 条打卡行未变', seedRows.n === 5, { n: seedRows.n })
db.close()

const failed = results.filter(r => !r.pass)
console.log(`\n===== BE-02 总计: ${results.length - failed.length}/${results.length} 通过 =====`)
if (failed.length) { console.log('FAILED:', failed.map(f => f.name)); process.exit(1) }
