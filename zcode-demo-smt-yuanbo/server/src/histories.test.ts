/**
 * histories 域单测（IT-04/BE-02）：upsertProgress 覆盖/边界/可见性/幂等 + listHistories 排序/隔离/下架标注。
 * 期望值来自 API 契约（docs/design/api/*histories*.md）与 db.md §6 种子固定数据，不从实现反推。
 * 每用例全新内存库（DDL 真源同 db.ts：docs/design/sql/*.sql + insertSeed），不触碰 server/erp.db。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { upsertProgress, listHistories } from './routes/histories.js'
import { insertSeed } from './seed.js'
import { HttpError } from './response.js'

/** 种子固定账号（seed.ts §USER_SEED：id=4 purchase 演示用户，role=user） */
const PURCHASE_USER_ID = 4
/** 种子固定教程 id：3=已发布(MRP)、19=回审旧版在线、20=首次提审无快照、22/23=草稿、24=已下架 */
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

/** 断言 HttpError 的 status/code/message 三元组（API 契约冻结文案） */
function expectHttpError(fn: () => unknown, status: number, message: string): void {
  assert.throws(
    fn,
    (err: unknown) => {
      assert.ok(err instanceof HttpError, `应抛 HttpError，实际 ${String(err)}`)
      assert.equal(err.status, status)
      assert.equal(err.code, status)
      assert.equal(err.message, message)
      return true
    },
    `期望 ${status} ${message}`
  )
}

test('upsertProgress：首次保存读回 {tutorialId, progress, updatedAt}（AC-FN-04 后端侧）', () => {
  const db = createTestDb()
  const saved = upsertProgress(db, PURCHASE_USER_ID, 3, 60)
  assert.equal(saved.tutorialId, 3)
  assert.equal(saved.progress, 60)
  assert.match(saved.updatedAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, 'yyyy-MM-dd HH:mm:ss 契约格式')
})

test('upsertProgress 单值覆盖：同用户同教程仅一行、progress 取最新（AC-RULE-11 跨端同值基础）', () => {
  const db = createTestDb()
  const first = upsertProgress(db, PURCHASE_USER_ID, 3, 60)
  const second = upsertProgress(db, PURCHASE_USER_ID, 3, 80)
  assert.equal(second.progress, 80)
  assert.ok(second.updatedAt >= first.updatedAt, '覆盖后最近阅读时间不回退')
  const rows = db
    .prepare('SELECT progress FROM histories WHERE user_id = ? AND tutorial_id = ?')
    .all(PURCHASE_USER_ID, 3) as Array<{ progress: number }>
  assert.equal(rows.length, 1, '联合主键保证仅一条历史记录')
  assert.equal(rows[0].progress, 80)
})

test('upsertProgress 边界：progress=0 与 100 均保存成功（100=完成口径，AC-RULE-12/13 分子）', () => {
  const db = createTestDb()
  assert.equal(upsertProgress(db, PURCHASE_USER_ID, 1, 0).progress, 0)
  assert.equal(upsertProgress(db, PURCHASE_USER_ID, 2, 100).progress, 100)
})

test('upsertProgress 参数校验：缺失/字符串/小数/负数/101 → 400 精确文案', () => {
  const db = createTestDb()
  for (const bad of [undefined, '60', 60.5, -1, 101, null]) {
    expectHttpError(
      () => upsertProgress(db, PURCHASE_USER_ID, 3, bad),
      400,
      'progress 必须为 0-100 的整数'
    )
  }
})

test('upsertProgress 可见性：已下架/无快照待审/纯草稿/不存在 → 404；回审旧版在线可保存（AC-RULE-02 规则②④）', () => {
  const db = createTestDb()
  for (const invisibleId of [24, 20, 22, 23, 999]) {
    expectHttpError(
      () => upsertProgress(db, PURCHASE_USER_ID, invisibleId, 50),
      404,
      '该教程不存在或暂不可见'
    )
  }
  // 19=pending 且存在 published_content 快照、last_offline_at 为空 → 旧版在线可保存进度
  assert.equal(upsertProgress(db, PURCHASE_USER_ID, 19, 30).progress, 30)
})

test('upsertProgress 幂等：重复提交同进度不追加行、updatedAt 照常刷新（AC-EG-17 静默重试支撑）', () => {
  const db = createTestDb()
  const first = upsertProgress(db, PURCHASE_USER_ID, 5, 60)
  const retried = upsertProgress(db, PURCHASE_USER_ID, 5, 60)
  assert.equal(retried.progress, first.progress)
  assert.ok(retried.updatedAt >= first.updatedAt)
  const { n } = db
    .prepare('SELECT COUNT(*) AS n FROM histories WHERE user_id = ? AND tutorial_id = ?')
    .get(PURCHASE_USER_ID, 5) as { n: number }
  assert.equal(n, 1)
})

