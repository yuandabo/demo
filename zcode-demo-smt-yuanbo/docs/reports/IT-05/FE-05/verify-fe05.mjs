// FE-05 m 收藏历史 #/favorite 浏览器验收（Playwright 直驱 375×812，web dev:5173 + server:3000）
// 覆盖：未登录引导+登录自动加载（交互1/AC-FN-03）、Tab 本地切换（交互2）、取消收藏局部移除（交互3/AC-FN-15 m 侧）、
//       续读跳转与已下架拦截（交互4/UI-ELEM-02/AC-RULE-04/AC-EG-10）、跨端刷新可见与进度取最新（交互5/AC-FN-15/AC-FN-23/AC-RULE-11）、
//       进度环三态（60%蓝弧/100%绿✓/30%部分弧）、骨架/网络失败/空态三态、下拉刷新手势。
// 用法：node docs/reports/IT-05/FE-05/verify-fe05.mjs
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const BASE = 'http://localhost:5173/m.html'
const API = 'http://localhost:3000'
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(OUT_DIR, '../../../..')
const DB_PATH = path.join(ROOT, 'server', 'erp.db')
const results = []
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}
const near = (actual, expect, tol) => Math.abs(actual - expect) <= tol

/** 后端直连 fetch（造数/比对，"另一端"口径：portal 收藏 UI 未交付，沿 FE-04 惯例以 API 代表 PC 端，同一数据源） */
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
const loginByRole = async (erpRole) => {
  const r = await api('/api/auth/role-login', { method: 'POST', body: { erpRole } })
  return r.data // { token, user }
}

/** 已下架教程（24）的收藏/历史只能直插 DB 复现"下架前已收藏"（POST 侧 VISIBLE_SQL 会 404） */
function seedOfflineRows(userId) {
  const db = new DatabaseSync(DB_PATH)
  db.exec('BEGIN')
  try {
    db.prepare('INSERT OR IGNORE INTO favorites (user_id, tutorial_id, created_at) VALUES (?, ?, datetime(\'now\',\'localtime\'))').run(userId, 24)
    db.prepare('INSERT OR IGNORE INTO histories (user_id, tutorial_id, progress, updated_at) VALUES (?, ?, 100, datetime(\'now\',\'localtime\',\'-2 hour\'))').run(userId, 24)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  } finally {
    db.close()
  }
}

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

/** 合成 touch 下拉（TouchEvent/Touch 构造器 Chromium 支持），驱动 usePullToRefresh 手势链 */
const pullDown = (page, distance = 160) =>
  page.evaluate((distance) => {
    const el = document.querySelector('.list-body')
    const mk = (y) => new Touch({ identifier: 1, target: el, clientX: 187, clientY: y })
    const fire = (type, y) =>
      el.dispatchEvent(new TouchEvent(type, { touches: [mk(y)], changedTouches: [mk(y)], cancelable: true, bubbles: true }))
    fire('touchstart', 300)
    for (let y = 300; y <= 300 + distance; y += 20) fire('touchmove', y)
    fire('touchend', 300 + distance)
  }, distance)

// ---------- 前置：还原种子 + 采购账号造数（收藏 3/5/7 + 历史 60/100/30 + 已下架 24 直插 DB） ----------
const admin = (await api('/api/auth/login', { method: 'POST', body: { username: 'admin', password: '123456' } })).data
await api('/api/system/reset', { method: 'POST', token: admin.token })
const purchase = await loginByRole('purchase')
const fav = async (id) => api(`/api/favorites/${id}`, { method: 'POST', token: purchase.token })
const prog = async (id, progress) =>
  api(`/api/histories/${id}`, { method: 'POST', body: { progress }, token: purchase.token })
await fav(3)
await fav(5)
await fav(7)
await prog(3, 60)
await prog(5, 100)
await prog(7, 30)
seedOfflineRows(purchase.user.id)
const titles = {}
for (const id of [3, 5, 7]) titles[id] = (await api(`/api/tutorials/${id}`, { token: purchase.token })).data.title
ok('前置-种子就绪（采购收藏 3/5/7 + 历史 60/100/30 + 已下架 24）', true, Object.values(titles).join(' / '))

