# FE-04 自测报告（IT-04 · portal 我的学习页 #/my）

- **任务ID**: IT-04/FE-04
- **测试时间**: 2026-08-22
- **测试方式**: agent-browser（Chrome 自动拉起失败 os error 14001 → 改 Edge headless CDP 9333 连接；snapshot 在本机挂起，与 FE-03 同况，改 eval 断言 + 真实点击）+ 真实后端 3000 全链（vite 5173 代理）
- **构建**: `npm run build` 通过（tsc --noEmit 0 Error + vite build 成功，三入口产物正常）
- **交付文件**: `web/src/portal/pages/My.tsx`、`web/src/portal/pages/My.css`（新增）；`web/src/portal/App.tsx`（/my 挂 My）、`web/src/shared/constants.ts`（新增 rolePersonaText/personaName 共享口径）、`web/src/portal/components/Topbar.tsx`（pillText 改用共享口径，游客分支不变）
- **实现图**: `FE-04-impl-fav.png`（收藏 Tab 含已下架灰行）、`FE-04-impl-his.png`（历史 Tab 三档徽章），与 ui_portal_my.html 复刻比对一致

## 测试数据（经真实 API 构造）

管理员 republish 教程 24「来料检验操作指南」→ 采购角色收藏 5 篇（3/7/6/1/24，间隔 1s 保序）+ 历史 6 条（11=25%、9=40%、2=100%、5=60%、3=75%、24=60%，间隔 1s）→ 管理员将 24 重新下架。期间并行任务执行过一次 system/reset 清库，重新造数后完成验证（教程 24 终态恢复种子 offline 态）。

## AC 验证结果

| AC | 结论 | 证据 |
|----|------|------|
| AC-FN-23 历史倒序+进度+续读 | pass | 历史按 updatedAt 倒序 24→3→5→2→9→11（与 API 顺序一致）；每条显示进度百分比徽章；点正常条目/「继续阅读 →」→ `#/detail/3`；点「重新学习」（100%）→ `#/detail/2`，进度徽章保留展示 |
| AC-FN-20 已下架灰显不可进正文 | pass | 收藏/历史两面板 isOffline 条目灰显（.off 灰底 opacity .82 + 图标置灰）+「已下架」灰徽章 + 副行「该教程已下架，正文不可见」；dispatchEvent 真实点击条目主体 URL 保持 `#/my` 无导航；右侧「不可访问」按钮恒禁用 |
| AC-EG-10 收藏/历史点击拦截 | pass | 同上；同类推荐《MRP 自动算料》→ 跳 `#/detail/3`（同分类可见教程首条）、「浏览采购管理更多教程 →」跳 `#/list?categoryId=5` 均可达；历史面板同规格（进度徽章保留 60% mid） |
| AC-FN-03/15 未登录引导回原位 | pass | 无 token 进入 #/my → GET 401 → 全局 RoleLoginModal 自动弹出（6 角色卡）+ 底层引导视图（🔑 登录后查看收藏与阅读进度）+ 头像「客」+ 副文案「请登录后查看收藏与阅读进度」→ 选采购 → 弹窗关、URL 保持 #/my、列表自动加载（徽标 5/6），全程无第二次点击 |
| UI-IXD-11 续读交互入口 | pass | 历史条目「继续阅读 →」（<100%）/「重新学习」（=100%）按钮文案按进度切换，点击进入详情由 FE-02 继续阅读横幅承接（教程 2 进度 100% 无横幅、教程 3 75% 有横幅，口径一致） |
| UI-ELEM-02 已下架标注样式 | pass | 复刻原型 .off/.badge-off/.rel-link 规格（灰底 #f1f5f9、cursor:not-allowed、置灰徽章、蓝色推荐链接），实现图比对一致 |

## 关键交互路径实测

- **取消收藏（AC-RULE-09）**: 徽标 5→4，行 fav-item-7 即时移除；服务端 DB 同步验证 favorites 记录删除、tutorials.fav_count 109→108 联动 -1；Network 出现 `DELETE /api/favorites/7`
- **已下架条目操作边界**: 已下架行无取消收藏入口（按元素表只有「不可访问」禁用按钮）；同类推荐/浏览更多链接可正常跳转
- **Tab 切换**: 收藏⇄历史面板切换零请求（performance resource 计数 19 保持不变），数据保持已加载状态；选中 Tab 蓝色下划线高亮
- **请求格式**: `GET /api/favorites?page=1&pageSize=20`、`GET /api/histories?page=1&pageSize=20`（进入即并行双取，徽标计数双 Tab 就绪）、`GET /api/tutorials?categoryId=5&page=1&pageSize=1`（同类推荐补齐）
- **空态**: 财务角色（无数据）收藏 Tab「暂无收藏」+「去浏览教程」→ `#/list`；历史 Tab「暂无阅读记录」+ 底部同步说明文案
- **切角色数据跟随**: 顶栏角色徽章切财务 → user 变化自动重载（头像「周」、徽标 0/0、空态）
- **页头口径**: 头像取人格名首字（张/周）、副文案「采购 · 张伟 · 收藏与阅读进度在 PC / 小程序两端实时同步」（与顶栏徽章共用 rolePersonaText）

## 三态与进度徽章分档

- Loading：骨架行渲染分支存在（初始 loading=true）；本地接口毫秒级返回，骨架态未在浏览器稳定捕获（已实测空态/数据态/错误重试分支，骨架为同一状态机分支）
- 进度徽章：100%→`pb full` 绿 +「重新学习」；75%/60%→`pb mid` 蓝 +「继续阅读 →」；40%/25%→`pb low` 橙 +「继续阅读 →」；mini 进度条 width 与 progress% 逐条相等（60/75/60/100/40/25）

## 未实测项（真实环境无法触发，如实记录）

- **DELETE 500 → toast 且条目保留**: 真实后端无法构造 500（DELETE 契约仅 401/404，404 需教程被物理删除）；代码通路与非 401 失败共用 catch（err.message 直显 toast + 条目保留），401 分支已实测走全局弹窗回原位
- **联调阶段 3 项**（FE-03 详情收藏→PC 列表出现、FE-02 读 60%→历史置顶、管理员下架刷新灰显）: 下架刷新灰显链路本次已实测（24 下架后 GET 即返 isOffline=true）；其余两项依赖 FE-02/FE-03 用例串联，属阶段 3 联调

## 环境备注

- 共享后端被并行任务执行过一次 system/reset（种子重置），期间本任务测试数据被清空一次，重新造数后全部用例通过；教程 24 终态已恢复种子 offline 态，采购角色演示收藏/历史数据留存（供 AC-FN-15 跨端口径复用）
- agent-browser Chrome 自动拉起在本机失败（os error 14001 并行配置错误），Edge CDP 连接方式可用（FE-03 同况）
