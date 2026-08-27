import test from 'node:test'
import assert from 'node:assert/strict'

import { closeDb, openDb } from './db.js'
import { buildRecommend } from './routes/misc.js'
import { HttpError } from './response.js'

/**
 * BE-07 推荐位单测：期望值从 db.md §6 种子口径与 PRD §7.1 角色-模块映射人工誊抄，
 * 作为测试 oracle，禁止从实现反推（同 state-machine.test.ts 约定）。
 * 种子可见浏览量序（VISIBLE_SQL：18 已发布 + 1 回审旧版 #19）：
 *   全站 Top6 = #1(5023) #2(2865) #3(2341) #5(2105) #6(1980) #19(1876)；
 *   采购/库存命中集 = #3(2341) #6(1980) #7(1694) #8(1523) #10(1352)，仅 5 条（不足 6）。
 */

test('游客/未传 erpRole：全站口径 Top6，回审旧版参与且已下架/从未过审不可见（AC-FN-22/AC-RULE-16）', () => {
  const { source, erpRole, list } = buildRecommend()
  assert.equal(source, 'global')
  assert.equal(erpRole, null)
  assert.deepEqual(
    list.map((c) => c.id),
    [1, 2, 3, 5, 6, 19],
  )
  const views = list.map((c) => c.viewCount)
  assert.ok(views.every((v, i) => i === 0 || views[i - 1] >= v), '浏览量倒序')
  // #19 待审核（v2 修改版回审）旧版在线参与；#20-23 从未过审、#24 已下架均不可见
  assert.ok(list.some((c) => c.id === 19), '回审期间旧版数据参与排序（VISIBLE_SQL）')
  assert.ok(!list.some((c) => c.id >= 20), '从未过审(#20-23)与已下架(#24)不出现在推荐位')
})

test('回审教程卡片读线上过审旧版摘要与所属分类（get-api-recommend 契约字段）', () => {
  const card = buildRecommend().list.find((c) => c.id === 19)
  assert.ok(card, '回审旧版应进入全站 Top6')
  assert.equal(card.summary, '订单录入四步走：选客户、填明细、过校验、提交打印，附价格与信用拦截处理办法。')
  assert.deepEqual(card.tags, ['订单', '录入'])
  assert.equal(card.categoryId, 1)
  assert.equal(card.categoryName, '销售管理')
  assert.equal(card.publishedAt, '2026-07-25 14:00:00')
})

test('erpRole=purchase：全部来自采购+库存映射分类，命中集不足 6 条返回实际数量（AC-FN-17）', () => {
  const { source, erpRole, list } = buildRecommend('purchase')
  assert.equal(source, 'role')
  assert.equal(erpRole, 'purchase')
  assert.deepEqual(
    list.map((c) => c.id),
    [3, 6, 7, 8, 10],
  )
  assert.ok(
    list.every((c) => c.categoryName === '采购管理' || c.categoryName === '库存管理'),
    '全部命中采购/库存模块映射分类',
  )
})

test('warehouse 单模块与 manage 全 8 模块命中集（PRD §7.1 映射）', () => {
  assert.deepEqual(
    buildRecommend('warehouse').list.map((c) => c.id),
    [6, 10],
  )
  // manage=全部 8 模块：不含未映射通用分类（#1 新手入门 5023 浏览最高也不进）
  assert.deepEqual(
    buildRecommend('manage').list.map((c) => c.id),
    [2, 3, 5, 6, 19, 4],
  )
})

test('erpRole 非法枚举 400；空串视为未传走全站口径', () => {
  for (const raw of ['hacker', 'admin', 123, ['purchase']]) {
    assert.throws(
      () => buildRecommend(raw),
      (err: unknown) => err instanceof HttpError && err.status === 400 && err.message === 'erpRole 参数不合法',
      `erpRole=${String(raw)} 应 400`,
    )
  }
  assert.equal(buildRecommend('').source, 'global')
})

test('停用分类不进推荐位，命中集可清空返回 []（AC-EG-14 第 2 点）', () => {
  const db = openDb()
  db.exec('BEGIN')
  try {
    // 停用新手入门（#1 浏览量 5023 全站最高）：全站口径切换为 8 模块+通用剩余 Top6
    db.exec("UPDATE categories SET status='disabled' WHERE id=9")
    const globalList = buildRecommend().list
    assert.ok(!globalList.some((c) => c.id === 1), '停用分类下教程不出现在推荐位')
    assert.deepEqual(
      globalList.map((c) => c.id),
      [2, 3, 5, 6, 19, 4],
    )
    // 采购命中集（采购管理+库存管理）整体停用 → 空数组而非 null
    db.exec("UPDATE categories SET status='disabled' WHERE id IN (5,6)")
    const empty = buildRecommend('purchase')
    assert.equal(empty.source, 'role')
    assert.deepEqual(empty.list, [])
  } finally {
    db.exec('ROLLBACK')
    closeDb()
  }
  // 回滚后恢复种子口径，避免污染同进程后续用例
  assert.deepEqual(
    buildRecommend().list.map((c) => c.id),
    [1, 2, 3, 5, 6, 19],
  )
})
