import { useNavigate } from 'react-router-dom'
import type { ErpModule } from '../../shared/types'
import './Workbench.css'

/**
 * 模拟云 ERP 工作台 #/workbench（PRD §7.5 演示壳，真实 ERP 界面以线上产品为准）。
 * 全屏独立路由（不套 portal 布局）：ERP 顶栏 + 左侧模块菜单 + KPI 概览 + 4 张业务模块卡，
 * 业务数据全部为页面内 mock 常量、零接口调用。三处教程中心入口：
 * 顶栏胶囊与右下悬浮 fab 回教程首页（UI-IXD-15）；模块卡"查看教程 →"按 erpModule
 * 映射跳列表页选中对应一级分类（UI-IXD-14，FE-03 消费 ?erpModule= 参数）。
 */

/** ERP 顶栏模块菜单（装饰性自链本页，模拟 ERP 内导航） */
const ERP_MENUS: ReadonlyArray<{ label: string; active?: boolean }> = [
  { label: '工作台', active: true },
  { label: '销售' },
  { label: '采购' },
  { label: '生产' },
  { label: '库存' },
  { label: '人事' },
  { label: '设置' },
]

/** 左侧业务模块菜单（装饰性；采购申请带待办徽章） */
const SIDE_MENUS: ReadonlyArray<{ label: string; active?: boolean; badge?: number }> = [
  { label: '📊 仪表盘', active: true },
  { label: '🧾 销售订单' },
  { label: '👥 客户管理' },
  { label: '🧩 BOM 管理' },
  { label: '⚙️ MRP 算料' },
  { label: '🛒 采购申请', badge: 3 },
]

/** KPI 概览卡（valueTone/descTone 对应设计稿行内色：蓝数值/橙预警/绿向好/灰说明） */
const KPIS: ReadonlyArray<{
  key: string
  label: string
  value: string
  valueTone?: 'blue' | 'warn'
  desc: string
  descTone: 'up' | 'muted' | 'warn'
}> = [
  { key: 'todo', label: '今日待办', value: '7', valueTone: 'blue', desc: '▼ 较昨日少 2 项', descTone: 'up' },
  { key: 'producing', label: '进行中生产订单', value: '12', desc: '2 单本周交付', descTone: 'muted' },
  { key: 'lack', label: '缺料物料', value: '3', valueTone: 'warn', desc: '建议执行 MRP 重算', descTone: 'warn' },
  { key: 'stock', label: '库存预警', value: '5', valueTone: 'warn', desc: '低于安全库存', descTone: 'warn' },
]

/** 简表单元格：纯文本 / 状态胶囊（tone=ok|ing|warn|off）/ 净缺料红字（tone=lack） */
type WbCell = string | { text: string; tone: 'ok' | 'ing' | 'warn' | 'off' | 'lack' }

/** 模块卡 mock（erpModule 与 get-api-categories.md 枚举一致，驱动"查看教程"跳转映射） */
interface WbCardData {
  key: string
  icon: string
  title: string
  count: string
  head: ReadonlyArray<string>
  rows: ReadonlyArray<ReadonlyArray<WbCell>>
  hint: string
  erpModule: ErpModule
}

const WB_CARDS: ReadonlyArray<WbCardData> = [
  {
    key: 'bom',
    icon: '🧩',
    title: 'BOM 管理列表',
    count: '共 38 条',
    head: ['BOM 编码', '产品', '层级', '子件行数', '状态'],
    rows: [
      ['BOM-2026-0812', '智能温控器 V2.3', '4 级', '86', { text: '已启用', tone: 'ok' }],
      ['BOM-2026-0730', '工业网关 GW-100', '3 级', '54', { text: '已启用', tone: 'ok' }],
      ['BOM-2026-0718', 'SMT 贴片载板', '2 级', '23', { text: '停用', tone: 'off' }],
    ],
    hint: 'BOM 是算料与生产的唯一依据',
    erpModule: 'produce',
  },
  {
    key: 'mrp',
    icon: '⚙️',
    title: 'MRP 算料结果',
    count: 'SO-20260812-007 · 500 台',
    head: ['物料', '毛需求', '可用', '净缺料', '建议采购'],
    rows: [
      ['0603 电容 100nF', '12,000', '8,400', { text: '3,600', tone: 'lack' }, '3,636'],
      ['STM32F103C8T6', '620', '180', { text: '440', tone: 'lack' }, '450'],
      ['温控器主板 PCB', '500', '500', '0', '无需采购'],
    ],
    hint: '上次运算 2026-08-19 09:12',
    erpModule: 'produce',
  },
  {
    key: 'approval',
    icon: '✅',
    title: '待办审批',
    count: '共 4 条',
    head: ['单号', '类型 · 发起人', '金额', '状态'],
    rows: [
      ['PA-20260819-012', '采购申请 · 张伟', '¥48,230', { text: '待审批', tone: 'ing' }],
      ['SO-20260818-031', '销售折扣 · 王丽', '95 折', { text: '待审批', tone: 'ing' }],
      ['RP-20260818-007', '采购退货 · 张伟', '¥2,150', { text: '待复审', tone: 'warn' }],
    ],
    hint: '审批通过后可同步立创商城下单',
    erpModule: 'purchase',
  },
  {
    key: 'stock',
    icon: '📦',
    title: '库存预警',
    count: '共 5 条',
    head: ['物料编码', '物料', '当前库存', '安全库存', '状态'],
    rows: [
      ['M-0603-104', '0603 电容 100nF', '8,400', '10,000', { text: '低于预警', tone: 'warn' }],
      ['M-SOP-STM32', 'STM32F103C8T6', '180', '300', { text: '低于预警', tone: 'warn' }],
      ['M-0805-4R7', '0805 电阻 4.7Ω', '26,000', '20,000', { text: '正常', tone: 'ok' }],
    ],
    hint: '低于安全库存自动提醒补货',
    erpModule: 'inventory',
  },
]

