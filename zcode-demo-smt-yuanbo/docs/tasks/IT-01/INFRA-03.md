---
iteration: IT-01
task-id: INFRA-03
task-name: "数据库建库与种子数据（db.ts：9 表 DDL + 种子 + reset 函数 + VISIBLE_SQL）"
role: 基础设施
project-dir: "server"
depends-on: "INFRA-01（后端服务脚手架：server/ TS 工程与启动入口）"
consumes-openapi-from: []
acceptance-criteria:
  - AC-OP-01: 未验证
  - AC-NF-06: 未验证
tech-design-sections:
  - "tech-design.md#5-数据库设计"
  - "tech-design.md#2-现有代码基础与仓库结构"
  - "tech-design.md#8-非功能实现"
api-docs: []
tech-design-section-hashes:
  "tech-design.md#5-数据库设计": "node:sqlite DatabaseSync 单文件 server/erp.db；DDL 见 design/sql/*.sql（幂等 CREATE IF NOT EXISTS）；种子见 db.md §6"
  "tech-design.md#2-现有代码基础与仓库结构": "src/db.ts：建库（source design/sql/*.sql）+ 种子 + reset"
  "tech-design.md#8-非功能实现": "可重复交付：POST /api/system/reset 或删除 erp.db 重启即重建种子（AC-OP-01/AC-NF-06）"
skipped-gates: []
discovered-sections: []
discovered-dependencies: []
spawned-tasks: []
implementation-notes: "1) 种子数据拆分至 src/seed.ts（tech-design §2 仅列 db.ts，属实现细化，接口不变）；2) VISIBLE_SQL 口径下可见数=19（18 已发布 + 1 待审核回审旧版在线《销售订单录入操作指南》），与任务指令'可见性查询返回 18 篇'冲突，已记录 CHANGE-001，seed:check 同时输出两个口径；3) erp_module 取值约定 sales/project/document/produce/purchase/warehouse/finance/system，与 erp_role 枚举对齐（BE-03 recommend 直接复用）；4) resetDatabase() 返回 SeedCounts 即 reset 契约响应体，BE-02 直接透传；5) 教程 share_count 按浏览量固定比例（view/60 取整）生成非零演示值"
doc-drift:
  - "任务指令'可见性查询返回 18 篇'与冻结公式冲突 → 见 process-docs/RE00001/design/change-log.md CHANGE-001（可见=19）"
---

# INFRA-03 - 数据库建库与种子数据（db.ts：9 表 DDL + 种子 + reset 函数 + VISIBLE_SQL）

<!-- REQUIRED:任务目标 -->
## 任务目标

