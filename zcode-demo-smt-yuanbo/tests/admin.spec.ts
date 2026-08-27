import { expect, test } from '@playwright/test'
import { attachShot, smokeEntry } from './helpers'

/**
 * 管理后台 E2E（AC-OP-02 三端之一，Desktop Chrome 1280×720）：
 * 登录落位看板 → 教程列表状态筛选 → 审核通过即前台可见（AC-FN-08）
 * → 驳回原因 <5 字前端阻断（AC-FN-09）。每用例截图留档。
 */

/** UI 登录（默认演示账号 admin/123456 已预填），落位后返回 */
async function loginAsAdmin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/admin.html')
  await expect(page.getByTestId('login-submit-btn')).toBeVisible()
  await page.getByTestId('login-submit-btn').click()
  await expect(page).toHaveURL(/#\/dashboard/)
}

test('管理后台登录链路：admin 落位统计看板', async ({ page }, testInfo) => {
  await smokeEntry(page, testInfo, {
    path: '/admin.html',
    ready: async (p) => {
      // 未登录守卫：根路径重定向 #/login，登录卡挂载（AC-EG-06）
      await expect(p).toHaveURL(/#\/login/)
      await expect(p.getByRole('heading', { name: '管理员登录' })).toBeVisible()
    },
  })
  // 错误口令：统一文案防账号枚举（PRD §7.11），表单值保留
  await page.getByTestId('login-password-input').fill('wrong-pass')
  await page.getByTestId('login-submit-btn').click()
  await expect(page.getByTestId('login-error-tip')).toContainText('账号或密码错误')

  // 正确演示账号（预填 admin/123456）
  await page.getByTestId('login-password-input').fill('123456')
  await page.getByTestId('login-submit-btn').click()
  await expect(page).toHaveURL(/#\/dashboard/)
  await expect(page.getByTestId('admin-topbar')).toContainText('平台管理员')
  // 看板四指标卡渲染（种子口径：已发布教程 ≥18；值 + 单位同节点，取数字部分）
  await expect(page.getByTestId('metric-published')).toBeVisible()
  const publishedText = await page.getByTestId('metric-published').locator('.metric-value').textContent()
  const published = Number((publishedText ?? '').replace(/,/g, '').match(/\d+/)?.[0] ?? '0')
  expect(published).toBeGreaterThanOrEqual(18)
  await expect(page.getByTestId('metric-views')).toBeVisible()
  await expect(page.getByTestId('metric-favs')).toBeVisible()
  await expect(page.getByTestId('metric-rate')).toBeVisible()
  await attachShot(page, testInfo)
})

test('管理后台教程管理：列表分页 + 状态筛选（AC-FN-11）', async ({ page }, testInfo) => {
  await loginAsAdmin(page)
  await page.getByTestId('sidebar-tutorial-link').click()
  await expect(page.getByTestId('tutorial-table')).toBeVisible()
  // 种子 24 篇（all=1 管理口径），首页 10 行 + 分页信息
  await expect(page.locator('[data-testid="tutorial-table"] tbody tr')).toHaveCount(10)
  await expect(page.getByTestId('pager-info')).toContainText('24')
  // 筛选「已发布」：命中行状态标签全部为已发布
  await page.getByTestId('filter-status-select').selectOption('published')
  await expect(page.locator('[data-testid="tutorial-table"] tbody tr').first()).toBeVisible()
  const badges = page.locator('[data-testid="tutorial-table"] tbody tr [data-testid$="-status-badge"]')
  await expect(badges.first()).toHaveText('已发布')
  const count = await badges.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    await expect(badges.nth(i)).toHaveText('已发布')
  }
  await attachShot(page, testInfo)
})

test('管理后台审核链路：通过后前台下一请求即返回（AC-FN-08）', async ({ page }, testInfo) => {
  await loginAsAdmin(page)
  await page.getByTestId('sidebar-review-link').click()
  await expect(page.getByTestId('review-page')).toBeVisible()
  // 种子待审队列：#19（v2 回审）/ #20 / #21（首次提审）；未消费时断言 #19 回审标识
  const card19 = page.getByTestId('review-card-19')
  if (await card19.count()) await expect(card19).toContainText('修改版 v2 · 回审')
  // 取队首卡片审批（重跑容错：队列消费后不再依赖固定 id）
  const card = page.locator('[data-testid^="review-card-"]:not([data-testid="ai-mock-card"])').first()
  await expect(card).toBeVisible()
  await expect(card).toContainText(/首次提审|修改版 v2 · 回审/)
  const tutorialId = ((await card.getAttribute('data-testid')) ?? '').replace('review-card-', '')
  const title = ((await card.locator('.rc-title').textContent()) ?? '').trim()
  expect(tutorialId).toMatch(/^\d+$/)
  // 通过该篇：卡片转「已通过并发布」并留痕审核人
  await page.getByTestId(`review-${tutorialId}-approve-btn`).click()
  await expect(page.getByTestId(`review-${tutorialId}-done-tip`)).toContainText('已通过并发布')
  await expect(page.getByTestId(`review-${tutorialId}-done-tip`)).toContainText('审核人 admin')
  // 前台口径（无 all 参数）下一请求即返回该教程：无需重启/重新登录
  const front = await page.request.get(`/api/tutorials?keyword=${encodeURIComponent(title.slice(0, 4))}`)
  expect(front.status()).toBe(200)
  const body = (await front.json()) as {
    code: number
    data: { total: number; list: ReadonlyArray<{ id: number }> }
  }
  expect(body.code).toBe(0)
  expect(body.data.total).toBeGreaterThanOrEqual(1)
  expect(body.data.list.some((t) => t.id === Number(tutorialId))).toBe(true)
  await attachShot(page, testInfo)
})

test('管理后台驳回校验：原因 <5 字阻断提交（AC-FN-09）', async ({ page }, testInfo) => {
  await loginAsAdmin(page)
  await page.getByTestId('sidebar-review-link').click()
  // 取队首仍待处理卡片的驳回按钮（重跑容错）
  const rejectBtn = page.locator('[data-testid$="-reject-btn"]').first()
  await expect(rejectBtn).toBeVisible()
  await rejectBtn.click()
  // 弹窗挂起，确认按钮禁用
  await expect(page.getByTestId('reject-modal')).toBeVisible()
  await expect(page.getByTestId('reject-confirm-btn')).toBeDisabled()
  // 2 字原因：前端阻断 + 计数提示
  await page.getByTestId('reject-reason-input').fill('不好')
  await expect(page.getByTestId('reject-min-tip')).toHaveText('原因必填，不少于 5 个字')
  await expect(page.getByTestId('reject-confirm-btn')).toBeDisabled()
  await expect(page.getByTestId('reject-count')).toHaveText('2/200')
  // 补足 ≥5 字后解除阻断；取消退出，不产生数据变更
  await page.getByTestId('reject-reason-input').fill('第 2 步截图与新版界面不符，请更新')
  await expect(page.getByTestId('reject-min-tip')).toHaveText('已满足最少 5 字要求')
  await expect(page.getByTestId('reject-confirm-btn')).toBeEnabled()
  await page.getByTestId('reject-cancel-btn').click()
  await expect(page.getByTestId('reject-modal')).toBeHidden()
  // 取消不产生数据变更：该卡片仍待处理（驳回按钮仍在）
  await expect(rejectBtn).toBeVisible()
  await attachShot(page, testInfo)
})
