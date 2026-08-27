# FE-02 自测报告（IT-03 · portal 教程首页）

- **任务ID**: IT-03/FE-02
- **测试时间**: 2026-08-21
- **测试方式**: agent-browser + 真实后端 3000 浏览器验证（含 network route stub 边界注入）
- **构建**: `npm run build`（tsc --noEmit + vite build）0 Error
- **AC 验证**: AC-FN-01 / AC-FN-17 / AC-FN-22 / AC-RULE-16 / AC-RULE-17 / UI-IXD-01 / UI-ELEM-05 / AC-EG-14 **pass**
  - 首屏四区块：游客推荐=全站浏览量 Top6（5,023→1,876 倒序，AC-FN-22）；宫格 12 格、2 格灰角"待补充"（UI-ELEM-05/AC-FN-01）；最近更新 6 卡（🕒 YYYY-MM-DD）、热门 6 卡（🔥 千分位浏览量）均按契约排序（置顶优先→目标排序，AC-RULE-17）
  - 角色联动（AC-FN-17）：选角色登录"采购"→ 横幅即时切"为你推荐 · 采购相关…「采购管理 / 库存管理」"+chip"角色：采购"，/api/recommend 自动带 Bearer 重取，5 条全部来自命中集、浏览量倒序（2,341/1,980/1,694/1,523/1,352）；销售 4 条、仓库 2 条（库存映射）同样验证
  - UI-IXD-01：宫格点击 → URL 断言 `#/list?categoryId=5`；"全部教程 →/更多 →"→ `#/list`
  - 边界（stub 注入）：命中集仅 2 条 → 渲染 2 卡全来自命中集；宫格 10 个启用分类 → 10 格（AC-EG-14 前台表现，停用不出现）；空推荐 → "📭 暂无推荐"空占位不白屏；tutorialCount 缺失 → ?? 0 兜底"待补充"
  - Loading：fetch 延迟注入轮询观测到分区 grid-skeleton/categories-skeleton（推荐区骨架与最近更新/热门渲染互不阻塞）
  - Network：四请求参数与契约一致（`sort=latest&page=1&pageSize=6`、`sort=hot&…`、`withCount=1`、recommend 游客不带/登录带 Authorization）
- **复刻自检**: FE-02-impl.png 全页读图对照 ui_portal_home.html，6 个检查区（顶栏/横幅+卡网格/宫格 6 列+橙灰角标/最近更新/热门/页脚）全符合，无样式错乱
- **缺陷修复**: 联调发现后端 GET /api/recommend 不解析 Bearer token（已登录恒回 global，curl 复现：同 token /me 正常解析），已修复 server/src/routes/misc.ts（CHANGE-6，pending），server 160 单测全绿后浏览器复验通过
- **实现图**: FE-02-impl.png（采购登录态全页，与设计稿演示态一致）
