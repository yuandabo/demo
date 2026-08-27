import { expect, test } from '@playwright/test'
import { attachShot, M_VIEWPORT, smokeEntry } from './helpers'

/**
 * 小程序 H5 E2E（AC-OP-02 三端之一，AC-NF-03 375px 视口）：
 * 入口冒烟/首页宫格推荐 → 搜索链路（AC-FN-02 同源）→ 详情进度续读（AC-FN-04）
 * → 学习打卡（AC-FN-16）。每用例截图留档。
 */
test.use({ viewport: { ...M_VIEWPORT } })

/** RoleSheet 选角色免密登录（登录后 sheet 收起） */
async function loginByRoleSheet(
  page: import('@playwright/test').Page,
  role: string,
): Promise<void> {
  const sheet = page.getByTestId('role-sheet')
  await sheet.locator(`[data-testid="role-card-${role}"]`).click()
  await expect(sheet).not.toHaveClass(/show/)
}

test('小程序 H5 入口可达（375 视口）：首页推荐 + 分类宫格 + 打卡入口', async ({ page }, testInfo) => {
  await smokeEntry(page, testInfo, {
    path: '/m.html',
    ready: async (p) => {
      await expect(p.locator('.logo-name')).toHaveText('云ERP教程中心')
      await expect(p.getByTestId('role-pill')).toContainText('未登录')
      await expect(p.getByTestId('search-entry')).toContainText('算料')
      // 游客口径推荐位：全站热门（AC-RULE-16）
      await expect(p.locator('.sec-title').first()).toContainText('全站热门')
      // 分类宫格：12 个启用一级分类（与 PC 同数据源）
      const cells = p.locator('[data-testid^="category-cell-"]')
      await expect(cells.first()).toBeVisible()
      await expect(cells).toHaveCount(12)
      await expect(p.getByTestId('checkin-banner')).toBeVisible()
    },
  })
})

test('小程序 H5 搜索链路：关键词「算料」与 PC 同数据源命中', async ({ page }, testInfo) => {
  await page.goto('/m.html#/list')
  await expect(page.getByTestId('search-input')).toBeVisible()
  await page.getByTestId('search-input').fill('算料')
  await page.getByTestId('search-btn').click()
  // 结果行：「算料」相关结果 ≥1 篇（AC-FN-02 同源断言）
  await expect(page.getByTestId('result-line')).toContainText('「算料」相关结果')
  await expect(page.getByTestId('result-line')).toContainText(/相关结果 [1-9]\d* 篇|相关结果 [1-9] 篇/)
  await expect(page.locator('[data-testid^="tutorial-card-"]').first()).toContainText('MRP 自动算料')
  await attachShot(page, testInfo)
})

test('小程序 H5 详情续读链路：滚动进度保存后重进提示继续阅读（AC-FN-04）', async ({ page }, testInfo) => {
  await page.goto('/m.html')
  // 选「生产」角色登录（进度保存需登录态，AC-RULE-11）
  await page.getByTestId('role-pill').click()
  await expect(page.getByTestId('role-sheet')).toHaveClass(/show/)
  await loginByRoleSheet(page, 'produce')
  await expect(page.getByTestId('role-pill')).toContainText('当前角色：生产')

  // 进入教程 #1，正文挂载后滚动到约 60%
  await page.goto('/m.html#/detail/1')
  await expect(page.getByTestId('detail-title')).toContainText('云ERP是什么')
  const scroller = page.locator('.scroll')
  await expect(page.getByTestId('detail-article')).toBeVisible()
  await scroller.evaluate((el) => {
    const denom = el.scrollHeight - el.clientHeight
    el.scrollTop = Math.round(denom * 0.6)
  })
  // 等防抖（800ms）落库或离开页兜底 flush 后退出
  await page.waitForTimeout(1200)
  await page.goto('/m.html#/')

  // 重进同篇：弹「继续阅读」横幅并显示进度（0 < progress < 100）
  await page.goto('/m.html#/detail/1')
  await expect(page.getByTestId('detail-title')).toContainText('云ERP是什么')
  const resumeBar = page.getByTestId('resume-bar')
  await expect(resumeBar).toBeVisible({ timeout: 10_000 })
  await expect(resumeBar).toContainText(/上次读到 (?:[3-7]\d)%/)
  await attachShot(page, testInfo)
})

test('小程序 H5 打卡链路：引导登录后今日打卡成功（AC-FN-16）', async ({ page }, testInfo) => {
  await page.goto('/m.html#/checkin')
  // 未登录自动弹 RoleSheet 引导（AC-FN-03 同款模式）
  await expect(page.getByTestId('role-sheet')).toHaveClass(/show/)
  await loginByRoleSheet(page, 'purchase')
  // 登录后自动加载：周历 + 积分卡 + 徽章墙（种子：采购有历史打卡记录）
  await expect(page.getByTestId('week-calendar')).toBeVisible()
  await expect(page.getByTestId('points-card')).toBeVisible()
  const submitBtn = page.getByTestId('checkin-submit-btn')
  // 数据就绪后收敛为二选一稳定态：未打卡（可点）/ 重跑口径已打卡（禁用幂等终态）
  await expect(submitBtn).toContainText(/今日打卡 \+10 积分|今日已打卡/)
  const already = (await submitBtn.textContent())?.includes('今日已打卡') ?? false
  if (!already) {
    await submitBtn.click()
    // 打卡幂等：首点 +10 或重复打卡提示，二选一均合法（AC-FN-16/AC-RULE-12）
    await expect(page.getByTestId('m-toast')).toContainText(/打卡成功 \+10 积分|今日已打卡/)
  }
  // 按钮收敛为「今日已打卡」终态（重复打卡积分不增）
  await expect(submitBtn).toContainText('今日已打卡')
  await attachShot(page, testInfo)
})
