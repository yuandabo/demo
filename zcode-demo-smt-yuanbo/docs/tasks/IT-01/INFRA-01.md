---
iteration: IT-01
task-id: INFRA-01
task-name: "后端服务脚手架（Express 5 + TS：入口/统一响应/错误处理/静态托管）"
role: 基础设施
project-dir: "server"
depends-on: "无"
consumes-openapi-from: []
acceptance-criteria:
  - AC-NF-04: 未验证
tech-design-sections:
  - "tech-design.md#1-概述与目标"
  - "tech-design.md#2-现有代码基础与仓库结构"
  - "tech-design.md#3-api-接口总览"
api-docs: []
tech-design-section-hashes:
  "tech-design.md#1-概述与目标": "后端 Node 25 + Express 5 + TypeScript，单体，端口 3000；npm start 托管 dist + /api"
  "tech-design.md#2-现有代码基础与仓库结构": "server/src/index.ts 为应用入口：静态托管 web/dist + /api 路由 + 鉴权中间件；src/routes/ 分领域路由文件"
  "tech-design.md#3-api-接口总览": "资源制 REST，/api 前缀，JSON，统一响应 {code, message, data}（0/401/403/404/409）"
skipped-gates: []
discovered-sections: []
discovered-dependencies:
  - "server: express@^5.2.1（运行时）；typescript@7/tsx@4/@types/express@5/@types/node@26（dev）"
spawned-tasks: []
implementation-notes: "①未引入 cors：开发态 Vite 5173 proxy /api→3000 + 生产同源静态托管，无跨域场景（tech-design §1）；②response.ts 提供 ok/fail/HttpError/notFoundHandler/errorHandler，fail 的 code 默认=httpStatus（当前全部 API 契约 code===status），BE 任务可直接 throw HttpError(status,message)；③路由骨架 routes/index.ts 含公开路由区（已挂 /auth 空骨架）与需鉴权组挂载位（BE-01 提供 authRequired 后填充）；④web/dist 缺失时不挂载静态中间件，GET / 回退统一 404 JSON；⑤ESM(NodeNext)+strict，本地相对导入需带 .js 后缀"
doc-drift: []
---

# INFRA-01 - 后端服务脚手架（Express 5 + TS：入口/统一响应/错误处理/静态托管）

<!-- REQUIRED:任务目标 -->
## 任务目标

