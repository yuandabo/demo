# API 业务流程测试案例 — 云ERP教程中心（三端）· 教程全生命周期与跨模块 API 流程

> 需求编号：RE00001
> 模块：云ERP教程中心（三端）· 教程全生命周期与跨模块 API 流程
> 案例类型：flow（API 业务流程）
> API 前缀：/api
> 生成日期：2026-08-23T00:00:00+08:00

---

## 流程案例总览

| 编号 | 流程名称 | 流程类型 | 涉及 AC | 涉及接口 |
|------|---------|---------|---------|---------|
| FLOW-REVIEW-001 | 教程创作-提审-审核通过-三端可见 主链路（草稿→待审核→已发布） | 端到端链路 | AC-FN-07, AC-FN-08, AC-OP-05 | POST /api/auth/login, POST /api/tutorials, PUT /api/tutorials/:id, GET /api/tutorials/:id?all=1, POST /api/tutorials/:id/submit, GET /api/tutorials?status=pending, POST /api/tutorials/:id/review, GET /api/tutorials?keyword=FLOW测试 |
| FLOW-REVIEW-001-E01 | 必填缺失与长度越界阻断提审（异常中断） | 异常中断 | AC-EG-01 | POST /api/tutorials, POST /api/tutorials/:id/submit, PUT /api/tutorials/:id |
| FLOW-REVIEW-001-B01 | 重复提审与重复审核防抖——状态机 409 兜底（仅首次生效） | 异常中断 | AC-EG-03, AC-EG-19 | POST /api/tutorials, POST /api/tutorials/:id/submit, POST /api/tutorials/:id/review |
| FLOW-REVIEW-002 | 驳回-修改-重提循环（驳回原因双重校验，回草稿后重提） | 异常中断 | AC-FN-09 | POST /api/tutorials, POST /api/tutorials/:id/submit, POST /api/tutorials/:id/review, GET /api/tutorials?all=1&status=draft, PUT /api/tutorials/:id |
| FLOW-REVIEW-003 | 待审核撤回流程（运营点击撤回→回草稿→修改→重新提审） | 状态流转 | AC-OP-07 | POST /api/tutorials, POST /api/tutorials/:id/submit, POST /api/tutorials/:id/withdraw, GET /api/tutorials?status=pending, PUT /api/tutorials/:id, POST /api/tutorials/:id/review |
| FLOW-REVIEW-004 | 审核与撤回并发互斥——后到动作失效（双时序） | 异常中断 | AC-EG-04 | POST /api/tutorials/:id/submit, POST /api/tutorials/:id/withdraw, POST /api/tutorials/:id/review, GET /api/tutorials/:id?all=1 |
| FLOW-EDIT-005 | 已发布教程编辑保存回审，前台旧版 v1 不断供，过审后新版替换（v1→v2） | 状态流转 | AC-FN-10 | GET /api/tutorials/:id, GET /api/tutorials/:id?all=1, PUT /api/tutorials/:id, GET /api/tutorials?keyword=<T 标题关键词>, POST /api/tutorials/:id/review |
| FLOW-EDIT-005-E01 | 已发布教程回审版被驳回——编辑版回草稿，线上 v1 持续在线（异常中断） | 异常中断 | AC-FN-19, AC-EG-15 | PUT /api/tutorials/:id, POST /api/tutorials/:id/review, GET /api/tutorials/:id, GET /api/tutorials?keyword=<T 标题关键词>, GET /api/tutorials/:id?all=1 |
| FLOW-EDIT-006 | 两名运营并发编辑同一篇教程——乐观锁后保存者收到覆盖告知（边界） | 异常中断 | AC-EG-05 | GET /api/tutorials/:id?all=1, PUT /api/tutorials/:id |
| FLOW-OFFLINE-007 | 下架-三端善后-重新发布 完整链路（收藏/直达/小程序善后 + 计数延续） | 业务联动 | AC-OP-03, AC-FN-11, AC-FN-20, AC-EG-10 | POST /api/favorites/:tutorialId, POST /api/tutorials/:id/offline, GET /api/tutorials?keyword=<T 标题关键词>, GET /api/recommend, GET /api/tutorials/:id, GET /api/favorites, GET /api/histories, POST /api/tutorials/:id/republish |
| FLOW-OFFLINE-008 | 已下架教程编辑保存回审——内容已变需重审，过审前维持不可见（异常中断） | 状态流转 | AC-EG-18 | POST /api/tutorials/:id/offline, PUT /api/tutorials/:id, GET /api/tutorials/:id, POST /api/tutorials/:id/review |
| FLOW-STATE-009 | 状态机非法迁移后端拒绝（草稿直达发布、已下架未编辑直达提审） | 异常中断 | AC-EG-09 | POST /api/tutorials/:id/review, POST /api/tutorials/:id/submit, POST /api/tutorials/:id/offline |
| FLOW-DEL-010 | 复制教程-计数清零-新草稿编辑删除 完整 CRUD（含删除保护） | CRUD 完整流程 | AC-FN-12, AC-OP-06 | GET /api/tutorials/:id, POST /api/favorites/:tutorialId, POST /api/feedbacks/:tutorialId, POST /api/tutorials/:id/copy, GET /api/tutorials?all=1, DELETE /api/tutorials/:id |
| FLOW-DEL-011 | 运营越权删除他人名下草稿被拒（403，教程仍存在） | 异常中断 | AC-EG-08 | POST /api/tutorials, DELETE /api/tutorials/:id |
| FLOW-PERM-012 | 运营越权调用审核/发布/分类管理/重置接口全量 403 + 后台未登录访问 401 | 异常中断 | AC-FN-18, AC-EG-06 | POST /api/tutorials/:id/review, POST /api/tutorials/:id/offline, POST /api/tutorials/:id/republish, POST /api/categories, PUT /api/categories/:id, DELETE /api/categories/:id, POST /api/system/reset, GET /api/tutorials?all=1（无 Authorization） |
| FLOW-CAT-014 | 分类生命周期 CRUD：新增一级分类-教程归属-删除保护-移走后删除 | CRUD 完整流程 | AC-OP-08, AC-FN-13 | POST /api/categories, GET /api/categories?withCount=1, POST /api/tutorials, DELETE /api/categories/:id, DELETE /api/tutorials/:id, GET /api/categories |
| FLOW-CAT-015 | 分类模块映射维护与停用/启用联动（角色推荐命中集、搜索口径、收藏直达可达） | 业务联动 | AC-OP-04, AC-OP-09, AC-EG-14, AC-FN-17 | POST /api/categories, POST /api/tutorials, POST /api/tutorials/:id/submit, POST /api/tutorials/:id/review, PUT /api/categories/:id, GET /api/recommend, POST /api/favorites/:tutorialId, GET /api/categories?withCount=1 |
| FLOW-LEARN-016 | 用户学习互动-数据回流看板 端到端闭环（浏览/进度/收藏/评价/分享→统计） | 端到端链路 | AC-FN-04, AC-FN-05, AC-FN-06, AC-FN-14, AC-FN-23 | POST /api/auth/role-login, GET /api/tutorials/:id, POST /api/histories/:tutorialId, POST /api/favorites/:tutorialId, POST /api/feedbacks/:tutorialId, POST /api/tutorials/:id/share, GET /api/stats/overview, GET /api/stats/feedback |
| FLOW-CROSS-017 | 跨端数据一致：收藏/阅读进度/评价 PC 与小程序同账号互通 | 端到端链路 | AC-FN-15, AC-FN-25 | POST /api/auth/role-login, POST /api/favorites/:tutorialId, GET /api/favorites, DELETE /api/favorites/:tutorialId, POST /api/histories/:tutorialId, GET /api/tutorials/:id, POST /api/feedbacks/:tutorialId |
| FLOW-CHECKIN-018 | 学习打卡积分与幂等——当日重复点击无效、徽章数据口径 | 业务联动 | AC-FN-16 | POST /api/checkins, GET /api/checkins |
| FLOW-DISC-019 | 首页区块与推荐位取数口径（未登录全站 Top6 / 最近更新 / 热门 / 分类宫格 / 小程序同源搜索） | 端到端链路 | AC-FN-22, AC-FN-24 | GET /api/recommend, GET /api/tutorials?sort=latest&pageSize=6, GET /api/tutorials?sort=hot&pageSize=6, GET /api/categories?withCount=1, GET /api/categories, GET /api/tutorials?keyword=<种子关键词> |
| FLOW-SEED-020 | 种子初始化可重复执行与交付验收（重置脚本 + Playwright 全量执行） | 端到端链路 | AC-OP-01, AC-OP-02 | POST /api/auth/login, POST /api/system/reset, GET /api/categories, GET /api/tutorials, POST /api/auth/role-login, GET /api/recommend, GET /api/tutorials?sort=latest, GET /api/stats/overview |
| FLOW-VISIT-013 | 游客互动权限边界与登录后回原位收藏（未登录 401 引导→登录→收藏成功） | 异常中断 | AC-FN-03, AC-EG-07 | GET /api/tutorials/:id, POST /api/feedbacks/:tutorialId, POST /api/favorites/:tutorialId, POST /api/auth/role-login |