> 来源：[tech-design.md#5-数据库设计](../../design/tech-design.md#5-数据库设计) / 种子规格 [db.md#6-种子数据](../../design/db/db.md#6-种子数据)

在 INFRA-01 的 server 工程内实现 `server/src/db.ts`：

1. **建库**：node:sqlite `DatabaseSync` 打开 `server/erp.db`；启动时按序执行 `docs/design/sql/*.sql` 全部 9 个 DDL 文件（users / auth_tokens / categories / tutorials / favorites / histories / feedbacks / messages / checkins），幂等可重复执行。
2. **种子数据**（严格对齐 db.md §6）：
   - 12 个启用一级分类（8 大模块 + 新手入门/最佳实践/常见问题/开放平台，含 erp_module 映射）
   - 24 篇教程四态分布：18 已发布（分布 3/2/1/3/3/2/1/0/1/1/1/0）+ 3 待审核（含 1 篇 v2 修改版：`submit_count≥2` 且 `published_content` 有旧版快照）+ 2 草稿（1 篇 `reject_reason` 非空）+ 1 已下架（`published_content` 非空 + `last_offline_at` 非空）；内容取材云ERP业务知识（6 大能力/订单 7 环节/MRP/扫码报工/库位/13 态等），含浏览/收藏/评价计数与标签
   - 8 个账号：admin/123456、operator/123456、6 个角色演示用户（sales/purchase/produce/warehouse/manage/finance，密码 123456）
   - 3 条 mock 消息（审批待办关联教程，按 erp_role 投递）+ 5 天示例打卡（含 points/streak）
3. **reset 能力**：导出 `resetDatabase()`——事务内清空 9 表并重跑种子（供 BE-02 的 `/api/system/reset` 调用）；删除 erp.db 重启亦重建。
4. **VISIBLE_SQL 导出**：`published_content IS NOT NULL AND (status='published' OR (status IN ('pending','draft') AND last_offline_at IS NULL))`，作为后续迭代列表/搜索/详情/推荐共用 WHERE 片段。
5. **种子校验脚本**：`npm run seed:check` 输出各表计数与教程四态分布，供验收断言。

**AC 关联**：AC-OP-01（全新空库执行种子初始化：数量齐备、重复执行不产生脏数据）、AC-NF-06（种子可重复初始化、数据库单文件交付）。

<!-- REQUIRED_END -->

<!-- REQUIRED:API接口文档 -->
## API 接口文档

### 新增接口

无（本任务为数据库层基础设施，无 HTTP 接口；HTTP 侧的 reset 端点在 BE-02）。

### 复用接口

无。
<!-- REQUIRED_END -->

<!-- REQUIRED:核心流程 -->
## 核心流程

**1. 建库连接与 DDL 执行**
- 来源：[tech-design.md#5-数据库设计](../../design/tech-design.md#5-数据库设计)
- 输入：`docs/design/sql/*.sql` 9 个文件（建表顺序需满足外键引用：先 users/categories 后 tutorials 及行为表）
- 处理逻辑：`new DatabaseSync(path)` → 逐文件 `exec(sql)`（CREATE IF NOT EXISTS 天然幂等）→ 导出 db 实例与 prepared statements 约定
- 数据库操作：

  | 操作 | SQL 骨架 | 说明 |
  |------|---------|------|
  | DDL | `CREATE TABLE IF NOT EXISTS ...`（source sql/*.sql 原文） | 9 表 + 2 索引，幂等 |

- 输出：`server/erp.db` 文件 + 可复用连接
- 异常处理：SQL 文件缺失/语法错误 → 启动即抛错退出（fail fast），日志指明文件名

**2. 种子数据写入**
- 来源：[db.md#6-种子数据](../../design/db/db.md#6-种子数据)
- 输入：种子常量（代码内以 TS 数组维护，禁止随机值）
- 处理逻辑：INSERT 语句逐表写入；用固定 id 保证 tutorials↔categories/users/messages 外键对应；种子执行前先 `SELECT COUNT(*)` 判空（非空跳过，保证重启幂等，AC-OP-01 第 2 点）
- 数据库操作：

  | 操作 | SQL 骨架 | 说明 |
  |------|---------|------|
  | 幂等判空 | `SELECT COUNT(*) AS n FROM categories` | n>0 跳过种子 |
  | INSERT | `INSERT INTO categories(id,name,parent_id,sort,status,erp_module) VALUES(...)` 等 | 固定 id 种子 |

- 输出：12 分类 / 24 教程 / 8 用户 / 3 消息 / 5 打卡
- 异常处理：唯一约束冲突（重复执行）→ 判空逻辑兜底不触发；仍冲突则事务回滚并报错

**3. reset 函数**
- 来源：[tech-design.md#8-非功能实现](../../design/tech-design.md#8-非功能实现)
- 输入：无
- 处理逻辑：`resetDatabase()`：事务内 `DELETE FROM` 9 表（含 sqlite_sequence 重置 AUTOINCREMENT）→ 重跑步骤 2 种子 → 返回各表计数
- 输出：`{categories:12, tutorials:24, users:8, messages:3, checkins:5}` 供 BE-02 组装响应
- 异常处理：事务失败回滚，数据保持原状（BE-02 转 500）

**4. VISIBLE_SQL 导出与校验脚本**
- 来源：[tech-design.md#4-后端架构与处理流程](../../design/tech-design.md#4-后端架构与处理流程)（核心链路 2）
- 处理逻辑：`export const VISIBLE_SQL = "published_content IS NOT NULL AND (status='published' OR (status IN ('pending','draft') AND last_offline_at IS NULL))"`；`scripts/seed-check.ts` 查询输出计数（后续任务以 node 直跑）
- 输出：`npm run seed:check` 可执行

<!-- REQUIRED_END -->

<!-- REQUIRED:验收标准 -->
## 验收标准

每条标准必须是 Agent 可通过命令自动判定通过/失败的。按阶段组织，前一阶段全部通过后才可进入下一阶段。

### 阶段 1：开发验收

- [ ] `getDiagnostics` 输出 0 Error；`cd server && npm run build` 退出码 0
- [ ] 空库首启自动建库：删除 `server/erp.db`（如存在）→ `npm start` → `server/erp.db` 文件生成且启动无报错
- [ ] `cd server && npm run seed:check` 输出：`categories=12 tutorials=24 users=8 messages=3 checkins=5`
- [ ] 四态分布断言：`seed:check` 输出 `published=18 pending=3 draft=2 offline=1`
- [ ] `.gitignore` 含 `server/erp.db`（AC-NF-06：运行时文件不入库，单文件交付）

### 阶段 2：自测验收

- [ ] 幂等验证（AC-OP-01 第 2 点）：重启服务（二次启动）后再跑 `seed:check`，各表数量不变、无重复行
- [ ] 种子结构断言（可扩展 seed:check 或 node -e 查询）：
  - 待审核教程中存在 1 篇 `submit_count>=2 AND published_content IS NOT NULL`（v2 修改版）
  - 草稿中 1 篇 `reject_reason` 非空
  - 已下架教程 `last_offline_at` 非空且 `published_content` 非空
  - 8 账号齐备：admin、operator、sales/purchase/produce/warehouse/manage/finance，role 分布 admin=1/operator=1/user=6
  - 12 分类均 `status='enabled'` 且 8 大模块 `erp_module` 非空
- [ ] 删除重建验证（AC-NF-06）：删 erp.db → 重启 → seed:check 计数恢复 12/24/8/3/5
- [ ] 自测报告含 seed:check 两次输出对比与结构断言结果

<!-- REQUIRED_END -->
