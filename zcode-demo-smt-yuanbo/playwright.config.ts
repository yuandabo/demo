import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 验收基建（INFRA-04，tech-design §1/§2/§9）：
 * - chromium 单浏览器，三端 E2E + API smoke 共用（AC-OP-02）
 * - baseURL 指向 Express 3000（静态托管 web/dist 三入口 + /api）
 * - webServer 自动拉起被测服务；reuseExistingServer 本地联调已启动的 server 不冲突
 * - HTML 报告输出仓库根 playwright-report/（相对 config 即 tests 同级，AC-OP-02 交付物）
 * - retries 0：验收断言必须真实可失败；失败自动截图，成功用例由 spec 内手动 attach 留档
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    cwd: './server',
    port: 3000,
    reuseExistingServer: true,
  },
})
