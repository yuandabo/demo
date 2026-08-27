---
iteration: IT-02
task-id: INFRA-01
task-name: "共享基础：VISIBLE_SQL 可见性口径与教程状态机转移表"
role: 后端
project-dir: "server"
depends-on: "IT-01.INFRA-01（工程骨架与 SQLite 建库种子：server 骨架 + db.ts + categories/tutorials 表）"
consumes-openapi-from: []
acceptance-criteria:
  - AC-RULE-05: 未验证
  - AC-EG-09: 未验证
tech-design-sections:
  - "tech-design.md#4-后端架构与处理流程"
  - "tech-design.md#11-service-函数清单冻结命名评审修复补充"
  - "tech-design.md#5-数据库设计"
api-docs: []
tech-design-section-hashes:
  "tech-design.md#4-后端架构与处理流程": "前台可见性 SQL 单一口径（VISIBLE_SQL）+ 状态机非法迁移一律 409 + 中间件按当前 status 校验动作合法性"
  "tech-design.md#11-service-函数清单冻结命名评审修复补充": "列表/详情/角标计数/统计共用 db.ts 导出 VISIBLE_SQL，service 函数冻结命名"
  "tech-design.md#5-数据库设计": "tutorials 快照列（published_content/published_summary/last_offline_at）与四态 status 定义"
skipped-gates: []
discovered-sections: []
discovered-dependencies: []
spawned-tasks: []
implementation-notes: "状态机+共享类型/枚举统一落 server/src/state-machine.ts（BE-01~BE-06 从该模块 import，无重复定义）；VISIBLE_SQL 归属 IT-01.INFRA-03 的 db.ts（编排层并行边界仲裁，已记 design/change-log.md CHANGE-1），本任务单测 src/state-machine.test.ts 以动态 import 门控校验其常量逐字一致与种子库语义，db.ts/erp.db 未就绪时用例 skip 并标注联调点，落地后自动生效零改动；测试命令 npm test（tsx --test src/*.test.ts）；assertTutorialTransition 对四态外脏数据按 500 兜底（任务书校验规则表），草稿删除不入转移表（published_content IS NULL 前置判定留给 BE-03 删除路由）"
doc-drift: []
---

# INFRA-01 - 共享基础：VISIBLE_SQL 可见性口径与教程状态机转移表

<!-- REQUIRED:任务目标 -->
## 任务目标

