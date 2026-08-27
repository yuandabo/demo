# FE-04 自测报告（IT-03 · portal 模拟 ERP 工作台 #/workbench）

- **任务ID**: IT-03/FE-04
- **测试时间**: 2026-08-22
- **测试方式**: agent-browser（Edge 151 headless CDP，1366×900）+ 真实后端 3000（仅列表页集成消费 categories/tutorials；工作台页本身 0 接口）
- **构建**: `npm run build`（tsc --noEmit + vite build）0 Error；无 lint 命令
- **单测**: web 无测试命令（无 vitest/jest），按 frontend-dev 规范跳过，依赖浏览器验证（本页为纯 mock 静态展示 + 3 个路由跳转交互，无逻辑层）

## AC 验证结论

| AC | 结论 | 关键证据 |
|---|---|---|
| UI-IXD-14 模块卡入口 | pass | 4 张卡"查看教程 →"逐张点击：BOM/MRP→`#/list?erpModule=produce`、待办审批→`purchase`、库存预警→`inventory`（阻断 categories 请求后 URL 保持 `#/list?erpModule=produce` 可直接断言）；恢复后 FE-03 归一化 categoryId=4/5/6，分类树选中 生产制造/采购管理/库存管理，列表按分类过滤（3/3/2 篇），URL replace 写回 |
| UI-IXD-15 教程中心入口 | pass | 顶栏"📚 教程中心"胶囊与右下悬浮 fab（🎧 蓝渐变胶囊+橙点）均跳 `#/` 且首页正常渲染；portal 顶栏"模拟工作台"（FE-01）反向进入 `#/workbench` 渲染正常，双向可达 |

## 页面渲染完整性（DOM 断言）

- ERP 顶栏：深色渐变 sticky、logo"嘉立创云ERP"、7 菜单项（"工作台"高亮）、右侧"📚 教程中心"胶囊 + 头像"张 / 采购 · 张伟"
- 左侧栏：200px 白底、6 项（"📊 仪表盘"蓝底高亮、"🛒 采购申请"橙色徽章"3"）
- KPI×4：7（蓝）/ 12 / 3（橙）/ 5（橙），说明色 绿向好/灰/橙/橙 与设计稿行内色一致
- 模块卡×4：BOM 管理列表 / MRP 算料结果 / 待办审批 / 库存预警，各含表头 + 恰好 3 行简表（状态胶囊 ok/ing/warn/off、净缺料红字 lack）、hint 文案、橙色"查看教程 →"按钮（testid：wb-tutorial-btn-{bom,mrp,approval,stock}）
- fab：fixed right 22px / bottom 26px / z-index 60 实测精确匹配
- 独立路由生效：页面内无 portal .topbar / .footer 泄漏（设计稿整页即 ERP 壳，不套 portal 布局）
- Console：仅存量 React Router future flag 警告（全站既有，非本任务引入），0 error

## 复刻自检

FE-04-impl.png（1366×900 全页）对照 ui_portal_workbench.html（同视口截图）：深色顶栏/侧栏/KPI 四列/2×2 模块卡/fab 逐区核对一致（含简表 12 行数据文案、状态胶囊配色、hint 与按钮文案）。注：整页截图中 fab 呈现在页面中部覆盖模块卡——fixed 元素在 full-page 截图的固有表现，设计稿对照图同样呈现，非实现偏差；已知几何：页面高度≈视口高度时 fab 与库存卡按钮底缘约 9px 重叠（与设计稿 docH 894 vs 896 一致），≥900px 视口点击点不受影响。

## 实现说明

- 页面数据全部为 Workbench.tsx 内 mock 常量（erpModule：bom/mrp→produce、approval→purchase、stock→inventory），0 接口调用（PRD §7.5 模拟演示页）
- 样式独立 Workbench.css 且全部收敛在 `.wb` 根类作用域（portal.css 存在同名全局 .btn/.btn-o/.crumb 且打包顺序在后，作用域隔离防污染）
- 顺带清理：portal.css 移除 .page-ph 占位样式块、App.tsx 删除 Placeholder（原注释约定本任务交付后移除）
- ERP 菜单/侧栏菜单为装饰性自链（`href="#/workbench"`，同设计稿 ui_portal_workbench.html 自链口径），无 JS 绑定故不加 data-testid；三处真实入口均有 testid（wb-tc-entry / wb-tutorial-btn-* / wb-fab）
