/**
 * 分类管理 service 单测（IT-02/BE-01，冻结命名 getCategoryTree/createCategory/updateCategory/deleteCategory）
 * oracle：真实种子固定值——#1 销售管理下 4 篇（3 已发布 + #19 回审旧版在线）、#20 首次待审无快照、
 * #22 纯草稿、#24 已下架；种子 12 分类全启用、无二级。不触碰 server/erp.db，:memory: 独立建库。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { insertSeed } from './seed.js'
import { createCategory, deleteCategory, getCategoryTree, updateCategory } from './routes/categories.js'
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

const DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

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

/** HttpError 精确断言（状态码 + 字面文案，契约文案不允许漂移） */
function expectHttpError(status: number, message: string) {
  return (err: unknown): boolean => err instanceof HttpError && err.status === status && err.message === message
}

// ── GET 树（getCategoryTree）────────────────────────────────────────

test('前台树默认：12 个启用一级分类按 sort 升序、无 children、不带 tutorialCount 字段', () => {
  const db = buildDb()
  try {
    const { list } = getCategoryTree(db, { withCount: false, includeDisabled: false })
    assert.equal(list.length, 12)
    assert.deepEqual(
      list.map((node) => node.name).slice(0, 3),
      ['销售管理', '项目管理', '文件管理']
    )
    assert.deepEqual(list.map((node) => node.sort), Array.from({ length: 12 }, (_, i) => i + 1))
    for (const node of list) {
      assert.deepEqual(node.children, [])
      assert.equal('tutorialCount' in node, false, 'withCount 缺省不出现 tutorialCount 键')
      assert.equal(node.parentId, null)
      assert.equal(node.status, 'enabled')
    }
    // CHANGE-2：模块映射枚举回显（file/inventory/hrFinance）
    assert.deepEqual(
      list.map((node) => node.erpModule).slice(2, 7),
      ['file', 'produce', 'purchase', 'inventory', 'hrFinance']
    )
  } finally {
    db.close()
  }
})

test('停用过滤：停用一级前台树整棵隐藏，all 口径返回全量含停用（AC-RULE-06/07）', () => {
  const db = buildDb()
  try {
    db.prepare("UPDATE categories SET status = 'disabled' WHERE id = 8").run()
    const front = getCategoryTree(db, { withCount: false, includeDisabled: false })
    assert.equal(front.list.length, 11)
    assert.equal(front.list.some((node) => node.name === '系统设置'), false)

    const all = getCategoryTree(db, { withCount: false, includeDisabled: true })
    assert.equal(all.list.length, 12)
    const disabled = all.list.find((node) => node.id === 8)
    assert.equal(disabled?.status, 'disabled')
  } finally {
    db.close()
  }
})

test('withCount 角标走 VISIBLE_SQL 口径：回审旧版在线计入、首次待审/纯草稿/已下架不计入', () => {
  const db = buildDb()
  try {
    const { list } = getCategoryTree(db, { withCount: true, includeDisabled: false })
    const count = new Map(list.map((node) => [node.name, node.tutorialCount]))
    assert.equal(count.get('销售管理'), 4, '3 已发布 + #19 回审期间旧版在线（规则②）')
    assert.equal(count.get('生产制造'), 3, '#20 首次待审无快照不计入（规则⑤）')
    assert.equal(count.get('采购管理'), 3, '#24 已下架不计入（规则③）')
    assert.equal(count.get('库存管理'), 2, '#22 纯草稿不计入（规则⑤）')
    assert.equal(count.get('系统设置'), 0, '0 篇前端显示待补充')
  } finally {
    db.close()
  }
})

test('二级分类角标：二级=直接计数，一级=自身+其树内子分类汇总；停用子分类不计入父级角标', () => {
  const db = buildDb()
  try {
    const child = createCategory(db, { name: '销售订单', parentId: 1, sort: 1, erpModule: 'sales' })
    db.prepare('UPDATE tutorials SET category_id = ? WHERE id = 5').run(child.id)

    const tree = getCategoryTree(db, { withCount: true, includeDisabled: false })
    const sales = tree.list.find((node) => node.id === 1)
    assert.equal(sales?.children.length, 1)
    assert.equal(sales?.children[0].tutorialCount, 1, '二级为本分类直接计数')
    assert.equal(sales?.tutorialCount, 4, '一级汇总：自身 3（#4/#14/#19）+ 子分类 1（#5）')

    updateCategory(db, child.id, { status: 'disabled' })
    const filtered = getCategoryTree(db, { withCount: true, includeDisabled: false })
    const salesFront = filtered.list.find((node) => node.id === 1)
    assert.equal(salesFront?.children.length, 0, '停用二级从筛选树隐藏（AC-RULE-07）')
    assert.equal(salesFront?.tutorialCount, 3, '停用子分类下教程不计入启用父级角标')

    const managed = getCategoryTree(db, { withCount: true, includeDisabled: true })
    const salesAll = managed.list.find((node) => node.id === 1)
    assert.equal(salesAll?.children.length, 1)
    assert.equal(salesAll?.tutorialCount, 4, 'all=1 管理口径含停用子分类')
  } finally {
    db.close()
  }
})

