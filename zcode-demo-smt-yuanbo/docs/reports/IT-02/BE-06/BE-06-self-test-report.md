# BE-06 自测报告

- **任务ID**: BE-06（迭代 IT-02）
- **测试时间**: 2026-08-21 16:45
- **测试方式**: 接口测试（Node fetch 脚本 [be-06-test.mjs](be-06-test.mjs)，47 断言全通过；对 http://localhost:3000 实调）
- **服务状态**: service-ready，http://localhost:3000

## AC 验证结果

| AC 编号 | 描述 | 结果 | 备注 |
|---------|------|------|------|
| AC-FN-14 | 统计看板：总览 4 指标 + Top10 / 反馈分析倒序标红 / 覆盖度矩阵+模块聚合 | ✅ | overview 19/31590/0/88.0 + Top10；feedback #19 55.0 标红倒序；coverage matrix 12 + modules 8 |
| AC-EG-12 | 空库空态 0/null/[] 不报错 | ✅ | 清空 tutorials/categories/favorites/feedbacks 后三端点均 200：overview 0/0/0/null/[]、feedback []、coverage []/[] |
| AC-RULE-08 | 前台可见口径（下架不计入、回审旧版计入、与列表可对账） | ✅ | 下架 #18 → publishedCount 19→18、totalViewCount 31590→30898、前台列表 total 同步 18（all=1 仍 24）；回审 v2 #19 计入 topViewed |
| AC-RULE-09 | 收藏量=当前有效收藏数（取消即减） | ✅ | POST /api/favorites/1 → totalFavCount 0→1；DELETE → 归 0 |
| UI-ELEM-03 | 没帮助占比 >50% 标红 | ✅ | #19 22/(18+22)=55.0 → isRed=true（种子唯一标红项）；22.5/12.6 等均 false；零反馈 null 不参与判定 |
| UI-ELEM-04 | 0 篇启用分类标空白区 | ✅ | cat8 系统设置/cat12 开放平台 tutorialCount=0 → isBlank=true；下架 #18 后 cat10 翻转为 blank；system 模块 isBlank=true |

## 接口测试结果

| 接口 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| /api/stats/overview | GET | 200/401/403 | ✅ | admin/operator 200；未登录 401"未登录或登录已失效"；user 403"无权限执行该操作"；avgHelpfulRate=88.0（逐教程算术平均，种子对账一致） |
| /api/stats/feedback | GET | 200/401/403 | ✅ | list 19 条按 notHelpfulRate 倒序、null 沉底（新发布零反馈教程验证）；留言结构 {userId,displayName,comment,updatedAt}（种子无留言，comments=[]） |
| /api/stats/coverage | GET | 200/401/403 | ✅ | matrix 12 行 sort 升序，各分类计数与种子逐一吻合（cat1=4 含回审 #19）；modules 8 个、无映射分类（新手/最佳/常见/开放）不进；模块聚合=模块内启用分类计数之和（16） |

补充验证：

- operator 三端点数据与 admin 逐字节一致（只读同视图，AC-RULE-23）
- avgHelpfulRate 口径：0 浏览 0 反馈新教程不计入分母（发布后 avg 不变、publishedCount +1）
- 联动：收藏增减/下架/发布全链路指标实时对账通过
- 测试后已 POST /api/system/reset 复原（categories 12 / tutorials 24 / users 8 / messages 3 / checkins 5），复原后 overview 回到 19/31590 基线

## 问题清单（如有）

| 级别 | 问题描述 | 复现步骤 |
|------|----------|----------|
| P2（文档漂移，非接口缺陷） | get-api-stats-overview.md 示例值（18/4823/512/92.4、Top4 截断）为旧草稿口径，与现种子（19/31590/0/88.0）不一致；示例仅示意不影响行为 | 对照种子重算 |

## 结论

**通过**。三端点 47/47 断言全绿：鉴权（401/403）、种子基线指标、倒序/标红/空白区判定、VISIBLE_SQL 口径对账（下架/回审/收藏增减）、空库空态、operator 同视图全部符合契约与 AC。

## API 测试覆盖率

| API | 正向 | 参数校验 | 边界值 | 业务规则 | 异常 | 联动 |
|-----|------|----------|--------|----------|------|------|
| GET /api/stats/overview | ✅ | -（无参数） | ✅（空库 0/null/[]） | ✅（可见口径/收藏增减/回审计入） | ✅（401/403） | ✅（收藏增减+下架联动对账） |
| GET /api/stats/feedback | ✅ | -（无参数） | ✅（零反馈 null 沉底） | ✅（>50% 标红/倒序/留言仅后台） | ✅（401/403） | ✅（下架剔除/新发布入列） |
| GET /api/stats/coverage | ✅ | -（无参数） | ✅（空库空数组/空白翻转） | ✅（停用不入矩阵/模块聚合/子分类汇总口径） | ✅（401/403） | ✅（下架/发布翻转 isBlank） |

覆盖率: 18/18（100%；三端点均无查询参数，参数校验维度不适用记 "-"）
