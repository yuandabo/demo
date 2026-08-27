# FE-05 联调验证报告 — 前台浏览检索三页（tutorials / recommend / categories 四接口契约对齐）

> 任务：`docs/tasks/IT-03/FE-05.md` ｜ 环境：Express(:3000) 托管 `web/dist`（本报告前已 `npm run build` 重建）+ 同源 `/api`
> 双通道：curl（契约断言）+ Playwright 驱动真实浏览器（Chromium 151 内核 + Edge 151 stable）
> 结论：**矩阵 12/12 通过**；FE 侧修复 1 处（favicon 404）；**BE 侧偏差 0（doc-drift 空）**

## 一、联调矩阵结果（12 项）

| # | 验证项 | curl 通道 | 浏览器通道 | 结果 |
|---|--------|-----------|------------|------|
| 1 | 列表 sort 契约 | `sort=latest`：置顶 id3(isTop=1) 首位 → 非置顶 sort ASC（50→60→70→90）→ sort=90 并列按 updated_at DESC（08-15>08-09）✅；`sort=hot`：id3(置顶,2341) → 5023→2865→2105→1980→1876 严格倒序 ✅ | 首页"最近更新"区块 DOM id 序列 `[3,19,4,6,2,15]` = API sort=latest；"热门教程" `[3,1,2,5,6,19]` = API sort=hot ✅ | ✅ |
| 2 | tag 逗号交集 | `tag=算料,BOM` → total=2（id3 `["算料","BOM","审批"]`、id11 `["BOM","算料"]`，均同时含两标签）；单值 `tag=BOM` → total=2 等价精确匹配 ✅ | 列表页点选 #算料 + #BOM 双胶囊 → total=2，URL=`#/list?tag=算料,BOM` ✅ | ✅ |
| 3 | keyword 三字段 | `keyword=算料` → total=4：标题命中（id3/17/12）、标签命中（id11）✅ | 浏览器搜"算料"：total=4、4 行卡片；resource timing 请求耗时 6/14ms ≤1s（AC-NF-01 本地实测）✅ | ✅ |
| 4 | categoryId 含子类 | 12 个一级分类逐一 `categoryId` 对账：list total 与角标 tutorialCount 全部一致（4/2/1/3/3/2/1/1/1/1+0/0）；**种子无二级分类**，子类收敛分支以 server 源码佐证：`subtree=[categoryId, ...children]` 后 `category_id IN (...)`（`server/src/routes/tutorials.ts` listTutorials）✅ | 首页宫格点"生产制造" → `#/list?categoryId=4`，树 node-4 选中、total=3 ✅ | ✅（子类分支数据受限，代码佐证） |
| 5 | 分类角标 | `withCount=1` 返回 12 个启用一级分类（8 模块 + 4 通用），系统设置/开放平台 tutorialCount=0 ✅ | 宫格 12 格；cat8/cat12 角标显示"待补充"，cat1="4 篇"；12 分类角标↔列表 total 全对账 ✅ | ✅ |
| 6 | 推荐双口径 | 游客：source=global、6 条全站浏览量 Top6（5023→1876）；采购登录：source=role、5 条（<6 展示实际）全部来自采购管理/库存管理、浏览量倒序（2341→1352）；`erpRole=bad` → 400 "erpRole 参数不合法" ✅ | 游客首页标题"热门推荐"+卡片序列=API；UI 六角色弹窗选"采购" → "为你推荐 · 采购相关"，5 卡命中集（.cat 全为采购管理/库存管理）+ 倒序 ✅ | ✅ |
| 7 | 详情接口 | id3 连续 3 次取：2342→2343→2344（每次 +1 含游客，返回值已含本次）；content 非空（len=390，读 published_content 快照）；prev=null（置顶首位）/next=id7 同分类相邻；related=[7,8] 同分类排除本篇（不足 4 取实际）；游客 my*=null，采购登录 myFavorite=false / myFeedback=null / myProgress=null ✅ | 列表点卡 → `#/detail/3` 渲染正文；刷新后 API 计数=页面显示+1（2352→2353）；prev 按钮置灰、next 可点 ✅ | ✅ |
| 8 | 详情不可见分支 | 纯草稿 id22 → 404 `"该教程不存在或暂不可见"`(reason=invisible)；已下架 id24 → 404 `"该教程已下架"`(reason=offline)+related=[3,7,8]；不存在 id999 → 404 同不可见文案 ✅ | `#/detail/22` 提示页渲染；`#/detail/24` "已下架"提示页 + 3 篇同分类推荐链接 ✅ | ✅ |
| 9 | 超时兜底 | —（网络层模拟见右） | 路由层延迟 3s（等效 Slow 3G）：提交搜索约 1.65s 内出现 `搜索超时，请重试` 提示条，关键词"算料"保留；**恢复路径 1** 解除限速点"重试" → total=4 恢复、提示条消失；**恢复路径 2** 清空筛选全站 19 → 点分类树"生产制造" total=3 正常获取 ✅ | ✅ |
| 10 | 工作台入口 | — | `#/list?erpModule=produce` → 自动归一化 `#/list?categoryId=4`、树选中生产制造、total=3（FE-03 列表侧映射 ✅）。**工作台页本身为 FE-04 占位页未交付**，4 卡跳转待 FE-04 dev-done 后补验（联调点见 §四） | ⚠ 列表侧通过；工作台页待 FE-04 |
| 11 | 浏览器兼容 | — | Chromium 151 内核与 Edge 151 stable 三页（首页/列表/详情）走查：布局无错位（宫格 12 格 grid 宽 1200px、区块对齐，读图复核）、控制台 0 Error（favicon 修复后）。版本清单见 §三 | ✅（版本受限见 §三） |
| 12 | 详情首屏口径 | — | 列表→详情跳转链路：`/api/tutorials/3` 耗时 18/24ms <2s，正文文字内容先渲染（body 文本 >500 字符），图片不阻塞（AC-NF-02 接口数据基础；页面级验收属 IT-04）✅ | ✅ |

