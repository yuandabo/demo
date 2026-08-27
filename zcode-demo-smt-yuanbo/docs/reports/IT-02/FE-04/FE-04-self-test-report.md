# FE-04 自测报告（IT-02 · 教程编辑器页 #/tutorial/edit/:id）

- **任务ID**: IT-02/FE-04
- **测试时间**: 2026-08-21
- **测试方式**: agent-browser 真实后端 3000 浏览器验证（prod dist :3000；种子 24 篇，测试后已 `POST /api/system/reset` 还原）
- **实现文件**: `web/src/admin/components/RichEditor.tsx`（新增，contenteditable+工具条）、`web/src/admin/pages/TutorialEdit.tsx`（新增）、`web/src/admin/admin.css`（追加编辑器段样式）、`web/src/admin/App.tsx`（路由替换占位）、`web/src/shared/types.ts`（+TutorialSaveResult/TutorialSubmitResult/TutorialTopResult）、`web/src/shared/sanitize.ts`（ALLOWED_ATTR 补 class，img-ph 占位回读存活）
- **构建**: `tsc --noEmit` 本任务文件 0 Error（同期并行 FE-05 WIP 的 portal/pages/Detail.tsx 有 1 个未使用变量错误，非本任务文件）；`vite build` 成功；web 工程无 lint/test 脚本（沿 FE-02/03 先例跳过单测走浏览器实测）
- **说明**: agent-browser 会话中途 trusted click 派发失效（CDP 坐标失步），fill/press/eval 正常；交互断言改用 eval 派发事件（同 React 处理链），登录/编辑区聚焦/加粗等真实点击已在失效前覆盖

## AC 验证

| AC | 结果 | 详情 |
|---|---|---|
| AC-RULE-19 | **pass** | id22 草稿 rejectReason 非空 → 顶部黄条"⚠ 驳回原因：第3步截图含未发布界面，请替换"+定位链接+×关闭（点击后本次会话隐藏）；提审后（pending）再进不再显示；非草稿/原因为空不渲染。审核人·时间未渲染——edit-view 契约仅返回 rejectReason 字符串（与 FE-03 列表口径一致的已记录偏差） |
| AC-EG-01 | **pass** | 清空标题提审 → 阻断不发请求 + 标题红框高亮 + error toast"请补全标题/分类/摘要/正文后再提交"，页面不跳转 |
| AC-RULE-18 | **pass** | 标题 101 字（计数"101/100"红色）→ 保存与提审均阻断 toast"标题不超过 100 字"+高亮；摘要 201 字同路径"摘要不超过 200 字"；标签上限见下 |
| AC-EG-03 | **pass** | 提审按钮连点 3 次 → Network 断言 `POST /tutorials/25/submit` 恰 1 次（submittingRef 同步置位，静默防抖）→ toast+返回列表 |
| AC-EG-16 | **pass** | 编辑正文未保存 → location.reload 重进 → 弹"⚠ 恢复未保存的编辑内容"（含快照时间）→ 确认恢复后编辑区含标记文字 + toast"已恢复未保存的编辑内容"；放弃路径清快照以服务端为准 |
| AC-OP-05 | **pass** | 草稿反复保存覆盖（id22/23 多轮 PUT 均成功）；摘要/正文留空可保存（必填仅提审校验）；再进内容完整保留（服务端回填含 content） |
| AC-FN-10 | **pass** | id4 已发布编辑摘要保存 → toast"已保存，进入回审"+状态徽章 已发布→待审核 + updatedAt 刷新（前台旧版不断供由 BE 快照列保证，阶段 3 联调项） |
| AC-FN-07/09 | **pass** | 新建教程（/new）填四项 → 提审（先静默保存 POST id25 再 submit）→ 返回列表行状态待审核；已发布教程回审版场景（id4）同链路验证 |
| AC-EG-05 | **pass** | UI 保存后 admin 并发 PUT 移动 updated_at → UI 再存 → error toast"他人已保存新版本，请刷新后合并"（本地编辑保留）；reload 刷新 baseUpdatedAt 后保存成功 |
| 删除保护 | **pass** | 纯草稿（id23）才有删除入口（已发布/pending/未保存新建均无）；自绘确认弹窗文案逐字匹配"仅'从未通过审核的纯草稿'可删除，确认删除《{title}》？"；取消留页、确认删除返回列表；operator 删 admin 名下草稿 → 403"无权限执行该操作"留页 |

