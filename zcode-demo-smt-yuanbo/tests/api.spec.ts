import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test'
import { isPortUp, WEB_DEV_PORT } from './helpers'

/**
 * API smoke（docs/design/api/ 全 35 端点，每端点 ≥1 断言）：
 * - 公开端点：GET/POST 200 + 统一信封（code=0 / message / data）
 * - 需鉴权端点：无 token 401（部分附带 token 200 / 越权 403 双向断言）
 * - 写端点：最小合法操作（生命周期链路 draft→pending→published→offline→published + copy），
 *   末尾 POST /api/system/reset 真实重置还原种子（auth_tokens 随之作废——整文件 serial
 *   保证 reset 最后执行，不与其他用例的在途 token 竞争）。
 * 整文件 serial：既保证生命周期链路跨用例共享 id 的顺序，也保证 reset 收尾顺序。
 */

/** 统一响应信封（INFRA-01） */
interface Envelope<T> {
  code: number
  message: string
  data: T
}

/** 种子口径：#1-18 已发布 / #19-21 待审 / #22-23 草稿 / #24 已下架（seed.ts 固定值） */
const SEED_TOTAL = 24

/** 登录响应 data（auth.ts loginData：token + 用户五字段） */
interface LoginData {
  token: string
  user: { id: number; username: string; role: string; erpRole: string | null; displayName: string }
}

/** 收敛断言：HTTP 200 + code=0 信封，返回解析后的 body */
async function expectOk<T>(res: APIResponse): Promise<Envelope<T>> {
  expect(res.status(), `GET ${res.url()} 应 200`).toBe(200)
  const body = (await res.json()) as Envelope<T>
  expect(body.code, `GET ${res.url()} 信封 code 应 0`).toBe(0)
  expect(typeof body.message).toBe('string')
  return body
}

/** 收敛断言：HTTP status 与信封 code 同值（错误信封 data=null），message 可选精确匹配 */
async function expectError(res: APIResponse, status: number, message?: string): Promise<void> {
  expect(res.status(), `${res.url()} 应 ${status}`).toBe(status)
  const body = (await res.json()) as Envelope<unknown>
  expect(body.code).toBe(status)
  expect(body.data).toBeNull()
  if (message !== undefined) expect(body.message).toBe(message)
}

/** 后台账号密码登录（admin/operator），返回 Bearer token */
async function loginByPassword(request: APIRequestContext, username: string, password: string): Promise<string> {
  const res = await request.post('/api/auth/login', { data: { username, password } })
  const body = await expectOk<LoginData>(res)
  expect(typeof body.data.token).toBe('string')
  return body.data.token
}

/** 前台选角色登录（6 个演示账号，role 固定 user），返回 Bearer token */
async function loginByRole(request: APIRequestContext, erpRole: string): Promise<string> {
  const res = await request.post('/api/auth/role-login', { data: { erpRole } })
  const body = await expectOk<LoginData>(res)
  expect(typeof body.data.token).toBe('string')
  return body.data.token
}