---

## FLOW-REVIEW-001: 教程创作-提审-审核通过-三端可见 主链路（草稿→待审核→已发布）

覆盖AC: AC-FN-07, AC-FN-08, AC-OP-05

- 流程类型：端到端链路
- 涉及写操作：新建教程/编辑教程/保存草稿/提交审核/审核通过
- 状态转换：草稿 → 待审核（提审）→ 已发布（通过）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-REVIEW-001-S01 | 运营编辑账号密码登录后台 | POST /api/auth/login | username=operator, password=123456 | 后台登录成功进入教程管理（账号密码登录，错误提示统一“账号或密码错误”） | 200, {code:0, data.user.role=operator, data.token 非空} | operatorToken → S02~S05 |
| S02 | FLOW-REVIEW-001-S02 | 运营编辑新建教程（标题/所属分类/摘要/正文必填齐全，AC-RULE-18 口径） | POST /api/tutorials | title=FLOW测试_${Date.now()}_销售订单十三态, categoryId=<启用分类ID>, summary, content=<富文本正文>, tags=[FLOW,销售] | 创建成功，后台列表出现新教程且状态=草稿（仅作者后台可见，不进前台与审核队列） | 200, {code:0, data.status=draft}（AC-RULE-01 草稿态：新建即草稿） | tutorialId → S03~S09 |
| S03 | FLOW-REVIEW-001-S03 | 运营编辑保存草稿并反复覆盖（草稿态保存仍为草稿） | PUT /api/tutorials/:id | tutorialId, summary=<修改后摘要> | 保存成功，状态仍为草稿，可反复保存覆盖（必填完整性仅提审时校验） | 200, {data.status=draft}；标题>100 字/摘要>200 字/标签>5 个时 400 阻断（AC-RULE-18 长度越界保存草稿与提审均阻断） | — |
| S04 | FLOW-REVIEW-001-S04 | 运营退出后再次进入该教程编辑器（管理口径取当前编辑值） | GET /api/tutorials/:id?all=1 | tutorialId, all=1（operator 登录态） | 再次进入编辑器内容完整保留（标题/分类/摘要/正文与最近一次保存一致） | 200, content/summary=当前编辑值（工作列，非快照），管理口径不计浏览量 | — |
| S05 | FLOW-REVIEW-001-S05 | 运营点击提交审核 | POST /api/tutorials/:id/submit | tutorialId | 提审按钮防抖仅首次生效；教程状态由草稿变为待审核进入审核队列；前台列表/搜索/推荐均不返回该教程 | 200, {data.status=pending, data.submitCount=1}（AC-RULE-02 待审核态：无线上过审版本在前台/搜索/推荐/小程序均不可见） | status=pending → S06 |
| S06 | FLOW-REVIEW-001-S06 | 管理员登录并查看审核队列 | POST /api/auth/login; GET /api/tutorials?status=pending | admin 登录; status=pending | 审核队列出现该教程（按提交时间倒序），无“修改版 v2+”标识（首次提审） | 200, {data.list 含 tutorialId, status=pending} | adminToken → S07 |
| S07 | FLOW-REVIEW-001-S07 | 管理员点击通过 | POST /api/tutorials/:id/review | tutorialId, action=approve | 教程状态变为已发布，记录审核人与审核时间（管理操作留痕）；前台列表与搜索的下一次请求即返回该教程（无需重启服务、无需重新登录） | 200, {data.status=published}（AC-RULE-03 已发布：三端可见）, publishedAt/reviewerId/reviewedAt 非空（AC-NF-04 留痕） | — |
| S08 | FLOW-REVIEW-001-S08 | 前台列表与关键词搜索验证（标题/摘要/标签三字段命中） | GET /api/tutorials?keyword=FLOW测试 | keyword=<FLOW测试 唯一片段> | 前台列表/搜索命中返回新发布教程卡片（标题/摘要/标签任一命中即返回） | 200, {data.list 含 tutorialId, total>=1}（发布后前台可见池即时包含） | — |
| S09 | FLOW-REVIEW-001-S09 | 详情页与小程序同源验证（游客可看） | GET /api/tutorials/:id | tutorialId（无登录态） | 详情页展示线上过审版本内容；小程序端列表/首页同一次请求即返回该教程（与 PC 同数据源） | 200, content=published_content 快照, viewCount 较打开前基准 +1（AC-RULE-08 浏览量=打开详情页次数，不去重、含游客） | — |

**前置条件**：
1. 后端服务已启动（localhost:3000）
1. 种子数据就绪（admin/123456、operator/123456 可登录）
1. 测试数据前缀：FLOW测试_${Date.now()}

**清理策略**：
- 教程已发布存在线上过审版本不可删除；流程套件收尾统一执行 POST /api/system/reset 恢复种子态（admin）

**version**: v1
**lastUpdatedBy**: case-designer

### FLOW-REVIEW-001-E01: 必填缺失与长度越界阻断提审（异常中断）

覆盖AC: AC-EG-01

- 流程类型：异常中断
- 涉及写操作：新建教程/提交审核
- 状态转换：草稿 →（提审被阻断）草稿

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-REVIEW-001-E01-S01 | 运营编辑新建教程仅填标题与所属分类（摘要/正文留空，草稿允许） | POST /api/tutorials | title=FLOW测试_${Date.now()}_缺失校验, categoryId=<启用分类ID>, summary 省略, content 省略 | 草稿创建成功（草稿阶段允许摘要/正文为空反复保存） | 200, {data.status=draft} | tutorialId → S02 |
| S02 | FLOW-REVIEW-001-E01-S02 | 运营点击提交审核（必填缺失） | POST /api/tutorials/:id/submit | tutorialId | 阻断提审，教程不进入待审核；缺失字段高亮标识；提示“请补全标题/分类/摘要/正文后再提交” | 400, {code:400, message=请补全标题/分类/摘要/正文后再提交}，状态保持 draft | — |
| S03 | FLOW-REVIEW-001-E01-S03 | 补全摘要与正文后重新提审 | PUT /api/tutorials/:id; POST /api/tutorials/:id/submit | 补全 summary/content 后 submit | 补全后可重新提审，状态变为待审核 | 200, {data.status=pending} | — |
| S04 | FLOW-REVIEW-001-E01-S04 | 长度越界边界校验（标题>100 字；摘要>200 字、标签>5 个同规则） | POST /api/tutorials | title=<101 字标题> | 阻断保存草稿并高亮对应字段（保存草稿与提审均阻断） | 400, {message 含“标题不超过 100 字”}（AC-RULE-18：标题必填≤100 字；摘要必填≤200 字；标签可选≤5 个） | — |

**前置条件**：
1. operator token 已获取（登录同 FLOW-REVIEW-001-S01）
1. 存在启用分类

**清理策略**：
- S03 产生的待审核教程先 POST withdraw 撤回为纯草稿再 DELETE /api/tutorials/:id 清理

**version**: v1
**lastUpdatedBy**: case-designer

### FLOW-REVIEW-001-B01: 重复提审与重复审核防抖——状态机 409 兜底（仅首次生效）

覆盖AC: AC-EG-03, AC-EG-19

- 流程类型：异常中断
- 涉及写操作：提交审核/审核通过
- 状态转换：草稿 → 待审核（仅一次迁移）；待审核 → 已发布（仅一次迁移）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-REVIEW-001-B01-S01 | 准备数据：新建必填齐全草稿并提审成功（首次） | POST /api/tutorials; POST /api/tutorials/:id/submit | 必填齐全, submit 一次 | 第一次提审成功进入待审核 | 200, {data.status=pending, submitCount=1} | tutorialId → S02 |
| S02 | FLOW-REVIEW-001-B01-S02 | 运营对同一教程连续快速点击提交审核（第二次调用） | POST /api/tutorials/:id/submit | tutorialId（pending 态再次 submit） | 按钮防抖仅首次生效：教程仅发生一次草稿→待审核迁移，审核队列中该教程仅出现一条记录；无重复提审提示（静默防抖，后端以状态机 409 兜底） | 409, {code:409, message=该教程状态已变化，请刷新}，submitCount 保持 1，队列无重复条目 | — |
| S03 | FLOW-REVIEW-001-B01-S03 | 管理员连续快速点击“通过”（驳回同规则）——第一次调用 | POST /api/tutorials/:id/review | tutorialId, action=approve | 第一次通过生效：仅一次状态迁移、一条审核留痕，队列条目消失 | 200, {data.status=published, reviewerId/reviewedAt 一条留痕} | — |
| S04 | FLOW-REVIEW-001-B01-S04 | 管理员连续快速点击“通过”（驳回同规则）——第二次调用 | POST /api/tutorials/:id/review | tutorialId（published 态再次 approve） | 仅首次生效：无重复迁移记录，教程状态保持已发布 | 409, {code:409, message=该教程状态已变化，请刷新}，status 保持 published | — |

**前置条件**：
1. operator/admin token 已获取
1. 存在一篇必填齐全的纯草稿教程

