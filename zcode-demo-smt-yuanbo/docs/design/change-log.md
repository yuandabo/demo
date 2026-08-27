# 变更日志

> 开发过程中的基线偏离记录，收尾阶段由 doc-reconcile 审核合并回 PRD/AC/tech-design 基线。

## CHANGE-1: VISIBLE_SQL 常量归属调整（db.ts 由 IT-01.INFRA-03 独占交付）
- 状态: merged
- 类型: Updated
- 风险等级: 中
- 模块: 共享基础（可见性口径/状态机）
- 来源: 人工介入(Vibe Coding)
- 关联任务: IT-01.INFRA-03
- 涉及基线:
  - PRD: prd.md#6-前台可见性规则（可见性五规则）
  - AC: ac.md#AC-RULE-08（前台可见口径）/ AC 评审轮 3 教训（口径漂移）
  - tech-design: tech-design.md#4-后端架构与处理流程（核心链路 2：VISIBLE_SQL 由 db.ts 导出）
- 变更前: IT-02.INFRA-01 任务书核心流程 1 要求本任务在 db.ts 模块中追加导出 VISIBLE_SQL 常量
- 变更后: db.ts（含 VISIBLE_SQL 常量导出，内容见 IT-01.INFRA-03.md §核心流程 4）由 IT-01.INFRA-03 独占交付；IT-02.INFRA-01 不写 db.ts，仅按接口约定 `import { VISIBLE_SQL } from './db.js'` 消费，并在 `src/state-machine.test.ts` 中以动态 import 门控校验（db.ts/erp.db 未就绪时用例 skip 并标注联调点，落地后自动生效）
- 变更原因: 编排层并行任务边界仲裁，避免两个任务并发写同一 db.ts 文件冲突；VISIBLE_SQL 唯一来源仍为 db.ts，全站口径不漂移的目标不变
- 更新时间: 2026-08-21

## CHANGE-2: 种子分类 erp_module 三枚举值对齐契约（file/inventory/hrFinance）
- 状态: merged
- 类型: Updated
- 风险等级: 中
- 模块: 目录与模块映射（种子数据）
- 来源: 任务 IT-02.BE-07
- 关联任务: IT-01.INFRA-03（种子交付）、IT-02.BE-05/BE-06/BE-07
- 涉及基线:
  - PRD: prd.md#2-术语表（模块映射：8 大模块标识） / prd.md#7.1（角色-模块映射）
  - AC: ac.md#AC-FN-17（采购命中集含库存管理）/ ac.md#AC-OP-04（模块映射维护后推荐位生效）
  - tech-design: tech-design.md#11（buildRecommend 命中集取数）
  - api: get-api-categories.md、put-api-categories-id.md（erpModule 枚举= sales/project/file/produce/purchase/inventory/hrFinance/system）
- 变更前: seed.ts 中 文件管理='document'、库存管理='warehouse'、人事财务='finance'（INFRA-03 implementation-note 3 自定口径，声称"与 erp_role 枚举对齐"）
- 变更后: 对齐全端冻结枚举：文件管理='file'、库存管理='inventory'、人事财务='hrFinance'；server/erp.db 删除重建（AC-NF-06 设计路径）
- 变更原因: 三值与 GET/PUT /api/categories 契约枚举及 web/src/shared/types.ts ErpModule 类型冲突：角色→模块映射（web constants.ts ROLE_MODULE_MAP：purchase→purchase+inventory、warehouse→inventory、finance→hrFinance+sales）按契约枚举实现时命中集缺库存/人事财务分类，仓库角色推荐恒为空；管理员经 PUT /api/categories 维护映射写入的也是契约枚举值。本变更废弃 INFRA-03 implementation-note 3 的自定取值口径
- 更新时间: 2026-08-21

