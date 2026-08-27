# FE-03 自测报告（IT-04 · portal 教程详情页·互动区 + 分享弹窗集成）

- **任务ID**: IT-04/FE-03
- **测试时间**: 2026-08-21
- **测试方式**: agent-browser（Edge CDP，snapshot 命令在本机挂起改用 eval 断言 + CDP 真实点击）+ 真实后端 3000（vite 5173 代理）
- **构建**: `npm run build`（tsc --noEmit 0 Error + vite build）通过（期间 admin/pages/Review.tsx 为并行任务在途缺失，待其落地后全量构建通过；本任务文件全程 0 Error）
- **交付文件**: `web/src/portal/components/ShareModal.tsx`（FE-01 规格组件，随本任务交付）、`web/src/portal/pages/DetailInteraction.tsx`（互动区）、`web/src/portal/pages/Detail.tsx`（插槽接线 + 收藏数联动 + 正文底部关联推荐）、`web/src/portal/pages/Detail.css`（评价区/操作区/底部推荐/toast 样式）、`web/src/portal/portal.css`（.btn-o 与分享弹窗 sm-* 样式）、`web/src/portal/components/RoleLoginModal.tsx`（扩展 subtitle prop，缺省行为不变）

## AC 验证结果

| AC | 结论 | 证据 |
|----|------|------|
| AC-FN-03 未登录收藏回原位 | pass | 清 token 游客点「☆ 收藏（187）」→ 本组件弹选角色登录（副文案「登录后才能收藏与评价，选择角色继续（免密演示，登录后回到原操作位）」）→ 选销售 → 弹窗关、URL 保持 #/detail/3、按钮自动变「★ 已收藏（188）」+ 标题区/信息卡收藏数同步 188，全程无第二次点击 |
| AC-FN-05 评价切换 | pass | 有帮助提交（96→97 绿高亮）→ 改没帮助提交（97→96、8→9 红高亮）→ 再改回有帮助（96→97、9→8 绿高亮），可反复切换 |
| AC-FN-06 分享 | pass | 点「🔗 分享」→ POST share 打点（shareCount 39→40，重开 40→41 按动作计数）→ 弹窗展示复制链接 + 二维码；canvas 经 jsqr 解码内容 = `http://localhost:5173/m.html#/detail/3`（小程序端 URL）；链接框值 = `http://localhost:5173/portal.html#/detail/3`（PC 端 URL） |
| AC-FN-25 评价跨端共用（PC 侧初始态） | pass | 销售（myFeedback=1）进页 → 有帮助绿高亮（97）；仓库改评后 reload → 没帮助红高亮 + 留言框展开（不抢焦点）、helpfulNo=9 服务端口径一致 |
| AC-EG-07 游客评价引导 | pass | 游客点「没帮助」→ 弹窗副文案「登录后即可收藏/评价，选择角色继续（免密演示，登录后回到原操作位）」（含 AC 原文短语）→ 选仓库 → 自动 POST feedbacks → 没帮助 8→9 + 红选中 + 留言框展开 |
| AC-RULE-15 评价唯一可改 | pass | 同一账号反复切换均成功且服务端仅一条记录（helpfulYes/No 联动旧 -1 新 +1 实测） |
| AC-RULE-20 留言 | pass | 仅没帮助选中时留言框展开并聚焦（切回有帮助收起）；maxlength 200 拦截（灌 250 字 → 值长度 200、计数 200/200）；字数实时（fill 25 字 → 25/200）；前台无任何留言展示 |
| UI-IXD-06 收藏切换 | pass | 登录态点收藏 ★188 → 取消 ☆187，标题区/信息卡同步 ±1；reload 后与服务端一致 |
| UI-IXD-07 评价互斥 | pass | on-good/on-bad 类名互斥切换，aria-pressed 同步 |
| UI-IXD-08 留言条件展开 | pass | 同 AC-RULE-20（展开 + 聚焦 + 计数） |
| UI-IXD-09 分享复制反馈 | pass | 真实 CDP 点击「复制」→ 按钮变「已复制」持续 1.5s 恢复「复制」（页面内 200ms 采样日志：1253ms 起已复制、2760ms 复位，差值≈1.5s）；clipboard API 不可用降级 execCommand，全失败短暂「复制失败」不弹错误框 |
| UI-IXD-16 关联推荐 | pass | 侧栏「🧩 相关教程」（FE-02）与正文底部 4 卡区（FE-03）渲染同分类推荐 2 条（种子实际数）且不含本篇 id=3；点底部卡 → #/detail/7「采购申请到一键下单」 |