test('listHistories：按最近阅读时间倒序 + 进度百分比 + 快照口径字段（AC-FN-23）', () => {
  const db = createTestDb()
  upsertProgress(db, PURCHASE_USER_ID, 3, 60)
  upsertProgress(db, PURCHASE_USER_ID, 5, 30)
  upsertProgress(db, PURCHASE_USER_ID, 2, 100)
  // 种子时钟同秒无区分度，显式钉住 updated_at 制造确定性排序（含同秒 tutorial_id 决胜负）
  db.exec("UPDATE histories SET updated_at='2026-08-19 08:00:00' WHERE tutorial_id=5")
  db.exec("UPDATE histories SET updated_at='2026-08-20 09:00:00' WHERE tutorial_id=2")
  db.exec("UPDATE histories SET updated_at='2026-08-21 10:00:00' WHERE tutorial_id=3")

  const result = listHistories(db, PURCHASE_USER_ID, 1, 20)
  assert.deepEqual(result.list.map((item) => item.tutorialId), [3, 2, 5], 'updated_at DESC')
  assert.deepEqual(result.list.map((item) => item.progress), [60, 100, 30])
  assert.equal(result.total, 3)

  const mrp = result.list[0]
  assert.equal(mrp.title, 'MRP 自动算料：从 BOM 到采购建议')
  assert.equal(mrp.categoryId, 5)
  assert.equal(mrp.categoryName, '采购管理')
  assert.deepEqual(mrp.tags, ['算料', 'BOM', '审批'])
  assert.equal(mrp.isOffline, false)
})

test('listHistories：摘要读 published_* 快照列（回审旧版在线场景取旧版摘要）', () => {
  const db = createTestDb()
  upsertProgress(db, PURCHASE_USER_ID, 19, 50)
  const item = listHistories(db, PURCHASE_USER_ID, 1, 20).list[0]
  // 种子 19 的快照摘要为旧版文案，而非当前 summary（v2 修改版），验证前台快照口径
  assert.equal(item.summary, '订单录入四步走：选客户、填明细、过校验、提交打印，附价格与信用拦截处理办法。')
})

test('listHistories：非回审教程（#3 MRP）摘要回退工作列 summary 非空（COALESCE 口径，CHANGE-3 与 favorites/recommend 一致）', () => {
  const db = createTestDb()
  upsertProgress(db, PURCHASE_USER_ID, 3, 60)
  const item = listHistories(db, PURCHASE_USER_ID, 1, 20).list[0]
  // 种子 #3 无 v2 快照（published_summary 为 NULL），仅读 published_* 会得空串；
  // 应回退工作列 summary（写法对照 favorites.test.ts #3 MRP 断言）
  assert.equal(
    item.summary,
    '告别手工 Excel 算料：销售订单驱动 MRP 运算，自动比对库存、在途与安全库存，输出缺料清单与采购建议。',
    'published_summary 为 NULL 的已发布教程回退 summary 工作列'
  )
})

test('listHistories：已下架条目保留且 isOffline=true（AC-EG-10 数据来源）', () => {
  const db = createTestDb()
  upsertProgress(db, PURCHASE_USER_ID, 3, 60)
  // 下架教程 24 无法经 POST 产生新历史（404 拦截），此处直插历史行模拟下架前遗留数据
  db.prepare(
    "INSERT INTO histories (user_id, tutorial_id, progress, updated_at) VALUES (?, ?, 100, '2026-08-01 09:00:00')"
  ).run(PURCHASE_USER_ID, 24)

  const list = listHistories(db, PURCHASE_USER_ID, 1, 20).list
  const offlineItem = list.find((item) => item.tutorialId === 24)
  assert.ok(offlineItem, '已下架教程的历史条目保留不删除')
  assert.equal(offlineItem.isOffline, true)
  assert.equal(offlineItem.title, '来料检验操作指南')
  assert.equal(list.find((item) => item.tutorialId === 3)?.isOffline, false)
})

test('listHistories 分页：pageSize 截断与越界页空列表、total 不变', () => {
  const db = createTestDb()
  upsertProgress(db, PURCHASE_USER_ID, 3, 60)
  upsertProgress(db, PURCHASE_USER_ID, 5, 30)
  upsertProgress(db, PURCHASE_USER_ID, 2, 100)

  assert.equal(listHistories(db, PURCHASE_USER_ID, 1, 20).list.length, 3, '默认页大小覆盖全部')
  const firstPage = listHistories(db, PURCHASE_USER_ID, 1, 2)
  assert.equal(firstPage.list.length, 2)
  assert.equal(firstPage.total, 3)
  assert.equal(firstPage.page, 1)
  assert.equal(firstPage.pageSize, 2)
  const secondPage = listHistories(db, PURCHASE_USER_ID, 2, 2)
  assert.equal(secondPage.list.length, 1)
  const beyond = listHistories(db, PURCHASE_USER_ID, 99, 20)
  assert.deepEqual(beyond.list, [])
  assert.equal(beyond.total, 3)
})

test('listHistories 用户隔离：仅返回本人历史；无历史用户返回空列表非异常', () => {
  const db = createTestDb()
  upsertProgress(db, PURCHASE_USER_ID, 3, 60)
  upsertProgress(db, 3, 5, 10)
  const mine = listHistories(db, PURCHASE_USER_ID, 1, 20)
  assert.deepEqual(mine.list.map((item) => item.tutorialId), [3])
  assert.equal(listHistories(db, 8, 1, 20).total, 0)
  assert.deepEqual(listHistories(db, 8, 1, 20).list, [])
})

test('数据层兜底：histories.progress CHECK(0-100) 拒绝 101（service 之外的第二道防线）', () => {
  const db = createTestDb()
  assert.throws(() =>
    db.prepare('INSERT INTO histories (user_id, tutorial_id, progress) VALUES (4, 3, 101)').run()
  )
})
