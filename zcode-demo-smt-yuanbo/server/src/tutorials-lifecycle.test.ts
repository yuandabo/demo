/**
 * 教程上下架/复制/置顶单测（IT-02/BE-05 阶段 1）
 * oracle：真实种子数据——#3 已发布置顶（view 2341/fav 187/helpful 96:8/share 39）、#12 已发布、
 * #20 首次 pending、#23 纯草稿、#24 已下架（last_offline_at=2026-08-06 16:50:00，view 1204/fav 73）。
 * service 用例 :memory: 独立建库精确断言；HTTP 用例自建数据走完整生命周期链后 SQL 清理。
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
  copyTutorial,
  getVisibleTutorial,
  listTutorials,
  offlineTutorial,
  republishTutorial,
  setTopAndSort,
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

function buildDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  const sqlDir = path.resolve(import.meta.dirname, '../../docs/design/sql')
  for (const file of DDL_FILES) {
    db.exec(readFileSync(path.join(sqlDir, file), 'utf8'))
  }
  insertSeed(db)
  return db
}

function row(db: DatabaseSync, id: number): Record<string, unknown> {
  return db.prepare('SELECT * FROM tutorials WHERE id = ?').get(id) as Record<string, unknown>
}

function expectError(fn: () => unknown, status: number, message: string): void {
  assert.throws(
    fn,
    (err: unknown) => err instanceof HttpError && err.status === status && err.message === message,
    `应抛 ${status} "${message}"`
  )
}

function filters(over: Partial<TutorialFilters> = {}): TutorialFilters {
  return { sort: 'latest', page: 1, pageSize: 30, ...over }
}

function idsOf(page: { list: Array<{ id: number }> }): number[] {
  return page.list.map((c) => c.id)
}

// ── service 层：offlineTutorial 下架 ─────────────────────────────────

test('offlineTutorial 已发布下架：offline + last_offline_at 留痕，前台即刻不可见，计数保留（AC-OP-03/AC-RULE-04）', () => {
  const db = buildDb()
  try {
    const result = offlineTutorial(db, 12)
    assert.equal(result.status, 'offline')
    assert.ok(result.lastOfflineAt, '下架时间戳留痕')

    const stored = row(db, 12)
    assert.equal(stored.status, 'offline')
    assert.ok(stored.last_offline_at)
    assert.equal(stored.view_count, 1298, '浏览计数保留')
    assert.equal(stored.fav_count, 84, '收藏计数保留')

    assert.equal(getVisibleTutorial(db, 12).kind, 'offline', '详情走已下架提示页分支')
    assert.ok(!idsOf(listTutorials(db, filters())).includes(12), '列表下一请求即不返回')
  } finally {
    db.close()
  }
})

test('offlineTutorial 非已发布 409：pending/draft/offline 均拒绝且状态不变；404（AC-EG-09 显式验收）', () => {
  const db = buildDb()
  try {
    for (const id of [20, 23, 24]) {
      const before = String(row(db, id).status)
      expectError(() => offlineTutorial(db, id), 409, '该教程状态已变化，请刷新')
      assert.equal(row(db, id).status, before, `#${id} 状态保持不变`)
    }
    expectError(() => offlineTutorial(db, 999), 404, '教程不存在')
  } finally {
    db.close()
  }
})

// ── service 层：republishTutorial 重新发布 ────────────────────────────

test('republishTutorial 已下架重发布：published + 清 last_offline_at，不进审核、计数延续（AC-FN-11）', () => {
  const db = buildDb()
  try {
    const result = republishTutorial(db, 24)
    assert.equal(result.status, 'published')
    assert.equal(result.viewCount, 1204, '计数延续下架前数值')
    assert.equal(result.favCount, 73)

    const stored = row(db, 24)
    assert.equal(stored.status, 'published')
    assert.equal(stored.last_offline_at, null, '清除下架时间戳')
    assert.equal(getVisibleTutorial(db, 24).kind, 'ok', '前台下一请求即返回')
    assert.ok(idsOf(listTutorials(db, filters())).includes(24), '无 pending 中间态直接可见')
  } finally {
    db.close()
  }
})

test('republishTutorial 非已下架 409：published/pending/draft 均拒绝；offline→republish 链路收尾干净', () => {
  const db = buildDb()
  try {
    for (const id of [1, 20, 23]) {
      const before = String(row(db, id).status)
      expectError(() => republishTutorial(db, id), 409, '该教程状态已变化，请刷新')
      assert.equal(row(db, id).status, before)
    }
    // 链路验证：下架后重发布，last_offline_at=NULL 且 status=published（AC-05 自测持久化口径）
    offlineTutorial(db, 12)
    republishTutorial(db, 12)
    const restored = row(db, 12)
    assert.equal(restored.status, 'published')
    assert.equal(restored.last_offline_at, null)
  } finally {
    db.close()
  }
})

// ── service 层：copyTutorial 复制 ────────────────────────────────────

test('copyTutorial 已发布源：新草稿 +（副本）标题、六类计数与 submit_count 清零、快照/驳回原因清空、源不动（AC-FN-12/AC-RULE-14）', () => {
  const db = buildDb()
  try {
    const before = row(db, 3)
    const copy = copyTutorial(db, 3, 2)
    assert.ok(copy.id >= 25, '新记录 id')
    assert.equal(copy.title, `${before.title}（副本）`)
    assert.equal(copy.status, 'draft')
    assert.equal(copy.viewCount, 0)
    assert.equal(copy.favCount, 0)
    assert.equal(copy.helpfulYes, 0)
    assert.equal(copy.helpfulNo, 0)
    assert.equal(copy.shareCount, 0)
    assert.ok(copy.createdAt)

    const stored = row(db, copy.id)
    assert.equal(stored.author_id, 2, '作者=复制操作人')
    assert.equal(stored.submit_count, 0, '提审次数清零')
    assert.equal(stored.published_content, null, '纯草稿不可见')
    assert.equal(stored.published_summary, null)
    assert.equal(stored.published_at, null)
    assert.equal(stored.reject_reason, null)
    assert.equal(stored.is_top, 0, '置顶不随源')
    assert.equal(stored.sort, 100, '排序走缺省')
    assert.equal(stored.content, before.content, '正文沿用源内容')
    assert.equal(stored.tags, before.tags)

    // 源记录完全不动
    const after = row(db, 3)
    for (const key of ['status', 'title', 'view_count', 'fav_count', 'helpful_yes', 'helpful_no', 'share_count', 'submit_count', 'is_top']) {
      assert.equal(after[key], before[key], `源 ${key} 不变`)
    }
    assert.equal(getVisibleTutorial(db, copy.id).kind, 'invisible', '副本纯草稿前台不可见')
  } finally {
    db.close()
  }
})

test('copyTutorial 标题截断：97 字源→新标题恰 100 字（96+4）；96 字内不截断（AC-RULE-14）', () => {
  const db = buildDb()
  try {
    db.prepare('UPDATE tutorials SET title = ? WHERE id = 23').run('长'.repeat(97))
    const truncated = copyTutorial(db, 23, 2)
    assert.equal(truncated.title.length, 100)
    assert.ok(truncated.title.endsWith('（副本）'))
    assert.equal(truncated.title.slice(0, 96), '长'.repeat(96))

    db.prepare('UPDATE tutorials SET title = ? WHERE id = 22').run('短'.repeat(96))
    const kept = copyTutorial(db, 22, 1)
    assert.equal(kept.title, '短'.repeat(96) + '（副本）', '96 字源不截断直接拼接')
  } finally {
    db.close()
  }
})

test('copyTutorial 任意状态可复制：draft/pending/offline 均生成新草稿；404', () => {
  const db = buildDb()
  try {
    for (const id of [23, 20, 24]) {
      const copy = copyTutorial(db, id, 1)
      assert.equal(copy.status, 'draft')
      assert.ok(copy.title.endsWith('（副本）'))
    }
    expectError(() => copyTutorial(db, 999, 1), 404, '教程不存在')
  } finally {
    db.close()
  }
})

// ── service 层：setTopAndSort 置顶排序 ───────────────────────────────

test('setTopAndSort 已发布置顶：isTop=1 放行且列表排最前；sort 调整生效（AC-RULE-17）', () => {
  const db = buildDb()
  try {
    const result = setTopAndSort(db, 1, { isTop: 1, sort: 1 })
    assert.deepEqual(result, { id: 1, isTop: 1, sort: 1, status: 'published' })
    assert.equal(idsOf(listTutorials(db, filters()))[0], 1, '置顶+最小 sort 排最前（越过种子置顶 #3）')

    const onlySort = setTopAndSort(db, 2, { isTop: 1 })
    assert.equal(onlySort.sort, 90, 'sort 缺省保持原值')
  } finally {
    db.close()
  }
})

test('setTopAndSort 状态与参数校验：draft 置顶 409；取消置顶/调 sort 不限状态；参数不合法 400', () => {
  const db = buildDb()
  try {
    expectError(() => setTopAndSort(db, 23, { isTop: 1 }), 409, '仅已发布教程可置顶')
    expectError(() => setTopAndSort(db, 20, { isTop: 1 }), 409, '仅已发布教程可置顶')
    assert.equal(row(db, 23).is_top, 0)

    // 取消置顶与调 sort 在 draft 状态放行（后台列表用途）
    assert.equal(setTopAndSort(db, 23, { isTop: 0 }).isTop, 0)
    assert.deepEqual(setTopAndSort(db, 23, { isTop: 0, sort: 5 }), { id: 23, isTop: 0, sort: 5, status: 'draft' })

    for (const bad of [{}, { isTop: 2 }, { isTop: '1' }, { isTop: 1, sort: 10000 }, { isTop: 1, sort: -1 }, { isTop: 1, sort: '50' }]) {
      expectError(() => setTopAndSort(db, 1, bad), 400, 'isTop 必须为 0 或 1')
    }
    expectError(() => setTopAndSort(db, 999, { isTop: 0 }), 404, '教程不存在')
  } finally {
    db.close()
  }
})

// ── HTTP 层：权限矩阵 + 全生命周期链（自建数据 SQL 清理）────────────────

let baseUrl = ''
let server: ReturnType<ReturnType<typeof express>['listen']> | undefined

function loginAs(username: string): string {
  const user = findUserByUsername(username)
  assert.ok(user, `种子账号 ${username} 应存在`)
  return issueToken(user.id)
}

async function call(method: string, path: string, body?: unknown, token?: string): Promise<Response> {
  const headers: Record<string, string> = {}
  if (token !== undefined) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'
  return fetch(`${baseUrl}/api/tutorials${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function callAs(username: string, method: string, path: string, body?: unknown): Promise<Response> {
  let res = await call(method, path, body, loginAs(username))
  if (res.status === 401) res = await call(method, path, body, loginAs(username))
  return res
}

before(async () => {
  openDb()
  server = express()
    .use(express.json())
    .use('/api/tutorials', tutorialsRouter)
    .use(errorHandler)
    .listen(0)
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise((resolve) => server?.close(() => resolve(null)))
  closeDb()
})

test('HTTP 权限矩阵：user 四端点全 403；operator 仅 copy/top 放行（offline/republish 403）；未登录 401', async () => {
  for (const [method, path, body] of [
    ['POST', '/12/offline', {}],
    ['POST', '/12/republish', {}],
    ['POST', '/3/copy', {}],
    ['PUT', '/3/top', { isTop: 0 }],
  ] as const) {
    const denied = await callAs('sales', method, path, body)
    assert.equal(denied.status, 403, `user ${path} 403`)
  }
  const opOffline = await callAs('operator', 'POST', '/12/offline', {})
  assert.equal(opOffline.status, 403)
  assert.deepEqual(await opOffline.json(), { code: 403, message: '无权限执行该操作', data: null })
  const opRepublish = await callAs('operator', 'POST', '/24/republish', {})
  assert.equal(opRepublish.status, 403)

  const unauth = await call('POST', '/12/offline', {})
  assert.equal(unauth.status, 401)
  // operator 调 offline 失败后种子状态不变
  const st = openDb().prepare('SELECT status FROM tutorials WHERE id = 12').get() as { status: string }
  assert.equal(st.status, 'published')
})

test('HTTP 全生命周期链：建→提审→过审→下架→重发布→复制→置顶（自建数据 SQL 清理）', async () => {
  const created = await callAs('operator', 'POST', '/', {
    title: '生命周期回归',
    categoryId: 1,
    summary: '摘要',
    content: '<p>正文</p>',
  })
  const id = ((await created.json()) as { data: { id: number } }).data.id
  try {
    await callAs('operator', 'POST', `/${id}/submit`, {})
    await callAs('admin', 'POST', `/${id}/review`, { action: 'approve' })

    const offline = await callAs('admin', 'POST', `/${id}/offline`, {})
    assert.equal(offline.status, 200)
    const offlineBody = (await offline.json()) as { data: { id: number; status: string; lastOfflineAt: string } }
    assert.equal(offlineBody.data.status, 'offline')
    assert.ok(offlineBody.data.lastOfflineAt)
    const detail = await call('GET', `/${id}`)
    assert.equal(detail.status, 404)
    assert.equal(((await detail.json()) as { message: string }).message, '该教程已下架')

    const republish = await callAs('admin', 'POST', `/${id}/republish`, {})
    const republishBody = (await republish.json()) as { data: { status: string; viewCount: number; favCount: number } }
    assert.equal(republishBody.data.status, 'published')
    assert.equal(republishBody.data.viewCount, 0, '计数延续（新建源计数 0）')

    const copy = await callAs('operator', 'POST', `/${id}/copy`, {})
    assert.equal(copy.status, 200)
    const copyBody = (await copy.json()) as { data: { title: string; status: string; shareCount: number } }
    assert.equal(copyBody.data.title, '生命周期回归（副本）')
    assert.equal(copyBody.data.status, 'draft')
    assert.equal(copyBody.data.shareCount, 0)

    const top = await callAs('operator', 'PUT', `/${id}/top`, { isTop: 1, sort: 1 })
    assert.deepEqual(((await top.json()) as { data: unknown }).data, { id, isTop: 1, sort: 1, status: 'published' })
  } finally {
    openDb().prepare("DELETE FROM tutorials WHERE title IN ('生命周期回归', '生命周期回归（副本）')").run()
  }
})