## 关键交互路径实测

- **401 登录失效回原位（交互 2 空态）**: 页面载入后注入坏 token 点收藏 → DELETE 401 → api.ts 清 token + auth:required → Layout 全局登录弹窗（缺省副文案）→ 选管理 → auth:login-success 事件重放 → 「★ 已收藏（109）」自动完成（tutorialId=7，108+1）
- **关闭弹窗无残留（交互 1/4 空态）**: 游客点收藏 → ✕ 关弹窗 → 之后经顶栏登录采购 → 收藏不被重放（仍 ☆187），待重放引用随 onClose 清理
- **防连点**: 同 tick 三连点仅发 1 次请求（ref 锁；state 型 busy 拦不住同 tick 批量点击，实测补上）；请求中按钮 disabled
- **未选评价提交**: 无评价账号线（财务）直接点「提交反馈」→ toast「请先选择「有帮助」或「没帮助」」，零请求
- **分享打点静默**: 打点 catch 兜底，弹窗/二维码不依赖打点成功（分享失败不阻断路径走通）

## Mock / 边界注入测试覆盖摘要

- 真实后端全链（非 mock）：role-login（销售/采购/仓库/管理/财务 5 角色）、POST/DELETE favorites（含幂等与 ±1 联动）、POST feedbacks（upsert 切换联动）、POST share（按动作 +1）、GET tutorials/:id（my* 个性化、游客 null）
- jsqr+pngjs 解码注入验证：分享二维码 canvas 位图内容逐字等于小程序端 URL（不信任“画了二维码”而验证编码内容）
- 输入层拦截：maxlength=200 实测 250 字截断
- 未覆盖转人工/联调项：feedbacks 400「留言不超过 200 字」toast（输入层已拦截 200 字无法经 UI 触发后端 400，错误通路与 favorites 404 同一 handleActionError 分支，走 err.message 直显）；favorites 404 文案同通路

## 修复记录（开发中自测发现）

1. 同 tick 连点绕过 busy 状态闸（React 批处理内 state 未重渲染）→ 收藏/评价补 ref 型 in-flight 锁（favInFlightRef/voteInFlightRef），三连点实测仅 1 发请求
2. RoleLoginModal 成功回调与 onClose 顺序：原 onClose 先于 onLoginSuccess 会让消费方 onClose 清理“待重放引用”时误伤刚投递的重放 → 调整为 onLoginSuccess 先触发（Layout 用法零影响）

## 已知边界（记录不阻塞）

- 401 走全局弹窗时若用户关弹窗后另经顶栏登录，pending 重放引用不随全局弹窗关闭清理（本组件弹窗路径已清理）；重放的动作是用户此前主动发起的收藏/评价，行为与 AC-FN-03「登录后完成被中断操作」一致
- 测试期间共享后端被并行任务以同角色重登（token 被顶替），出现一次 401——恰好实测了 401 全链路，非本任务缺陷

## 实现产物

- `docs/reports/IT-04/FE-03/FE-03-impl.png`（全页 1256×1803，游客基线态：☆187 / 无评价选中 / 底部关联推荐 2 卡）
- `docs/reports/IT-04/FE-03/FE-03-share-modal.png`（分享弹窗打开态视口截图）
