---
iteration: IT-01
task-id: INFRA-04
task-name: "Playwright 测试基建（playwright.config + tests/ + 启动冒烟用例）"
role: 基础设施
project-dir: "."
depends-on: "INFRA-01（后端服务脚手架：3000 端口被测服务）；INFRA-02（前端多入口脚手架：5173 三入口与 proxy）"
consumes-openapi-from: []
acceptance-criteria:
  - AC-OP-01: 未验证
tech-design-sections:
  - "tech-design.md#1-概述与目标"
  - "tech-design.md#2-现有代码基础与仓库结构"
  - "tech-design.md#9-测试方案对接-zcodegen-test-与-zcoderun-test"
api-docs: []
tech-design-section-hashes:
  "tech-design.md#1-概述与目标": "测试选型 @playwright/test（chromium），三端 E2E + API smoke，HTML 报告含截图（AC-OP-02）"
  "tech-design.md#2-现有代码基础与仓库结构": "tests/：portal.spec.ts admin.spec.ts m.spec.ts api.spec.ts + playwright.config.ts（仓库根）"
  "tech-design.md#9-测试方案对接-zcodegen-test-与-zcoderun-test": "每用例 screenshot()，HTML 报告；本任务先交付 config 与冒烟，业务 spec 随后续迭代"
skipped-gates: []
discovered-sections: []
discovered-dependencies:
  - "@playwright/test@1.62.1（仓库根 devDependency）"
spawned-tasks: []
implementation-notes: "1) 跨任务缺陷修复：INFRA-01 server/src/index.ts 静态托管路径 '../web/dist' 在 npm start(dist) 与 tsx dev(src) 下均解析到不存在的 server/web/dist，三入口全 404；改为 '../../web/dist'（src/dist 同在 server/ 下一级）并重编译验证 200；2) skip-if 仅用于 5173 proxy 用例（dev server 可选，CI 可跳过），3000 侧依赖 webServer 自动拉起 + reuseExistingServer，保证停服务即红（断言生效性已自检：baseURL 改 2999 → portal 用例失败 → 恢复回绿）；3) HTML 报告固定输出仓库根 playwright-report/（AC-OP-02 交付物），三入口用例手动 attach 截图（config screenshot 仅失败生效）；4) 本机 cdn.playwright.dev 不可达（0% 卡死 10min+），chromium 经 PLAYWRIGHT_DOWNLOAD_HOST=cdn.npmmirror.com/binaries/playwright 真实安装成功（chromium-1234 + headless_shell-1234，约 300MB）；5) server npm run build 存在他人 WIP TS6133（src/seed.ts 未用变量，非本任务引入，tsc 默认仍产出 dist）；6) 代理冒烟实测通过：环境恰有 5173 vite dev server 在跑，proxy 用例非 skip 而真实断言通过"
doc-drift: []
---

# INFRA-04 - Playwright 测试基建（playwright.config + tests/ + 启动冒烟用例）

<!-- REQUIRED:任务目标 -->
## 任务目标

