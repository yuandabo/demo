# FE-07 自测报告 — Playwright 全量终验（AC-OP-02）

- 任务：`docs/tasks/IT-05/FE-07.md`（Playwright 全量终验，交付验收报告）
- 日期：2026-08-22
- 环境：Windows 10 / Node v25.8.0 / Playwright 1.62.1（chromium）/ Express 3000 托管 `web/dist`
- 结论：**PASS** —— 14/14 用例通过（0 failed / 0 flaky / 0 skipped），HTML 报告含三端截图（PC 4 / admin 5 / m 4，m 全部 375×812 视口）

## 1. 执行链路（按任务流程）

| 步骤 | 命令 / 动作 | 结果 |
|---|---|---|
| 清场 | `taskkill /PID 11332 /F`（杀占 3000 的旧 node 进程） | 端口释放 |
| 前端构建 | `web: npm run build`（tsc --noEmit + vite build，0 error） | dist 三入口产出（portal/admin/m） |
| 服务端构建 | `server: npm run build`（tsc，0 error） | dist 与 src 对齐 |
| 启服务 | `server: npm start`（node dist/index.js，3000 托管 web/dist） | portal/admin/m 均 HTTP 200，`/api/*` 信封正常 |
| 数据复原 | `POST /api/system/reset`（admin token）×3：终验前 1 次 + 终验后 1 次（本表外加首轮联调后 1 次） | 每次返回 `{categories:12, tutorials:24, users:8, messages:3, checkins:5}`，与种子定义一致 |
| 全量终验 | `npx playwright test --reporter=html,json`（json 仅作留档证据） | **14 passed (16.5s)**，退出码 0 |
| 收尾 | 再次 reset 复原污染 + 停自启服务 | 见 §5 |

## 2. AC-OP-02 三要素逐项核验

### 要素 1：全量通过率 100%（0 条失败）✅

`npx playwright test` 退出码 0。终验证据 `playwright-run-evidence.json`（同一次运行的 json reporter 产物）：

| spec | 用例数 | 通过 | 截图数 | 覆盖链路 |
|---|---|---|---|---|
| api.spec.ts | 2 | 2 | 0（纯 API，无 UI） | 404 统一信封 / 5173 proxy 连通（可跳过态） |
| portal.spec.ts（PC） | 4 | 4 | 4（1280×720） | 入口冒烟+首页四区块 / 关键词搜索（AC-FN-02）/ 游客收藏→选角色登录→原位回放（AC-FN-03）/ 顶栏选角色登录+推荐位重取+我的页 |
| admin.spec.ts | 4 | 4 | 5（1280×720） | 登录链路（错误口令统一文案+看板指标）/ 教程列表分页+状态筛选 / 审核通过→前台下一请求即返回（AC-FN-08）/ 驳回原因 <5 字前端阻断（AC-FN-09） |
| m.spec.ts | 4 | 4 | 4（375×812） | 入口冒烟（375 视口）/ 搜索同源命中 / 详情进度保存+重进续读提示（AC-FN-04）/ 引导登录后打卡幂等（AC-FN-16） |

合计：**14 passed / 0 failed / 0 flaky / 0 skipped**（stats: expected=14, unexpected=0）。

### 要素 2：HTML 版报告 ✅

`playwright-report/index.html` 存在（544 KB，自包含单文件 + `data/` 13 张 PNG），由终验运行生成（reporter `html, open:never`）。
`.gitignore` 核验：根 `.gitignore` 仅含 `node_modules/`、`dist/`、`test-results/`、`playwright-report/.gitignore`（单文件条目）、`server/erp.db`、`*.log`、`.DS_Store`、`process-docs/`，**未排除 playwright-report/ 目录**，符合交付物要求。

### 要素 3：三端截图可查 ✅

报告内截图 13 张，逐张核验过像素尺寸（`playwright-run-evidence.json` 附件 base64 解码读 IHDR）：

