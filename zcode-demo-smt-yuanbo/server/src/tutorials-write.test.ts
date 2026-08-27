/**
 * 教程写入 service + 路由单测（IT-02/BE-03 阶段 1）
 * oracle：真实种子数据（seed.ts 固定值）——#1-18 已发布、#19 回审 pending（旧版快照在线）、
 * #20/#21 首次 pending、#22 草稿带驳回原因、#23 纯草稿（operator 名下）、#24 已下架（快照保留）。
 * service 用例 :memory: 独立建库精确断言；HTTP 用例仅覆盖门卫/信封/乐观锁，
 * 自建数据自清理、触碰的种子行快照还原，不污染共享 erp.db 的其他精确断言。
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
import { createTutorial, deleteTutorial, getVisibleTutorial, updateTutorial } from './routes/tutorials.js'
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

function row(db: DatabaseSync, id: number): Record<string, unknown> {
  return db.prepare('SELECT * FROM tutorials WHERE id = ?').get(id) as Record<string, unknown>
}

/** 断言 HttpError 的 status/message（code 默认与 status 一致） */
function expectError(fn: () => unknown, status: number, message: string): void {
  assert.throws(
    fn,
    (err: unknown) => err instanceof HttpError && err.status === status && err.message === message,
    `应抛 ${status} "${message}"`
  )
}

// ── service 层：createTutorial 新建即草稿 ─────────────────────────────

test('createTutorial 最小入参：创建即草稿，空摘要/正文落空串，计数/置顶/快照全缺省（AC-OP-05）', () => {
  const db = buildDb()
  try {
    const created = createTutorial(db, { title: '并发回归标题', categoryId: 1 }, 2)
    assert.equal(created.status, 'draft')
    assert.ok(created.id >= 25)
    assert.ok(created.createdAt && created.updatedAt)
    const stored = row(db, created.id)
    assert.equal(stored.author_id, 2)
    assert.equal(stored.summary, '')
    assert.equal(stored.content, '')
    assert.equal(stored.tags, '[]')
    assert.equal(stored.video_url, null)
    assert.equal(stored.is_top, 0)
    assert.equal(stored.sort, 100)
    for (const col of ['view_count', 'fav_count', 'helpful_yes', 'helpful_no', 'share_count', 'submit_count']) {
      assert.equal(stored[col], 0, `${col} 缺省 0`)
    }
    for (const col of ['reject_reason', 'published_content', 'published_summary', 'published_at', 'last_offline_at']) {
      assert.equal(stored[col], null, `${col} 缺省 NULL`)
    }
  } finally {
    db.close()
  }
})

test('createTutorial 全字段：tags JSON 序列化落库、videoUrl 外链、author_id=当前用户', () => {
  const db = buildDb()
  try {
    const created = createTutorial(
      db,
      {
        title: '  销售订单 13 态状态说明  ',
        categoryId: 1,
        summary: '逐条讲解。',
        content: '<h2>一</h2>',
        videoUrl: ' https://cdn.example.com/a.mp4 ',
        tags: ['销售订单', '状态'],
      },
      1
    )
    assert.equal(created.title, '销售订单 13 态状态说明', '标题 trim 落库')
    const stored = row(db, created.id)
    assert.equal(stored.tags, '["销售订单","状态"]')
    assert.equal(stored.video_url, 'https://cdn.example.com/a.mp4')
    assert.equal(stored.author_id, 1)
  } finally {
    db.close()
  }
})

