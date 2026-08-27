/**
 * 评价 service 单测（IT-04/BE-03 阶段 1）
 * oracle：真实种子数据（seed.ts 固定值）——#3 MRP published/helpful_yes=96/helpful_no=8、
 * #19 回审旧版在线可见、#20 首次待审/#23 纯草稿不可见、#24 已下架不可见（80/18）；
 * user 3=sales、user 4=purchase（AC-FN-25 多端共用同一记录的独立行对照）。
 * 不触碰 server/erp.db，:memory: 独立建库。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { insertSeed } from './seed.js'
import { parseFeedbackInput, upsertFeedback } from './routes/feedbacks.js'
import { HttpError } from './response.js'

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

/** feedbacks 行投影（断言联合主键唯一与 helpful/comment 落库值） */
interface FeedbackRow {
  user_id: number
  tutorial_id: number
  helpful: number
  comment: string | null
}

function feedbackRows(db: DatabaseSync, userId: number, tutorialId: number): FeedbackRow[] {
  // node:sqlite 行为 null-prototype 对象，strict deepEqual 比原型，展开归一为普通对象
  return (
    db
      .prepare('SELECT user_id, tutorial_id, helpful, comment FROM feedbacks WHERE user_id = ? AND tutorial_id = ?')
      .all(userId, tutorialId) as unknown as FeedbackRow[]
  ).map((row) => ({ ...row }))
}

/** 断言抛 HttpError(status, message)：契约文案逐一精确比对 */
function assertHttpError(fn: () => unknown, status: number, message: string, label: string): void {
  assert.throws(
    fn,
    (err: unknown) => err instanceof HttpError && err.status === status && err.message === message,
    label
  )
}

test('首次评价 helpful=1：feedbacks 落行且 helpful_yes +1（种子 #3=96/8）', () => {
  const db = buildDb()
  try {
    assert.deepEqual(upsertFeedback(db, 4, { tutorialId: 3, helpful: 1, comment: null }), {
      tutorialId: 3,
      helpful: 1,
      helpfulYes: 97,
      helpfulNo: 8,
    })
    assert.deepEqual(feedbackRows(db, 4, 3), [
      { user_id: 4, tutorial_id: 3, helpful: 1, comment: null },
    ])
  } finally {
    db.close()
  }
})

test('首次评价 helpful=0 方向：helpful_no +1，另一列不动', () => {
  const db = buildDb()
  try {
    assert.deepEqual(upsertFeedback(db, 4, { tutorialId: 3, helpful: 0, comment: '截图不一致' }), {
      tutorialId: 3,
      helpful: 0,
      helpfulYes: 96,
      helpfulNo: 9,
    })
    assert.deepEqual(feedbackRows(db, 4, 3), [
      { user_id: 4, tutorial_id: 3, helpful: 0, comment: '截图不一致' },
    ])
  } finally {
    db.close()
  }
})

test('评价切换 1→0（AC-FN-05 + AC-RULE-15）：旧值 -1 新值 +1，联合主键仍一行', () => {
  const db = buildDb()
  try {
    upsertFeedback(db, 4, { tutorialId: 3, helpful: 1, comment: null })
    assert.deepEqual(
      upsertFeedback(db, 4, { tutorialId: 3, helpful: 0, comment: '步骤三的截图和实际界面不一致' }),
      { tutorialId: 3, helpful: 0, helpfulYes: 96, helpfulNo: 9 }
    )
    assert.deepEqual(feedbackRows(db, 4, 3), [
      { user_id: 4, tutorial_id: 3, helpful: 0, comment: '步骤三的截图和实际界面不一致' },
    ])
  } finally {
    db.close()
  }
})

test('评价切换 0→1 对称（AC-RULE-15 可反复切换）', () => {
  const db = buildDb()
  try {
    upsertFeedback(db, 4, { tutorialId: 3, helpful: 0, comment: null })
    assert.deepEqual(upsertFeedback(db, 4, { tutorialId: 3, helpful: 1, comment: null }), {
      tutorialId: 3,
      helpful: 1,
      helpfulYes: 97,
      helpfulNo: 8,
    })
    assert.equal(feedbackRows(db, 4, 3).length, 1)
  } finally {
    db.close()
  }
})

