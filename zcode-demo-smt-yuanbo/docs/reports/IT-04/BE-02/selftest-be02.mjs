/**
 * BE-02 自测脚本：教程查询接口（GET 列表双口径 / GET 详情快照 / POST share 打点）
 * 服务：http://localhost:3000（编排层启动，本脚本只做接口调用）
 * 运行：node selftest-be02.mjs（退出码 0=全部通过）
 */
const BASE = 'http://localhost:3000'

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
    /* 非 JSON 响应 */
  }
  return { status: res.status, json }
}

const pub19Summary = '订单录入四步走：选客户、填明细、过校验、提交打印，附价格与信用拦截处理办法。'

async function main() {
  // ── 登录 ──────────────────────────────────────────────────────────
  const adminLogin = await req('POST', '/api/auth/login', { body: { username: 'admin', password: '123456' } })
  const adminToken = adminLogin.json?.data?.token
  const opLogin = await req('POST', '/api/auth/login', { body: { username: 'operator', password: '123456' } })
  const opToken = opLogin.json?.data?.token
  const salesLogin = await req('POST', '/api/auth/role-login', { body: { erpRole: 'sales' } })
  const salesToken = salesLogin.json?.data?.token
  check('登录 admin/operator/sales 三账号', Boolean(adminToken && opToken && salesToken))

  // ── 1. 公开列表正向（默认参数） ────────────────────────────────────
  const def = await req('GET', '/api/tutorials')
  check('默认列表 200 + code=0 + 信封结构', def.status === 200 && def.json?.code === 0 && def.json?.message === 'ok' && def.json?.data, `status=${def.status}`)
  const defList = def.json?.data?.list ?? []
  const ids = defList.map((x) => x.id)
  const inVisiblePool = (arr) => ![20, 21, 22, 23, 24].some((bad) => arr.includes(bad))
  check('分页默认 page=1/pageSize=10/list 长度 10', def.json?.data?.page === 1 && def.json?.data?.pageSize === 10 && defList.length === 10, `page=${def.json?.data?.page},pageSize=${def.json?.data?.pageSize},len=${defList.length}`)
  check('公开池 total=19（18 发布 + 1 回审旧版在线）', def.json?.data?.total === 19, `total=${def.json?.data?.total}`)
  check('首页不含首次待审(20,21)/草稿(22,23)/已下架(24)（AC-RULE-01/02/04）', inVisiblePool(ids), `ids=${ids.join(',')}`)
  check('含回审中教程 19（回审来源已发布，旧版在线，AC-RULE-02/AC-FN-10）', ids.includes(19))
  const row19 = defList.find((x) => x.id === 19)
  check('列表 #19 summary 读 published_summary 快照（CHANGE-3）', row19?.summary === pub19Summary, `summary=${row19?.summary}`)
  check('公开卡片不含管理扩展列 status', defList.every((x) => x.status === undefined))
  check('tags 反序列化为数组', defList.every((x) => Array.isArray(x.tags)))
  check('卡片含 categoryName/isTop/viewCount 等业务字段', defList.every((x) => typeof x.categoryName === 'string' && typeof x.isTop === 'number' && typeof x.viewCount === 'number'))

  // ── 2. keyword 三字段命中（AC-RULE-02 检索范围=可见池） ────────────
  const kwTitle = await req('GET', '/api/tutorials?keyword=%E5%BA%93%E4%BD%8D') // 库位：#6 标题
  const kwTitleIds = kwTitle.json?.data?.list?.map((x) => x.id) ?? []
  check('keyword 命中标题（库位→#6 在结果）', kwTitle.status === 200 && kwTitleIds.includes(6), `ids=${kwTitleIds.join(',')}`)
  const kwSummary = await req('GET', '/api/tutorials?keyword=%E7%AD%BE%E6%94%B6') // 签收：#4 摘要
  const kwSummaryIds = kwSummary.json?.data?.list?.map((x) => x.id) ?? []
  check('keyword 命中摘要（签收→#4 在结果）', kwSummaryIds.includes(4), `ids=${kwSummaryIds.join(',')}`)
  const kwTag = await req('GET', '/api/tutorials?keyword=FAQ') // FAQ：#17 标签
  const kwTagIds = kwTag.json?.data?.list?.map((x) => x.id) ?? []
  check('keyword 命中标签（FAQ→#17 在结果）', kwTagIds.includes(17), `ids=${kwTagIds.join(',')}`)
  const kwMrp = await req('GET', '/api/tutorials?keyword=MRP&page=1&pageSize=10')
  const kwMrpIds = kwMrp.json?.data?.list?.map((x) => x.id) ?? []
  check('keyword=MRP 仅可见池命中 3/5/12/17（任务阶段1用例）', kwMrp.status === 200 && kwMrpIds.includes(3) && kwMrpIds.includes(12) && kwMrpIds.includes(17) && kwMrpIds.every((id) => [3, 12, 17].includes(id)) && kwMrp.json?.data?.total === 3, `ids=${kwMrpIds.join(',')},total=${kwMrp.json?.data?.total}`)
  const kwDraft = await req('GET', '/api/tutorials?keyword=%E9%87%8C%E7%A8%8B%E7%A2%91') // 里程碑：#23 纯草稿标题词
  check('keyword 不命中纯草稿 #23（AC-RULE-01，可见池仅 #15 合法命中）', !(kwDraft.json?.data?.list ?? []).some((x) => x.id === 23) && (kwDraft.json?.data?.list ?? []).every((x) => x.id === 15), `ids=${(kwDraft.json?.data?.list ?? []).map((x) => x.id).join(',')}`)

  // ── 3. tag 精确与多值交集 ─────────────────────────────────────────
  const tagSingle = await req('GET', '/api/tutorials?tag=%E7%AE%97%E6%96%99') // 算料
  const tagSingleIds = tagSingle.json?.data?.list?.map((x) => x.id).sort((a, b) => a - b) ?? []
  check('tag=算料 命中 #3/#11', JSON.stringify(tagSingleIds) === '[3,11]', `ids=${tagSingleIds.join(',')}`)
  const tagInter = await req('GET', '/api/tutorials?tag=%E6%8A%A5%E5%B7%A5,%E6%89%AB%E7%A0%81') // 报工,扫码
  const tagInterIds = tagInter.json?.data?.list?.map((x) => x.id) ?? []
  check('tag=报工,扫码 交集过滤 → 仅 #2', JSON.stringify(tagInterIds) === '[2]', `ids=${tagInterIds.join(',')}`)
  const tagEmpty = await req('GET', '/api/tutorials?tag=MRP,BOM')
  check('tag=MRP,BOM 交集为空 → total=0（#12 有 MRP 无 BOM，#3/#11 有 BOM 无 MRP）', tagEmpty.json?.data?.total === 0, `total=${tagEmpty.json?.data?.total}`)

  // ── 4. categoryId / top / sort ────────────────────────────────────
  const cat1 = await req('GET', '/api/tutorials?categoryId=1')
  const cat1Ids = cat1.json?.data?.list?.map((x) => x.id).sort((a, b) => a - b) ?? []
  check('categoryId=1 → 4/5/14/19 四篇（total=4）', JSON.stringify(cat1Ids) === '[4,5,14,19]' && cat1.json?.data?.total === 4, `ids=${cat1Ids.join(',')},total=${cat1.json?.data?.total}`)
  const top = await req('GET', '/api/tutorials?top=1')
  const topIds = top.json?.data?.list?.map((x) => x.id) ?? []
  check('top=1 → 仅 #3（AC-RULE-17 置顶）', JSON.stringify(topIds) === '[3]', `ids=${topIds.join(',')}`)
  const hot = await req('GET', '/api/tutorials?sort=hot&pageSize=5')
  const hotIds = hot.json?.data?.list?.map((x) => x.id) ?? []
  check('sort=hot → 置顶 #3 最前，其后按 viewCount 降序 #1/#2/#5/#6', hotIds.length >= 5 && hotIds[0] === 3 && hotIds[1] === 1 && hotIds[2] === 2 && hotIds[3] === 5 && hotIds[4] === 6, `ids=${hotIds.join(',')}`)
  const latest = await req('GET', '/api/tutorials?sort=latest&pageSize=5')
  const latestIds = latest.json?.data?.list?.map((x) => x.id) ?? []
  check('sort=latest → #3 置顶最前，第二位 #19（sort=50 最小）', latestIds[0] === 3 && latestIds[1] === 19, `ids=${latestIds.join(',')}`)
  check('latest 与 hot 排序存在差异', JSON.stringify(hotIds.slice(0, 5)) !== JSON.stringify(latestIds.slice(0, 5)))

  // ── 5. 分页与查询参数边界 ─────────────────────────────────────────
  const pg = await req('GET', '/api/tutorials?page=1&pageSize=1')
  check('page=1&pageSize=1 正常（list=1，total 不变）', pg.status === 200 && pg.json?.data?.list?.length === 1 && pg.json?.data?.total === 19)
  check('pageSize=101 → 400 查询参数不合法', (await req('GET', '/api/tutorials?pageSize=101')).status === 400)
  check('page=0 → 400', (await req('GET', '/api/tutorials?page=0')).status === 400)
  check('status 非枚举 → 400', (await req('GET', '/api/tutorials?status=bogus')).status === 400)
  check('sort 非枚举 → 400', (await req('GET', '/api/tutorials?sort=bogus')).status === 400)
  const lastPage = await req('GET', '/api/tutorials?page=2&pageSize=10')
  check('page=2 取第二页（len=9，10+9=19）', lastPage.json?.data?.list?.length === 9)

  // ── 6. 管理口径列表（admin） ──────────────────────────────────────
  const all = await req('GET', '/api/tutorials?all=1&pageSize=50', { token: adminToken })
  const allList = all.json?.data?.list ?? []
  const statusCount = allList.reduce((m, x) => ((m[x.status] = (m[x.status] ?? 0) + 1), m), {})
  check('all=1 → 200 total=24 四态齐全（AC-RULE-01~04 全态）', all.status === 200 && all.json?.data?.total === 24 && allList.length === 24 && statusCount.draft === 2 && statusCount.pending === 3 && statusCount.published === 18 && statusCount.offline === 1, `total=${all.json?.data?.total},statuses=${JSON.stringify(statusCount)}`)
  const a22 = allList.find((x) => x.id === 22)
  const a24 = allList.find((x) => x.id === 24)
  const a19 = allList.find((x) => x.id === 19)
  const a20 = allList.find((x) => x.id === 20)
  check('扩展列：#22 rejectReason 非空 / #24 lastOfflineAt 非空', a22?.rejectReason === '第3步截图含未发布界面，请替换' && Boolean(a24?.lastOfflineAt), `r22=${a22?.rejectReason},off24=${a24?.lastOfflineAt}`)
  check('扩展列：hasOnlineVersion #19=true #20=false（UI-ELEM-09）', a19?.hasOnlineVersion === true && a20?.hasOnlineVersion === false)
  check('扩展列：submitCount #19=2 / authorName 非空', a19?.submitCount === 2 && allList.every((x) => typeof x.authorName === 'string' && x.authorName.length > 0))
  check('管理口径 summary 读当前编辑值（#19 ≠ 快照）', a19?.summary !== pub19Summary)
  const stPending = await req('GET', '/api/tutorials?status=pending', { token: adminToken })
  check('status=pending → 3 条（19/20/21）', stPending.json?.data?.total === 3)
  const stPrec = await req('GET', '/api/tutorials?all=1&status=pending', { token: adminToken })
  check('all=1&status=pending 同时传以 status 为准 → 3', stPrec.json?.data?.total === 3)
  const opAll = await req('GET', '/api/tutorials?all=1', { token: opToken })
  check('operator 可用 all=1 → 200', opAll.status === 200 && opAll.json?.data?.total === 24)

  // ── 7. 管理参数鉴权（AC-RULE-22/23） ──────────────────────────────
  const noAuth = await req('GET', '/api/tutorials?status=published')
  check('未登录 + status → 401 未登录或登录已失效', noAuth.status === 401 && noAuth.json?.message === '未登录或登录已失效', `status=${noAuth.status},msg=${noAuth.json?.message}`)
  const userAll = await req('GET', '/api/tutorials?all=1', { token: salesToken })
  check('user 角色 + all=1 → 403 无权限执行该操作', userAll.status === 403 && userAll.json?.message === '无权限执行该操作', `status=${userAll.status},msg=${userAll.json?.message}`)

  // ── 8. 详情：可见教程 + 快照 + 计数 + 上下篇 + 关联 + my* ──────────
  const d3a = await req('GET', '/api/tutorials/3')
  check('游客详情 #3 → 200 + 快照正文非空 + categoryName=采购管理（种子 cat 5）', d3a.status === 200 && d3a.json?.code === 0 && typeof d3a.json?.data?.content === 'string' && d3a.json.data.content.length > 0 && d3a.json.data.categoryName === '采购管理', `categoryName=${d3a.json?.data?.categoryName}`)
  check('videoUrl 原样透传（AC-EG-02 数据侧）', d3a.json?.data?.videoUrl === 'https://cdn.example.com/demo/mrp-calc.mp4', `videoUrl=${d3a.json?.data?.videoUrl}`)
  check('游客 my* 三字段为 null', d3a.json?.data?.myFavorite === null && d3a.json?.data?.myFeedback === null && d3a.json?.data?.myProgress === null)
  const v1 = d3a.json?.data?.viewCount
  const d3b = await req('GET', '/api/tutorials/3')
  const v2 = d3b.json?.data?.viewCount
  check('游客连续 2 次详情 viewCount 递增 +2（AC-RULE-08 不去重含游客）', typeof v1 === 'number' && v2 === v1 + 1, `v1=${v1},v2=${v2}`)
  const d3s = await req('GET', '/api/tutorials/3', { token: salesToken })
  check('登录态详情 myFavorite 为布尔（my* 字段返回）', d3s.status === 200 && typeof d3s.json?.data?.myFavorite === 'boolean', `myFavorite=${d3s.json?.data?.myFavorite}`)

  const d19 = await req('GET', '/api/tutorials/19')
  check('#19 回审详情读旧版快照 summary（AC-FN-10 旧版不断供）', d19.status === 200 && d19.json?.data?.summary === pub19Summary, `summary=${d19.json?.data?.summary}`)
  check('#19 快照 content 不含 v2 新词“页签点击新增”', d19.status === 200 && !d19.json.data.content.includes('页签点击新增') && d19.json.data.content.includes('点击新增'))

  const d4 = await req('GET', '/api/tutorials/4')
  check('#4 prev=#19 / next=#14（同分类 latest 序相邻）', d4.json?.data?.prev?.id === 19 && d4.json?.data?.next?.id === 14, `prev=${d4.json?.data?.prev?.id},next=${d4.json?.data?.next?.id}`)
  const rel4 = (d4.json?.data?.related ?? []).map((x) => x.id)
  check('#4 related=同分类可见 3 篇按 viewCount 倒序 [5,19,14]', JSON.stringify(rel4) === '[5,19,14]', `related=${rel4.join(',')}`)
  const d1 = await req('GET', '/api/tutorials/1')
  check('#1 同分类无相邻 → prev/next=null，related=[]（分类 9 仅 1 篇可见）', d1.json?.data?.prev === null && d1.json?.data?.next === null && Array.isArray(d1.json?.data?.related) && d1.json.data.related.length === 0)

  // ── 9. 详情 404 分支 ──────────────────────────────────────────────
  const d24 = await req('GET', '/api/tutorials/24')
  const rel24 = d24.json?.data?.related ?? []
  check('已下架 #24 → 404 “该教程已下架” + reason=offline + related 非空（AC-RULE-04/AC-FN-20）', d24.status === 404 && d24.json?.message === '该教程已下架' && d24.json?.data?.reason === 'offline' && rel24.length > 0, `status=${d24.status},related=${rel24.map((x) => x.id).join(',')}`)
  const d22 = await req('GET', '/api/tutorials/22')
  check('纯草稿 #22 → 404 “该教程不存在或暂不可见”（AC-RULE-01）', d22.status === 404 && d22.json?.message === '该教程不存在或暂不可见')
  const d20 = await req('GET', '/api/tutorials/20')
  check('首次待审 #20 → 404 不可见（AC-RULE-02 兜底）', d20.status === 404 && d20.json?.message === '该教程不存在或暂不可见')
  const d999 = await req('GET', '/api/tutorials/99999')
  check('不存在 id → 404', d999.status === 404 && d999.json?.message === '该教程不存在或暂不可见')

  // ── 10. share 打点 ────────────────────────────────────────────────
  const sh1 = await req('POST', '/api/tutorials/2/share')
  const sh2 = await req('POST', '/api/tutorials/2/share')
  check('游客 share 两次 → 200 且 shareCount +2 不去重', sh1.status === 200 && sh2.status === 200 && sh2.json?.data?.shareCount === sh1.json?.data?.shareCount + 1, `s1=${sh1.json?.data?.shareCount},s2=${sh2.json?.data?.shareCount}`)
  const shOff = await req('POST', '/api/tutorials/24/share')
  check('share 已下架 → 404 code=40404（契约业务码）', shOff.status === 404 && shOff.json?.code === 40404 && shOff.json?.message === '该教程不存在或暂不可见', `http=${shOff.status},code=${shOff.json?.code}`)
  const shDraft = await req('POST', '/api/tutorials/22/share')
  check('share 纯草稿 → 404 code=40404', shDraft.status === 404 && shDraft.json?.code === 40404)
  const shNone = await req('POST', '/api/tutorials/99999/share')
  check('share 不存在 → 404 code=40404', shNone.status === 404 && shNone.json?.code === 40404)

  // ── 11. 详情 ?all=1 管理口径（实现补充，FE-04 编辑表单取数） ────────
  const e19 = await req('GET', '/api/tutorials/19?all=1', { token: adminToken })
  check('详情 ?all=1（admin）读当前编辑值 summary 含 v2 / status=pending', e19.status === 200 && e19.json?.data?.status === 'pending' && e19.json?.data?.summary !== pub19Summary && e19.json?.data?.prev === null && e19.json?.data?.related?.length === 0)
  const e19guest = await req('GET', '/api/tutorials/19?all=1')
  check('详情 ?all=1 未登录 → 401', e19guest.status === 401)
  const e19user = await req('GET', '/api/tutorials/19?all=1', { token: salesToken })
  check('详情 ?all=1 user 角色 → 403', e19user.status === 403)

  // ── 12. 停用分类联动（AC-RULE-07：keyword/列表排除，直达仍可访问） ──
  const dis = await req('PUT', '/api/categories/10', { token: adminToken, body: { status: 'disabled' } })
  check('停用分类 10（最佳实践）', dis.status === 200, `status=${dis.status}`)
  if (dis.status === 200) {
    const kwDisabled = await req('GET', '/api/tutorials?keyword=%E6%95%B0%E5%AD%97%E5%8C%96') // 数字化：#18（cat 10）+ #1（摘要"数字化流水线"）
    const kwDisabledIds = (kwDisabled.json?.data?.list ?? []).map((x) => x.id)
    check('停用分类下 #18 keyword 不命中（AC-RULE-07 联动，仅剩 #1 合法命中）', !kwDisabledIds.includes(18) && kwDisabledIds.every((id) => id === 1), `ids=${kwDisabledIds.join(',')}`)
    const catDisabled = await req('GET', '/api/tutorials?categoryId=10')
    check('停用分类 categoryId 过滤 → total=0', catDisabled.json?.data?.total === 0, `total=${catDisabled.json?.data?.total}`)
    const d18 = await req('GET', '/api/tutorials/18')
    check('停用分类下直达详情 #18 仍 200（AC-RULE-07 ③）', d18.status === 200 && d18.json?.data?.id === 18)
    const en = await req('PUT', '/api/categories/10', { token: adminToken, body: { status: 'enabled' } })
    const kwAgain = await req('GET', '/api/tutorials?keyword=%E6%95%B0%E5%AD%97%E5%8C%96')
    check('恢复启用后 #18 重新命中', en.status === 200 && (kwAgain.json?.data?.list ?? []).some((x) => x.id === 18))
  }

  console.log('─'.repeat(60))
  console.log(`BE-02 TOTAL: pass=${passCount} fail=${failCount}`)
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
