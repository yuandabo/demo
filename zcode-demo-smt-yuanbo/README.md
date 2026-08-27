# 云ERP教程中心（RE00001）

> 嘉立创云ERP 教程中心子系统 —— 三端（PC 前台 / 管理后台 / 小程序 H5）全栈实现。
> 需求源自《教程中心·功能清单 V0.1》，基于 zcode 插件流水线（PRD → UI → 技术方案 → 任务拆分 → 开发 → 测试验收）完成。

## 功能列表

### PC 前台（portal.html · 5 页）
- **教程首页**：角色推荐位（6 角色 × 8 模块映射）/ 最近更新 / 热门教程 / 12 分类宫格（角标计数、"待补充"）
- **列表页**：分类树 + 标签多选交集筛选 + 关键词搜索（标题/摘要/标签三字段命中，1s 超时兜底）+ 置顶角标 + 分页 + 空态引导
- **详情页**：步骤式阅读（进度条勾选/目录锚点/字号三档/继续阅读续读）、上下篇、收藏、有帮助评价（一次可改）+留言、分享（链接+二维码扫码直达小程序）、关联推荐、已下架提示页
- **我的**：收藏 + 浏览历史双 Tab（进度徽章、已下架灰显+同类推荐）
- **模拟 ERP 工作台**：模块卡"查看教程"内嵌入口（场景联动演示）

### 管理后台（admin.html · 6 页）
- **登录**：admin/operator 两级角色（错误统一"账号或密码错误"，路由守卫+角色菜单显隐）
- **统计看板**：4 指标卡 + 浏览 Top10 条形 + 反馈分析（没帮助占比倒序、>50% 标红、留言明细）+ 覆盖度矩阵（空白区标注、模块聚合）
- **教程管理**：全态列表（状态/分类/关键词筛选）+ 行内操作（提审/撤回/下架/重新发布/复制/删除保护）
- **教程编辑器**：富文本（加粗/H 步骤标题/列表/图片/视频外链）+ 30s 自动保存恢复 + 驳回原因黄条 + 乐观锁并发拦截 + 置顶排序
- **审核队列**：通过/驳回（原因 ≥5 字双重校验）+ AI 生成 Tab（预留）+ 修改版 v2+ 标识
- **目录管理**：两级分类树（拖拽排序/启停用/删除保护 409）+ ERP 模块映射维护

### 小程序 H5（m.html · 5 页，375 视口）
首页（推荐横滑/宫格/消息预留）、列表搜索（下拉刷新）、详情（字号三档/续读/评价收藏与 PC 共用）、收藏历史（跨端同步）、学习打卡（积分/连续徽章/幂等）

### 核心业务规则
- **教程四态状态机**：草稿→待审核→已发布→已下架；编辑回审（前台旧版不断供）；驳回必填原因；重新发布不重审；非法迁移 409
- **前台可见性**：`published_content 快照 IS NOT NULL AND (status='published' OR (pending/draft AND last_offline_at IS NULL))` —— 回审/驳回/撤回期间旧版持续在线（单条 VISIBLE_SQL 全站共用）
- **三端一库**：收藏/历史/进度/评价 PC 与小程序同数据源，刷新即同步

## 技术选型

| 层 | 选型 |
|---|---|
| 前端 | React 18 + TypeScript + Vite 5 多入口单工程（portal/admin/m 三 HTML 入口）+ react-router-dom HashRouter + Context |
| 后端 | Node.js 25 + Express 5 + TypeScript（分层 routes→service→db） |
| 数据库 | node:sqlite（Node 内置 DatabaseSync，零原生依赖，单文件 server/erp.db，可 reset 重建） |
| 鉴权 | DB token（登录发随机 token 入库，Authorization: Bearer，重启不丢会话） |
| 测试 | Playwright（chromium，三端 E2E + API 契约）+ node:test（后端 160 单测） |

## 启动命令

```bash
# 1. 安装依赖（三个 package.json）
npm run install:all        # 根脚本：web + server 一次装完
#（等价于 cd web && npm i && cd ../server && npm i）

# 2. 生产模式（推荐验收）
npm run build              # 构建 web → web/dist
npm start                  # 启动 server :3000（托管 dist + /api，首启自动建库+种子）

# 3. 访问三端
#   PC 前台    http://localhost:3000/portal.html
#   管理后台   http://localhost:3000/admin.html   （admin/123456 或 operator/123456）
#   小程序 H5  http://localhost:3000/m.html       （选角色快速登录）

# 4. 开发模式（可选）
cd web && npm run dev      # Vite :5173，proxy /api → 3000（另起 server: cd server && npm run dev）

# 5. 测试
npm run test:e2e           # Playwright 33 用例 → playwright-report/index.html（含截图）
cd server && npm test      # 后端 160 单测（串行）

# 6. 数据重置（任何时刻恢复种子）
curl -X POST http://localhost:3000/api/system/reset -H "Authorization: Bearer {adminToken}" -H "Content-Type: application/json"
# 或删除 server/erp.db 后重启
```

**演示账号**：admin / operator（后台）；销售/采购/生产/仓库/管理/财务 6 角色一键登录（前台与小程序，密码 123456）

## 目录结构

```
├── server/          # Express + node:sqlite（35 API 端点 + 9 表 + 种子）
├── web/             # Vite 多入口 React18+TS（三端 16 页 + shared 共享层）
├── tests/           # Playwright（api/portal/admin/m 四 spec）
├── playwright-report/   # 验收 HTML 报告（含三端截图，交付物）
├── docs/
│   ├── prd/PRD.md   # 产品需求（saas-erp 型，评审通过 0 P0）
│   ├── ac.md        # 验收标准（53 条 + 规则 26 + UI 23）
│   ├── design/      # 技术方案 / 35 API 契约 / DB 设计 / change-log
│   ├── tasks/       # 6 迭代 43 任务（zcode breakdown-task 产出）
│   ├── ui/          # 三端高保真 HTML 原型 17 页（4 轮 QA 54/60）
│   ├── testing/     # 测试案例 545 条 + 验收报告 + AC 覆盖矩阵
│   └── reports/     # 各任务自测报告与截图
├── 开发总结与思考.md
└── README.md
```

## 验收状态

- Playwright：**33/33 全绿**（API 21 + 三端 E2E 12），HTML 报告含 13 张截图
- 后端单测：**160/160 全绿**
- AC：基线 22 条 + 抽样共 54 条全 pass（`docs/testing/reports/ac-coverage-matrix.md`）
- 交付核对：✅ PRD+技术方案 ✅ README ✅ 前后端代码 ✅ Playwright HTML 报告（含截图） ✅ 开发总结与思考
