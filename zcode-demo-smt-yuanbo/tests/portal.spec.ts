import { expect, test } from '@playwright/test'
import { attachShot, smokeEntry } from './helpers'

/**
 * PC 前台 E2E（AC-OP-02 三端之一，Desktop Chrome 1280×720）：
 * 入口冒烟/首页四区块 → 关键词搜索（AC-FN-02）→ 详情游客收藏登录引导回放（AC-FN-03）
 * → 顶栏选角色登录 + 我的页（AC-FN-22/24）。每用例截图留档。
 */

test('PC 前台入口可达：首页四区块渲染且应用挂载', async ({ page }, testInfo) => {
  await smokeEntry(page, testInfo, {
    path: '/portal.html',
    ready: async (p) => {
      // 顶栏品牌与导航挂载
      await expect(p.getByTestId('portal-logo-link')).toContainText('云ERP · 教程中心')
      await expect(p.getByTestId('portal-nav-list')).toBeVisible()
      // 游客口径：推荐位降级「热门推荐」（AC-RULE-16 游客全站 Top6）
      await expect(p.getByTestId('recommend-title')).toHaveText('热门推荐')
      // 分类宫格：12 个启用一级分类（种子口径），销售管理格可见（UI-ELEM-05）
      await expect(p.getByTestId('categories-grid')).toBeVisible()
      await expect(p.getByTestId('categories-grid').locator('.ccell')).toHaveCount(12)
      await expect(p.getByTestId('category-cell-1')).toContainText('销售管理')
      // 最近更新 / 热门教程区块
      await expect(p.getByTestId('latest-section')).toBeVisible()
      await expect(p.getByTestId('hot-section')).toBeVisible()
    },
  })
})

test('PC 搜索链路：关键词「算料」命中标题/摘要/标签（AC-FN-02）', async ({ page }, testInfo) => {
  await page.goto('/portal.html#/list')
  await expect(page.getByRole('heading', { name: '全部教程' })).toBeVisible()
  // 输入关键词提交（标签命中：#3 MRP 教程 tags 含「算料」）
  await page.getByTestId('search-input').fill('算料')
  await page.getByTestId('search-submit-btn').click()
  // 结果元信息：总数 ≥1 且结果卡片包含命中教程（标题/标签模糊命中展示）
  await expect(page.getByTestId('list-total')).not.toHaveText('0')
  const total = Number(await page.getByTestId('list-total').textContent())
  expect(total).toBeGreaterThanOrEqual(1)
  await expect(page.locator('.row-card').first()).toContainText('MRP 自动算料')
  // 关键词写入 URL（可分享/可回退）
  await expect(page).toHaveURL(/keyword=/)
  await attachShot(page, testInfo)
})

test('PC 详情链路：游客收藏弹选角色登录，登录后原位收藏成功（AC-FN-03）', async ({ page }, testInfo) => {
  await page.goto('/portal.html#/detail/3')
  await expect(page.getByTestId('detail-title')).toContainText('MRP 自动算料')
  const favBtn = page.getByTestId('fav-btn')
  await expect(favBtn).toBeVisible()
  const initialPressed = (await favBtn.getAttribute('aria-pressed')) === 'true'
  // 游客点击收藏：不发请求，弹选角色登录（场景化副文案）
  await favBtn.click()
  const modal = page.getByTestId('role-login-modal')
  await expect(modal).toBeVisible()
  await expect(modal).toContainText('登录后才能收藏与评价')
  // 选「销售」免密登录 → 回原位自动重放收藏
  await modal.getByTestId('role-card-sales').click()
  await expect(modal).toBeHidden()
  // 收藏态翻转：按钮切换为已收藏/未收藏（幂等可重跑），计数联动
  await expect
    .poll(async () => (await favBtn.getAttribute('aria-pressed')) === 'true')
    .toBe(!initialPressed)
  await expect(favBtn).toContainText(initialPressed ? '收藏' : '已收藏')
  await attachShot(page, testInfo)
})

test('PC 顶栏选角色登录：推荐位按角色重取 + 我的页登录态（AC-FN-22）', async ({ page }, testInfo) => {
  await page.goto('/portal.html')
  await expect(page.getByTestId('role-pill-btn')).toContainText('游客')
  // 顶栏徽章打开弹窗，选「财务」
  await page.getByTestId('role-pill-btn').click()
  const modal = page.getByTestId('role-login-modal')
  await expect(modal).toBeVisible()
  await modal.getByTestId('role-card-finance').click()
  await expect(modal).toBeHidden()
  // 顶栏徽章切换为「财务 · 周莉」共享口径
  await expect(page.getByTestId('role-pill-btn')).toContainText('财务 · 周莉')
  // 首页推荐位随登录角色即时重取（AC-RULE-16：财务命中 人事财务/销售 模块）
  await expect(page.getByTestId('recommend-title')).toContainText('为你推荐 · 财务相关')
  await expect(page.getByTestId('recommend-role-chip')).toContainText('财务')
  // 我的页：登录态页头（头像 + 「我的学习」）
  await page.getByTestId('portal-nav-my').click()
  await expect(page.getByTestId('my-title')).toHaveText('我的学习')
  await expect(page.getByTestId('my-avatar')).toBeVisible()
  await attachShot(page, testInfo)
})