test('helpful 不变仅改留言：计数不动，comment 覆盖更新（AC-RULE-15 三分支之三）', () => {
  const db = buildDb()
  try {
    upsertFeedback(db, 4, { tutorialId: 3, helpful: 0, comment: '旧留言' })
    assert.deepEqual(
      upsertFeedback(db, 4, { tutorialId: 3, helpful: 0, comment: '新留言' }),
      { tutorialId: 3, helpful: 0, helpfulYes: 96, helpfulNo: 9 }
    )
    assert.deepEqual(feedbackRows(db, 4, 3), [
      { user_id: 4, tutorial_id: 3, helpful: 0, comment: '新留言' },
    ])
  } finally {
    db.close()
  }
})

test('留言边界：comment=200 字保存成功（AC-RULE-20 上界含），落库原文一致', () => {
  const db = buildDb()
  try {
    const comment200 = '冗'.repeat(200)
    upsertFeedback(db, 4, { tutorialId: 3, helpful: 1, comment: comment200 })
    assert.equal(feedbackRows(db, 4, 3)[0].comment, comment200)
  } finally {
    db.close()
  }
})

test('多用户互不影响（AC-FN-25 PC/小程序共用同一记录的物理基础）：各占一行，聚合计数正确', () => {
  const db = buildDb()
  try {
    upsertFeedback(db, 4, { tutorialId: 3, helpful: 1, comment: null })
    assert.deepEqual(upsertFeedback(db, 3, { tutorialId: 3, helpful: 0, comment: null }), {
      tutorialId: 3,
      helpful: 0,
      helpfulYes: 97,
      helpfulNo: 9,
    })
    assert.equal((db.prepare('SELECT COUNT(*) AS n FROM feedbacks').get() as { n: number }).n, 2)
    // AC-RULE-10 分母口径：helpful_yes+helpful_no 的增量恒等于有效评价行数（种子基线 96+8）
    const { yes, no } = db
      .prepare('SELECT helpful_yes AS yes, helpful_no AS no FROM tutorials WHERE id = 3')
      .get() as { yes: number; no: number }
    assert.equal(yes - 96 + (no - 8), 2)
  } finally {
    db.close()
  }
})

test('不可见/不存在教程评价 404 文案精确且零写入：已下架#24 / 首次待审#20 / 纯草稿#23 / 不存在#999', () => {
  const db = buildDb()
  try {
    for (const tutorialId of [24, 20, 23, 999]) {
      assertHttpError(
        () => upsertFeedback(db, 4, { tutorialId, helpful: 1, comment: null }),
        404,
        '该教程不存在或暂不可见',
        `教程 #${tutorialId} 应 404`
      )
    }
    assert.equal((db.prepare('SELECT COUNT(*) AS n FROM feedbacks').get() as { n: number }).n, 0)
    const { yes, no } = db
      .prepare('SELECT helpful_yes AS yes, helpful_no AS no FROM tutorials WHERE id = 24')
      .get() as { yes: number; no: number }
    assert.deepEqual({ yes, no }, { yes: 80, no: 18 }, '计数不因失败请求漂移')
    // 回审旧版在线 #19 可见可评价
    assert.deepEqual(upsertFeedback(db, 4, { tutorialId: 19, helpful: 1, comment: null }), {
      tutorialId: 19,
      helpful: 1,
      helpfulYes: 19,
      helpfulNo: 22,
    })
  } finally {
    db.close()
  }
})

test('事务原子性（首次评价分支）：tutorials 更新失败整体回滚，行与计数均不落', () => {
  const db = buildDb()
  try {
    db.exec("CREATE TRIGGER boom_before_update_tutorials BEFORE UPDATE ON tutorials BEGIN SELECT RAISE(ABORT, 'boom'); END")
    assert.throws(() => upsertFeedback(db, 4, { tutorialId: 3, helpful: 1, comment: null }), /boom/)
    assert.equal((db.prepare('SELECT COUNT(*) AS n FROM feedbacks').get() as { n: number }).n, 0, 'INSERT 一并回滚')
    const { yes, no } = db
      .prepare('SELECT helpful_yes AS yes, helpful_no AS no FROM tutorials WHERE id = 3')
      .get() as { yes: number; no: number }
    assert.deepEqual({ yes, no }, { yes: 96, no: 8 }, '计数不漂移')
  } finally {
    db.close()
  }
})