**清理策略**：
- 无新增残留（数据随 POST /api/system/reset 恢复种子态）

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-REVIEW-002: 驳回-修改-重提循环（驳回原因双重校验，回草稿后重提）

覆盖AC: AC-FN-09

- 流程类型：异常中断
- 涉及写操作：提交审核/审核驳回/编辑教程/重新提审
- 状态转换：草稿 → 待审核 →（驳回）草稿 → 待审核 → 已发布

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-REVIEW-002-S01 | 准备数据：新建必填齐全草稿并提审 | POST /api/tutorials; POST /api/tutorials/:id/submit | 必填齐全 | 提审成功进入审核队列 | 200, {data.status=pending} | tutorialId → S02~S06 |
| S02 | FLOW-REVIEW-002-S02 | 管理员驳回且原因 <5 字提交 | POST /api/tutorials/:id/review | action=reject, reason=太短（4 字） | 前端阻断提交并提示“请填写至少 5 个字的驳回原因” | 400, {code:400, message=请填写至少 5 个字的驳回原因}，状态保持 pending（AC-RULE-19：必填≥5 字，前端阻断+后端校验双重校验） | — |
| S03 | FLOW-REVIEW-002-S03 | 管理员原因补足 ≥5 字后驳回成功 | POST /api/tutorials/:id/review | action=reject, reason=正文步骤缺少截图说明，请补充后重提 | 驳回成功：教程回草稿，运营编辑页顶部展示驳回原因 | 200, {data.status=draft, data.rejectReason=提交的原因原文} | rejectReason → S04 |
| S04 | FLOW-REVIEW-002-S04 | 后台列表驳回原因列验证 | GET /api/tutorials?all=1&status=draft | operator/admin 登录态 | 后台教程列表展示驳回原因列（草稿且被驳回过时非空） | 200, {list 中 tutorialId 的 rejectReason=S03 原文} | — |
| S05 | FLOW-REVIEW-002-S05 | 运营编辑修改内容后重新提审 | PUT /api/tutorials/:id; POST /api/tutorials/:id/submit | 修改 content 后 submit | 重新提审成功，submitCount 累计 +1（审核队列出现“修改版 v2+”标识） | 200, {data.status=pending, submitCount=2} | — |
| S06 | FLOW-REVIEW-002-S06 | 管理员再次审核通过 | POST /api/tutorials/:id/review | action=approve | 过审发布，前台可见 | 200, {data.status=published} | — |

**前置条件**：
1. operator/admin token 已获取
1. 存在必填齐全纯草稿（FLOW测试_${Date.now()} 前缀）

**清理策略**：
- 已发布教程不可删除，套件收尾 POST /api/system/reset 恢复种子态

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-REVIEW-003: 待审核撤回流程（运营点击撤回→回草稿→修改→重新提审）

覆盖AC: AC-OP-07

- 流程类型：状态流转
- 涉及写操作：提交审核/撤回/编辑教程/重新提审
- 状态转换：草稿 → 待审核 →（撤回）草稿 → 待审核 → 已发布

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-REVIEW-003-S01 | 准备数据：新建草稿并提审（运营本人提交） | POST /api/tutorials; POST /api/tutorials/:id/submit | 必填齐全 | 教程进入待审核，出现在审核队列 | 200, {data.status=pending} | tutorialId → S02~S06 |
| S02 | FLOW-REVIEW-003-S02 | 运营点击撤回 | POST /api/tutorials/:id/withdraw | tutorialId | 教程回草稿，审核队列中该条目移除；可继续编辑后重新提审 | 200, {data.status=draft}（AC-RULE-05 合法迁移集：待审核→草稿-撤回） | — |
| S03 | FLOW-REVIEW-003-S03 | 审核队列移除验证 | GET /api/tutorials?status=pending | status=pending | 队列中不再出现该教程 | 200, {list 不含 tutorialId} | — |
| S04 | FLOW-REVIEW-003-S04 | 撤回后继续编辑并重新提审 | PUT /api/tutorials/:id; POST /api/tutorials/:id/submit | 修改 content 后 submit | 编辑保存成功后重新提审进入待审核 | PUT 200 {status=draft}; submit 200 {status=pending, submitCount=2} | — |
| S05 | FLOW-REVIEW-003-S05 | 管理员审核通过 | POST /api/tutorials/:id/review | action=approve | 过审发布 | 200, {data.status=published} | — |
| S06 | FLOW-REVIEW-003-S06 | 边界：已发布教程回审后再撤回，前台旧版不断供 | PUT /api/tutorials/:id; POST /api/tutorials/:id/withdraw | 对已发布教程编辑保存（自动回审 pending）后 withdraw | 若该教程存在线上过审版本且回审来源为已发布态，前台继续展示该版本不断供 | withdraw 200 {status=draft}；GET /api/tutorials/:id 公开口径 200 且 content=线上过审版本快照（AC-OP-07 不断供断言） | — |

**前置条件**：
1. operator/admin token 已获取
1. 存在必填齐全纯草稿

**清理策略**：
- 已发布教程不可删除，套件收尾 POST /api/system/reset 恢复种子态

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-REVIEW-004: 审核与撤回并发互斥——后到动作失效（双时序）

覆盖AC: AC-EG-04

- 流程类型：异常中断
- 涉及写操作：提交审核/撤回/审核通过
- 状态转换：时序A：待审核→（撤回先到）草稿，审核后到失效；时序B：待审核→（通过先到）已发布，撤回后到失效

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-REVIEW-004-S01 | 时序A数据准备：教程A 提审 | POST /api/tutorials/:id/submit | 教程A submit | 进入待审核 | 200, {status=pending} | 教程A id → S02~S04 |
| S02 | FLOW-REVIEW-004-S02 | 时序A：运营点击撤回（先到动作） | POST /api/tutorials/:id/withdraw | 教程A withdraw | 教程A 回草稿 | 200, {status=draft} | — |
| S03 | FLOW-REVIEW-004-S03 | 时序A：一方执行通过，另一方随后执行撤回——审核后到 | POST /api/tutorials/:id/review | 教程A, action=approve | 后到动作失效并提示“该教程状态已变化，请刷新”；教程状态仅按先到动作流转（保持草稿，管理员的审核动作不生效） | 409, {code=409, message=该教程状态已变化，请刷新}，status=draft | — |
| S04 | FLOW-REVIEW-004-S04 | 刷新页面后按新状态提供操作 | GET /api/tutorials/:id?all=1 | 教程A 管理口径 | 刷新后按新状态（草稿）提供操作，管理员侧无通过/驳回操作入口 | 200, {status=draft} | — |
| S05 | FLOW-REVIEW-004-S05 | 时序B数据准备：教程B 提审 | POST /api/tutorials/:id/submit | 教程B submit | 进入待审核 | 200, {status=pending} | 教程B id → S06~S07 |
| S06 | FLOW-REVIEW-004-S06 | 时序B：管理员通过先到 | POST /api/tutorials/:id/review | 教程B, action=approve | 教程B 变已发布 | 200, {status=published} | — |
| S07 | FLOW-REVIEW-004-S07 | 时序B：运营撤回后到 | POST /api/tutorials/:id/withdraw | 教程B withdraw | 后到动作失效并提示“该教程状态已变化，请刷新”；状态保持已发布 | 409, {code=409, message=该教程状态已变化，请刷新}，status=published | — |

**前置条件**：
1. operator/admin token 已获取
1. 准备两篇必填齐全纯草稿（教程A、教程B）

**清理策略**：
- 教程A 为纯草稿可 DELETE /api/tutorials/:id 清理；教程B 已发布随 POST /api/system/reset 恢复

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-EDIT-005: 已发布教程编辑保存回审，前台旧版 v1 不断供，过审后新版替换（v1→v2）

覆盖AC: AC-FN-10

- 流程类型：状态流转
- 涉及写操作：编辑教程/保存（自动回审）/审核通过
- 状态转换：已发布 →（编辑保存回审）待审核 →（通过）已发布（新版替换）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-EDIT-005-S01 | 读取已发布教程当前线上版本 v1 基准 | GET /api/tutorials/:id | tutorialId（公开口径） | 详情页正文展示线上过审版本 v1 | 200, content=published_content（含 v1 标记） | v1 标记与 updatedAt → S02 |
| S02 | FLOW-EDIT-005-S02 | 运营加载编辑器（管理口径）取乐观锁基准 | GET /api/tutorials/:id?all=1 | tutorialId, all=1（operator） | 编辑器展示当前编辑值与线上版一致的 v1 内容 | 200, content=当前编辑值, updatedAt=<baseUpdatedAt> | baseUpdatedAt → S03 |
| S03 | FLOW-EDIT-005-S03 | 运营编辑该教程并保存（任何保存即回审，不提供保存为草稿语义） | PUT /api/tutorials/:id | tutorialId, content=<v2 标记新正文>, summary=<新摘要>, baseUpdatedAt | 保存成功，教程状态回待审核并进入审核队列（队列出现修改版 v2+ 标识） | 200, {data.status=pending}（AC-RULE-05 已发布→待审核-编辑保存回审）；published_content 快照列不变 | — |
| S04 | FLOW-EDIT-005-S04 | 回审等待期间前台持续展示旧版本 v1 | GET /api/tutorials/:id; GET /api/tutorials?keyword=<T 标题关键词> | tutorialId（公开口径） | 前台正文内容不变（仍 v1），列表与搜索持续可命中该教程 | 公开详情 200, content=v1（快照未替换）；keyword 搜索 list 含 tutorialId（AC-RULE-02 回审期间旧版继续展示） | — |
| S05 | FLOW-EDIT-005-S05 | 管理员点击通过（新版过审） | POST /api/tutorials/:id/review | tutorialId, action=approve | 过审后前台替换为新版本 | 200, {data.status=published, publishedAt 刷新}（content/summary 拷贝至 published_content 快照） | — |
| S06 | FLOW-EDIT-005-S06 | 前台新版替换验证 | GET /api/tutorials/:id | tutorialId（公开口径） | 详情页正文展示 v2 新版内容 | 200, content=<v2 标记>（快照已替换） | — |

