# 云ERP教程中心 · 需求功能树（功能地图）

> 来源：`docs/prd/PRD.md`（RE00001 · v1.0 · saas-erp · 场景 A+B）
> 结构：端 → 页面（Page）→ 功能组（Feature Group）→ 原子功能（Feature）/ 流程功能（F- 前缀）
> 编号规则：`{页面缩写}-{功能组缩写}-{功能缩写}`，每段 ≤4 大写字符，全局唯一
> 可追溯性：每个功能末尾标注 PRD 来源章节；异常类功能来源含 §9

## 1. PC 前台

- FHOM 教程首页 /front/home
  - FHOM-NAVG 导航入口
    - FHOM-NAVG-TENT 教程中心入口：用户点击顶部导航"教程中心"，进入教程首页，全局可达，未登录亦可浏览
  - FHOM-RECO 推荐区块
    - FHOM-RECO-ROLE 角色推荐教程：已登录用户进入首页，系统按其 ERP 角色匹配分类模块映射取浏览量 Top6 展示；未登录展示全站浏览量 Top6（§7.1）
  - FHOM-UPDT 最近更新
    - FHOM-UPDT-LIST 最近更新列表：用户查看"最近更新"区块，系统展示已发布且按更新时间倒序 Top6 教程（§7.1）
  - FHOM-HOTR 热门教程
    - FHOM-HOTR-LIST 热门教程列表：用户查看"热门教程"区块，系统展示已发布且按浏览量倒序 Top6 教程（§7.1）
  - FHOM-CGRD 分类宫格
    - FHOM-CGRD-SHOW 分类宫格展示：用户查看已启用一级分类宫格（8 大模块 + 新手入门/最佳实践/常见问题/开放平台共 12 个），角标显示该分类已发布教程数，0 篇显示"待补充"（§7.1）
    - FHOM-CGRD-GOTO 分类宫格跳转：用户点击分类宫格，进入教程列表页并选中该分类（§7.1）

- FLST 教程列表页 /front/list
  - FLST-FLTR 筛选
    - FLST-FLTR-CTGR 按分类筛选：用户在左侧分类树（仅启用分类）选择分类，右侧列表联动显示该分类教程（§7.2）
    - FLST-FLTR-TAGL 按标签筛选：用户从已发布教程聚合的标签集合中多选标签，列表显示同时包含所选标签（交集）的教程（§7.2）
  - FLST-SRCH 搜索
    - FLST-SRCH-KEY 关键词搜索：用户输入关键词，系统命中标题/摘要/标签三字段并 1s 内返回结果；空结果展示引导（清空筛选/去分类浏览）（§7.2）
  - FLST-LIST 列表展示
    - FLST-LIST-CARD 列表卡片展示：用户浏览列表卡片，展示标题/摘要/标签/浏览量/收藏量/更新时间（§7.2）
    - FLST-LIST-TOPD 置顶标识：用户浏览列表，置顶教程带"置顶"角标排在最前（§7.2）
  - FLST-ATHN 互动前置
    - FLST-ATHN-LOGIN 未登录互动引导：未登录用户点击收藏/评价，弹出选角色登录，登录后回到原页面原位置继续操作（§7.2/§9）

