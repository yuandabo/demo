/**
 * 教程查询 service + 路由单测（IT-02/BE-02 阶段 1）
 * oracle：真实种子数据（seed.ts 固定值）——公开可见池 19 篇（18 已发布 + #19 回审旧版在线）、
 * #20/#21 首次待审、#22 草稿带驳回原因、#23 纯草稿、#24 已下架；不从实现反推。
 * service 用例不触碰 server/erp.db（:memory: 独立建库）；HTTP 用例按计划挂载路径自挂临时服务器
 * （routes/index.ts 挂载行由主 agent 落盘），断言值均取种子稳定口径（对 system.reset 幂等）。
 */
import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { once } from 'node:events'
import { DatabaseSync } from 'node:sqlite'
import express from 'express'
import type { AddressInfo } from 'node:net'

import { insertSeed } from './seed.js'
import tutorialsRouter from './routes/tutorials.js'
import {
  getTutorialEditView,
  getVisibleTutorial,
  incrementView,
  listTutorials,
  loadMyTutorialState,
  shareTutorial,
} from './routes/tutorials.js'
import type { TutorialFilters } from './routes/tutorials.js'
import { HttpError, errorHandler } from './response.js'
import { findUserByUsername, issueToken } from './auth.js'
import { closeDb, openDb } from './db.js'

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

/** 列表 filters 便捷构造（默认公开口径 + latest + 第 1 页 10 条） */
function filters(over: Partial<TutorialFilters> = {}): TutorialFilters {
  return { sort: 'latest', page: 1, pageSize: 20, ...over }
}

function idsOf(page: { list: Array<{ id: number }> }): number[] {
  return page.list.map((c) => c.id)
}

// ── service 层：列表双口径 / 检索 / 排序 / 分页 ─────────────────────────

test('公开列表：可见池 19 篇（18 已发布 + #19 回审旧版），latest 序置顶最前，#20-24 不可见（AC-RULE-01~04）', () => {
  const db = buildDb()
  try {
    const page = listTutorials(db, filters())
    assert.equal(page.total, 19)
    assert.deepEqual(idsOf(page), [3, 19, 4, 6, 2, 15, 18, 17, 9, 11, 7, 1, 16, 8, 10, 12, 13, 14, 5])
    assert.ok(!idsOf(page).some((id) => id >= 20), '首次待审/草稿/已下架不进前台列表')
  } finally {
    db.close()
  }
})

test('公开卡片摘要读线上快照并回退（CHANGE-3）：#19 读 published_summary 旧版文案', () => {
  const db = buildDb()
  try {
    const card19 = listTutorials(db, filters()).list.find((c) => c.id === 19)
    assert.ok(card19)
    assert.equal(card19.summary, '订单录入四步走：选客户、填明细、过校验、提交打印，附价格与信用拦截处理办法。')
    assert.deepEqual(card19.tags, ['订单', '录入'])
    assert.equal(card19.categoryName, '销售管理')
  } finally {
    db.close()
  }
})

test('sort=hot：置顶优先后按浏览量倒序（AC-RULE-17）', () => {
  const db = buildDb()
  try {
    const page = listTutorials(db, filters({ sort: 'hot', pageSize: 7 }))
    assert.deepEqual(idsOf(page), [3, 1, 2, 5, 6, 19, 4])
  } finally {
    db.close()
  }
})

test('keyword 分别命中标题/摘要/标签三字段（AC-RULE-02 检索范围=可见池）', () => {
  const db = buildDb()
  try {
    assert.deepEqual(idsOf(listTutorials(db, filters({ keyword: '扫码报工' }))), [2], '命中标题')
    assert.deepEqual(idsOf(listTutorials(db, filters({ keyword: '月末对账' }))), [9], '命中摘要')
    assert.deepEqual(idsOf(listTutorials(db, filters({ keyword: 'FAQ' }))), [17], '命中标签')
    assert.equal(listTutorials(db, filters({ keyword: 'IQC' })).total, 0, '仅已下架 #24 命中 → 公开不返回')
  } finally {
    db.close()
  }
})

test('tag 逗号多值交集：单值精确命中，多值须同时含全部标签，交集为空返回空列表（UI-IXD-02）', () => {
  const db = buildDb()
  try {
    assert.deepEqual(idsOf(listTutorials(db, filters({ tags: ['MRP'] }))), [12])
    assert.deepEqual(idsOf(listTutorials(db, filters({ tags: ['算料', 'BOM'] }))), [3, 11])
    assert.deepEqual(listTutorials(db, filters({ tags: ['MRP', 'BOM'] })), { list: [], total: 0, page: 1, pageSize: 20 })
  } finally {
    db.close()
  }
})