**前置条件**：
1. operator/admin token 已获取
1. 存在一篇已发布教程 T 且记录其线上过审版本正文 v1 标记（可用 FLOW-REVIEW-001 产物或种子教程）

**清理策略**：
- 教程保持已发布，随 POST /api/system/reset 恢复种子态

**version**: v1
**lastUpdatedBy**: case-designer

### FLOW-EDIT-005-E01: 已发布教程回审版被驳回——编辑版回草稿，线上 v1 持续在线（异常中断）

覆盖AC: AC-FN-19, AC-EG-15

- 流程类型：异常中断
- 涉及写操作：编辑教程/审核驳回
- 状态转换：已发布 →（编辑保存回审）待审核 →（驳回）草稿（仅编辑版回草稿，线上 v1 不下线）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-EDIT-005-E01-S01 | 运营编辑已发布教程生成回审版 v2 | PUT /api/tutorials/:id | tutorialId, content=<v2 标记>, baseUpdatedAt=<加载值> | 保存成功进入待审核，前台正在展示版本 v1 | 200, {data.status=pending} | — |
| S02 | FLOW-EDIT-005-E01-S02 | 管理员驳回该回审版（原因 ≥5 字） | POST /api/tutorials/:id/review | tutorialId, action=reject, reason=截图与最新界面不一致，请更新后重提 | 编辑版回草稿且编辑页顶部展示驳回原因 | 200, {data.status=draft, rejectReason=原因原文}（仅编辑版回草稿） | — |
| S03 | FLOW-EDIT-005-E01-S03 | 前台/小程序/搜索继续展示并命中线上过审版本 v1 | GET /api/tutorials/:id; GET /api/tutorials?keyword=<T 标题关键词> | tutorialId（公开口径） | 前台与小程序正文内容不变（v1），列表与搜索持续可命中该教程 | 公开详情 200, content=v1（正文内容不变）；keyword 搜索 list 含 tutorialId（断言同 AC-FN-19，异常视角复验） | — |
| S04 | FLOW-EDIT-005-E01-S04 | 运营侧驳回原因可见性验证 | GET /api/tutorials/:id?all=1 | tutorialId（operator） | 编辑页顶部展示驳回原因，可修改后重新提审 | 200, rejectReason 非空且=S02 原文 | — |

**前置条件**：
1. operator/admin token 已获取
1. 存在一篇已发布教程 T（线上版本 v1）

**清理策略**：
- 教程保持已发布（线上 v1），随 POST /api/system/reset 恢复种子态

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-EDIT-006: 两名运营并发编辑同一篇教程——乐观锁后保存者收到覆盖告知（边界）

覆盖AC: AC-EG-05

- 流程类型：异常中断
- 涉及写操作：编辑教程/保存
- 状态转换：状态不变（保存冲突拦截）：已发布/草稿 → 保持原状态

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-EDIT-006-S01 | 两会话同时加载编辑器取得同一基准 | GET /api/tutorials/:id?all=1 | tutorialId（会话A与会话B 各取一次） | 两个编辑器均展示相同内容与更新时间 | 200, 两次响应 updatedAt 相同（=baseUpdatedAt） | baseUpdatedAt → S02/S03 |
| S02 | FLOW-EDIT-006-S02 | 前者（运营A）先保存 | PUT /api/tutorials/:id | content=<A 修改内容>, baseUpdatedAt=<加载基准> | 运营A 保存成功 | 200, {updatedAt 刷新为新值 T2}（草稿仍 draft / 已发布则回审 pending） | 新 updatedAt → S04 |
| S03 | FLOW-EDIT-006-S03 | 后者在前者保存之后再点保存（运营B，仍持旧基准） | PUT /api/tutorials/:id | content=<B 修改内容>, baseUpdatedAt=<旧加载基准> | 后保存者收到覆盖告知“他人已保存新版本，请刷新后合并”；刷新后可见前者保存的内容 | 409, {code=409, message=他人已保存新版本，请刷新后合并}，库中内容仍为 A 版本 | — |
| S04 | FLOW-EDIT-006-S04 | 运营B 刷新后合并重存 | GET /api/tutorials/:id?all=1; PUT /api/tutorials/:id | GET 取新 updatedAt 后以新基准 PUT B 内容 | 刷新对比后重存成功，可见 A 与 B 合并内容 | GET 200（含 A 内容与新 updatedAt）；PUT 200 {updatedAt 再次刷新} | — |

**前置条件**：
1. 两个 operator 会话 token（运营A、运营B，运营可编辑任意教程不受归属限制）
1. 目标教程 T 处于草稿或已发布态

**清理策略**：
- 草稿态目标教程可 DELETE 清理；否则随 POST /api/system/reset 恢复

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-OFFLINE-007: 下架-三端善后-重新发布 完整链路（收藏/直达/小程序善后 + 计数延续）

覆盖AC: AC-OP-03, AC-FN-11, AC-FN-20, AC-EG-10

- 流程类型：业务联动
- 涉及写操作：收藏/下架/重新发布
- 状态转换：已发布 →（下架）已下架 →（重新发布，内容未变不重审）已发布

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-OFFLINE-007-S01 | 准备用户行为数据：普通用户收藏教程 T | POST /api/favorites/:tutorialId | tutorialId（用户 token） | 收藏成功，按钮切换为已收藏态 | 200, {favorited=true, favCount=基准+1}（AC-RULE-09 当前有效收藏数） | favCount/viewCount 基准 → S07 |
| S02 | FLOW-OFFLINE-007-S02 | 管理员在教程列表点击下架（二次确认后调用下架接口） | POST /api/tutorials/:id/offline | tutorialId（admin token） | 二次确认后状态变为已下架，记录操作人与操作时间（留痕）；前台列表/搜索/推荐/小程序下一请求即不返回该教程 | 200, {data.status=offline, data.lastOfflineAt 非空}（AC-RULE-04 已下架：前台不可见） | — |
| S03 | FLOW-OFFLINE-007-S03 | 前台列表与搜索不可见验证 | GET /api/tutorials?keyword=<T 标题关键词>; GET /api/recommend | keyword=<T 唯一片段> | 前台与小程序列表、搜索、推荐位均不返回该教程 | keyword 搜索 list 不含 tutorialId；recommend 不含（下一请求即生效） | — |
| S04 | FLOW-OFFLINE-007-S04 | 用户直接访问详情 URL 善后 | GET /api/tutorials/:id | tutorialId（公开口径） | 详情页提示“该教程已下架”并展示同分类已发布教程推荐，正文不可见 | 404, {code=404, message=该教程已下架, data.reason=offline, data.related 同分类推荐非空} | — |
| S05 | FLOW-OFFLINE-007-S05 | 收藏夹善后（浏览历史同规则） | GET /api/favorites; GET /api/histories | 用户 token | 收藏列表中该教程灰显并标注“已下架”，不可进入正文；浏览历史条目同样标注 | 200, {list 含 tutorialId, isOffline=true}（历史条目保留并标注已下架） | — |
| S06 | FLOW-OFFLINE-007-S06 | 小程序扫码打开善后（H5 与 PC 同数据源） | GET /api/tutorials/:id | tutorialId（模拟小程序请求） | 小程序打开显示已下架提示页，正文不可见 | 404, {code=404, message=该教程已下架}（同接口同结果，AC-FN-20 小程序分支） | — |
| S07 | FLOW-OFFLINE-007-S07 | 管理员点重新发布（内容未变不重审） | POST /api/tutorials/:id/republish | tutorialId（admin token） | 一键恢复已发布：不进入审核队列、无待审核中间态；前台下一次请求即返回该教程；浏览/收藏计数沿用下架前数值 | 200, {data.status=published, viewCount/favCount=S01 后基准（延续不重置）}（AC-RULE-05 已下架→已发布-重新发布） | — |
| S08 | FLOW-OFFLINE-007-S08 | 取消收藏善后边界：已下架教程的收藏可取消 | DELETE /api/favorites/:tutorialId | tutorialId（用户 token，验证于 S02 下架后执行） | 已下架条目从收藏列表移除 | 200, {favorited=false, favCount-1}（取消收藏不限制教程可见性） | — |

