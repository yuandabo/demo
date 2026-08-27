import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { assertTutorialTransition, TUTORIAL_ACTIONS } from './state-machine.js'
import type { TutorialAction, TutorialStatus } from './state-machine.js'
import { HttpError } from './response.js'

/**
 * AC-RULE-05 合法迁移全集（独立于实现的期望表：8 条迁移 / 7 个动作）。
 * 期望值从 AC / PRD §3.5 / tech-design §4 状态图人工誊抄，作为测试 oracle，
 * 禁止从实现的转移表反推，避免同义反复。
 */
const LEGAL_TRANSITIONS: ReadonlyArray<readonly [TutorialStatus, TutorialAction, TutorialStatus]> = [
  ['draft', 'submit', 'pending'], // 草稿→待审核（提审）
  ['pending', 'reviewApprove', 'published'], // 待审核→已发布（通过）
  ['pending', 'reviewReject', 'draft'], // 待审核→草稿（驳回）
  ['pending', 'withdraw', 'draft'], // 待审核→草稿（撤回）
  ['published', 'editResubmit', 'pending'], // 已发布→待审核（编辑回审）
  ['published', 'offline', 'offline'], // 已发布→已下架（下架）
  ['offline', 'republish', 'published'], // 已下架→已发布（重新发布不重审）
  ['offline', 'editResubmit', 'pending'], // 已下架→待审核（编辑回审）
]

test('8 条合法迁移命中转移表并返回目标状态（AC-RULE-05 全集）', () => {
  for (const [from, action, expected] of LEGAL_TRANSITIONS) {
    assert.equal(
      assertTutorialTransition(from, action),
      expected,
      `期望 ${from} --${action}--> ${expected}`
    )
  }
})

test('TUTORIAL_ACTIONS 与 §11 冻结命名一致（7 动作）', () => {
  assert.deepEqual([...TUTORIAL_ACTIONS], [
    'submit', 'withdraw', 'reviewApprove', 'reviewReject', 'editResubmit', 'offline', 'republish',
  ])
})

test('AC-EG-09 非法迁移一律 409 且文案精确（草稿直接发布/已下架未编辑提审等）', () => {
  const illegalCases: ReadonlyArray<readonly [TutorialStatus, TutorialAction]> = [
    ['draft', 'reviewApprove'], // 草稿态直接调发布接口
    ['offline', 'submit'], // 已下架未编辑直接提审（合法路径为编辑保存自动回审）
    ['published', 'withdraw'], // 已发布撤回（不属于任何合法规则）
    ['draft', 'offline'], // 草稿下架（无此路径）
  ]
  for (const [from, action] of illegalCases) {
    assert.throws(
      () => assertTutorialTransition(from, action),
      (err: unknown) => {
        assert.ok(err instanceof HttpError, `${from} --${action}--> 应抛 HttpError`)
        assert.equal(err.status, 409, `${from} --${action}--> 应为 409`)
        assert.equal(err.code, 409)
        assert.equal(err.message, '该教程状态已变化，请刷新')
        return true
      },
      `期望非法迁移被拒绝：${from} --${action}-->`
    )
  }
})

test('全组合矩阵 4 态 × 7 动作：命中集返回目标态，其余全部 409', () => {
  const legalKey = new Set(LEGAL_TRANSITIONS.map(([f, a]) => `${f}|${a}`))
  const target = new Map(LEGAL_TRANSITIONS.map(([f, a, t]) => [`${f}|${a}`, t]))
  for (const status of ['draft', 'pending', 'published', 'offline'] as const) {
    for (const action of TUTORIAL_ACTIONS) {
      const key = `${status}|${action}`
      if (legalKey.has(key)) {
        assert.equal(assertTutorialTransition(status, action), target.get(key))
      } else {
        assert.throws(() => assertTutorialTransition(status, action), HttpError)
      }
    }
  }
})

