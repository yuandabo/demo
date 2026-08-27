# BE-02 自测报告

- **任务ID**: BE-02（迭代 IT-05）
- **测试时间**: 2026-08-21 16:52
- **测试方式**: 接口测试（Node fetch 脚本 [be-02-test.mjs](be-02-test.mjs)，31 断言全通过；对 http://localhost:3000 实调 + SQLite 直读写构造场景与持久化对账）
- **服务状态**: service-ready，http://localhost:3000
- **环境日期**: 服务器本地今日=2026-08-21（周五），本周一=2026-08-17

## AC 验证结果

| AC 编号 | 描述 | 结果 | 备注 |
|---------|------|------|------|
| AC-FN-16 | 当日打卡 +10，重复点击积分不再增加；连续 7 天获"坚持者" | ✅ | 首次 POST pointsAdded=10/duplicated=false；重复 POST pointsAdded=0/duplicated=true 且 totalPoints 不变；构造 streak=7 → badges 含 persist |
| AC-FN-21 | 完成 20 篇获"百科达人"；中断不清积分、不回收已获徽章 | ✅ | 20×progress=100 → 含 encyclopedia，19 条不含；中断后再打卡 totalPoints=80 全量保留、persist 不回收（bestStreak 口径） |
| AC-RULE-12 | +10/日、坚持者=连续 7 天、百科达人=完成 20 篇、中断仅清连续天数 | ✅ | 昨日 streak=3 → 今日 POST streak=4；7 天后中断 2 日再打卡 streak 重置 1（非 8）、积分不清零 |
| AC-RULE-13 | 完成口径 = progress=100 的历史条数 | ✅ | 2×100% + 1×60% + 1×30% → completedTutorials=2（仅 100% 计入） |

## 接口测试结果

| 接口 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| /api/checkins | POST | 200/401 | ✅ | 首次"打卡成功"+10 / 幂等"今日已打卡"+0；空 body {} 与无请求体均合法不 400；并发同日双请求均 200（一 false 一 true），库中该日仅 1 条（UNIQUE 兜底） |
| /api/checkins | GET | 200/401 | ✅ | 全指标聚合 + weekCalendar 7 项周一为首；种子 purchase 用户 totalPoints=50、bestStreak=2、本周 08-17/08-18 命中；未来日期强制 false |

分维度验证记录：

- **正向**：首次打卡 {checkinDate=2026-08-21(本地 yyyy-MM-dd), pointsAdded=10, totalPoints=10, streak=1, badges=[], duplicated=false}；打卡后 GET todayChecked=true、weekCalendar 今日 true
- **参数校验（401 分支）**：POST/GET 无 token、伪造 token → 401 "未登录或登录已失效"
- **边界值**：无任何记录新用户 GET 全零（0/0/0/0/false/[]，周历全 false）；POST 不携带请求体合法；种子用户 streak=0（今日与昨日均无 → 连续清零口径）
- **业务规则**：幂等（totalPoints 10→10 不变）；跨日 streak=昨日+1（3→4）；中断重置 1 且 totalPoints=80（积分不清零）；persist 按 bestStreak≥7 判定不回收；encyclopedia 阈值 20（19 条不含）；completedTutorials 仅 100% 计入
- **异常/并发**：两请求 Promise.all 同时 POST → 均成功、库中 UNIQUE(user_id,checkin_date) 仅 1 行
- **持久化**：直查 checkins 表 user_id=3 当日行 points=10/streak=1/checkin_date=今日，与响应一致；接口全程未改动 purchase 用户 5 条种子打卡行

## 问题清单（如有）

| 级别 | 问题描述 | 复现步骤 |
|------|----------|----------|
| P2（文档漂移，非接口缺陷） | post-api-checkins.md 示例"totalPoints: 80, streak: 5, badges:['persist']"为任意示意值，与本种子无对账关系；接口行为与契约规则一致 | — |

## 结论

**通过**。2 端点 31/31 断言全绿：幂等、积分、连续天数跨日/中断/重置、双徽章阈值与不回收、周历构造、并发 UNIQUE 兜底、持久化一致性全部符合契约与 AC。

## API 测试覆盖率

| API | 正向 | 参数校验 | 边界值 | 业务规则 | 异常 | 联动 |
|-----|------|----------|--------|----------|------|------|
| POST /api/checkins | ✅ | ✅（401 分支/空 body） | ✅（无请求体/新用户） | ✅（幂等/跨日/中断/徽章阈值） | ✅（伪造 token 401） | ✅（并发 UNIQUE + GET 状态联动 + 库行对账） |
| GET /api/checkins | ✅ | ✅（401 分支） | ✅（零记录用户全零） | ✅（streak/bestStreak/completedTutorials 口径） | ✅（未登录 401） | ✅（POST 后状态回读 + 种子周历吻合） |

覆盖率: 12/12（100%，2 端点 × 6 维度）