**前置条件**：
1. admin token、普通用户 token（role-login）已获取
1. 存在一篇已发布教程 T（FLOW测试_${Date.now()} 前缀或种子教程），记录下架前 viewCount/favCount 基准

**清理策略**：
- 教程恢复已发布，随 POST /api/system/reset 恢复种子态；用户收藏关系随重置清除

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-OFFLINE-008: 已下架教程编辑保存回审——内容已变需重审，过审前维持不可见（异常中断）

覆盖AC: AC-EG-18

- 流程类型：状态流转
- 涉及写操作：下架/编辑教程/审核通过
- 状态转换：已下架 →（编辑保存回审）待审核 →（通过）已发布（恢复可见）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-OFFLINE-008-S01 | 准备已下架教程 O | POST /api/tutorials/:id/offline | 对已发布教程执行 offline（admin） | 教程已下架，前台不可见 | 200, {data.status=offline} | — |
| S02 | FLOW-OFFLINE-008-S02 | 运营编辑该教程并保存 | PUT /api/tutorials/:id | tutorialId, content=<新内容>, baseUpdatedAt=<加载值> | 教程进入待审核状态并出现在审核队列 | 200, {data.status=pending}（AC-RULE-05 已下架→待审核-编辑保存回审）；GET status=pending 队列含 tutorialId | — |
| S03 | FLOW-OFFLINE-008-S03 | 回审期间前台保持不可见（防止下架被编辑动作意外解除） | GET /api/tutorials/:id | tutorialId（公开口径） | 前台保持不可见；收藏/历史条目维持“已下架”标注 | 404（已下架且回审来源为已下架态维持不可见，AC-RULE-02 规则④） | — |
| S04 | FLOW-OFFLINE-008-S04 | 管理员审核通过 | POST /api/tutorials/:id/review | tutorialId, action=approve | 过审后恢复可见（新版上线） | 200, {data.status=published} | — |
| S05 | FLOW-OFFLINE-008-S05 | 恢复可见验证（区别于内容未变的一键重新发布） | GET /api/tutorials/:id | tutorialId（公开口径） | 前台详情正常展示新版内容 | 200, content=<新内容>（本流程经过审核队列，区别于 FLOW-OFFLINE-007 的 republish 直达） | — |

**前置条件**：
1. operator/admin token 已获取
1. 存在一篇已下架教程（FLOW-OFFLINE-007 中间态或独立构造：发布→下架）

**清理策略**：
- 教程保持已发布，随 POST /api/system/reset 恢复种子态

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-STATE-009: 状态机非法迁移后端拒绝（草稿直达发布、已下架未编辑直达提审）

覆盖AC: AC-EG-09

- 流程类型：异常中断
- 涉及写操作：（非法）发布/（非法）提审
- 状态转换：草稿 →（拒绝）草稿；已下架 →（拒绝）已下架

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-STATE-009-S01 | 绕过前端直接调用发布接口（草稿→已发布） | POST /api/tutorials/:id/review | 教程D, action=approve（admin，D 为 draft 态） | 后端拒绝该非法状态迁移，教程状态保持草稿不变；后台列表状态显示不变 | 409, {code=409, message=该教程状态已变化，请刷新}，GET ?all=1 验证 status=draft | — |
| S02 | FLOW-STATE-009-S02 | 已下架态未编辑直接调用提审接口 | POST /api/tutorials/:id/submit | 教程O（offline 态 submit） | 同类非法迁移同样被拒绝；合法路径为编辑保存自动回审（见 FLOW-OFFLINE-008） | 409, {code=409, message=该教程状态已变化，请刷新}，status=offline | — |
| S03 | FLOW-STATE-009-S03 | 其他非法迁移抽验：已发布态再次提审 / 草稿态调用下架接口 | POST /api/tutorials/:id/submit; POST /api/tutorials/:id/offline | 已发布教程 submit；草稿教程 offline | 均被后端拒绝（AC-RULE-05 合法迁移集之外的迁移一律拒绝） | 409, {code=409, message=该教程状态已变化，请刷新}，状态均保持不变 | — |

**前置条件**：
1. operator/admin token 已获取
1. 纯草稿教程 D（必填齐）、已下架教程 O（构造：发布→下架）

**清理策略**：
- 纯草稿 D 可 DELETE 清理；O 已下架随 POST /api/system/reset 恢复

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-DEL-010: 复制教程-计数清零-新草稿编辑删除 完整 CRUD（含删除保护）

覆盖AC: AC-FN-12, AC-OP-06

- 流程类型：CRUD 完整流程
- 涉及写操作：复制教程/编辑教程/删除教程
- 状态转换：任意状态源 →（复制）草稿 →（删除）终止（仅纯草稿可删）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-DEL-010-S01 | 准备源教程计数：用户浏览、收藏并评价“有帮助” | GET /api/tutorials/:id; POST /api/favorites/:tutorialId; POST /api/feedbacks/:tutorialId | viewCount+1, favCount+1, helpful=1 | 详情打开、收藏、评价成功 | 三接口均 200；GET :id 记录 viewCount/favCount/helpfulYes 基准 ≥1 | 源计数基准 → S03 |
| S02 | FLOW-DEL-010-S02 | 运营点复制 | POST /api/tutorials/:id/copy | tutorialId（源任意状态，operator token） | 生成新草稿：标题=源标题+“（副本）”，源教程状态与计数不变 | 200, {data.id=新ID, data.status=draft, viewCount/favCount/helpfulYes/helpfulNo/shareCount 全 0}（AC-RULE-14：新草稿标题加“（副本）”、分享数一并清零、计数清零） | copyId → S03~S05 |
| S03 | FLOW-DEL-010-S03 | 副本纯草稿属性与源不变验证 | GET /api/tutorials?all=1 | all=1（operator） | 后台列表出现副本（状态草稿），源教程计数不变 | 副本 hasOnlineVersion=false（无线上过审版本）；源教程计数=S01 基准 | — |
| S04 | FLOW-DEL-010-S04 | 对副本点击删除（二次确认后调用删除接口） | DELETE /api/tutorials/:id | copyId（operator，本人名下纯草稿） | 弹出二次确认；确认后教程从后台列表移除，前台无影响（纯草稿本就不可见）；取消则不删除 | 200, {code=0, message=已删除}；GET ?all=1 不含 copyId | — |
| S05 | FLOW-DEL-010-S05 | 删除保护：存在线上过审版本的教程不可删（对源教程 T 点击删除） | DELETE /api/tutorials/:id | tutorialId（源 T，published 态） | 不提供删除入口（存在线上过审版本一律不可删，以下架归档代替）；确认弹窗不出现 | 403, {code=403, message=存在线上过审版本的教程不可删除，请以下架归档代替}；GET ?all=1 仍含 T | — |

**前置条件**：
1. operator token、普通用户 token 已获取
1. 存在已发布教程 T 并产生计数（浏览/收藏/评价）

**清理策略**：
- 源教程保持已发布随 POST /api/system/reset 恢复；用户收藏/评价随重置清除

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-DEL-011: 运营越权删除他人名下草稿被拒（403，教程仍存在）

覆盖AC: AC-EG-08

- 流程类型：异常中断
- 涉及写操作：（越权）删除教程
- 状态转换：状态不变（草稿保持）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-DEL-011-S01 | 构造他人名下草稿（admin 创建） | POST /api/tutorials | title=FLOW测试_${Date.now()}_他人草稿, 必填齐（admin token，作者=admin） | 草稿创建成功，作者为 admin | 200, {data.status=draft, 作者=admin} | draftId → S02 |
| S02 | FLOW-DEL-011-S02 | 当前运营尝试删除该教程 | DELETE /api/tutorials/:id | draftId（operator token，非本人名下） | 删除请求被拒绝，提示“无权限执行该操作”；教程在列表中仍存在 | 403, {code=403, message=无权限执行该操作}；GET ?all=1 仍含 draftId（AC-RULE-23：删除仅限本人名下纯草稿） | — |
| S03 | FLOW-DEL-011-S03 | 权限对照：admin 删除任意纯草稿放行 | DELETE /api/tutorials/:id | draftId（admin token） | admin 删除成功（对照验证权限差异） | 200, {code=0, message=已删除} | — |

**前置条件**：
1. operator token 已获取
1. 存在其他运营/admin 名下的纯草稿教程 D

**清理策略**：
- S03 已删除目标；无残留

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-PERM-012: 运营越权调用审核/发布/分类管理/重置接口全量 403 + 后台未登录访问 401

覆盖AC: AC-FN-18, AC-EG-06