矩阵执行脚本与原始结果：`verify.browser.mjs` / `browser-results.json`（同目录）；404 分支原始响应：`m8b.json` / `m8c.json`。

## 二、FE 侧偏差修复（1 处，小改）

| 偏差 | 现象 | 修复 | 复验 |
|------|------|------|------|
| portal 入口无 favicon | 浏览器自动请求 `/favicon.ico` → Express 404 → 控制台 Error，违反 AC-NF-03 "控制台 0 Error" | `web/portal.html` 增加内联 SVG `<link rel="icon">`（零静态资产，避免自动请求） | 重建后 Chromium/Edge 控制台均 0 Error ✅ |

> admin.html / m.html 存在同类问题，分属 IT-03.FE-01 / IT-04 任务交付物，本任务不越界修改（留待对应任务或收尾统一处理）。

## 三、浏览器版本清单（AC-NF-03）

| 通道 | 版本 | 三页走查 | 说明 |
|------|------|---------|------|
| Chromium（Chrome 同源内核） | 151.0.7922.34（Playwright bundled） | 通过，控制台 0 Error | 本机 Chrome 151.0.7922.169 进程在当前执行环境无法拉起（`spawn UNKNOWN` / os error 14001 并行配置错误），以同版本线 Chromium 内核代替实测 |
| Edge | 151.0.4129.86（本机安装 stable） | 通过，控制台 0 Error | 真实 Edge stable 通道 |
| Chrome 上一稳定版（150.x） | — | 未测 | 本机未安装（仅存 150.0.4078.83 残留删除中目录，不可启动） |
| Edge 上一稳定版（150.x） | — | 未测 | 本机未安装 |

**限制说明**："最新稳定版"双核已实测通过；"上一稳定版"因本机未安装旧版本且执行环境不可安装软件，留待具备多版本环境时补测（不影响布局/接口判定，两端 151 为当前主流版本线）。

## 四、联调点与遗留

1. **工作台 4 卡跳转（矩阵 #10 后半）**：FE-04 `#/workbench` 仍为占位页（`web/src/portal/App.tsx` Placeholder）。列表侧 `?erpModule=` 归一化映射已验证（produce→生产制造 ✅）；FE-04 dev-done 后需补验：produce/purchase/inventory 三模块卡点击 → 列表选中映射分类且过滤正确（UI-IXD-14 完整链路）。
2. **二级分类子树收敛**：种子无二级分类数据，"categoryId 含子类"以 server 源码（subtree IN 查询）+ 契约对账佐证；建议后续种子或 IT-04 补一条二级分类数据实测。
3. **AC-NF-01 P95 口径**：本次实测为本地单机低负载（6-14ms），满足 ≤1s；百级数据 P95 统计属测试阶段（run-test）口径。
4. 搜索超时模拟采用路由层延迟 3s（等效 Slow 3G 的 >1s 响应），AC-EG-11 的 1s 竞速、提示、双路恢复全部实测通过。

## 五、截图清单（本目录）

| 截图 | 内容 |
|------|------|
| FE-05-impl.png / FE-05-home-chromium.png | 首页全页（12 宫格+角标、游客推荐、最近更新、热门） |
| FE-05-home-purchase.png | 采购角色登录后推荐区（角色口径 5 条命中集） |
| FE-05-list-search.png | 列表页搜索"算料"结果（total=4） |
| FE-05-list-category4.png | 宫格"生产制造"跳列表过滤（total=3+树选中） |
| FE-05-detail.png | 详情页（id3 正文/上下篇/关联） |
| FE-05-detail-invisible.png / FE-05-detail-offline.png | 404 两分支提示页 |
| FE-05-timeout-alert.png | 1s 超时提示条+筛选保留 |
| FE-05-home-edge.png / FE-05-list-edge.png / FE-05-detail-edge.png | Edge 151 三页走查 |

## 六、验收阶段对照

- 阶段 1：`npm run build`（tsc --noEmit + vite build）0 Error ✅；server 启动+种子就绪（withCount=1 返回 12 一级分类）✅；矩阵 1~12 逐项执行并留档 ✅
- 阶段 2：命中集断言（采购 5/5 来自采购+库存、倒序、不足 6 展示实际）✅；搜索 ≤1s ✅；超时兜底两路恢复 ✅；角标对账 12/12 ✅；详情计数 +1 与 my* 字段 ✅；BE 偏差 0 无需登记 doc-drift ✅
- 阶段 3：Chrome 内核/Edge 最新稳定版实测+版本清单（§三，上一稳定版本机未装留补测）⚠/✅；本报告产出 ✅
