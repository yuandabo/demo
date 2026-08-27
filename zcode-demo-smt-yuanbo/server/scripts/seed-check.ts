/**
 * 种子校验脚本（INFRA-03 验收断言）
 * 用法：cd server && npm run seed:check
 * 断言：表数=9、种子行数、四态分布、可见性口径（VISIBLE_SQL）、结构约束、幂等（重开库/重置不产生重复行）
 */
import { closeDb, openDb, resetDatabase, VISIBLE_SQL } from '../src/db.js'

let failed = 0

function check(name: string, actual: unknown, expected: unknown): void {
  const pass = Object.is(actual, expected)
  if (!pass) failed++
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}: actual=${String(actual)} expected=${String(expected)}`)
}

function count(sql: string, ...params: (string | number)[]): number {
  const db = openDb()
  const row = db.prepare(sql).get(...params) as { n: number }
  return row.n
}

function tableCounts(): Record<string, number> {
  const names = ['users', 'auth_tokens', 'categories', 'tutorials', 'favorites', 'histories', 'feedbacks', 'messages', 'checkins'] as const
  return Object.fromEntries(names.map((t) => [t, count(`SELECT COUNT(*) AS n FROM ${t}`)]))
}

// ── 1. 结构：9 表 ─────────────────────────────────────────────
const tableCount = count(
  "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
)
check('表数量', tableCount, 9)

// ── 2. 种子行数（任务口径：12/24/8/3/5）───────────────────────
const c1 = tableCounts()
check('categories', c1.categories, 12)
check('tutorials', c1.tutorials, 24)
check('users', c1.users, 8)
check('messages', c1.messages, 3)
check('checkins', c1.checkins, 5)
check('favorites(空表)', c1.favorites, 0)
check('histories(空表)', c1.histories, 0)
check('feedbacks(空表)', c1.feedbacks, 0)
check('auth_tokens(空表)', c1.auth_tokens, 0)
console.log(`OUT categories=${c1.categories} tutorials=${c1.tutorials} users=${c1.users} messages=${c1.messages} checkins=${c1.checkins}`)

// ── 3. 四态分布（18/3/2/1）────────────────────────────────────
const dist = Object.fromEntries(
  (openDb().prepare('SELECT status, COUNT(*) AS n FROM tutorials GROUP BY status').all() as Array<{ status: string; n: number }>).map((r) => [r.status, r.n])
)
check('published', dist.published, 18)
check('pending', dist.pending, 3)
check('draft', dist.draft, 2)
check('offline', dist.offline, 1)
console.log(`OUT published=${dist.published} pending=${dist.pending} draft=${dist.draft} offline=${dist.offline}`)

// ── 4. 可见性口径（VISIBLE_SQL，CHANGE-001：18 发布 + 1 回审旧版在线 = 19）──
const visible = count(`SELECT COUNT(*) AS n FROM tutorials WHERE ${VISIBLE_SQL}`)
check('visible(VISIBLE_SQL)', visible, 19)
check('visible 且 status=published', count(`SELECT COUNT(*) AS n FROM tutorials WHERE status='published' AND ${VISIBLE_SQL}`), 18)
check('visible 且 status=pending(回审旧版在线)', count(`SELECT COUNT(*) AS n FROM tutorials WHERE status='pending' AND ${VISIBLE_SQL}`), 1)
console.log(`OUT visible=${visible} (published_visible=18 pending_visible=1)`)

// ── 5. 种子结构断言（阶段 2 验收）──────────────────────────────
check('待审核 v2 修改版(submit_count>=2 且有旧版快照)', count("SELECT COUNT(*) AS n FROM tutorials WHERE status='pending' AND submit_count>=2 AND published_content IS NOT NULL"), 1)
check('草稿带驳回原因', count("SELECT COUNT(*) AS n FROM tutorials WHERE status='draft' AND reject_reason IS NOT NULL AND LENGTH(reject_reason)>=5"), 1)
check('已下架保留快照与下架时间', count("SELECT COUNT(*) AS n FROM tutorials WHERE status='offline' AND published_content IS NOT NULL AND last_offline_at IS NOT NULL"), 1)
check('账号 role 分布 admin=1', count("SELECT COUNT(*) AS n FROM users WHERE role='admin'"), 1)
check('账号 role 分布 operator=1', count("SELECT COUNT(*) AS n FROM users WHERE role='operator'"), 1)
check('账号 role 分布 user=6', count("SELECT COUNT(*) AS n FROM users WHERE role='user'"), 6)
check('6 角色演示账号齐备', count("SELECT COUNT(*) AS n FROM users WHERE username IN ('sales','purchase','produce','warehouse','manage','finance') AND password='123456'"), 6)
check('admin/operator 账号', count("SELECT COUNT(*) AS n FROM users WHERE username IN ('admin','operator') AND password='123456'"), 2)
check('12 分类全部启用', count("SELECT COUNT(*) AS n FROM categories WHERE status='enabled' AND parent_id IS NULL"), 12)
check('8 大模块 erp_module 非空', count('SELECT COUNT(*) AS n FROM categories WHERE erp_module IS NOT NULL'), 8)
check('4 通用分类 erp_module 为空', count('SELECT COUNT(*) AS n FROM categories WHERE erp_module IS NULL'), 4)

// 已发布分布（按分类 id 1-12 顺序：3/2/1/3/3/2/1/0/1/1/1/0）
const expectDist = [3, 2, 1, 3, 3, 2, 1, 0, 1, 1, 1, 0]
const pubRows = openDb().prepare(
  "SELECT category_id, COUNT(*) AS n FROM tutorials WHERE status='published' GROUP BY category_id ORDER BY category_id"
).all() as Array<{ category_id: number; n: number }>
expectDist.forEach((exp, i) => {
  const row = pubRows.find((r) => r.category_id === i + 1)
  check(`分类${i + 1} 已发布数`, row?.n ?? 0, exp)
})

// 原型计数口径抽检（MRP 2341/187/96/8；销售订单录入 18/22 劣质示例）
const mrp = openDb().prepare('SELECT view_count, fav_count, helpful_yes, helpful_no FROM tutorials WHERE title LIKE ?').get('MRP 自动算料%') as Record<string, number>
check('MRP 浏览 2341', mrp.view_count, 2341)
check('MRP 收藏 187', mrp.fav_count, 187)
check('MRP 有帮助 96', mrp.helpful_yes, 96)
check('MRP 没帮助 8', mrp.helpful_no, 8)
const v2 = openDb().prepare('SELECT helpful_yes, helpful_no, submit_count FROM tutorials WHERE title=?').get('销售订单录入操作指南') as Record<string, number>
check('销售订单录入 有帮助 18', v2.helpful_yes, 18)
check('销售订单录入 没帮助 22', v2.helpful_no, 22)
check('销售订单录入 submit_count>=2', v2.submit_count >= 2 ? 1 : 0, 1)

// ── 6. 幂等：重开库（模拟重启）不产生重复行（AC-OP-01 第 2 点）──
closeDb()
openDb()
const c2 = tableCounts()
check('重开后 categories 不变', c2.categories, c1.categories)
check('重开后 tutorials 不变', c2.tutorials, c1.tutorials)
check('重开后 users 不变', c2.users, c1.users)
check('重开后 messages 不变', c2.messages, c1.messages)
check('重开后 checkins 不变', c2.checkins, c1.checkins)

// ── 7. reset：事务清空重建后行数一致（AC-NF-06）────────────────
const resetCounts = resetDatabase()
check('reset categories=12', resetCounts.categories, 12)
check('reset tutorials=24', resetCounts.tutorials, 24)
check('reset users=8', resetCounts.users, 8)
check('reset messages=3', resetCounts.messages, 3)
check('reset checkins=5', resetCounts.checkins, 5)
const c3 = tableCounts()
check('reset 后 tutorials 不重复', c3.tutorials, 24)
check('reset 后 users 不重复', c3.users, 8)
check('reset 后仍无收藏脏数据', c3.favorites, 0)
closeDb()

if (failed > 0) {
  console.error(`seed-check FAILED: ${failed} 项断言未通过`)
  process.exit(1)
}
console.log('seed-check PASSED: 全部断言通过')
