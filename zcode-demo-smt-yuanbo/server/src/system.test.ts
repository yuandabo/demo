import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import express from 'express'
import type { AddressInfo } from 'node:net'

import systemRouter from './routes/system.js'
import type { ApiEnvelope } from './response.js'
import { errorHandler } from './response.js'
import { findUserByUsername, issueToken } from './auth.js'
import { closeDb, openDb, type SeedCounts } from './db.js'

/**
 * POST /api/system/reset 单测（契约 docs/design/api/post-api-system-reset.md，AC-OP-01 / AC-NF-06）：
 * 401/403 门卫、重置信封五项计数、旧 token 全作废、重复执行计数恒定且脏数据被清除。
 * 按计划挂载路径自挂临时服务器验证（routes/index.ts 挂载行由主 agent 落盘，不依赖主应用启动）。
 * 期望值来自契约与 db.md §6 种子，不从实现反推。
 */

/** 契约固定种子计数（12 启用分类 / 24 教程 / 8 账号 / 3 消息 / 5 打卡） */
const SEED_COUNTS: SeedCounts = { categories: 12, tutorials: 24, users: 8, messages: 3, checkins: 5 }

let baseUrl = ''
let server: ReturnType<ReturnType<typeof express>['listen']> | undefined

/** 直接签发 DB token（等价 login 后取得 token），账号缺失即断言失败 */
function loginAs(username: string): string {
  const user = findUserByUsername(username)
  assert.ok(user, `种子账号 ${username} 应存在`)
  return issueToken(user.id)
}

/** 调用 reset 接口；token 省略时模拟未携带 */
function postReset(token?: string): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token !== undefined) headers.authorization = `Bearer ${token}`
  return fetch(`${baseUrl}/api/system/reset`, { method: 'POST', headers, body: '{}' })
}

/** 解析 200 信封（非 200 由调用方自行断言 status） */
async function envelopeOf(res: Response): Promise<ApiEnvelope<SeedCounts>> {
  assert.equal(res.status, 200)
  return (await res.json()) as ApiEnvelope<SeedCounts>
}

/** 行为表计数（脏数据探针：种子基线对比） */
function tableCounts(): { favorites: number; histories: number } {
  const countOf = (table: string): number =>
    (openDb().prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n
  return { favorites: countOf('favorites'), histories: countOf('histories') }
}

before(async () => {
  openDb() // 建库+种子就绪后才能签发 token
  server = express().use('/api/system', systemRouter).use(errorHandler).listen(0)
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise((resolve) => server?.close(() => resolve(null)))
  closeDb()
})

test('门卫：未携带 / 伪造 token → 401 未登录或登录已失效', async () => {
  for (const token of [undefined, 'deadbeefdeadbeef']) {
    const res = await postReset(token)
    assert.equal(res.status, 401, JSON.stringify(token))
    assert.deepEqual(await res.json(), { code: 401, message: '未登录或登录已失效', data: null })
  }
})

test('门卫：operator（非 admin）→ 403 无权限执行该操作', async () => {
  const res = await postReset(loginAs('operator'))
  assert.equal(res.status, 403)
  assert.deepEqual(await res.json(), { code: 403, message: '无权限执行该操作', data: null })
})

test('admin 重置：契约信封 + 五项计数 12/24/8/3/5', async () => {
  const res = await postReset(loginAs('admin'))
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { code: 0, message: '重置成功', data: SEED_COUNTS })
})

test('重置后旧 token 全作废（auth_tokens 随事务清空，与登出同机制）', async () => {
  const staleToken = loginAs('admin')
  await postReset(staleToken)
  assert.equal((await postReset(staleToken)).status, 401, '重置后旧 token 应 401')
  assert.equal((await postReset(loginAs('admin'))).status, 200, '重新登录（新 token）恢复可用')
})

test('重复执行不产生脏数据：连调 3 次计数恒定，脏数据行被清除（AC-OP-01）', async () => {
  const first = await envelopeOf(await postReset(loginAs('admin')))
  assert.deepEqual(first.data, SEED_COUNTS)
  const baseline = tableCounts()
  // 制造脏数据：种子外用户 99 的收藏与浏览历史
  const db = openDb()
  db.prepare('INSERT INTO favorites (user_id, tutorial_id) VALUES (99, 1)').run()
  db.prepare('INSERT INTO histories (user_id, tutorial_id, progress) VALUES (99, 1, 50)').run()
  assert.deepEqual(tableCounts(), { favorites: baseline.favorites + 1, histories: baseline.histories + 1 }, '前置：脏数据已写入')
  for (let round = 2; round <= 3; round++) {
    // 上一轮重置已作废全部 token，每轮重新登录
    const again = await envelopeOf(await postReset(loginAs('admin')))
    assert.deepEqual(again.data, first.data, `第 ${round} 次重置计数与首次一致`)
  }
  assert.deepEqual(tableCounts(), baseline, '脏数据随重置清除，恢复种子基线')
})
