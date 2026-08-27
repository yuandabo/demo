/**
 * 种子数据（严格对齐 docs/design/db/db.md §6 与 docs/ui 原型口径）
 * 约定：全部为固定值（禁止随机值），幂等由 db.ts 判空 + 固定 id 保证；
 * 教程计数列与原型一致（MRP 2341/187/96:8、销售订单录入 18:22 等）。
 */
import type { DatabaseSync } from 'node:sqlite'

/**
 * 步骤式正文（h3+p 结构，与原型详情页目录锚点/步骤进度对齐），单篇 300-800 字。
 * 可选第三元素 extra：追加在本步 </p> 之后的附加 HTML（步骤内插图占位 / 步骤后注意事项节等
 * 原型富媒体结构；h3 非「第 N 步」的小节前台按橙左边框 note 块渲染并入目录侧栏）。
 */
type Step = readonly [title: string, body: string, extra?: string]

interface CategorySeed {
  id: number
  name: string
  sort: number
  erpModule: string | null
}

interface UserSeed {
  id: number
  username: string
  password: string
  role: 'admin' | 'operator' | 'user'
  erpRole: string | null
  displayName: string
  createdAt: string
}

interface TutorialSeed {
  id: number
  title: string
  categoryId: number
  summary: string
  steps: ReadonlyArray<Step>
  tags: string[]
  status: 'draft' | 'pending' | 'published' | 'offline'
  isTop: number
  sort: number
  viewCount: number
  favCount: number
  helpfulYes: number
  helpfulNo: number
  authorId: number
  /** 提审次数：驱动审核队列"修改版 v2+"标识（UI-ELEM-09） */
  submitCount: number
  /** 线上过审版本快照；published/offline 默认取自身内容，回审版显式给旧版 */
  published: { summary?: string; steps?: ReadonlyArray<Step>; publishedAt: string } | null
  rejectReason: string | null
  reviewerId: number | null
  reviewedAt: string | null
  lastOfflineAt: string | null
  videoUrl: string | null
  createdAt: string
  updatedAt: string
}

interface MessageSeed {
  id: number
  erpRole: string
  title: string
  tutorialId: number
  isRead: number
  createdAt: string
}

interface CheckinSeed {
  userId: number
  checkinDate: string
  points: number
  streak: number
}

/** 12 个启用一级分类：8 大模块（erp_module=契约枚举 sales/project/file/produce/purchase/inventory/hrFinance/system，CHANGE-2）+ 4 个通用分类 */
const CATEGORY_SEED: ReadonlyArray<CategorySeed> = [
  { id: 1, name: '销售管理', sort: 1, erpModule: 'sales' },
  { id: 2, name: '项目管理', sort: 2, erpModule: 'project' },
  { id: 3, name: '文件管理', sort: 3, erpModule: 'file' },
  { id: 4, name: '生产制造', sort: 4, erpModule: 'produce' },
  { id: 5, name: '采购管理', sort: 5, erpModule: 'purchase' },
  { id: 6, name: '库存管理', sort: 6, erpModule: 'inventory' },
  { id: 7, name: '人事财务', sort: 7, erpModule: 'hrFinance' },
  { id: 8, name: '系统设置', sort: 8, erpModule: 'system' },
  { id: 9, name: '新手入门', sort: 9, erpModule: null },
  { id: 10, name: '最佳实践', sort: 10, erpModule: null },
  { id: 11, name: '常见问题', sort: 11, erpModule: null },
  { id: 12, name: '开放平台', sort: 12, erpModule: null },
]

/** 8 个演示账号：admin / operator / 6 个 ERP 角色用户（密码统一 123456，demo 明文） */
const USER_SEED: ReadonlyArray<UserSeed> = [
  { id: 1, username: 'admin', password: '123456', role: 'admin', erpRole: null, displayName: '系统管理员', createdAt: '2026-07-01 09:00:00' },
  { id: 2, username: 'operator', password: '123456', role: 'operator', erpRole: null, displayName: '运营编辑·李静', createdAt: '2026-07-01 09:05:00' },
  { id: 3, username: 'sales', password: '123456', role: 'user', erpRole: 'sales', displayName: '销售·演示用户', createdAt: '2026-07-01 09:10:00' },
  { id: 4, username: 'purchase', password: '123456', role: 'user', erpRole: 'purchase', displayName: '采购·演示用户', createdAt: '2026-07-01 09:15:00' },
  { id: 5, username: 'produce', password: '123456', role: 'user', erpRole: 'produce', displayName: '生产·演示用户', createdAt: '2026-07-01 09:20:00' },
  { id: 6, username: 'warehouse', password: '123456', role: 'user', erpRole: 'warehouse', displayName: '仓库·演示用户', createdAt: '2026-07-01 09:25:00' },
  { id: 7, username: 'manage', password: '123456', role: 'user', erpRole: 'manage', displayName: '管理·演示用户', createdAt: '2026-07-01 09:30:00' },
  { id: 8, username: 'finance', password: '123456', role: 'user', erpRole: 'finance', displayName: '财务·演示用户', createdAt: '2026-07-01 09:35:00' },
]

/**
 * 24 篇教程四态分布：18 已发布（销3/项2/文1/产3/采3/库2/人1/系0/新1/佳1/常1/开0）
 * + 3 待审核（#19 v2 修改版回审 / #20 #21 首次提审）+ 2 草稿（#22 带驳回原因 / #23 纯草稿）
 * + 1 已下架（#24 保留快照与 last_offline_at）
 */