// ── POST 新增（createCategory）──────────────────────────────────────

test('新增最小入参：一级分类默认 sort=0 / status=enabled / erpModule=null，返回 createdAt', () => {
  const db = buildDb()
  try {
    const created = createCategory(db, { name: '  报表中心  ' })
    assert.equal(created.id, 13, 'AUTOINCREMENT 续种子序号')
    assert.equal(created.name, '报表中心', 'name 落库前 trim')
    assert.equal(created.parentId, null)
    assert.equal(created.sort, 0)
    assert.equal(created.status, 'enabled')
    assert.equal(created.erpModule, null)
    assert.match(created.createdAt, DATETIME_RE)
  } finally {
    db.close()
  }
})

test('新增全参：parentId 挂一级、sort 边界 9999、erpModule 契约枚举、显式 status', () => {
  const db = buildDb()
  try {
    const created = createCategory(db, { name: '销售订单', parentId: 1, sort: 9999, erpModule: 'hrFinance', status: 'disabled' })
    assert.deepEqual(
      { parentId: created.parentId, sort: created.sort, erpModule: created.erpModule, status: created.status },
      { parentId: 1, sort: 9999, erpModule: 'hrFinance', status: 'disabled' }
    )
    assert.equal(createCategory(db, { name: '边界0', sort: 0 }).sort, 0)
  } finally {
    db.close()
  }
})

test('新增校验失败矩阵：name/parentId/erpModule/sort 逐条精确断言文案', () => {
  const db = buildDb()
  try {
    const longName = '分'.repeat(51)
    const cases: ReadonlyArray<[string, Record<string, unknown>, number, string]> = [
      ['name 缺失', {}, 400, '分类名称不能为空且不超过 50 字'],
      ['name 空白', { name: '   ' }, 400, '分类名称不能为空且不超过 50 字'],
      ['name 超 50 字', { name: longName }, 400, '分类名称不能为空且不超过 50 字'],
      ['name 非字符串', { name: 123 }, 400, '分类名称不能为空且不超过 50 字'],
      ['parentId 不存在', { name: 'X', parentId: 999 }, 404, '父分类不存在'],
      ['parentId 非正整数', { name: 'X', parentId: 'abc' }, 404, '父分类不存在'],
      ['erpModule 非枚举（warehouse 是角色不是模块，CHANGE-2）', { name: 'X', erpModule: 'warehouse' }, 400, 'erpModule 参数不合法'],
      ['sort 超上限', { name: 'X', sort: 10000 }, 400, '查询参数不合法'],
      ['sort 负数', { name: 'X', sort: -1 }, 400, '查询参数不合法'],
      ['sort 小数', { name: 'X', sort: 3.5 }, 400, '查询参数不合法'],
      ['sort 字符串', { name: 'X', sort: '5' }, 400, '查询参数不合法'],
    ]
    for (const [label, body, status, message] of cases) {
      assert.throws(() => createCategory(db, body), expectHttpError(status, message), label)
    }
  } finally {
    db.close()
  }
})

test('新增限两级：parentId 指向二级分类 → 400 字面文案（AC-OP-08 本期限两级）', () => {
  const db = buildDb()
  try {
    const child = createCategory(db, { name: '销售订单', parentId: 1 })
    assert.throws(
      () => createCategory(db, { name: '三级分类', parentId: child.id }),
      expectHttpError(400, '本期限两级分类，父分类必须为一级分类')
    )
  } finally {
    db.close()
  }
})

// ── PUT 编辑（updateCategory）───────────────────────────────────────

test('编辑字段与刷新 updatedAt：name/sort/status/erpModule 不传不改，传 null 解除模块映射（AC-OP-04）', () => {
  const db = buildDb()
  try {
    const before = updateCategory(db, 9, { erpModule: 'sales' })
    assert.equal(before.erpModule, 'sales')
    assert.notEqual(before.updatedAt, '2026-07-01 08:00:00', '保存成功即刷新 updated_at')
    assert.match(before.updatedAt, DATETIME_RE)

    const cleared = updateCategory(db, 9, { erpModule: null })
    assert.equal(cleared.erpModule, null, 'null=解除映射')
    assert.deepEqual(
      { name: cleared.name, sort: cleared.sort, status: cleared.status },
      { name: '新手入门', sort: 9, status: 'enabled' },
      '未传字段保持原值'
    )

    const toggled = updateCategory(db, 9, { name: '新手村', sort: 20, status: 'disabled' })
    assert.deepEqual(
      { name: toggled.name, sort: toggled.sort, status: toggled.status },
      { name: '新手村', sort: 20, status: 'disabled' }
    )
  } finally {
    db.close()
  }
})

