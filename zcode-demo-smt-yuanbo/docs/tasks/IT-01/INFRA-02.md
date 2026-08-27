---
iteration: IT-01
task-id: INFRA-02
task-name: "前端多入口脚手架（Vite 三入口 portal/admin/m + src/shared 共享层 + /api proxy）"
role: 基础设施
project-dir: "web"
depends-on: "无"
consumes-openapi-from: []
acceptance-criteria:
  - AC-RULE-26: 未验证
tech-design-sections:
  - "tech-design.md#1-概述与目标"
  - "tech-design.md#2-现有代码基础与仓库结构"
  - "tech-design.md#7-前端架构第-8-章"
api-docs: []
tech-design-section-hashes:
  "tech-design.md#1-概述与目标": "前端 React 18 + TS + Vite 5 多入口单工程（portal.html/admin.html/m.html），三端共享类型与 API client"
  "tech-design.md#2-现有代码基础与仓库结构": "web/vite.config.ts input 三入口 + proxy /api→3000；src/shared/：api.ts/types.ts/AuthContext.tsx/constants.ts"
  "tech-design.md#7-前端架构第-8-章": "三入口同构：每端 App.tsx 挂 HashRouter + AuthProvider；shared/api.ts 统一 fetch 自动带 token、code≠0 抛错、401 触发登录弹窗事件"
skipped-gates: []
discovered-sections: []
discovered-dependencies:
  - "dompurify + qrcode（含 @types/qrcode）：占位安装，本任务未引用，供后续富文本 sanitize / 分享二维码任务使用"
  - "@types/node：vite.config.ts 使用 node:url 解析多入口绝对路径所需"
spawned-tasks: []
implementation-notes: "入口文件位于 src/main-{portal,admin,m}.tsx（根 src 下），App 骨架在 src/{portal,admin,m}/App.tsx；build 脚本含 tsc --noEmit 类型门禁；shared/api.ts 401 处理为 HTTP 状态码与业务码双口径；proxy 完整断言（/api/not-exist 返回 code:404 JSON）待 INFRA-01 server 启动后回补（本轮已验证 /api 被 proxy 拦截，非 Vite 静态 404）"
doc-drift: []
---

# INFRA-02 - 前端多入口脚手架（Vite 三入口 portal/admin/m + src/shared 共享层 + /api proxy）

<!-- REQUIRED:任务目标 -->
## 任务目标