## CHANGE-3: 收藏列表 summary 快照列空值回退工作列
- 状态: merged
- 类型: Updated
- 风险等级: 低
- 模块: 收藏（favorites）
- 来源: 任务 IT-04.BE-01
- 关联任务: IT-01.INFRA-03（种子）、IT-04.BE-03（recommend 同口径）
- 涉及基线:
  - tech-design: tech-design.md#4-后端架构与处理流程（前台只读快照列）
  - task: tasks/IT-04/BE-01.md §核心流程 4（SQL 骨架 `t.published_summary AS summary`）
  - api: get-api-favorites.md（成功示例 summary 为非空字符串）
- 变更前: 任务书 SQL 骨架直取 `t.published_summary AS summary`；种子中无 v2 回审的教程（18/19 篇可见）published_summary 为 NULL → 列表 summary 恒为空串，与契约示例不符
- 变更后: 取 `COALESCE(published_summary, summary) AS summary`（无回审快照时回退工作列——该场景下"线上版本摘要"即当前摘要），与已交付 recommend 路由（misc.ts 同表达式）口径一致
- 变更原因: 审核通过动作本身将 summary 拷贝至 published_summary（db.md §4），种子为省列对未回审教程留 NULL；契约示例（MRP 教程 summary 非空）与前台真实口径均要求回退，两处 front-facing 读路径统一表达式避免口径分叉
- 更新时间: 2026-08-21

## CHANGE-4: system 分组路由独立为 routes/system.ts（不并入 misc.ts）
- 状态: merged
- 类型: Added
- 风险等级: 低
- 模块: 系统（system 分组·种子重置）
- 来源: 人工介入(Vibe Coding)
- 关联任务: IT-01.BE-02
- 涉及基线:
  - tech-design: tech-design.md#2-目录结构（routes/misc.ts 承载 recommend/messages/checkins/system）
  - task: tasks/IT-01/BE-02.md §任务目标（"实现 server/src/routes/misc.ts 中的 POST /api/system/reset"）
- 变更前: 任务书要求把 reset 端点追加进 misc.ts（system 分组）
- 变更后: 新建独立 `server/src/routes/system.ts` 交付 POST /api/system/reset；misc.ts 保持不动（IT-02.BE-07 交付物，避免并发写冲突）；挂载行 `apiRouter.use('/system', system)` 由主 agent 统一落盘 routes/index.ts（已记入 BE-02 implementation-notes）
- 变更原因: 编排层文件归属仲裁；路由行为、鉴权与响应契约均不变
- 更新时间: 2026-08-21


## CHANGE-5: 可见性查询计数口径澄清（18 vs 19）
- 状态: merged
- 类型: Updated
- 风险等级: 低
- 模块: 数据库种子（INFRA-03）
- 来源: 任务 {INFRA-03}
- 关联任务: INFRA-03
- 涉及基线:
  - tech-design: tech-design.md#4-后端架构与处理流程（核心链路 2 可见性公式）
  - AC: ac.md#AC-RULE-02（回审期间旧版在线）、ac.md#AC-FN-19（回审驳回后列表与搜索持续可命中）
- 变更前: 任务指令要求"可见性查询返回 18 篇"
- 变更后: 按 VISIBLE_SQL 冻结公式，种子库可见教程数 = 19（18 篇已发布 + 1 篇待审核回审旧版在线：《销售订单录入操作指南》v2，submit_count=2 且保留 published_content 快照、last_offline_at 为 NULL，按公式与 AC-FN-10/19 必须可见）
- 变更原因: "18 篇"与"1 篇待审含旧版快照"两项要求在冻结公式下不可同时成立；公式与快照语义均为 P0 基线（AC-FN-10/19 验收依赖），故以公式语义为准，seed:check 同时输出 published=18 与 visible=19 两个口径供断言区分
- 更新时间: 2026-08-21

## CHANGE-6: GET /api/recommend 登录态未按 token 解析角色（回退全站口径缺陷修复）
- 状态: merged
- 类型: Updated
- 风险等级: 高（AC-FN-17 命中集断言直接被堵死）
- 模块: 场景联动（推荐位）
- 来源: 任务 IT-03.FE-02（联调阶段发现，修复 BE-07 交付缺陷）
- 关联任务: IT-02.BE-07（recommend 端点交付）、IT-03.FE-02（首页角色推荐联调）
- 涉及基线:
  - api: get-api-recommend.md#业务规则（"已登录（或显式传 erpRole）：按角色匹配分类模块映射，取命中集内已发布教程浏览量 Top6；未登录：全站"）
  - AC: ac.md#AC-FN-17（采购登录推荐命中集）/ AC-RULE-16（推荐位规则）
  - tech-design: tech-design.md#11（buildRecommend(erpRole)）
