/**
 * 教程评价（IT-04/BE-03）：POST /api/feedbacks/:tutorialId 单端点
 * 契约：docs/design/api/post-api-feedbacks-tutorialId.md
 * 核心规则：feedbacks 联合主键评价唯一可改（AC-RULE-15）；helpful 变更时事务内联动
 * helpful_yes/no 旧值 -1 新值 +1、helpful 不变仅改留言计数不动（AC-FN-05）；
 * 留言选填 ≤200 字仅后台反馈分析可见（AC-RULE-20）；helpful_yes+helpful_no 为
 * 有帮助率分母口径（AC-RULE-10）。
 * 挂载：由 routes/index.ts 统一挂载（并行任务协调点，本文件只导出 router）。
 */
import type { DatabaseSync } from 'node:sqlite'
import type { Request } from 'express'
import { Router } from 'express'
import { openDb, VISIBLE_SQL } from '../db.js'
import { requireAuth } from '../auth.js'
import { HttpError, ok } from '../response.js'

const router = Router()

// ── service 层（tech-design §11 冻结命名：upsertFeedback）──────────────────

/** 契约失败文案（post-api-feedbacks-tutorialId.md 失败场景表，禁止漂移） */
const MSG_HELPFUL_INVALID = 'helpful 必须为 0 或 1'
const MSG_COMMENT_TOO_LONG = '留言不超过 200 字'
const MSG_TUTORIAL_NOT_VISIBLE = '该教程不存在或暂不可见'

/** AC-RULE-20 留言上限（含 200） */
const COMMENT_MAX_LENGTH = 200

/** 评价入参（parseFeedbackInput 的产物，helpful 收窄为 0|1、comment 归一为 string|null） */
export interface FeedbackInput {
  tutorialId: number
  helpful: 0 | 1
  comment: string | null
}

/** 评价响应（helpfulYes+helpfulNo 即 AC-RULE-10 有帮助率分母） */
export interface FeedbackResult {
  tutorialId: number
  helpful: 0 | 1
  helpfulYes: number
  helpfulNo: number
}

/** helpful 取值对应的 tutorials 计数列（闭集映射，杜绝列名拼接注入） */
const helpfulColumn = (helpful: 0 | 1): 'helpful_yes' | 'helpful_no' =>
  helpful === 1 ? 'helpful_yes' : 'helpful_no'

/**
 * 评价 upsert + 计数联动（单事务）：反馈行与 tutorials 计数同生共死，任一失败整体回滚。
 * 三分支：无旧记录 INSERT+新值 +1；helpful 变更 UPDATE+旧值 -1 新值 +1（AC-FN-05）；
 * helpful 不变仅改留言 UPDATE+计数不动。Node 单线程 + node:sqlite 同步驱动，
 * 可见性校验与事务之间无并发窗口。
 */
export function upsertFeedback(db: DatabaseSync, userId: number, input: FeedbackInput): FeedbackResult {
  const { tutorialId, helpful, comment } = input
  if (!db.prepare(`SELECT id FROM tutorials WHERE id = ? AND ${VISIBLE_SQL}`).get(tutorialId)) {
    throw new HttpError(404, MSG_TUTORIAL_NOT_VISIBLE)
  }
  const old = db
    .prepare('SELECT helpful FROM feedbacks WHERE user_id = ? AND tutorial_id = ?')
    .get(userId, tutorialId) as { helpful: number } | undefined

  db.exec('BEGIN')
  try {
    if (old === undefined) {
      db.prepare(
        `INSERT INTO feedbacks (user_id, tutorial_id, helpful, comment, updated_at)
         VALUES (?, ?, ?, ?, datetime('now','localtime'))`
      ).run(userId, tutorialId, helpful, comment)
      bumpHelpfulCount(db, tutorialId, helpful, 1)
    } else if (old.helpful !== helpful) {
      db.prepare(
        `UPDATE feedbacks SET helpful = ?, comment = ?, updated_at = datetime('now','localtime')
         WHERE user_id = ? AND tutorial_id = ?`
      ).run(helpful, comment, userId, tutorialId)
      bumpHelpfulCount(db, tutorialId, old.helpful === 1 ? 1 : 0, -1)
      bumpHelpfulCount(db, tutorialId, helpful, 1)
    } else {
      db.prepare(
        `UPDATE feedbacks SET comment = ?, updated_at = datetime('now','localtime')
         WHERE user_id = ? AND tutorial_id = ?`
      ).run(comment, userId, tutorialId)
    }
    const counts = db
      .prepare('SELECT helpful_yes AS yes, helpful_no AS no FROM tutorials WHERE id = ?')
      .get(tutorialId) as { yes: number; no: number }
    db.exec('COMMIT')
    return { tutorialId, helpful, helpfulYes: Number(counts.yes), helpfulNo: Number(counts.no) }
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

/** 计数联动：helpful 对应列 +delta（仅 +/-1 两种步长，来自闭集） */
function bumpHelpfulCount(db: DatabaseSync, tutorialId: number, helpful: 0 | 1, delta: 1 | -1): void {
  const column = helpfulColumn(helpful)
  db.prepare(`UPDATE tutorials SET ${column} = ${column} + ${delta} WHERE id = ?`).run(tutorialId)
}

// ── 路由层（参数校验 + 鉴权 + 编排）──────────────────────────────

/** requireAuth 已保证登录；本兜底防御路由未挂中间件被直接调用的场景 */
function currentUserId(req: Request): number {
  if (!req.user) throw new HttpError(401, '未登录或登录已失效')
  return req.user.id
}

/** 路径参数解析：非正整数（abc/0/-1/3.5）一律按目标教程不存在处理（契约无独立 400 文案） */
function parseTutorialId(raw: string): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * 请求体校验：helpful 必填整数 0/1；comment 选填 string ≤200 字（null/省略归一为 null，
 * 空串合法）。非字符串 comment 折叠进契约唯一留言文案，避免私造新错误码。
 */
export function parseFeedbackInput(tutorialIdRaw: string, body: unknown): FeedbackInput {
  const tutorialId = parseTutorialId(tutorialIdRaw)
  if (tutorialId === null) throw new HttpError(404, MSG_TUTORIAL_NOT_VISIBLE)

  const { helpful, comment } = (body ?? {}) as Record<string, unknown>
  if (helpful !== 0 && helpful !== 1) throw new HttpError(400, MSG_HELPFUL_INVALID)
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== 'string' || comment.length > COMMENT_MAX_LENGTH) {
      throw new HttpError(400, MSG_COMMENT_TOO_LONG)
    }
  }
  return {
    tutorialId,
    helpful: helpful === 1 ? 1 : 0,
    comment: comment === undefined || comment === null ? null : comment,
  }
}

router.post('/:tutorialId', requireAuth, (req, res) => {
  // Express 5 类型将 params 值标为 string | string[]（重复参数形态），本路由仅单值，String() 收窄
  const input = parseFeedbackInput(String(req.params.tutorialId), req.body)
  ok(res, upsertFeedback(openDb(), currentUserId(req), input))
})

export default router