const browser = await chromium.launch()
try {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await context.newPage()
  const reqs = []
  const pageErrors = []
  page.on('request', (r) => reqs.push({ method: r.method(), url: r.url() }))
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  const favGets = () => reqs.filter((r) => r.url.includes('/api/favorites') && r.method === 'GET' && !r.url.includes('/api/favorites/'))
  const hisGets = () => reqs.filter((r) => r.url.includes('/api/histories') && r.method === 'GET')
  const dels = () => reqs.filter((r) => r.method === 'DELETE' && r.url.includes('/api/favorites/'))

  // ---------- 1. 未登录引导（交互 1）：RoleSheet → 选角色 → 回本页自动加载 ----------
  await page.goto(`${BASE}#/favorite`)
  await page.getByTestId('role-sheet').waitFor({ state: 'visible', timeout: 5000 })
  ok('1-1 未登录进入弹 RoleSheet（AC-FN-03）', await page.getByTestId('role-sheet').isVisible())
  ok('1-2 未登录不发起收藏/历史请求（先引导后取数）', favGets().length === 0 && hisGets().length === 0)
  await page.getByTestId('role-card-purchase').click()
  await page.getByTestId('tab-fav').waitFor({ state: 'visible', timeout: 5000 })
  await page.getByTestId('fav-card-3').waitFor({ timeout: 5000 })
  ok('1-3 登录后回本页自动并行加载（GET favorites+histories）', favGets().length >= 1 && hisGets().length >= 1, `fav=${favGets().length} his=${hisGets().length}`)
  ok('1-4 导航标题「收藏与历史」', (await page.getByTestId('fav-nav-title').textContent()) === '收藏与历史')
  ok(
    '1-5 同步提示条文案（设计稿同源）',
    (await page.getByTestId('sync-note').textContent()) === '🔄 与 PC 端实时同步 · 任一端收藏 / 取消，另一端刷新即可见',
  )
  ok('1-6 TabBar「收藏」active（路由联动）', (await page.getByTestId('tabbar-favorite').getAttribute('class')).includes('active'))
  ok('1-7 收藏 Tab 初始选中 + 计数 4', (await page.getByTestId('tab-fav').getAttribute('class')).includes('on') && (await page.getByTestId('tab-fav').textContent()) === '收藏4')

  // ---------- 2. 收藏面板渲染 + 已下架灰显（UI-ELEM-02 / AC-RULE-04） ----------
  const card3 = page.getByTestId('fav-card-3')
  ok('2-1 收藏卡渲染标题/分类徽标/收藏日期/浏览量', (await card3.textContent()).includes(titles[3]) && (await card3.textContent()).includes('收藏于') && (await card3.textContent()).includes('👁'))
  ok('2-2 正常卡 ❤️ 取消入口', (await page.getByTestId('fav-unfav-btn-3').textContent()) === '❤️')
  const card24 = page.getByTestId('fav-card-24')
  ok('2-3 已下架灰显（.off）+「已下架」标签', (await card24.getAttribute('class')).includes('off') && (await card24.textContent()).includes('已下架'))
  ok('2-4 已下架卡无正文入口（无 Link，🤍 心形）', (await card24.locator('a').count()) === 0 && (await page.getByTestId('fav-unfav-btn-24').textContent()) === '🤍')
  ok('2-5 列表末尾留存提示', (await page.getByTestId('fav-end-hint').textContent()) === '已下架教程仅作留存展示，不可进入正文')
  await card24.click()
  await page.waitForTimeout(300)
  ok('2-6 已下架卡点击拦截不进正文（AC-EG-10）', page.url().endsWith('#/favorite'))

  // ---------- 实现图（复刻评审用）：收藏 Tab 全页静态（登录态+4卡+已下架灰显） ----------
  await expandShell(page)
  await page.screenshot({ path: path.join(OUT_DIR, 'FE-05-impl.png'), fullPage: true })

  // ---------- 3. 续读跳转（交互 4）：正常卡 → #/detail/:id ----------
  await page.getByTestId('fav-card-link-3').click()
  await page.getByTestId('detail-title').waitFor({ timeout: 5000 })
  ok('3-1 收藏卡点击进入详情', page.url().endsWith('#/detail/3'), page.url())
  await page.goBack()
  await page.getByTestId('fav-card-3').waitFor({ timeout: 5000 })

  // ---------- 4. 历史面板 + 进度环（AC-FN-23 / AC-RULE-11）+ Tab 本地切换（交互 2） ----------
  const hisGetBefore = hisGets().length
  await page.getByTestId('tab-his').click()
  await page.getByTestId('his-card-3').waitFor({ timeout: 5000 })
  ok('4-1 Tab 切换本地面板（无新 HTTP）', hisGets().length === hisGetBefore && (await page.getByTestId('pane-fav').getAttribute('class')).includes('hidden'))
  ok('4-2 历史 Tab 计数 4', (await page.getByTestId('tab-his').textContent()) === '历史4')
  const ring3 = page.getByTestId('progress-ring-3')
  const ring3Style = await ring3.evaluate((el) => el.getAttribute('style'))
  ok('4-3 进度环 60% 蓝弧（216°=60×3.6）+ 中心 60%', ring3Style.includes('216deg') && (await ring3.textContent()) === '60%', ring3Style)
  const ring5 = page.getByTestId('progress-ring-5')
  const ring5Style = await ring5.evaluate((el) => el.getAttribute('style'))
  ok('4-4 进度环 100% 绿环 ✓（完成口径，浏览器将 #16a34a 归一化为 rgb）', (await ring5.getAttribute('class')).includes('done') && (await ring5.textContent()) === '✓' && ring5Style.includes('rgb(22, 163, 74)'), ring5Style)
  const ring7 = page.getByTestId('progress-ring-7')
  ok('4-5 进度环 30% 部分弧（108°）', (await ring7.evaluate((el) => el.getAttribute('style'))).includes('108deg') && (await ring7.textContent()) === '30%')
  ok('4-6 历史时间口径（进行中=上次阅读·续读与PC同步 / 完成=完成于）', (await page.getByTestId('his-card-3').textContent()).includes('上次阅读') && (await page.getByTestId('his-card-3').textContent()).includes('续读与 PC 同步') && (await page.getByTestId('his-card-5').textContent()).includes('完成于'))
  ok('4-7 已下架历史条目同规则灰显+标签（AC-FN-23）', (await page.getByTestId('his-card-24').getAttribute('class')).includes('off') && (await page.getByTestId('his-card-24').textContent()).includes('已下架'))
  await page.getByTestId('his-card-24').click()
  await page.waitForTimeout(300)
  ok('4-8 已下架历史卡点击拦截', page.url().endsWith('#/favorite'))
  ok('4-9 历史末尾三端一致提示', (await page.getByTestId('his-end-hint').textContent()) === '阅读进度按账号记录，三端一致')

  // 实现图补充：历史 Tab（进度环区）
  await expandShell(page)
  await page.screenshot({ path: path.join(OUT_DIR, 'FE-05-history.png'), fullPage: true })

  // ---------- 5. 跨端取最新（AC-RULE-11）：PC 续读 80% → m 刷新后环 80% ----------
  await prog(3, 80) // 模拟 PC 端续读至 80%（同一数据源）
  await page.reload()
  await page.getByTestId('fav-card-3').waitFor({ timeout: 5000 })
  await page.getByTestId('tab-his').click() // reload 后 Tab 重置为收藏，先切历史
  await page.getByTestId('his-card-3').waitFor({ timeout: 5000 })
  ok('5-1 m 刷新后进度环取最新 80%（288°）', (await page.getByTestId('progress-ring-3').evaluate((el) => el.getAttribute('style'))).includes('288deg') && (await page.getByTestId('progress-ring-3').textContent()) === '80%')

  // 续读一致性：历史环值 = 详情页续读条值
  await page.getByTestId('his-card-link-3').click()
  await page.getByTestId('resume-bar').waitFor({ timeout: 5000 })
  const resumeTxt = await page.getByTestId('resume-bar').textContent()
  ok('5-2 历史进度环与详情续读条同值（跨端同值）', resumeTxt.includes('80%'), resumeTxt)
  await page.goBack()
  await page.getByTestId('fav-card-3').waitFor({ timeout: 5000 }) // 返回后页面重挂载，Tab 重置收藏

  // ---------- 6. 取消收藏（交互 3 / AC-FN-15 m 侧）：局部移除 + DELETE 请求 + PC 口径不可见 ----------
  await page.getByTestId('tab-fav').click()
  await page.getByTestId('fav-card-7').waitFor({ timeout: 5000 })
  const delBefore = dels().length
  await page.getByTestId('fav-unfav-btn-7').click()
  await page.getByTestId('fav-card-7').waitFor({ state: 'detached', timeout: 5000 })
  ok('6-1 取消后卡片局部移除（不整页刷新）', true)
  ok('6-2 Network 确认 DELETE /api/favorites/7', dels().length === delBefore + 1, dels().map((d) => d.url).pop())
  ok('6-3 Tab 计数 -1（4→3）', (await page.getByTestId('tab-fav').textContent()) === '收藏3')
  const pcView1 = await api('/api/favorites?page=1&pageSize=100', { token: purchase.token })
  ok('6-4 PC 口径（同数据源 GET）刷新后同样不可见', !pcView1.data.list.some((f) => f.tutorialId === 7))
  // 已下架条目也可取消（契约：取消不校验可见性）
  await page.getByTestId('fav-unfav-btn-24').click()
  await page.getByTestId('fav-card-24').waitFor({ state: 'detached', timeout: 5000 })
  const pcView2 = await api('/api/favorites?page=1&pageSize=100', { token: purchase.token })
  ok('6-5 已下架条目取消收藏从列表移除', !pcView2.data.list.some((f) => f.tutorialId === 24))

  // ---------- 7. AC-FN-15 双向：PC 收藏 → m 刷新可见；m 操作 → PC 口径可见 ----------
  await api('/api/favorites/7', { method: 'POST', token: purchase.token }) // 模拟 PC 端收藏 T=7
  await page.reload()
  await page.getByTestId('fav-card-7').waitFor({ timeout: 5000 })
  ok('7-1 PC 端收藏 → m 刷新后出现（AC-FN-15 →）', (await page.getByTestId('tab-fav').textContent()) === '收藏3')
  // m 端操作（经详情页 ❤️ 取消 5）→ PC 口径可见
  await page.getByTestId('fav-card-link-5').click()
  await page.getByTestId('fav-btn').waitFor({ timeout: 5000 })
  const delBefore2 = dels().length
  await page.getByTestId('fav-btn').click()
  for (let i = 0; i < 30 && dels().length <= delBefore2; i++) await page.waitForTimeout(100)
  ok('7-2 m 端操作发出 DELETE（m 侧请求）', dels().length > delBefore2)
  const pcView3 = await api('/api/favorites?page=1&pageSize=100', { token: purchase.token })
  ok('7-3 m 端操作 → PC 口径（同数据源）刷新即可见', !pcView3.data.list.some((f) => f.tutorialId === 5))
  // 回置 5 的收藏态，保持与实现图演示数据一致（后续空态场景会整体 reset）
  await api('/api/favorites/5', { method: 'POST', token: purchase.token })

  // ---------- 8. 下拉刷新（交互 5 触发器，复用 UI-IXD-13 手势） ----------
  await page.goto(`${BASE}#/favorite`)
  await page.getByTestId('fav-card-3').waitFor({ timeout: 5000 })
  const favGetBefore = favGets().length
  await pullDown(page, 160)
  await page.getByTestId('refresh-bar').getByText('正在刷新…').waitFor({ timeout: 3000 }).catch(() => {})
  ok('8-1 下拉过阈值释放进入刷新态（正在刷新…）', (await page.getByTestId('refresh-bar').textContent()).includes('正在刷新…') || favGets().length > favGetBefore)
  await page.waitForTimeout(600)
  ok('8-2 下拉触发重取（GET favorites）', favGets().length > favGetBefore)

  // ---------- 9. 三态：骨架（延迟 400ms）/ 网络失败+重试 ----------
  await page.route('**/api/favorites**', async (route) => {
    await new Promise((r) => setTimeout(r, 400))
    if (route.request().method() === 'GET') await route.abort()
    else await route.continue()
  })
  // 同 URL（仅 hash）goto 是 same-document 导航不重载，先经 about:blank 强制真导航触发加载态
  await page.goto('about:blank')
  await page.goto(`${BASE}#/favorite`)
  await page.getByTestId('pane-skeleton').waitFor({ timeout: 3000 }).catch(() => {})
  ok('9-1 加载中活动面板骨架卡占位', await page.getByTestId('pane-skeleton').count() > 0)
  await page.getByTestId('load-error').waitFor({ timeout: 5000 })
  ok('9-2 网络失败错误态 + 重试入口', (await page.getByTestId('load-error').textContent()).includes('加载失败'))
  await page.unroute('**/api/favorites**')
  await page.getByTestId('load-retry-btn').click()
  await page.getByTestId('fav-card-3').waitFor({ timeout: 5000 })
  ok('9-3 重试恢复列表', true)

  // ---------- 10. 空态：无收藏/无历史账号（reset 后 warehouse） ----------
  // setup 首次 reset 已清空 tokens 表，admin.token 随之失效，须重登再 reset
  const adminRe = (await api('/api/auth/login', { method: 'POST', body: { username: 'admin', password: '123456' } })).data
  await api('/api/system/reset', { method: 'POST', token: adminRe.token })
  const page2 = await context.newPage()
  await page2.goto(`${BASE}#/favorite`)
  await page2.getByTestId('role-sheet').waitFor({ timeout: 5000 })
  await page2.getByTestId('role-card-warehouse').click()
  await page2.getByTestId('empty-fav').waitFor({ timeout: 5000 })
  ok('10-1 收藏空态引导（去首页逛逛）', (await page2.getByTestId('empty-fav').textContent()).includes('暂无收藏'))
  await page2.getByTestId('empty-fav-home-link').click()
  await page2.waitForTimeout(400)
  ok('10-2 空态引导跳首页', page2.url().endsWith('#/'))
  await page2.goto(`${BASE}#/favorite`)
  await page2.getByTestId('tab-his').click()
  await page2.getByTestId('empty-his').waitFor({ timeout: 5000 })
  ok('10-3 历史空态「暂无阅读记录」', (await page2.getByTestId('empty-his').textContent()).includes('暂无阅读记录'))
  await page2.screenshot({ path: path.join(OUT_DIR, 'FE-05-empty.png') })

  ok('10-4 全程无未捕获 JS 异常', pageErrors.length === 0, pageErrors.slice(0, 3).join('; '))
} finally {
  // 还原种子（测试造数不残留）
  try {
    const admin2 = (await api('/api/auth/login', { method: 'POST', body: { username: 'admin', password: '123456' } })).data
    await api('/api/system/reset', { method: 'POST', token: admin2.token })
  } catch (e) {
    console.error('reset cleanup failed:', e)
  }
  await browser.close()
}

const passed = results.filter((r) => r.pass).length
fs.writeFileSync(path.join(OUT_DIR, 'verify-result.json'), JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2))
console.log(`\n${passed}/${results.length} passed`)
process.exitCode = passed === results.length ? 0 : 1