test('top=1 仅返回置顶教程；categoryId 命中子分类且停用分类被公开口径排除（AC-RULE-07）', () => {
  const db = buildDb()
  try {
    assert.deepEqual(idsOf(listTutorials(db, filters({ topOnly: true }))), [3])
    // 造树：cat13=cat1 启用子分类（挂 #5）、cat14=cat1 停用子分类（挂 #14）
    db.prepare(
      `INSERT INTO categories (id, name, parent_id, sort, status, created_at, updated_at)
       VALUES (13, '销售子分类', 1, 13, 'enabled', '2026-08-20 09:00:00', '2026-08-20 09:00:00'),
              (14, '停用子分类', 1, 14, 'disabled', '2026-08-20 09:00:00', '2026-08-20 09:00:00')`
    ).run()
    db.prepare('UPDATE tutorials SET category_id = 13 WHERE id = 5').run()
    db.prepare('UPDATE tutorials SET category_id = 14 WHERE id = 14').run()

    assert.deepEqual(idsOf(listTutorials(db, filters({ categoryId: 13 }))), [5], '子分类自身命中')
    assert.deepEqual(idsOf(listTutorials(db, filters({ categoryId: 1 }))), [19, 4, 5], '命中集含启用子分类、排除停用子分类')
    // 停用一级分类：公开不命中（keyword=MRP 命中 #3 但属停用分类），管理态不受影响
    db.prepare("UPDATE categories SET status = 'disabled' WHERE id = 5").run()
    assert.deepEqual(idsOf(listTutorials(db, filters({ keyword: 'MRP' }))), [17, 12])
    assert.deepEqual(listTutorials(db, filters({ categoryId: 5 })), { list: [], total: 0, page: 1, pageSize: 20 })
    assert.deepEqual(
      idsOf(listTutorials(db, filters({ categoryId: 5, allStates: true }))),
      [3, 24, 7, 8],
      '管理态全状态 + 停用分类仍可筛'
    )
  } finally {
    db.close()
  }
})

test('分页：page/pageSize 生效，越界页返回空列表且 total 不变', () => {
  const db = buildDb()
  try {
    assert.deepEqual(idsOf(listTutorials(db, filters({ pageSize: 1 }))), [3])
    assert.deepEqual(idsOf(listTutorials(db, filters({ pageSize: 1, page: 2 }))), [19])
    const beyond = listTutorials(db, filters({ pageSize: 10, page: 99 }))
    assert.deepEqual(beyond.list, [])
    assert.equal(beyond.total, 19)
  } finally {
    db.close()
  }
})

test('管理态 all=1：四态齐全 + 扩展列（rejectReason/submitCount/authorName/hasOnlineVersion/lastOfflineAt），summary 读当前编辑值', () => {
  const db = buildDb()
  try {
    const page = listTutorials(db, filters({ allStates: true, pageSize: 30 }))
    assert.equal(page.total, 24)
    assert.deepEqual(
      new Set(page.list.map((c) => (c as { status: string }).status)),
      new Set(['draft', 'pending', 'published', 'offline'])
    )
    const byId = new Map(page.list.map((c) => [c.id, c as unknown as Record<string, unknown>]))
    assert.equal(byId.get(22)?.rejectReason, '第3步截图含未发布界面，请替换')
    assert.equal(byId.get(19)?.submitCount, 2)
    assert.equal(
      byId.get(19)?.summary,
      '覆盖订单录入必填校验、价格与信用拦截、提交后修改规则；v2 替换旧版截图并新增委外件场景说明。',
      '管理口径读工作列摘要（非旧版快照）'
    )
    assert.equal(byId.get(24)?.authorName, '系统管理员')
    assert.equal(byId.get(24)?.lastOfflineAt, '2026-08-06 16:50:00')
    assert.equal(byId.get(19)?.hasOnlineVersion, true, '回审旧版在线')
    assert.equal(byId.get(20)?.hasOnlineVersion, false, '首次提审无线上版本')
    assert.ok(byId.get(20)?.createdAt, '管理态附 createdAt')
  } finally {
    db.close()
  }
})