test('编辑 parentId：null 提升为一级；指向自身/其子分类 400 防环；指向他人二级 400 限两级；不存在 404', () => {
  const db = buildDb()
  try {
    const child = createCategory(db, { name: '销售订单', parentId: 1 })
    assert.throws(
      () => updateCategory(db, 1, { parentId: 1 }),
      expectHttpError(400, '不允许将分类移动到自身或其子分类下'),
      '指向自身'
    )
    assert.throws(
      () => updateCategory(db, 1, { parentId: child.id }),
      expectHttpError(400, '不允许将分类移动到自身或其子分类下'),
      '一级指向其子分类（任务验收防环场景）'
    )

    const promoted = updateCategory(db, child.id, { parentId: null })
    assert.equal(promoted.parentId, null, 'null 提升为一级')
    // 挂回 1 下，作为"他人二级"给 cat 9 引用
    updateCategory(db, child.id, { parentId: 1 })
    assert.throws(
      () => updateCategory(db, 9, { parentId: child.id }),
      expectHttpError(400, '本期限两级分类，父分类必须为一级分类'),
      '指向非自身子树的二级'
    )
    assert.throws(
      () => updateCategory(db, 9, { parentId: 999 }),
      expectHttpError(404, '父分类不存在')
    )
  } finally {
    db.close()
  }
})

test('编辑校验失败矩阵：id 不存在 404、name/status/sort 非法 400 文案', () => {
  const db = buildDb()
  try {
    assert.throws(() => updateCategory(db, 999, { name: 'X' }), expectHttpError(404, '分类不存在'))
    const cases: ReadonlyArray<[string, Record<string, unknown>, number, string]> = [
      ['name 空白', { name: ' ' }, 400, '分类名称不能为空且不超过 50 字'],
      ['name 超 50 字', { name: '分'.repeat(51) }, 400, '分类名称不能为空且不超过 50 字'],
      ['status 非枚举', { status: 'paused' }, 400, 'status 参数不合法'],
      ['erpModule 非枚举', { erpModule: 'finance' }, 400, 'erpModule 参数不合法'],
      ['sort 超上限', { sort: 10000 }, 400, '查询参数不合法'],
    ]
    for (const [label, body, status, message] of cases) {
      assert.throws(() => updateCategory(db, 1, body), expectHttpError(status, message), label)
    }
  } finally {
    db.close()
  }
})

test('编辑 parentId 限两级：带子分类的一级挂到另一一级分类下 → 400（防三级树）', () => {
  const db = buildDb()
  try {
    createCategory(db, { name: '销售订单', parentId: 1 })
    assert.throws(
      () => updateCategory(db, 1, { parentId: 2 }),
      expectHttpError(400, '本期限两级分类，父分类必须为一级分类'),
      '一级 1（含子分类）挂到一级 2 下，其子分类将变三级'
    )
    // 对照：无子分类的一级挂到另一一级下合法（自身变二级，仍在两级内，不过度拦截）
    assert.equal(updateCategory(db, 9, { parentId: 2 }).parentId, 2)
  } finally {
    db.close()
  }
})

// ── DELETE 删除保护（deleteCategory，AC-FN-13）──────────────────────

test('删除保护：销售管理下 4 篇任意状态教程 → 409 字面文案且分类仍在树中', () => {
  const db = buildDb()
  try {
    assert.throws(() => deleteCategory(db, 1), expectHttpError(409, '该分类下还有 4 篇教程，请先移走'))
    const still = db.prepare('SELECT COUNT(*) AS n FROM categories WHERE id = 1').get() as { n: number }
    assert.equal(Number(still.n), 1, 'AC-FN-13：分类树中该分类仍存在')
  } finally {
    db.close()
  }
})

test('删除保护口径：子分类下教程计入父级 N，且教程判定优先于子分类判定', () => {
  const db = buildDb()
  try {
    const parent = createCategory(db, { name: '空壳一级' })
    const child = createCategory(db, { name: '空壳二级', parentId: parent.id })
    db.prepare('UPDATE tutorials SET category_id = ? WHERE id = 1').run(child.id)
    assert.throws(
      () => deleteCategory(db, parent.id),
      expectHttpError(409, '该分类下还有 1 篇教程，请先移走'),
      '含子分类汇总计数，且优先于"存在子分类"文案'
    )
  } finally {
    db.close()
  }
})

test('删除保护：存在子分类但无教程 → 409 字面文案（工程兜底）', () => {
  const db = buildDb()
  try {
    const parent = createCategory(db, { name: '带子一级' })
    createCategory(db, { name: '带子二级', parentId: parent.id })
    assert.throws(() => deleteCategory(db, parent.id), expectHttpError(409, '该分类下存在子分类，请先处理'))
  } finally {
    db.close()
  }
})

test('空分类物理删除成功；id 不存在 404', () => {
  const db = buildDb()
  try {
    const empty = createCategory(db, { name: '待删除' })
    deleteCategory(db, empty.id)
    const gone = db.prepare('SELECT COUNT(*) AS n FROM categories WHERE id = ?').get(empty.id) as { n: number }
    assert.equal(Number(gone.n), 0)
    assert.throws(() => deleteCategory(db, 999), expectHttpError(404, '分类不存在'))
  } finally {
    db.close()
  }
})