| 端 | 要求 | 实测 | 明细（ shots/ 目录已导出同款 PNG 供直查） |
|---|---|---|---|
| PC 前台 | ≥3 | **4** @1280×720 | pc-0 首页四区块 / pc-1 搜索「算料」结果 / pc-2 详情收藏登录引导 / pc-3 角色登录+我的页 |
| 管理后台 | ≥3 | **5** @1280×720 | admin-0 登录页 / admin-1 登录后看板 / admin-2 教程管理筛选 / admin-3 审核通过 / admin-4 驳回校验 |
| 小程序 H5 | ≥2 且含 375 视口 | **4** @375×812 | m-0 首页（375 视口）/ m-1 搜索 / m-2 详情续读 / m-3 打卡 |

直查路径：`docs/reports/IT-05/FE-07/shots/`（与报告附件同源）；交互浏览：`npx playwright show-report playwright-report`。

## 3. 关联 AC 附带核验

- **AC-NF-01（搜索 P95 < 1s）**：本机实测 `GET /api/tutorials?keyword=算料` 5 次采样 3.6~4.2 ms/次（百级教程量、本地 SQLite），远低于 1s 阈值；E2E 搜索用例全链路（输入→URL 同步→结果渲染）断言通过。
- **AC-NF-03（375 视口 / 浏览器兼容）**：m 端 4 条用例固定 375×812 视口（`test.use({ viewport: M_VIEWPORT })`）全部通过，宫格/搜索/详情/打卡布局无横向破版（用例含可见性断言）；浏览器矩阵：chromium（Playwright 1.62 内核）实测通过，**Edge 实测未覆盖**（遗留：验收环境按报告登记清单补测即可，前端无浏览器私有 API）。
- **AC-NF-06 佐证**：三次 `POST /api/system/reset` 均返回种子全量计数且前台口径恢复（`keyword=算料` total 回到 4），种子可重复初始化验证通过。

## 4. 本任务对测试基建的修正（失败→全绿闭环）

初版 tests/ 为 INFRA-04 冒烟占位，三处 `h1` 标记（'PC 前台'/'管理后台'/'小程序'）与后续 FE-01~06 实际页面不符，首跑即失败。修正与扩充（全部在 tests/ 内，未改业务代码）：

1. `tests/helpers.ts`：`smokeEntry` 的 `h1 marker` 断言改为 `ready(page)` 回调（各入口真实的落地断言由 spec 给出）；新增 `attachShot`（每用例截图留档）与 `M_VIEWPORT`（375×812）。
2. `tests/portal.spec.ts` / `tests/admin.spec.ts` / `tests/m.spec.ts`：占位冒烟重写为「入口冒烟 + 三端关键链路」（见 §2 表），全部基于页面既有 `data-testid` 铁律锚点；每用例 1 次截图。
3. 用例级修正记录：驳回字数上限 200（非 100，对齐 `Review.tsx REJECT_MAX`）；审核用例改取队首待审卡片（重跑容错）；打卡用例兼容「今日已打卡」幂等终态；收藏用例断言状态翻转（可重跑）。
4. 数据策略：写链路用例（审批/收藏/打卡/进度）跑前跑后各一次 `POST /api/system/reset`，终验后库已复原为种子态。

## 5. 环境收尾

- 终验后已执行 `POST /api/system/reset` 复原种子数据（前台口径复核通过）。
- 自启 server（本任务手动 `npm start` 的 node 进程）已停止并确认 3000 端口释放（详见任务摘要）；运行日志 `server-fe07.log`（gitignore `*.log` 覆盖）随进程清理。
- 未执行任何 git 写操作。

## 6. 交付物清单

| 文件 | 说明 |
|---|---|
| `playwright-report/index.html`（+ `data/` 13 PNG） | AC-OP-02 HTML 验收报告（主交付物） |
| `docs/reports/IT-05/FE-07/playwright-run-evidence.json` | 同次运行 json reporter 留档（通过率/截图映射证据） |
| `docs/reports/IT-05/FE-07/shots/`（13 PNG） | 三端截图直查导出（pc-*/admin-*/m-*） |
| `docs/reports/IT-05/FE-07/FE-07-self-test-report.md` | 本报告 |
| `tests/{helpers,portal,admin,m}.spec.ts` | 终验套件（修正+扩充后） |
