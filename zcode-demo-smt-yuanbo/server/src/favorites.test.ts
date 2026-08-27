/**
 * 收藏 service 单测（IT-04/BE-01 阶段 1）
 * oracle：真实种子数据（seed.ts 固定值）——#3 MRP published/fav_count=187、#19 回审旧版在线、
 * #20 首次待审、#23 纯草稿、#24 已下架；不触碰 server/erp.db，:memory: 独立建库。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { insertSeed } from './seed.js'
import { listFavorites, toggleFavorite } from './routes/favorites.js'
import { HttpError } from './response.js'

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

/** 建独立内存库：DDL 真源（docs/design/sql）+ 完整种子，与 db.ts 同一顺序 */
function buildDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  const sqlDir = path.resolve(import.meta.dirname, '../../docs/design/sql')
  for (const file of DDL_FILES) {
    db.exec(readFileSync(path.join(sqlDir, file), 'utf8'))
  }
  insertSeed(db)
  return db
}

/** 直插收藏关系并显式指定 created_at（绕开 datetime('now') 使倒序断言确定性） */
function seedFavorite(db: DatabaseSync, userId: number, tutorialId: number, favoritedAt: string): void {
  db.prepare('INSERT INTO favorites (user_id, tutorial_id, created_at) VALUES (?, ?, ?)').run(
    userId,
    tutorialId,
    favoritedAt
  )
}

test('新增收藏：可见教程 favorites 落行且 fav_count +1（AC-RULE-09，种子 #3=187）', () => {
  const db = buildDb()
  try {
    assert.deepEqual(toggleFavorite(db, 4, 3, true), { tutorialId: 3, favorited: true, favCount: 188 })
    // node:sqlite 行对象为 null 原型，spread 复制为普通对象后再 deepEqual
    const rows = db.prepare('SELECT user_id, tutorial_id FROM favorites').all() as Array<Record<string, number>>
    assert.deepEqual(rows.map((row) => ({ ...row })), [{ user_id: 4, tutorial_id: 3 }])
  } finally {
    db.close()
  }
})

test('重复收藏幂等：仍返回 favorited=true 且计数不重复增加', () => {
  const db = buildDb()
  try {
    assert.equal(toggleFavorite(db, 4, 3, true).favCount, 188)
    assert.deepEqual(toggleFavorite(db, 4, 3, true), { tutorialId: 3, favorited: true, favCount: 188 })
    assert.equal((db.prepare('SELECT COUNT(*) AS n FROM favorites').get() as { n: number }).n, 1, '联合主键幂等：仍只有一行收藏关系')
  } finally {
    db.close()
  }
})

test('取消收藏：fav_count -1 复原；重复取消幂等不重复扣减（AC-RULE-09 当前有效口径）', () => {
  const db = buildDb()
  try {
    toggleFavorite(db, 4, 3, true)
    assert.deepEqual(toggleFavorite(db, 4, 3, false), { tutorialId: 3, favorited: false, favCount: 187 })
    assert.deepEqual(toggleFavorite(db, 4, 3, false), { tutorialId: 3, favorited: false, favCount: 187 })
    assert.equal((db.prepare('SELECT COUNT(*) AS n FROM favorites').get() as { n: number }).n, 0)
  } finally {
    db.close()
  }
})

test('不可见教程不可新增收藏（AC-FN-20）：已下架#24/首次待审#20/纯草稿#23 → 404 文案精确；回审旧版在线#19 可收藏', () => {
  const db = buildDb()
  try {
    for (const tutorialId of [24, 20, 23]) {
      assert.throws(
        () => toggleFavorite(db, 4, tutorialId, true),
        (err: unknown) =>
          err instanceof HttpError && err.status === 404 && err.message === '该教程不存在或暂不可见',
        `教程 #${tutorialId} 不可见，应 404`
      )
    }
    assert.equal(toggleFavorite(db, 4, 19, true).favCount, 97)
  } finally {
    db.close()
  }
})

