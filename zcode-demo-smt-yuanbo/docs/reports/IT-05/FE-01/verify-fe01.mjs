// FE-01 m 端骨架浏览器验收（Playwright 直驱，跑在 web dev:5173 + server mock:3000）
// 用法：node docs/reports/FE-01/verify-fe01.mjs
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'http://localhost:5173/m.html'
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url))
const results = []
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch()
try {
  // ---------- 375 视口（AC-NF-03） ----------
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  const requests = []
  page.on('request', (r) => requests.push({ method: r.method(), url: r.url(), body: r.postData() }))

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('.phone .screen')

  // 1. 手机壳结构
  for (const sel of ['.phone', '.screen', '.notch', '.statusbar', '.homebar', '.tabbar']) {
    ok(`手机壳元素 ${sel}`, (await page.locator(sel).count()) === 1)
  }
  const noHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  )
  ok('375 宽无横向滚动条', noHScroll)

  // 2. 游客态首屏 + 5 路由占位可达
  ok('游客态首屏', (await page.getByTestId('ph-user').textContent()).includes('游客'))
  for (const [hash, title] of [
    ['#/', '首页'],
    ['#/list', '分类'],
    ['#/detail/1', '教程详情'],
    ['#/favorite', '我的收藏'],
    ['#/checkin', '学习打卡'],
  ]) {
    await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' })
    const t = await page.locator('.ph-title').textContent()
    ok(`路由 ${hash} 占位页`, t === title, t)
  }

  // 3. TabBar active 联动
  const tabCases = [
    ['#/', 'tabbar-home'],
    ['#/list', 'tabbar-list'],
    ['#/favorite', 'tabbar-favorite'],
    ['#/checkin', 'tabbar-checkin'],
  ]
  for (const [hash, testid] of tabCases) {
    await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' })
    const activeCount = await page.locator('.tabbar .tab.active').count()
    const isActive = await page.getByTestId(testid).evaluate((el) => el.classList.contains('active'))
    ok(`TabBar ${hash} 高亮 ${testid}`, activeCount === 1 && isActive)
  }
  await page.goto(`${BASE}#/detail/1`, { waitUntil: 'networkidle' })
  ok('#/detail/:id 无 tab 误高亮', (await page.locator('.tabbar .tab.active').count()) === 0)

  // 实现图（375 视口、首页静态、无弹层）
  await page.goto(`${BASE}#/`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(OUT_DIR, 'FE-01-impl.png'), fullPage: true })

  // 4. RoleSheet 打开：6 角色卡
  await page.getByTestId('role-pill-trigger').click()
  await page.waitForSelector('.sheet.show', { state: 'visible' })
  ok('弹层展开（mask+sheet）', (await page.locator('.sheet-mask.show').count()) === 1)
  const cardCount = await page.locator('.sheet .sc').count()
  ok('6 角色卡齐全', cardCount === 6, `count=${cardCount}`)

  // 5. 选角色登录（mock 后端）：AuthContext 更新 + 弹层关闭 + 回原路由
  await page.getByTestId('role-card-purchase').click()
  await page.waitForSelector('.sheet.show', { state: 'hidden', timeout: 10000 })
  const userText = await page.getByTestId('ph-user').textContent()
  ok('登录后 AuthContext 更新', userText.includes('采购'), userText)
  ok('登录后留在原路由 #/', page.url().endsWith('#/'), page.url())
  const loginReq = requests.find((r) => r.url.endsWith('/api/auth/role-login'))
  ok(
    'role-login 请求格式',
    !!loginReq && loginReq.method === 'POST' && loginReq.body === '{"erpRole":"purchase"}',
    JSON.stringify(loginReq ?? null),
  )

  // 6. 刷新恢复登录态（GET /api/auth/me + token 头）
  const meReqs = []
  page.on('request', (r) => r.url().endsWith('/api/auth/me') && meReqs.push(r))
  await page.reload({ waitUntil: 'networkidle' })
  const userText2 = await page.getByTestId('ph-user').textContent()
  ok('刷新后 me 恢复登录态', userText2.includes('采购'), userText2)
  const hasAuthHeader = meReqs[0] && (await meReqs[0].headerValue('Authorization') || '').startsWith('Bearer ')
  ok('me 请求带 Bearer token', !!hasAuthHeader)

  // 7. 401 事件联动：清 token 后广播 auth:required → 弹层自动打开
  await page.evaluate(() => {
    localStorage.removeItem('erp_token')
    window.dispatchEvent(new CustomEvent('auth:required'))
  })
  await page.waitForSelector('.sheet.show', { state: 'visible' })
  ok('401 事件自动弹层', true)

  // 辅助证据：弹层展开截图 + 桌面壳体截图
  await page.screenshot({ path: path.join(OUT_DIR, 'FE-01-rolesheet.png') })
  await page.keyboard.press('Escape')
  await page.getByTestId('role-sheet-mask').click({ force: true })
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await desktop.goto(BASE, { waitUntil: 'networkidle' })
  await desktop.screenshot({ path: path.join(OUT_DIR, 'FE-01-desktop-shell.png') })

  // 8. 414/360 视口自适应（AC-NF-03）
  for (const w of [414, 360]) {
    await page.setViewportSize({ width: w, height: 812 })
    await page.waitForTimeout(200)
    const fit = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ok(`${w} 宽自适应无横向滚动`, fit)
  }
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.pass)
fs.writeFileSync(
  path.join(OUT_DIR, 'verify-result.json'),
  JSON.stringify({ total: results.length, failed: failed.length, results }, null, 2),
)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
