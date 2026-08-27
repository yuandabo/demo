/**
 * checkins 域单测（IT-05/BE-02）：checkin 幂等/连续/中断/徽章 + buildCheckinStatus 聚合/周历/零值。
 * 期望值来自 API 契约（docs/design/api/{post,get}-api-checkins.md）、AC-FN-16/21、AC-RULE-12/13
 * 与 db.md §6 种子固定数据，不从实现反推；测试日期按运行时本地当日动态构造，任意日期运行均成立。
 * 每用例全新内存库（DDL 真源同 db.ts：docs/design/sql/*.sql + insertSeed），不触碰 server/erp.db；
 * 路由层 401 分支与空 body 合法性由 requireAuth 中间件保证（auth.test.ts / curl 验收覆盖）。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { checkin, buildCheckinStatus } from './routes/misc.js'
import { insertSeed } from './seed.js'

const SQL_DIR = path.resolve(import.meta.dirname, '../../docs/design/sql')
const DDL_FILES = [
  'users.sql',
  'auth_tokens.sql',
  'categories.sql',
  'tutorials.sql',
  'favorites.sql',
  'histories.sql',
  'feedbacks.sql',
  'messages.sql',
  'checkins.sql',
] as const

/** 全新内存库：9 表 DDL + 种子（与 openDb 建库口径一致，跑完即弃） */
function createTestDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  for (const file of DDL_FILES) {
    db.exec(readFileSync(path.join(SQL_DIR, file), 'utf8'))
  }
  insertSeed(db)
  return db
}

/** 种子固定账号（seed.ts §USER_SEED）：id=4 purchase 含 5 天示例打卡；id=3 sales 无打卡无历史 */
const PURCHASE_USER_ID = 4
const FRESH_USER_ID = 3