> 来源：[tech-design.md#4-后端架构与处理流程](../../design/tech-design.md#4-后端架构与处理流程) / [tech-design.md#11-service-函数清单冻结命名评审修复补充](../../design/tech-design.md#11-service-函数清单冻结命名评审修复补充)

为 IT-02 全部 6 个 BE 任务提供共享基础设施（被 ≥2 个 BE 任务共享，故独立成 INFRA 任务，不写业务接口）：

1. **VISIBLE_SQL 前台可见性 SQL 片段**（db.ts 导出）：全站唯一的可见口径定义，列表 / 搜索 / 详情 / 分类角标计数 / 统计看板共用，杜绝口径漂移（AC 评审轮 3 教训固化）。
2. **教程状态机转移表 + 合法性校验 helper**：按 AC-RULE-05 合法迁移集落成数据表驱动的转移表（draft→pending 提审 / pending→published 通过 / pending→draft 驳回或撤回 / published→pending 编辑回审 / published→offline 下架 / offline→published 重发布 / offline→pending 编辑回审 / draft→删除 仅纯草稿），提供 `assertTutorialTransition(currentStatus, action)` 校验函数，集合之外的迁移统一抛 409 "该教程状态已变化，请刷新"（AC-EG-09），供 submit/withdraw/review/offline/republish/put 等 BE 任务复用。
3. **共享领域类型与枚举**：TutorialStatus（draft/pending/published/offline）、CategoryStatus（enabled/disabled）、ErpModule（sales/project/file/produce/purchase/inventory/hrFinance/system）TS 类型，及后台列表项扩展字段类型（status/rejectReason/submitCount/authorId/authorName/hasOnlineVersion/lastOfflineAt/createdAt）。

本任务为纯共享基础：关联 AC-RULE-05（状态机合法迁移集）与 AC-EG-09（非法迁移 409 兜底）的判定基础，业务接口的验证由 BE-01~BE-06 承载。
<!-- REQUIRED_END -->

<!-- REQUIRED:API接口文档 -->
## API 接口文档

### 新增接口

无（本任务不实现任何 HTTP 接口）。

### 复用接口

| 接口/方法 | 本任务调用说明 |
|----------|--------------|
| db.ts（IT-01 提供：DatabaseSync 实例 + categories/tutorials 建表 + 种子） | 调用参数：无；使用响应字段：tutorials 表列（status/published_content/last_offline_at 等，见 db.md §2 DDL）；本任务在其模块中追加导出 VISIBLE_SQL 常量与转移表，不改动建表语句 |
| auth 中间件（IT-01.BE-01 提供：DB token 校验 + 角色注入） | 本任务不直接调用；仅约定 BE 任务通过其取得 `user.role`（admin/operator/user）用于权限分支 |
<!-- REQUIRED_END -->

<!-- REQUIRED:核心流程 -->
## 核心流程

**1. VISIBLE_SQL 片段落库为唯一导出常量**
- 来源：[tech-design.md#4-后端架构与处理流程](../../design/tech-design.md#4-后端架构与处理流程)
- 输入：PRD §6 前台可见性规则①②④⑤
- 处理逻辑：在 db.ts（或其伴随模块）导出字符串常量 `VISIBLE_SQL`，内容与 tech-design 逐字一致：
  `published_content IS NOT NULL AND (status = 'published' OR (status IN ('pending','draft') AND last_offline_at IS NULL))`
- 语义核对（5 条规则全覆盖）：①已发布可见 ②回审等待/驳回/撤回旧版在线 ③已下架不可见（status='offline' 不满足任何分支）④已下架来源的回审期间不可见（last_offline_at 非空）⑤从未过审不可见（published_content IS NULL）
- 输出：BE-01（角标计数）/ BE-02（列表/详情/搜索）/ BE-06（统计口径）以字符串拼接方式复用该常量，禁止各任务自写 WHERE 可见性条件
- 异常处理：无运行时异常；使用 prepared statement 拼接时仅做常量内联，参数仍走占位符防注入

**2. 状态机转移表与合法性校验 helper**
- 来源：[tech-design.md#4-后端架构与处理流程](../../design/tech-design.md#4-后端架构与处理流程)
- 输入：AC-RULE-05 合法迁移集
- 处理逻辑：以 `{当前状态: {动作: 目标状态}}` 数据表表达转移表；动作枚举与 §11 冻结命名对齐（submit/withdraw/reviewApprove/reviewReject/editResubmit（PUT 保存回审）/offline/republish）；`assertTutorialTransition(status, action)` 命中则返回目标状态，未命中抛业务错误：HTTP 409 + message "该教程状态已变化，请刷新"
- 校验规则（如有）：

| 输入 | 规则 | 失败返回 |
|------|------|---------|
| status | 必须在四态枚举内 | 500（服务端数据异常，理论不可达） |
| (status, action) 组合 | 必须命中转移表 | 409 STATE_CONFLICT "该教程状态已变化，请刷新" |

- 输出：供 BE-03（PUT 保存按状态分流）、BE-04（submit/withdraw/review）、BE-05（offline/republish）统一调用
- 异常处理：非法迁移（示例：草稿直接发布、已下架未编辑直接提审）一律 409，教程状态保持不变（AC-EG-09）

**3. 共享类型与枚举定义**
- 来源：[tech-design.md#5-数据库设计](../../design/tech-design.md#5-数据库设计)
- 处理逻辑：定义与 db.md DDL 对齐的 TS 类型（TutorialRow/CategoryRow）与管理态列表项扩展字段类型；ErpModule 八枚举与 categories.erp_module 取值一致
- 输出：BE-01~BE-06 import 使用；web 端 shared/types.ts 的对齐由 FE 任务自行维护同构类型
<!-- REQUIRED_END -->

<!-- REQUIRED:验收标准 -->
## 验收标准

### 阶段 1：开发验收

- [ ] `getDiagnostics` 输出 0 Error，`npm run build`（或 tsc --noEmit）通过
- [ ] VISIBLE_SQL 常量从 db.ts 模块导出，内容与 tech-design §4 逐字一致（含 last_offline_at 分支）
- [ ] 转移表覆盖 AC-RULE-05 全部 7 条合法迁移 + 草稿删除前置（published_content IS NULL 判定留给 BE-03）
- [ ] assertTutorialTransition 对以下用例返回预期：('draft','submit')→pending；('pending','reviewApprove')→published；('pending','withdraw')→draft；('published','editResubmit')→pending；('published','offline')→offline；('offline','republish')→published；('offline','editResubmit')→pending；('draft','reviewApprove')→抛 409；('offline','submit')→抛 409
- [ ] 409 错误 message 精确等于"该教程状态已变化，请刷新"（非法迁移 409 契约，AC-EG-09）

### 阶段 2：自测验收

- [ ] 单元自测脚本（node --test 或 tsc 项目内 script）对转移表 4 态 × 7 动作全组合跑通：命中组合返回目标态、未命中组合全部 409
- [ ] VISIBLE_SQL 在 sqlite CLI 或脚本中对种子库执行验证：已发布命中、已下架（种子 1 篇）不命中、v2 回审（种子 1 篇）命中、纯草稿不命中
- [ ] BE-01~BE-06 所需类型/枚举均可从本模块 import，无重复定义
<!-- REQUIRED_END -->