/** 单元格渲染：lack 红字加粗，其余 tone 渲染为状态胶囊，字符串原样 */
function WbCellView({ cell }: { cell: WbCell }) {
  if (typeof cell === 'string') return <>{cell}</>
  if (cell.tone === 'lack') return <span className="lack">{cell.text}</span>
  return <span className={`st st-${cell.tone}`}>{cell.text}</span>
}

export default function Workbench() {
  const navigate = useNavigate()

  return (
    <div className="wb">
      <header className="erp-top">
        <a className="erp-logo" href="#/workbench">
          <span className="mark">ERP</span>嘉立创云ERP
        </a>
        <nav className="erp-menu" data-testid="wb-erp-menu">
          {ERP_MENUS.map(({ label, active }) => (
            <a key={label} className={active ? 'on' : undefined} href="#/workbench">
              {label}
            </a>
          ))}
          <span className="sp" />
        </nav>
        <div className="erp-right">
          <button
            type="button"
            className="tc-entry"
            data-testid="wb-tc-entry"
            onClick={() => navigate('/')}
          >
            📚 教程中心
          </button>
          <span className="erp-user">
            <span className="av">张</span>采购 · 张伟
          </span>
        </div>
      </header>

      <div className="erp-body">
        <aside className="erp-side" data-testid="wb-side-menu">
          <div className="cap">业务模块</div>
          {SIDE_MENUS.map(({ label, active, badge }) => (
            <a key={label} className={active ? 'on' : undefined} href="#/workbench">
              {label}
              {badge != null && <span className="bdg">{badge}</span>}
            </a>
          ))}
        </aside>

        <main className="erp-main">
          <nav className="crumb">
            云ERP / <b>工作台 · 仪表盘</b>（模拟页面：真实 ERP 界面以线上产品为准）
          </nav>
          <div className="page-t">
            <h1>仪表盘</h1>
            <span className="sub">2026-08-20 · 每个功能卡片右下角可直接跳转对应教程</span>
          </div>

          <div className="kpis" data-testid="wb-kpis">
            {KPIS.map(({ key, label, value, valueTone, desc, descTone }) => (
              <div className="kpi" key={key} data-testid={`wb-kpi-${key}`}>
                <div className="k">{label}</div>
                <div className={`v${valueTone ? ` ${valueTone}` : ''}`}>{value}</div>
                <div className={`d ${descTone}`}>{desc}</div>
              </div>
            ))}
          </div>

          <div className="wb-grid" data-testid="wb-grid">
            {WB_CARDS.map((card) => (
              <section className="wb-card" key={card.key} data-testid={`wb-card-${card.key}`}>
                <div className="h">
                  <span className="ic">{card.icon}</span>
                  <b>{card.title}</b>
                  <span className="cnt">{card.count}</span>
                </div>
                <table className="tb">
                  <thead>
                    <tr>
                      {card.head.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {card.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>
                            <WbCellView cell={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="card-ft">
                  <span className="hint">{card.hint}</span>
                  <button
                    type="button"
                    className="btn btn-o"
                    data-testid={`wb-tutorial-btn-${card.key}`}
                    onClick={() => navigate(`/list?erpModule=${card.erpModule}`)}
                  >
                    查看教程 →
                  </button>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      <button type="button" className="fab" data-testid="wb-fab" onClick={() => navigate('/')}>
        <span className="dot" />
        <span className="ring">🎧</span>
        教程中心
      </button>
    </div>
  )
}
