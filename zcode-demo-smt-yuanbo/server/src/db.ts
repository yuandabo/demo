/**
 * 数据库连接与生命周期（INFRA-03）
 * 职责：建库（执行 docs/design/sql/*.sql 幂等 DDL）+ 种子初始化 + reset 重建 + 导出可见性 WHERE 片段。
 * 交付形态：单文件 server/erp.db，删除后重启即重建（AC-NF-06）。
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { insertSeed } from './seed.js'

/** 数据库文件：server/erp.db（src 与 dist 两种运行目录下均指向 server 根） */
export const DB_PATH = path.resolve(import.meta.dirname, '../erp.db')

/** DDL 真源：docs/design/sql/*.sql（建表顺序满足引用关系：主表在前、行为表在后） */
const SQL_DIR = path.resolve(import.meta.dirname, '../../docs/design/sql')
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

/** reset 清空顺序：行为表在前、主表在后（无外键约束，顺序为防御性约定） */
const RESET_TABLES = [
  'favorites',
  'histories',
  'feedbacks',
  'checkins',
  'messages',
  'auth_tokens',
  'tutorials',
  'categories',
  'users',
] as const

/** 存在 AUTOINCREMENT 的表（reset 时同步清零 sqlite_sequence，保证固定 id 重建） */
const AUTOINCREMENT_TABLES = ['users', 'categories', 'tutorials', 'messages', 'checkins'] as const

/**
 * 前台可见性 WHERE 片段（tech-design.md#4 核心链路 2，PRD §6 规则①-⑤的 SQL 化）：
 * ① 已发布可见 ② 回审等待/驳回/撤回期间旧版在线 ③ 已下架不可见 ④ 已下架来源回审期间不可见 ⑤ 从未过审不可见。
 * 列表/搜索/详情/推荐/首页区块/小程序共用，杜绝口径漂移。
 */
export const VISIBLE_SQL =
  "published_content IS NOT NULL AND (status='published' OR (status IN ('pending','draft') AND last_offline_at IS NULL))"

/** 种子计数口径（BE-02 / POST /api/system/reset 响应体直接复用） */
export interface SeedCounts {
  categories: number
  tutorials: number
  users: number
  messages: number
  checkins: number
}

let instance: DatabaseSync | null = null

/**
 * 获取数据库连接（进程内单例）：
 * 首次调用建库（DDL 幂等可重复执行）+ 空库时写种子；再次调用直接复用。
 * SQL 文件缺失或语法错误时启动即抛错退出（fail fast，错误信息含文件名）。
 */
export function openDb(): DatabaseSync {
  if (instance) return instance
  const db = new DatabaseSync(DB_PATH)
  try {
    runDdl(db)
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number }
    if (n === 0) {
      insertSeed(db)
    }
  } catch (err) {
    db.close()
    throw err
  }
  instance = db
  return db
}

/** 关闭连接（脚本/测试用；运行期服务不调用） */
export function closeDb(): void {
  if (instance) {
    instance.close()
    instance = null
  }
}

/**
 * 重置数据库：事务内清空 9 表（含自增序列归零）→ 重写种子 → 返回各表计数。
 * 供 POST /api/system/reset（BE-02）调用；失败回滚，数据保持原状。
 */
export function resetDatabase(): SeedCounts {
  const db = openDb()
  db.exec('BEGIN')
  try {
    for (const table of RESET_TABLES) {
      db.exec(`DELETE FROM ${table}`)
    }
    db.exec(`DELETE FROM sqlite_sequence WHERE name IN (${AUTOINCREMENT_TABLES.map((t) => `'${t}'`).join(',')})`)
    insertSeed(db)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
  return countSeedTables(db)
}

function runDdl(db: DatabaseSync): void {
  for (const file of DDL_FILES) {
    const sql = readFileSync(path.join(SQL_DIR, file), 'utf8')
    try {
      db.exec(sql)
    } catch (err) {
      throw new Error(`DDL 执行失败：${file}（${err instanceof Error ? err.message : String(err)}）`)
    }
  }
}

function countSeedTables(db: DatabaseSync): SeedCounts {
  const countOf = (table: string): number =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n
  return {
    categories: countOf('categories'),
    tutorials: countOf('tutorials'),
    users: countOf('users'),
    messages: countOf('messages'),
    checkins: countOf('checkins'),
  }
}