test('createTutorial 校验矩阵：标题/摘要/标签越界与分类不存在/停用（AC-RULE-18 长度阻断保存草稿）', () => {
  const db = buildDb()
  try {
    expectError(() => createTutorial(db, { categoryId: 1 }, 2), 400, '请填写标题')
    expectError(() => createTutorial(db, { title: '   ', categoryId: 1 }, 2), 400, '请填写标题')
    expectError(() => createTutorial(db, { title: 'a'.repeat(101), categoryId: 1 }, 2), 400, '标题不超过 100 字')
    expectError(
      () => createTutorial(db, { title: 't', categoryId: 1, summary: 's'.repeat(201) }, 2),
      400,
      '摘要不超过 200 字'
    )
    expectError(
      () => createTutorial(db, { title: 't', categoryId: 1, tags: ['1', '2', '3', '4', '5', '6'] }, 2),
      400,
      '标签最多 5 个'
    )
    expectError(() => createTutorial(db, { title: 't', categoryId: 999 }, 2), 404, '所属分类不存在')
    expectError(() => createTutorial(db, { title: 't', categoryId: '1' }, 2), 404, '所属分类不存在')

    db.prepare("UPDATE categories SET status = 'disabled' WHERE id = 1").run()
    expectError(
      () => createTutorial(db, { title: 't', categoryId: 1 }, 2),
      409,
      '所属分类已停用，请选择启用的分类'
    )
  } finally {
    db.close()
  }
})

// ── service 层：updateTutorial 保存分流 + 乐观锁 ──────────────────────

test('updateTutorial 草稿保存：仍 draft 可反复覆盖，快照列不被触碰（AC-OP-05）', () => {
  const db = buildDb()
  try {
    const first = updateTutorial(db, 23, { title: '里程碑延期预警设置 v2', summary: '改', content: '<p>新</p>' })
    assert.equal(first.status, 'draft')
    const second = updateTutorial(db, 23, { title: '里程碑延期预警设置 v3' })
    assert.equal(second.status, 'draft')
    const stored = row(db, 23)
    assert.equal(stored.title, '里程碑延期预警设置 v3')
    assert.equal(stored.summary, '改', '不传字段保持原值')
    assert.equal(stored.published_content, null, '纯草稿快照列保持 NULL')
  } finally {
    db.close()
  }
})

test('updateTutorial 已发布保存：editResubmit 回审 pending，前台旧版快照不断供（AC-FN-10）', () => {
  const db = buildDb()
  try {
    const before = row(db, 4)
    const result = updateTutorial(db, 4, { content: '<p>新版正文</p>', summary: '新版摘要' })
    assert.equal(result.status, 'pending')
    const stored = row(db, 4)
    assert.equal(stored.published_content, before.published_content, '快照列不动')
    assert.equal(stored.published_summary, before.published_summary)
    assert.equal(stored.status, 'pending')

    const visible = getVisibleTutorial(db, 4)
    assert.equal(visible.kind, 'ok')
    if (visible.kind === 'ok') {
      assert.equal(visible.detail.content, before.published_content, '前台详情继续读旧版正文（快照）')
      // #4 种子无 published_summary（CHANGE-3：无快照摘要回退工作列），摘要读新编辑值属设计行为
      assert.equal(visible.detail.summary, '新版摘要')
    }
  } finally {
    db.close()
  }
})

test('updateTutorial 已下架保存：回审 pending 且前台维持不可见（AC-EG-18 规则④）', () => {
  const db = buildDb()
  try {
    const before = row(db, 24)
    const result = updateTutorial(db, 24, { title: '来料检验操作指南（v2）' })
    assert.equal(result.status, 'pending')
    const stored = row(db, 24)
    assert.equal(stored.last_offline_at, before.last_offline_at, 'last_offline_at 保持，回审期间不可见依据')
    assert.equal(getVisibleTutorial(db, 24).kind, 'invisible')
  } finally {
    db.close()
  }
})

test('updateTutorial 待审核保存：内容覆盖、状态保持 pending（工程兜底）', () => {
  const db = buildDb()
  try {
    const result = updateTutorial(db, 20, { content: '<p>覆盖后的待审内容</p>' })
    assert.equal(result.status, 'pending')
    assert.equal(row(db, 20).content, '<p>覆盖后的待审内容</p>')
  } finally {
    db.close()
  }
})