test('事务原子性（切换分支）：联动失败回滚，旧评价行保留原 helpful', () => {
  const db = buildDb()
  try {
    upsertFeedback(db, 4, { tutorialId: 3, helpful: 1, comment: '旧' })
    db.exec("CREATE TRIGGER boom_before_update_tutorials BEFORE UPDATE ON tutorials BEGIN SELECT RAISE(ABORT, 'boom'); END")
    assert.throws(
      () => upsertFeedback(db, 4, { tutorialId: 3, helpful: 0, comment: '新' }),
      /boom/
    )
    assert.deepEqual(feedbackRows(db, 4, 3), [
      { user_id: 4, tutorial_id: 3, helpful: 1, comment: '旧' },
    ], '评价行回滚到切换前')
  } finally {
    db.close()
  }
})

// ── parseFeedbackInput（路由入参校验，契约失败文案逐一精确）──────────────────

test('helpful 非法（缺失/null/true/字符串/2/1.5/-1）→ 400 "helpful 必须为 0 或 1"', () => {
  for (const helpful of [undefined, null, true, '1', 2, 1.5, -1]) {
    assertHttpError(
      () => parseFeedbackInput('3', { helpful, comment: null }),
      400,
      'helpful 必须为 0 或 1',
      `helpful=${String(helpful)} 应 400`
    )
  }
})

test('无请求体（undefined/null）→ 同样 400 helpful 文案', () => {
  for (const body of [undefined, null, {}, 'json-string']) {
    assertHttpError(
      () => parseFeedbackInput('3', body),
      400,
      'helpful 必须为 0 或 1',
      `body=${String(body)} 应 400`
    )
  }
})

test('comment 超长 201 字 → 400 "留言不超过 200 字"（AC-RULE-20）', () => {
  assertHttpError(
    () => parseFeedbackInput('3', { helpful: 1, comment: '冗'.repeat(201) }),
    400,
    '留言不超过 200 字',
    'comment 201 字应 400'
  )
})

test('comment 非字符串（数字/数组/对象）→ 400 留言文案（契约仅此一条留言文案，折叠非字符串形态）', () => {
  for (const comment of [42, ['长'], { len: 1 }]) {
    assertHttpError(
      () => parseFeedbackInput('3', { helpful: 1, comment }),
      400,
      '留言不超过 200 字',
      `comment=${JSON.stringify(comment)} 应 400`
    )
  }
})

test('comment 边界合法：null / 省略 / 200 字 / 空串均放行，归一为 string|null', () => {
  assert.deepEqual(parseFeedbackInput('3', { helpful: 1, comment: null }), {
    tutorialId: 3,
    helpful: 1,
    comment: null,
  })
  assert.deepEqual(parseFeedbackInput('3', { helpful: 0 }), { tutorialId: 3, helpful: 0, comment: null })
  assert.equal(parseFeedbackInput('3', { helpful: 1, comment: '冗'.repeat(200) }).comment, '冗'.repeat(200))
  assert.deepEqual(parseFeedbackInput('3', { helpful: 1, comment: '' }), {
    tutorialId: 3,
    helpful: 1,
    comment: '',
  })
})

test('tutorialId 非正整数（abc/0/-1/3.5）→ 404 "该教程不存在或暂不可见"', () => {
  for (const raw of ['abc', '0', '-1', '3.5', '']) {
    assertHttpError(
      () => parseFeedbackInput(raw, { helpful: 1, comment: null }),
      404,
      '该教程不存在或暂不可见',
      `tutorialId="${raw}" 应 404`
    )
  }
  assert.deepEqual(parseFeedbackInput('3', { helpful: 1, comment: null }).tutorialId, 3)
})