- FDTL 教程详情页 /front/detail/:id
  - FDTL-CONT 内容展示
    - FDTL-CONT-RICH 图文视频展示：用户打开详情页，页面渲染富文本正文与视频外链播放，视频失效显示占位提示且图文可读（§7.3/§9）
    - FDTL-CONT-STEP 步骤式渲染：用户阅读步骤式教程，系统按步骤标题拆分渲染步骤序号与进度条（§7.3）
  - FDTL-STPR 步骤进度
    - FDTL-STPR-CHK 勾选完成步骤：用户勾选已完成步骤，进度百分比更新并保存（§7.3）
  - FDTL-TOCN 目录锚点
    - FDTL-TOCN-NAV 目录锚点跳转：用户点击侧边目录的正文标题，页面平滑滚动定位到对应小节（§7.3）
  - FDTL-FSZT 字号调节
    - FDTL-FSZT-ADJ 正文字号调节：用户切换三档字号（标准/大/特大），仅影响正文渲染并本地记忆（§7.3，P2）
  - FDTL-RPRG 阅读进度
    - FDTL-RPRG-SAVE 自动保存进度：用户滚动阅读，系统按滚动位置自动保存阅读百分比（§7.3）
    - FDTL-RPRG-RES 继续阅读提示：用户再次进入读过的教程，弹"继续阅读"提示并可从进度处续读，跨端同步（§7.3）
  - FDTL-PNVN 上下篇
    - FDTL-PNVN-JUMP 上下篇跳转：用户点击上一篇/下一篇，跳转同分类内按排序相邻的教程，无相邻教程时按钮置灰（§7.3）
  - FDTL-ITRC 用户互动
    - FDTL-ITRC-FAV 收藏教程：登录用户收藏/取消收藏教程，收藏数实时更新且两端（PC/小程序）同步（§7.3）
    - FDTL-ITRC-VOTE 有帮助评价：用户在有帮助/没帮助中二选一评价，每篇每人一次可修改，选中态高亮（§7.3）
    - FDTL-ITRC-MSG 反馈留言：用户评价"没帮助"时展开留言框（选填 ≤200 字），提交后仅进入后台反馈分析不公开展示（§7.3）
    - FDTL-ITRC-SHAR 分享教程：用户点击分享，复制教程链接并弹出二维码（二维码内容为该教程小程序端 URL）（§7.3）
  - FDTL-RLTR 关联推荐
    - FDTL-RLTR-SHOW 相关教程推荐：用户查看详情底部，系统按同分类已发布教程（排除本篇）展示 4 篇（§7.3）
  - FDTL-OFFL 已下架处理
    - FDTL-OFFL-SHOW 已下架提示：用户从收藏/历史进入已下架教程，页面提示"该教程已下架"并给同类推荐，正文不可见（§7.3）
  - FDTL-FLOW 入口
    - F-LEARN 用户学习互动流程
      - {##FHOM-CGRD-GOTO}：从首页分类宫格进入列表（或 {##FLST-SRCH-KEY} 搜索定位教程）
      - {##FDTL-RPRG-SAVE}：阅读正文并自动保存进度
      - {##FDTL-ITRC-FAV}：收藏教程
      - {##FDTL-ITRC-VOTE}：评价有帮助/没帮助
      - {##FDTL-ITRC-SHAR}：分享链接与二维码
    - F-CROSSL 跨端续读流程
      - {##FDTL-RPRG-SAVE}：PC 端阅读产生进度
      - {##FDTL-RPRG-RES}：PC 端再次进入提示续读
      - {##MDTL-RPRG-SYNC}：小程序同账号进度同步续读

- FMYP 我的（收藏与历史）/front/my
  - FMYP-FAVL 收藏列表
    - FMYP-FAVL-SHOW 收藏列表展示：用户查看按收藏时间倒序的收藏列表，已下架教程灰显并标注"已下架"不可进入正文，正常项点击进入详情（§7.4）
  - FMYP-HIST 浏览历史
    - FMYP-HIST-SHOW 历史列表展示：用户查看按最近阅读时间倒序的历史列表，显示各教程阅读进度百分比（§7.4）
    - FMYP-HIST-RES 点击续读：用户点击历史条目，从上次保存的进度位置继续阅读（§7.4）

- FERP 模拟 ERP 工作台页 /front/erp-simulator
  - FERP-SIMU 模拟框架
    - FERP-SIMU-SHOW 工作台框架展示：用户打开模拟工作台页，页面还原云ERP工作台框架（侧边模块菜单：销售/采购/生产/库存等占位卡片）（§7.5）
  - FERP-TENT 教程入口
    - FERP-TENT-GOTO 模块查看教程：用户点击模块卡片右下角"查看教程"按钮，跳转教程列表页并选中该 ERP 模块映射的分类（§7.5/§8）
  - FERP-GUID 新手引导占位
    - FERP-GUID-SLOT 引导弹窗占位：首次进入的弹窗交互位本期仅保留占位、不启用（§7.5，迭代池预留）

## 2. 管理后台

- ADLG 后台登录页 /admin/login
  - ADLG-AUTH 账号登录
    - ADLG-AUTH-LOGIN 后台账号密码登录：用户输入账号密码（平台管理员/运营编辑两类角色），校验通过进入管理后台，登录态保持（§7.11）
    - ADLG-AUTH-FAIL 登录错误提示：账号或密码错误时统一提示"账号或密码错误"（§7.11）
    - ADLG-AUTH-GUAD 未登录访问拦截：未登录用户直接输入后台 URL，系统跳转后台登录页（§9 权限异常）

- ADTL 教程管理列表页 /admin/tutorials
  - ADTL-LIST 列表展示
    - ADTL-LIST-SHOW 全状态列表展示：运营/管理员查看全部状态教程（草稿/待审核/已发布/已下架），列表含驳回原因列（§7.6）
    - ADTL-LIST-FLTR 列表筛选：用户按状态/分类/关键词筛选教程，列表联动显示匹配结果（§7.6）
  - ADTL-CRUD 教程管理操作
    - ADTL-CRUD-CRET 新建教程：用户点击"新建"，系统创建草稿教程并进入编辑器（§7.6）
    - ADTL-CRUD-EDIT 编辑教程：用户点击"编辑"，进入编辑器修改指定教程（§7.6）
    - ADTL-CRUD-DELE 删除教程：用户对草稿状态教程二次确认后删除（仅草稿可删，运营仅本人名下；其他状态需先下架/驳回）（§7.6/§10）
    - ADTL-CRUD-COPY 复制教程：用户复制任意状态教程，生成新草稿（标题加"（副本）"），浏览/收藏/反馈计数清零（§7.6）
  - ADTL-PUBS 状态流转操作
    - ADTL-PUBS-SUBM 提交审核：用户提交草稿教程，状态变为待审核并进入审核队列，按钮防抖仅首次生效（§7.6/§9）
    - ADTL-PUBS-WDRA 待审核撤回：运营撤回待审核教程回草稿修改（与管理员审核动作互斥）（§7.6/§7.7）
    - ADTL-PUBS-OFFL 下架教程：管理员将已发布教程下架，前台/小程序即时不可见，收藏夹标注"已下架"（§3.5/§7.6）
    - ADTL-PUBS-REPU 重新发布：管理员一键将已下架教程恢复已发布，内容未变不重审（§3.5/§7.6）
    - ADTL-PUBS-SORT 置顶与排序：用户编辑置顶布尔与排序值，影响前台列表顺序与上下篇顺序（§7.6）
  - ADTL-FLOW 入口
    - F-NEWPUB 新建教程发布流程
      - {##ADTL-CRUD-CRET}：新建草稿教程
      - {##ADED-FORM-BASE}：填写标题/分类/摘要
      - {##ADED-FORM-CONT}：编辑富文本正文
      - {##ADED-SAVE-SUBM}：提交审核（草稿→待审核）
      - {##ADRV-REVO-APPR}：管理员审核通过（待审核→已发布，三端可见）
    - F-EDITRT 已发布编辑回审流程
      - {##ADTL-CRUD-EDIT}：编辑已发布教程
      - {##ADED-SAVE-RTRN}：保存后自动回待审核（前台旧版不断供）
      - {##ADRV-REVO-APPR}：过审后新版替换旧版
    - F-OFFREP 下架重发布流程
      - {##ADTL-PUBS-OFFL}：管理员下架已发布教程
      - {##ADTL-PUBS-REPU}：重新发布恢复可见（不重审）

- ADED 教程编辑器 /admin/tutorials/edit/:id
  - ADED-FORM 内容填写
    - ADED-FORM-BASE 填写基本信息：用户填写标题（≤100 字）/所属分类（启用节点）/摘要（≤200 字）/标签（≤5 个）等字段（§7.6/§6）
    - ADED-FORM-CONT 编辑富文本正文：用户使用轻量富文本工具（标题/加粗/列表/图片 URL/视频外链）编写步骤式正文（§7.6）
    - ADED-FORM-REJN 驳回原因展示：运营打开被驳回教程，编辑页顶部展示驳回原因（≥5 字，作者可见）（§7.6/§7.7）
  - ADED-SAVE 保存与提审
    - ADED-SAVE-DRFT 保存草稿：用户保存草稿，可反复保存不改变状态（§7.6）
    - ADED-SAVE-SUBM 编辑器提交审核：用户在编辑器点击提交审核，必填校验通过后教程进入待审核（§2/§7.6）
    - ADED-SAVE-RTRN 已发布保存回审：用户编辑已发布教程并保存，状态自动回待审核，前台持续展示旧版本（§7.6）
    - ADED-SAVE-VLD 提审校验提示：提审时标题/分类/正文缺失，阻断提审并高亮缺失项，提示补全后重新提交（§9 数据异常）
    - ADED-SAVE-CFLC 编辑保存冲突：两名运营同时编辑同一篇，后保存者收到"他人已保存新版本，请刷新后合并"告知（§9 操作异常）
  - ADED-PREV 预览
    - ADED-PREV-SHOW 发布前预览：用户在编辑器内预览前台渲染效果（§7.6，P2）
  - ADED-FLOW 入口
    - F-REJRES 驳回修改重提流程
      - {##ADRV-REVO-REJN}：管理员驳回（必填原因 ≥5 字）
      - {##ADED-FORM-REJN}：运营查看驳回原因
      - {##ADED-FORM-CONT}：修改正文内容
      - {##ADED-SAVE-SUBM}：重新提交审核

- ADRV 审核队列页 /admin/review
  - ADRV-QUEUE 队列展示
    - ADRV-QUEUE-SHOW 审核队列展示：管理员查看待审核教程按提交时间倒序，展示分类/作者/提交时间/修改版（v2+）标识（§7.7）
    - ADRV-QUEUE-FLTR 队列分类筛选：管理员按分类筛选审核队列（§7.7）
  - ADRV-REVO 审核操作
    - ADRV-REVO-APPR 审核通过：管理员点击通过，教程待审核→已发布，记录审核人与审核时间，前台即时可见（§7.7）
    - ADRV-REVO-REJN 审核驳回：管理员填写 ≥5 字原因驳回，教程待审核→草稿，原因展示在编辑页顶部（§7.7）
    - ADRV-REVO-REJV 驳回原因校验：驳回原因 <5 字时阻断提交，提示"请填写至少 5 个字的驳回原因"（前端阻断 + 后端校验）（§7.7/§9）
    - ADRV-REVO-LOCK 审核撤回互斥：管理员审核与运营撤回并发时后到动作失效，提示"该教程状态已变化，请刷新"（§7.7/§9）
  - ADRV-AITB AI 审核 Tab
    - ADRV-AITB-SHOW AI 生成队列展示：管理员切换 AI 生成审核 Tab，查看带"AI 生成"标识的 mock 队列，本期仅展示不可操作（§7.7，P2）
  - ADRV-FLOW 入口
    - F-REVIEW 审核决策流程
      - {##ADRV-QUEUE-SHOW}：进入审核队列查看待审教程
      - {##ADRV-REVO-APPR}：通过 → 已发布并三端可见
      - {##ADRV-REVO-REJN}：驳回（带原因）→ 回草稿待修改

- ADCT 分类树管理页 /admin/categories
  - ADCT-TREE 分类树展示
    - ADCT-TREE-SHOW 分类树展示：管理员查看本期限两级的分类树（名称/父分类/排序/启停状态/ERP 模块映射）（§7.8）
  - ADCT-CRUD 分类管理操作
    - ADCT-CRUD-CRET 新增分类：管理员新增分类（名称与父分类），默认启用（§7.8）
    - ADCT-CRUD-EDIT 编辑分类：管理员修改分类名称与父分类（§7.8）
    - ADCT-CRUD-DELE 删除分类（含保护）：管理员删除分类，分类下存在任意状态教程时阻断并提示"该分类下还有 N 篇教程，请先移走"（§7.8/§9）
  - ADCT-ORDR 排序与启停用
    - ADCT-ORDR-SORT 分类排序：管理员同级分类拖拽或调整排序值，影响前台宫格与列表顺序（§7.8）
    - ADCT-ORDR-TGGL 分类启停用：管理员停用分类后前台隐藏（宫格/筛选），其下已发布教程仍可经收藏/历史/直达链接访问（§7.8）
  - ADCT-MAPM 模块映射维护
    - ADCT-MAPM-BIND 绑定 ERP 模块映射：管理员为分类绑定 ERP 模块（8 选 1 或不限），驱动角色推荐与内嵌入口命中集（§7.8）

- ADSB 统计看板 /admin/dashboard
  - ADSB-OVRW 总览
    - ADSB-OVRW-SHOW 总览指标展示：管理员查看已发布教程数/总浏览量/总收藏量/平均有帮助率 4 指标卡与浏览量 Top10 条形图（§7.9）
  - ADSB-FDBA 反馈分析
    - ADSB-FDBA-LIST 没帮助优先清单：管理员查看按"没帮助占比"倒序的教程列表，占比 >50% 标红（§7.9）
    - ADSB-FDBA-MSG 留言明细查看：管理员展开教程条目查看反馈留言明细（仅后台可见）（§7.9）
  - ADSB-COVR 覆盖度统计
    - ADSB-COVR-MTRX 覆盖矩阵展示：管理员查看已启用分类 × 已发布教程数矩阵，0 篇分类标"空白区"（§7.9）
    - ADSB-COVR-MODL 模块覆盖聚合：管理员查看按模块映射聚合的模块级覆盖教程数（§7.9）
  - ADSB-EMPT 空态处理
    - ADSB-EMPT-SHOW 空数据引导：全新库无种子时看板显示"暂无数据"空态与引导入口（§9 环境异常）

## 3. 小程序端（H5）

- MHOM 小程序首页 /m/
  - MHOM-RECO 角色推荐位
    - MHOM-RECO-ROLE 移动端角色推荐：已登录用户按 ERP 角色匹配分类模块映射取浏览量 Top6 展示（规则同前台 7.1 移动版），未登录展示全站 Top6（§7.10/§7.1）
  - MHOM-CGRD 分类宫格
    - MHOM-CGRD-SHOW 移动分类宫格：用户浏览分类宫格，点击进入对应分类的列表页（§7.10）
  - MHOM-SRCH 搜索入口
    - MHOM-SRCH-ENTR 首页搜索入口：用户在首页搜索框输入关键词，跳转列表页返回命中结果（§2/§7.10）
  - MHOM-CKEN 打卡入口
    - MHOM-CKEN-GOTO 打卡入口跳转：用户点击打卡入口，进入学习打卡页（§7.10）

- MLST 小程序列表与搜索页 /m/list
  - MLST-BRWS 分类浏览
    - MLST-BRWS-CTGR 分类浏览列表：用户选择分类，移动端列表展示该分类已发布教程（§7.10）
  - MLST-SRCH 搜索
    - MLST-SRCH-KEY 移动端关键词搜索：用户输入关键词搜索（命中规则同前台：标题/摘要/标签），返回结果列表（§7.10/§7.2）
  - MLST-REF 刷新
    - MLST-REF-PULLR 下拉刷新：用户下拉刷新列表，加载最新教程数据（§7.10）

- MDTL 小程序详情页 /m/detail/:id（扫码直达目标页）
  - MDTL-CONT 内容展示
    - MDTL-CONT-RICH 移动端内容展示：用户阅读移动端图文正文与视频外链播放，视频失效显示占位提示（§7.10）
    - MDTL-CONT-FSZT 移动端字号调节：用户切换三档字号（标准/大/特大）仅影响正文（§7.10）
  - MDTL-RPRG 阅读进度
    - MDTL-RPRG-SYNC 进度续读与同步：用户在小程序阅读，进度保存并与 PC 端同账号同步续读（§7.10）
  - MDTL-ITCR 互动
    - MDTL-ITCR-FAV 移动端收藏：用户收藏/取消收藏，与 PC 端同一数据，任一端操作另一端刷新可见（§7.10）
  - MDTL-SCAN 扫码直达
    - MDTL-SCAN-OPEN 扫码打开同篇教程：用户扫描 PC 详情页二维码，在小程序端打开同一篇教程（§7.10/§2）
    - MDTL-SCAN-OFFL 已下架扫码提示：扫码打开已下架教程时展示提示页（§7.10）
  - MDTL-FLOW 入口
    - F-SCANDR 扫码直达流程
      - {##FDTL-ITRC-SHAR}：PC 端生成教程二维码
      - {##MDTL-SCAN-OPEN}：扫码在小程序打开同篇教程

- MMYP 小程序收藏与历史页 /m/my
  - MMYP-FAVL 收藏列表
    - MMYP-FAVL-SHOW 移动端收藏列表：用户查看与 PC 同库的收藏列表（含 PC 端新增收藏，刷新可见；已下架标注）（§7.10）
  - MMYP-HIST 浏览历史
    - MMYP-HIST-SHOW 移动端历史与续读：用户查看与 PC 同库的浏览历史与进度百分比，点击从进度处续读（§7.10）

- MCKI 学习打卡页 /m/checkin
  - MCKI-CKIN 每日打卡
    - MCKI-CKIN-DOIT 每日学习打卡：用户点击打卡获得 +10 积分，每日仅一次，当日重复点击无效（§7.10/§6）
  - MCKI-PTSN 积分与徽章
    - MCKI-PTSN-SHOW 积分与连续天数展示：用户查看当前累计积分与连续打卡天数（§7.10/§6）
    - MCKI-PTSN-BDGE 徽章获得：连续打卡 7 天获得"坚持者"徽章；累计完成 20 篇教程获得"百科达人"徽章（§7.10）
    - MCKI-PTSN-BRKN 打卡中断处理：打卡中断仅清零连续天数，累计积分不清零（§7.10/§6）
    - MCKI-PTSN-WALL 徽章墙展示：用户在徽章墙查看已获得与待解锁徽章（§2）

## 4. 公共账号

- FLOG 选角色登录弹窗（前台/小程序共用）
  - FLOG-AUTH 快速登录
    - FLOG-AUTH-ROLE 选角色快速登录：用户选择演示 ERP 角色（销售/采购/生产/仓库/管理/财务）快速登录，登录态本地保持（§7.11）
  - FLOG-RTN 登录回跳
    - FLOG-RTN-BACK 登录后回原位：用户完成登录后返回原页面原位置，继续未完成的收藏/评价操作（§7.2/§9 权限异常）
  - FLOG-FLOW 入口
    - F-LOGINBK 未登录互动登录回跳流程
      - {##FLST-ATHN-LOGIN}：游客点击互动触发登录引导
      - {##FLOG-AUTH-ROLE}：选角色完成登录
      - {##FLOG-RTN-BACK}：回原位继续互动操作

## 5. 统计与追溯说明

- 一级模块（页面）共 17 个：PC 前台 5（FHOM/FLST/FDTL/FMYP/FERP）、管理后台 6（ADLG/ADTL/ADED/ADRV/ADCT/ADSB）、小程序端 5（MHOM/MLST/MDTL/MMYP/MCKI）、公共账号 1（FLOG）
- 原子功能共 96 个，流程功能共 9 个（F-NEWPUB/F-EDITRT/F-OFFREP/F-REJRES/F-REVIEW/F-LEARN/F-CROSSL/F-SCANDR/F-LOGINBK）
- 覆盖对齐：PRD §2 功能清单 35 条全部落位；§7.1–§7.11 功能详细说明逐节对应上述各页面功能组；§9 异常处理落位为 ADED-SAVE-VLD/ADED-SAVE-CFLC/ADRV-REVO-REJV/ADRV-REVO-LOCK/ADCT-CRUD-DELE/ADSB-EMPT/MDTL-SCAN-OFFL 等；§10 权限矩阵（运营/管理员/普通用户/游客）由各功能描述中角色约束体现
- 状态机契约（§3.5）：教程四态流转入口 = ADED-SAVE-SUBM（提审）/ADRV-REVO-APPR（通过）/ADRV-REVO-REJN（驳回）/ADED-SAVE-RTRN（编辑回审）/ADTL-PUBS-OFFL（下架）/ADTL-PUBS-REPU（重发布）/ADTL-CRUD-DELE（草稿删除）
