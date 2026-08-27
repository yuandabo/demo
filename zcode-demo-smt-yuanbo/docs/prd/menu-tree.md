# 云ERP教程中心 · UI 菜单交互树（menu-tree）

> 状态：正式 | 版本：v1.0 | 日期：2026-08-20 | 来源：`docs/prd/PRD.md`（RE00001）
> 结构约定：**端（根）→ 页面 L2（含路由建议）→ 菜单/导航区块 → 操作入口（交互节点 L3/L4，toast L5）**，每个页面标注 PRD §7 来源。

## 0. 三端页面与路由总表

| 端 | # | 页面 | 路由建议 | PRD 来源 |
|---|---|---|---|---|
| PC 前台 portal | P1 | 教程首页 | `/portal` | §7.1 |
| PC 前台 portal | P2 | 教程列表页 | `/portal/list?categoryId=&tag=&q=` | §7.2 |
| PC 前台 portal | P3 | 教程详情页 | `/portal/detail/:id` | §7.3 |
| PC 前台 portal | P4 | 我的（收藏与历史） | `/portal/my` | §7.4 |
| PC 前台 portal | P5 | 模拟 ERP 工作台 | `/portal/workbench` | §7.5 |
| 管理后台 admin | A0 | 后台登录 | `/admin/login` | §7.11 |
| 管理后台 admin | A1 | 统计看板 | `/admin/dashboard` | §7.9 |
| 管理后台 admin | A2 | 教程管理列表 | `/admin/tutorial` | §7.6 |
| 管理后台 admin | A3 | 教程编辑器 | `/admin/tutorial/edit/:id`（新建为 `/admin/tutorial/edit/new`） | §7.6 |
| 管理后台 admin | A4 | 审核队列 | `/admin/review` | §7.7 |
| 管理后台 admin | A5 | 目录管理 | `/admin/category` | §7.8 |
| 小程序 H5 端 m | M1 | 首页 | `/m` | §7.10 |
| 小程序 H5 端 m | M2 | 列表与搜索 | `/m/list?categoryId=&q=` | §7.10 |
| 小程序 H5 端 m | M3 | 详情页（扫码直达落点） | `/m/detail/:id` | §7.10 |
| 小程序 H5 端 m | M4 | 收藏与历史 | `/m/favorite` | §7.10 |
| 小程序 H5 端 m | M5 | 学习打卡页 | `/m/checkin` | §7.10 |

公共弹窗：选角色登录（前台/小程序共用，§7.11）；后台按角色显隐菜单（§7.11/§10：运营编辑不可见审核队列/目录管理，看板只读）。

## 1. 图例与约定

- 层级：L1 入口级 / L2 页面级 / L3 功能场景级 / L4 弹窗与子页面 / L5 反馈级
- 区域：C 主内容区(1) / F 全屏(10) / E 居中弹窗(100) / D 确认弹窗(200) / S 侧边抽屉(100) / T toast(999)
- 尺寸：C/F 用百分比；E/D 用像素；S 用百分比；toast 不标尺寸
- 语法：`click / fill / hover / longpress / dragTo / scroll / → / + / transition: / state: / precondition: / fail: / expect:`
- 节点编号：3 段式（端模块-功能-动作），全局唯一；布局与内容节点不编号
- 异步区块三态必标；loading 必须带 `skeleton(具体描述)` 或 `spinner("文案")`

---

## 2. PC 前台 portal（§7.1–§7.5）

