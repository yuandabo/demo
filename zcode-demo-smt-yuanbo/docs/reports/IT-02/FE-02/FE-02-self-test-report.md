# FE-02 自测报告（IT-02 · 统计看板页 #/dashboard）

- **任务ID**: IT-02/FE-02
- **测试时间**: 2026-08-21
- **测试方式**: agent-browser 真实后端 3000 浏览器验证（dev :5173 + prod dist :3000 双口径）
- **实现文件**: `web/src/admin/pages/Dashboard.tsx`（新增）、`web/src/admin/admin.css`（追加看板样式）、`web/src/admin/App.tsx`（路由替换占位）、`web/src/shared/types.ts`（新增 8 个统计类型）

## AC 验证

| AC | 结果 | 详情 |
|---|---|---|
| AC-FN-14 | **pass** | 4 指标卡（19篇/31,590/0/88%，口径文案齐全）；Top10 条形按浏览量比例渲染（宽度 100/57/47/42/39/37/34/34/30/29）、Top1 橙渐变其余蓝渐变、进场 0.8s 宽度动画；反馈表倒序 + 留言展开；覆盖度矩阵 + 模块聚合双 Tab |
| AC-EG-12 | **pass** | 外部清空 tutorials/categories/favorites/feedbacks 后：三区域均显示"暂无数据" + "导入种子数据"引导入口（点击展开种子初始化说明）；指标卡 0/0/0/—；控制台无错误、不白屏。验证后 POST /api/system/reset 已还原种子 |
| UI-ELEM-03 | **pass** | notHelpfulRate=56.1%（>50%）行渲染 row-red：整行红底 #fef2f2、红字红条 #dc2626；22.5% 行正常灰条；null 行显示"—"且沉底（API 契约排序）、不标红 |
| UI-ELEM-04 | **pass** | isBlank=true 分类（系统设置/开放平台）橙虚线框 #fdba74 + 橙底 + "待补充"角标 + 橙色计数；模块聚合空白行橙色条 + "0 篇 · 待补充"橙字 |

## 交互验证

| 交互 | 结果 | 详情 |
|---|---|---|
| 1 页面初始化加载 | pass | 三端点并行 GET（prod 实测 performance resource 恰好 3 条：overview/feedback/coverage 各一次）；skeleton 骨架（指标卡 shimmer + 区域占位）；条形动画展开 |
| 2 展开留言明细 | pass | 经 API 造数（POST /api/feedbacks/:id helpful=0+comment）后：仅 2 行有箭头（19 红行 / 14 普通行），无留言行箭头隐藏；点击箭头 rotate 90° + 插入黄底明细行（✉ 标题/头像/用户·时间/留言），再点收起 |
| 3 覆盖度 Tab 切换 | pass | 分类网格 ↔ 模块聚合本地切换；模块条宽按篇数占比（100%/60%/40%/20%，空白 4%）；空态时两面板各自"暂无数据" |
| operator 只读视图 | pass | operator 登录 #/dashboard 与 admin 同视图渲染正常（守卫放行，无写操作入口） |

## 三态验证

- **Loading**：指标卡 sk 骨架 ×4 + 三区域 sk-block 占位 ✓
- **空态**：见 AC-EG-12 ✓
- **正常**：种子数据全量渲染，截图比对设计稿结构一致（analyze_image 复刻自检：4 指标卡/双栏 5fr:7fr/Top1 橙/红行红条/橙虚线角标均确认）✓

## 类型检查 / 构建

- `tsc --noEmit`：0 Error（注：本机 Node 默认堆偏低，需 `NODE_OPTIONS=--max-old-space-size=2048`，属环境问题非代码问题）
- `vite build`：成功（admin chunk 15.93 kB js + 14.06 kB css）
- Lint：项目无 lint script，跳过
- 单测：web 无测试命令（无 vitest），按 frontend-dev 规范跳过，依赖浏览器验证

## 与设计稿的可溯源偏离（均溯源到任务元素表/API 契约）

1. page-desc 用任务规定口径文案，去掉设计稿演示性"更新于 …"时间戳（无接口字段）
2. 指标卡 trend 去掉"较上周 +2"（无接口字段），保留口径类文案
3. 留言明细标题去掉演示专用"v2 修改版已提审…"后半句
4. 模块聚合视图无"不限（通用分类）"灰条行——API 契约 modules 仅含已映射模块
5. 分类视图 legend 用动态分类数（matrix.length），不用设计稿硬编码"12 个 × 18 篇"
6. 留言 meta 用 API 字段 `displayName · updatedAt`（设计稿为脱敏手机号+角色，接口无此数据）
7. 空态"导入种子数据"入口点击展开种子初始化说明（应用内无文档页可跳转，说明文案含 server 脚本与 POST /api/system/reset 两种方式）

## 遗留 / 说明

- dev 模式 React StrictMode 双挂载导致每端点 2 次请求（React dev 行为，全站一致）；prod 构建实测恰好 3 端点各 1 次
- 测试期间通过 API 造的验证数据（零反馈教程 + 2 条留言）已随 system/reset 清除，种子已还原基线（12 分类/24 教程）

## 实现图

- `FE-02-impl.png`（种子数据正常态全页）
- `FE-02-empty-state.png`（空库空态全页）
