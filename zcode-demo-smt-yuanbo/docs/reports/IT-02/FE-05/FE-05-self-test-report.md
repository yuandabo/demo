# FE-05 自测报告（IT-02 · 审核队列页 #/review）

- **任务ID**: IT-02/FE-05
- **测试时间**: 2026-08-21
- **测试方式**: agent-browser 真实后端 3000 浏览器验证（prod dist :3000；种子 24 篇，pending 3 条 id19/20/21，测试后已 `POST /api/system/reset` 还原）
- **实现文件**: `web/src/admin/pages/Review.tsx`（新增）、`web/src/admin/admin.css`（追加审核队列段样式）、`web/src/admin/App.tsx`（路由替换占位 + roleGate 守卫放宽）、`web/src/admin/routes.ts`（AdminRouteMeta 新增 roleGate）、`web/src/admin/components/CategorySelect.tsx`（自 TutorialList 提取共用）、`web/src/admin/pages/TutorialList.tsx`（改用提取组件，行为不变）、`web/src/shared/types.ts`（+ReviewResult）
- **构建**: `tsc --noEmit` 0 Error；`vite build` 成功；web 工程无 lint/test 脚本（沿 FE-01~04 先例跳过单测走浏览器实测）
- **环境说明**: 本机 Chrome 并行配置损坏（os error 14001），agent-browser 以 `AGENT_BROWSER_EXECUTABLE_PATH` 指向 Edge (msedge.exe) 驱动；React 受控输入用 CDP `fill` 驱动（eval 直改 value 不触发 onChange）

## AC 验证

| AC | 结果 | 详情 |
|---|---|---|
| AC-FN-08 | **pass** | id21 点"通过"→ done-tip"✅ 已通过并发布 · 审核人 admin · 2026-08-21 22:02 · 前台即时可见"；Tab 角标 3→2、侧栏角标 3→2（REVIEW_CHANGED_EVENT 联动）；前台列表立即可见为 BE-04 契约（阶段 3 联调复验） |
| AC-FN-09 | **pass** | "太短"（2 字）→ 确认按钮禁用 + 红字"原因必填，不少于 5 个字" + 计数 2/200；补足 21 字 → 按钮启用 + 绿字"已满足最少 5 字要求"；确认 → 弹窗关闭、卡片标记"已驳回：教程回到草稿状态，原因已写入编辑页顶部告警条"、计数-1、toast 同文案 |
| AC-RULE-19 | **pass** | 双重校验：前端阻断（上）+ 后端 400 兜底（network route mock `{"code":400,"message":"请填写至少 5 个字的驳回原因"}`）→ **弹窗保留** + error toast 后端文案、卡片保持待审 |
| AC-FN-18 | **pass** | operator 登录后手输 #/review → 页面挂载（CHANGE-9，不再整页重定向）→"无权限执行该操作"+ 说明卡；审核页零队列请求（fetch 钩子捕获到的 1 次 status=pending 来自 operator 落位 #/tutorial 的四态计数，非本页）；菜单仅 统计看板/教程管理（FE-01 显隐不变） |
| AC-FN-19 | **pass**（展示侧） | id19 卡片渲染"修改版 v2 · 回审"紫标 + "回审期间前台仍展示线上过审版本"；驳回后旧版在线由后端快照列保证（阶段 3 联调项） |
| AC-EG-04 | **pass** | 管理员外带 approve id19（curl）后 UI 再点"通过"→ 409 → error toast"该教程状态已变化，请刷新" + 队列自动刷新（卡片 19 消失、Tab 3→2）+ 侧栏角标同步 3→2（本任务补：409 路径同样广播角标刷新） |
| AC-EG-19 | **pass** | 同一卡片连点"通过" 3 次 → `performance.getEntriesByType('resource')` 断言 POST /api/tutorials/{id}/review **恰 1 次**（busyRef 同步置位）；卡片仅一条"已通过"结果 |
| UI-ELEM-08 | **pass** | AI Tab mock 卡：灰蓝底虚线边框、"AI 生成"渐变标签+「预留」标签+来源行；通过/驳回 button disabled、查看全文置灰 pointer-events:none；ai-note 说明"本期内仅展示不可操作…v1.1+"；底部"本期 AI 生成队列共 1 条 mock 数据 · 审核动作下版本开放" |
| UI-ELEM-09 | **pass** | id19（submitCount=2 且 hasOnlineVersion=true）→ 紫标"修改版 v2 · 回审"；id20/21（首次）→ 灰标"首次提审" |

## 交互与专项验证