- 流程类型：异常中断
- 涉及写操作：（越权）审核/（越权）下架/（越权）分类管理/（越权）种子重置
- 状态转换：状态不变（所有目标实体状态均不变化）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-PERM-012-S01 | 运营角色调用审核通过/驳回接口 | POST /api/tutorials/:id/review | 待审核教程, action=approve / action=reject（operator token） | 接口返回 403，提示“无权限执行该操作”；教程状态不发生变化 | 403, {code=403, message=无权限执行该操作}；GET ?all=1 状态仍 pending（AC-FN-18） | — |
| S02 | FLOW-PERM-012-S02 | 运营调用下架/重新发布接口 | POST /api/tutorials/:id/offline; POST /api/tutorials/:id/republish | 已发布/已下架教程（operator token） | 两接口均 403，状态不变 | 403, {code=403}×2；状态分别保持 published/offline | — |
| S03 | FLOW-PERM-012-S03 | 运营调用分类管理接口 | POST /api/categories; PUT /api/categories/:id; DELETE /api/categories/:id | name=FLOW测试_${Date.now()}（operator token） | 新增/编辑/删除分类均 403（分类树管理为管理员专属） | 403, {code=403}×3 | — |
| S04 | FLOW-PERM-012-S04 | 运营调用种子重置接口 | POST /api/system/reset | operator token | 403 拒绝，数据不受影响 | 403, {code=403} | — |
| S05 | FLOW-PERM-012-S05 | 后台未登录（无后台会话）直接调用管理接口 | GET /api/tutorials?all=1（无 Authorization） | 无 token | 跳转后台登录页，不展示任何后台数据；登录成功后进入后台 | 401, {code=401, message=未登录或登录已失效}（AC-EG-06 API 面） | — |
| S06 | FLOW-PERM-012-S06 | 管理参数权限分层：user 角色使用管理参数 | GET /api/tutorials?all=1; GET /api/categories?all=1 | 普通用户 token + all=1 | 普通用户无法访问管理口径 | 403, {code=403, message=无权限执行该操作}（admin/operator 之外拒绝） | — |

**前置条件**：
1. operator token 已获取
1. 存在待审核教程与已发布教程各 1 篇（状态基准已记录）

**清理策略**：
- 无数据变更（全部被拒）；无需清理

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-CAT-014: 分类生命周期 CRUD：新增一级分类-教程归属-删除保护-移走后删除

覆盖AC: AC-OP-08, AC-FN-13

- 流程类型：CRUD 完整流程
- 涉及写操作：新增分类/创建教程（归属）/删除教程/删除分类
- 状态转换：新增 → 启用（新增即启用）→（删除保护阻断）→ 移走教程后删除成功

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-CAT-014-S01 | 管理员新增一级分类并保存 | POST /api/categories | name=FLOW测试_${Date.now()}_流程分类, parentId=null, sort=99, erpModule=null（admin token） | 后台分类树出现该节点；前台分类宫格与筛选树可见该分类，角标显示“待补充”（0 篇教程）；该分类可被教程选择为归属 | 200, {code=0, data.status=enabled}（AC-RULE-06 启用：前台宫格与筛选树可见） | categoryId → S03~S06 |
| S02 | FLOW-CAT-014-S02 | 前台宫格与角标验证 | GET /api/categories?withCount=1 | withCount=1（公开口径） | 分类宫格展示新分类，角标“待补充” | 200, {list 含新分类, tutorialCount=0} | — |
| S03 | FLOW-CAT-014-S03 | 创建教程归入该分类 | POST /api/tutorials | title=FLOW测试_${Date.now()}_分类归属, categoryId=<新分类ID>, 必填齐（admin/operator） | 教程创建为草稿并归属新分类 | 200, {data.status=draft} | tutorialId → S05 |
| S04 | FLOW-CAT-014-S04 | 管理员删除该分类（分类下存在 N 篇教程，含任意状态） | DELETE /api/categories/:id | categoryId（admin token） | 阻断删除，提示“该分类下还有 1 篇教程，请先移走”；分类树中该分类仍存在 | 409, {code=409, message=该分类下还有 1 篇教程，请先移走}；GET ?all=1 分类仍存在（AC-FN-13） | — |
| S05 | FLOW-CAT-014-S05 | 移走教程（删除纯草稿）后重试删除 | DELETE /api/tutorials/:id; DELETE /api/categories/:id | 先删教程草稿再删分类 | 移动教程后重试删除成功，分类树移除该节点 | DELETE 教程 200；DELETE 分类 200 {code=0, message=已删除}；GET /api/categories 不含该分类 | — |
| S06 | FLOW-CAT-014-S06 | 边界：新增二级子分类同规则保存成功，但不进入首页宫格 | POST /api/categories; GET /api/categories | name=<二级分类>, parentId=<一级分类ID> | 二级子分类仅出现在筛选树，不进入首页宫格 | POST 200 {status=enabled}；GET withCount=1 一级宫格数组不含二级节点（children 内返回） | — |

**前置条件**：
1. admin token 已获取
1. 测试分类名前缀：FLOW测试_${Date.now()}

**清理策略**：
- S05 已删除教程与分类；S06 二级分类用 DELETE /api/categories/:id 清理

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-CAT-015: 分类模块映射维护与停用/启用联动（角色推荐命中集、搜索口径、收藏直达可达）

覆盖AC: AC-OP-04, AC-OP-09, AC-EG-14, AC-FN-17

- 流程类型：业务联动
- 涉及写操作：修改模块映射/停用分类/启用分类
- 状态转换：启用 →（停用）停用 →（启用）启用

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-CAT-015-S01 | 构造数据：新增分类 C（映射 sales）并发布教程 T | POST /api/categories; POST /api/tutorials; POST /api/tutorials/:id/submit; POST /api/tutorials/:id/review | name=FLOW测试_${Date.now()}_映射分类, erpModule=sales；教程提审后 admin 通过 | 分类与已发布教程就绪，前台可见 | 分类 200 {status=enabled}；教程 review 200 {status=published} | categoryId/tutorialId → S02~S09 |
| S02 | FLOW-CAT-015-S02 | 管理员进入目录管理修改某分类绑定的 ERP 模块并保存 | PUT /api/categories/:id | categoryId, erpModule=purchase（admin token） | 保存成功，刷新后列表展示新映射；角色推荐位与 ERP 内嵌入口按新映射在下次加载时生效 | 200, {data.erpModule=purchase, updatedAt 刷新}（AC-OP-04） | — |
| S03 | FLOW-CAT-015-S03 | 采购角色推荐位按新映射命中验证 | GET /api/recommend | purchase 用户 token | 推荐位命中集包含映射分类 C 下教程 T（采购角色映射采购/库存模块） | 200, {list 含 tutorialId，命中集内已发布教程按浏览量 Top6 排序}（AC-FN-17；AC-RULE-16 角色推荐口径） | — |
| S04 | FLOW-CAT-015-S04 | 用户收藏教程 T（为停用后直达可达验证做准备） | POST /api/favorites/:tutorialId | tutorialId（用户 token） | 收藏成功 | 200, {favorited=true, favCount+1} | — |
| S05 | FLOW-CAT-015-S05 | 管理员停用该分类 | PUT /api/categories/:id | categoryId, status=disabled（admin token） | 前台分类宫格与列表筛选树不再显示该分类 | 200, {data.status=disabled}（AC-RULE-07 停用：前台隐藏） | — |
| S06 | FLOW-CAT-015-S06 | 停用后前台口径验证：宫格/筛选树隐藏 | GET /api/categories?withCount=1 | 公开口径 | 前台宫格与筛选树不再显示该分类 | 200, {list 不含分类 C} | — |
| S07 | FLOW-CAT-015-S07 | 停用后关键词搜索不返回该分类下教程 | GET /api/tutorials?keyword=<T 标题关键词> | keyword=<T 唯一片段> | 搜索结果不含该分类下教程（检索范围排除停用分类内容） | 200, {list 不含 tutorialId} | — |
| S08 | FLOW-CAT-015-S08 | 停用后推荐位命中集排除 + 收藏/历史/直达链接仍可达 | GET /api/recommend; GET /api/favorites; GET /api/tutorials/:id | purchase token；用户 token；公开口径 | 1) 角色推荐位不再包含该分类下教程；2) 收藏列表仍含 T 且可进入正文；3) 直达详情 URL 可访问正文 | recommend list 不含 tutorialId；favorites 含 T（isOffline=false）；GET :id 200 content 可见（AC-EG-14 第 3 点） | — |
| S09 | FLOW-CAT-015-S09 | 管理员启用该分类（停用逆向） | PUT /api/categories/:id; GET /api/categories; GET /api/tutorials?keyword=<T 唯一片段> | categoryId, status=enabled；恢复后复查 | 前台宫格、筛选树恢复显示；该分类下已发布教程恢复参与搜索命中与推荐命中集 | PUT 200 {status=enabled}；GET categories 含 C；keyword 搜索含 tutorialId；recommend 恢复命中（AC-OP-09） | — |

**前置条件**：
1. admin token、采购角色用户 token 已获取
1. 构造：新增测试分类 C（erpModule=sales）+ 教程 T 归入 C 并发布；用户在停用前收藏 T

**清理策略**：
- 教程已发布不可删，随 POST /api/system/reset 恢复种子态（分类与教程一并重建）

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-LEARN-016: 用户学习互动-数据回流看板 端到端闭环（浏览/进度/收藏/评价/分享→统计）

覆盖AC: AC-FN-04, AC-FN-05, AC-FN-06, AC-FN-14, AC-FN-23

