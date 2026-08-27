/**
 * BE-03 自测脚本：教程创作写入（POST 新建 / PUT 保存回审+乐观锁 / DELETE 纯草稿删除保护）
 * 服务：http://localhost:3000（编排层启动，本脚本只做接口调用）
 * 运行：node selftest-be03.mjs（退出码 0=全部通过）
 */
import { DatabaseSync } from 'node:sqlite'

const BASE = 'http://localhost:3000'
const DB_PATH = 'D:/code/demo/zcode-demo-smt-yuanbo/server/erp.db'

let passCount = 0
let failCount = 0
const failures = []

function check(name, cond, detail = '') {
  if (cond) {
    passCount++
    console.log(`PASS ${name}${detail ? ' | ' + detail : ''}`)
  } else {
    failCount++
    failures.push(`${name}${detail ? ' | ' + detail : ''}`)
    console.log(`FAIL ${name}${detail ? ' | ' + detail : ''}`)
  }
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let json = null
  try {
    json = await res.json()
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, json }
}

async function main() {
  // ── 登录 ──────────────────────────────────────────────────────────
  const adminToken = (await req('POST', '/api/auth/login', { body: { username: 'admin', password: '123456' } })).json?.data?.token
  const opToken = (await req('POST', '/api/auth/login', { body: { username: 'operator', password: '123456' } })).json?.data?.token
  const salesToken = (await req('POST', '/api/auth/role-login', { body: { erpRole: 'sales' } })).json?.data?.token
  check('登录 admin/operator/sales 三账号', Boolean(adminToken && opToken && salesToken))

  // ── 1. POST 新建（AC-OP-05：创建即草稿） ───────────────────────────
  const mk = (t, o = {}) => ({ title: t, categoryId: 1, ...o })
  const c1 = await req('POST', '/api/tutorials', { token: opToken, body: mk('BE03自测D1 销售订单13态', { summary: 'D1 摘要', content: '<h2>D1 正文</h2>', tags: ['BE03', '自测'] }) })
  const d1 = c1.json?.data
  check('POST 新建（operator）→ 200 status=draft + id/createdAt/updatedAt（AC-OP-05）', c1.status === 200 && d1?.status === 'draft' && Number.isInteger(d1?.id) && d1?.title === 'BE03自测D1 销售订单13态' && d1?.categoryId === 1 && typeof d1?.createdAt === 'string' && typeof d1?.updatedAt === 'string', `status=${c1.status},data=${JSON.stringify(d1)}`)
  const D1 = d1?.id

  // 新建即草稿不可见性
  const pubHit = await req('GET', '/api/tutorials?keyword=BE03%E8%87%AA%E6%B5%8BD1')
  check('新草稿 D1 不进前台列表（AC-OP-05）', !(pubHit.json?.data?.list ?? []).some((x) => x.id === D1))
  const pubDetail = await req('GET', `/api/tutorials/${D1}`)
  check('新草稿 D1 前台详情 404 不可见（AC-RULE-01）', pubDetail.status === 404 && pubDetail.json?.message === '该教程不存在或暂不可见')
  const d1Share = await req('POST', `/api/tutorials/${D1}/share`)
  check('新草稿 D1 share → 404 code=40404（不可见不打点）', d1Share.status === 404 && d1Share.json?.code === 40404)
  const admHit = await req('GET', '/api/tutorials?all=1&keyword=BE03%E8%87%AA%E6%B5%8BD1', { token: adminToken })
  check('管理列表 all=1 可见 D1（status=draft, author=operator）', admHit.json?.data?.list?.some((x) => x.id === D1 && x.status === 'draft' && x.authorId === 2))

  // ── 2. POST 参数/权限校验（AC-RULE-18 保存草稿同样阻断） ───────────
  const eNoTitle = await req('POST', '/api/tutorials', { token: opToken, body: { categoryId: 1 } })
  check('POST 缺 title → 400 请填写标题', eNoTitle.status === 400 && eNoTitle.json?.message === '请填写标题', `status=${eNoTitle.status},msg=${eNoTitle.json?.message}`)
  const eBlank = await req('POST', '/api/tutorials', { token: opToken, body: mk('   ') })
  check('POST 空白 title → 400 请填写标题', eBlank.status === 400 && eBlank.json?.message === '请填写标题')
  const eTitle101 = await req('POST', '/api/tutorials', { token: opToken, body: mk('标'.repeat(101)) })
  check('POST 标题 101 字 → 400 标题不超过 100 字（AC-RULE-18）', eTitle101.status === 400 && eTitle101.json?.message === '标题不超过 100 字')
  const eTitle100 = await req('POST', '/api/tutorials', { token: opToken, body: mk('标'.repeat(100)) })
  check('POST 标题恰 100 字 → 200（边界放行）', eTitle100.status === 200 && eTitle100.json?.data?.status === 'draft')
  const eSum201 = await req('POST', '/api/tutorials', { token: opToken, body: mk('BE03摘要越界', { summary: '摘'.repeat(201) }) })
  check('POST 摘要 201 字 → 400 摘要不超过 200 字（AC-RULE-18）', eSum201.status === 400 && eSum201.json?.message === '摘要不超过 200 字')
  const eSum200 = await req('POST', '/api/tutorials', { token: opToken, body: mk('BE03摘要边界', { summary: '摘'.repeat(200) }) })
  check('POST 摘要恰 200 字 → 200（边界放行）', eSum200.status === 200)
  const eTags6 = await req('POST', '/api/tutorials', { token: opToken, body: mk('BE03标签越界', { tags: ['a', 'b', 'c', 'd', 'e', 'f'] }) })
  check('POST 标签 6 个 → 400 标签最多 5 个（AC-RULE-18）', eTags6.status === 400 && eTags6.json?.message === '标签最多 5 个')
  const eTags5 = await req('POST', '/api/tutorials', { token: opToken, body: mk('BE03标签边界', { tags: ['a', 'b', 'c', 'd', 'e'] }) })
  check('POST 标签恰 5 个 → 200（边界放行）', eTags5.status === 200)
  const eCat = await req('POST', '/api/tutorials', { token: opToken, body: mk('BE03分类不存在', { categoryId: 99999 }) })
  check('POST categoryId 不存在 → 404 所属分类不存在', eCat.status === 404 && eCat.json?.message === '所属分类不存在')
  const eNoCat = await req('POST', '/api/tutorials', { token: opToken, body: { title: 'BE03无分类' } })
  check('POST 缺 categoryId → 404 所属分类不存在', eNoCat.status === 404 && eNoCat.json?.message === '所属分类不存在')
  const eNoAuth = await req('POST', '/api/tutorials', { body: mk('BE03未登录') })
  check('POST 未登录 → 401', eNoAuth.status === 401 && eNoAuth.json?.message === '未登录或登录已失效')
  const eUser = await req('POST', '/api/tutorials', { token: salesToken, body: mk('BE03无权限') })
  check('POST user 角色 → 403 无权限执行该操作', eUser.status === 403 && eUser.json?.message === '无权限执行该操作')

  // ── 3. 草稿反复保存覆盖 + 空摘要/正文草稿（AC-OP-05） ─────────────
  const c2 = await req('POST', '/api/tutorials', { token: opToken, body: { title: 'BE03自测D2 最小草稿', categoryId: 2 } })
  const D2 = c2.json?.data?.id
  check('仅 title+categoryId 的草稿创建成功（摘要/正文可空，必填仅在提审校验）', c2.status === 200 && c2.json?.data?.status === 'draft')
  const u2a = await req('PUT', `/api/tutorials/${D2}`, { token: opToken, body: { summary: 'D2 第一次保存' } })
  check('草稿 PUT 保存仍 draft（AC-OP-05 反复保存）', u2a.status === 200 && u2a.json?.data?.status === 'draft')
  const u2b = await req('PUT', `/api/tutorials/${D2}`, { token: opToken, body: { summary: 'D2 第二次覆盖', content: '<p>D2 正文覆盖</p>' } })
  check('草稿第二次 PUT 覆盖 → 仍 draft', u2b.status === 200 && u2b.json?.data?.status === 'draft')
  const d2view = await req('GET', `/api/tutorials/${D2}?all=1`, { token: opToken })
  check('覆盖生效：all=1 详情 summary/content 为第二次保存值', d2view.json?.data?.summary === 'D2 第二次覆盖' && d2view.json?.data?.content === '<p>D2 正文覆盖</p>', `summary=${d2view.json?.data?.summary}`)

  // ── 4. 停用分类 POST/PUT → 409（AC-RULE-18 仅启用节点） ───────────
  const dis = await req('PUT', '/api/categories/11', { token: adminToken, body: { status: 'disabled' } })
  check('停用分类 11（常见问题）', dis.status === 200)
  if (dis.status === 200) {
    const pDis = await req('POST', '/api/tutorials', { token: opToken, body: mk('BE03停用分类新建', { categoryId: 11 }) })
    check('POST 指向停用分类 → 409 所属分类已停用，请选择启用的分类', pDis.status === 409 && pDis.json?.message === '所属分类已停用，请选择启用的分类', `status=${pDis.status},msg=${pDis.json?.message}`)
    const uDis = await req('PUT', `/api/tutorials/${D2}`, { token: opToken, body: { categoryId: 11 } })
    check('PUT 指向停用分类 → 409 同文案', uDis.status === 409 && uDis.json?.message === '所属分类已停用，请选择启用的分类')
    const d2after = await req('GET', `/api/tutorials/${D2}?all=1`, { token: opToken })
    check('409 后草稿分类未被改动（仍 categoryId=2）', d2after.json?.data?.categoryId === 2)
    const en = await req('PUT', '/api/categories/11', { token: adminToken, body: { status: 'enabled' } })
    check('恢复启用分类 11', en.status === 200)
  }

  // ── 5. 乐观锁（AC-EG-05，任务阶段1“并发回归”前置） ────────────────
  const c3 = await req('POST', '/api/tutorials', { token: opToken, body: mk('并发回归标题', { categoryId: 1 }) })
  const D3 = c3.json?.data?.id
  check('新建“并发回归标题”草稿（阶段1前置）', c3.status === 200)
  const d3list = await req('GET', '/api/tutorials?all=1&keyword=%E5%B9%B6%E5%8F%91%E5%9B%9E%E5%BD%92', { token: opToken })
  const d3row = (d3list.json?.data?.list ?? []).find((x) => x.id === D3)
  const baseTs = d3row?.updatedAt
  check('取 D3 当前 updatedAt 作乐观锁基线', typeof baseTs === 'string' && baseTs.length > 0, `baseUpdatedAt=${baseTs}`)
  const lockBad = await req('PUT', `/api/tutorials/${D3}`, { token: opToken, body: { title: '并发回归标题v2', baseUpdatedAt: '2000-01-01 00:00:00' } })
  check('过期 baseUpdatedAt 保存 → 409 他人已保存新版本，请刷新后合并（AC-EG-05）', lockBad.status === 409 && lockBad.json?.message === '他人已保存新版本，请刷新后合并', `status=${lockBad.status},msg=${lockBad.json?.message}`)
  // datetime('now','localtime') 秒级分辨率：等待 >1s 确保 updated_at 前移，旧基线才会真正过期
  await new Promise((r) => setTimeout(r, 1100))
  const lockOk = await req('PUT', `/api/tutorials/${D3}`, { token: opToken, body: { title: '并发回归标题v2', baseUpdatedAt: baseTs } })
  const newTs = lockOk.json?.data?.updatedAt
  check('正确 baseUpdatedAt 保存 → 200 draft 且 updated_at 前移', lockOk.status === 200 && lockOk.json?.data?.status === 'draft' && typeof newTs === 'string' && newTs > baseTs, `base=${baseTs},new=${newTs}`)
  const lockOld = await req('PUT', `/api/tutorials/${D3}`, { token: opToken, body: { title: '并发回归标题v3', baseUpdatedAt: baseTs } })
  check('用旧基线再次保存 → 409 覆盖告知（版本已前移）', lockOld.status === 409 && lockOld.json?.message === '他人已保存新版本，请刷新后合并')
  const noLock = await req('PUT', `/api/tutorials/${D3}`, { token: opToken, body: { title: '并发回归标题v4' } })
  check('不传 baseUpdatedAt → 200（无锁直存）', noLock.status === 200 && noLock.json?.data?.status === 'draft')

  // ── 6. PUT 分流三态（AC-FN-10 编辑回审 / AC-EG-18） ────────────────
  // 6a. draft → draft（D1）
  const sDraft = await req('PUT', `/api/tutorials/${D1}`, { token: opToken, body: { summary: 'D1 草稿态保存' } })
  check('分流① draft 保存 → 仍 draft', sDraft.status === 200 && sDraft.json?.data?.status === 'draft')
  // 6b. published → pending，前台旧版快照不断供（#4）
  const before4 = await req('GET', '/api/tutorials/4')
  const oldContent4 = before4.json?.data?.content
  const oldSummary4 = before4.json?.data?.summary
  const sPub = await req('PUT', '/api/tutorials/4', { token: opToken, body: { summary: 'BE03 回审期间摘要 v2', content: '<h2>BE03 回审验证新内容 v2</h2>' } })
  check('分流② published(#4) 保存 → pending（AC-FN-10 编辑回审）', sPub.status === 200 && sPub.json?.data?.status === 'pending', `status=${sPub.status},data=${JSON.stringify(sPub.json?.data)}`)
  const after4 = await req('GET', '/api/tutorials/4')
  check('回审期间前台详情仍 200 且 content 为旧版快照（新内容不外泄）', after4.status === 200 && after4.json?.data?.content === oldContent4 && !after4.json.data.content.includes('BE03 回审验证新内容'), `content===old=${after4.json?.data?.content === oldContent4}`)
  check('前台 summary 读 COALESCE 快照回退（CHANGE-3：#4 无 published_summary → 回退当前编辑值）', after4.json?.data?.summary === 'BE03 回审期间摘要 v2', `summary=${after4.json?.data?.summary}`)
  const listAfter = await req('GET', '/api/tutorials?categoryId=1')
  const l4 = (listAfter.json?.data?.list ?? []).find((x) => x.id === 4)
  check('前台列表 #4 仍可见（回审不断供），summary 同回退口径', Boolean(l4) && l4.summary === 'BE03 回审期间摘要 v2')
  const edit4 = await req('GET', '/api/tutorials/4?all=1', { token: adminToken })
  check('管理口径 all=1 详情读当前编辑值（含新内容，status=pending）', edit4.json?.data?.status === 'pending' && edit4.json?.data?.content === '<h2>BE03 回审验证新内容 v2</h2>' && edit4.json?.data?.summary === 'BE03 回审期间摘要 v2')
  // 6c. offline → pending，前台维持不可见（#24，AC-EG-18）
  const sOff = await req('PUT', '/api/tutorials/24', { token: opToken, body: { summary: 'BE03 下架教程编辑保存 v2' } })
  check('分流③ offline(#24) 保存 → pending（进入审核队列）', sOff.status === 200 && sOff.json?.data?.status === 'pending', `status=${sOff.status},data=${JSON.stringify(sOff.json?.data)}`)
  const d24after = await req('GET', '/api/tutorials/24')
  check('已下架来源回审期间前台仍不可见 → 404（AC-EG-18）', d24after.status === 404 && (d24after.json?.message === '该教程不存在或暂不可见' || d24after.json?.message === '该教程已下架'), `status=${d24after.status},msg=${d24after.json?.message}`)
  // 6d. pending → pending 覆盖（D1 已 draft，用 #4 再保存一次验证 pending 覆盖）
  const sPend = await req('PUT', '/api/tutorials/4', { token: opToken, body: { summary: 'BE03 待审覆盖保存 v3' } })
  check('分流④ pending(#4) 再保存 → 保持 pending（覆盖更新）', sPend.status === 200 && sPend.json?.data?.status === 'pending')

  // ── 7. PUT 参数/异常 ──────────────────────────────────────────────
  const puNoAuth = await req('PUT', `/api/tutorials/${D1}`, { body: { summary: 'x' } })
  check('PUT 未登录 → 401', puNoAuth.status === 401)
  const puUser = await req('PUT', `/api/tutorials/${D1}`, { token: salesToken, body: { summary: 'x' } })
  check('PUT user 角色 → 403 无权限执行该操作', puUser.status === 403 && puUser.json?.message === '无权限执行该操作')
  const pu404 = await req('PUT', '/api/tutorials/99999', { token: opToken, body: { summary: 'x' } })
  check('PUT 不存在 id → 404 教程不存在', pu404.status === 404 && pu404.json?.message === '教程不存在')
  const puTitle = await req('PUT', `/api/tutorials/${D1}`, { token: opToken, body: { title: '标'.repeat(101) } })
  check('PUT 标题 101 字 → 400 标题不超过 100 字', puTitle.status === 400 && puTitle.json?.message === '标题不超过 100 字')
  const puTags = await req('PUT', `/api/tutorials/${D1}`, { token: opToken, body: { tags: ['1', '2', '3', '4', '5', '6'] } })
  check('PUT 标签 6 个 → 400 标签最多 5 个', puTags.status === 400 && puTags.json?.message === '标签最多 5 个')
  const puCat = await req('PUT', `/api/tutorials/${D1}`, { token: opToken, body: { categoryId: 99999 } })
  check('PUT categoryId 不存在 → 404 所属分类不存在', puCat.status === 404 && puCat.json?.message === '所属分类不存在')

  // ── 8. DELETE 删除保护（AC-OP-06 / AC-EG-08） ─────────────────────
  const delPub = await req('DELETE', '/api/tutorials/1', { token: opToken })
  check('DELETE 已发布种子 #1 → 403 存在线上过审版本的教程不可删除，请以下架归档代替（AC-OP-06）', delPub.status === 403 && delPub.json?.message === '存在线上过审版本的教程不可删除，请以下架归档代替', `status=${delPub.status},msg=${delPub.json?.message}`)
  const delOffline = await req('DELETE', '/api/tutorials/24', { token: opToken })
  check('DELETE 已下架→回审中 #24（快照仍在）→ 403 删除保护', delOffline.status === 403 && delOffline.json?.message === '存在线上过审版本的教程不可删除，请以下架归档代替')
  // operator 删他人（admin）名下纯草稿 → 403
  const c4 = await req('POST', '/api/tutorials', { token: adminToken, body: mk('BE03自测D4 管理员草稿', { categoryId: 1 }) })
  const D4 = c4.json?.data?.id
  check('admin 新建草稿 D4（author=admin）', c4.status === 200)
  const delOther = await req('DELETE', `/api/tutorials/${D4}`, { token: opToken })
  check('operator 删他人(admin)名下纯草稿 → 403 无权限执行该操作（AC-EG-08）', delOther.status === 403 && delOther.json?.message === '无权限执行该操作', `status=${delOther.status},msg=${delOther.json?.message}`)
  const d4still = await req('GET', `/api/tutorials/${D4}?all=1`, { token: adminToken })
  check('被拒后 D4 仍存在（列表中仍在）', d4still.status === 200 && d4still.json?.data?.id === D4)
  const delByAdmin = await req('DELETE', `/api/tutorials/${D4}`, { token: adminToken })
  check('admin 删任意纯草稿 D4 → 200 已删除 data=null（AC-RULE-23）', delByAdmin.status === 200 && delByAdmin.json?.code === 0 && delByAdmin.json?.message === '已删除' && delByAdmin.json?.data === null, `body=${JSON.stringify(delByAdmin.json)}`)
  const d4gone = await req('GET', `/api/tutorials/${D4}?all=1`, { token: adminToken })
  const d4list = await req('GET', '/api/tutorials?all=1&keyword=BE03%E8%87%AA%E6%B5%8BD4', { token: adminToken })
  check('删除后管理列表不再返回 D4（AC-OP-06 列表移除）', d4gone.status === 404 && !(d4list.json?.data?.list ?? []).some((x) => x.id === D4))
  // operator 删本人纯草稿 → 200
  const delOwn = await req('DELETE', `/api/tutorials/${D2}`, { token: opToken })
  check('operator 删本人纯草稿 D2 → 200 已删除', delOwn.status === 200 && delOwn.json?.message === '已删除')
  const del404 = await req('DELETE', '/api/tutorials/99999', { token: opToken })
  check('DELETE 不存在 id → 404 教程不存在', del404.status === 404 && del404.json?.message === '教程不存在')
  const delNoAuth = await req('DELETE', `/api/tutorials/${D1}`, { body: {} })
  check('DELETE 未登录 → 401', delNoAuth.status === 401)
  const delUser = await req('DELETE', `/api/tutorials/${D1}`, { token: salesToken })
  check('DELETE user 角色 → 403', delUser.status === 403)

  // ── 9. videoUrl null 清除 + tags JSON 落库/反序列化 ───────────────
  const c5 = await req('POST', '/api/tutorials', { token: opToken, body: mk('BE03自测D5 视频与标签', { categoryId: 1, videoUrl: 'https://cdn.example.com/be03.mp4', tags: ['标签甲', '标签乙'] }) })
  const D5 = c5.json?.data?.id
  const v5a = await req('GET', `/api/tutorials/${D5}?all=1`, { token: opToken })
  check('D5 videoUrl 落库 + tags 反序列化为数组', v5a.json?.data?.videoUrl === 'https://cdn.example.com/be03.mp4' && JSON.stringify(v5a.json?.data?.tags) === '["标签甲","标签乙"]', `tags=${JSON.stringify(v5a.json?.data?.tags)}`)
  const v5clear = await req('PUT', `/api/tutorials/${D5}`, { token: opToken, body: { videoUrl: null } })
  const v5b = await req('GET', `/api/tutorials/${D5}?all=1`, { token: opToken })
  check('PUT videoUrl=null 清除外链 → videoUrl=null', v5clear.status === 200 && v5b.json?.data?.videoUrl === null, `videoUrl=${v5b.json?.data?.videoUrl}`)
  const delD5 = await req('DELETE', `/api/tutorials/${D5}`, { token: opToken })
  check('清理 D5 → 200', delD5.status === 200)

  // ── 10. 持久化：sqlite 只读直查（快照列不变 / status / updated_at） ─
  let dbCheck = 'SKIP'
  try {
    const db = new DatabaseSync(DB_PATH, { readOnly: true })
    const r4 = db.prepare("SELECT status, published_content, published_summary, updated_at, summary, content FROM tutorials WHERE id = 4").get()
    const r1 = db.prepare("SELECT view_count FROM tutorials WHERE id = 1").get()
    db.close()
    const snapOk = typeof r4.published_content === 'string' && r4.published_content.includes('第 1 步') && !r4.published_content.includes('BE03')
    const workOk = r4.summary === 'BE03 待审覆盖保存 v3' && r4.content === '<h2>BE03 回审验证新内容 v2</h2>'
    dbCheck = `status=${r4.status},snapOk=${snapOk},workOk=${workOk},#1存在=${Number.isInteger(r1?.view_count)},updated=${r4.updated_at}`
    check('sqlite 直查：#4 status=pending、快照列未被触碰、编辑值已落库（AC-FN-10 持久化）', r4.status === 'pending' && snapOk && workOk && r4.updated_at !== '2026-08-13 17:26:00', dbCheck)
    check('sqlite 直查：被保护删除的 #1 仍在库（删除保护未误删）', Number.isInteger(r1?.view_count))
  } catch (e) {
    check('sqlite 只读直查（只读连接失败则记录环境限制）', false, `ERROR=${e.message}`)
  }

  console.log('─'.repeat(60))
  console.log(`BE-03 TOTAL: pass=${passCount} fail=${failCount}`)
  if (failures.length) {
    console.log('FAILED CASES:')
    failures.forEach((f) => console.log(' - ' + f))
  }
  process.exit(failCount === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('SCRIPT ERROR:', e)
  process.exit(2)
})