> 来源：[tech-design.md#2-现有代码基础与仓库结构](../../design/tech-design.md#2-现有代码基础与仓库结构) / [tech-design.md#1-概述与目标](../../design/tech-design.md#1-概述与目标)

从零搭建 `server/` 后端工程（Express 5 + TypeScript + Node 25）：

1. `server/package.json`（scripts：`dev`=tsx watch 热更、`build`=tsc、`start`=node 产物）、`tsconfig.json`（ESM 或 CommonNode 一致即可，严格模式）。
2. `server/src/index.ts` 应用入口：JSON body 解析 → `/api` 前缀路由挂载 → 静态托管 `web/dist`（express.static，多入口 + HashRouter 无需 SPA fallback）→ 监听 3000。
3. 统一响应封装：`{code, message, data}`，code 取值 0/400/401/403/404/409/500；提供 `ok(data)` / `fail(httpStatus, code, message)` helper。
4. 全局错误处理：未知 `/api/*` 路径返回 404 JSON（非 HTML）；异常兜底 500 JSON。
5. `src/routes/` 目录与路由注册骨架（本任务只挂空路由组，业务路由由后续任务填充）。

**AC 关联原因**：本任务为纯基础设施，关联 AC-NF-04（后台接口鉴权全覆盖）——本任务交付统一响应/错误处理与鉴权中间件的挂载点（路由分组骨架），是"全覆盖"的工程基座；鉴权中间件本体在 BE-01 实现。

<!-- REQUIRED_END -->

<!-- REQUIRED:API接口文档 -->
## API 接口文档

### 新增接口

无（本任务不实现业务接口，仅交付工程骨架与统一响应结构）。

### 复用接口

无。
<!-- REQUIRED_END -->

<!-- REQUIRED:核心流程 -->
## 核心流程

**1. 工程初始化**
- 来源：[tech-design.md#1-概述与目标](../../design/tech-design.md#1-概述与目标)
- 输入：空目录 `server/`
- 处理逻辑：`npm init` → 安装 `express@5` + `typescript` + `tsx` + `@types/express` `@types/node` → 配置 `tsconfig.json`（outDir=dist、strict、NodeNext）
- 输出：可 `npm run dev`（tsx watch）/ `npm run build && npm start` 的 TS 工程

**2. 统一响应与错误处理**
- 来源：[tech-design.md#3-api-接口总览](../../design/tech-design.md#3-api-接口总览)
- 输入：各路由的处理结果或抛出的业务错误
- 处理逻辑：封装 `ok(data)` → `{"code":0,"message":"ok","data":...}`；`fail(status, code, message)`；404 中间件（`/api/*` 未命中返回 `{"code":404,"message":"接口不存在"}`）；500 兜底中间件（捕获异常返回 `{"code":500,...}`）
- 校验规则：

  | 场景 | 规则 | 失败返回 |
  |------|------|---------|
  | 未知 /api 路径 | 路由未命中 | 404 + `{"code":404}` JSON |
  | 处理器抛异常 | 全局错误中间件捕获 | 500 + `{"code":500}` JSON |

- 输出：所有 /api 响应 Content-Type 均为 application/json

**3. 路由分组与鉴权挂载点**
- 来源：[tech-design.md#2-现有代码基础与仓库结构](../../design/tech-design.md#2-现有代码基础与仓库结构)
- 输入：路由注册表
- 处理逻辑：`src/routes/` 下按领域建文件骨架（auth.ts 等，可先空导出）；index.ts 挂载 `app.use('/api', apiRouter)`；预留公开路由白名单与需鉴权路由组的注册位（中间件本体由 BE-01 提供）
- 输出：`/api` 路由树可增量挂载

**4. 静态托管与启动**
- 来源：[tech-design.md#1-概述与目标](../../design/tech-design.md#1-概述与目标)
- 输入：`web/dist`（构建产物，可能暂不存在）
- 处理逻辑：`app.use(express.static('../web/dist'))`（相对 server 运行目录解析，dist 不存在时不报错）；`app.listen(3000)`
- 输出：`npm start` 后 3000 端口提供 /api 与静态资源

<!-- REQUIRED_END -->

<!-- REQUIRED:验收标准 -->
## 验收标准

每条标准必须是 Agent 可通过命令自动判定通过/失败的。按阶段组织，前一阶段全部通过后才可进入下一阶段。

### 阶段 1：开发验收

- [x] `getDiagnostics` 输出 0 Error（无 TS 诊断错误）
- [x] 代码可正常编译：`cd server && npm install && npm run build` 退出码 0
- [x] 启动无报错：`cd server && npm start`（后台），日志输出监听 3000
- [x] `curl -s -o /dev/null -w "%{http_code} %{content_type}" http://localhost:3000/api/not-exist` → `404 application/json`（统一 404 JSON，非 HTML）
- [x] `curl -s http://localhost:3000/api/not-exist` 响应体含 `"code":404`
- [x] `curl -s -X POST http://localhost:3000/api/not-exist -H 'Content-Type: application/json' -d '{}'` 同样返回 404 JSON（POST 未命中也走统一 404）

### 阶段 2：自测验收

- [x] dev 模式可用：`npm run dev` 启动后同样通过上述 curl 断言（热更模式）
- [x] 构建产物启动：`npm run build && npm start` 通过同一组 curl 断言
- [x] 静态托管就绪性：`web/dist` 不存在时服务不崩溃（GET / 返回 404 JSON）✅已验；INFRA-02 产物就绪后 `curl http://localhost:3000/portal.html` 返回 200（跨任务联合断言，届时回补勾选）⬜待回补
- [x] 自测报告含启动日志与 3 条 curl 断言输出

<!-- REQUIRED_END -->
