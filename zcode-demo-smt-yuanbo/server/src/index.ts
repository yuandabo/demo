import { existsSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import apiRouter from './routes/index.js'
import { errorHandler, notFoundHandler } from './response.js'
import { openDb } from './db.js'

// 建库 + 种子初始化：首次启动自动创建 server/erp.db 并写入种子，重启幂等（AC-OP-01/AC-NF-06）
openDb()

const app = express()

// JSON body 解析（API 契约均为 application/json）
app.use(express.json())

// /api 路由树：统一 {code, message, data} 信封；鉴权中间件挂载点见 routes/index.ts
app.use('/api', apiRouter)

// 静态托管前端构建产物：web/dist 由 INFRA-02 产出，缺失时不挂载、服务不报错。
// 多入口 + HashRouter，无需 SPA fallback（tech-design.md#1）。
// src/ 与 dist/ 均在 server/ 下一级，统一向上两级回到仓库根再进 web/dist。
const webDistDir = path.resolve(import.meta.dirname, '../../web/dist')
if (existsSync(webDistDir)) {
  app.use(express.static(webDistDir))
}

// 全局兜底：未知路径（含未知 /api/* 与 dist 缺失时的 GET /）统一 404 JSON
app.use(notFoundHandler)

// 异常兜底：500 JSON
app.use(errorHandler)

const PORT = 3000
app.listen(PORT, () => {
  console.log(`[server] listening at http://localhost:${PORT}`)
})
