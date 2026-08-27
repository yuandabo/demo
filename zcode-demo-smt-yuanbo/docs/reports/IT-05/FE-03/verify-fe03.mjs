// FE-03 m 列表搜索 #/list 浏览器验收（Playwright 直驱，跑在 web dev:5173 + server:3000）
// 覆盖：AC-FN-24（初始化/搜索分支，命中规则同 AC-FN-02 三字段）、AC-FN-08（发布即刻可见）、
//       AC-EG-11（1s 超时兜底两条恢复路径）、UI-IXD-13（下拉刷新）
// 用法：node docs/reports/IT-05/FE-03/verify-fe03.mjs
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

/** 后端直连 fetch（期望数据比对 / AC-FN-08 全链路造数） */
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

const hm = (d = new Date()) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const HM_RE = /\d{2}:\d{2}/

/** 展开手机壳内滚动容器，截与设计稿同区域的整页静态图 */
const expandShell = (page) =>
  page.evaluate(() => {
    const style = document.createElement('style')
    style.textContent =
      '.phone{height:auto!important}.screen{height:auto!important}.scroll{overflow:visible!important}'
    document.head.appendChild(style)
    window.scrollTo(0, 0)
    document.querySelector('.scroll')?.scrollTo(0, 0)
  })

/** CDP 触摸下拉（UI-IXD13 原生 touch：start→阻尼 move→end 释放触发） */
async function pullRefresh(page) {
  const cdp = await page.context().newCDPSession(page)
  const x = 187
  const y0 = 430
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] })
  for (const dy of [40, 90, 140, 175]) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + dy }] })
    await page.waitForTimeout(40)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  const reqs = []
  const pageErrors = []
  page.on('request', (r) => reqs.push(r.url()))
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  const apiReqs = () => reqs.filter((u) => u.includes('/api/'))
  const tutorialsReqs = () => reqs.filter((u) => u.includes('/api/tutorials'))
  const waitCards = () => page.waitForSelector('[data-testid^="tutorial-card-"]', { timeout: 8000 })

  // ---------- 1. 初始化（AC-FN-24 无参进入）：骨架屏 / 三态之一 ----------
  const slow = (ms) =>
    page.route('**/api/tutorials*', async (route) => {
      await new Promise((s) => setTimeout(s, ms))
      // 客户端 1s 超时中止后请求已被取消，再投递会抛 Route already handled，吞掉即可
      await route.continue().catch(() => {})
    })
  await slow(400)
  await page.goto(`${BASE}#/list`, { waitUntil: 'domcontentloaded' })
  ok('初始化-卡片骨架屏 3 张', (await page.locator('[data-testid="list-skeleton"] .sk-tcard').count()) === 3)
  ok('初始化-搜索按钮 loading 禁用', await page.locator('[data-testid="search-btn"]').isDisabled())
  await waitCards()
  await page.unroute('**/api/tutorials*')

  ok('初始化-导航标题与返回按钮', (await page.locator('.nav-title').textContent()) === '教程列表' && (await page.locator('[data-testid="back-btn"]').count()) === 1)
  ok('初始化-下拉刷新提示条默认态', /下拉刷新…\s*·\s*上次更新 \d{2}:\d{2}/.test(await page.locator('[data-testid="refresh-bar"]').textContent()))
  ok('初始化-无关键词无分类时结果行隐藏', (await page.locator('[data-testid="result-line"]').count()) === 0)
  ok('初始化-TabBar「分类」active', await page.locator('[data-testid="tabbar-list"].active').count() === 1)

  const all = await api('/api/tutorials?page=1&pageSize=20')
  const cards = await page.locator('[data-testid^="tutorial-card-"]').count()
  ok('初始化-列表=接口同源全量', cards === all.data.list.length && all.data.total === all.data.list.length, `dom=${cards} api=${all.data.total}`)
  const footer = await page.locator('[data-testid="list-end"]').textContent()
  ok('初始化-底部「已加载全部 N 篇」+ 分类分布', footer.includes(`已加载全部 ${all.data.total} 篇`) && footer.includes('（'))

  const cats = await api('/api/categories')
  const topCats = cats.data.list.filter((c) => c.status === 'enabled' && c.parentId === null)
  const chipCount = await page.locator('.chips .chip').count()
  ok('初始化-chips=全部+12 个启用一级分类', topCats.length === 12 && chipCount === 13, `chips=${chipCount}`)
  ok('初始化-「全部」默认选中', (await page.locator('[data-testid="chip-all"].on').count()) === 1)
  ok('初始化-请求参数 page=1&pageSize=20 无 keyword/categoryId', tutorialsReqs().some((u) => u.endsWith('/api/tutorials?page=1&pageSize=20')))

  // ---------- 2. 分类进入（首页宫格携参路径，AC-FN-24 分支） ----------
  await page.goto(`${BASE}#/list?categoryId=5&name=${encodeURIComponent('采购管理')}`, {
    waitUntil: 'domcontentloaded',
  })
  await waitCards()
  ok('分类进入-chip 选中与 URL 一致', (await page.locator('[data-testid="chip-5"].on').count()) === 1)
  const rl1 = await page.locator('[data-testid="result-line"]').textContent()
  ok('分类进入-结果行「当前筛选：采购管理」', rl1.includes('当前筛选：采购管理'), rl1)
  const catCards = await page.locator('.t-cat').allTextContents()
  const byCat5 = await api('/api/tutorials?page=1&pageSize=20&categoryId=5')
  ok(
    '分类进入-列表限定该分类且计数同源',
    catCards.length === byCat5.data.list.length && catCards.every((t) => t === '采购管理') && rl1.includes(`相关结果` ) === false,
    `dom=${catCards.length} api=${byCat5.data.total}`,
  )

  // ---------- 3. 关键词搜索（AC-FN-24/AC-FN-02：标题/摘要/标签三字段同源） ----------
  reqs.length = 0
  await page.fill('[data-testid="search-input"]', '算料')
  await page.click('[data-testid="search-btn"]')
  await page.waitForFunction(() => document.querySelector('[data-testid="result-line"]')?.textContent.includes('相关结果'))
  const hit = await api('/api/tutorials?page=1&pageSize=20&keyword=%E7%AE%97%E6%96%99&categoryId=5')
  const rl2 = await page.locator('[data-testid="result-line"]').textContent()
  ok(
    '搜索-结果行「「算料」相关结果 N 篇·当前筛选保留',
    rl2.includes('「算料」相关结果') && rl2.includes(`相关结果 ${hit.data.total} 篇`) && rl2.includes('当前筛选：采购管理'),
    rl2,
  )
  ok(
    '搜索-请求携带 keyword+保留 categoryId（同 PC 参数）',
    tutorialsReqs().some((u) => u.includes('keyword=%E7%AE%97%E6%96%99') && u.includes('categoryId=5') && u.includes('pageSize=20')),
    tutorialsReqs().at(-1),
  )
  const hitCards = await page.locator('[data-testid^="tutorial-card-"]').count()
  ok('搜索-结果计数与卡片数=接口同源', hitCards === hit.data.list.length, `dom=${hitCards} api=${hit.data.total}`)
  const card3 = page.locator('[data-testid="tutorial-card-3"]')
  ok(
    '搜索-标题/摘要/标签命中词 em 高亮（三字段）',
    (await card3.locator('.t-title em').textContent()) === '算料' &&
      (await card3.locator('.t-sum em').first().textContent()) === '算料' &&
      (await card3.locator('.ttag em').textContent()) === '算料',
  )
  ok('搜索-置顶角标（AC-RULE-17，id3 isTop=1）', (await card3.locator('.t-top').textContent()) === '置顶')
  // 大小写不敏感命中（MRP/mrp）
  await page.fill('[data-testid="search-input"]', 'mrp')
  await page.press('[data-testid="search-input"]', 'Enter')
  await page.waitForFunction(() => document.querySelector('.t-title em')?.textContent.toUpperCase() === 'MRP')
  ok('搜索-软键盘回车提交 + 英文大小写不敏感高亮', (await page.locator('.t-title em').first().textContent()) === 'MRP')

  // ---------- 4. chip 切换（交互 3：刷新/回顶/URL/关键词保留） ----------
  await page.evaluate(() => document.querySelector('.scroll')?.scrollTo(0, 400))
  reqs.length = 0
  await page.click('[data-testid="chip-4"]')
  await page.waitForFunction(() => document.querySelector('[data-testid="chip-4"]')?.classList.contains('on'))
  await waitCards()
  const rl3 = await page.locator('[data-testid="result-line"]').textContent()
  ok(
    'chip 切换-选中高亮+URL 同步+关键词保留',
    (await page.locator('[data-testid="chip-4"].on').count()) === 1 &&
      decodeURIComponent(page.url()).includes('categoryId=4') &&
      decodeURIComponent(page.url()).includes('keyword=mrp') &&
      rl3.includes('当前筛选：生产制造'),
    rl3,
  )
  const catAfter = await page.locator('.t-cat').allTextContents()
  ok('chip 切换-列表限定新分类', catAfter.length > 0 && catAfter.every((t) => t === '生产制造'))
  ok(
    'chip 切换-列表滚动回顶部',
    (await page.evaluate(() => document.querySelector('.scroll')?.scrollTop)) === 0,
  )
  // 「全部」chip 清除分类筛选
  await page.click('[data-testid="chip-all"]')
  await page.waitForFunction(() => !window.location.hash.includes('categoryId'))
  await waitCards()
  ok('chip 切换-「全部」清除分类筛选', !decodeURIComponent(page.url()).includes('categoryId'))

  // ---------- 5. 1s 超时兜底（AC-EG-11） ----------
  await page.route('**/api/tutorials*', async (route) => {
    await new Promise((s) => setTimeout(s, 1800))
    // 客户端 1s 中止后请求已取消，继续投递会抛 Route already handled
    await route.continue().catch(() => {})
  })
  reqs.length = 0
  const t0 = Date.now()
  await page.fill('[data-testid="search-input"]', 'MRP')
  await page.click('[data-testid="search-btn"]')
  await page.waitForSelector('[data-testid="timeout-tip"]', { timeout: 3000 })
  const elapsed = Date.now() - t0
  ok('超时-延迟>1s 响应被中止（~1s 出现提示条）', elapsed < 1600, `${elapsed}ms`)
  ok(
    '超时-提示「搜索超时，请重试」+ 保留已输入关键词',
    (await page.locator('[data-testid="timeout-tip"]').textContent()).includes('搜索超时，请重试') &&
      (await page.inputValue('[data-testid="search-input"]')) === 'MRP',
  )
  await page.unroute('**/api/tutorials*')
  const t1 = Date.now()
  await page.click('[data-testid="timeout-retry-btn"]')
  await page.waitForSelector('[data-testid^="tutorial-card-"]', { timeout: 3000 })
  const retryElapsed = Date.now() - t1
  ok('超时-恢复路径A：重试 1s 内返回', retryElapsed < 1500, `${retryElapsed}ms`)
  // 恢复路径 B：改走分类浏览正常获取列表
  await page.click('[data-testid="chip-5"]')
  await page.waitForFunction(() => document.querySelector('[data-testid="chip-5"]')?.classList.contains('on'))
  await waitCards()
  ok('超时-恢复路径B：改走分类浏览正常获取', (await page.locator('[data-testid^="tutorial-card-"]').count()) > 0)

  // ---------- 6. 下拉刷新（UI-IXD-13）：正常路径 ----------
  await page.goto(`${BASE}#/list`, { waitUntil: 'domcontentloaded' })
  await waitCards()
  const barTime0 = HM_RE.exec(await page.locator('[data-testid="refresh-bar"]').textContent())?.[0]
  // 等分钟翻页，使「上次更新」时间变化可确定性断言
  await page.waitForFunction((prev) => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` !== prev
  }, barTime0, { timeout: 70000, polling: 1000 })
  await slow(400)
  reqs.length = 0
  await pullRefresh(page)
  await page.waitForFunction(() => document.querySelector('[data-testid="refresh-bar"]')?.textContent.includes('正在刷新…'), null, { timeout: 3000 })
  ok('下拉-释放后提示条「正在刷新…」', true)
  ok('下拉-箭头自旋态', (await page.locator('[data-testid="refresh-bar"] .arr.spin').count()) === 1)
  await page.waitForFunction(() => !document.querySelector('[data-testid="refresh-bar"]')?.textContent.includes('正在刷新…'), null, { timeout: 5000 })
  const bar1 = await page.locator('[data-testid="refresh-bar"]').textContent()
  const barTime1 = HM_RE.exec(bar1)?.[0]
  ok(
    '下拉-完成回默认态且「上次更新」时间刷新',
    /下拉刷新…/.test(bar1) && barTime1 !== barTime0 && barTime1 === hm(),
    `${barTime0} → ${barTime1} (now ${hm()})`,
  )
  ok(
    '下拉-按当前参数重新请求（page 重置 1）',
    tutorialsReqs().some((u) => u.endsWith('/api/tutorials?page=1&pageSize=20')),
    tutorialsReqs().join(' , '),
  )
  ok('下拉-刷新后列表完整', (await page.locator('[data-testid^="tutorial-card-"]').count()) === all.data.list.length)

  // ---------- 7. 下拉刷新失败：toast + 保留原列表（交互 4 空态处理） ----------
  const beforeFail = await page.locator('[data-testid^="tutorial-card-"]').count()
  await page.route('**/api/tutorials*', (route) => route.abort())
  await pullRefresh(page)
  await page.waitForSelector('[data-testid="m-toast"]', { timeout: 3000 })
  ok(
    '下拉失败-toast 提示且保留原列表',
    (await page.locator('[data-testid="m-toast"]').textContent()).includes('刷新失败，请重试') &&
      (await page.locator('[data-testid^="tutorial-card-"]').count()) === beforeFail,
  )
  await page.unroute('**/api/tutorials*')
  await page.waitForSelector('[data-testid="m-toast"]', { state: 'detached', timeout: 4000 })

  // ---------- 8. 卡片跳转 + 返回按钮（交互 5 / 元素表） ----------
  const firstId = await page.locator('[data-testid^="tutorial-card-"]').first().getAttribute('data-testid')
  await page.locator('[data-testid^="tutorial-card-"]').first().click()
  ok('卡片-点击进 #/detail/:id', page.url().endsWith(`#/detail/${firstId.replace('tutorial-card-', '')}`), page.url())
  // 返回按钮：应用内历史 → 回上一页；直达无历史 → 回首页兜底
  await page.goto(`${BASE}#/`, { waitUntil: 'domcontentloaded' })
  await page.click('[data-testid="search-entry"]')
  await page.waitForSelector('[data-testid="search-input"]')
  await page.click('[data-testid="back-btn"]')
  await page.waitForFunction(() => window.location.hash.endsWith('#/'))
  ok('返回-应用内历史回上一页（#/）', page.url().endsWith('#/'))
  // 直达（无应用内历史）：goto 同文档 hash 导航会累积历史，须用全新 page 验证兜底
  const page2 = await browser.newPage({ viewport: { width: 375, height: 812 } })
  await page2.goto(`${BASE}#/list`, { waitUntil: 'domcontentloaded' })
  await page2.waitForSelector('[data-testid="search-input"]')
  await page2.click('[data-testid="back-btn"]')
  await page2.waitForFunction(() => window.location.hash.endsWith('#/'))
  ok('返回-直达（无历史）兜底回首页', page2.url().endsWith('#/'))
  await page2.close()

  // ---------- 9. 空态引导（AC-FN-02 同源文案） ----------
  await page.goto(`${BASE}#/list`, { waitUntil: 'domcontentloaded' })
  await waitCards()
  await page.fill('[data-testid="search-input"]', '不存在的关键词ZQX')
  await page.click('[data-testid="search-btn"]')
  await page.waitForSelector('[data-testid="empty-state"]', { timeout: 5000 })
  const emptyText = await page.locator('[data-testid="empty-state"]').textContent()
  ok(
    '空态-引导含「清空筛选」+「去分类浏览」',
    (await page.locator('[data-testid="empty-clear-btn"]').count()) === 1 &&
      (await page.locator('[data-testid="empty-browse-link"]').count()) === 1 &&
      emptyText.includes('未找到相关教程'),
  )
  await page.screenshot({ path: path.join(OUT_DIR, 'FE-03-empty.png') })
  await page.click('[data-testid="empty-clear-btn"]')
  await page.waitForFunction(() => !window.location.hash.includes('keyword'))
  await waitCards()
  ok(
    '空态-清空筛选回「全部」并恢复列表',
    (await page.locator('[data-testid="chip-all"].on').count()) === 1 &&
      (await page.inputValue('[data-testid="search-input"]')) === '' &&
      (await page.locator('[data-testid^="tutorial-card-"]').count()) === all.data.list.length,
  )

  // ---------- 10. AC-FN-08：后台发布 → 刷新后同一次请求即返回 ----------
  await page.goto(`${BASE}#/list?categoryId=5`, { waitUntil: 'domcontentloaded' })
  await waitCards()
  const beforeCount = await page.locator('[data-testid^="tutorial-card-"]').count()
  const newTitle = `AC-FN-08 m 列表联调验证 ${Date.now()}`
  const opToken = await login('operator')
  const created = await api('/api/tutorials', {
    method: 'POST',
    token: opToken,
    body: {
      title: newTitle,
      categoryId: 5,
      summary: 'FE-03 联调断言：发布后 m 列表下拉刷新同一次请求即返回。',
      content: '<h3>验证</h3><p>发布后无需重启/重登，刷新即见。</p>',
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
  await pullRefresh(page)
  await page.waitForSelector(`text=${newTitle}`, { timeout: 5000 })
  ok(
    'AC-FN-08-发布后下拉刷新同一次请求即返回',
    (await page.locator('[data-testid^="tutorial-card-"]').count()) === beforeCount + 1,
    `${beforeCount} → ${beforeCount + 1}`,
  )
  const adminToken2 = await login('admin')
  await api('/api/system/reset', { method: 'POST', token: adminToken2 })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitCards()
  ok('AC-FN-08-种子库已重置还原', (await page.locator('[data-testid^="tutorial-card-"]').count()) === beforeCount)

  // ---------- 11. 实现图（对照 ui_m_list.html 演示态：算料 + 采购管理） ----------
  await page.goto(`${BASE}#/list?categoryId=5`, { waitUntil: 'domcontentloaded' })
  await waitCards()
  await page.fill('[data-testid="search-input"]', '算料')
  await page.click('[data-testid="search-btn"]')
  await page.waitForFunction(() => document.querySelector('[data-testid="result-line"]')?.textContent.includes('相关结果'))
  await page.waitForTimeout(300)
  await expandShell(page)
  await page.screenshot({ path: path.join(OUT_DIR, 'FE-03-impl.png'), fullPage: true })

  ok('无页面 JS 异常', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '))
  ok('请求清单-含 tutorials 与 categories', apiReqs().some((u) => u.includes('/api/tutorials')) && apiReqs().some((u) => u.includes('/api/categories')))
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