test('updateTutorial 乐观锁：过期 baseUpdatedAt 409 覆盖告知；匹配/缺省放行（AC-EG-05）', () => {
  const db = buildDb()
  try {
    const current = row(db, 23)
    expectError(
      () => updateTutorial(db, 23, { title: 'v2', baseUpdatedAt: '2000-01-01 00:00:00' }),
      409,
      '他人已保存新版本，请刷新后合并'
    )
    assert.equal(row(db, 23).title, current.title, '409 后内容不被覆盖')

    const saved = updateTutorial(db, 23, { title: 'v2', baseUpdatedAt: String(current.updated_at) })
    assert.equal(saved.status, 'draft')
    const again = updateTutorial(db, 23, { title: 'v3' })
    assert.equal(row(db, 23).title, 'v3')
    assert.equal(again.id, 23)
  } finally {
    db.close()
  }
})

test('updateTutorial 字段级更新：videoUrl null 清除外链、tags 覆盖、分类切换校验', () => {
  const db = buildDb()
  try {
    const created = createTutorial(db, { title: '外链教程', categoryId: 1, videoUrl: 'https://x.mp4', tags: ['a'] }, 2)
    updateTutorial(db, created.id, { videoUrl: null, tags: ['b', 'c'], categoryId: 2 })
    const stored = row(db, created.id)
    assert.equal(stored.video_url, null, '传 null 清除外链')
    assert.equal(stored.tags, '["b","c"]')
    assert.equal(stored.category_id, 2)

    expectError(() => updateTutorial(db, created.id, { categoryId: 999 }), 404, '所属分类不存在')
    db.prepare("UPDATE categories SET status = 'disabled' WHERE id = 3").run()
    expectError(
      () => updateTutorial(db, created.id, { categoryId: 3 }),
      409,
      '所属分类已停用，请选择启用的分类'
    )
    expectError(() => updateTutorial(db, 999, { title: 'x' }), 404, '教程不存在')
  } finally {
    db.close()
  }
})

// ── service 层：deleteTutorial 纯草稿删除保护 ─────────────────────────

test('deleteTutorial 删除保护：存在线上过审版本一律 403（含已发布/已下架/回审旧版在线，AC-OP-06）', () => {
  const db = buildDb()
  try {
    const PROTECTED = '存在线上过审版本的教程不可删除，请以下架归档代替'
    expectError(() => deleteTutorial(db, 4, { id: 1, role: 'admin' }), 403, PROTECTED) // published
    expectError(() => deleteTutorial(db, 24, { id: 1, role: 'admin' }), 403, PROTECTED) // offline
    expectError(() => deleteTutorial(db, 19, { id: 1, role: 'admin' }), 403, PROTECTED) // 回审 pending 旧版在线
    for (const id of [4, 24, 19]) {
      assert.ok(row(db, id), `#${id} 保留不可删`)
    }
  } finally {
    db.close()
  }
})

test('deleteTutorial 纯草稿：作者本人与 admin 放行物理删除；operator 删他人草稿 403（AC-EG-08）', () => {
  const db = buildDb()
  try {
    // #23 为 operator(2) 名下纯草稿：admin 可删任意纯草稿
    deleteTutorial(db, 23, { id: 1, role: 'admin' })
    assert.equal(row(db, 23), undefined)

    const adminDraft = createTutorial(db, { title: '管理员草稿', categoryId: 1 }, 1)
    expectError(() => deleteTutorial(db, adminDraft.id, { id: 2, role: 'operator' }), 403, '无权限执行该操作')
    assert.ok(row(db, adminDraft.id), '越权删除后仍存在')

    const ownDraft = createTutorial(db, { title: '运营草稿', categoryId: 1 }, 2)
    deleteTutorial(db, ownDraft.id, { id: 2, role: 'operator' })
    assert.equal(row(db, ownDraft.id), undefined)

    expectError(() => deleteTutorial(db, 999, { id: 1, role: 'admin' }), 404, '教程不存在')
  } finally {
    db.close()
  }
})