test('已下架教程的收藏可取消（AC-EG-10）：取消仅校验记录存在，不校验可见性', () => {
  const db = buildDb()
  try {
    seedFavorite(db, 4, 24, '2026-08-19 20:15:00')
    assert.deepEqual(toggleFavorite(db, 4, 24, false), { tutorialId: 24, favorited: false, favCount: 72 })
  } finally {
    db.close()
  }
})

test('教程不存在：POST 与 DELETE 分别返回各自 404 文案', () => {
  const db = buildDb()
  try {
    assert.throws(
      () => toggleFavorite(db, 4, 999, true),
      (err: unknown) => err instanceof HttpError && err.message === '该教程不存在或暂不可见'
    )
    assert.throws(
      () => toggleFavorite(db, 4, 999, false),
      (err: unknown) => err instanceof HttpError && err.message === '教程不存在'
    )
  } finally {
    db.close()
  }
})

test('fav_count 兜底不落负：计数已为 0 时取消收藏保持 0', () => {
  const db = buildDb()
  try {
    db.prepare('UPDATE tutorials SET fav_count = 0 WHERE id = 3').run()
    seedFavorite(db, 4, 3, '2026-08-20 08:30:00')
    assert.equal(toggleFavorite(db, 4, 3, false).favCount, 0)
  } finally {
    db.close()
  }
})

test('收藏列表：时间倒序 + isOffline 派生 + published_summary 快照口径 + 分页元数据（AC-RULE-04/AC-FN-20）', () => {
  const db = buildDb()
  try {
    seedFavorite(db, 4, 3, '2026-08-20 08:30:00')
    seedFavorite(db, 4, 19, '2026-08-20 09:00:00')
    seedFavorite(db, 4, 24, '2026-08-19 20:15:00')
    seedFavorite(db, 3, 5, '2026-08-20 10:00:00') // sales 用户（隔离对照）

    const page = listFavorites(db, 4, 1, 20)
    assert.equal(page.total, 3)
    assert.deepEqual(page.list.map((item) => item.tutorialId), [19, 3, 24], '按收藏时间倒序')
    assert.deepEqual({ page: page.page, pageSize: page.pageSize }, { page: 1, pageSize: 20 })

    const [v2, mrp, offline] = page.list
    assert.equal(v2.title, '销售订单录入操作指南')
    assert.equal(v2.summary, '订单录入四步走：选客户、填明细、过校验、提交打印，附价格与信用拦截处理办法。')
    assert.deepEqual(v2.tags, ['订单', '录入'])
    assert.equal(v2.publishedAt, '2026-07-25 14:00:00')
    assert.equal(v2.favoritedAt, '2026-08-20 09:00:00')
    assert.equal(v2.isOffline, false)
    assert.equal(
      mrp.summary,
      '告别手工 Excel 算料：销售订单驱动 MRP 运算，自动比对库存、在途与安全库存，输出缺料清单与采购建议。',
      '无 v2 快照的教程回退工作列 summary（COALESCE 口径，与 recommend 一致）'
    )
    assert.equal(mrp.categoryId, 5)
    assert.equal(mrp.categoryName, '采购管理')
    assert.equal(offline.title, '来料检验操作指南')
    assert.equal(offline.isOffline, true, '已下架条目保留并标注（灰显数据来源）')

    // 分页边界：pageSize=1 时逐页取数
    assert.deepEqual(listFavorites(db, 4, 1, 1).list.map((item) => item.tutorialId), [19])
    assert.deepEqual(listFavorites(db, 4, 2, 1).list.map((item) => item.tutorialId), [3])

    // 用户隔离（AC-FN-15 跨端同数据源：各自收藏互不串扰）
    const sales = listFavorites(db, 3, 1, 20)
    assert.equal(sales.total, 1)
    assert.deepEqual(sales.list.map((item) => item.tutorialId), [5])

    // 空列表非异常
    assert.deepEqual(listFavorites(db, 5, 1, 20), { list: [], total: 0, page: 1, pageSize: 20 })
  } finally {
    db.close()
  }
})
