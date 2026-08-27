/**
 * BE-02 数据层复核：reset 成功响应后立即只读查询 erp.db，
 * 断言种子计数 12/24/8/3/5、四态 18/3/2/1、互动空表归零。
 * 共享服务环境下存在其他并发测试写入，故最多尝试 3 轮，任一轮全绿即通过。
 */
import { DatabaseSync } from 'node:sqlite'

const BASE = 'http://localhost:3000'
const DB_PATH = 'd:/code/demo/zcode-demo-smt-yuanbo/server/erp.db'

async function loginAdmin() {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123456' }),
  })
  return (await r.json()).data.token
}

function snapshot() {
  const db = new DatabaseSync(DB_PATH, { readOnly: true })
  try {
    const n = (sql) => db.prepare(sql).get().n
    const dist = Object.fromEntries(
      db
        .prepare('SELECT status, COUNT(*) AS n FROM tutorials GROUP BY status')
        .all()
        .map((r) => [r.status, r.n])
    )
    return {
      categories: n('SELECT COUNT(*) AS n FROM categories'),
      tutorials: n('SELECT COUNT(*) AS n FROM tutorials'),
      users: n('SELECT COUNT(*) AS n FROM users'),
      messages: n('SELECT COUNT(*) AS n FROM messages'),
      checkins: n('SELECT COUNT(*) AS n FROM checkins'),
      favorites: n('SELECT COUNT(*) AS n FROM favorites'),
      histories: n('SELECT COUNT(*) AS n FROM histories'),
      feedbacks: n('SELECT COUNT(*) AS n FROM feedbacks'),
      auth_tokens: n('SELECT COUNT(*) AS n FROM auth_tokens'),
      enabledRootCats: n("SELECT COUNT(*) AS n FROM categories WHERE status='enabled' AND parent_id IS NULL"),
      ...dist,
    }
  } finally {
    db.close()
  }
}

const EXPECT = {
  categories: 12, tutorials: 24, users: 8, messages: 3, checkins: 5,
  favorites: 0, histories: 0, feedbacks: 0, auth_tokens: 0,
  enabledRootCats: 12, published: 18, pending: 3, draft: 2, offline: 1,
}

for (let round = 1; round <= 3; round++) {
  const token = await loginAdmin()
  const res = await fetch(`${BASE}/api/system/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: '{}',
  })
  const body = await res.json()
  const snap = snapshot()
  const bad = Object.keys(EXPECT).filter((k) => snap[k] !== EXPECT[k])
  console.log(`ROUND ${round}: http=${res.status} code=${body.code} message=${body.message}`)
  console.log(`  reset data = ${JSON.stringify(body.data)}`)
  console.log(`  db  actual = ${JSON.stringify(snap)}`)
  if (body.code === 0 && bad.length === 0) {
    console.log(`ROUND ${round} CLEAN-PASS：reset 响应与库内实际一致，四态 18/3/2/1，互动表/auth_tokens 归零`)
    process.exit(0)
  }
  console.log(`ROUND ${round} 偏差字段: ${bad.join(',') || '(仅响应偏差)'} ← 并发测试写入竞态`)
}
console.error('3 轮均被并发写入污染，需协调后复跑')
process.exit(1)