- 变更前: routes/misc.ts 的 `router.get('/recommend')` 仅透传 `req.query.erpRole`，不解析 Authorization Bearer token——已登录用户（如采购 token）调用返回 source=global 全站 Top6，与 /api/auth/me 对同一 token 正确解析出 erpRole=purchase 的事实矛盾（curl 复现：token=/me 可解析用户，/recommend 返回 global）
- 变更后: 路由层按同文件 /messages 端点的既有写法解析可选 Bearer token（findUserByToken），取 `req.query.erpRole ?? user?.erpRole` 传入 buildRecommend（显式 query 参数优先、其次 token 角色、游客 global、空串仍按原口径走全站）；buildRecommend 服务层与既有单测不动
- 变更原因: FE-02 首页"登录后推荐区刷新"按契约走"自动带 Authorization"路径（任务交互 1 明确：已登录自动带 Authorization、游客不带，FE 不拼 erpRole 查询参数），后端不解析 token 导致 AC-FN-17 阶段 3 联调断言无法通过；显式 erpRole 查询参数路径已验证正常，缺陷仅在 token→角色解析缺失
- 更新时间: 2026-08-21

## CHANGE-7: 教程编辑器取数改用管理口径详情端点 GET /api/tutorials/:id?all=1
- 状态: merged
- 类型: Updated
- 风险等级: 低（目标行为不变：编辑表单读当前编辑值）
- 模块: 后台·教程编辑器（CMS）
- 来源: 任务 IT-02.FE-04（实现方式变更）
- 关联任务: IT-02.FE-04（编辑器页）、IT-02.BE-02（tutorials 端点）
- 涉及基线:
  - 任务: tasks/IT-02/FE-04.md#交互操作-1（"GET /api/tutorials?all=1&pageSize=100 取本行"）
  - api: get-api-tutorials.md（管理口径列清单，无 content 列）
  - AC: ac.md#AC-OP-05（再次进入内容完整保留——含正文）
- 变更前: 任务文件设想编辑取数走管理列表 all=1&pageSize=100 后按 id 取行
- 变更后: 编辑态直接调用 GET /api/tutorials/:id?all=1（BE-02 已交付的管理口径详情：任意状态可读，content/summary 读当前编辑值，返回 rejectReason/isTop/sort/createdAt/authorName/hasOnlineVersion），新建态仍仅拉取 GET /api/categories
- 变更原因: 管理列表 SQL 不返回 content 列（正文体积大，列表契约无此字段），列表取行无法回填富文本正文；管理口径详情端点正是为此场景设计（"供后台编辑/审核场景取行"），字段完整且少一次全量列表请求
- 更新时间: 2026-08-21

## CHANGE-8: 侧栏关联推荐 4 卡由 FE-02 一并交付（原任务文件划归 FE-03）
- 状态: merged
- 类型: Added
- 风险等级: 低（纯展示 + 路由跳转，无互动逻辑，不影响 FE-03 互动区边界）
- 模块: 前台·教程详情页
- 来源: 人工介入(Vibe Coding)（FE-02 任务指令明确交付项含"关联推荐 4 卡"）
- 关联任务: IT-04.FE-02（详情阅读主体）、IT-04.FE-03（互动区）
- 涉及基线:
  - 任务: tasks/IT-04/FE-02.md#页面元素（"互动区（收藏/评价/留言/分享/关联推荐卡）见 FE-03"）与 #调用接口（"本任务不用 related，归 FE-03"）
  - api: get-api-tutorials-id.md（data.related 同分类 4 篇）
  - UI: ui/ui_portal_detail.html#相关教程（侧栏 .rel 卡）