```text
L1: [教程中心] 顶部导航入口（云ERP全局导航挂接，全局可达，未登录可浏览）（§7.1/§8）
│
├── L2: 教程首页 /portal [C区 100%×100%]（§7.1）
│   │
│   ├── 顶部导航条（布局）
│   │   └── POR-HOM-NAV  click [教程中心]
│   │           → L2: 教程首页 /portal [C区 100%×100%]
│   │           expect: ERP 任意页面点击均回到教程首页
│   │
│   ├── 角色推荐位（布局，已登录按 ERP 角色匹配模块映射取浏览量 Top6；未登录=全站 Top6）
│   │   state: { loading: skeleton(6 张横排教程卡片骨架),
│   │             empty: "暂无推荐教程" + click [去分类浏览] → 锚定分类宫格,
│   │             error: "加载失败" + click [重试] }
│   │   └── POR-HOM-REC  click [推荐教程卡片]
│   │           → L3: 教程详情页 /portal/detail/:id [C区 100%×100%]
│   │           transition: fade 200ms
│   │           fail: { timeout: toast("加载超时，请重试"), 500: toast("服务异常，稍后重试") }
│   │           expect: 详情打开且浏览量 +1（AC-FN-17）
│   │
│   ├── 最近更新区块（布局，已发布按更新时间倒序 Top6）
│   │   state: { loading: skeleton(2 行列表骨架), empty: "暂无更新", error: "加载失败" + click [重试] }
│   │   └── POR-HOM-NEW  click [最近更新卡片]
│   │           → L3: 教程详情页 [C区 100%×100%]
│   │           fail: { timeout: toast("加载超时"), 500: toast("服务异常") }
│   │
│   ├── 热门教程区块（布局，已发布按浏览量倒序 Top6）
│   │   state: { loading: skeleton(2 行列表骨架), empty: "暂无热门教程", error: "加载失败" + click [重试] }
│   │   └── POR-HOM-HOT  click [热门教程卡片]
│   │           → L3: 教程详情页 [C区 100%×100%]
│   │           fail: { timeout: toast("加载超时"), 500: toast("服务异常") }
│   │
│   ├── 分类宫格（布局，已启用一级分类 12 个：8 大模块 + 新手入门/最佳实践/常见问题/开放平台）
│   │   ├── 内容节点：角标=该分类已发布教程数；0 篇显示"待补充"
│   │   └── POR-HOM-CAT  click [分类宫格卡片]
│   │           → L3: 教程列表页 /portal/list?categoryId=:id [C区 100%×100%]
│   │           transition: slide-left 300ms
│   │           expect: 列表页左侧分类树选中该分类且右侧联动（AC-FN-01）
│   │           fail: { timeout: toast("加载超时，请重试"), 500: toast("服务异常") }
│   │
│   └── 右上角账号区（布局）
│       └── POR-HOM-LGN  click [登录]
│               → L4: 选角色登录 [E区 420×520px]（见 P3 后公共弹窗）
│               precondition: 未登录 | :已登录 → 显示角色名 + click [退出] + toast("已退出")
│
├── L2: 教程列表页 /portal/list [C区 100%×100%]（§7.2）
│   │
│   ├── 搜索栏（布局）
│   │   ├── POR-LST-SRC  fill [关键词搜索框] → 回车触发搜索
│   │   │       expect: 命中标题/摘要/标签三字段，1s 内返回（AC-FN-02）
│   │   │       state: { loading: spinner("搜索中…"),
│   │   │                 empty: "未找到相关教程" + click [清空筛选] / click [去分类浏览],
│   │   │                 error: "搜索超时，请重试" + click [重试] 或走分类浏览 }
│   │   │       fail: { timeout(1s): toast("搜索超时，请重试"), 500: toast("服务异常") }
│   │   └── POR-LST-CLR  click [清空筛选]
│   │           expect: 分类/标签/关键词全部复位，列表恢复全量已发布教程
│   │
│   ├── 左侧分类树（布局，仅启用分类）
│   │   └── POR-LST-CAT  click [分类树节点]
│   │           expect: 右侧列表联动刷新；上下篇顺序=该分类内排序
│   │           fail: { timeout: toast("加载超时"), 500: toast("服务异常") }
│   │
│   ├── 标签筛选区（布局，标签集合从已发布教程聚合）
│   │   └── POR-LST-TAG  click [标签]
│   │           expect: 多选交集筛选，选中态高亮，可再次点击取消
│   │
│   ├── 列表区（布局，卡片=标题/摘要/标签/浏览量/收藏量/更新时间；置顶带"置顶"角标排最前）
│   │   state: { loading: skeleton(10 张列表卡片骨架),
│   │             empty: "该分类下暂无教程" + click [浏览全部分类],
│   │             error: "加载失败" + click [重试] }
│   │   └── POR-LST-OPN  click [教程卡片]
│   │           → L3: 教程详情页 /portal/detail/:id [C区 100%×100%]
│   │           transition: slide-left 300ms
│   │           expect: 记录浏览历史并进入详情
│   │           fail: { timeout: toast("加载超时，请重试"), 500: toast("服务异常") }
│   │
│   └── 互动前置（事件节点：未登录点击收藏/评价）
│       └── 触发 → L4: 选角色登录 [E区 420×520px]，登录后回到原页面原位置继续操作（AC-FN-03）
│
├── L2: 教程详情页 /portal/detail/:id [C区 100%×100%]（§7.3）
│   │
│   ├── 顶部返回条（布局）
│   │   └── POR-DTL-BCK  click [← 返回列表]
│   │           → L2: 教程列表页（保留原筛选条件）[C区 100%×100%]
│   │
│   ├── 视频区（布局）
│   │   └── POR-DTL-VID  click [视频播放]
│   │           precondition: 视频外链有效 | :失效 → 占位图 + "视频暂不可用，可先阅读图文步骤"（正文可读，§9）
│   │           expect: 点击后才播放（提示流量，不自动播放，§11）
│   │
│   ├── 图文正文区（布局，步骤式内容渲染步骤序号）
│   │   └── POR-DTL-STP  click [步骤完成勾选框]
│   │           + 进度百分比更新并保存（云端）
│   │           expect: 再次进入（含小程序端）勾选状态一致
│   │           fail: { timeout: toast("进度保存失败，已本地暂存"), 500: toast("服务异常") }
│   │
│   ├── 侧边目录锚点（布局，列出正文各级标题）
│   │   └── POR-DTL-ANC  click [锚点标题]
│   │           expect: 正文平滑滚动定位到对应小节（transition: smooth）
│   │
│   ├── 正文工具条（布局）
│   │   └── POR-DTL-FSZ  click [字号档位：标准/大/特大]
│   │           expect: 仅影响正文，三档切换，本地记忆（P2）
│   │
│   ├── 阅读进度（事件节点：按滚动位置自动保存百分比，跨端同步）
│   │   └── 再次进入 → L4: 继续阅读 [D区 400×200px]
│   │           ├── POR-DTL-RSM  click [继续阅读] → 定位到上次进度位置（AC-FN-04）
│   │           └── POR-DTL-RST  click [从头阅读] → 回正文顶部，进度重新累计
│   │
│   ├── 上下篇导航（布局，同分类内按排序）
│   │   ├── POR-DTL-PRV  click [上一篇] → L3: 教程详情页 /portal/detail/:prevId [C区 100%×100%]
│   │   │       precondition: 存在上一篇 | :disabled（置灰）
│   │   └── POR-DTL-NXT  click [下一篇] → L3: 教程详情页 /portal/detail/:nextId [C区 100%×100%]
│   │           precondition: 存在下一篇 | :disabled（置灰）
│   │
│   ├── 互动区（布局）
│   │   ├── POR-DTL-FAV  click [收藏] / 再次点击 [取消收藏]
│   │   │       precondition: 已登录 | :未登录 → L4: 选角色登录 [E区 420×520px]，登录后回原位完成收藏（AC-FN-03）
│   │   │       + toast("已收藏") / toast("已取消收藏")
│   │   │       expect: 收藏数实时更新；小程序端收藏列表同步可见（AC-FN-15）
│   │   │       fail: { timeout: toast("操作超时，请重试"), 500: toast("服务异常") }
│   │   ├── POR-DTL-HEL  click [有帮助]
│   │   │       precondition: 已登录 | :未登录 → 弹选角色登录
│   │   │       expect: 选中态高亮；已评过可切换为没帮助（有帮助-1 没帮助+1，AC-FN-05）
│   │   ├── POR-DTL-NHP  click [没帮助]
│   │   │       precondition: 已登录 | :未登录 → 弹选角色登录
│   │   │       expect: 选中态高亮 + 内联展开留言框（选填）
│   │   ├── 留言框（内联区块，仅评价"没帮助"时展开）
│   │   │   ├── POR-DTL-MSG  fill [留言框]（≤200 字，超限前端截断提示）
│   │   │   └── POR-DTL-MSB  click [提交留言]
│   │   │           + toast("感谢反馈")
│   │   │           expect: 留言仅进后台反馈分析，前台不公开展示（§4 Out of Scope #4）
│   │   │           fail: { timeout: toast("提交失败，请重试"), 500: toast("服务异常") }
│   │   └── POR-DTL-SHR  click [分享]
│   │           → L4: 分享弹窗 [E区 480×420px]
│   │
│   ├── 关联推荐区（布局，同分类已发布教程排除本篇取 4 篇）
│   │   └── POR-DTL-REL  click [关联推荐卡片]
│   │           → L3: 教程详情页 /portal/detail/:id [C区 100%×100%]
│   │
│   └── 已下架态（事件节点：从收藏/历史进入已下架教程）
│       ├── 内容节点：页面提示"该教程已下架"，正文不可见 + 同类推荐列表
│       └── expect: 不展示正文，仅提示与推荐（§7.3）
│
├── L4: 分享弹窗 [E区 480×420px]（§7.3）
│   ├── 内容节点：教程链接 + 二维码（二维码内容=该教程小程序端 URL，扫码直达同篇，AC-FN-06）
│   ├── POR-DTL-LNK  click [复制链接]
│   │       + toast("链接已复制")
│   └── POR-DTL-SCL  click [关闭] → 返回详情页原位置
│
├── L2: 我的（收藏与历史） /portal/my [C区 100%×100%]（§7.4）
│   │
│   ├── Tab: 收藏（默认）
│   │   ├── POR-MY-FAV  click [收藏 Tab]
│   │   │       expect: 按收藏时间倒序；已下架教程灰显并标注"已下架"
│   │   │       state: { loading: skeleton(8 行收藏卡片骨架),
│   │   │                 empty: "暂无收藏，去浏览教程" + click [去浏览] → L2: 教程首页,
│   │   │                 error: "加载失败" + click [重试] }
│   │   └── POR-MY-OPN  click [收藏项]
│   │           precondition: 教程未下架 | :已下架 → 置灰不可点，进入则显示已下架提示页
│   │           → L3: 教程详情页 [C区 100%×100%]
│   │
│   └── Tab: 浏览历史
│       ├── POR-MY-HIS  click [浏览历史 Tab]
│       │       expect: 按最近阅读时间倒序，显示阅读进度百分比
│       │       state: { loading: skeleton(8 行历史卡片骨架), empty: "暂无浏览记录", error: "加载失败" + click [重试] }
│       └── POR-MY-RSM  click [历史项]
│               → L3: 教程详情页并从进度处续读 [C区 100%×100%]
│               expect: 自动触发"继续阅读"定位（AC-FN-04）
│
├── L2: 模拟 ERP 工作台 /portal/workbench [C区 100%×100%]（§7.5，demo 模拟页）
│   │
│   ├── 侧边模块菜单（布局：销售/采购/生产/库存等模块占位入口）
│   │   └── POR-WKB-MOD  click [侧边模块菜单项]
│   │           expect: 右侧切换为该模块占位卡片区
│   │
│   ├── 模块卡片区（布局，还原云ERP工作台框架的占位卡片）
│   │   └── POR-WKB-ENT  click [卡片右下角"查看教程"]
│   │           → L3: 教程列表页 /portal/list?categoryId=:mapped [C区 100%×100%]
│   │           expect: 选中该模块映射的分类并联动列表（§8 模块映射联动）
│   │           fail: { 分类已停用: 跳列表页并 toast("该模块关联分类已停用") }
│   │
│   └── 新手引导占位（内容节点：首次进入弹窗位本期不启用，仅保留交互占位，v1.1 迭代池）
│
└── L4: 选角色登录 [E区 420×520px]（公共，§7.11；前台/小程序共用逻辑）
    ├── 内容节点：销售/采购/生产/仓库/管理/财务 6 个演示角色卡
    ├── PLG-ROL-SL  click [角色卡]
    │       expect: 选中态高亮
    └── PLG-ROL-OK  click [进入]
            expect: 登录态本地保持；回到原页面原位置继续未完成的收藏/评价操作（AC-FN-03）
            fail: { timeout: toast("登录超时，请重试"), 500: toast("服务异常") }
```