test('管理态 status 过滤优先于 all，keyword 命中范围随口径放大到全态', () => {
  const db = buildDb()
  try {
    assert.deepEqual(idsOf(listTutorials(db, filters({ status: 'pending' }))), [21, 20, 19])
    assert.deepEqual(
      idsOf(listTutorials(db, filters({ status: 'pending', allStates: true }))),
      [21, 20, 19],
      'status 与 all 同传以 status 为准'
    )
    assert.deepEqual(idsOf(listTutorials(db, filters({ keyword: '报工' }))), [2], '公开口径首次待审 #20 不命中')
    assert.deepEqual(idsOf(listTutorials(db, filters({ keyword: '报工', allStates: true }))), [20, 2], '管理态全态命中')
  } finally {
    db.close()
  }
})

// ── service 层：详情快照 / 上下篇 / 关联 / 计数 ─────────────────────────

test('详情快照：#19 回审期间读旧版 content/summary；上下篇按列表序取相邻（AC-FN-10/19）', () => {
  const db = buildDb()
  try {
    const result = getVisibleTutorial(db, 19)
    assert.equal(result.kind, 'ok')
    if (result.kind !== 'ok') return
    const d = result.detail
    assert.equal(d.status, 'pending')
    assert.equal(d.summary, '订单录入四步走：选客户、填明细、过校验、提交打印，附价格与信用拦截处理办法。')
    assert.ok(d.content.includes('打开【销售-销售订单】点击新增'))
    assert.ok(!d.content.includes('页签'), '不读工作列新内容')
    assert.equal(d.categoryName, '销售管理')
    assert.equal(d.prev, null)
    assert.deepEqual(d.next, { id: 4, title: '销售订单 13 态状态机详解' })
    assert.deepEqual(d.related.map((r) => r.id), [5, 4, 14], '关联=同分类其余可见篇按浏览量倒序')
  } finally {
    db.close()
  }
})

test('详情 #3：published_summary 为空回退工作摘要（CHANGE-3）；置顶篇 prev=null；related 排除本篇', () => {
  const db = buildDb()
  try {
    const result = getVisibleTutorial(db, 3)
    assert.equal(result.kind, 'ok')
    if (result.kind !== 'ok') return
    const d = result.detail
    assert.ok(d.content.startsWith('<h3>第 1 步 · 检查 BOM 完整性</h3>'))
    assert.equal(d.summary, '告别手工 Excel 算料：销售订单驱动 MRP 运算，自动比对库存、在途与安全库存，输出缺料清单与采购建议。')
    assert.equal(d.isTop, 1)
    assert.equal(d.viewCount, 2341, 'service 返回库内值，+1 由路由 incrementView 负责')
    assert.equal(d.prev, null)
    assert.deepEqual(d.next, { id: 7, title: '采购申请到一键下单' })
    assert.deepEqual(d.related.map((r) => r.id), [7, 8])
    assert.equal(d.videoUrl, 'https://cdn.example.com/demo/mrp-calc.mp4', 'videoUrl 原样透传（AC-EG-02 数据侧）')
  } finally {
    db.close()
  }
})

test('详情 404 分支：已下架 #24 → offline + 同类推荐；首次待审/纯草稿/不存在 → invisible（AC-FN-20）', () => {
  const db = buildDb()
  try {
    const offline = getVisibleTutorial(db, 24)
    assert.equal(offline.kind, 'offline')
    if (offline.kind === 'offline') {
      assert.deepEqual(offline.related.map((r) => r.id), [3, 7, 8])
    }
    for (const id of [20, 22, 23, 999]) {
      assert.equal(getVisibleTutorial(db, id).kind, 'invisible', `#${id} 应走 invisible 分支`)
    }
  } finally {
    db.close()
  }
})

test('incrementView：不去重连续 +1；shareTutorial：连续打点 +1 且不可见教程 404 code=40404（AC-RULE-08）', () => {
  const db = buildDb()
  try {
    assert.equal(incrementView(db, 3), 2342)
    assert.equal(incrementView(db, 3), 2343)
    assert.equal(
      (db.prepare('SELECT view_count AS v FROM tutorials WHERE id = 3').get() as { v: number }).v,
      2343,
      '计数更新落库'
    )
    assert.deepEqual(shareTutorial(db, 2), { shareCount: 49 })
    assert.deepEqual(shareTutorial(db, 2), { shareCount: 50 }, '重复调用不去重')
    for (const id of [24, 20, 999]) {
      assert.throws(
        () => shareTutorial(db, id),
        (err: unknown) =>
          err instanceof HttpError && err.status === 404 && err.code === 40404 && err.message === '该教程不存在或暂不可见',
        `share #${id} 应 404/40404`
      )
    }
  } finally {
    db.close()
  }
})