test('status 落在四态之外（DB 脏数据）按 500 兜底，不误报 409', () => {
  assert.throws(
    () => assertTutorialTransition('corrupted' as TutorialStatus, 'submit'),
    (err: unknown) => {
      assert.ok(err instanceof HttpError)
      assert.equal(err.status, 500)
      return true
    }
  )
})

/** tech-design §4 前台可见性口径期望串（空格不敏感比较：SQL 语义等价，容忍书写空格差异） */
const EXPECTED_VISIBLE_SQL =
  "published_content IS NOT NULL AND (status = 'published' OR (status IN ('pending','draft') AND last_offline_at IS NULL))"

test('VISIBLE_SQL 前台可见口径：常量逐字一致 + 种子库规则①②③⑤语义验证', async (t) => {
  // 联调点：VISIBLE_SQL 的唯一来源是 IT-01.INFRA-03 的 db.ts（接口约定 export const VISIBLE_SQL）。
  // db.ts 未落地时本用例 skip；落地后自动生效，无需修改本文件。
  // specifier 走变量：tsc 不对非字面量动态 import 做模块解析，db.ts 交付前后本文件均零改动。
  const dbModuleUrl = './db.js'
  let dbModule: { VISIBLE_SQL?: unknown }
  try {
    dbModule = (await import(dbModuleUrl)) as { VISIBLE_SQL?: unknown }
  } catch {
    t.skip("联调点：src/db.ts 未就绪（IT-01.INFRA-03 交付中），落地后按约定 import { VISIBLE_SQL } from './db.js' 自动启用")
    return
  }
  if (typeof dbModule.VISIBLE_SQL !== 'string') {
    t.skip('联调点：db.ts 已存在但未导出字符串常量 VISIBLE_SQL，需与 IT-01.INFRA-03 对齐导出契约')
    return
  }
  const visibleSql = dbModule.VISIBLE_SQL

  // 1) 口径逐字一致（归一化空格后比较，防排版差异破坏逐字断言）
  const normalize = (s: string): string => s.replace(/\s+/g, ' ').trim().replace(/\s*([=<>])\s*/g, '$1')
  assert.equal(
    normalize(visibleSql),
    normalize(EXPECTED_VISIBLE_SQL),
    'VISIBLE_SQL 须与 tech-design §4 口径逐字一致（含 last_offline_at 分支）'
  )

  // 2) 种子库语义验证（阶段 2 验收）：erp.db 缺失/未播种时跳过
  const dbFile = path.resolve(import.meta.dirname, '../erp.db')
  let db: DatabaseSync
  try {
    db = new DatabaseSync(dbFile, { readOnly: true })
  } catch {
    t.skip('联调点：server/erp.db 未生成（建库种子由 IT-01.INFRA-03 提供），语义断言待联调')
    return
  }
  try {
    const count = (where: string): number => {
      const row = db.prepare(`SELECT COUNT(*) AS n FROM tutorials WHERE ${where}`).get() as { n: number } | undefined
      return row?.n ?? 0
    }
    if (count('1=1') === 0) {
      t.skip('联调点：erp.db 存在但 tutorials 未播种，语义断言待 IT-01.INFRA-03 种子就绪')
      return
    }
    assert.ok(count(`(${visibleSql}) AND status = 'published'`) > 0, '规则①：已发布可见')
    assert.ok(
      count(`(${visibleSql}) AND submit_count >= 2 AND published_content IS NOT NULL`) >= 1,
      '规则②：v2 回审期间旧版在线（种子含 1 篇 submit_count>=2 修改版）'
    )
    assert.equal(count(`(${visibleSql}) AND status = 'offline'`), 0, '规则③：已下架不可见（种子 1 篇不命中）')
    assert.equal(count(`(${visibleSql}) AND published_content IS NULL`), 0, '规则⑤：从未过审（纯草稿）不可见')
  } finally {
    db.close()
  }
})