/** 运行时本地日期 + 偏移天数 → yyyy-MM-dd（测试数据相对"今天"构造，跨日运行不失效） */
function localDate(offsetDays: number): string {
  const now = new Date()
  const shifted = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays)
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`
}

/** 直写打卡记录（构造连续/中断序列；points 固定 10 同真实打卡口径，streak 由调用方指定模拟历史状态） */
function insertCheckin(db: DatabaseSync, userId: number, date: string, streak: number): void {
  db.prepare('INSERT INTO checkins (user_id, checkin_date, points, streak) VALUES (?, ?, 10, ?)').run(userId, date, streak)
}

/** 直写阅读历史（构造完成数；联合主键 (user_id, tutorial_id) 要求 tutorialId 互异） */
function insertHistory(db: DatabaseSync, userId: number, tutorialId: number, progress: number): void {
  db.prepare('INSERT INTO histories (user_id, tutorial_id, progress) VALUES (?, ?, ?)').run(userId, tutorialId, progress)
}

test('首次打卡：+10 积分、streak=1、duplicated=false，库内恰落一条 points=10 记录（AC-FN-16）', () => {
  const db = createTestDb()
  const result = checkin(db, FRESH_USER_ID)
  assert.equal(result.duplicated, false)
  assert.equal(result.pointsAdded, 10)
  assert.equal(result.checkinDate, localDate(0))
  assert.equal(result.streak, 1)
  assert.equal(result.totalPoints, 10)
  assert.deepEqual(result.badges, [])
  // 持久化验证：响应值与库内字段一致（checkin_date=本地当日、points=10、streak=1）；
  // node:sqlite 行对象为 null prototype，逐字段断言（deepStrictEqual 会因原型不等误判）
  const rows = db
    .prepare('SELECT checkin_date AS checkinDate, points, streak FROM checkins WHERE user_id = ?')
    .all(FRESH_USER_ID) as Array<{ checkinDate: string; points: number; streak: number }>
  assert.equal(rows.length, 1)
  assert.equal(rows[0].checkinDate, localDate(0))
  assert.equal(rows[0].points, 10)
  assert.equal(rows[0].streak, 1)
})

test('当日重复打卡幂等：duplicated=true、pointsAdded=0、积分与库内记录均不再变化（AC-FN-16）', () => {
  const db = createTestDb()
  const first = checkin(db, FRESH_USER_ID)
  const second = checkin(db, FRESH_USER_ID)
  assert.equal(second.duplicated, true)
  assert.equal(second.pointsAdded, 0)
  assert.equal(second.totalPoints, first.totalPoints, '积分不再增加')
  assert.equal(second.streak, first.streak)
  assert.equal(second.checkinDate, first.checkinDate)
  assert.equal(
    (db.prepare('SELECT COUNT(*) AS n FROM checkins WHERE user_id = ?').get(FRESH_USER_ID) as { n: number }).n,
    1,
    'UNIQUE(user_id, checkin_date) 保证当日仅一条',
  )
})

test('跨日打卡连续：昨日 streak=2 → 今日打卡 streak=3、totalPoints 为全部打卡之和（AC-RULE-12）', () => {
  const db = createTestDb()
  insertCheckin(db, FRESH_USER_ID, localDate(-1), 2)
  const result = checkin(db, FRESH_USER_ID)
  assert.equal(result.streak, 3)
  assert.equal(result.pointsAdded, 10)
  assert.equal(result.totalPoints, 20, '库内实际打卡行数求和（昨日 1 条 + 今日 1 条）×10')
})

test('连续 7 天打卡获得坚持者徽章；仅 6 天不获得（阈值边界，AC-FN-16/AC-RULE-12）', () => {
  const seven = createTestDb()
  // 昨日止连续 6 天（-6..-1 streak 1..6），今日打卡为第 7 天
  for (let i = 6; i >= 1; i--) insertCheckin(seven, FRESH_USER_ID, localDate(-i), 7 - i)
  const hit = checkin(seven, FRESH_USER_ID)
  assert.equal(hit.streak, 7)
  assert.deepEqual(hit.badges, ['persist'])

  const six = createTestDb()
  // 昨日止连续 5 天（-5..-1 streak 1..5），今日打卡为第 6 天，未达阈值
  for (let i = 5; i >= 1; i--) insertCheckin(six, FRESH_USER_ID, localDate(-i), 6 - i)
  const miss = checkin(six, FRESH_USER_ID)
  assert.equal(miss.streak, 6)
  assert.deepEqual(miss.badges, [])
})

test('中断仅清连续不清积分不回收徽章：7 连续-中断 1 天-再打卡 → streak=1、totalPoints=80、persist 保留（AC-RULE-12/AC-FN-21）', () => {
  const db = createTestDb()
  // 连续 7 天（-8..-2，streak 1..7，已获 persist），昨日空窗中断，今日再打卡
  for (let i = 8; i >= 2; i--) insertCheckin(db, FRESH_USER_ID, localDate(-i), 9 - i)
  const result = checkin(db, FRESH_USER_ID)
  assert.equal(result.streak, 1, '中断后连续天数重置从 1 重新累计')
  assert.equal(result.pointsAdded, 10)
  assert.equal(result.totalPoints, 80, '8 次打卡积分之和，中断不清零')
  assert.ok(result.badges.includes('persist'), '已获坚持者徽章不回收')

  const status = buildCheckinStatus(db, FRESH_USER_ID)
  assert.equal(status.streak, 1)
  assert.equal(status.bestStreak, 7)
  assert.ok(status.badges.includes('persist'), 'GET 徽章墙同样不回收')
})

test('百科达人：19 篇进度 100% 不获得，第 20 篇后获得 encyclopedia（AC-FN-21）', () => {
  const db = createTestDb()
  for (let tutorialId = 1; tutorialId <= 19; tutorialId++) insertHistory(db, FRESH_USER_ID, tutorialId, 100)
  const before = buildCheckinStatus(db, FRESH_USER_ID)
  assert.equal(before.completedTutorials, 19)
  assert.ok(!before.badges.includes('encyclopedia'))

  insertHistory(db, FRESH_USER_ID, 20, 100)
  const after = buildCheckinStatus(db, FRESH_USER_ID)
  assert.equal(after.completedTutorials, 20)
  assert.ok(after.badges.includes('encyclopedia'))
  assert.ok(checkin(db, FRESH_USER_ID).badges.includes('encyclopedia'), 'POST 响应徽章同口径')
})

test('completedTutorials 仅计 progress=100：60%/100%/30%/100% → 2（AC-RULE-13 分子口径）', () => {
  const db = createTestDb()
  insertHistory(db, FRESH_USER_ID, 1, 60)
  insertHistory(db, FRESH_USER_ID, 2, 100)
  insertHistory(db, FRESH_USER_ID, 3, 30)
  insertHistory(db, FRESH_USER_ID, 4, 100)
  assert.equal(buildCheckinStatus(db, FRESH_USER_ID).completedTutorials, 2)
})

test('GET 无打卡新用户：全指标归 0、周历 7 项全 false、todayChecked=false（不报错）', () => {
  const status = buildCheckinStatus(createTestDb(), FRESH_USER_ID)
  assert.equal(status.todayChecked, false)
  assert.equal(status.totalPoints, 0)
  assert.equal(status.streak, 0)
  assert.equal(status.bestStreak, 0)
  assert.equal(status.completedTutorials, 0)
  assert.deepEqual(status.badges, [])
  assert.equal(status.weekCalendar.length, 7)
  assert.ok(status.weekCalendar.every((day) => day.isChecked === false))
  assert.ok(status.weekCalendar.every((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date)))
})

test('GET 种子用户（purchase，db.md §6 五天示例打卡）：totalPoints=50、bestStreak=2、周历与种子日期吻合', () => {
  const db = createTestDb()
  const status = buildCheckinStatus(db, PURCHASE_USER_ID)
  assert.equal(status.totalPoints, 50, '5 天 × 10 分')
  assert.equal(status.bestStreak, 2)
  assert.equal(status.completedTutorials, 0, '种子无 histories 数据')

  // 当前连续天数口径：今日记录优先、无今日取昨日、均无归 0（种子日期固定，期望值按运行日动态推）
  const seedStreaks = new Map([
    ['2026-08-12', 1],
    ['2026-08-13', 2],
    ['2026-08-15', 1],
    ['2026-08-17', 1],
    ['2026-08-18', 2],
  ])
  const expectedStreak = seedStreaks.get(localDate(0)) ?? seedStreaks.get(localDate(-1)) ?? 0
  assert.equal(status.streak, expectedStreak)
  assert.equal(status.todayChecked, seedStreaks.has(localDate(0)))

  // 周历：7 项、首项为周一、日期逐日连续、已过的种子打卡日 isChecked=true、未来日期恒 false
  const week = status.weekCalendar
  assert.equal(week.length, 7)
  const [y, m, d] = week[0].date.split('-').map(Number)
  assert.equal(new Date(y, m - 1, d).getDay(), 1, '首项为本周一')
  for (let i = 1; i < week.length; i++) {
    assert.equal(week[i].date, nextDay(week[i - 1].date), `周内日期逐日连续：${week[i - 1].date} → ${week[i].date}`)
  }
  for (const day of week) {
    assert.equal(day.isChecked, seedStreaks.has(day.date) && day.date <= localDate(0), `${day.date} 打卡状态与种子吻合`)
  }
})

test('GET streak 口径：今日无昨日有 → 取昨日 streak；补打今日后取今日 streak（get-api-checkins 业务规则）', () => {
  const db = createTestDb()
  insertCheckin(db, FRESH_USER_ID, localDate(-1), 4)
  const before = buildCheckinStatus(db, FRESH_USER_ID)
  assert.equal(before.todayChecked, false)
  assert.equal(before.streak, 4, '今日无记录取昨日 streak')

  checkin(db, FRESH_USER_ID)
  const after = buildCheckinStatus(db, FRESH_USER_ID)
  assert.equal(after.todayChecked, true)
  assert.equal(after.streak, 5, '今日打卡后连续天数 +1')
})

test('周历打卡状态：今日打卡后今日 isChecked=true，未来日期恒为 false', () => {
  const db = createTestDb()
  checkin(db, FRESH_USER_ID)
  const week = buildCheckinStatus(db, FRESH_USER_ID).weekCalendar
  const today = week.find((day) => day.date === localDate(0))
  assert.ok(today, '本周必然包含今天')
  assert.equal(today.isChecked, true)
  for (const day of week) {
    if (day.date > localDate(0)) assert.equal(day.isChecked, false, `${day.date} 为未来日期强制未打卡`)
  }
})

test('UNIQUE(user_id, checkin_date) 库层兜底：同日重复直插被唯一约束拒绝（并发兜底依据）', () => {
  const db = createTestDb()
  insertCheckin(db, FRESH_USER_ID, localDate(0), 1)
  assert.throws(
    () => insertCheckin(db, FRESH_USER_ID, localDate(0), 2),
    /UNIQUE constraint failed/,
    '并发同日双写由库层唯一约束兜底，服务层 INSERT OR IGNORE 后读回既有行转幂等',
  )
})

/** 日期串 +1 天（周历连续性 oracle，本地时间分量构造，与实现互独立推导） */
function nextDay(dateStr: string): string {
  const [yy, mm, dd] = dateStr.split('-').map(Number)
  const shifted = new Date(yy, mm - 1, dd + 1)
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`
}
