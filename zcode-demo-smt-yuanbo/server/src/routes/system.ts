/**
 * 系统分组路由（tech-design §3 系统分组 1 端点，AC-OP-01 / AC-NF-06）：
 * POST /api/system/reset admin 专属清空重建种子（demo 演示恢复初始态，生产不部署）。
 * 挂载（routes/index.ts，由主 agent 统一落盘）：apiRouter.use('/system', system)
 */
import { Router } from 'express'
import { authRequired, requireRole } from '../auth.js'
import { resetDatabase, type SeedCounts } from '../db.js'
import { HttpError } from '../response.js'

const router = Router()

/**
 * POST /api/system/reset：事务内清空 9 表 + 重跑种子（db.ts 保证事务边界与回滚）。
 * auth_tokens 随之清空 = 所有登录态作废（与登出同机制，需重新登录）；
 * 响应 message 固定"重置成功"而非 ok，直接组装信封（同 logout 先例）。
 */
router.post('/reset', authRequired, requireRole('admin'), (_req, res) => {
  let counts: SeedCounts
  try {
    counts = resetDatabase()
  } catch (err) {
    // 事务已在 db.ts 内回滚，数据保持原状；此处留痕并转译为契约 500 文案
    console.error('[system] reset failed:', err)
    throw new HttpError(500, '重置失败，请重试')
  }
  res.status(200).json({ code: 0, message: '重置成功', data: counts })
})

export default router