test('loadMyTutorialState：未产生行为时 favorite=false / feedback=null / progress=null，有记录按行返回', () => {
  const db = buildDb()
  try {
    assert.deepEqual(loadMyTutorialState(db, 4, 3), { myFavorite: false, myFeedback: null, myProgress: null })
    db.prepare('INSERT INTO favorites (user_id, tutorial_id) VALUES (4, 3)').run()
    db.prepare('INSERT INTO feedbacks (user_id, tutorial_id, helpful) VALUES (4, 3, 1)').run()
    db.prepare('INSERT INTO histories (user_id, tutorial_id, progress) VALUES (4, 3, 60)').run()
    assert.deepEqual(loadMyTutorialState(db, 4, 3), { myFavorite: true, myFeedback: 1, myProgress: 60 })
  } finally {
    db.close()
  }
})

test('getTutorialEditView：管理口径返回当前编辑值与派生列，不存在返回 null', () => {
  const db = buildDb()
  try {
    assert.equal(getTutorialEditView(db, 999), null)
    const edit = getTutorialEditView(db, 19)
    assert.ok(edit)
    assert.ok(edit.content.includes('页签'), '读工作列新内容')
    assert.ok(!edit.content.includes('打开【销售-销售订单】点击新增'))
    assert.equal(edit.hasOnlineVersion, true)
    assert.equal(edit.lastOfflineAt, null)
    assert.ok(edit.createdAt)
    assert.deepEqual(edit.related, [])
    assert.equal(edit.prev, null)
    assert.equal(edit.next, null)
  } finally {
    db.close()
  }
})

// ── HTTP 层：挂载 / 参数校验 / 鉴权门卫 / 信封（对 system.reset 幂等的稳定断言）──────

let baseUrl = ''
let server: ReturnType<ReturnType<typeof express>['listen']> | undefined

/** 直接签发 DB token（等价登录后取得）；并行 system.reset 可能即刻作废 token，由 withFreshRetry 兜底 */
function loginAs(username: string): string {
  const user = findUserByUsername(username)
  assert.ok(user, `种子账号 ${username} 应存在`)
  return issueToken(user.id)
}

async function call(path: string, token?: string): Promise<Response> {
  const headers: Record<string, string> = {}
  if (token !== undefined) headers.authorization = `Bearer ${token}`
  const method = path.endsWith('/share') ? 'POST' : 'GET'
  return fetch(`${baseUrl}/api/tutorials${path}`, { method, headers })
}

/** 带 token 请求；遇意外 401（并行 reset 清了 token）重签重试一次 */
async function callAs(username: string, path: string): Promise<Response> {
  let res = await call(path, loginAs(username))
  if (res.status === 401) res = await call(path, loginAs(username))
  return res
}

/** 计数快照：HTTP 用例会真实自增 view/share 计数，用后还原，避免污染共享 erp.db 的其他精确断言（stats.test） */
function snapshotCounters(ids: number[]): Map<number, { view: number; share: number }> {
  const db = openDb()
  const snap = new Map<number, { view: number; share: number }>()
  for (const id of ids) {
    const row = db.prepare('SELECT view_count AS view, share_count AS share FROM tutorials WHERE id = ?').get(id) as {
      view: number
      share: number
    }
    snap.set(id, row)
  }
  return snap
}

function restoreCounters(snap: Map<number, { view: number; share: number }>): void {
  const stmt = openDb().prepare('UPDATE tutorials SET view_count = ?, share_count = ? WHERE id = ?')
  for (const [id, c] of snap) stmt.run(c.view, c.share, id)
}

before(async () => {
  openDb()
  server = express().use('/api/tutorials', tutorialsRouter).use(errorHandler).listen(0)
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise((resolve) => server?.close(() => resolve(null)))
  closeDb()
})

test('HTTP 列表：keyword=MRP 公开命中 3 篇可见池；pageSize=101 / status 非枚举 → 400 查询参数不合法', async () => {
  const res = await call('?keyword=MRP&page=1&pageSize=10')
  assert.equal(res.status, 200)
  const body = (await res.json()) as { code: number; data: { list: Array<{ id: number }>; total: number } }
  assert.equal(body.code, 0)
  assert.equal(body.data.total, 3)
  assert.deepEqual(new Set(body.data.list.map((c) => c.id)), new Set([3, 17, 12]))

  for (const q of ['?pageSize=101', '?page=0', '?status=recycled', '?sort=hotter']) {
    const bad = await call(q)
    assert.equal(bad.status, 400, q)
    assert.deepEqual(await bad.json(), { code: 400, message: '查询参数不合法', data: null })
  }
})