/** 带 token 的请求头 */
function auth(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` }
}

// ── 生命周期链路跨用例共享：serial 保证顺序（新建 id + 各阶段 token）──────────
let chainId = 0
let adminToken = ''

// ── 服务健康（INFRA-01）──────────────────────────────────────────────

/** 统一 404 信封断言：未知 /api 路径走全局兜底（INFRA-01 契约） */
async function expectApiNotFound(url: string, request: APIRequestContext) {
  const response = await request.get(url)
  expect(response.status()).toBe(404)
  expect(await response.json()).toMatchObject({
    code: 404,
    message: expect.any(String),
    data: null,
  })
}

test.describe.serial('API smoke：35 端点（docs/design/api/ 全清单）', () => {
  test('服务健康：未知 /api 路径返回统一 404 信封', async ({ request }) => {
    await expectApiNotFound('/api/not-exist', request)
  })

  test('proxy 连通：经 web dev server(5173) 的 /api 转发到后端', async ({ request }) => {
    // dev server 模态用例：未启动则跳过（CI 可用 3000 直连替代，tech-design §1 部署形态）
    test.skip(!(await isPortUp(WEB_DEV_PORT)), `web dev server(${WEB_DEV_PORT}) 未启动`)
    await expectApiNotFound(`http://localhost:${WEB_DEV_PORT}/api/not-exist`, request)
  })

  // ── 认证 4 端点（routes/auth.ts）───────────────────────────────────

  test('POST /api/auth/login：admin 密码登录 200；错误口令 401 防枚举', async ({ request }) => {
    const okRes = await request.post('/api/auth/login', { data: { username: 'admin', password: '123456' } })
    const body = await expectOk<LoginData>(okRes)
    expect(body.data.user.username).toBe('admin')
    expect(body.data.user.role).toBe('admin')
    const badRes = await request.post('/api/auth/login', { data: { username: 'admin', password: 'wrong' } })
    await expectError(badRes, 401, '账号或密码错误')
  })

  test('POST /api/auth/role-login：sales 选角色 200；非法枚举 400', async ({ request }) => {
    const okRes = await request.post('/api/auth/role-login', { data: { erpRole: 'sales' } })
    const body = await expectOk<LoginData>(okRes)
    expect(body.data.user.role).toBe('user')
    expect(body.data.user.erpRole).toBe('sales')
    const badRes = await request.post('/api/auth/role-login', { data: { erpRole: 'not-a-role' } })
    await expectError(badRes, 400, 'erpRole 参数不合法')
  })

  test('GET /api/auth/me：无 token 401；带 token 200 恢复登录态', async ({ request }) => {
    await expectError(await request.get('/api/auth/me'), 401, '未登录或登录已失效')
    adminToken = await loginByPassword(request, 'admin', '123456')
    const res = await request.get('/api/auth/me', { headers: auth(adminToken) })
    const body = await expectOk<LoginData['user']>(res)
    expect(body.data.username).toBe('admin')
  })

  test('POST /api/auth/logout：作废 token 后 me 401', async ({ request }) => {
    const token = await loginByPassword(request, 'admin', '123456')
    const res = await request.post('/api/auth/logout', { headers: auth(token) })
    expect(res.status()).toBe(200)
    expect(await res.json()).toMatchObject({ code: 0, message: '已退出登录', data: null })
    await expectError(await request.get('/api/auth/me', { headers: auth(token) }), 401)
  })

  // ── 教程读侧 3 端点（routes/tutorials.ts）──────────────────────────

  test('GET /api/tutorials：公开列表 200 信封；管理参数无 token 401', async ({ request }) => {
    const res = await request.get('/api/tutorials')
    const body = await expectOk<{ total: number; list: ReadonlyArray<{ id: number; title: string }> }>(res)
    expect(body.data.total).toBeGreaterThanOrEqual(18)
    expect(body.data.list.length).toBeGreaterThan(0)
    expect(typeof body.data.list[0].id).toBe('number')
    expect(typeof body.data.list[0].title).toBe('string')
    // status 为管理参数：未登录访问 401（AC-RULE-25 双口径守卫）
    await expectError(await request.get('/api/tutorials?status=pending'), 401)
  })

  test('GET /api/tutorials/1：公开详情 200（种子 h3 步骤正文）；?all=1 无 token 401', async ({ request }) => {
    const res = await request.get('/api/tutorials/1')
    const body = await expectOk<{ id: number; content: string; viewCount: number }>(res)
    expect(body.data.id).toBe(1)
    expect(body.data.content).toContain('<h3>')
    expect(typeof body.data.viewCount).toBe('number')
    await expectError(await request.get('/api/tutorials/1?all=1'), 401)
  })

  test('POST /api/tutorials/1/share：公开分享打点 200，shareCount 递增', async ({ request }) => {
    const res = await request.post('/api/tutorials/1/share')
    const body = await expectOk<{ shareCount: number }>(res)
    expect(body.data.shareCount).toBeGreaterThanOrEqual(1)
  })

  // ── 分类 4 端点（routes/categories.ts）─────────────────────────────

  test('GET /api/categories：公开两级树 200；?all=1 无 token 401 / admin 200', async ({ request }) => {
    const res = await request.get('/api/categories')
    const body = await expectOk<{ list: ReadonlyArray<{ id: number; name: string; children?: unknown[] }> }>(res)
    expect(body.data.list.length).toBeGreaterThanOrEqual(5)
    expect(typeof body.data.list[0].id).toBe('number')
    await expectError(await request.get('/api/categories?all=1'), 401)
    const allRes = await request.get('/api/categories?all=1', { headers: auth(adminToken) })
    await expectOk<{ list: unknown[] }>(allRes)
  })

  test('POST/PUT/DELETE /api/categories：admin 新增→编辑→删除自清理；越权守卫', async ({ request }) => {
    await expectError(await request.post('/api/categories', { data: { name: 'x' } }), 401)
    const salesToken = await loginByRole(request, 'sales')
    await expectError(
      await request.post('/api/categories', { headers: auth(salesToken), data: { name: 'x' } }),
      403,
      '无权限执行该操作',
    )
    // 新增（admin 专属，新增即启用，AC-OP-08）
    const createRes = await request.post('/api/categories', {
      headers: auth(adminToken),
      data: { name: 'API smoke 目录', erpModule: 'sales' },
    })
    const created = await expectOk<{ id: number; name: string; status: string }>(createRes)
    expect(created.data.status).toBe('enabled')
    const categoryId = created.data.id
    // 编辑改名
    const putRes = await request.put(`/api/categories/${categoryId}`, {
      headers: auth(adminToken),
      data: { name: 'API smoke 目录 v2' },
    })
    const updated = await expectOk<{ name: string }>(putRes)
    expect(updated.data.name).toBe('API smoke 目录 v2')
    // 删除（空分类放行）后二次删除 404
    const delRes = await request.delete(`/api/categories/${categoryId}`, { headers: auth(adminToken) })
    expect(delRes.status()).toBe(200)
    expect(await delRes.json()).toMatchObject({ code: 0, message: '已删除', data: null })
    await expectError(await request.delete(`/api/categories/${categoryId}`, { headers: auth(adminToken) }), 404)
  })

  // ── 推荐 / 消息（routes/misc.ts）───────────────────────────────────

  test('GET /api/recommend：全站口径 source=global；erpRole 命中 source=role', async ({ request }) => {
    const res = await request.get('/api/recommend')
    const body = await expectOk<{
      source: string
      erpRole: string | null
      list: ReadonlyArray<{ id: number; title: string; viewCount: number }>
    }>(res)
    expect(body.data.source).toBe('global')
    expect(body.data.list.length).toBeGreaterThanOrEqual(1)
    expect(body.data.list.length).toBeLessThanOrEqual(6)
    const roleRes = await request.get('/api/recommend?erpRole=sales')
    const roleBody = await expectOk<{ source: string; erpRole: string | null }>(roleRes)
    expect(roleBody.data.source).toBe('role')
    expect(roleBody.data.erpRole).toBe('sales')
  })

  test('GET /api/messages：公开 200 列表；非法 erpRole 400', async ({ request }) => {
    const res = await request.get('/api/messages')
    const body = await expectOk<{ list: ReadonlyArray<{ id: number; title: string }> }>(res)
    expect(Array.isArray(body.data.list)).toBe(true)
    await expectError(await request.get('/api/messages?erpRole=not-a-role'), 400, 'erpRole 参数不合法')
  })

  // ── 用户行为 8 端点（favorites / histories / feedbacks / checkins，sales 账号）──

  test('POST/DELETE/GET /api/favorites：sales 收藏→列表→取消（配对还原）', async ({ request }) => {
    await expectError(await request.post('/api/favorites/1'), 401)
    await expectError(await request.get('/api/favorites'), 401)
    const token = await loginByRole(request, 'sales')
    // 收藏：幂等 +1
    const addRes = await request.post('/api/favorites/1', { headers: auth(token) })
    const added = await expectOk<{ tutorialId: number; favorited: boolean; favCount: number }>(addRes)
    expect(added.data.tutorialId).toBe(1)
    expect(added.data.favorited).toBe(true)
    expect(added.data.favCount).toBeGreaterThanOrEqual(1)
    // 列表包含该条目
    const listRes = await request.get('/api/favorites?page=1&pageSize=20', { headers: auth(token) })
    const list = await expectOk<{ total: number; list: ReadonlyArray<{ tutorialId: number }> }>(listRes)
    expect(list.data.list.some((item) => item.tutorialId === 1)).toBe(true)
    // 取消收藏：还原计数（配对操作，不留脏数据）
    const delRes = await request.delete('/api/favorites/1', { headers: auth(token) })
    const removed = await expectOk<{ favorited: boolean }>(delRes)
    expect(removed.data.favorited).toBe(false)
  })

  test('POST/GET /api/histories：sales 进度 upsert 42 后还原原值', async ({ request }) => {
    await expectError(await request.post('/api/histories/1', { data: { progress: 42 } }), 401)
    await expectError(await request.get('/api/histories'), 401)
    const token = await loginByRole(request, 'sales')
    // 记录原值（sales 无种子历史时为 null），写后还原
    const beforeRes = await request.get('/api/histories?page=1&pageSize=100', { headers: auth(token) })
    const before = await expectOk<{ list: ReadonlyArray<{ tutorialId: number; progress: number }> }>(beforeRes)
    const original = before.data.list.find((item) => item.tutorialId === 1)?.progress
    const saveRes = await request.post('/api/histories/1', { headers: auth(token), data: { progress: 42 } })
    const saved = await expectOk<{ tutorialId: number; progress: number; updatedAt: string }>(saveRes)
    expect(saved.data.progress).toBe(42)
    const afterRes = await request.get('/api/histories?page=1&pageSize=100', { headers: auth(token) })
    const after = await expectOk<{ list: ReadonlyArray<{ tutorialId: number; progress: number }> }>(afterRes)
    expect(after.data.list.find((item) => item.tutorialId === 1)?.progress).toBe(42)
    // 还原（原本无记录则落 0，最终由 system/reset 收尾）
    const restoreRes = await request.post('/api/histories/1', {
      headers: auth(token),
      data: { progress: original ?? 0 },
    })
    await expectOk<{ progress: number }>(restoreRes)
  })

  test('POST /api/feedbacks/1：无 token 401；sales 评价 upsert 200', async ({ request }) => {
    await expectError(await request.post('/api/feedbacks/1', { data: { helpful: 1 } }), 401)
    const token = await loginByRole(request, 'sales')
    const res = await request.post('/api/feedbacks/1', {
      headers: auth(token),
      data: { helpful: 1, comment: 'API smoke 评价：步骤清晰' },
    })
    const body = await expectOk<{ tutorialId: number; helpful: number; helpfulYes: number; helpfulNo: number }>(res)
    expect(body.data.tutorialId).toBe(1)
    expect(body.data.helpful).toBe(1)
    expect(body.data.helpfulYes).toBeGreaterThanOrEqual(1)
  })

  test('POST/GET /api/checkins：sales 打卡幂等 + 聚合状态（周历 7 天）', async ({ request }) => {
    await expectError(await request.post('/api/checkins', { data: {} }), 401)
    await expectError(await request.get('/api/checkins'), 401)
    const token = await loginByRole(request, 'sales')
    // 首次打卡（重跑口径可能已打过）：日期恒为今日，积分 0/10 二选一
    const firstRes = await request.post('/api/checkins', { headers: auth(token), data: {} })
    const first = await expectOk<{ checkinDate: string; pointsAdded: number; streak: number; duplicated: boolean }>(
      firstRes,
    )
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate(),
    ).padStart(2, '0')}`
    expect(first.data.checkinDate).toBe(todayStr)
    // 同日重复打卡幂等：积分不再增加
    const secondRes = await request.post('/api/checkins', { headers: auth(token), data: {} })
    const second = await expectOk<{ duplicated: boolean; pointsAdded: number }>(secondRes)
    expect(second.data.duplicated).toBe(true)
    expect(second.data.pointsAdded).toBe(0)
    // 聚合：今日已打卡 + 本周日历 7 天
    const statusRes = await request.get('/api/checkins', { headers: auth(token) })
    const status = await expectOk<{
      todayChecked: boolean
      totalPoints: number
      streak: number
      weekCalendar: ReadonlyArray<{ date: string; isChecked: boolean }>
    }>(statusRes)
    expect(status.data.todayChecked).toBe(true)
    expect(status.data.weekCalendar).toHaveLength(7)
  })

  // ── 统计 3 端点（routes/stats.ts，admin/operator）──────────────────

  test('GET /api/stats/{overview,feedback,coverage}：无 token 401；admin 200 信封', async ({ request }) => {
    for (const path of ['overview', 'feedback', 'coverage']) {
      await expectError(await request.get(`/api/stats/${path}`), 401)
      const res = await request.get(`/api/stats/${path}`, { headers: auth(adminToken) })
      const body = await expectOk<Record<string, unknown>>(res)
      expect(body.data).not.toBeNull()
      expect(typeof body.data).toBe('object')
    }
  })

  // ── 教程写入生命周期链路（BE-03/04/05：写端点串行复用同一篇）────────
  // 链路教程过审后不可删除（删除保护），由末尾 system/reset 统一还原种子。

  test('POST/PUT /api/tutorials：新建即草稿 + 保存 + 乐观锁 409', async ({ request }) => {
    await expectError(await request.post('/api/tutorials', { data: { title: 'x', categoryId: 1 } }), 401)
    const salesToken = await loginByRole(request, 'sales')
    await expectError(
      await request.post('/api/tutorials', { headers: auth(salesToken), data: { title: 'x', categoryId: 1 } }),
      403,
      '无权限执行该操作',
    )
    // 新建即草稿（AC-OP-05）：h2 步骤正文走 admin RichEditor「H 步骤标题」真实产出格式
    const createRes = await request.post('/api/tutorials', {
      headers: auth(adminToken),
      data: {
        title: 'API smoke 生命周期草稿',
        categoryId: 1,
        summary: 'API 冒烟链路自建教程，验证后由 system/reset 还原。',
        content: '<h2>第 1 步 · 打开销售订单列表</h2><p>进入销售管理模块。</p>',
        tags: ['API', 'smoke'],
      },
    })
    const created = await expectOk<{ id: number; status: string }>(createRes)
    expect(created.data.status).toBe('draft')
    expect(created.data.id).toBeGreaterThanOrEqual(SEED_TOTAL + 1)
    chainId = created.data.id
    // 保存（草稿保持草稿）
    const putRes = await request.put(`/api/tutorials/${chainId}`, {
      headers: auth(adminToken),
      data: { title: 'API smoke 生命周期草稿 v2' },
    })
    const updated = await expectOk<{ id: number; status: string; updatedAt: string }>(putRes)
    expect(updated.data.status).toBe('draft')
    // 乐观锁：过期 baseUpdatedAt → 409 覆盖告知（AC-EG-05）
    const staleRes = await request.put(`/api/tutorials/${chainId}`, {
      headers: auth(adminToken),
      data: { title: '并发冲突版', baseUpdatedAt: '2000-01-01 00:00:00' },
    })
    await expectError(staleRes, 409, '他人已保存新版本，请刷新后合并')
    // 基线一致的保存成功：落 3 步 h2 正文供后续过审断言
    const finalPut = await request.put(`/api/tutorials/${chainId}`, {
      headers: auth(adminToken),
      data: {
        content:
          '<h2>第 1 步 · 打开销售订单列表</h2><p>进入销售管理模块，筛选本月订单。</p>' +
          '<h2>第 2 步 · 核对占用与信用</h2><p>检查库存占用与客户信用额度。</p>' +
          '<h2>第 3 步 · 提交并发货</h2><p>确认无误后提交订单并通知仓库发货。</p>',
        baseUpdatedAt: updated.data.updatedAt,
      },
    })
    await expectOk<{ status: string }>(finalPut)
  })

  test('提审/撤回/审核/上下架链路：draft→pending→published→offline→published', async ({ request }) => {
    // —— 提审（submit）：pending 入审队列，前台不可见 ——
    await expectError(await request.post(`/api/tutorials/${chainId}/submit`), 401)
    const submitRes = await request.post(`/api/tutorials/${chainId}/submit`, { headers: auth(adminToken) })
    const submitted = await expectOk<{ id: number; status: string }>(submitRes)
    expect(submitted.data.status).toBe('pending')
    const pendingView = await request.get(`/api/tutorials/${chainId}`)
    expect(pendingView.status()).toBe(404)
    expect(await pendingView.json()).toMatchObject({ code: 404, data: { reason: 'invisible' } })
    // —— 撤回（withdraw，仅 pending）——
    const withdrawRes = await request.post(`/api/tutorials/${chainId}/withdraw`, { headers: auth(adminToken) })
    const withdrawn = await expectOk<{ status: string }>(withdrawRes)
    expect(withdrawn.data.status).toBe('draft')
    // 再提审供审核
    await expectOk<{ status: string }>(
      await request.post(`/api/tutorials/${chainId}/submit`, { headers: auth(adminToken) }),
    )
    // —— 审核（review）：operator 403（admin 专属，AC-FN-18）→ admin 通过即发布 ——
    const operatorToken = await loginByPassword(request, 'operator', '123456')
    await expectError(
      await request.post(`/api/tutorials/${chainId}/review`, {
        headers: auth(operatorToken),
        data: { action: 'approve' },
      }),
      403,
    )
    const approveRes = await request.post(`/api/tutorials/${chainId}/review`, {
      headers: auth(adminToken),
      data: { action: 'approve' },
    })
    const approved = await expectOk<{ id: number; status: string; publishedAt: string | null }>(approveRes)
    expect(approved.data.status).toBe('published')
    expect(approved.data.publishedAt).toBeTruthy()
    // 过审后前台可见，且 h2 步骤正文完整下发（FE-02 h2 链路的服务端侧）
    const pubView = await request.get(`/api/tutorials/${chainId}`)
    const pubBody = await expectOk<{ id: number; content: string }>(pubView)
    expect(pubBody.data.content).toContain('<h2>第 1 步')
    // —— 置顶（top，仅已发布，AC-RULE-17）——
    const topRes = await request.put(`/api/tutorials/${chainId}/top`, {
      headers: auth(adminToken),
      data: { isTop: 1 },
    })
    const topped = await expectOk<{ id: number; isTop: number; status: string }>(topRes)
    expect(topped.data.isTop).toBe(1)
    const untopRes = await request.put(`/api/tutorials/${chainId}/top`, {
      headers: auth(adminToken),
      data: { isTop: 0 },
    })
    await expectOk<{ isTop: number }>(untopRes)
    // —— 下架（offline，admin 专属）：前台 404 offline ——
    await expectError(
      await request.post(`/api/tutorials/${chainId}/offline`, { headers: auth(operatorToken) }),
      403,
    )
    const offlineRes = await request.post(`/api/tutorials/${chainId}/offline`, { headers: auth(adminToken) })
    const offlined = await expectOk<{ status: string }>(offlineRes)
    expect(offlined.data.status).toBe('offline')
    const offView = await request.get(`/api/tutorials/${chainId}`)
    expect(offView.status()).toBe(404)
    expect(await offView.json()).toMatchObject({ code: 404, data: { reason: 'offline' } })
    // —— 重新发布（republish，不重审）——
    const republishRes = await request.post(`/api/tutorials/${chainId}/republish`, { headers: auth(adminToken) })
    const republished = await expectOk<{ status: string }>(republishRes)
    expect(republished.data.status).toBe('published')
    await expectOk<{ id: number }>(await request.get(`/api/tutorials/${chainId}`))
    // —— 复制（copy，任意状态→新草稿计数清零）→ 删除副本（纯草稿可删）——
    const copyRes = await request.post(`/api/tutorials/${chainId}/copy`, { headers: auth(adminToken) })
    const copied = await expectOk<{ id: number; status: string }>(copyRes)
    expect(copied.data.status).toBe('draft')
    expect(copied.data.id).not.toBe(chainId)
    const delCopyRes = await request.delete(`/api/tutorials/${copied.data.id}`, { headers: auth(adminToken) })
    expect(delCopyRes.status()).toBe(200)
    expect(await delCopyRes.json()).toMatchObject({ code: 0, message: '已删除', data: null })
    // 原教程已过审：删除保护 403（存在线上过审版本，AC-OP-06），由 reset 收尾还原
    await expectError(await request.delete(`/api/tutorials/${chainId}`, { headers: auth(adminToken) }), 403)
  })

  // ── 系统 1 端点（routes/system.ts）：写链路善后，还原种子 ──────────

  test('POST /api/system/reset：无 token 401；admin 重置还原种子', async ({ request }) => {
    await expectError(await request.post('/api/system/reset'), 401)
    // reset 会清空 auth_tokens（所有在途 token 作废），故置于文件最后一个写用例，用新 token 执行
    const freshToken = await loginByPassword(request, 'admin', '123456')
    const res = await request.post('/api/system/reset', { headers: auth(freshToken) })
    expect(res.status()).toBe(200)
    const body = (await res.json()) as Envelope<{
      categories: number
      tutorials: number
      users: number
      messages: number
      checkins: number
    }>
    expect(body.code).toBe(0)
    expect(body.message).toBe('重置成功')
    expect(body.data.tutorials).toBe(SEED_TOTAL)
    // reset 作废了旧 token（含 freshToken 自身）：重新登录校验种子还原
    await expectError(await request.get('/api/auth/me', { headers: auth(freshToken) }), 401)
    const relogin = await loginByPassword(request, 'admin', '123456')
    // all=1 管理口径全量 24（公开口径仅前台可见 19：18 发布 + #19 回审旧版快照）
    const listRes = await request.get('/api/tutorials?all=1', { headers: auth(relogin) })
    const list = await expectOk<{ total: number }>(listRes)
    expect(list.data.total).toBe(SEED_TOTAL)
    const chainRes = await request.get('/api/tutorials?keyword=API%20smoke%20%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F', {
      headers: auth(relogin),
    })
    const chain = await expectOk<{ total: number }>(chainRes)
    expect(chain.data.total).toBe(0)
  })
})