- 变更前: 任务文件口径下 FE-02 不消费 data.related，侧栏缺"🧩 相关教程"卡（复刻对照会缺区块）
- 变更后: FE-02 渲染侧栏关联推荐 4 卡（纯展示 + Link 跳 #/detail/:id）；FE-03 仍负责收藏/评价/留言/分享及互动逻辑
- 变更原因: FE-02 任务指令的交付清单明确包含"关联推荐 4 卡"，且详情响应已含 related 字段（同一请求零成本）；不渲染则复刻自检缺侧栏区块。与任务文件页面元素表的 FE-03 划分冲突，按指令优先并在此留痕
- 更新时间: 2026-08-21

## CHANGE-9: operator 直达 #/review 改为页面级 403 提示（不再整页重定向）
- 状态: merged
- 类型: Updated
- 风险等级: 中
- 模块: 后台·审核队列（CMS）
- 来源: 任务 IT-02.FE-05（实现方式变更）
- 关联任务: IT-02.FE-01（路由守卫）、IT-02.FE-05（审核队列页）、IT-02.FE-06（目录管理页同款约定）
- 涉及基线:
  - AC: ac.md#AC-FN-18（operator 调用审核接口 403"无权限执行该操作"）/ ac.md#AC-EG-06（无后台会话跳登录，不受影响）
  - 任务: tasks/IT-02/FE-05.md#任务目标-6（直接输 URL 访问时返回 403 → 页面提示）
  - 任务: tasks/IT-02/FE-01.md#implementation-notes-2（operator 手输 #/review 落位 #/tutorial）
- 变更前: FE-01 AdminLayout 守卫 2 将 operator 从 #/review 整页重定向到 #/tutorial，页面不挂载、无任何 403 呈现，AC-FN-18 前端侧无法演示
- 变更后: routes.ts 的 AdminRouteMeta 新增 roleGate?: 'page'（#/review 启用）：AdminLayout 对带该标记的 admin 专属页放行挂载，由页面自渲染"无权限执行该操作"提示（复用后端 403 契约文案，零数据请求零操作入口）；#/category 等 FE-06 未交付页维持原重定向
- 变更原因: FE-05 验收要求"operator 直接访问 URL → 提示'无权限执行该操作'"，与 FE-01 的整页重定向互斥；页面级提示与 FE-03"admin 专属入口不渲染"口径一致（入口隐藏 + 直达提示 + 后端 403 三层防御不变）
- 更新时间: 2026-08-21

## CHANGE-10: 审核队列卡片步骤预览/查看全文按卡片拉取 GET /api/tutorials/:id?all=1
- 状态: merged
- 类型: Updated
- 风险等级: 低（目标行为不变：按待审核版本当前编辑值渲染）
- 模块: 后台·审核队列（CMS）
- 来源: 任务 IT-02.FE-05（实现方式变更）
- 关联任务: IT-02.FE-02（列表端点）、IT-02.FE-05（审核队列页）
- 涉及基线:
  - 任务: tasks/IT-02/FE-05.md#交互操作-4（"数据来自列表接口的当前编辑值 content"）/ #交互操作-1（卡片缩略步骤预览）
  - api: get-api-tutorials.md（管理口径列清单，无 content 列）/ get-api-tutorials-id.md（?all=1 管理口径"供后台编辑/审核场景取行"）
  - AC: ac.md#UI-ELEM-09（卡片回审标识展示不依赖正文）
- 变更前: 任务文件设想队列列表接口返回 content，卡片步骤预览与全文弹窗直接读列表行
- 变更后: 队列列表仅取 meta/计数；每张待审卡片挂载后自取 GET /api/tutorials/:id?all=1 读当前编辑值 content（步骤预览与全文弹窗共用，失败静默降级为无预览），CHANGE-7 同款根因（列表 SQL 无 content 列）
- 变更原因: 管理列表契约无 content 列（正文体积大）；管理口径详情端点注释明确"供后台编辑/审核场景取行"，按卡片取数在演示规模（pending ≤20）下请求成本可控
- 更新时间: 2026-08-21