// ── HTTP 层：门卫 / 信封 / 乐观锁（自建数据自清理）──────────────────────

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

/** 带 token 请求；遇意外 401（并行 reset 清了 token）重签重试一次 */
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

test('HTTP 写入门卫：POST/PUT/DELETE 未登录 401；user 角色 403（AC-RULE-22/23）', async () => {
  for (const [method, path] of [
    ['POST', '/'],
    ['PUT', '/23'],
    ['DELETE', '/23'],
  ] as const) {
    const res = await call(method, path, {})
    assert.equal(res.status, 401, `${method} ${path} 未登录 401`)
    assert.deepEqual(await res.json(), { code: 401, message: '未登录或登录已失效', data: null })
  }
  const forbidden = await callAs('sales', 'POST', '/', { title: 't', categoryId: 1 })
  assert.equal(forbidden.status, 403)
  assert.deepEqual(await forbidden.json(), { code: 403, message: '无权限执行该操作', data: null })
})

test('HTTP 新建→保存→删除闭环：草稿信封 / 乐观锁 409 / 删除保护 403（对并行 reset 幂等）', async () => {
  // 新建（operator）：创建即草稿
  const created = await callAs('operator', 'POST', '/', { title: '并发回归标题', categoryId: 1, tags: ['回归'] })
  assert.equal(created.status, 200)
  const createdBody = (await created.json()) as { code: number; data: { id: number; status: string } }
  assert.equal(createdBody.code, 0)
  assert.equal(createdBody.data.status, 'draft')
  const id = createdBody.data.id

  try {
    // 保存：草稿仍草稿；过期 baseUpdatedAt 409
    const saved = await callAs('operator', 'PUT', `/${id}`, { title: '并发回归标题v2' })
    assert.equal(saved.status, 200)
    assert.equal(((await saved.json()) as { data: { status: string } }).data.status, 'draft')
    const stale = await callAs('operator', 'PUT', `/${id}`, {
      title: '并发回归标题v3',
      baseUpdatedAt: '2000-01-01 00:00:00',
    })
    assert.equal(stale.status, 409)
    assert.deepEqual(await stale.json(), { code: 409, message: '他人已保存新版本，请刷新后合并', data: null })

    // 删除保护：已发布种子教程 admin 也不可删；operator 删他人（admin）草稿 403
    const protectedRes = await callAs('admin', 'DELETE', '/4')
    assert.equal(protectedRes.status, 403)
    assert.deepEqual(await protectedRes.json(), {
      code: 403,
      message: '存在线上过审版本的教程不可删除，请以下架归档代替',
      data: null,
    })
    const adminCreated = await callAs('admin', 'POST', '/', { title: '管理员草稿', categoryId: 1 })
    const adminOwned = ((await adminCreated.json()) as { data: { id: number } }).data.id
    const notMine = await callAs('operator', 'DELETE', `/${adminOwned}`)
    assert.equal(notMine.status, 403)

    // 自建草稿删除：作者 200 "已删除"
    const removed = await callAs('operator', 'DELETE', `/${id}`)
    assert.equal(removed.status, 200)
    assert.deepEqual(await removed.json(), { code: 0, message: '已删除', data: null })
    const listAfter = await callAs('operator', 'GET', `/?all=1&status=draft&pageSize=100`)
    const listIds = ((await listAfter.json()) as { data: { list: Array<{ id: number }> } }).data.list.map((c) => c.id)
    assert.ok(!listIds.includes(id), '删除后管理列表不再返回')
    // admin 兜底清理自建数据（operator 删不掉的 admin 草稿）
    await callAs('admin', 'DELETE', `/${adminOwned}`)
  } finally {
    // 并行 reset 极端时序下的兜底清理：只删本用例自建行
    const db = openDb()
    db.prepare("DELETE FROM tutorials WHERE title IN ('并发回归标题', '并发回归标题v2', '管理员草稿')").run()
  }
})
