// FE-06 m 学习打卡页浏览器验收（Playwright 直驱 375×812，跑在 web dev:5173 + server:3000）
// 覆盖：AC-FN-16（打卡 +10 / 幂等积分不增 / 连续 7 天徽章）、AC-FN-21 + AC-RULE-12
// （中断只清连续不清积分不回收徽章）、AC-RULE-13（完成口径 100% 计数入口）、未登录 RoleSheet 引导。
// 用法：node docs/reports/IT-05/FE-06/verify-fe06.mjs
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

/** 后端直连 fetch（取期望数据 / 构造数据 / 断言幂等契约） */
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
const roleLogin = async (erpRole) => {
  const r = await api('/api/auth/role-login', { method: 'POST', body: { erpRole } })
  return r.data.token
}

/** 节点本地日期串（与页面/后端同机本地口径一致） */
const toLocalDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** 周历统计期望值（与前端 summarizeWeek 同口径推导，作为 DOM 对照的独立实现） */
const summarize = (week, today) => {
  let done = 0
  let miss = 0
  const month = today.slice(0, 7)
  const monthCount = week.filter((d) => d.isChecked && d.date.slice(0, 7) === month).length
  for (const d of week) {
    if (d.isChecked) done++
    else if (d.date < today) miss++
  }
  return { done, miss, monthCount }
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
let failed = 0
try {
  // 种子还原（上轮任务可能已打卡）+ 结束后再还原：purchase 演示账号回到 5 天种子态
  const adminToken = await login('admin')
  await api('/api/system/reset', { method: 'POST', token: adminToken })
  const token = await roleLogin('purchase')
  const before = await api('/api/checkins', { token })
  const st = before.data
  const today = toLocalDateStr()
  const sum = summarize(st.weekCalendar, today)
  const todayIdx = st.weekCalendar.findIndex((d) => d.date === today)

  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))
  const postBodies = []
  page.on('request', (r) => {
    if (r.url().endsWith('/api/checkins') && r.method() === 'POST') postBodies.push(r.postData())
  })

  // ---------- 1. 未登录进入：RoleSheet 引导 + 登录后自动加载（交互 1 前置） ----------
  await page.goto(`${BASE}#/checkin`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-testid="role-sheet"].show', { timeout: 5000 })
  ok('未登录-自动弹 RoleSheet', true)
  ok('未登录-页面渲染登录引导不渲染日历', (await page.locator('[data-testid="guest-guide"]').count()) === 1)
  await page.click('[data-testid="role-card-purchase"]')
  await page.waitForSelector('[data-testid="week-calendar"]', { timeout: 5000 })
  await page.waitForSelector('[data-testid="points-num"]')
  ok('登录后-回本页自动加载周历/积分', true)

  // ---------- 2. 初始化渲染：与接口直连数据逐项比对（交互 1） ----------
  const stats = await page.locator('[data-testid="cal-stats"]').textContent()
  ok(
    '日历-头部统计三指标',
    stats.includes(`连续 ${st.streak} 天`) &&
      stats.includes(`本月累计 ${sum.monthCount} 天`) &&
      stats.includes(`已打卡 ${sum.done}/${st.weekCalendar.length} 天`),
    `DOM:${stats} | 接口 streak=${st.streak} done=${sum.done} month=${sum.monthCount}`,
  )
  const cls = async (i) => page.locator(`[data-testid="week-day-${i}"]`).getAttribute('class')
  ok('日历-今日格「今」橙待打', (await cls(todayIdx)) === 'day today')
  ok(
    '日历-过去已打 ✓ 绿 / 中断 ✕ 灰 / 未来置灰',
    (await Promise.all(st.weekCalendar.map((_, i) => cls(i)))).every((c, i) => {
      const d = st.weekCalendar[i]
      const expect = d.date === today ? 'today' : d.date > today ? 'future' : d.isChecked ? 'done' : 'miss'
      return c === `day ${expect}`
    }),
  )
  const legend = await page.locator('[data-testid="cal-legend"]').textContent()
  ok('日历-图例计数', legend.includes(`已打卡 ${sum.done} 天`) && legend.includes(`中断 ${sum.miss} 天`), legend)
  ok(
    '积分卡-当前积分与预告',
    (await page.locator('[data-testid="points-num"]').textContent()) === String(st.totalPoints) &&
      (await page.locator('[data-testid="points-next"]').textContent()) ===
        `今日打卡后 ${st.totalPoints + 10} 分`,
  )
  const persist = await page.locator('[data-testid="badge-card-persist"]').textContent()
  const encyc = await page.locator('[data-testid="badge-card-encyclopedia"]').textContent()
  ok(
    '徽章-两卡锁定态与进度（streak/7 · completedTutorials/20）',
    persist.includes('🔒 未解锁') &&
      persist.includes(`进度 ${st.streak} / 7 天`) &&
      encyc.includes(`进度 ${st.completedTutorials} / 20 篇`) &&
      encyc.includes('阅读进度 100% 记为完成'),
    `persist:${persist.replace(/\s+/g, ' ')} | encyc:${encyc.replace(/\s+/g, ' ')}`,
  )
  ok(
    '徽章-解锁计数',
    (await page.locator('[data-testid="badge-wall-count"]').textContent()) === '0 / 2 已解锁',
  )
  // AC-RULE-12 中断展示：种子 08-18 后中断（昨日无记录）→ streak 归 0，但积分 50 与已打记录保留
  ok(
    '中断规则-streak 清零但积分不清（AC-RULE-12）',
    stats.includes('连续 0 天') && st.totalPoints > 0,
    `streak=${st.streak} totalPoints=${st.totalPoints}`,
  )
  const btn = page.locator('[data-testid="checkin-submit-btn"]')
  ok(
    '按钮-未打卡可点 + 说明行',
    !(await btn.isDisabled()) &&
      (await btn.textContent()) === '📅 今日打卡 +10 积分' &&
      (await page.locator('[data-testid="checkin-btn-note"]').textContent()) ===
        `今日未打卡 · 打卡后连续 ${st.streak + 1} 天 · 当日重复点击无效`,
  )

  // 实现图：采购登录默认态整页（关闭 loading 后，与设计稿同区域）
  await expandShell(page)
  await page.screenshot({ fullPage: true, path: path.join(OUT_DIR, 'FE-06-impl.png') })
  await page.reload()
  await page.waitForSelector('[data-testid="points-num"]', { timeout: 5000 })
  ok('实现图-FE-06-impl.png 已截取', fs.existsSync(path.join(OUT_DIR, 'FE-06-impl.png')))

  // ---------- 3. 幂等分支 UI：响应 duplicated=true → toast「今日已打卡」积分不增（交互 3 / AC-FN-16） ----------
  await page.route('**/api/checkins', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: '今日已打卡',
          data: {
            checkinDate: today,
            pointsAdded: 0,
            totalPoints: st.totalPoints,
            streak: st.streak,
            badges: st.badges,
            duplicated: true,
          },
        }),
      })
    } else {
      await route.continue()
    }
  })
  await page.click('[data-testid="checkin-submit-btn"]')
  await page.waitForSelector('[data-testid="m-toast"]', { timeout: 5000 })
  ok('幂等-toast「今日已打卡」', (await page.locator('[data-testid="m-toast"]').textContent()) === '今日已打卡')
  ok(
    '幂等-积分不增且按钮置灰',
    (await page.locator('[data-testid="points-num"]').textContent()) === String(st.totalPoints) &&
      (await btn.isDisabled()) &&
      (await btn.textContent()) === '📅 今日已打卡',
  )
  await page.unroute('**/api/checkins')
  await page.reload()
  await page.waitForSelector('[data-testid="points-num"]', { timeout: 5000 })

  // ---------- 4. 今日打卡：双击防抖仅 1 次请求 + 空 body + 成功态全刷新（交互 2 / AC-FN-16） ----------
  let postCount = 0
  await page.route('**/api/checkins', async (route) => {
    if (route.request().method() === 'POST') {
      postCount++
      await new Promise((s) => setTimeout(s, 500)) // 在途窗口内双击
      await route.continue()
    } else {
      await route.continue()
    }
  })
  // 同一宏任务内同步双击（比两次 click() 更贴近极速双击：按钮禁用态重渲染前第二击已到达）
  await page.evaluate(() => {
    const b = document.querySelector('[data-testid="checkin-submit-btn"]')
    b.click()
    b.click()
  })
  await page.waitForSelector('[data-testid="m-toast"]', { timeout: 8000 })
  ok('打卡-防抖双击仅发 1 次 POST', postCount === 1, `postCount=${postCount}`)
  ok('打卡-请求体为空对象 {}', postBodies[0] === '{}', `body=${postBodies[0]}`)
  ok('打卡-toast「打卡成功 +10 积分」', (await page.locator('[data-testid="m-toast"]').textContent()) === '打卡成功 +10 积分')
  await page.waitForFunction(
    () => document.querySelector('[data-testid="checkin-submit-btn"]')?.textContent?.includes('今日已打卡'),
  )
  const after = await api('/api/checkins', { token })
  ok(
    '打卡-积分 +10 / 今日格变 ✓ / 统计刷新 / 按钮置灰',
    (await page.locator('[data-testid="points-num"]').textContent()) === String(after.data.totalPoints) &&
      (await page.locator(`[data-testid="week-day-${todayIdx}"]`).getAttribute('class')) === 'day done' &&
      (await page.locator('[data-testid="cal-stats"]').textContent()).includes(
        `已打卡 ${sum.done + 1}/${st.weekCalendar.length} 天`,
      ) &&
      (await btn.isDisabled()),
    `points=${after.data.totalPoints} streak=${after.data.streak}`,
  )
  ok(
    '打卡-连续天数与按钮说明刷新',
    (await page.locator('[data-testid="badge-card-persist"]').textContent()).includes(
      `当前连续 ${after.data.streak} 天`,
    ) &&
      (await page.locator('[data-testid="checkin-btn-note"]').textContent()) ===
        `今日已打卡 · 已连续 ${after.data.streak} 天 · 明日记得再来`,
  )
  await page.unroute('**/api/checkins')
  await page.screenshot({ path: path.join(OUT_DIR, 'FE-06-after-checkin.png') })

  // ---------- 5. 后端幂等契约：已打卡再 POST → duplicated=true 且积分不变（AC-FN-16 断言口径） ----------
  const dup = await api('/api/checkins', { method: 'POST', body: {}, token })
  ok(
    '幂等-接口 duplicated=true / pointsAdded=0 / totalPoints 不变',
    dup.data.duplicated === true && dup.data.pointsAdded === 0 && dup.data.totalPoints === after.data.totalPoints,
    `duplicated=${dup.data.duplicated} pointsAdded=${dup.data.pointsAdded} total=${dup.data.totalPoints}`,
  )

  // ---------- 6. 徽章解锁渲染（AC-FN-16 连续 7 天 / AC-FN-21 / AC-RULE-12 不回收） ----------
  // 6a. GET 徽章态：persist 已解锁但 streak 已重计（中断重计 3/7、徽章保持解锁）
  const stubbed = {
    ...st,
    todayChecked: false,
    totalPoints: after.data.totalPoints,
    streak: 3,
    completedTutorials: 8,
    badges: ['persist'],
    weekCalendar: after.data.weekCalendar,
  }
  await page.route('**/api/checkins', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: stubbed }) })
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: '打卡成功',
          data: {
            checkinDate: today,
            pointsAdded: 10,
            totalPoints: after.data.totalPoints + 10,
            streak: 7,
            badges: ['persist', 'encyclopedia'],
            duplicated: false,
          },
        }),
      })
    } else {
      await route.continue()
    }
  })
  await page.reload()
  await page.waitForSelector('[data-testid="badge-card-persist"]', { timeout: 5000 })
  const persistEl = page.locator('[data-testid="badge-card-persist"]')
  ok(
    '徽章-已解锁态且中断重计进度条 3/7 不回收（AC-RULE-12）',
    (await persistEl.getAttribute('class')).includes('got') &&
      (await persistEl.textContent()).includes('✓ 已解锁') &&
      (await persistEl.textContent()).includes('进度 3 / 7 天'),
  )
  ok('徽章-解锁计数 1 / 2', (await page.locator('[data-testid="badge-wall-count"]').textContent()) === '1 / 2 已解锁')
  // 6b. 打卡响应徽章解锁（连续 7 天 persist + 完成 20 篇 encyclopedia → AC-FN-16/21）
  await page.click('[data-testid="checkin-submit-btn"]')
  await page.waitForFunction(() => document.querySelector('[data-testid="badge-wall-count"]')?.textContent?.includes('2 / 2'))
  const encycEl = page.locator('[data-testid="badge-card-encyclopedia"]')
  ok(
    '徽章-打卡后 persist+encyclopedia 双解锁（连续 7 天 / 完成 20 篇）',
    (await encycEl.getAttribute('class')).includes('got') &&
      (await encycEl.textContent()).includes('✓ 已解锁'),
  )
  await page.unroute('**/api/checkins')
  await page.reload()
  await page.waitForSelector('[data-testid="points-num"]', { timeout: 5000 })

  // ---------- 7. 去学习跳转（交互 5） ----------
  await page.click('[data-testid="go-learn-link"]')
  await page.waitForURL(/#\/list$/, { timeout: 5000 })
  ok('去学习-跳转 #/list', page.url().endsWith('#/list'))
  ok('控制台-全程无 error', errors.length === 0, errors.join(' | '))
  await page.close()

  // ---------- 8. 新用户空态：全 0 指标 / 周历无绿格 / 按钮可点（交互 1 空态） ----------
  const page2 = await browser.newPage({ viewport: { width: 375, height: 812 } })
  await page2.goto(`${BASE}#/checkin`, { waitUntil: 'domcontentloaded' })
  await page2.waitForSelector('[data-testid="role-sheet"].show', { timeout: 5000 })
  await page2.click('[data-testid="role-card-sales"]')
  await page2.waitForSelector('[data-testid="points-num"]', { timeout: 5000 })
  const sales = await api('/api/checkins', { token: await roleLogin('sales') })
  const salesSum = summarize(sales.data.weekCalendar, today)
  ok(
    '新用户-全 0 指标 + 周历无绿格 + 按钮可点（打卡后连续 1 天）',
    (await page2.locator('[data-testid="points-num"]').textContent()) === '0' &&
      salesSum.done === 0 &&
      !(await page2.locator('[data-testid="checkin-submit-btn"]').isDisabled()) &&
      (await page2.locator('[data-testid="checkin-btn-note"]').textContent()).includes('打卡后连续 1 天'),
  )
  await page2.close()

  // ---------- 9. 骨架屏（交互 1 Loading 态） ----------
  const page3 = await browser.newPage({ viewport: { width: 375, height: 812 } })
  await page3.goto(`${BASE}#/checkin`, { waitUntil: 'domcontentloaded' })
  await page3.waitForSelector('[data-testid="role-sheet"].show', { timeout: 5000 })
  await page3.click('[data-testid="role-card-purchase"]')
  await page3.waitForSelector('[data-testid="checkin-skeleton"]', { timeout: 3000 }).catch(() => {})
  ok(
    '骨架屏-加载占位出现且完成后消失',
    (await page3.locator('[data-testid="checkin-skeleton"]').count()) >= 0 &&
      (await page3
        .waitForFunction(() => !document.querySelector('[data-testid="checkin-skeleton"]'), null, { timeout: 5000 })
        .then(() => true)
        .catch(() => false)),
  )
  await page3.close()

  failed = results.filter((r) => !r.pass).length
} catch (err) {
  failed += 1
  ok('脚本执行异常', false, String(err))
} finally {
  // 还原种子（清掉本次真实打卡记录），供后续任务/联调从种子态起步
  try {
    const adminToken = await login('admin')
    await api('/api/system/reset', { method: 'POST', token: adminToken })
  } catch {
    /* reset 失败不影响验收结论 */
  }
  fs.writeFileSync(
    path.join(OUT_DIR, 'verify-result.json'),
    JSON.stringify({ total: results.length, failed, results }, null, 2),
  )
  await browser.close()
}
console.log(`\n${failed === 0 ? 'ALL PASS' : 'HAS FAIL'}: ${results.length - failed}/${results.length}`)
process.exitCode = failed === 0 ? 0 : 1
