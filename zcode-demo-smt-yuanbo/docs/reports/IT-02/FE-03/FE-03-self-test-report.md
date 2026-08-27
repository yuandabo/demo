# FE-03 自测报告（IT-02 · 教程列表页 #/tutorial）

- **任务ID**: IT-02/FE-03
- **测试时间**: 2026-08-21
- **测试方式**: agent-browser 真实后端 3000 浏览器验证（prod dist :3000；种子数据 24 篇 = 已发布18 + 待审核3 + 草稿2 + 已下架1）
- **实现文件**: `web/src/admin/pages/TutorialList.tsx`（新增）、`web/src/admin/components/Toast.tsx`（新增，FE-04/05 可复用）、`web/src/shared/format.ts`（新增，fmtNum/fmtTime 自 Dashboard 抽提去重）、`web/src/shared/types.ts`（+AdminTutorial）、`web/src/admin/admin.css`（追加列表段样式）、`web/src/admin/App.tsx`（路由替换占位）、`web/src/admin/pages/Dashboard.tsx`（改用 shared/format）
- **构建**: `npm run build`（tsc --noEmit + vite build）0 Error；无 lint/test 脚本（工程未配置，按 frontend-dev 规范跳过单测走浏览器验证）

## AC 验证

| AC | 结果 | 详情 |
|---|---|---|
| UI-ELEM-07 | **pass** | 四态标签色正确（草稿灰/待审核橙/已发布绿/已下架灰蓝，badge-offline 按设计稿口径）；驳回原因黄底行仅草稿且 rejectReason 非空渲染（id22 "⚠ 驳回原因：第3步截图含未发布界面，请替换"，全表恰 1 条）；DOM 断言 `published:4 / offline:1 / draft+del:2 / pending:3`——**删除按钮仅纯草稿行渲染**（已发布/待审核/已下架 0 个删除入口）；3 个待审核行编辑按钮全部 disabled（title"待审核状态请先撤回"） |
| AC-OP-03 | **pass** | 下架为自绘 Modal（"⬇️ 下架确认" + 动态《销售订单 13 态状态机详解》+ 影响说明 + 红色确认按钮，截图 FE-03-offline-modal.png）；取消路径行不变；确认后行内即时更新：badge→已下架、操作列→编辑/重新发布/复制、浏览/收藏/有帮助率 3 列灰显（muted） |
| AC-OP-06 | **pass** | 删除自绘 Modal（"🗑 删除教程" + "仅从未通过审核的纯草稿可删除"说明，截图 FE-03-delete-modal.png）；取消行保留；确认后行移除 + toast"已删除" + 计数汇总 25→24（草稿 3→2）联动刷新；纯草稿（hasOnlineVersion=false）才有入口 |
| AC-EG-08 | **pass** | admin 复制生成"系统管理员"名下纯草稿 → operator 登录点其删除并确认 → toast"无权限执行该操作"（403）+ 行仍在列表 |
| AC-OP-07 | **pass** | id19（修改版 v2 回审中）撤回 → 草稿（副行"被驳回后修改中"）→ 再次提审 → 待审核，标题角标变"修改版 v3 · 回审中"（submitCount 2→3 恰一次递增） |
| AC-FN-11 | **pass** | offline 行一键"重新发布" → badge 已发布、操作列恢复编辑/下架/复制、计数延续（1,725 不清零）、无中间态提示 |
| AC-FN-12 | **pass** | 复制 → toast"已复制为新草稿（副本）· 浏览 / 收藏计数清零"；列表出现"小程序车间扫码报工（副本）"纯草稿（副行"纯草稿 · 从未提审"）；源行状态计数不变 |
| AC-RULE-01~04 | **pass** | 四态行渲染语义正确：草稿计数"—"、首次待审计数"—"、回审待审显示线上计数（1,876/96/45.0% 且 <50% 标红）、已下架计数灰显保留、已发布正常 |
| AC-EG-03 | **pass** | 撤回后连点提审两次：仅发一次请求（第二次点击时按钮已随状态消失/防抖禁用），toast 仅一条"已提交审核"，无重复提示；submitCount 恰 +1（v3 角标佐证） |
| UI-IXD-17 | **pass** | 状态筛选（draft→2 行）、关键词（MRP→4 行）、组合（published+MRP→3 行）均刷新返回；重置恢复默认全量；分类下拉两级树（12 分类）可选 |

## 交互与专项验证

| 项 | 结果 | 详情 |
|---|---|---|
| 置顶（ADT-LST-TOP） | pass | 已发行星标 ★ on（橙）+ 标题"置顶"角标显隐 + toast；非已发行星标禁用 title"仅已发布教程可置顶"（DOM 断言全 true） |
| 排序值（ADT-LST-SRT） | pass | 60→55 失焦保存 toast"排序值已保存为 55…"，输入框同步 55；0-999 clamp |
| 分页 | pass | 页码 1/2/3 + 首末禁用；文案"共 24 条记录（已发布 18 + 待审核 3 + 草稿 2 + 已下架 1）· 当前第 1 / 3 页"（4 个轻量计数请求实时联动）；筛选态切"筛选命中 N 条" |
| operator 权限 | pass | DOM 断言 offline/republish 按钮 0 个（入口隐藏）；自己名下草稿删除/提审可用；截图 FE-03-operator-view.png |
| 403/409 统一错误 | pass | 403 → toast"无权限执行该操作"（AC-EG-08 实测）；409 → API 契约实测二次下架返回"该教程状态已变化，请刷新"，前端统一 toastActionError → 409 自动刷新列表 |
| 三态 | pass | Loading：6 行骨架 shimmer；空态：📭暂无数据 + "清空筛选条件"引导（无筛选时为"新建教程"引导）；正常态全量渲染 |
| 复刻自检 | pass | FE-03-impl.png 与 ui_admin_tutorial_list.html 比对：筛选栏/表头 10 列顺序/四态 badge/黄底驳回行/星标+排序框/分页文案/45.0% 红标/置顶角标 全一致（读图 9/9 确认） |

## 说明与偏差（均可溯源）

1. **驳回原因行不含"（审核人 · 时间）"**：GET /api/tutorials 管理口径仅返回 `rejectReason` 字符串（契约无 reviewer/reviewedAt 列），设计稿中该段为静态手写数据，故渲染为"驳回原因：{reason}"。
2. **badge-offline 为灰蓝**：任务元素表写"已下架红"，但复刻源 ui_admin_tutorial_list.html 的 `.badge-offline` 为灰蓝（#475569/#e2e8f0），按复刻源 1:1 落地（截图比对为验收口径）。
3. **排序值上限 0-999**：任务/设计稿口径（API 契约上限 9999，前端按任务收紧 clamp）。
4. **副本草稿 sort=100**：后端 copy 行为（非保持源 sort），副本出现在排序值 100 组头部，前端按服务端排序渲染。

## 交付物

- `docs/reports/IT-02/FE-03/FE-03-impl.png`（全页实现图）
- `docs/reports/IT-02/FE-03/FE-03-offline-modal.png` / `FE-03-delete-modal.png` / `FE-03-operator-view.png`
- 测试后已 `POST /api/system/reset` 还原种子（复核 24=18+3+2+1）