---

## 3. 管理后台 admin（§7.6–§7.9、§7.11）

```text
L1: 后台框架（左侧菜单 + 顶栏；按角色显隐：运营编辑仅见教程管理+看板只读，§7.11/§10）
│
├── L2: 后台登录 /admin/login [F区 100%×100%]（§7.11）
│   ├── 事件节点：未登录直接输入后台 URL → 强制跳转本页（§9 权限异常）
│   ├── ADL-LGN-FUL  fill [账号输入框] + fill [密码输入框]
│   └── ADL-LGN-SUB  click [登录]
│           → L2: 统计看板 /admin/dashboard [C区 100%×100%]
│           precondition: 账号密码正确 | :错误 → toast("账号或密码错误")（统一文案，不区分哪项错）
│           fail: { timeout: toast("登录超时，请重试"), 500: toast("服务异常") }
│
├── L2: 统计看板 /admin/dashboard [C区 100%×100%]（§7.9；运营只读）
│   │
│   ├── 总览区（布局：4 指标卡 + 浏览量 Top10 条形图）
│   │   ├── 内容节点：已发布教程数/总浏览量/总收藏量/平均有帮助率；口径=浏览量(打开详情次数)/收藏量(当前有效)/有帮助率(有帮助÷(有帮助+没帮助))/完成率(进度100%历史数÷历史数)
│   │   └── state: { loading: skeleton(4 指标卡+图表骨架),
│   │                 empty: "暂无数据" + click [去新建教程] → L2: 教程管理（空库引导，§9）,
│   │                 error: "加载失败" + click [重试] }
│   │
│   ├── 反馈分析区（布局：按"没帮助占比"倒序列出教程，占比>50% 标红）
│   │   └── AST-FBK-EXP  click [教程行展开]
│   │           expect: 展开查看该教程留言明细（仅后台可见）（AC-FN-14）
│   │           fail: { timeout: toast("加载超时"), 500: toast("服务异常") }
│   │
│   └── 覆盖度统计区（布局：已启用分类 × 已发布教程数矩阵）
│       ├── 内容节点：0 篇分类标"空白区"；按模块映射聚合出模块级覆盖数
│       └── expect: 管理员据此规划补空白内容（§1.3 内容体系治理）
│
├── L2: 教程管理列表 /admin/tutorial [C区 100%×100%]（§7.6）
│   │
│   ├── 筛选条（布局）
│   │   ├── ADT-LST-FLT  select [状态筛选(草稿/待审核/已发布/已下架)] + select [分类筛选]
│   │   │       expect: 列表按条件过滤，含驳回原因列
│   │   └── ADT-LST-SRC  fill [关键词搜索]
│   │           state: { loading: spinner("搜索中…"), empty: "无匹配教程", error: "加载失败" + click [重试] }
│   │
│   ├── 列表区（布局：全状态展示 + 驳回原因列；状态/分类/作者/更新时间）
│   │   state: { loading: skeleton(10 行表格骨架),
│   │             empty: "暂无教程" + click [新建教程],
│   │             error: "加载失败" + click [重试] }
│   │   │
│   │   ├── ADT-LST-ADD  click [新建教程]
│   │   │       → L3: 教程编辑器 /admin/tutorial/edit/new [C区 100%×100%]
│   │   ├── ADT-LST-EDT  click [编辑]
│   │   │       → L3: 教程编辑器 /admin/tutorial/edit/:id [C区 100%×100%]
│   │   │       precondition: 草稿/已驳回/已发布（回审）；待审核需先撤回 | :disabled
│   │   ├── ADT-LST-CPY  click [复制]（源教程任意状态）
│   │   │       + toast("已复制为新草稿")
│   │   │       expect: 生成新草稿（标题加"（副本）"），浏览/收藏/反馈计数清零（AC-FN-12）
│   │   │       fail: { timeout: toast("复制失败，请重试"), 500: toast("服务异常") }
│   │   ├── ADT-LST-DEL  click [删除]
│   │   │       precondition: 仅草稿态可删（运营仅本人名下）| :其他状态 → :hidden（§10）
│   │   │       → L4: 删除确认 [D区 400×200px]
│   │   │           └── ADT-DEL-OK  click [确认删除]
│   │   │                   + toast("已删除")
│   │   │                   expect: 行消失；其他状态需先下架/驳回（§7.6）
│   │   ├── ADT-LST-SUB  click [提交审核]（草稿行）
│   │   │       precondition: 必填项齐（标题/分类/摘要/正文）| :disabled
│   │   │       expect: 草稿→待审核进入队列，前台不可见；连点防抖仅首次生效（AC-FN-07）
│   │   │       fail: { timeout: toast("提交超时，请重试"), 500: toast("服务异常") }
│   │   ├── ADT-LST-WDR  click [撤回]（待审核行）
│   │   │       expect: 回草稿可修改；与管理员审核互斥，后到动作失效 → toast("该教程状态已变化，请刷新")（§9）
│   │   ├── ADT-LST-OFF  click [下架]（已发布行，仅管理员）
│   │   │       → L4: 下架确认 [D区 400×200px]
│   │   │           └── ADT-OFF-OK  click [确认下架]
│   │   │                   expect: 已发布→已下架，前台即时不可见，收藏夹标注"已下架"
│   │   ├── ADT-LST-RPB  click [重新发布]（已下架行，仅管理员）
│   │   │       expect: 一键恢复已发布，不经过审核；前台可见（AC-FN-11）
│   │   ├── ADT-LST-TOP  click [置顶开关]
│   │   │       expect: 前台列表置顶角标排最前，上下篇顺序联动
│   │   └── ADT-LST-SRT  fill [排序值] → 失焦保存
│   │           expect: 影响前台列表与上下篇顺序
│   │
│   └── 权限（事件节点：运营调用审核/发布/下架接口）
│       └── expect: 返回 403 + toast("无权限执行该操作")（AC-FN-18）
│
├── L3: 教程编辑器 /admin/tutorial/edit/:id [C区 100%×100%]（后台主内容区替换，§7.6）
│   │
│   ├── 驳回原因横幅（内容节点：草稿且被驳回时顶部展示原因，驱动修改重提，AC-FN-09）
│   │
│   ├── 基本信息表单（布局）
│   │   ├── ADT-EDT-FLD  fill [标题(≤100字)/摘要(≤200字)/标签(≤5个)]
│   │   │       precondition: 必填齐后方可提审 | :缺失 → 提审时高亮缺失项 + toast("请补全标题/分类/正文后再提交")（§9）
│   │   └── ADT-EDT-SEL  select [所属分类]（仅启用分类树节点，唯一归属）
│   │
│   ├── 富文本编辑器（布局：轻量工具=标题/加粗/列表/图片URL/视频外链）
│   │   └── ADT-EDT-RTE  click [工具条按钮：标题/加粗/列表/插入图片URL/插入视频外链]
│   │           expect: 正文支持步骤式排版；渲染前脚本剥离防注入（§11）
│   │
│   └── 操作条（布局）
│       ├── ADT-EDT-SAV  click [保存草稿]
│       │       + toast("已保存")
│       │       expect: 可反复保存；已发布教程保存 → 自动回待审核，前台持续展示旧版（AC-FN-10）
│       │       fail: { 冲突: toast("他人已保存新版本，请刷新后合并") + click [刷新对比]，
│       │              timeout: toast("保存超时，请重试"), 500: toast("服务异常") }（§9）
│       ├── ADT-EDT-SUB  click [提交审核]
│       │       precondition: 标题/分类/摘要/正文必填齐 | :disabled
│       │       → 草稿进入待审核；expect: 前台不可见（AC-FN-07）
│       │       fail: { 校验失败: 高亮缺失项 + toast("请补全标题/分类/正文后再提交") }
│       └── ADT-EDT-PRE  click [预览]
│               → L4: 前台渲染预览 [E区 960×640px]（P2）
│               expect: 以前台详情页样式渲染当前编辑内容
│
├── L2: 审核队列 /admin/review [C区 100%×100%]（§7.7，仅管理员）
│   │
│   ├── Tab: 人工审核（默认）/ AI 生成审核
│   │   └── ARV-TAB-AI  click [AI 生成审核 Tab]
│   │           expect: 展示 mock 的 AI 生成教程队列（标识"AI 生成"），仅展示不可操作（P2）
│   │
│   ├── 队列列表（布局：待审核按提交时间倒序；分类/作者/提交时间/v2+ 修改版标识）
│   │   state: { loading: skeleton(10 行表格骨架),
│   │             empty: "暂无待审核教程",
│   │             error: "加载失败" + click [重试] }
│   │   ├── ARV-QUE-FLT  select [分类筛选]
│   │   ├── ARV-QUE-OPN  click [查看]
│   │   │       → L4: 内容查看 [E区 960×640px]（以待审核版本内容预览）
│   │   ├── ARV-QUE-APR  click [通过]
│   │   │       expect: 待审核→已发布，记录审核人与时间，前台/小程序即时可见（AC-FN-08）
│   │   │       fail: { 互斥(运营已撤回): toast("该教程状态已变化，请刷新"), timeout: toast("操作超时"), 500: toast("服务异常") }
│   │   └── ARV-QUE-REJ  click [驳回]
│   │           → L4: 驳回弹窗 [E区 520×380px]
│   │
│   └── L4: 驳回弹窗 [E区 520×380px]
│       ├── ARV-REJ-FLD  fill [驳回原因]
│       │       precondition: ≥5 字 | :不足 → :disabled + 提示"请填写至少 5 个字的驳回原因"（前端阻断+后端双校验，§9）
│       └── ARV-REJ-SUB  click [确认驳回]
│               expect: 待审核→草稿，原因展示在编辑页顶部横幅（AC-FN-09）
│               fail: { 互斥: toast("该教程状态已变化，请刷新"), timeout: toast("操作超时"), 500: toast("服务异常") }
│
└── L2: 目录管理 /admin/category [C区 100%×100%]（§7.8，仅管理员）
    │
    ├── 分类树（布局：两级展示，名称/排序/状态/模块映射）
    │   state: { loading: skeleton(树形 12 节点骨架),
    │             empty: "暂无分类" + click [新增分类],
    │             error: "加载失败" + click [重试] }
    │   ├── ACT-TRE-ADD  click [新增分类]
    │   │       → L4: 分类编辑弹窗 [E区 520×420px]
    │   ├── ACT-TRE-EDT  click [编辑]
    │   │       → L4: 分类编辑弹窗 [E区 520×420px]（回填名称/父分类）
    │   ├── ACT-TRE-DEL  click [删除]
    │   │       precondition: 分类下无任何状态教程 | :有教程 → 阻断 + toast("该分类下还有 N 篇教程，请先移走")（AC-FN-13）
    │   │       → L4: 删除确认 [D区 400×200px] → 确认后移除节点
    │   ├── ACT-TRE-DRG  dragTo [分类节点] → [同级目标位置]
    │   │       expect: 同级排序生效，影响前台宫格与列表顺序（也可用排序值调整）
    │   ├── ACT-TRE-ENB  click [启用]
    │   │       expect: 前台宫格/筛选恢复显示
    │   └── ACT-TRE-DSB  click [停用]
    │           expect: 前台隐藏（宫格/筛选），其下已发布教程仍可经收藏/历史/直达链接访问（§13 开放问题 #3）
    │
    ├── L4: 分类编辑弹窗 [E区 520×420px]
    │   ├── ACT-CAT-FLD  fill [分类名称] + select [父分类（两级限制）]
    │   └── ACT-CAT-SAV  click [保存]
    │           + toast("已保存")
    │           fail: { timeout: toast("保存超时，请重试"), 500: toast("服务异常") }
    │
    └── 模块映射维护（布局：分类绑定 ERP 模块，8 选 1 或不限）
        ├── ACT-MAP-SEL  select [ERP 模块]（销售/项目/文件/生产制造/采购/库存/人事财务/系统设置/不限）
        └── ACT-MAP-SAV  click [保存映射]
                + toast("映射已保存")
                expect: 驱动角色推荐与 ERP 内嵌入口命中集即时更新（§8）
                fail: { timeout: toast("保存超时"), 500: toast("服务异常") }
```

