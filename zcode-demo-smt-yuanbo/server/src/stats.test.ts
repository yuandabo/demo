import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import express from 'express'

import { closeDb, openDb } from './db.js'
import { buildCoverage, buildFeedbackAnalysis, buildOverview } from './routes/stats.js'
import statsRouter from './routes/stats.js'
import { issueToken, revokeToken } from './auth.js'
import { errorHandler } from './response.js'

/**
 * BE-06 统计看板单测：期望值从 db.md §6 种子口径（seed.ts）人工誊抄作为测试 oracle，
 * 禁止从实现反推（同 recommend.test.ts 约定）。
 * 种子可见集（VISIBLE_SQL）：18 已发布(#1-18) + #19 回审旧版在线 = 19 篇；
 * 不可见：#20/#21 无快照首次提审、#22/#23 纯草稿、#24 已下架。
 * 手算基准：总浏览 31590（#24 的 1204 不计入）；逐教程有帮助率算术平均 88.0%；
 * 没帮助占比倒序首条 #19（22/40=55%，唯一 >50% 红标条目）。
 */

/** 种子可见集浏览量 Top10（#1 5023 / #2 2865 / #3 2341 / #5 2105 / #6 1980 / #19 1876 / #4 1725 / #7 1694 / #8 1523 / #9 1462） */
const SEED_TOP10 = [1, 2, 3, 5, 6, 19, 4, 7, 8, 9] as const

/** 种子没帮助占比（取整后）倒序全表：#19=55 → #14=22.5 → …；#11/#16 与 #3/#17 各同占比按 id 升序 */
const SEED_FEEDBACK_ORDER = [19, 14, 6, 2, 5, 10, 11, 16, 15, 8, 12, 13, 18, 7, 3, 17, 1, 9, 4] as const

/** 覆盖度矩阵期望（启用分类 sort 升序 × 可见教程数）：18 已发布分布 + #19 归 cat1 + #24 停用计入否 */
const SEED_MATRIX: ReadonlyArray<[categoryId: number, name: string, erpModule: string | null, count: number]> = [
  [1, '销售管理', 'sales', 4], // #4 #5 #14 + #19 回审旧版（AC-RULE-08 覆盖度可见口径）
  [2, '项目管理', 'project', 2],
  [3, '文件管理', 'file', 1],
  [4, '生产制造', 'produce', 3], // #20 无快照不可见
  [5, '采购管理', 'purchase', 3], // #24 已下架不计入
  [6, '库存管理', 'inventory', 2],
  [7, '人事财务', 'hrFinance', 1], // #21 无快照不可见
  [8, '系统设置', 'system', 0], // 空白区（UI-ELEM-04）
  [9, '新手入门', null, 1],
  [10, '最佳实践', null, 1],
  [11, '常见问题', null, 1],
  [12, '开放平台', null, 0], // 空白区
]

/** 在事务内执行变异后回滚，保持种子口径不污染同进程后续用例（同 recommend.test.ts） */
function withRollback(fn: (db: ReturnType<typeof openDb>) => void): void {
  const db = openDb()
  db.exec('BEGIN')
  try {
    fn(db)
  } finally {
    db.exec('ROLLBACK')
  }
}

test('overview：种子 4 指标 + Top10 全走 VISIBLE_SQL（已下架不计入、回审旧版计入，AC-FN-14/AC-RULE-08）', () => {
  const data = buildOverview()
  assert.equal(data.publishedCount, 19)
  assert.equal(data.totalViewCount, 31590)
  assert.equal(data.totalFavCount, 0, '种子 favorites 表为空（总收藏=当前有效收藏行数，AC-RULE-09）')
  assert.equal(data.avgHelpfulRate, 88.0)
  assert.ok(data.topViewed.length <= 10, 'Top10 上限')
  assert.deepEqual(
    data.topViewed.map((t) => t.id),
    [...SEED_TOP10],
  )
  const first = data.topViewed[0]
  assert.deepEqual(Object.keys(first).sort(), ['id', 'title', 'viewCount'])
  assert.equal(first.id, 1)
  assert.equal(first.viewCount, 5023)
  assert.ok(data.topViewed.some((t) => t.id === 19), '回审旧版 #19 计入 Top10')
  assert.ok(!data.topViewed.some((t) => t.id === 24), '已下架 #24 不计入')
})

test('overview：全部零反馈 → avgHelpfulRate=null（零反馈不计入分母，AC-RULE-10/前端显示"—"）', () => {
  withRollback((db) => {
    db.exec('UPDATE tutorials SET helpful_yes = 0, helpful_no = 0')
    const data = buildOverview()
    assert.equal(data.publishedCount, 19, '指标不受反馈清零影响')
    assert.equal(data.avgHelpfulRate, null)
  })
})

