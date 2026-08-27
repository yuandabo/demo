import { expect, type Page, type TestInfo } from '@playwright/test'

/** web dev server 端口（vite，proxy /api → 3000），仅 proxy 冒烟用例使用 */
export const WEB_DEV_PORT = 5173

/** 小程序 H5 验收视口（AC-NF-03：375px 适配主流机型） */
export const M_VIEWPORT = { width: 375, height: 812 } as const

/**
 * 端口探针：任意 HTTP 响应（含 404）即视为在监听。
 * 仅用于「可选依赖未启动则跳过」的判断（如 5173 dev server）；
 * 3000 侧不用它——被测服务由 webServer 保证，且断言必须可失败（阶段 2 断言有效性自检）。
 */
export async function isPortUp(port: number): Promise<boolean> {
  try {
    await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(2_000) })
    return true
  } catch {
    return false
  }
}

/** 收集页面运行时错误：console error（favicon 404 噪声豁免）+ 未捕获 JS 异常 */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))
  return errors
}

/**
 * 三入口冒烟公共骨架（AC-OP-02）：HTTP 200 + #root 挂载 + 端专属就绪断言（ready 回调，
 * 各入口实际首个可断言的落地元素不同，由 spec 自行给出）+ 控制台无 error + 截图留档。
 */
export async function smokeEntry(
  page: Page,
  testInfo: TestInfo,
  options: { path: string; ready: (page: Page) => Promise<void> },
): Promise<void> {
  const errors = collectPageErrors(page)
  const response = await page.goto(options.path)
  if (!response) throw new Error(`${options.path} 导航失败，无 HTTP 响应`)
  expect(response.status(), `${options.path} 应返回 200`).toBe(200)
  await expect(page.locator('#root')).toBeAttached()
  await options.ready(page)
  expect(errors, `${options.path} 页面控制台不应有 error`).toEqual([])
  await testInfo.attach('screenshot', {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
}

/** 每用例截图留档（AC-OP-02：HTML 报告含三端截图） */
export async function attachShot(page: Page, testInfo: TestInfo, name = 'screenshot'): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
}