## 交互与专项验证

| 项 | 结果 | 详情 |
|---|---|---|
| 复刻自检 | pass | FE-04-impl.png 与 ui_admin_tutorial_edit.html 读图比对 6 项（告警条/基本信息卡五字段/工具条+编辑区/操作卡/双栏/无破损）全一致；左列 1fr 右列 300px 由 CSS grid 保证 |
| RichEditor | pass | B 加粗（选中文字→`<b>`）、H 步骤标题（formatBlock h2 + CSS counter 序号圆点 ::before）、UL→OL 切换（ul li → ol li）、图片 URL（prompt 输入→.img-ph 占位）、视频 URL（→`<a href>`）、预览切换（contentEditable=false+浅黄底 #fffdf5+工具条禁用+preview-on 高亮，双向）；工具条 mousedown 防选区丢失已修复并回归 |
| 字数计数 | pass | 标题 0/100、11/100；越界 101/100 红；摘要 42/200、201/200 红；标签 n/5 |
| 标签 chips | pass | 回车添加（keydown 合成验证）、去重、5/5 后第 6 个 → error toast"标签最多 5 个"且输入不提交；点 × 移除 5→4 |
| 30s 自动保存 | pass | Network 实测：内容变化后 30s tick 触发 PUT（含 baseUpdatedAt 与全量 camelCase 字段）；32s 无变化 0 新增请求（脏检查防抖）；保存后提示"刚刚已自动保存"（>30s 显示"30 秒前已自动保存"，未保存过显示"自动保存已开启"灰点） |
| 新建流程 | pass | /new 空表单（作者=当前用户、排序 100、前台数据"—"）→ 保存 POST → URL replace 为 /tutorial/edit/25、无重复取数闪断、删除入口随即出现 |
| 置顶/排序 | pass | 已发布 id4：开关可点（开"已置顶，前台列表优先展示（发布后生效）"/关"已取消置顶…"）；非已发布禁用+title"仅已发布教程可置顶"（契约 409 口径）；排序 60→55 失焦保存 toast"排序值已保存为 55（0-999…）" |
| 元信息/状态 | pass | 四态徽章（草稿/待审核/已发布）；作者/创建/更新时间回填与保存后刷新；无线上版本"浏览/收藏/有帮助率 — / — / —（草稿期无前台数据）"，已发布显示 1,725 / 131 / 92.9% |
| 三态 | pass | Loading：双卡骨架 shimmer；错误态（id999）："加载失败：该教程不存在或暂不可见"+返回列表按钮（已实测跳回）；正常态全量渲染 |
| Network 格式 | pass | PUT 载荷 `{title,categoryId,summary,content,videoUrl:null|url,tags,baseUpdatedAt}` camelCase；GET /:id?all=1、POST /submit `{}`、PUT /top `{isTop,sort}`、DELETE 均与契约一致 |

## 说明与偏差（均可溯源）

1. **编辑取数走 GET /api/tutorials/:id?all=1**（任务文件原设想管理列表取行，但列表 SQL 无 content 列）：已记 design/change-log.md CHANGE-7（低风险，目标行为不变）。
2. **驳回黄条不含"（审核人 · 时间）"**：edit-view 契约仅返回 rejectReason；定位链接文案为"定位到正文 →"（设计稿"第 3 步"为其静态 mock 数据）。
3. **标题/摘要输入未设 maxlength**：为使 AC-RULE-18 越界红计数与阻断高亮可呈现/可测（设计稿静态初始值"14/100"同理以真实计数呈现）。
4. **自动保存文案首保存前为"自动保存已开启"（灰点）**：设计稿初始"30 秒前已自动保存"为静态演示值，按会话真实态渲染。
5. **种子正文 h3 步骤**（seed.ts h3+p，自带"第 N 步"文案）在编辑区作标题样式展示、不参与 h2 的 counter 自动编号（编号仅对应"H 步骤标题"工具插入的 h2）。
6. sanitize.ts 白名单补 `class` 属性：RichEditor 产出的 `img-ph` 占位类需在回读净化后存活（class 无脚本执行面）。

## 交付物

- `docs/reports/IT-02/FE-04/FE-04-impl.png`（全页实现图，含驳回黄条）
- `docs/reports/IT-02/FE-04/FE-04-preview-mode.png` / `FE-04-delete-modal.png`（交互态）
- 测试后已 `POST /api/system/reset` 还原种子（24=18+3+2+1）
