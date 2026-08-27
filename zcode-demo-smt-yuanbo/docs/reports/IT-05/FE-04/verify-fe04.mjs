// FE-04 m 详情 #/detail/:id 浏览器验收（Playwright 直驱，web dev:5173 + server:3000）
// 覆盖：初始化/骨架（交互1）、滚动保存+失败静默（交互2/AC-RULE-11/AC-EG-17）、续读跨端（交互3/AC-FN-04/UI-IXD-11）、
//       字号三档（交互4/AC-RULE-21/UI-IXD-04）、收藏未登录引导（交互5/AC-FN-03）、评价留言共用记录（交互6/AC-FN-25/UI-IXD-07/08）、
//       已下架/不可见提示页（交互7/AC-FN-20/AC-EG-10）、视频不自动播放+失效占位（交互8/AC-EG-02）、sanitize 白名单（AC-NF-04）
// 用法：node docs/reports/IT-05/FE-04/verify-fe04.mjs
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
const near = (actual, expect, tol) => Math.abs(actual - expect) <= tol

/** 后端直连 fetch（造数/比对） */
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

/** 详情滚动容器与可滚动高度（正文定位/百分比计算口径） */
const scrollerInfo = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.scroll')
    return { scrollTop: el.scrollTop, denom: el.scrollHeight - el.clientHeight }
  })

/** 展示弹窗计数（评价/进度失败不得弹窗） */
const dialogCounter = (page) => {
  const c = { count: 0 }
  page.on('dialog', (d) => {
    c.count += 1
    void d.dismiss()
  })
  return c
}

