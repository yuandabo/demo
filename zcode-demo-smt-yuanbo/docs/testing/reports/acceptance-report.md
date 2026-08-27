# 测试验收报告 — RE00001 云ERP教程中心

> 执行时间：2026-08-23 ｜ Runner：Playwright 1.62（chromium）｜ 环境：Node 25 / Windows / server 3000（webServer 自动拉起）

## 1. 执行结果总览

| 套件 | 用例数 | 通过 | 失败 | 通过率 |
|---|---|---|---|---|
| API 契约（35 端点 smoke+状态机） | 21 | 21 | 0 | 100% |
| PC 前台 portal | 4 | 4 | 0 | 100% |
| 管理后台 admin | 4 | 4 | 0 | 100% |
| 小程序 H5 m（375 视口） | 4 | 4 | 0 | 100% |
| **合计** | **33** | **33** | **0** | **100%** |

**HTML 报告（交付物）**：`playwright-report/index.html` — 含三端截图 13 张（PC 4 / admin 5 / m 4，m 全部 375×812）

## 2. 测试资产全景

| 资产 | 规模 | 状态 |
|---|---|---|
| Playwright E2E/API | 33 用例（tests/ 四 spec） | 全绿 |
| 后端 node:test 单测 | 160 用例（server/src/*.test.ts） | 全绿 |
| 测试设计案例（gen-test） | 545 条（E2E 175/API 347/Flow 23） | 结构评审 89/100 |
| 复刻评审（UI 对照原型） | 15/15 页 | 通过（必修项已修复复验） |

## 3. AC 合规

覆盖矩阵见 `ac-coverage-matrix.md`：基线 22 条 + 高价值抽样共 54 条全 pass；AC-OP-02 以本次运行兑现；视觉类 23 条由复刻评审覆盖。

## 4. 缺陷清单

新增缺陷：0（defect-list.json）。开发期发现并已修复的重要缺陷（摘录）：recommend token 解析缺失（CHANGE-6）、h2 步骤链路拍平（复刻修复）、拖拽相邻移动静默失效、登录回放闭包竞态——详见 docs/design/change-log.md 与各任务 implementation-notes。

## 5. 结论

**验收通过**：功能（35 条功能清单）、三端一致性（收藏/进度/评价跨端）、状态机（四态+非法迁移 409）、权限矩阵、性能（搜索 P95<1s 实测 4ms）均达 PRD §14 验收标准。

降级记录：gen-test 案例覆盖率脚本口径 15%（编号约定错配，非资产缺失，详见 case-gen-report.md）。
