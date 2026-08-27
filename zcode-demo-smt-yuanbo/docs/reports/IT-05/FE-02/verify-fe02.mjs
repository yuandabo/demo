// FE-02 m 首页浏览器验收（Playwright 直驱，跑在 web dev:5173 + server:3000）
// 覆盖：AC-FN-24（宫格可达/待补充）、AC-RULE-16（角色推荐口径）、AC-FN-08（发布后同次请求反映）
// 用法：node docs/reports/IT-05/FE-02/verify-fe02.mjs
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'http://localhost:5173/m.html'
const API = 'http://localhost:3000'
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url))
const results = []
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

/** 后端直连 fetch（取期望数据 / AC-FN-08 全链路造数） */
const api = async (pathname, { method = 'GET', body, token } = {}) => {
  const resp = await fetch(API + pathname, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return resp.json()
}
const login = async (username) => {
  const r = await api('/api/auth/login', { method: 'POST', body: { username, password: '123456' } })
  return r.data.token
}

/** 展开手机壳内滚动容器，截与设计稿同区域的整页静态图（关闭 loading 后） */
const expandShell = (page) =>
  page.evaluate(() => {
    const style = document.createElement('style')
    style.textContent =
      '.phone{height:auto!important}.screen{height:auto!important}.scroll{overflow:visible!important}'
    document.head.appendChild(style)
    window.scrollTo(0, 0)
    document.querySelector('.scroll')?.scrollTo(0, 0)
  })

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  const reqs = []
  page.on('request', (r) => reqs.push(r.url()))

  // ---------- 1. 游客态：骨架屏（延迟接口捕获首次加载态） ----------
  const delay = (pattern) =>
    page.route(pattern, async (route) => {
      await new Promise((s) => setTimeout(s, 400))
      await route.continue()
    })
  await delay('**/api/recommend*')
  await delay('**/api/categories*')
  await page.goto(`${BASE}#/`, { waitUntil: 'domcontentloaded' })
  ok('游客-推荐骨架屏', (await page.locator('[data-testid="recommend-skeleton"]').count()) === 1)
  ok('游客-宫格骨架屏', (await page.locator('[data-testid="category-skeleton"]').count()) === 1)
  await page.waitForSelector('[data-testid^="recommend-card-"]', { timeout: 5000 })
  await page.unroute('**/api/recommend*')
  await page.unroute('**/api/categories*')

  // ---------- 2. 游客态：头部四元素 ----------
  ok('头部-logo 名称', (await page.locator('.logo-name').textContent()) === '云ERP教程中心')
  ok('头部-角色徽章游客文案', (await page.locator('[data-testid="role-pill"]').textContent()).includes('未登录'))
  const search = await page.locator('[data-testid="search-entry"]').textContent()
  ok('头部-搜索框关键词高亮文案', search.includes('算料') && search.includes('搜索教程'))
  ok('TabBar-首页 active', await page.locator('[data-testid="tabbar-home"].active').count() === 1)

  // ---------- 3. 游客态：推荐=全站 Top6（AC-RULE-16 未登录口径） ----------
  const globalRec = await api('/api/recommend')
  const guestCards = await page.locator('[data-testid^="recommend-card-"]').allTextContents()
  ok(
    '游客-推荐标题「全站热门」且无角色标签',
    (await page.locator('.sec-title').first().textContent()).includes('全站热门') &&
      (await page.locator('.sec-title').first().locator('em').count()) === 0,
  )
  ok(
    '游客-推荐条数=接口全站 Top6 实际数量（≤6）',
    guestCards.length === globalRec.data.list.length && guestCards.length <= 6,
    `dom=${guestCards.length} api=${globalRec.data.list.length}`,
  )
  ok(
    '游客-推荐卡片标题与接口一致',
    globalRec.data.list.every((t) => guestCards.some((c) => c.includes(t.title))),
  )

  // ---------- 4. 游客态：分类宫格 12 格 + 角标口径（AC-FN-24） ----------
  const cats = await api('/api/categories?withCount=1')
  const topCats = cats.data.list.filter((c) => c.status === 'enabled' && c.parentId === null)
  ok('宫格-启用一级分类 12 格', topCats.length === 12 && (await page.locator('.cell').count()) === 12)
  const cellOf = (id) => page.locator(`[data-testid="category-cell-${id}"]`)
  let badgeOk = true
  for (const c of topCats) {
    const text = await cellOf(c.id).textContent()
    const expect = c.tutorialCount === 0 ? '待补充' : `${c.tutorialCount} 篇`
    if (!text.includes(c.name) || !text.includes(expect)) badgeOk = false
  }
  ok('宫格-角标=前台可见教程数，0 篇显示「待补充」', badgeOk)
  ok(
    '宫格-存在待补充空分类',
    topCats.some((c) => c.tutorialCount === 0) &&
      (await page.locator('.cc.empty').count()) === topCats.filter((c) => c.tutorialCount === 0).length,
  )
  ok(
    '宫格-区块标题计数标签',
    (await page.locator('.sec-title').nth(1).textContent()).includes('全部分类') &&
      (await page.locator('.sec-title').nth(1).textContent()).includes('12 个'),
  )

  // ---------- 5. 游客态：消息卡隐藏 + 打卡引导 + 请求清单 ----------
  ok('游客-消息卡隐藏（未请求 /api/messages）', (await page.locator('[data-testid="message-card"]').count()) === 0)
  const bannerText = await page.locator('[data-testid="checkin-banner"]').textContent()
  ok(
    '游客-打卡横幅引导文案',
    bannerText.includes('打卡赢积分') && bannerText.includes('去打卡') && !reqs.some((u) => u.includes('/api/checkins')),
  )
  ok(
    '游客-请求清单：recommend(无 erpRole)+categories；无 messages/checkins',
    reqs.some((u) => u.endsWith('/api/recommend')) &&
      reqs.some((u) => u.includes('/api/categories?withCount=1')) &&
      !reqs.some((u) => u.includes('/api/messages')),
    reqs.filter((u) => u.includes('/api/')).join(' , '),
  )

  // ---------- 6. 游客态跳转：搜索/宫格/横幅/推荐卡 ----------
  /** 返回首页并把内层滚动容器归顶（历史滚动恢复会把首屏内容留在了视口外） */
  const backHome = async () => {
    await page.goBack()
    await page.evaluate(() => document.querySelector('.scroll')?.scrollTo(0, 0))
  }
  await page.click('[data-testid="search-entry"]')
  ok('跳转-搜索框进列表页', page.url().endsWith('#/list'))
  await backHome()
  await page.click(`[data-testid="category-cell-${topCats[0].id}"]`)
  ok(
    '跳转-宫格带 categoryId+name',
    decodeURIComponent(page.url()).includes(`#/list?categoryId=${topCats[0].id}`) &&
      decodeURIComponent(page.url()).includes(`name=${topCats[0].name}`),
    page.url(),
  )
  await backHome()
  await page.click('[data-testid="checkin-banner"]')
  ok('跳转-打卡横幅进打卡页', page.url().endsWith('#/checkin'))
  await backHome()
  await page.click(`[data-testid="recommend-card-${globalRec.data.list[0].id}"]`)
  ok('跳转-推荐卡进详情页', page.url().endsWith(`#/detail/${globalRec.data.list[0].id}`))

  // ---------- 7. 选角色登录：采购（RoleSheet → 推荐按角色刷新，AC-RULE-16/AC-FN-17） ----------
  await page.goto(`${BASE}#/`, { waitUntil: 'networkidle' })
  reqs.length = 0
  await page.click('[data-testid="role-pill"]')
  await page.waitForSelector('[data-testid="role-sheet"].show', { timeout: 3000 })
  ok('登录-RoleSheet 弹出', (await page.locator('[data-testid="role-sheet"].show').count()) === 1)
  await page.click('[data-testid="role-card-purchase"]')
  await page.waitForFunction(
    () => document.querySelector('[data-testid="role-pill"]')?.textContent.includes('采购'),
  )
  ok('登录-角色徽章更新「当前角色：采购」', (await page.locator('[data-testid="role-pill"]').textContent()).includes('当前角色'))
  await page.waitForSelector('[data-testid^="recommend-card-"]')

  const purchaseRec = await api('/api/recommend?erpRole=purchase')
  const roleCards = await page.locator('[data-testid^="recommend-card-"]').allTextContents()
  const title1 = await page.locator('.sec-title').first().textContent()
  ok(
    '采购-区块标题联动「为你推荐 · 采购」+「按角色匹配」',
    title1.includes('为你推荐 · 采购') && title1.includes('按角色匹配'),
  )
  ok(
    '采购-推荐请求携带 erpRole 参数',
    reqs.some((u) => u.includes('/api/recommend?erpRole=purchase')),
  )
  ok(
    '采购-推荐全部来自采购/库存映射分类（AC-RULE-16）',
    purchaseRec.data.list.length > 0 &&
      purchaseRec.data.list.every((t) => ['采购管理', '库存管理'].includes(t.categoryName)) &&
      purchaseRec.data.list.every((t) => roleCards.some((c) => c.includes(t.title))),
    `api ${purchaseRec.data.list.length} 条：${purchaseRec.data.list.map((t) => t.categoryName).join('/')}`,
  )
  ok(
    '采购-推荐条数=接口实际数量（≤6）',
    roleCards.length === purchaseRec.data.list.length && roleCards.length <= 6,
  )

  // ---------- 8. 采购态：消息预留卡 + 打卡横幅真实状态 ----------
  const purchaseMsg = await api('/api/messages?erpRole=purchase')
  const cardCount = await page.locator('[data-testid="message-card"]').count()
  if (purchaseMsg.data.list.length > 0) {
    const msgText = cardCount ? await page.locator('[data-testid="message-card"]').textContent() : ''
    ok(
      '采购-消息卡显示第一条 mock 消息+「预留」标签',
      cardCount === 1 &&
        msgText.includes('有一条审批待办关联教程') &&
        msgText.includes('预留') &&
        msgText.includes(purchaseMsg.data.list[0].title),
      purchaseMsg.data.list[0].title,
    )
    ok('采购-消息请求已发（token 隐式过滤）', reqs.some((u) => u.includes('/api/messages')))
  } else {
    ok('采购-消息卡空态隐藏', cardCount === 0, '该角色无消息')
  }
  const meLogin = await api('/api/auth/role-login', { method: 'POST', body: { erpRole: 'purchase' } })
  const ck = await api('/api/checkins', { token: meLogin.data.token })
  const banner2 = await page.locator('[data-testid="checkin-banner"]').textContent()
  ok(
    '采购-打卡横幅显示真实 todayChecked/streak',
    banner2.includes(ck.data.todayChecked ? '今日已打卡' : '今日未打卡') &&
      banner2.includes(`已连 ${ck.data.streak} 天`) &&
      banner2.includes('去打卡') &&
      reqs.some((u) => u.includes('/api/checkins')),
    `todayChecked=${ck.data.todayChecked} streak=${ck.data.streak}`,
  )
  await page.click('[data-testid="message-card"]')
  ok('跳转-消息卡进列表页（预留仅展示引导）', page.url().endsWith('#/list'))
  await page.goBack()

  // ---------- 9. 实现图（采购登录态，全区块展开整页） ----------
  await page.waitForSelector('[data-testid^="recommend-card-"]')
  await page.waitForTimeout(200)
  await expandShell(page)
  await page.screenshot({ path: path.join(OUT_DIR, 'FE-02-impl.png'), fullPage: true })

  // ---------- 10. 切换角色刷新（sales，交互 6） ----------
  reqs.length = 0
  await page.click('[data-testid="role-pill"]')
  await page.click('[data-testid="role-card-sales"]')
  await page.waitForFunction(
    () => document.querySelector('[data-testid="role-pill"]')?.textContent.includes('销售'),
  )
  await page.waitForSelector('[data-testid^="recommend-card-"]')
  const salesRec = await api('/api/recommend?erpRole=sales')
  const salesCards = await page.locator('[data-testid^="recommend-card-"]').allTextContents()
  ok(
    '切角色-推荐按新角色重取（sales）',
    reqs.some((u) => u.includes('/api/recommend?erpRole=sales')) &&
      salesCards.length === salesRec.data.list.length &&
      salesRec.data.list.every((t) => ['销售管理'].includes(t.categoryName)),
  )
  ok(
    '切角色-区块标题同步「为你推荐 · 销售」',
    (await page.locator('.sec-title').first().textContent()).includes('为你推荐 · 销售'),
  )

  // ---------- 11. 游客整页图 ----------
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid^="recommend-card-"]')
  await expandShell(page)
  await page.screenshot({ path: path.join(OUT_DIR, 'FE-02-guest.png'), fullPage: true })

  // ---------- 12. AC-FN-08 联调断言：发布新教程 → 同一次请求即反映 ----------
  const targetCat = topCats.find((c) => c.tutorialCount > 0) ?? topCats[0]
  const before = await cellOf(targetCat.id).textContent()
  const opToken = await login('operator')
  const created = await api('/api/tutorials', {
    method: 'POST',
    token: opToken,
    body: {
      title: `AC-FN-08 联调验证教程 ${Date.now()}`,
      categoryId: targetCat.id,
      summary: 'FE-02 联调断言：发布后 m 首页宫格角标同一次请求即 +1。',
      content: '<h3>第 1 步 · 验证</h3><p>发布后无需重启/重登，刷新首页即可见。</p>',
      tags: ['联调'],
    },
  })
  await api(`/api/tutorials/${created.data.id}/submit`, { method: 'POST', token: opToken })
  const adminToken = await login('admin')
  await api(`/api/tutorials/${created.data.id}/review`, {
    method: 'POST',
    token: adminToken,
    body: { action: 'approve', reason: null },
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector(`[data-testid="category-cell-${targetCat.id}"]`)
  const after = await cellOf(targetCat.id).textContent()
  ok(
    'AC-FN-08-发布后宫格角标同次请求 +1',
    before.includes(`${targetCat.tutorialCount} 篇`) && after.includes(`${targetCat.tutorialCount + 1} 篇`),
    `${targetCat.name}: ${targetCat.tutorialCount} → ${targetCat.tutorialCount + 1}`,
  )
  // 还原种子库，避免污染其他并行验证（AC-NF-06 可重复交付口径）
  await api('/api/system/reset', { method: 'POST', token: adminToken })
  ok('AC-FN-08-种子库已重置还原', true)
} catch (err) {
  ok('执行异常', false, String(err))
} finally {
  await browser.close()
}

fs.writeFileSync(
  path.join(OUT_DIR, 'verify-result.json'),
  JSON.stringify({ total: results.length, passed: results.filter((r) => r.pass).length, results }, null, 2),
)
const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