- 流程类型：端到端链路
- 涉及写操作：收藏/评价/取消/切换评价/分享/保存阅读进度
- 状态转换：—（行为数据累积，实体状态不变）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-LEARN-016-S01 | 选角色快速登录（采购） | POST /api/auth/role-login | erpRole=purchase | 登录成功进入前台/小程序（选角色快速登录 6 个演示账号） | 200, {data.user.role=user, data.user.erpRole=purchase, token 非空}（AC-RULE-26 前台登录方式） | userToken → S02~S09 |
| S02 | FLOW-LEARN-016-S02 | 打开教程详情页 | GET /api/tutorials/:id | tutorialId（userToken） | 详情页正常展示，浏览量 +1 | 200, viewCount=基准+1（AC-RULE-08 浏览量=打开详情页次数，不去重） | viewCount → S10 |
| S03 | FLOW-LEARN-016-S03 | 阅读并滚动到 60% 后离开（保存阅读进度） | POST /api/histories/:tutorialId | progress=60（userToken） | 进度保存成功，阅读过程无报错 | 200, {data.progress=60}（AC-RULE-11：同一用户同一教程仅一条记录，覆盖更新；0~100 整数） | — |
| S04 | FLOW-LEARN-016-S04 | 再次进入该详情页（继续阅读提示） | GET /api/tutorials/:id | tutorialId（userToken） | 再次进入弹出“继续阅读”提示且显示进度 60% | 200, {data.myProgress=60}（AC-FN-04 PC 端断言） | — |
| S05 | FLOW-LEARN-016-S05 | 小程序同账号打开同篇教程（跨端进度同步） | GET /api/tutorials/:id | tutorialId（userToken，模拟小程序端请求） | 小程序端同账号打开同篇教程显示进度 60% | 200, {data.myProgress=60}（跨端取最新值，AC-FN-04 小程序分支） | — |
| S06 | FLOW-LEARN-016-S06 | 点击收藏 | POST /api/favorites/:tutorialId | tutorialId（userToken） | 收藏成功：收藏计数 +1，按钮切换为已收藏态 | 200, {favorited=true, favCount=基准+1}（AC-RULE-09 当前有效收藏数） | favCount → S10 |
| S07 | FLOW-LEARN-016-S07 | 提交“有帮助”评价 | POST /api/feedbacks/:tutorialId | helpful=1（userToken） | 评价成功，“有帮助”按钮选中高亮 | 200, {helpfulYes=基准+1, helpfulNo=基准} | — |
| S08 | FLOW-LEARN-016-S08 | 改点“没帮助”（评价切换 + 留言） | POST /api/feedbacks/:tutorialId | helpful=0, comment=步骤三的截图和实际界面不一致，按说明找不到入口（≤200 字） | 评价切换成功：“有帮助”数 -1、“没帮助”数 +1，该用户该篇仅保留一条反馈记录；“没帮助”按钮呈选中高亮，留言框展开 | 200, {helpful=0, helpfulYes 回落, helpfulNo=基准+1}（AC-RULE-15：每篇每人仅一条反馈记录可修改切换；AC-RULE-20：留言选填≤200 字仅后台可见） | helpfulNo → S10 |
| S09 | FLOW-LEARN-016-S09 | 点击分享 | POST /api/tutorials/:id/share | tutorialId（userToken） | 展示“复制链接”按钮与二维码弹窗；复制到剪贴板的链接可打开该教程；二维码内容为该教程的小程序端 URL | 200, shareCount+1（分享数数据留存，看板不展示该指标） | — |
| S10 | FLOW-LEARN-016-S10 | 管理员打开统计看板（数据回流验证） | GET /api/stats/overview; GET /api/stats/feedback; GET /api/stats/coverage | admin token | 总览 4 指标卡、反馈分析、覆盖度矩阵按口径正确展示（浏览/收藏/评价数据回流） | overview 200：总浏览量含 S02 计数、总收藏量=S06 后有效值、平均有帮助率=有帮助÷(有帮助+没帮助)（零反馈显示“—”且不计入，AC-RULE-10）；feedback 200：按没帮助占比倒序、>50% 标红、留言明细可见；coverage 200：已启用分类×已发布教程数矩阵，0 篇分类标“空白区”（AC-FN-14；覆盖度按前台可见口径） | — |
| S11 | FLOW-LEARN-016-S11 | 浏览历史验证 | GET /api/histories | userToken | 打开“我的-浏览历史”：列表按最近阅读时间倒序，每条显示阅读进度百分比 | 200, {list 含 tutorialId, progress=60, 按最近阅读时间倒序}（AC-FN-23） | — |

**前置条件**：
1. 普通用户 token 已获取（role-login 采购）
1. 存在已发布教程 T（记录初始 viewCount/favCount/helpfulYes/helpfulNo 基准）
1. admin token 用于看板验证

**清理策略**：
- 用户行为数据随 POST /api/system/reset 清除；也可 DELETE /api/favorites/:tutorialId 还原收藏

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-CROSS-017: 跨端数据一致：收藏/阅读进度/评价 PC 与小程序同账号互通

覆盖AC: AC-FN-15, AC-FN-25

- 流程类型：端到端链路
- 涉及写操作：收藏/保存阅读进度/评价/切换评价
- 状态转换：—（行为数据跨端同步，实体状态不变）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-CROSS-017-S01 | 同账号选角色登录（两设备会话共用） | POST /api/auth/role-login | erpRole=purchase | PC 端与小程序端同账号登录（登录态本地保持） | 200, {token 非空, user.erpRole=purchase} | userToken → S02~S08 |
| S02 | FLOW-CROSS-017-S02 | PC 端收藏教程 T | POST /api/favorites/:tutorialId | tutorialId（userToken-PC 会话） | PC 端收藏成功 | 200, {favorited=true, favCount+1} | — |
| S03 | FLOW-CROSS-017-S03 | 小程序同账号打开收藏列表 | GET /api/favorites | userToken（小程序会话） | 教程 T 出现在小程序收藏列表中 | 200, {list 含 tutorialId}（任一端操作另一端刷新后可见，AC-FN-15 正向） | — |
| S04 | FLOW-CROSS-017-S04 | 反向：小程序端取消收藏后 PC 端刷新不可见 | DELETE /api/favorites/:tutorialId; GET /api/favorites | 先 DELETE（小程序会话）再 GET（PC 会话） | 小程序取消后，PC 端收藏列表刷新后不可见 | DELETE 200 {favorited=false}；PC GET list 不含 tutorialId（反向操作同样成立） | — |
| S05 | FLOW-CROSS-017-S05 | 小程序端更新阅读进度 80% | POST /api/histories/:tutorialId | progress=80（小程序会话） | 小程序阅读进度保存 | 200, {progress=80}（覆盖更新） | — |
| S06 | FLOW-CROSS-017-S06 | PC 端读取进度（跨端取最新值） | GET /api/tutorials/:id | tutorialId（PC 会话） | PC 端详情显示进度 80% | 200, {myProgress=80}（AC-RULE-11 跨端取最新值） | — |
| S07 | FLOW-CROSS-017-S07 | PC 端提交“有帮助”评价，小程序查看选中态 | POST /api/feedbacks/:tutorialId; GET /api/tutorials/:id | helpful=1（PC 会话）；GET（小程序会话） | 小程序同账号打开教程 T 详情页，评价按钮显示“有帮助”选中态 | POST 200；GET 200 {myFeedback=1}（与 PC 共用同一条评价记录，AC-FN-25） | — |
| S08 | FLOW-CROSS-017-S08 | 小程序改评“没帮助”，PC 端刷新同步 | POST /api/feedbacks/:tutorialId; GET /api/tutorials/:id | helpful=0（小程序会话）；GET（PC 会话） | 在小程序改评后，PC 端刷新即显示“没帮助”选中态 | POST 200 {helpfulNo+1}；GET 200 {myFeedback=0}（同一条评价记录跨端切换） | — |

**前置条件**：
1. 已发布教程 T 存在
1. 同一演示账号 token（PC 端与小程序端共用账号体系，两个会话模拟两设备）

**清理策略**：
- 评价与进度随 POST /api/system/reset 清除（或保留，属演示数据）

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-CHECKIN-018: 学习打卡积分与幂等——当日重复点击无效、徽章数据口径

覆盖AC: AC-FN-16

- 流程类型：业务联动
- 涉及写操作：打卡
- 状态转换：—（打卡记录与积分累积）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-CHECKIN-018-S01 | 小程序用户点击打卡 | POST /api/checkins | userToken | 打卡成功：当日积分 +10，打卡页更新积分与连续天数 | 200, {message=打卡成功, pointsAdded=10, duplicated=false, streak=昨日+1 或 1}（AC-RULE-12：每日打卡 1 次 +10 积分） | totalPoints/streak → S03 |
| S02 | FLOW-CHECKIN-018-S02 | 当日重复点击打卡 | POST /api/checkins | userToken（同日再次调用） | 当日重复点击打卡，积分不再增加（幂等提示“今日已打卡”） | 200, {message=今日已打卡, pointsAdded=0, duplicated=true, totalPoints 不变} | — |
| S03 | FLOW-CHECKIN-018-S03 | 打卡页与徽章墙数据验证 | GET /api/checkins | userToken | 打卡页显示积分/连续天数/本周日历；徽章墙按口径展示徽章 | 200, {totalPoints/streak/badges/weekCalendar}；坚持者徽章=连续 7 天打卡（persist）；百科达人=累计完成 20 篇教程（encyclopedia，完成=阅读进度 100%，completedTutorials 口径）；中断仅清连续天数不清积分 | — |