> 来源：[tech-design.md#2-现有代码基础与仓库结构](../../design/tech-design.md#2-现有代码基础与仓库结构) / [tech-design.md#7-前端架构第-8-章](../../design/tech-design.md#7-前端架构第-8-章)

搭建 `web/` 前端工程（Vite 5 + React 18 + TypeScript 多入口单工程）：

1. 三入口 HTML：`web/portal.html`（PC 前台）、`web/admin.html`（管理后台）、`web/m.html`（小程序 H5），各自挂 `src/{portal,admin,m}/App.tsx` 骨架。
2. `web/vite.config.ts`：`build.rollupOptions.input` 三入口；`server.proxy['/api'] → http://localhost:3000`。
3. `src/shared/` 共享层四件：
   - `api.ts`：fetch 封装（自动注入 `Authorization: Bearer {token}`（localStorage）；`code≠0` 抛错；401 触发登录引导事件 `auth:required`）
   - `types.ts`：与 db.md 实体对齐的类型（`User`/`Category`/`Tutorial`/`ApiResp<T>` 等）
   - `AuthContext.tsx`：登录态 Context（token + user 存 localStorage，提供 login/logout，页面刷新经 GET /api/auth/me 恢复——接口由 BE-01 交付，本任务先按契约调用）
   - `constants.ts`：ERP 六角色枚举（sales/purchase/produce/warehouse/manage/finance）、模块映射、教程四态枚举
4. 每端 `App.tsx`：HashRouter + AuthProvider 挂载 + 占位首页（文本标识端名，页面由后续迭代填充）。

**AC 关联原因**：本任务为纯基础设施，关联 AC-RULE-26（登录方式）——三入口是前台选角色登录 / 后台账号密码登录的工程承载，`AuthContext` + localStorage 实现"登录态本地保持"，`constants.ts` 固化六角色枚举。

<!-- REQUIRED_END -->

<!-- REQUIRED:API接口文档 -->
## API 接口文档

### 新增接口

无（本任务仅前端工程骨架，不实现接口）。

### 复用接口

> shared/api.ts 与 AuthContext.tsx 按下列 BE-01 契约编写调用方（接口实现在 BE-01，允许先于接口完成，联调在阶段 2）。

| 接口/方法 | 本任务调用说明 |
|----------|--------------|
| POST /api/auth/login | AuthContext 后台登录入口保留方法；调用参数：`{username,password}`；使用响应字段：`data.token`、`data.user` |
| POST /api/auth/role-login | AuthContext 前台/小程序登录；调用参数：`{erpRole}`；使用响应字段：`data.token`、`data.user`（含 erpRole） |
| GET /api/auth/me | AuthContext 刷新恢复登录态；使用响应字段：`id/username/role/erpRole/displayName` |
<!-- REQUIRED_END -->

<!-- REQUIRED:核心流程 -->
## 核心流程

**1. Vite 多入口工程初始化**
- 来源：[tech-design.md#1-概述与目标](../../design/tech-design.md#1-概述与目标)
- 输入：空目录 `web/`
- 处理逻辑：npm init + 安装 `vite@5` `react@18` `react-dom` `react-router-dom` `typescript` `@vitejs/plugin-react` 及类型 → 三份 HTML（均含 `<div id="root">` 与对应入口 script）
- 输出：`npm run dev` 可启动、`npm run build` 可构建的 React TS 工程

**2. vite.config：三入口 + proxy**
- 来源：[tech-design.md#2-现有代码基础与仓库结构](../../design/tech-design.md#2-现有代码基础与仓库结构)
- 输入：入口相对路径
- 处理逻辑：`build.rollupOptions.input = { portal:'portal.html', admin:'admin.html', m:'m.html' }`；`server.proxy = { '/api': 'http://localhost:3000' }`
- 输出：dev 下 `/api/**` 转发到后端 3000；build 产出 dist/ 三入口

**3. shared 共享层**
- 来源：[tech-design.md#7-前端架构第-8-章](../../design/tech-design.md#7-前端架构第-8-章)
- 输入：BE-01 接口契约（见上表）、db.md 实体字段
- 处理逻辑：`api.ts` 导出 `request<T>(method,url,body?)`（token 注入、`code≠0` reject、401 → `window.dispatchEvent('auth:required')`）；`types.ts` 定义 `ApiResp<T>`/`User`/`Category`/`Tutorial` 等；`AuthContext.tsx` 提供 `AuthProvider`/`useAuth()`（login/loginByRole/logout，token+user 持久化 localStorage，mount 时若有 token 调 me 恢复、401 则清态回游客）；`constants.ts` 导出 `ERP_ROLES`、`MODULE_MAP`、`TUTORIAL_STATUS`
- 输出：三端共同 import 的共享层（后续迭代页面零重复封装）

**4. 三端 App 骨架挂载**
- 来源：[tech-design.md#7-前端架构第-8-章](../../design/tech-design.md#7-前端架构第-8-章)
- 输入：shared 层
- 处理逻辑：每端 `main.tsx` + `App.tsx`：`<HashRouter><AuthProvider>…占位路由…</AuthProvider></HashRouter>`；m 端包一层 375 视口容器样式（PhoneShell 组件后续迭代实现，此处仅全局样式预留）
- 输出：三入口各自渲染端标识页，无控制台报错

<!-- REQUIRED_END -->

<!-- REQUIRED:验收标准 -->
## 验收标准

每条标准必须是 Agent 可通过命令自动判定通过/失败的。按阶段组织，前一阶段全部通过后才可进入下一阶段。

### 阶段 1：开发验收

- [ ] `getDiagnostics` 输出 0 Error
- [ ] 构建通过：`cd web && npm install && npm run build` 退出码 0，且 `dist/portal.html`、`dist/admin.html`、`dist/m.html` 三产物存在（`ls dist/*.html` 断言）
- [ ] dev 三入口可达：`npm run dev`（后台）后 `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/portal.html` / `admin.html` / `m.html` 均 `200`
- [ ] proxy 生效（需 INFRA-01 的 server 已启动）：`curl -s http://localhost:5173/api/not-exist` 响应体含 `"code":404`（后端统一 JSON，而非 Vite 的 HTML 404）

### 阶段 2：自测验收

- [ ] 三入口 HTML 均含 `id="root"` 与各自入口 script（`grep` 断言）
- [ ] `src/shared/` 四文件存在且被至少一个端 import（`grep -r "shared/" src/` 非空）
- [ ] 浏览器打开三入口无控制台 error（可用 Playwright/agent-browser 走查，截图留档）
- [ ] 构建产物 + 后端静态托管联合断言：`cd server && npm start` 后 `curl -o /dev/null -w "%{http_code}" http://localhost:3000/portal.html` 返回 200（INFRA-01 预留断言回补）
- [ ] 自测报告含三入口截图与 proxy 断言输出

<!-- REQUIRED_END -->