const detail3 = (await api('/api/tutorials/3')).data
ok('前置-种子教程 3 就绪（含 videoUrl）', detail3.videoUrl !== null && detail3.tags.length === 3, `tags=${detail3.tags.length}`)

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  const reqs = []
  const pageErrors = []
  const dialogs = dialogCounter(page)
  page.on('request', (r) => reqs.push({ url: r.url(), body: r.postData() }))
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  const historiesReqs = () => reqs.filter((r) => r.url.includes('/api/histories/'))

  // ---------- 1. 游客初始化：骨架 → 正文（交互 1） ----------
  await page.route('**/api/tutorials/3', async (route) => {
    await new Promise((s) => setTimeout(s, 400))
    await route.continue().catch(() => {})
  })
  await page.goto(`${BASE}#/detail/3`, { waitUntil: 'domcontentloaded' })
  ok('初始化-正文骨架屏（导航先渲染）', (await page.locator('[data-testid="detail-skeleton"]').count()) === 1 && (await page.locator('[data-testid="back-btn"]').count()) === 1)
  await page.waitForSelector('[data-testid="rich-content"]', { timeout: 8000 })
  await page.unroute('**/api/tutorials/3')

  ok('初始化-导航标题=教程标题', (await page.locator('[data-testid="detail-nav-title"]').textContent()) === detail3.title)
  ok(
    '初始化-收藏按钮默认未收藏',
    (await page.locator('[data-testid="fav-btn"]').getAttribute('class')) === 'fav' &&
      (await page.locator('[data-testid="fav-btn"]').textContent()).includes('收藏'),
  )
  const topText = await page.locator('.a-top').textContent()
  ok('初始化-分类徽标+标签行', topText.includes(detail3.categoryName) && detail3.tags.every((t) => topText.includes(t)))
  const metaText = await page.locator('[data-testid="detail-meta"]').textContent()
  ok('初始化-meta 四项（浏览/收藏/作者/更新于）', metaText.includes('浏览') && metaText.includes('收藏') && metaText.includes('✍') && metaText.includes('更新于'))
  ok('初始化-摘要卡（左蓝边白卡）', (await page.locator('.a-intro').count()) === 1 && (await page.locator('.a-intro').textContent()).includes(detail3.summary.slice(0, 10)))
  const h3Count = await page.locator('[data-testid="rich-content"] h3').count()
  ok('初始化-快照正文步骤完整渲染', h3Count === (detail3.content.match(/<h3>/g) ?? []).length, `h3=${h3Count}`)
  const stepNo = await page
    .locator('[data-testid="rich-content"] h3')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el, '::before')
      return { content: s.content, bg: s.backgroundColor, w: s.width }
    })
  ok(
    '初始化-步骤蓝底圆号（CSS 计数器）',
    stepNo.content.includes('counter(step)') && stepNo.bg === 'rgb(0, 102, 255)' && stepNo.w === '24px',
    JSON.stringify(stepNo),
  )
  ok('初始化-游客无续读条（myProgress null）', (await page.locator('[data-testid="resume-bar"]').count()) === 0)
  ok('初始化-视频区不自动播放（无 video 元素）', (await page.locator('[data-testid="video-area"]').count()) === 1 && (await page.locator('[data-testid="video-player"]').count()) === 0 && (await page.locator('[data-testid="video-play-btn"]').count()) === 1)
  const noteText = await page.locator('[data-testid="help-note"]').textContent()
  ok('初始化-操作条计数与同步说明', noteText.includes(`👍${detail3.helpfulYes}`) && noteText.includes(`👎${detail3.helpfulNo}`) && noteText.includes('进度已与 PC 端同步'))
  ok('初始化-评价未选中/留言框隐藏', (await page.locator('.vote.on').count()) === 0 && !(await page.locator('[data-testid="comment-input"]').isVisible()))

  // 游客滚动不保存进度（交互 2 前置）
  const info0 = await scrollerInfo(page)
  await page.evaluate((y) => {
    document.querySelector('.scroll').scrollTop = y
  }, Math.round(info0.denom * 0.6))
  await page.waitForTimeout(1800)
  ok('游客滚动-不发 histories 请求', historiesReqs().length === 0, `reqs=${historiesReqs().length}`)

  // ---------- 2. 字号三档：仅正文区域变化 + 本地记忆（交互 4 / AC-RULE-21 / UI-IXD-04） ----------
  const fontOf = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).fontSize)
  const navFontBefore = await fontOf('.nav-title')
  const introFontBefore = await fontOf('.a-intro')
  await page.click('[data-testid="fs-opt-15"]')
  ok('字号-标准 15px 仅正文生效', (await fontOf('.article')) === '15px' && (await fontOf('.nav-title')) === navFontBefore && (await fontOf('.a-intro')) === introFontBefore)
  ok('字号-档位高亮切换', (await page.locator('[data-testid="fs-opt-15"].on').count()) === 1 && (await page.locator('[data-testid="fs-opt-17"].on').count()) === 0)
  await page.click('[data-testid="fs-opt-19"]')
  ok('字号-特大 19px', (await fontOf('.article')) === '19px')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-testid="rich-content"]')
  ok('字号-刷新后档位保持（localStorage）', (await fontOf('.article')) === '19px' && (await page.locator('[data-testid="fs-opt-19"].on').count()) === 1)
  await page.click('[data-testid="fs-opt-17"]')

  // ---------- 3. sanitize 白名单（AC-NF-04，route 注入恶意富文本） ----------
  const evil = '<h3>净化步骤</h3><script>window.__pwned=1</script><img src="x" onerror="window.__pwned=2"><p>正文段落</p><a href="javascript:alert(1)">链</a>'
  await page.route('**/api/tutorials/3', async (route) => {
    const real = await (await fetch(API + '/api/tutorials/3')).json()
    real.data.content = evil
    await route.fulfill({ json: real })
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-testid="rich-content"]')
  const pwned = await page.evaluate(() => window.__pwned)
  const scriptCount = await page.locator('[data-testid="rich-content"] script').count()
  const imgOnerror = await page.locator('[data-testid="rich-content"] img').evaluate((el) => el.getAttribute('onerror'))
  const jsHref = await page.locator('[data-testid="rich-content"] a').evaluate((el) => el.getAttribute('href'))
  ok('sanitize-script 剥离不执行', scriptCount === 0 && pwned === undefined)
  ok('sanitize-onerror 事件属性剥离', imgOnerror === null)
  ok('sanitize-javascript: 链接剥离', jsHref === null)
  ok('sanitize-白名单内容保留', (await page.locator('[data-testid="rich-content"] h3').count()) === 1)
  await page.unroute('**/api/tutorials/3')

  // ---------- 4. 视频失效占位（交互 8 / AC-EG-02，种子 videoUrl 为无效直链） ----------
  await page.click('[data-testid="video-play-btn"]')
  await page.waitForSelector('[data-testid="video-fallback"]', { timeout: 10000 })
  ok('视频-点击才加载，失效显示占位文案', (await page.locator('[data-testid="video-fallback"]').textContent()).includes('视频暂不可用') && (await page.locator('[data-testid="video-fallback"]').textContent()).includes('可先阅读图文步骤'))
  ok('视频-图文步骤不受阻断', (await page.locator('[data-testid="rich-content"] h3').count()) >= 1)

  // ---------- 5. 已下架提示页（交互 7 / AC-FN-20 / AC-EG-10） ----------
  await page.goto(`${BASE}#/detail/24`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-testid="offline-banner"]')
  const bannerText = await page.locator('[data-testid="offline-banner"]').textContent()
  ok('已下架-横幅文案', bannerText.includes('该教程已下架，正文不可见') && bannerText.includes('可从下方同类推荐继续学习'))
  ok('已下架-正文遮蔽块', (await page.locator('.off-pre .bd').count()) === 1)
  const relatedCount = await page.locator('[data-testid^="related-item-"]').count()
  ok('已下架-同类推荐列表（接口同源）', relatedCount >= 2, `related=${relatedCount}`)
  ok('已下架-评价操作条禁用', (await page.locator('[data-testid="vote-yes-btn"]').isDisabled()) && (await page.locator('[data-testid="vote-no-btn"]').isDisabled()))
  ok('已下架-无收藏入口', (await page.locator('[data-testid="fav-btn"]').count()) === 0)
  await page.screenshot({ path: path.join(OUT_DIR, 'FE-04-offline.png'), fullPage: false })
  await page.click('[data-testid="related-item-3"]')
  await page.waitForSelector('[data-testid="rich-content"]')
  ok('已下架-推荐可跳转正常详情', page.url().endsWith('#/detail/3') && (await page.locator('[data-testid="detail-title"]').textContent()) === detail3.title)

  // 不可见分支（AC-RULE-02 兜底文案）
  await page.goto(`${BASE}#/detail/9999`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-testid="offline-banner"]')
  ok('不可见-文案与无推荐', (await page.locator('[data-testid="offline-banner"]').textContent()).includes('该教程不存在或暂不可见') && (await page.locator('[data-testid^="related-item-"]').count()) === 0)

  // ---------- 6. 网络失败 → 重试（Loading/空/正常三态） ----------
  await page.route('**/api/tutorials/3', (route) => route.abort())
  await page.goto(`${BASE}#/detail/3`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-testid="load-error"]')
  ok('网络失败-错误态+重试入口', (await page.locator('[data-testid="load-error"]').textContent()).includes('加载失败'))
  await page.unroute('**/api/tutorials/3')
  await page.click('[data-testid="load-retry-btn"]')
  await page.waitForSelector('[data-testid="rich-content"]')
  ok('网络失败-重试恢复正常', (await page.locator('[data-testid="detail-title"]').textContent()) === detail3.title)

  ok('游客链路-无 JS 报错/无弹窗', pageErrors.length === 0 && dialogs.count === 0, `errors=${pageErrors.length} dialogs=${dialogs.count}`)

  // ---------- 7. 收藏未登录引导（交互 5 / AC-FN-03）→ 登录后续读/滚动/评价 ----------
  const page2 = await browser.newPage({ viewport: { width: 375, height: 812 } })
  const reqs2 = []
  page2.on('request', (r) => reqs2.push({ url: r.url(), body: r.postData() }))
  page2.on('pageerror', (e) => pageErrors.push(String(e)))
  await page2.goto(`${BASE}#/detail/3`, { waitUntil: 'domcontentloaded' })
  await page2.waitForSelector('[data-testid="rich-content"]')
  const favCount0 = Number((await page2.locator('[data-testid="detail-meta"]').textContent()).match(/收藏 (\d+)/)?.[1] ?? 0)
  await page2.click('[data-testid="fav-btn"]')
  await page2.waitForSelector('[data-testid="role-sheet"]')
  ok('收藏-未登录弹 RoleSheet', (await page2.locator('[data-testid="role-sheet"]').isVisible()) === true)
  await page2.click('[data-testid="role-card-purchase"]')
  await page2.waitForSelector('[data-testid="fav-btn"].on', { timeout: 8000 })
  ok('收藏-登录后回原位收藏成功（AC-FN-03）', (await page2.locator('[data-testid="fav-btn"]').textContent()).includes('已收藏'))
  const favCount1 = Number((await page2.locator('[data-testid="detail-meta"]').textContent()).match(/收藏 (\d+)/)?.[1] ?? 0)
  ok('收藏-计数 +1 局部更新', favCount1 === favCount0 + 1, `${favCount0}→${favCount1}`)
  const me = await loginByRole('purchase')
  const favList = await api('/api/favorites', { token: me.token })
  ok('收藏-接口侧已入库', favList.data.list.some((f) => f.tutorialId === 3))

  // 续读：模拟 PC 端写 75% → m 同账号显示 75%（AC-FN-04 跨端）
  await api('/api/histories/3', { method: 'POST', body: { progress: 75 }, token: me.token })
  await page2.reload({ waitUntil: 'domcontentloaded' })
  await page2.waitForSelector('[data-testid="resume-bar"]')
  const resumeText = await page2.locator('[data-testid="resume-bar"]').textContent()
  const resumeWidth = await page2.locator('[data-testid="resume-bar"] .bar i').evaluate((el) => el.style.width)
  ok('续读-显示 75% 与进度条宽度（UI-IXD-11）', resumeText.includes('上次读到 75%') && resumeWidth === '75%')
  await page2.click('[data-testid="resume-continue-btn"]')
  await page2.waitForTimeout(900)
  const info2 = await scrollerInfo(page2)
  ok('续读-点击定位到上次位置', near(info2.scrollTop, info2.denom * 0.75, 12), `scrollTop=${Math.round(info2.scrollTop)} expect≈${Math.round(info2.denom * 0.75)}`)

  // 滚动保存 60%（AC-RULE-11 单值覆盖，Network 确认）
  await page2.evaluate((y) => {
    document.querySelector('.scroll').scrollTop = y
  }, Math.round(info2.denom * 0.6))
  await page2.waitForTimeout(2000)
  const saves = reqs2.filter((r) => r.url.includes('/api/histories/3')).map((r) => JSON.parse(r.body))
  ok('滚动保存-POST histories progress=60', saves.some((b) => b.progress === 60), JSON.stringify(saves))
  const hist = await api('/api/histories', { token: me.token })
  ok('滚动保存-单值覆盖（同教程仅一条，取最新）', hist.data.list.filter((h) => h.tutorialId === 3).length === 1 && hist.data.list.find((h) => h.tutorialId === 3).progress === 60)

  // 评价：有帮助 → 没帮助互斥切换 + 留言（UI-IXD-07/08，AC-FN-25 与 PC 共用记录）
  await page2.click('[data-testid="vote-yes-btn"]')
  await page2.waitForSelector('[data-testid="vote-yes-btn"].on')
  ok('评价-有帮助选中（+1 计数）', (await page2.locator('[data-testid="vote-yes-btn"]').textContent()).includes(`有帮助 ${detail3.helpfulYes + 1}`))
  await page2.click('[data-testid="vote-no-btn"]')
  await page2.waitForSelector('[data-testid="vote-no-btn"].on')
  ok('评价-二选一互斥切换（计数联动）', !(await page2.locator('[data-testid="vote-yes-btn"].on').count()) && (await page2.locator('[data-testid="vote-no-btn"]').textContent()).includes(`没帮助 ${detail3.helpfulNo + 1}`))
  ok('评价-「没帮助」展开留言框 maxlength=200', (await page2.locator('[data-testid="comment-input"]').isVisible()) && (await page2.locator('[data-testid="comment-input"]').getAttribute('maxlength')) === '200')
  await page2.fill('[data-testid="comment-input"]', '步'.repeat(250))
  ok('评价-留言超长截断 200 字', (await page2.inputValue('[data-testid="comment-input"]')).length === 200)
  await page2.fill('[data-testid="comment-input"]', '自动化验证留言：步骤三截图与界面不一致')
  await page2.click('[data-testid="comment-submit-btn"]')
  await page2.waitForSelector('[data-testid="m-toast"]', { timeout: 5000 })
  ok('评价-留言提交后收起+提示已记录', !(await page2.locator('[data-testid="comment-input"]').isVisible()) && (await page2.locator('[data-testid="m-toast"]').textContent()).includes('留言已提交'))
  await page2.reload({ waitUntil: 'domcontentloaded' })
  await page2.waitForSelector('[data-testid="rich-content"]')
  ok('评价-myFeedback 回显（与 PC 共用同一条记录，AC-FN-25）', (await page2.locator('[data-testid="vote-no-btn"].on').count()) === 1 && !(await page2.locator('[data-testid="vote-yes-btn"].on').count()))

  // 取消收藏：计数 -1
  await page2.click('[data-testid="fav-btn"]')
  await page2.waitForSelector('[data-testid="fav-btn"]:not(.on)', { timeout: 8000 })
  const favCount2 = Number((await page2.locator('[data-testid="detail-meta"]').textContent()).match(/收藏 (\d+)/)?.[1] ?? 0)
  ok('收藏-再点取消收藏计数 -1', favCount2 === favCount1 - 1, `${favCount1}→${favCount2}`)

  // 保存失败静默：abort histories → 滚动 → 不弹窗不报错，进度不归零（AC-EG-17）
  const dialogs2 = dialogCounter(page2)
  await page2.route('**/api/histories/**', (route) => route.abort())
  await page2.evaluate((y) => {
    document.querySelector('.scroll').scrollTop = y
  }, Math.round(info2.denom * 0.4))
  await page2.waitForTimeout(3500)
  ok('进度保存失败-静默重试仍失败不弹窗', dialogs2.count === 0 && (await page2.locator('[data-testid="m-toast"]').count()) === 0, `dialogs=${dialogs2.count}`)
  await page2.unroute('**/api/histories/**')

  // ---------- 8. 实现图：登录态 + 续读 75% + 已收藏 + 字号浮层（与 ui_m_detail.html 演示态同区域） ----------
  // 用 sales 全新角色（无评价记录）还原设计稿「评价未选中」演示态
  const page3 = await browser.newPage({ viewport: { width: 375, height: 812 } })
  const me3 = await loginByRole('sales')
  await api('/api/histories/3', { method: 'POST', body: { progress: 75 }, token: me3.token })
  await api('/api/favorites/3', { method: 'POST', token: me3.token })
  await page3.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('erp_token', token)
      localStorage.setItem('erp_user', JSON.stringify(user))
    },
    { token: me3.token, user: me3.user },
  )
  await page3.goto(`${BASE}#/detail/3`, { waitUntil: 'domcontentloaded' })
  await page3.waitForSelector('[data-testid="resume-bar"]')
  await page3.waitForSelector('[data-testid="fs-panel"]')
  await expandShell(page3)
  await page3.waitForTimeout(300)
  await page3.screenshot({ path: path.join(OUT_DIR, 'FE-04-impl.png'), fullPage: true })
  ok('实现图-已截取（FE-04-impl.png）', fs.existsSync(path.join(OUT_DIR, 'FE-04-impl.png')))

  ok('登录链路-无 JS 报错', pageErrors.length === 0, `errors=${pageErrors.length}`)

  // ---------- 还原种子（后续任务/验收口径不受本脚本写入影响） ----------
  const admin = await api('/api/auth/login', { method: 'POST', body: { username: 'admin', password: '123456' } })
  await api('/api/system/reset', { method: 'POST', token: admin.data.token })
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.pass)
fs.writeFileSync(path.join(OUT_DIR, 'verify-result.json'), JSON.stringify(results, null, 2))
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) {
  console.log('FAILED:', failed.map((f) => f.name).join(' | '))
  process.exit(1)
}
