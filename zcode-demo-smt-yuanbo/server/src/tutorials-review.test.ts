/**
 * 教程审核状态机单测（IT-02/BE-04 阶段 1）
 * oracle：真实种子数据——#19 回审 pending（旧版快照在线）、#20/#21 首次 pending、#22/23 草稿、#24 已下架。
 * service 用例 :memory: 独立建库精确断言（快照拷贝/驳回校验/并发互斥）；
 * HTTP 用例自建草稿自清理，验证 admin 专属门卫与信封，不污染共享 erp.db。
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
  createTutorial,
  getVisibleTutorial,
  reviewTutorial,
  submitTutorial,
  withdrawTutorial,
} from './routes/tutorials.js'
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

// ── service 层：submitTutorial 提审 ───────────────────────────────────

test('submitTutorial 纯草稿提审：pending + submitCount 递增 + 留痕响应（AC-FN-07）', () => {
  const db = buildDb()
  try {
    const result = submitTutorial(db, 23)
    assert.deepEqual(result, { id: 23, status: 'pending', submitCount: 1 })
    assert.equal(row(db, 23).status, 'pending')
  } finally {
    db.close()
  }
})

test('submitTutorial 必填四项齐备才可提审：缺任一 400（AC-EG-01）', () => {
  const db = buildDb()
  try {
    const MSG = '请补全标题/分类/摘要/正文后再提交'
    // 经 createTutorial 落库的空摘要草稿（草稿允许空，必填仅提审校验，AC-OP-05）
    const emptySummary = createTutorial(db, { title: 't', categoryId: 1 }, 2)
    expectError(() => submitTutorial(db, emptySummary.id), 400, MSG)
    const emptyContent = createTutorial(db, { title: 't', categoryId: 1, summary: 's' }, 2)
    expectError(() => submitTutorial(db, emptyContent.id), 400, MSG)
    db.prepare("UPDATE tutorials SET title = '' WHERE id = 23").run()
    expectError(() => submitTutorial(db, 23), 400, MSG)
    // 补全后可提审
    db.prepare("UPDATE tutorials SET title = '里程碑延期预警设置' WHERE id = 23").run()
    assert.equal(submitTutorial(db, 23).status, 'pending')
  } finally {
    db.close()
  }
})

test('submitTutorial 非法迁移 409：非草稿（pending/已下架）直接提审被拒且状态不变（AC-EG-09/AC-RULE-05）', () => {
  const db = buildDb()
  try {
    expectError(() => submitTutorial(db, 20), 409, '该教程状态已变化，请刷新')
    expectError(() => submitTutorial(db, 24), 409, '该教程状态已变化，请刷新')
    assert.equal(row(db, 20).status, 'pending')
    assert.equal(row(db, 24).status, 'offline')
    expectError(() => submitTutorial(db, 999), 404, '教程不存在')
  } finally {
    db.close()
  }
})

test('submitTutorial 分类停用 409：提审时分类须仍为启用', () => {
  const db = buildDb()
  try {
    db.prepare("UPDATE categories SET status = 'disabled' WHERE id = 2").run()
    expectError(() => submitTutorial(db, 23), 409, '所属分类已停用，请选择启用的分类')
  } finally {
    db.close()
  }
})

// ── service 层：withdrawTutorial 撤回 ─────────────────────────────────

test('withdrawTutorial 撤回与再提审：pending→draft 可再次 submit，submit_count 累计（AC-OP-07）', () => {
  const db = buildDb()
  try {
    const first = submitTutorial(db, 23)
    assert.equal(first.submitCount, 1)
    assert.deepEqual(withdrawTutorial(db, 23), { id: 23, status: 'draft' })
    assert.equal(row(db, 23).status, 'draft')
    const second = submitTutorial(db, 23)
    assert.equal(second.submitCount, 2, '提审留痕累计递增')
  } finally {
    db.close()
  }
})

test('withdrawTutorial 非待审核 409：草稿/不存在', () => {
  const db = buildDb()
  try {
    expectError(() => withdrawTutorial(db, 22), 409, '该教程状态已变化，请刷新')
    expectError(() => withdrawTutorial(db, 999), 404, '教程不存在')
  } finally {
    db.close()
  }
})

// ── service 层：reviewTutorial 审核 ───────────────────────────────────

test('reviewTutorial approve：快照拷贝+发布留痕一次就位，前台下一请求可见（AC-FN-08）', () => {
  const db = buildDb()
  try {
    const before = row(db, 20)
    const result = reviewTutorial(db, 20, { action: 'approve' }, 1)
    assert.equal(result.status, 'published')
    assert.equal(result.reviewerId, 1)
    assert.ok(result.publishedAt)
    assert.ok(result.reviewedAt)

    const stored = row(db, 20)
    assert.equal(stored.status, 'published')
    assert.equal(stored.published_content, before.content, 'content→published_content 快照拷贝')
    assert.equal(stored.published_summary, before.summary)
    assert.ok(stored.published_at)
    assert.equal(stored.reviewer_id, 1)
    assert.ok(stored.reviewed_at)
    assert.equal(stored.last_offline_at, null, '过审清下架时间戳')

    assert.equal(getVisibleTutorial(db, 20).kind, 'ok', '首次发布即刻可见')
  } finally {
    db.close()
  }
})

test('reviewTutorial approve 回审版：新版替换旧快照（AC-FN-10 后半程）', () => {
  const db = buildDb()
  try {
    const before = row(db, 19)
    const result = reviewTutorial(db, 19, { action: 'approve' }, 1)
    assert.equal(result.status, 'published')
    const stored = row(db, 19)
    assert.equal(stored.published_content, before.content, '编辑版过审替换线上旧版')
    assert.equal(stored.published_summary, before.summary)
    const visible = getVisibleTutorial(db, 19)
    if (visible.kind === 'ok') assert.ok(visible.detail.content.includes('页签'), '前台读到新版内容')
  } finally {
    db.close()
  }
})

test('reviewTutorial 驳回原因 ≥5 字后端双重校验：<5 字 400，≥5 字驳回成功留痕（AC-FN-09/AC-RULE-19）', () => {
  const db = buildDb()
  try {
    expectError(() => reviewTutorial(db, 20, { action: 'reject', reason: '太短' }, 1), 400, '请填写至少 5 个字的驳回原因')
    expectError(() => reviewTutorial(db, 20, { action: 'reject' }, 1), 400, '请填写至少 5 个字的驳回原因')
    expectError(
      () => reviewTutorial(db, 20, { action: 'reject', reason: '  太短  ' }, 1),
      400,
      '请填写至少 5 个字的驳回原因'
    )
    expectError(() => reviewTutorial(db, 20, { action: 'reject', reason: null }, 1), 400, '请填写至少 5 个字的驳回原因')
    assert.equal(row(db, 20).status, 'pending', '400 驳回不改变状态')

    const result = reviewTutorial(db, 20, { action: 'reject', reason: '正文步骤缺少截图说明，请补充后重提' }, 1)
    assert.deepEqual(result, { id: 20, status: 'draft', rejectReason: '正文步骤缺少截图说明，请补充后重提' })
    const stored = row(db, 20)
    assert.equal(stored.reject_reason, '正文步骤缺少截图说明，请补充后重提')
    assert.equal(stored.reviewer_id, 1)
    assert.ok(stored.reviewed_at, '审核留痕')
  } finally {
    db.close()
  }
})

test('reviewTutorial 回审版驳回：仅编辑版回草稿，前台旧版快照继续在线（AC-FN-19/AC-EG-15）', () => {
  const db = buildDb()
  try {
    const before = row(db, 19)
    const result = reviewTutorial(db, 19, { action: 'reject', reason: '新版截图仍含未发布界面' }, 1)
    assert.equal(result.status, 'draft')
    const stored = row(db, 19)
    assert.equal(stored.published_content, before.published_content, '快照列不动')
    assert.equal(stored.published_summary, before.published_summary)
    const visible = getVisibleTutorial(db, 19)
    assert.equal(visible.kind, 'ok', '前台继续展示旧版')
    if (visible.kind === 'ok') {
      assert.equal(visible.detail.content, before.published_content)
    }
  } finally {
    db.close()
  }
})

test('reviewTutorial 参数与非法迁移：action 非法 400；草稿/已发布 review 409 状态不变（AC-EG-09）', () => {
  const db = buildDb()
  try {
    for (const bad of [undefined, 'publish', 1, null]) {
      expectError(() => reviewTutorial(db, 20, { action: bad }, 1), 400, 'action 参数不合法')
    }
    expectError(() => reviewTutorial(db, 22, { action: 'approve' }, 1), 409, '该教程状态已变化，请刷新')
    expectError(
      () => reviewTutorial(db, 22, { action: 'reject', reason: '草稿不可直接审核' }, 1),
      409,
      '该教程状态已变化，请刷新'
    )
    expectError(() => reviewTutorial(db, 1, { action: 'approve' }, 1), 409, '该教程状态已变化，请刷新')
    assert.equal(row(db, 22).status, 'draft')
    assert.equal(row(db, 1).status, 'published')
    expectError(() => reviewTutorial(db, 999, { action: 'approve' }, 1), 404, '教程不存在')
  } finally {
    db.close()
  }
})

test('审核与撤回并发互斥：后到动作 409，状态仅按先到动作流转（AC-EG-04/AC-EG-19）', () => {
  const db = buildDb()
  try {
    // 先撤回后审核：review 409，保持 draft
    withdrawTutorial(db, 20)
    expectError(() => reviewTutorial(db, 20, { action: 'approve' }, 1), 409, '该教程状态已变化，请刷新')
    assert.equal(row(db, 20).status, 'draft')

    // 先审核后撤回：withdraw 409，保持 published（仅一次迁移与留痕）
    reviewTutorial(db, 21, { action: 'approve' }, 1)
    expectError(() => withdrawTutorial(db, 21), 409, '该教程状态已变化，请刷新')
    assert.equal(row(db, 21).status, 'published')
    // 重新提审后 approve：reason 被忽略、reject_reason 保持 NULL
    submitTutorial(db, 20)
    assert.equal(reviewTutorial(db, 20, { action: 'approve', reason: 'x' }, 1).status, 'published')
    assert.equal(row(db, 20).reject_reason, null)
  } finally {
    db.close()
  }
})

// ── HTTP 层：admin 专属门卫 / 信封（自建草稿自清理）─────────────────────

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

test('HTTP 审核门卫：review 未登录 401 / operator 403 且状态不变（AC-FN-18）；submit user 403', async () => {
  const unauth = await call('POST', '/20/review', { action: 'approve' })
  assert.equal(unauth.status, 401)

  const forbidden = await callAs('operator', 'POST', '/20/review', { action: 'approve' })
  assert.equal(forbidden.status, 403)
  assert.deepEqual(await forbidden.json(), { code: 403, message: '无权限执行该操作', data: null })
  const statusRow = openDb().prepare('SELECT status FROM tutorials WHERE id = 20').get() as { status: string }
  assert.equal(statusRow.status, 'pending', '403 后状态不变')

  const userSubmit = await callAs('sales', 'POST', '/23/submit', {})
  assert.equal(userSubmit.status, 403)
  const userWithdraw = await callAs('sales', 'POST', '/20/withdraw', {})
  assert.equal(userWithdraw.status, 403)
})

test('HTTP 提审→撤回闭环 + 驳回原因 HTTP 校验（自建草稿自清理）', async () => {
  const created = await callAs('operator', 'POST', '/', { title: '审核闭环草稿', categoryId: 1, summary: 's', content: '<p>c</p>' })
  const id = ((await created.json()) as { data: { id: number } }).data.id
  try {
    const submitted = await callAs('operator', 'POST', `/${id}/submit`, {})
    assert.equal(submitted.status, 200)
    assert.deepEqual((await submitted.json()) as { code: number }, { code: 0, message: 'ok', data: { id, status: 'pending', submitCount: 1 } })

    const shortReason = await callAs('admin', 'POST', `/${id}/review`, { action: 'reject', reason: '太短' })
    assert.equal(shortReason.status, 400)
    assert.deepEqual(await shortReason.json(), { code: 400, message: '请填写至少 5 个字的驳回原因', data: null })

    const badAction = await callAs('admin', 'POST', `/${id}/review`, {})
    assert.deepEqual(await badAction.json(), { code: 400, message: 'action 参数不合法', data: null })

    const withdrawn = await callAs('operator', 'POST', `/${id}/withdraw`, {})
    assert.equal(withdrawn.status, 200)
    assert.deepEqual((await withdrawn.json()) as { data: { status: string } }, { code: 0, message: 'ok', data: { id, status: 'draft' } })

    const removed = await callAs('admin', 'DELETE', `/${id}`)
    assert.equal(removed.status, 200)
  } finally {
    openDb().prepare("DELETE FROM tutorials WHERE title = '审核闭环草稿'").run()
  }
})