**前置条件**：
1. 小程序用户 token 已获取（role-login warehouse）
1. 当日未打卡（若已打卡则接受 duplicated=true 作为首次断言的替代基准）

**清理策略**：
- 打卡记录随 POST /api/system/reset 清除

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-DISC-019: 首页区块与推荐位取数口径（未登录全站 Top6 / 最近更新 / 热门 / 分类宫格 / 小程序同源搜索）

覆盖AC: AC-FN-22, AC-FN-24

- 流程类型：端到端链路
- 涉及写操作：（只读验证流程，取数口径对账）
- 状态转换：—（只读）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-DISC-019-S01 | 未登录打开前台首页查看推荐位 | GET /api/recommend | 无 token | 推荐位为全站前台可见教程浏览量 Top6；命中集不足 6 条时展示实际数量 | 200, {list 长度≤6, 按 viewCount 倒序, 全部为前台可见口径}（AC-RULE-16 未登录口径；AC-FN-22） | — |
| S02 | FLOW-DISC-019-S02 | “最近更新”区块取数验证 | GET /api/tutorials?sort=latest&pageSize=6 | sort=latest, pageSize=6（公开口径） | 最近更新按更新时间倒序 Top6 | 200, {list 按更新时间倒序，长度≤6}（AC-RULE-17 首页区块规则） | — |
| S03 | FLOW-DISC-019-S03 | “热门教程”区块取数验证 | GET /api/tutorials?sort=hot&pageSize=6 | sort=hot, pageSize=6（公开口径） | 热门教程按浏览量倒序 Top6 | 200, {list 按 viewCount 倒序，长度≤6} | — |
| S04 | FLOW-DISC-019-S04 | 分类宫格与角标验证 | GET /api/categories?withCount=1 | withCount=1（公开口径） | 分类宫格 12 个启用一级分类可达；角标=该分类前台可见教程数，0 篇显示“待补充” | 200, {一级分类 12 个（全部 enabled）, tutorialCount 按前台可见口径}（AC-RULE-17 分类宫格=12 个启用一级分类） | — |
| S05 | FLOW-DISC-019-S05 | 小程序端首页点击分类宫格并在列表页输入关键词搜索（同数据源） | GET /api/categories; GET /api/tutorials?keyword=<种子关键词> | 无 token（小程序 H5 同接口） | 小程序分类宫格 12 个启用分类可达，点击进入对应分类列表；关键词搜索命中规则与 PC 相同，1s 内返回 | 两接口 200 且与 PC 端结果一致（同数据源，AC-FN-24；性能口径 AC-NF-01 P95<1s 由脚本计时断言） | — |

**前置条件**：
1. 种子库就绪（存在多篇已发布教程，浏览量有差异）
1. 未登录（游客）态

**清理策略**：
- 只读流程，无数据残留

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-SEED-020: 种子初始化可重复执行与交付验收（重置脚本 + Playwright 全量执行）

覆盖AC: AC-OP-01, AC-OP-02

- 流程类型：端到端链路
- 涉及写操作：执行种子初始化脚本/全量执行验收套件
- 状态转换：—（系统级操作，数据重建）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-SEED-020-S01 | 管理员登录 | POST /api/auth/login | username=admin, password=123456 | 后台登录成功 | 200, {data.user.role=admin, token 非空} | adminToken → S02~S05 |
| S02 | FLOW-SEED-020-S02 | 管理员执行种子初始化脚本 | POST /api/system/reset | adminToken | 执行完成：启用一级分类 12 个、教程 24 篇（16~20 已发布）、演示账号齐备（6 个前台角色账号 + admin + 运营编辑账号均可登录） | 200, {data.categories=12, data.tutorials=24, data.users=8, data.messages=3, data.checkins=5}（AC-OP-01） | — |
| S03 | FLOW-SEED-020-S03 | 种子内容与账号就绪验证 | GET /api/categories; GET /api/tutorials; POST /api/auth/role-login; POST /api/auth/login | categories 与 tutorials 公开口径；role-login erpRole=sales；operator 登录 | 前台分类与教程非空；6 个演示账号与后台账号均可登录 | GET categories 200 {12 个启用一级分类}；GET tutorials 200 {total>=16}；role-login 200；operator 登录 200（重置后 auth_tokens 作废需重新登录） | — |
| S04 | FLOW-SEED-020-S04 | 重复执行第二遍不产生脏数据 | POST /api/system/reset | adminToken（第二次执行） | 重复执行后分类/教程/账号数量不增加（可重复执行不产生脏数据） | 200, {categories=12, tutorials=24, users=8}（数值与首遍完全一致） | — |
| S05 | FLOW-SEED-020-S05 | 前台三区块与看板非空验证 | GET /api/recommend; GET /api/tutorials?sort=latest; GET /api/stats/overview | 公开口径 + admin 看板 | 前台首页推荐位/最近更新/热门三个区块各显示 ≥1 条种子教程；统计看板 4 指标卡显示非空数值；浏览器控制台无错误 | recommend 200 {list>=1}；sort=latest 200 {list>=1}；overview 200 {4 指标非空}（AC-NF-06：种子数据可重复初始化，数据库单文件便于交付） | — |
| S06 | FLOW-SEED-020-S06 | 全量执行 Playwright 验收套件 | CLI: npx playwright test | 代码库交付完成、种子库就绪后全量执行 | 全部用例通过（通过率 100%，0 条失败）；生成的 HTML 报告包含 PC 前台/管理后台/小程序三端截图 | 退出码 0；报告含三端截图（AC-OP-02 交付验收） | — |

**前置条件**：
1. 全新数据库或运行中的服务（首次启动自动建库+种子）
1. admin 账号可登录

**清理策略**：
- 重置即恢复初始态，无额外清理

**version**: v1
**lastUpdatedBy**: case-designer

## FLOW-VISIT-013: 游客互动权限边界与登录后回原位收藏（未登录 401 引导→登录→收藏成功）

覆盖AC: AC-FN-03, AC-EG-07

- 流程类型：异常中断
- 涉及写操作：收藏/评价
- 状态转换：—（游客态触发登录引导，登录后行为数据写入）

| 步骤 | TC 编号 | 操作 | 接口 | 关键参数 | UI 预期结果 | API 预期响应 | 数据传递 |
|------|---------|------|------|---------|------------|-------------|---------|
| S01 | FLOW-VISIT-013-S01 | 游客打开前台可见教程详情页 | GET /api/tutorials/:id | tutorialId（无 token） | 游客可浏览：详情页正常展示正文 | 200, viewCount+1（含游客打开计入浏览量），myFavorite/myFeedback/myProgress=null（游客浏览不计历史与进度） | favCount 基准 → S05 |
| S02 | FLOW-VISIT-013-S02 | 游客点击“有帮助/没帮助”评价 | POST /api/feedbacks/:tutorialId | helpful=1（无 token） | 弹出选角色登录并提示“登录后即可收藏/评价”；登录后回到原页面且该次评价被记录 | 401, {code=401, message=未登录或登录已失效}（AC-EG-07 API 面） | — |
| S03 | FLOW-VISIT-013-S03 | 游客点击收藏 | POST /api/favorites/:tutorialId | tutorialId（无 token） | 弹出选角色登录，登录后回到原页面原位置继续操作 | 401, {code=401, message=未登录或登录已失效}（AC-RULE-25：游客互动触发登录引导） | — |
| S04 | FLOW-VISIT-013-S04 | 选角色快速登录（销售演示账号） | POST /api/auth/role-login | erpRole=sales | 登录成功（登录态本地保持），回到原页面原位置 | 200, {data.user.role=user, data.user.erpRole=sales, token 非空}（AC-RULE-26 前台登录方式） | userToken → S05~S06 |
| S05 | FLOW-VISIT-013-S05 | 登录后回到原页面原位置继续点击收藏 | POST /api/favorites/:tutorialId | tutorialId（userToken） | 收藏成功：收藏计数 +1，按钮切换为已收藏态 | 200, {favorited=true, favCount=基准+1}（AC-FN-03） | — |
| S06 | FLOW-VISIT-013-S06 | 登录后补交该次评价（回原位记录） | POST /api/feedbacks/:tutorialId | helpful=1（userToken） | 该次评价被记录，“有帮助”按钮选中高亮 | 200, {helpful=1, helpfulYes=基准+1}（AC-EG-07 登录后评价记录） | — |

**前置条件**：
1. 存在一篇已发布教程 T（记录 favCount 基准）
1. 游客态（无 token）

**清理策略**：
- 用户行为数据随 POST /api/system/reset 清除；也可 DELETE /api/favorites/:tutorialId 还原

**version**: v1
**lastUpdatedBy**: case-designer