test('overview：总收藏量随 favorites 行数走（取消即减，AC-RULE-09）', () => {
  withRollback((db) => {
    db.exec('INSERT INTO favorites (user_id, tutorial_id) VALUES (3, 1), (4, 1), (5, 3)')
    assert.equal(buildOverview().totalFavCount, 3)
    db.exec('DELETE FROM favorites WHERE user_id = 4 AND tutorial_id = 1')
    assert.equal(buildOverview().totalFavCount, 2, '取消收藏后 -1')
  })
})

test('口径对账（AC-RULE-08/09）：下架 #1 后 publishedCount/totalViewCount 同步下降且反馈/覆盖联动', () => {
  withRollback((db) => {
    db.exec("UPDATE tutorials SET status = 'offline', last_offline_at = '2026-08-20 10:00:00' WHERE id = 1")
    const overview = buildOverview()
    assert.equal(overview.publishedCount, 18)
    assert.equal(overview.totalViewCount, 31590 - 5023, '已下架历史浏览量不计入')
    assert.ok(!overview.topViewed.some((t) => t.id === 1))
    const feedback = buildFeedbackAnalysis().list
    assert.ok(!feedback.some((t) => t.tutorialId === 1))
    const newbie = buildCoverage().matrix.find((cell) => cell.categoryId === 9)
    assert.equal(newbie?.tutorialCount, 0)
    assert.equal(newbie?.isBlank, true, '唯一教程下架后分类变空白区')
  })
})

test('feedback：种子没帮助占比倒序，#19 回审旧版 55% 唯一红标（UI-ELEM-03/AC-RULE-10）', () => {
  const { list } = buildFeedbackAnalysis()
  assert.deepEqual(
    list.map((t) => t.tutorialId),
    [...SEED_FEEDBACK_ORDER],
  )
  assert.equal(list.length, 19, '全量可见教程（#20-24 不可见不入清单）')
  const top = list[0]
  assert.equal(top.tutorialId, 19)
  assert.equal(top.helpfulYes, 18)
  assert.equal(top.helpfulNo, 22)
  assert.equal(top.notHelpfulRate, 55)
  assert.equal(top.isRed, true, '占比 >50% 标红')
  const second = list[1]
  assert.equal(second.tutorialId, 14)
  assert.equal(second.notHelpfulRate, 22.5)
  assert.equal(second.isRed, false)
  assert.equal(list.filter((t) => t.isRed).length, 1, '种子仅 #19 超阈值')
})

test('feedback：零反馈条目 notHelpfulRate=null、isRed=false、沉清单尾部（AC-RULE-10）', () => {
  withRollback((db) => {
    db.exec('UPDATE tutorials SET helpful_yes = 0, helpful_no = 0 WHERE id = 4')
    const { list } = buildFeedbackAnalysis()
    const last = list[list.length - 1]
    assert.equal(last.tutorialId, 4)
    assert.equal(last.notHelpfulRate, null)
    assert.equal(last.isRed, false)
    assert.deepEqual(
      list.slice(0, -1).map((t) => t.tutorialId),
      [...SEED_FEEDBACK_ORDER].filter((id) => id !== 4),
    )
  })
})