test('HTTP 管理门卫：未登录 status/all → 401；user 角色 → 403；admin all=1 四态齐全带扩展列', async () => {
  assert.equal((await call('?status=published')).status, 401)
  assert.equal((await call('?all=1')).status, 401)

  const forbidden = await callAs('sales', '?all=1')
  assert.equal(forbidden.status, 403)
  assert.deepEqual(await forbidden.json(), { code: 403, message: '无权限执行该操作', data: null })

  const res = await callAs('admin', '?all=1&pageSize=30')
  assert.equal(res.status, 200)
  const body = (await res.json()) as {
    data: { list: Array<Record<string, unknown> & { status: string }> }
  }
  const statuses = new Set(body.data.list.map((c) => c.status))
  for (const s of ['draft', 'pending', 'published', 'offline']) {
    assert.ok(statuses.has(s), `管理态应含 ${s}`)
  }
  const sample = body.data.list[0]
  for (const key of ['rejectReason', 'submitCount', 'authorId', 'authorName', 'hasOnlineVersion', 'lastOfflineAt', 'createdAt']) {
    assert.ok(key in sample, `管理卡片应含 ${key}`)
  }
})

test('HTTP 详情：游客可读含 prev/next/related；登录态 my* 非 null；404 两分支 reason 正确（AC-FN-20）', async () => {
  const snap = snapshotCounters([3])
  try {
    const res = await call('/3')
  assert.equal(res.status, 200)
  const body = (await res.json()) as {
    data: Record<string, unknown> & { myFavorite: boolean | null; related: unknown[]; next: { id: number } }
  }
  assert.equal(body.data.myFavorite, null, '游客 my* 为 null')
  assert.deepEqual(body.data.related.map((r) => (r as { id: number }).id), [7, 8])
  assert.equal(body.data.next.id, 7)
  assert.ok(typeof body.data.viewCount === 'number' && body.data.viewCount >= 2342, '返回值已含本次浏览 +1')

  const authed = await callAs('sales', '/3')
  const authedBody = (await authed.json()) as { data: { myFavorite: boolean; myFeedback: number | null; myProgress: number | null } }
  assert.equal(authedBody.data.myFavorite, false, '登录未收藏=false 而非 null')

  const offline = await call('/24')
  assert.equal(offline.status, 404)
  const offlineBody = (await offline.json()) as {
    code: number
    message: string
    data: { reason: string; related: Array<{ id: number; title: string; summary: string; viewCount: number }> }
  }
  assert.equal(offlineBody.code, 404)
  assert.equal(offlineBody.message, '该教程已下架')
  assert.equal(offlineBody.data.reason, 'offline')
  assert.deepEqual(
    offlineBody.data.related.map((r) => r.id),
    [3, 7, 8],
    '同类可见推荐按浏览量倒序'
  )
  assert.ok(offlineBody.data.related.every((r) => r.title && r.summary && r.viewCount >= 1))

  const invisible = await call('/23')
  assert.equal(invisible.status, 404)
  assert.deepEqual(await invisible.json(), { code: 404, message: '该教程不存在或暂不可见', data: { reason: 'invisible' } })
  } finally {
    restoreCounters(snap)
  }
})

test('HTTP 详情管理口径：?all=1 未登录 401 / user 403 / admin 读当前编辑值', async () => {
  assert.equal((await call('/19?all=1')).status, 401)
  assert.equal((await callAs('sales', '/19?all=1')).status, 403)
  const res = await callAs('admin', '/19?all=1')
  assert.equal(res.status, 200)
  const body = (await res.json()) as { data: { content: string; hasOnlineVersion: boolean; viewCount: number } }
  assert.ok(body.data.content.includes('页签'), '管理口径读工作列内容')
  assert.equal(body.data.hasOnlineVersion, true)
})

test('HTTP share：公开打点 shareCount 递增返回数值信封', async () => {
  const snap = snapshotCounters([2])
  try {
    const res = await call('/2/share')
    assert.equal(res.status, 200)
    const body = (await res.json()) as { code: number; data: { shareCount: number } }
    assert.equal(body.code, 0)
    assert.ok(body.data.shareCount >= 49, `shareCount 应 ≥ 种子 48+1，实际 ${body.data.shareCount}`)
  } finally {
    restoreCounters(snap)
  }
})
