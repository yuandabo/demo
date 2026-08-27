/**
 * 统一响应信封与错误兜底单测（M-1）：express.json 解析失败（SyntaxError type=entity.parse.failed）
 * 须转 400 "请求体格式错误" 契约信封，而非落入未预期异常 500。
 * 仅组合 express.json + 业务路由 + errorHandler 的临时 HTTP 服务验证，不依赖路由树与数据库。
 */
import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import express from 'express'
import type { AddressInfo } from 'node:net'

import { errorHandler, ok } from './response.js'

let baseUrl = ''
let server: ReturnType<ReturnType<typeof express>['listen']> | undefined

before(async () => {
  const app = express()
  app.use(express.json())
  app.post('/echo', (req, res) => {
    ok(res, { received: req.body ?? null })
  })
  app.use(errorHandler)
  server = app.listen(0)
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise((resolve) => server?.close(() => resolve(null)))
})

test('非法 JSON 请求体 → 400 请求体格式错误（entity.parse.failed 契约口径，M-1）', async () => {
  const res = await fetch(`${baseUrl}/echo`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"progress": ',
  })
  assert.equal(res.status, 400)
  assert.deepEqual(await res.json(), { code: 400, message: '请求体格式错误', data: null })
})

test('对照：合法 JSON 请求不受影响 → 200 正常信封', async () => {
  const res = await fetch(`${baseUrl}/echo`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"progress": 60}',
  })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { code: 0, message: 'ok', data: { received: { progress: 60 } } })
})