> 来源：[tech-design.md#9-测试方案对接-zcodegen-test-与-zcoderun-test](../../design/tech-design.md#9-测试方案对接-zcodegen-test-与-zcoderun-test) / [tech-design.md#2-现有代码基础与仓库结构](../../design/tech-design.md#2-现有代码基础与仓库结构)

在仓库根搭建 Playwright 验收基建（tech-design §2：`tests/` + `playwright.config.ts`）：

1. 根目录 `package.json`（或复用既有）添加 `@playwright/test` 依赖与 `test:e2e` script；`playwright.config.ts`：chromium 单浏览器、`baseURL`、reporter `html`（输出 `playwright-report/`）+ 失败截图。
2. `webServer` 配置：自动拉起被测服务（server 3000，`reuseExistingServer: true` 便于本地联调）。
3. `tests/api.spec.ts` 冒烟用例（本迭代仅验证基建可用，35 端点 smoke 由后续迭代补全）：
   - 服务健康：`GET /api/not-exist` → 404 且响应体为统一 `{code:404}` JSON
   - 三入口可达：分别打开 `/portal.html` `/admin.html` `/m.html`，页面无控制台 error 且各含端标识文本（`page.screenshot()` 留档）
   - proxy 连通：经 5173 请求 `/api/not-exist` 返回后端 JSON（dev server 模式；CI 可跳过或以 build+3000 直连替代）
4. 产出 HTML 报告 `playwright-report/index.html`（AC-OP-02 报告形态在本迭代的基建前置）。

**AC 关联原因**：本任务为纯基础设施，关联 AC-OP-01——冒烟用例自动化保障"服务可用、三端入口可开、控制台无错误"的验收前置条件（AC-OP-01 第 3 点的过程保障），种子计数断言由 INFRA-03 的 seed:check 承担。

<!-- REQUIRED_END -->

<!-- REQUIRED:API接口文档 -->
## API 接口文档

### 新增接口

无（测试基建任务，不新增业务接口）。

### 复用接口

| 接口/方法 | 本任务调用说明 |
|----------|--------------|
| GET /api/not-exist（任意未注册 /api 路径） | 冒烟探针：断言 HTTP 404 + 响应体 `code:404` 的统一 JSON 结构（INFRA-01 交付）；仅验证响应结构，不依赖业务数据 |

<!-- REQUIRED_END -->

<!-- REQUIRED:核心流程 -->
## 核心流程

**1. 依赖与 config**
- 来源：[tech-design.md#1-概述与目标](../../design/tech-design.md#1-概述与目标)
- 输入：仓库根
- 处理逻辑：`npm i -D @playwright/test`；`playwright.config.ts`：`testDir:'./tests'`、`projects:[{name:'chromium',use:devices['Desktop Chrome']}]`、`reporter:[['html',{open:'never'}]]`、`use:{baseURL:'http://localhost:3000',screenshot:'only-on-failure'}`、`webServer:{command:'cd server && npm start',port:3000,reuseExistingServer:true}`
- 输出：`npx playwright test` 可执行

**2. 冒烟用例**
- 来源：[tech-design.md#9-测试方案对接-zcodegen-test-与-zcoderun-test](../../design/tech-design.md#9-测试方案对接-zcodegen-test-与-zcoderun-test)
- 处理逻辑：`request.get('/api/not-exist')` 断言 404 + `code:404`；三入口各 `page.goto('/portal.html')` 等 → 断言端标识文本 + `page.on('console')` 无 error + `page.screenshot()`
- 输出：tests/api.spec.ts 3~4 条用例全绿

**3. 报告产出**
- 来源：[tech-design.md#9-测试方案对接-zcodegen-test-与-zcoderun-test](../../design/tech-design.md#9-测试方案对接-zcodegen-test-与-zcoderun-test)
- 处理逻辑：HTML reporter 输出 `playwright-report/index.html`（.gitignore 或随交付保留，按 tech-design §2 保留为交付物）
- 输出：报告文件存在且含截图

<!-- REQUIRED_END -->

<!-- REQUIRED:验收标准 -->
## 验收标准

每条标准必须是 Agent 可通过命令自动判定通过/失败的。按阶段组织，前一阶段全部通过后才可进入下一阶段。

### 阶段 1：开发验收

- [ ] `npx playwright install chromium` 成功（退出码 0）
- [ ] config 语法通过：`npx playwright test --list` 列出用例无报错
- [ ] `npm run test:e2e`（等价 `npx playwright test`）全部用例 passed（0 failed）
- [ ] 断言 `playwright-report/index.html` 文件存在

### 阶段 2：自测验收

- [ ] 冒烟断言生效性自检：临时改错 baseURL（或停掉 server）重跑 → 用例按预期失败（证明断言非恒真），恢复后回绿
- [ ] `reuseExistingServer` 生效：先手工启动 server 再跑测试不冲突
- [ ] 报告含三入口截图（portal/admin/m 各 ≥1 张）
- [ ] 自测报告附 `npx playwright test` 输出与报告路径

<!-- REQUIRED_END -->