test('feedback：留言明细仅 comment 非空记录，displayName 联表 users 按时间倒序（AC-RULE-20 后台可见）', () => {
  withRollback((db) => {
    const insert = db.prepare(
      'INSERT INTO feedbacks (user_id, tutorial_id, helpful, comment, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
    insert.run(3, 19, 0, '旧版第2步与实际菜单顺序对不上', '2026-08-19 09:00:00')
    insert.run(6, 19, 0, '盘点差异处理那一步讲错了，实际要先审核盘点单', '2026-08-20 15:20:00')
    insert.run(4, 19, 1, null, '2026-08-18 08:00:00') // 无留言：不应出现
    const item = buildFeedbackAnalysis().list.find((t) => t.tutorialId === 19)
    assert.ok(item)
    assert.equal(item.comments.length, 2)
    assert.deepEqual(
      item.comments.map((c) => c.userId),
      [6, 3],
      'updated_at 倒序',
    )
    assert.deepEqual(Object.keys(item.comments[0]).sort(), ['comment', 'displayName', 'updatedAt', 'userId'])
    assert.equal(item.comments[0].displayName, '仓库·演示用户')
    assert.equal(item.comments[1].displayName, '销售·演示用户')
    assert.equal(item.comments[0].comment, '盘点差异处理那一步讲错了，实际要先审核盘点单')
    assert.equal(item.comments[0].updatedAt, '2026-08-20 15:20:00')
  })
})

test('coverage：种子矩阵 12 启用分类 + 8 模块聚合，0 篇标空白区（UI-ELEM-04/AC-FN-14）', () => {
  const { matrix, modules } = buildCoverage()
  assert.deepEqual(
    matrix.map((cell) => [cell.categoryId, cell.name, cell.erpModule, cell.tutorialCount, cell.isBlank]),
    SEED_MATRIX.map(([id, name, erpModule, count]) => [id, name, erpModule, count, count === 0]),
  )
  assert.ok(matrix.every((cell) => cell.parentId === null), '种子无二级分类')
  assert.deepEqual(
    modules.map((m) => [m.erpModule, m.moduleName, m.categoryCount, m.tutorialCount, m.isBlank]),
    [
      ['sales', '销售管理', 1, 4, false],
      ['project', '项目管理', 1, 2, false],
      ['file', '文件管理', 1, 1, false],
      ['produce', '生产制造', 1, 3, false],
      ['purchase', '采购管理', 1, 3, false],
      ['inventory', '库存管理', 1, 2, false],
      ['hrFinance', '人事财务', 1, 1, false],
      ['system', '系统设置', 1, 0, true],
    ],
    '无模块映射的 4 个通用分类不进 modules（种子口径每模块 1 个一级分类）'
  )
})

test('coverage：停用分类不入矩阵与 modules（AC-RULE-06/07、AC-EG-14 口径）', () => {
  withRollback((db) => {
    db.exec("UPDATE categories SET status = 'disabled' WHERE id = 1")
    const { matrix, modules } = buildCoverage()
    assert.equal(matrix.length, 11)
    assert.ok(!matrix.some((cell) => cell.categoryId === 1))
    assert.ok(!modules.some((m) => m.erpModule === 'sales'))
  })
})

test('coverage：一级计数含子分类汇总，模块数=启用分类计数之和（二级分类场景）', () => {
  withRollback((db) => {
    db.exec(
      `INSERT INTO categories (id, name, parent_id, sort, status, erp_module)
       VALUES (13, '销售订单', 1, 99, 'enabled', 'sales')`
    )
    db.exec('UPDATE tutorials SET category_id = 13 WHERE id = 4')
    const { matrix, modules } = buildCoverage()
    const parent = matrix.find((cell) => cell.categoryId === 1)
    const child = matrix.find((cell) => cell.categoryId === 13)
    assert.equal(parent?.tutorialCount, 4, '3 篇自留 + 1 篇下沉子分类，汇总不变')
    assert.equal(child?.tutorialCount, 1)
    assert.equal(child?.parentId, 1)
    assert.equal(child?.isBlank, false)
    const sales = modules.find((m) => m.erpModule === 'sales')
    assert.deepEqual(
      sales && [sales.categoryCount, sales.tutorialCount, sales.isBlank],
      [2, 5, false],
      '矩阵行求和口径'
    )
  })
})

test('空库空态（AC-EG-12）：清空 tutorials/favorites 后三端点 200 且 0/null/[] 不报错', () => {
  withRollback((db) => {
    db.exec('DELETE FROM favorites')
    db.exec('DELETE FROM tutorials')
    assert.deepEqual(buildOverview(), {
      publishedCount: 0,
      totalViewCount: 0,
      totalFavCount: 0,
      avgHelpfulRate: null,
      topViewed: [],
    })
    assert.deepEqual(buildFeedbackAnalysis(), { list: [] })
    const { matrix, modules } = buildCoverage()
    assert.equal(matrix.length, 12, '分类仍在：计数全 0 全空白')
    assert.ok(matrix.every((cell) => cell.tutorialCount === 0 && cell.isBlank))
    assert.equal(modules.length, 8)
    assert.ok(modules.every((m) => m.tutorialCount === 0 && m.isBlank))
  })
})

test('HTTP 门卫与只读同视图：未登录 401 / user 403 / operator=admin（AC-RULE-22/23、契约失败场景表）', async () => {
  const app = express()
  app.use(express.json())
  app.use('/api/stats', statsRouter)
  app.use(errorHandler)
  const server = app.listen(0)
  const adminToken = issueToken(1)
  const operatorToken = issueToken(2)
  const userToken = issueToken(3)
  try {
    const { port } = server.address() as AddressInfo
    const base = `http://localhost:${port}`
    const get = (path: string, token?: string): Promise<Response> =>
      fetch(`${base}/api/stats${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} })

    const unauth = await get('/overview')
    assert.equal(unauth.status, 401)
    assert.deepEqual(await unauth.json(), { code: 401, message: '未登录或登录已失效', data: null })

    const forbidden = await get('/feedback', userToken)
    assert.equal(forbidden.status, 403)
    assert.deepEqual(await forbidden.json(), { code: 403, message: '无权限执行该操作', data: null })

    for (const path of ['/overview', '/feedback', '/coverage'] as const) {
      const asAdmin = await get(path, adminToken)
      assert.equal(asAdmin.status, 200)
      const adminBody = await asAdmin.json()
      assert.equal(adminBody.code, 0)
      assert.equal(adminBody.message, 'ok')
      const asOperator = await get(path, operatorToken)
      assert.equal(asOperator.status, 200)
      assert.deepEqual(await asOperator.json(), adminBody, `operator 只读同数据：${path}`)
    }
  } finally {
    revokeToken(adminToken)
    revokeToken(operatorToken)
    revokeToken(userToken)
    server.closeAllConnections?.()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

after(() => {
  closeDb()
})