const TUTORIAL_SEED: ReadonlyArray<TutorialSeed> = [
  {
    id: 1, title: '云ERP是什么？产品总览与核心价值', categoryId: 9,
    summary: '15 分钟看懂云ERP：销售、采购、生产、库存、财务五大模块如何串成一条数字化流水线。',
    steps: [
      ['认识产品定位', '云ERP面向中小制造与贸易企业，覆盖销售、项目、文件、生产制造、采购、库存、人事财务、系统设置八大模块，订单全流程七个环节数字化运转。'],
      ['理解六大核心能力', '报价转单、MRP 算料、扫码报工、库位管理、自动对账、审批流配置——六大能力贯穿订单从报价到回款的完整链路。'],
      ['漫游一张订单的生命周期', '以一笔 500 台智能温控器订单为例，走一遍报价、签约、备料、生产、入库、发货、回款七个环节，理解单据之间的流转关系。'],
      ['定制你的学习路径', '按岗位角色进入对应模块分类：销售看报价与订单，采购看 MRP 与比价，生产看 BOM 与报工，仓库看库位与盘点。'],
    ],
    tags: ['新手', '总览'], status: 'published', isTop: 0, sort: 100,
    viewCount: 5023, favCount: 402, helpfulYes: 402, helpfulNo: 33,
    authorId: 1, submitCount: 1,
    published: { publishedAt: '2026-07-16 10:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-07-16 10:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-07-15 09:00:00', updatedAt: '2026-08-12 10:20:00',
  },
  {
    id: 2, title: '小程序车间扫码报工', categoryId: 4,
    summary: '车间员工用手机扫码即可完成工序报工，完工数量、不良数量实时回传，生产进度不再靠嘴问。',
    steps: [
      ['准备工单与二维码', '生产计划下达后，系统为每道工序生成工单二维码并随流程卡下发；现场可在工单看板补打二维码，码损扫码失败支持手工输入工单号兜底。'],
      ['扫码进入报工页', '员工用小程序扫工序二维码，页面自动带出工单号、产品、工序与计划数量，无需手工选择，避免报错单据。'],
      ['填写完工与不良数量', '录入本班次合格数量与不良数量，选择不良原因代码；超产或欠产超出容差时需填写说明并通知计划员确认。'],
      ['提交并查看进度', '提交后生产进度实时回传，管理者在订单完工比例看板按工序、订单、车间三个维度查看进度与瓶颈工序。'],
    ],
    tags: ['报工', '扫码'], status: 'published', isTop: 0, sort: 90,
    viewCount: 2865, favCount: 233, helpfulYes: 221, helpfulNo: 29,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-07-21 09:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-07-21 09:00:00', lastOfflineAt: null,
    videoUrl: 'https://cdn.example.com/demo/scan-report.mp4', createdAt: '2026-07-20 14:30:00', updatedAt: '2026-08-15 09:18:00',
  },
  {
    id: 3, title: 'MRP 自动算料：从 BOM 到采购建议', categoryId: 5,
    summary: '告别手工 Excel 算料：销售订单驱动 MRP 运算，自动比对库存、在途与安全库存，输出缺料清单与采购建议。',
    steps: [
      ['检查 BOM 完整性', '打开【生产-BOM 管理】确认成品与子件层级、用量与损耗率维护完整；BOM 缺项或版本未生效会导致算料遗漏，先做完整性校验再进入运算。'],
      ['设置算料参数', '在【MRP 运算】选择销售订单或预测单作为毛需求来源，设置运算口径：可用量策略（现存+在途-安全库存）、需求日期、是否合并同一物料净需求。'],
      ['执行运算并解读缺料结果', '运算后查看缺料清单：净需求=毛需求-可用量，不足的物料按 BOM 逐级展开汇总；红色行为紧急缺料，可点击穿透查看需求来源单据。',
        '<p class="ph-img"><b>🖼 截图占位</b><span>MRP 算料结果页：缺料 3 项标红，顶部汇总「本次运算 86 项，缺料 3 项」</span></p>'],
      ['生成采购建议并转采购申请', '勾选缺料行一键生成采购建议，确认供应商与数量后转采购申请进入审批流；自制件转入生产计划，委外件生成委外订单建议。',
        '<h3>注意事项</h3><p>MRP 不会自动扣减「已分配给其它订单」的库存，请在参数中开启<strong>占用检查</strong>；替代料仅在 BOM 维护过替代关系才参与运算；建议每周一上午全量重算一次，避免在途数据过期导致重复采购。</p>'],
    ],
    tags: ['算料', 'BOM', '审批'], status: 'published', isTop: 1, sort: 80,
    viewCount: 2341, favCount: 187, helpfulYes: 96, helpfulNo: 8,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-07-23 15:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-07-23 15:00:00', lastOfflineAt: null,
    videoUrl: 'https://cdn.example.com/demo/mrp-calc.mp4', createdAt: '2026-07-22 10:00:00', updatedAt: '2026-08-11 15:43:00',
  },
  {
    id: 4, title: '销售订单 13 态状态机详解', categoryId: 1,
    summary: '从报价到签收，13 态全程可视、卡点一眼定位，订单状态机一次讲透。',
    steps: [
      ['掌握 13 态全景', '报价、待审核、已审核、备料中、生产中、待入库、已入库、待发货、已发货、已签收、已开票、部分回款、完结——13 个状态覆盖订单全生命周期。'],
      ['理解状态流转条件', '每次迁移由单据动作驱动：审核通过进入备料，MRP 运算生成领料与采购建议，报工完工触发入库，发货单确认后进入签收跟踪。'],
      ['定位卡点订单', '在订单看板按状态筛选，红色超期状态一目了然；点击状态可穿透查看阻塞单据（缺料、待审批、物流异常）。'],
      ['处理异常回退', '签收前可整单或部分冲销回退到上一状态；回退留痕并通知关联岗位，保证状态机可追溯。'],
    ],
    tags: ['订单', '审批'], status: 'published', isTop: 0, sort: 60,
    viewCount: 1725, favCount: 131, helpfulYes: 118, helpfulNo: 9,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-08-02 10:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-08-02 10:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-01 11:00:00', updatedAt: '2026-08-13 17:26:00',
  },
  {
    id: 5, title: '销售报价单快速建档', categoryId: 1,
    summary: '三分钟建好一份规范报价单：产品明细、税率、交期一次录入，客户确认后一键转销售订单，价格留痕可追溯。',
    steps: [
      ['新建报价单', '进入【销售-报价管理】点击新增，选择客户与币种，系统带出历史成交价与等级折扣，支持按客户调价模板批量套用。'],
      ['录入产品明细', '逐行添加产品、数量、含税单价与预计交期；元器件类物料可从 BOM 一键展开带出，避免漏项。'],
      ['提交报价审批', '按金额走报价审批流，低于底价自动拦截并要求填写说明；审批通过后报价单锁定版本号。'],
      ['一键转销售订单', '客户确认后点击转单，明细与价格整单带入销售订单，报价单状态变为已转单并可随时穿透回看。'],
    ],
    tags: ['报价', '审批'], status: 'published', isTop: 0, sort: 120,
    viewCount: 2105, favCount: 142, helpfulYes: 129, helpfulNo: 14,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-07-29 10:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-07-29 10:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-07-28 09:30:00', updatedAt: '2026-08-06 15:20:00',
  },
  {
    id: 6, title: '库位三级初始化：仓库/库区/库位', categoryId: 6,
    summary: '三分钟搭好库位体系，扫码找料不再翻箱倒柜。',
    steps: [
      ['规划仓库结构', '按「仓库-库区-库位」三级建模：先建实体仓库，再按功能区划分收货区、存储区、拣货区与不良品区。'],
      ['建立库区与库位', '每个库区下按货架-层-位编码库位（如 A-03-02），支持批量导入；库位可标记容量与存储属性（防静电、温控）。'],
      ['绑定物料与库位', '在物料档案设置默认库位与库位容差，入库单审核后系统自动推荐库位，也可手工调整。'],
      ['扫码找料与盘点', '车间领料扫库位码秒级定位物料；盘点按库位生成盘点单，账实差异自动生成调整单进入审批。'],
    ],
    tags: ['扫码', '库位'], status: 'published', isTop: 0, sort: 70,
    viewCount: 1980, favCount: 118, helpfulYes: 118, helpfulNo: 17,
    authorId: 1, submitCount: 1,
    published: { publishedAt: '2026-08-06 09:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-08-06 09:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-05 10:00:00', updatedAt: '2026-08-10 14:05:00',
  },
  {
    id: 7, title: '采购申请到一键下单', categoryId: 5,
    summary: '从采购申请填写、多级审批流配置，到一键生成采购订单并同步立创商城下单，全程留痕可追溯。',
    steps: [
      ['汇总请购需求', '请购来源有三：MRP 采购建议、安全库存预警、部门手工请购；请购汇总页按物料合并同类需求并展示近期在途量，避免重复采购与拆单。'],
      ['填写采购申请', '选择供应商或让系统按比价规则推荐，录入预计到货日期与预算科目；超过预算自动拦截。'],
      ['配置多级审批流', '按金额分档走组长、采购经理、财务、总经理多级审批，超预算自动加签；审批记录全程留痕可查，驳回原因回写申请人待办。'],
      ['一键生成采购订单', '审批通过后一键转采购订单，可同步立创商城在线下单并回写订单号；到料进度在跟单看板实时更新，逾期自动催料。'],
    ],
    tags: ['审批', '采购流程', '下单'], status: 'published', isTop: 0, sort: 100,
    viewCount: 1694, favCount: 108, helpfulYes: 150, helpfulNo: 13,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-07-26 10:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-07-26 10:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-07-25 13:00:00', updatedAt: '2026-08-12 16:40:00',
  },
  {
    id: 8, title: '供应商比价与立创同步', categoryId: 5,
    summary: '同一物料多家供应商报价横向对比，元器件价格实时联动 BOM 成本，勾选最优报价直接生成采购单。',
    steps: [
      ['发起询价', '从请购单或物料档案发起询价，选择多家合格供应商批量发送；支持按 BOM 整单询价，系统自动拆分物料清单。'],
      ['横向比价', '供应商报价回填后自动生成比价表：单价、账期、交期与最小起订量并列对比，偏离历史价超容差的行自动标黄。'],
      ['同步立创商城', '元器件类物料可同步立创商城实时价格与库存，价格波动自动提醒，并推荐替代料与停产替代方案。'],
      ['生成采购订单', '勾选最优报价行直接生成采购订单，价格与供应商自动带入；订单下达后成本联动 BOM 重新核算毛利。'],
    ],
    tags: ['对账', '比价', '立创同步'], status: 'published', isTop: 0, sort: 100,
    viewCount: 1523, favCount: 91, helpfulYes: 83, helpfulNo: 8,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-07-31 11:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-07-31 11:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-07-30 15:00:00', updatedAt: '2026-08-10 10:22:00',
  },
  {
    id: 9, title: '应收应付自动对账', categoryId: 7,
    summary: '销售回款与采购付款自动匹配订单和发票，差异项高亮提示，月末对账从 3 天缩短到 1 小时。',
    steps: [
      ['设置对账规则', '在【财务-对账中心】配置自动匹配规则：按单据号精确匹配、按金额加日期模糊匹配、按客户/供应商分组汇总三级策略。'],
      ['运行应收对账', '系统按规则将回款流水与销售订单、发票自动勾稽；未匹配项进入差异池并高亮标注差异金额与天数。'],
      ['运行应付对账', '付款流水与采购发票同样自动勾稽；立创商城账单支持批量导入后一键对账。'],
      ['处理差异并结账', '差异项按类型处理：少收补催收、多收转预收、错账走调整单；处理完毕后月末一键结账并生成对账报告。'],
    ],
    tags: ['对账'], status: 'published', isTop: 0, sort: 100,
    viewCount: 1462, favCount: 87, helpfulYes: 76, helpfulNo: 6,
    authorId: 1, submitCount: 1,
    published: { publishedAt: '2026-08-09 14:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-08-09 14:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-08 10:00:00', updatedAt: '2026-08-14 11:05:00',
  },
  {
    id: 10, title: '库存预警与安全库存', categoryId: 6,
    summary: '为物料设置安全库存阈值，低于预警线自动提醒补货；结合扫码出入库做到实时账实一致。',
    steps: [
      ['制定安全库存策略', '按物料 ABC 分类设置安全库存：A 类按 MRP 动态计算，B/C 类按历史消耗均值乘补货周期，避免一刀切。'],
      ['设置预警参数', '在物料档案维护安全库存、最大库存与补货点；支持按仓库分别设置，多仓之间可配置调拨优先。'],
      ['接收预警并补货', '库存低于补货点时系统生成预警消息并按角色推送给采购与仓库；一键生成请购或调拨单。'],
      ['保持账实一致', '出入库全部扫码执行，库存台账实时更新；月末循环盘点抽查高频物料，差异自动生成调整单。'],
    ],
    tags: ['扫码', '库存'], status: 'published', isTop: 0, sort: 100,
    viewCount: 1352, favCount: 104, helpfulYes: 88, helpfulNo: 9,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-08-04 10:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-08-04 10:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-03 09:00:00', updatedAt: '2026-08-08 17:12:00',
  },
  {
    id: 11, title: '多级 BOM 拆解与损耗率设置', categoryId: 4,
    summary: '讲清父件与子件的层级关系、用量与损耗率维护要点，避免「BOM 建错、整批料算错」的高频事故。',
    steps: [
      ['理解多级结构', 'BOM 按父件-子件层级展开，成品下挂半成品与采购件，半成品再挂下级物料；层级深度建议不超过 6 层，避免算料风暴。'],
      ['维护用量与单位', '每行子件维护用量基数与用量、计量单位与换算率；单位换算错误是缺料的高频原因，录入后务必用试算功能验证。'],
      ['设置损耗率', '按工序设置损耗率（如 SMT 贴片 0.5%、组装 1%），系统按净需求除以（1-损耗率）向上取整补量；共用料在多成品间合并计算。'],
      ['版本与生效控制', 'BOM 变更走版本管理，设生效日期与批次；在制品继续用旧版，新订单自动用新版，避免切换期算料混乱。'],
    ],
    tags: ['BOM', '算料'], status: 'published', isTop: 0, sort: 100,
    viewCount: 1338, favCount: 95, helpfulYes: 80, helpfulNo: 8,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-07-19 09:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-07-19 09:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-07-18 10:30:00', updatedAt: '2026-08-13 15:33:00',
  },
  {
    id: 12, title: '算料参数入门：净需求与安全库存天数设置', categoryId: 4,
    summary: '毛需求从哪来？净需求怎么算？安全库存天数与损耗率如何影响建议量？一篇讲清 MRP 算料公式的每个参数。',
    steps: [
      ['区分毛需求与净需求', '毛需求是订单或预测的原始需求；净需求=毛需求-现存可用量-在途量+安全库存，只有净需求才进入采购与生产建议。'],
      ['理解可用量策略', '现存可用量支持三种口径：现存、现存减锁定量、现存减锁定量加在途；口径不同直接影响是否重复采购，需与仓库约定统一。'],
      ['设置安全库存天数', '安全库存=日均消耗乘以安全天数；建议 A 类物料 3-5 天、C 类 7-15 天，超储同样占用资金，并非越高越好。'],
      ['验证建议量公式', '建议量=净需求除以（1-损耗率），按最小包装量向上取整；算完用明细穿透核对每一层展开，确认参数生效。'],
    ],
    tags: ['MRP', '参数', '安全库存'], status: 'published', isTop: 0, sort: 100,
    viewCount: 1298, favCount: 84, helpfulYes: 74, helpfulNo: 7,
    authorId: 1, submitCount: 1,
    published: { publishedAt: '2026-08-03 10:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-08-03 10:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-02 14:00:00', updatedAt: '2026-08-07 11:48:00',
  },
  {
    id: 13, title: '项目立项：从合同到 WBS 任务分解', categoryId: 2,
    summary: '合同签订后三步完成立项：建项目、分解 WBS 任务、指派责任人与预算，让项目进度与工时从第一天就可跟踪。',
    steps: [
      ['创建项目档案', '从合同一键生成项目，带出客户、金额与交期；补充项目类型、项目经理与成员清单，并设置项目编号规则便于归档检索。'],
      ['分解 WBS 任务', '按交付阶段拆分任务树，每条任务维护计划开始/结束日期、交付物与工时预估；任务间可设置前后置依赖，关键路径自动高亮。'],
      ['指派责任与预算', '任务指派到人并关联预算科目；预算与实际成本随工时与领料自动归集，超支实时预警。'],
      ['关联生产与采购', '项目任务可关联销售订单与采购申请，备料进度直接回写项目看板，交付状态一目了然。'],
    ],
    tags: ['项目', 'WBS', '排期'], status: 'published', isTop: 0, sort: 100,
    viewCount: 1103, favCount: 66, helpfulYes: 55, helpfulNo: 5,
    authorId: 1, submitCount: 1,
    published: { publishedAt: '2026-07-27 09:30:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-07-27 09:30:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-07-26 10:00:00', updatedAt: '2026-08-05 14:16:00',
  },
  {
    id: 14, title: '报价管理：客户报价单审批流', categoryId: 1,
    summary: '报价单审批流配置实操：按金额分档审批、低于底价拦截、版本留痕，销售报价不再各说各话。',
    steps: [
      ['配置审批分档', '在【系统设置-审批流】为报价单配置分档规则：1 万以下销售主管审，1-10 万销售经理审，10 万以上总经理加签。'],
      ['设置底价拦截', '维护产品底价表，报价低于底价自动拦截并要求填写特别说明；折扣超出等级权限同样触发拦截。'],
      ['处理待审报价', '审批人在待办列表处理报价：查看历史成交价对比与毛利测算，通过或驳回并留痕。'],
      ['版本留痕与追溯', '客户要求改价时生成新版本，旧版本封存可回看；报价转单后仍可穿透查询当时的价格决策链。'],
    ],
    tags: ['报价', '审批'], status: 'published', isTop: 0, sort: 110,
    viewCount: 892, favCount: 54, helpfulYes: 62, helpfulNo: 18,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-08-10 10:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-08-10 10:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-09 13:00:00', updatedAt: '2026-08-16 09:40:00',
  },
  {
    id: 15, title: '里程碑计划与项目看板实操', categoryId: 2,
    summary: '用里程碑锚定交付节点，用项目看板跟踪任务完成率与延期风险，延期预警自动推送责任人。',
    steps: [
      ['设置项目里程碑', '在项目计划中定义里程碑节点：签约、设计评审、首批交付、终验；每个里程碑绑定必须完成的前置任务。'],
      ['跟踪任务进度', '任务完成百分比随工时回填自动更新；里程碑预测日期按当前进度自动推算，提前亮出延期风险。'],
      ['配置延期预警', '里程碑预测延期超过阈值时，系统按责任人推送预警消息，并在项目看板标红；周报自动汇总风险清单。'],
      ['复盘交付数据', '项目结项后查看计划-实际对比：工期偏差、工时偏差与预算执行率，沉淀为下次报价与排期的依据。'],
    ],
    tags: ['项目', '看板'], status: 'published', isTop: 0, sort: 90,
    viewCount: 826, favCount: 48, helpfulYes: 41, helpfulNo: 4,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-08-07 10:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-08-07 10:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-06 15:00:00', updatedAt: '2026-08-09 16:50:00',
  },
  {
    id: 16, title: '文件中心权限与设计成果物归档', categoryId: 3,
    summary: '原理图、Gerber、结构图等研发成果物集中归档，按项目设置查看/下载权限，防止设计文件散落外流。',
    steps: [
      ['建立归档目录', '按项目-文件类型两级目录归档：原理图、PCB/Gerber、结构、固件、认证报告；命名规范强制「项目号_版本_日期」。'],
      ['设置分级权限', '项目成员默认可见，下载与外发权限单独授予；离职交接时权限随岗位转移，不留孤儿账号。'],
      ['版本管理与预览', '文件上传自动生成版本链，历史版本可回滚；原理图与 PDF 支持在线预览，无需下载专用工具。'],
      ['安全审计', '敏感目录开启下载审计日志：谁、何时、下载了什么文件；异常批量下载自动告警并冻结账号。'],
    ],
    tags: ['权限'], status: 'published', isTop: 0, sort: 100,
    viewCount: 764, favCount: 42, helpfulYes: 40, helpfulNo: 4,
    authorId: 1, submitCount: 1,
    published: { publishedAt: '2026-08-05 15:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-08-05 15:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-04 11:00:00', updatedAt: '2026-08-11 10:08:00',
  },
  {
    id: 17, title: 'MRP 算料建议采购量为 0？三步排查', categoryId: 11,
    summary: '明明缺料却算不出建议量？依次检查可用量策略、BOM 生效版本与需求日期跨期三类高频原因，快速定位算料异常。',
    steps: [
      ['检查可用量策略', '若现存量口径包含了在途或锁定库存，净需求可能被抵消为 0；在【系统设置-算料参数】切换可用量口径后重跑运算，并对比两次缺料清单的差异行。'],
      ['核对 BOM 生效版本', '订单需求日期落在旧版 BOM 生效期内，而旧版用量为 0 或子件缺失；检查 BOM 版本生效日期与订单交期是否匹配，必要时调整版本或改单交期。'],
      ['检查需求日期跨期', '需求日期超出采购或生产提前期窗口时，系统默认不生成建议；调整计划口径或手工锁定需求日期后重算，重算前先清理旧建议避免重复下单。'],
    ],
    tags: ['常见问题', '排查', 'FAQ'], status: 'published', isTop: 0, sort: 100,
    viewCount: 731, favCount: 42, helpfulYes: 36, helpfulNo: 3,
    authorId: 2, submitCount: 1,
    published: { publishedAt: '2026-08-08 09:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-08-08 09:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-07 10:00:00', updatedAt: '2026-08-15 14:25:00',
  },
  {
    id: 18, title: '电子制造企业数字化仓库最佳实践', categoryId: 10,
    summary: '从收货到发料全流程扫码化的落地路径：先库位后流程、先试点后推广，三个月实现账实一致率 99%。',
    steps: [
      ['第一步先建库位', '不要急着上流程，先用两周把仓库-库区-库位三级建模完成并贴码，存量物料做一次全面盘点定位。'],
      ['第二步收货扫码试点', '从收货环节开始：IQC 检验合格后扫库位上架，库存从这一刻起有了实时账；试点一个月再推广到发料。'],
      ['第三步发料与退料闭环', '车间领料按工单扫码扣料，多余料退库同样扫码回库；超领自动走审批，堵住物料流失漏洞。'],
      ['度量与持续改进', '每周跟踪账实一致率、找料耗时与超领率三个指标；一致率稳定 99% 后再上盘点自动化与安全库存动态化。'],
    ],
    tags: ['最佳实践', '案例'], status: 'published', isTop: 0, sort: 100,
    viewCount: 692, favCount: 40, helpfulYes: 34, helpfulNo: 3,
    authorId: 1, submitCount: 1,
    published: { publishedAt: '2026-08-11 09:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-08-11 09:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-10 10:00:00', updatedAt: '2026-08-16 15:30:00',
  },
  {
    // 待审核·v2 修改版回审：前台继续展示 published_content 旧版快照（AC-FN-10/19）
    id: 19, title: '销售订单录入操作指南', categoryId: 1,
    summary: '覆盖订单录入必填校验、价格与信用拦截、提交后修改规则；v2 替换旧版截图并新增委外件场景说明。',
    steps: [
      ['进入销售订单录入', '打开【销售-销售订单】页签点击新增（新版入口已从快捷菜单迁移至页签），选择客户后自动带出信用额度、结算方式与历史成交价。'],
      ['填写客户与产品明细', '录入产品、数量、含税单价与预计交期；支持从报价单一键带入明细行，批量修改计划出货日期。'],
      ['处理价格与库存校验', '低于成本价或超出信用额度触发拦截，需上级审批放行；委外物料自动带出建议供应商（v2 新增委外件场景说明）。'],
      ['提交并打印确认单', '保存提交后可打印订单确认单，同步备料与发货计划；提交后 24 小时内可撤回修改。'],
    ],
    tags: ['订单', '录入'], status: 'pending', isTop: 0, sort: 50,
    viewCount: 1876, favCount: 96, helpfulYes: 18, helpfulNo: 22,
    authorId: 2, submitCount: 2,
    published: {
      summary: '订单录入四步走：选客户、填明细、过校验、提交打印，附价格与信用拦截处理办法。',
      steps: [
        ['进入销售订单录入', '打开【销售-销售订单】点击新增，选择客户后系统带出信用额度与结算方式。'],
        ['填写客户与产品明细', '录入产品、数量、含税单价与预计交期；支持从报价单一键带入明细行。'],
        ['处理价格与库存校验', '低于成本价或超出信用额度触发拦截，需上级审批放行。'],
        ['提交并打印确认单', '保存提交后可打印订单确认单，同步备料与发货计划。'],
      ],
      publishedAt: '2026-07-25 14:00:00',
    },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-07-25 14:00:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-07-24 10:00:00', updatedAt: '2026-08-18 14:32:00',
  },
  {
    // 待审核·首次提审：无线上版本，前台/搜索/推荐均不可见
    id: 20, title: '生产报工操作指南', categoryId: 4,
    summary: '车间报工的标准操作：扫码进工单、录完工与不良、超差说明与进度查看。',
    steps: [
      ['进入待报工单', '车间员工登录小程序，在【我的工单】查看分派到自己的工序任务，也可直接扫流程卡二维码进入；工单按优先级排序，急单置顶。'],
      ['录入完工数量', '填写合格数与不良数，选择不良原因代码；首件检验未通过时需先完成首件确认流程再批量报工。'],
      ['超差说明', '实际完工超出计划容差时，系统要求填写超差原因并即时通知计划员；欠产需说明剩余数量的处理计划与预计完成时间。'],
      ['提交与撤回', '提交后订单完工比例实时更新；当班发现录错可在锁单前撤回重报，撤回动作留痕可审计。'],
    ],
    tags: ['报工'], status: 'pending', isTop: 0, sort: 40,
    viewCount: 0, favCount: 0, helpfulYes: 0, helpfulNo: 0,
    authorId: 2, submitCount: 1, published: null,
    rejectReason: null, reviewerId: null, reviewedAt: null, lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-16 09:00:00', updatedAt: '2026-08-18 09:05:00',
  },
  {
    // 待审核·首次提审
    id: 21, title: '付款申请单操作指南', categoryId: 7,
    summary: '从关联采购订单与发票到多级审批、付款与应付冲销的完整链路，超预算自动加签。',
    steps: [
      ['新建付款申请', '进入【财务-付款申请】点击新增，选择供应商后系统带出待付采购订单与发票清单，支持按申请部门与币种筛选。'],
      ['关联采购订单与发票', '勾选本次付款对应的订单与发票行，系统自动核对付余款；预付款单独走预付类型并在到票后核销。'],
      ['提交多级审批', '按金额走组长、财务经理、总经理多级审批流，超预算自动加签；审批通过后进入付款队列并通知出纳。'],
      ['付款与应付冲销', '出纳确认付款回填流水号，应付账款自动冲销；差异部分转暂挂并进入对账差异池跟踪处理。'],
    ],
    tags: ['审批', '付款'], status: 'pending', isTop: 0, sort: 30,
    viewCount: 0, favCount: 0, helpfulYes: 0, helpfulNo: 0,
    authorId: 1, submitCount: 1, published: null,
    rejectReason: null, reviewerId: null, reviewedAt: null, lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-15 16:00:00', updatedAt: '2026-08-17 20:11:00',
  },
  {
    // 草稿·被驳回后修改中：reject_reason 展示在编辑页顶部（AC-RULE-19）
    id: 22, title: '安全库存与补货预警设置', categoryId: 6,
    summary: '为物料分层设置安全库存与补货点，预警消息按角色推送，配合 MRP 实现自动补货建议。',
    steps: [
      ['制定分层策略', '按 ABC 分类确定安全库存策略：A 类走 MRP 动态计算，B/C 类按消耗均值乘补货周期，呆滞料单独冻结策略。'],
      ['维护补货点', '在物料档案维护补货点与最大库存，按仓库分别设置；多仓场景配置调拨优先级，避免跨仓重复备货。'],
      ['设置预警推送', '低于补货点生成预警消息，按角色推送给采购与仓库责任人并汇总到待办中心；本步截图待替换为新版界面。'],
      ['联动 MRP 补货建议', '预警明细可一键生成请购或调拨单，与 MRP 采购建议合并去重后进入审批流，避免双通道重复下单。'],
    ],
    tags: ['库存', '预警'], status: 'draft', isTop: 0, sort: 20,
    viewCount: 0, favCount: 0, helpfulYes: 0, helpfulNo: 0,
    authorId: 2, submitCount: 1, published: null,
    rejectReason: '第3步截图含未发布界面，请替换', reviewerId: 1, reviewedAt: '2026-08-17 16:20:00', lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-14 10:00:00', updatedAt: '2026-08-19 11:24:00',
  },
  {
    // 草稿·纯草稿从未提审：可被作者删除（删除保护的反例）
    id: 23, title: '里程碑延期预警设置', categoryId: 2,
    summary: '里程碑延期阈值的配置思路草稿：按里程碑类型设置预警提前量与推送对象。',
    steps: [
      ['定义延期阈值', '按里程碑类型设置预警提前量：设计评审提前 2 天，首批交付提前 5 天，终验提前 3 天；阈值支持按项目优先级覆盖。'],
      ['配置推送对象', '预警同时推送项目经理与任务责任人；连续两次预警升级推送部门负责人，并在管理驾驶舱标红。'],
      ['周报汇总', '每周五自动汇总未关闭的延期风险，生成项目周报风险清单附件，含责任人与预计恢复日期。'],
      ['与工时联动', '任务工时回填率低于 80% 时触发数据质量提醒，保证里程碑预测日期的测算基础可靠。'],
    ],
    tags: ['项目', '预警'], status: 'draft', isTop: 0, sort: 10,
    viewCount: 0, favCount: 0, helpfulYes: 0, helpfulNo: 0,
    authorId: 2, submitCount: 0, published: null,
    rejectReason: null, reviewerId: null, reviewedAt: null, lastOfflineAt: null,
    videoUrl: null, createdAt: '2026-08-18 14:00:00', updatedAt: '2026-08-19 16:08:00',
  },
  {
    // 已下架：保留 published_content 快照与 last_offline_at（前台不可见，收藏夹标注）
    id: 24, title: '来料检验操作指南', categoryId: 5,
    summary: '来料检验 IQC 全流程：抽样方案、检验项判定、合格上架与不合格退货处置。',
    steps: [
      ['接收报检单', '采购到货后生成报检单，IQC 在待检列表接收并打印抽样方案；按 AQL 水准与检验级别确定抽检数量。'],
      ['执行检验与判定', '按检验项逐项记录实测值，外观、尺寸、功能分项判定；关键器件加测首件比对与批次一致性检查。'],
      ['合流处置', '合格批扫码上架进入良品库，不合格批生成退货处置单并通知采购与供应商，让步接收走特采审批。'],
      ['供应商质量档案', '检验结果自动回写供应商质量分与批次合格率，连续不合格自动触发供应商评审与降级处理流程。'],
    ],
    tags: ['检验', 'IQC'], status: 'offline', isTop: 0, sort: 5,
    viewCount: 1204, favCount: 73, helpfulYes: 80, helpfulNo: 18,
    authorId: 1, submitCount: 1,
    published: { publishedAt: '2026-07-11 10:00:00' },
    rejectReason: null, reviewerId: 1, reviewedAt: '2026-07-11 10:00:00', lastOfflineAt: '2026-08-06 16:50:00',
    videoUrl: null, createdAt: '2026-07-10 09:00:00', updatedAt: '2026-08-06 16:50:00',
  },
]

/** 3 条 mock 消息：审批待办关联教程，按 erp_role 投递 */
const MESSAGE_SEED: ReadonlyArray<MessageSeed> = [
  { id: 1, erpRole: 'purchase', title: '审批待办：《采购申请到一键下单》第 4 步演示了多级审批流处理', tutorialId: 7, isRead: 0, createdAt: '2026-08-18 09:30:00' },
  { id: 2, erpRole: 'sales', title: '审批待办：《销售报价单快速建档》报价审批流配置已更新，请查阅', tutorialId: 5, isRead: 0, createdAt: '2026-08-17 15:00:00' },
  { id: 3, erpRole: 'produce', title: '审核提醒：《生产报工操作指南》已提交审核，等待管理员处理', tutorialId: 20, isRead: 0, createdAt: '2026-08-18 09:06:00' },
]

/** 5 天示例打卡（purchase 用户）：连续 2 天口径（08-12/13 连 2，08-15 重计，08-17/18 连 2） */
const CHECKIN_SEED: ReadonlyArray<CheckinSeed> = [
  { userId: 4, checkinDate: '2026-08-12', points: 10, streak: 1 },
  { userId: 4, checkinDate: '2026-08-13', points: 10, streak: 2 },
  { userId: 4, checkinDate: '2026-08-15', points: 10, streak: 1 },
  { userId: 4, checkinDate: '2026-08-17', points: 10, streak: 1 },
  { userId: 4, checkinDate: '2026-08-18', points: 10, streak: 2 },
]

/** 种子写入（调用方负责事务；判空幂等由 openDb/resetDatabase 保证） */
export function insertSeed(db: DatabaseSync): void {
  const cateStmt = db.prepare(
    `INSERT INTO categories (id, name, parent_id, sort, status, erp_module, created_at, updated_at)
     VALUES (?, ?, NULL, ?, 'enabled', ?, '2026-07-01 08:00:00', '2026-07-01 08:00:00')`
  )
  for (const c of CATEGORY_SEED) {
    cateStmt.run(c.id, c.name, c.sort, c.erpModule)
  }
  const userStmt = db.prepare(
    `INSERT INTO users (id, username, password, role, erp_role, display_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  for (const u of USER_SEED) {
    userStmt.run(u.id, u.username, u.password, u.role, u.erpRole, u.displayName, u.createdAt)
  }
  const tutStmt = db.prepare(
    `INSERT INTO tutorials (id, title, category_id, summary, content, video_url, tags, status, is_top, sort,
       view_count, fav_count, helpful_yes, helpful_no, share_count, reject_reason, submit_count, author_id,
       reviewer_id, reviewed_at, published_content, published_summary, published_at, last_offline_at,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  for (const t of TUTORIAL_SEED) {
    const snapshotContent = t.published ? buildContent(t.published.steps ?? t.steps) : null
    tutStmt.run(
      t.id, t.title, t.categoryId, t.summary, buildContent(t.steps), t.videoUrl, JSON.stringify(t.tags),
      t.status, t.isTop, t.sort, t.viewCount, t.favCount, t.helpfulYes, t.helpfulNo, shareCount(t.viewCount),
      t.rejectReason, t.submitCount, t.authorId, t.reviewerId, t.reviewedAt,
      snapshotContent, t.published?.summary ?? null, t.published?.publishedAt ?? null, t.lastOfflineAt,
      t.createdAt, t.updatedAt
    )
  }
  const msgStmt = db.prepare(
    `INSERT INTO messages (id, erp_role, title, tutorial_id, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  for (const m of MESSAGE_SEED) {
    msgStmt.run(m.id, m.erpRole, m.title, m.tutorialId, m.isRead, m.createdAt)
  }
  const checkinStmt = db.prepare(
    `INSERT INTO checkins (user_id, checkin_date, points, streak, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )
  for (const c of CHECKIN_SEED) {
    checkinStmt.run(c.userId, c.checkinDate, c.points, c.streak, `${c.checkinDate} 09:10:00`)
  }
}

function buildContent(steps: ReadonlyArray<Step>): string {
  return steps
    .map(([title, body, extra], i) => `<h3>第 ${i + 1} 步 · ${title}</h3><p>${body}</p>${extra ?? ''}`)
    .join('')
}

/** 分享数：有浏览量的教程按固定比例给非零演示值，未发布为 0 */
function shareCount(viewCount: number): number {
  return viewCount > 0 ? Math.round(viewCount / 60) : 0
}
