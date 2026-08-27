# BE-01 自测报告

- **任务ID**: BE-01（迭代 IT-05）
- **测试时间**: 2026-08-21 16:49
- **测试方式**: 接口测试（Node fetch 脚本 [be-01-test.mjs](be-01-test.mjs)，25 断言全通过；对 http://localhost:3000 实调 + SQLite 直读对账）
- **服务状态**: service-ready，http://localhost:3000

## AC 验证结果

| AC 编号 | 描述 | 结果 | 备注 |
|---------|------|------|------|
| AC-FN-24 | m 首页区块数据可取（消息入口预留卡片唯一数据源） | ✅ | 公开接口无登录态 200 返回种子 3 条 mock 消息，驼峰契约字段齐全，首页卡片取数无阻断 |

## 接口测试结果

| 接口 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| /api/messages | GET | 200/400 | ✅ | 25/25 断言通过，详见下方分维度记录 |

分维度验证记录：

- **正向**：无 Authorization 公开可读（200 {code:0,message:"ok"}）；种子 3 条按 createdAt 倒序（id 1→3→2：08-18 09:30 > 08-18 09:06 > 08-17 15:00）；LEFT JOIN 教程标题正确（id1→教程 7《采购申请到一键下单》）；7 个驼峰字段无蛇形残留
- **参数校验**：erpRole 非法枚举 xxx/空串/MANAGE/带空格/constructor/重复参数（数组）/300 字符超长串 → 全部 400 code=400 message="erpRole 参数不合法"（空串=显式非法口径与 recommend 缺省口径区分正确）
- **业务规则**：过滤优先级三分支逐一断言——显式参数（purchase token + erpRole=produce → id 3）> 登录角色（purchase token 不传参 → id 1）> 全部（admin erpRole=null → 3 条；游客 → 3 条）；6 枚举逐一验证（purchase/sales/produce 各命中 1 条，warehouse/manage/finance 空数组）
- **边界值**：手工插库 1 条 erp_role=finance 且 tutorial_id=NULL 的消息 → ?erpRole=finance 返回 tutorialId=null、tutorialTitle=null 不报错；全量变 4 条且最新createdAt居首
- **异常**：失效 token（Bearer deadbeef…）降级游客 200 不 401，返回 3 条
- **联动/只读**：全路径调用后 SELECT COUNT(*) FROM messages 不变（3==3），纯只读

## 问题清单（如有）

| 级别 | 问题描述 | 复现步骤 |
|------|----------|----------|
| P2（文档漂移，已在任务 frontmatter doc-drift 登记，非接口缺陷） | 任务阶段1"erpRole=manage→2 条(id 1,2)"与 get-api-messages.md 示例（tutorialId 25 不在 24 篇种子里）为旧草稿；实际种子为 purchase(id1)/sales(id2)/produce(id3) 各 1 条，manage 过滤为空数组。接口行为与契约（按 erp_role 过滤）一致 | GET /api/messages?erpRole=manage → [] |

## 结论

**通过**。1 端点 25/25 断言全绿：公开读取、倒序、角色过滤三分支优先级、非法枚举 400（含空串/数组/原型链键）、null 关联教程边界、失效 token 降级、只读无副作用全部符合契约。

## API 测试覆盖率

| API | 正向 | 参数校验 | 边界值 | 业务规则 | 异常 | 联动 |
|-----|------|----------|--------|----------|------|------|
| GET /api/messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅（只读计数对账 + 失效 token 降级） |

覆盖率: 6/6（100%）