| 项 | 结果 | 详情 |
|---|---|---|
| 复刻自检 | pass | FE-05-impl.png 读图比对 ui_admin_review.html：页头标题+说明文案、双 Tab（人工激活蓝下划线+红角标 3 / AI 灰角标 1）、分类筛选行、卡片 meta（分类蓝标/作者/提交时间/v2 或首次徽章）、标题 16px 粗体、摘要、步骤预览块（1→2→3→4 圆点+›）、操作行（绿通过/红描边驳回/右蓝"查看全文 →"）、侧栏激活项+角标——结构与文案一致 |
| 队列初始化 | pass | GET status=pending → 3 卡片按提交时间倒序（19→20→21，契约列表 isTop→sort→updated_at 排序与队列口径不符，前端按 updatedAt DESC 重排，见偏差 3）；加载态骨架卡 |
| 分类筛选 | pass | 选"销售管理" → 仅 id19 一卡、Tab 计数 1；恢复"全部分类" → 3 卡 |
| 查看全文 | pass | 960px 大弹窗按待审核版本渲染：4 步骤块（圆点序号+标题+正文，正文含"新版入口已从快捷菜单迁移至页签"等 v2 当前编辑值，非线上 v1 快照）；底部"以上为待审核版本渲染效果 · 审核通过后前台即时替换为该版本"；关闭/仅预览双按钮；关闭后 review 请求计数不变（仅预览无副作用） |
| 驳回弹窗视觉 | pass | reject-modal.png 读图：标题"❳ 驳回教程"、对象行《销售订单录入操作指南》、textarea"太短"、计数 2/200、红字最少字数提示、确认按钮半透明禁用、红提示条文案逐字与设计稿一致 |
| 全文弹窗视觉 | pass | full-modal.png 读图：4 步骤块结构/序号圆点/正文/底部说明/双按钮与设计稿一致 |
| 空态/错误态 | pass | 队列清空后"📭 暂无待审核教程"；错误态复用 region-error + 重试（代码路径，同 FE-03 口径） |
| Network 格式 | pass | GET `/api/tutorials?status=pending&page=1&pageSize=20`（categoryId 仅筛选时附加）、卡片 GET `/api/tutorials/{id}?all=1`、POST `/api/tutorials/{id}/review` 载荷 `{action:'approve'}` / `{action:'reject',reason}` 与契约一致；withdraw 预留未调用 |

## 说明与偏差（均可溯源）

1. **operator 直达 #/review 为页面级 403 提示**（FE-01 原为整页重定向至 #/tutorial）：routes.ts 新增 `roleGate?:'page'`，/review 启用；#/category 维持原行为（FE-06 可复用该标记）。见 design/change-log.md **CHANGE-9**。
2. **卡片正文/全文取数走 GET /api/tutorials/:id?all=1**（任务文件设想列表接口返回 content，但列表契约无该列）：每卡自取当前编辑值，失败静默降级。见 **CHANGE-10**（与 FE-04 CHANGE-7 同根因）。
3. **队列前端重排 updatedAt DESC**：契约列表固定 isTop→sort→updated_at（前台列表口径），审核队列口径为提交时间倒序，前端对当前页重排（种子下顺序 21/20/19 → 19/20/21，与原型一致）。
4. **409 路径同步广播 REVIEW_CHANGED_EVENT**：外带（他人/他端）变更触发 409 刷新队列时，侧栏角标同步重取，避免滞留旧值。
5. **通过后不渲染"撤销"链接**：原型 approve() 生成"撤销"，但无对应 API（withdraw 为运营动作，任务 API 表标注预留不渲染）。
6. **≥5 字满足提示用绿色**（原型仅切文字保持红色）："已满足最少 5 字要求"为正向反馈，按 UX 惯例取 success 色；不满足仍红色。
7. **回审 meta 附加文案为通用句**"回审期间前台仍展示线上过审版本"：原型括号内"v1 截图过时，反馈没帮助占比 55% 标红"为特定教程静态演示数据，真实数据无此来源。
8. CategorySelect 二次复用提取至 `admin/components/CategorySelect.tsx`（TutorialList 同步改造，行为不变）。

## 交付物

- `docs/reports/IT-02/FE-05/FE-05-impl.png`（全页实现图：人工审核 Tab 3 卡片）
- `docs/reports/IT-02/FE-05/FE-05-reject-modal.png`（驳回弹窗 2 字阻断态）
- `docs/reports/IT-02/FE-05/FE-05-full-modal.png`（全文弹窗步骤化渲染）
- `docs/reports/IT-02/FE-05/FE-05-ai-tab.png`（AI 生成 mock Tab）
- `docs/reports/IT-02/FE-05/FE-05-operator-403.png`（operator 直达 403 提示页）
- 测试后已 `POST /api/system/reset` 还原种子（24 篇）