---

## 4. 小程序 H5 端 m（§7.10，375px 视口）

```text
L1: 底部 Tab 导航：首页 / 收藏与历史 / 打卡（+ 右上角登录入口）
│
├── L2: 首页 /m [C区 100%×100%]（§7.10）
│   │
│   ├── 搜索框（布局）
│   │   └── MHM-SRC  click [搜索框]
│   │           → L2: 列表与搜索 /m/list [C区 100%×100%]，自动聚焦输入
│   │
│   ├── 角色推荐位（布局：同 §7.1 规则移动版，按 ERP 角色匹配 TopN）
│   │   state: { loading: skeleton(3 张横滑卡片骨架), empty: "暂无推荐" + click [去分类浏览], error: "加载失败" + click [重试] }
│   │   └── MHM-REC  click [推荐卡片]
│   │           → L2: 详情页 /m/detail/:id [C区 100%×100%]
│   │           transition: slide-left 300ms
│   │
│   ├── 分类宫格（布局：已启用分类移动版宫格）
│   │   └── MHM-CAT  click [分类宫格]
│   │           → L2: 列表与搜索 /m/list?categoryId=:id [C区 100%×100%]
│   │
│   ├── 打卡入口（布局）
│   │   └── MHM-CKN  click [打卡入口]
│   │           → L2: 学习打卡页 /m/checkin [C区 100%×100%]
│   │
│   └── 登录入口（布局）
│       └── MHM-LGN  click [登录]
│               → L4: 选角色登录 [S区 100%×70% 底部抽屉]（6 演示角色，逻辑同 PC，登录态与 PC 同库）
│               precondition: 未登录 | :已登录 → 显示角色名 + click [退出]
│
├── L2: 列表与搜索 /m/list [C区 100%×100%]（§7.10）
│   │
│   ├── 搜索栏（布局）
│   │   └── MLS-SRC  fill [关键词搜索框] → 回车搜索
│   │           expect: 命中规则同 §7.2（标题/摘要/标签），1s 内返回
│   │           state: { loading: spinner("搜索中…"),
│   │                     empty: "未找到相关教程" + click [清空筛选] / click [去分类浏览],
│   │                     error/timeout: "搜索超时，请重试" + click [重试] }
│   │
│   ├── 分类 chips（布局：横向滑动单选）
│   │   └── MLS-FLT  click [分类 chip]
│   │           expect: 选中态高亮，列表联动刷新
│   │
│   ├── 列表区（布局：移动端卡片）
│   │   ├── MLS-PTR  dragTo [列表] → [向下拉动] → 松手刷新
│   │   │       + toast("已刷新")
│   │   │       expect: 列表数据重新拉取（下拉刷新）
│   │   └── MLS-OPN  click [教程卡片]
│   │           → L2: 详情页 /m/detail/:id [C区 100%×100%]
│   │           fail: { timeout: toast("加载超时，请重试"), 500: toast("服务异常") }
│   │
│   └── state: { loading: skeleton(6 张移动端卡片骨架), empty: "暂无教程" + click [浏览全部分类], error: "加载失败" + click [重试] }
│
├── L2: 详情页 /m/detail/:id [C区 100%×100%]（§7.10；PC 分享二维码扫码落此页）
│   │
│   ├── 事件节点：扫码直达（PC 详情页二维码 URL 打开即为此页；同篇教程跨端续读）
│   │   └── expect: 与 PC 打开的是同一教程与同一进度数据
│   │
│   ├── 顶部导航（布局）
│   │   └── MDT-BCK  click [← 返回] → 上一页（列表/收藏/扫码进入则回首页）
│   │
│   ├── 视频区（布局）
│   │   └── MDT-VID  click [视频播放]
│   │           precondition: 外链有效 | :失效 → 占位提示"视频暂不可用，可先阅读图文步骤"
│   │           expect: 提示流量，点击才播放（§11）
│   │
│   ├── 图文正文（布局：移动端排版，文字先行图片懒加载，弱网可读 §9）
│   │   ├── MDT-FSZ  click [字号档位：标准/大/特大]
│   │   │       expect: 仅影响正文，三档本地记忆，与 PC 各自记忆
│   │   └── 阅读进度（事件节点：自动保存，与 PC 同步）
│   │       └── 再次进入 → L4: 继续阅读 [D区 400×200px]
│   │           └── MDT-RSM  click [继续阅读] → 定位到进度处（跨端一致，AC-FN-04）
│   │
│   ├── 互动区（布局）
│   │   └── MDT-FAV  click [收藏] / [取消收藏]
│   │           precondition: 已登录 | :未登录 → L4: 选角色登录 [S区 100%×70%]
│   │           + toast("已收藏")
│   │           expect: 与 PC 同库，任一端操作另一端刷新可见（AC-FN-15）
│   │           fail: { timeout: toast("操作超时，请重试"), 500: toast("服务异常") }
│   │
│   └── 已下架态（事件节点：收藏/历史/扫码进入已下架教程）
│       └── 内容节点：提示页"该教程已下架" + 同类推荐，正文不可见
│
├── L2: 收藏与历史 /m/favorite [C区 100%×100%]（§7.10）
│   │
│   ├── Tab 切换（布局）
│   │   └── MFA-TAB  click [收藏 Tab / 历史 Tab]
│   │           expect: 收藏按时间倒序（已下架灰显标注）；历史含进度百分比；数据与 PC 端一致
│   │           state: { loading: skeleton(6 行卡片骨架),
│   │                     empty: "暂无内容，去首页浏览" + click [去首页] → L2: /m,
│   │                     error: "加载失败" + click [重试] }
│   │
│   └── MFA-OPN  click [收藏/历史条目]
│           precondition: 未下架 | :已下架 → 置灰不可点
│           → L2: 详情页 /m/detail/:id [C区 100%×100%]（历史条目从进度处续读）
│
└── L2: 学习打卡页 /m/checkin [C区 100%×100%]（§7.10，P2）
    │
    ├── 今日打卡卡（布局：当前积分/连续天数）
    │   └── MCK-CKN  click [立即打卡]
    │           + toast("打卡成功 +10 积分")
    │           precondition: 当日未打卡 | :已打卡 → :disabled（当日重复点击无效，AC-FN-16）
    │           expect: 积分 +10；连续 7 天触发徽章弹层 + toast("恭喜获得「坚持者」徽章")
    │           fail: { timeout: toast("打卡超时，请重试"), 500: toast("服务异常") }
    │
    └── 徽章墙（布局：坚持者=连续 7 天打卡；百科达人=累计完成 20 篇教程；中断只清连续天数不清积分）
        └── MCK-BDG  click [徽章]
                → L4: 徽章详情 [S区 100%×60% 底部抽屉]
                expect: 展示获得条件与当前进度（如 12/20 篇）
```

---

## 5. 统计与追溯

| 项 | 数量 | 说明 |
|---|---|---|
| 三端页面合计 | 16 | PC 前台 5（§7.1–§7.5）+ 管理后台 6（§7.6–§7.9/§7.11）+ 小程序 5（§7.10） |
| PC 前台 portal | 5 页 | /portal、/portal/list、/portal/detail/:id、/portal/my、/portal/workbench |
| 管理后台 admin | 6 页 | /admin/login、/admin/dashboard、/admin/tutorial、/admin/tutorial/edit/:id、/admin/review、/admin/category |
| 小程序 m | 5 页 | /m、/m/list、/m/detail/:id、/m/favorite、/m/checkin |
| 交互节点 | 92 个（全局唯一编号） | 前台 38 + 后台 33 + 小程序 21 |
| 公共弹窗 | 选角色登录（E区/S区两种形态） | §7.11，前台与小程序复用逻辑 |
| AC 对照 | 覆盖 AC-FN-01~18 主要界面路径 | 详见树内 expect 标注 |

> 编号规则：端前缀 POR(前台)/ADL+ADT+ARV+ACT+AST(后台)/M 前缀(小程序)；动作段 ≤4 字符；编号全局唯一，可直接映射功能树与 Playwright 用例。
