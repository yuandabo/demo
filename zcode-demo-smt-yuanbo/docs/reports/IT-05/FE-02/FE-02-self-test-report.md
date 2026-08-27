# FE-02 自测报告（IT-05 · m 首页 #/）

- **任务ID**: IT-05/FE-02
- **测试时间**: 2026-08-21
- **测试方式**: Playwright 375×812 浏览器断言（verify-fe02.mjs）+ 视觉复核（FE-02-impl.png 对照 ui_m_home.html）
- **AC 验证**: AC-FN-24、AC-RULE-16、AC-FN-08 **pass**
  - 34/34 断言通过（两轮连跑稳定）：四请求初始化口径、游客/角色推荐两态、宫格 12 格角标（含「待补充」）、四类跳转（宫格/搜索/消息/横幅/推荐卡）、切角色联动刷新、骨架屏、发布后角标同次请求 +1
- **Mock 测试覆盖率摘要**: 本任务无独立 mock 层——真实后端 4 端点（recommend/categories/messages/checkins）已由 IT-03/IT-05 交付，vite proxy /api→3000 直连，浏览器断言与接口直连取数（同源交叉比对 DOM）双口径一致；交互操作 7/7 覆盖（初始化/宫格/搜索/消息/横幅/切角色/发布后刷新）
- **关键断言明细**:
  - 游客：推荐=全站 Top6（6/6 条与接口一致，无 erpRole 参数）、标题「全站热门」无角色标签、消息卡隐藏且未发 messages/checkins 请求、横幅固定引导文案
  - 采购登录：`GET /api/recommend?erpRole=purchase` 5 条全部来自采购/库存映射分类（不足 6 显示实际数量，AC-RULE-16）；区块标题「为你推荐 · 采购」+「按角色匹配」；消息卡显示第一条 mock 消息 +「预留」标签（token 隐式过滤）；横幅显示真实 todayChecked=false/streak
  - 切角色 sales：推荐重取（?erpRole=sales）且全部来自销售管理，标题同步
  - AC-FN-08：operator 建稿→提审→admin 过审发布后，刷新 m 首页宫格角标同一次请求 4→5（无需重启/重登）；验证后 POST /api/system/reset 还原种子库
- **修复记录**: ≤500px 铺满模式下 `#root`（body flex item，min-width:auto）被首页横滑内容（min-content≈950px）撑破 375 视口 → 铺满模式 body 改 `display:block`（FE-01 占位页无横向内容未暴露）
- **实现图**: FE-02-impl.png（采购登录态全区块展开整页）/ FE-02-guest.png（游客态）
