import { useEffect, useState } from 'react'
import { get } from '../../shared/api'
import { ERP_MODULE_LABELS } from '../../shared/constants'
import { fmtNum, fmtTime } from '../../shared/format'
import type {
  CoverageCell,
  CoverageModule,
  FeedbackAnalysisItem,
  StatsCoverage,
  StatsFeedback,
  StatsOverview,
} from '../../shared/types'

/**
 * 统计看板（FE-02）：4 指标卡 / 浏览量 Top10 纯 CSS 条形 / 反馈分析（>50% 标红 +
 * 留言展开）/ 覆盖度双 Tab。admin 全量 / operator 只读同视图（守卫在 AdminLayout）。
 * 复刻源：docs/ui/ui_admin_dashboard.html；图表零依赖（纯 CSS 条形，tech-design §7）。
 */

type RegionState<T> = { loading: boolean; data: T | null; error: string | null }

/** 看板三接口共用取数 hook：三实例并行各发一次 GET，互不阻塞（交互 1） */
function useStatsRegion<T>(url: string): RegionState<T> {
  const [state, setState] = useState<RegionState<T>>({ loading: true, data: null, error: null })
  useEffect(() => {
    let alive = true
    setState({ loading: true, data: null, error: null })
    get<T>(url)
      .then((data) => alive && setState({ loading: false, data, error: null }))
      .catch(
        (err: unknown) =>
          alive && setState({ loading: false, data: null, error: err instanceof Error ? err.message : '加载失败' }),
      )
    return () => {
      alive = false
    }
  }, [url])
  return state
}

/** erpModule → 中文标签；null=通用分类"不限"；未知键回退原值防白屏 */
function moduleLabel(erpModule: string | null): string {
  if (erpModule === null) return '不限'
  return (ERP_MODULE_LABELS as Record<string, string | undefined>)[erpModule] ?? erpModule
}

// ── 骨架 / 空态 / 错误（Loading·空·正常三态，AC-EG-12）──────────────────────

function SkeletonBlock() {
  return <div className="sk sk-block" data-testid="dashboard-skeleton" />
}

/** 空态引导（AC-EG-12）："暂无数据" + 引导入口"导入种子数据"（点击展开种子初始化说明） */
function EmptyHint({ testKey }: { testKey: string }) {
  const [showTip, setShowTip] = useState(false)
  return (
    <div className="empty-box" data-testid={`${testKey}-empty`}>
      <div className="empty-ico">📭</div>
      <div>暂无数据</div>
      <button
        type="button"
        className="empty-link"
        data-testid={`${testKey}-seed-link`}
        onClick={() => setShowTip((v) => !v)}
      >
        导入种子数据
      </button>
      {showTip && (
        <div className="empty-tip">
          种子初始化说明：执行 server 种子脚本重建 erp.db，或以 admin 登录调用 POST /api/system/reset 重建演示数据
        </div>
      )}
    </div>
  )
}

function RegionError({ message }: { message: string }) {
  return (
    <div className="region-error" data-testid="dashboard-error">
      加载失败：{message}
    </div>
  )
}

// ── 四指标卡 ────────────────────────────────────────────────────────────────

/** 卡片静态配置：图标/配色/口径文案（trend 为口径说明，非数据，设计稿口径） */
const METRIC_CARDS = [
  { key: 'published', label: '已发布教程', ico: '📚', icoCls: 'ico-blue', trend: '回审期间按线上版本计' },
  { key: 'views', label: '总浏览量', ico: '👁', icoCls: 'ico-orange', trend: '含未登录打开 · 游客计入浏览量' },
  { key: 'favs', label: '总收藏量', ico: '⭐', icoCls: 'ico-green', trend: '当前有效收藏数（PC + 小程序同库）' },
  {
    key: 'rate',
    label: '平均有帮助率',
    ico: '👍',
    icoCls: 'ico-purple',
    trend: '= 有帮助 ÷（有帮助+没帮助）· 零反馈教程显示"—"',
  },
] as const

function MetricsSection({ state }: { state: RegionState<StatsOverview> }) {
  if (state.loading)
    return (
      <div className="metrics">
        {METRIC_CARDS.map((m) => (
          <div className="metric" key={m.key}>
            <div className="sk sk-line" />
            <div className="sk sk-line big" />
          </div>
        ))}
      </div>
    )

  const o = state.data
  const values: Record<MetricKey, { text: string; unit?: string }> = o
    ? {
        published: { text: fmtNum(o.publishedCount), unit: '篇' },
        views: { text: fmtNum(o.totalViewCount) },
        favs: { text: fmtNum(o.totalFavCount) },
        rate: o.avgHelpfulRate === null ? { text: '—' } : { text: String(o.avgHelpfulRate), unit: '%' },
      }
    : { published: { text: '—' }, views: { text: '—' }, favs: { text: '—' }, rate: { text: '—' } }

  return (
    <div className="metrics">
      {METRIC_CARDS.map((m) => (
        <div className="metric" key={m.key} data-testid={`metric-${m.key}`}>
          <div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">
              {values[m.key].text}
              {values[m.key].unit && <span className="unit">{values[m.key].unit}</span>}
            </div>
            <div className="metric-trend">{m.trend}</div>
          </div>
          <div className={`metric-ico ${m.icoCls}`}>{m.ico}</div>
        </div>
      ))}
    </div>
  )
}

type MetricKey = (typeof METRIC_CARDS)[number]['key']

// ── 浏览量 Top10（纯 CSS 条形，Top1 橙、其余蓝，进场宽度动画）──────────────────

function TopViewedChart({ state }: { state: RegionState<StatsOverview> }) {
  const [barsOn, setBarsOn] = useState(false)
  const topViewed = state.data?.topViewed ?? []
  // 进场动画：数据到位后 60ms 再展开宽度（复刻设计稿 load→data-w 过渡）
  useEffect(() => {
    if (topViewed.length === 0) return
    setBarsOn(false)
    const timer = setTimeout(() => setBarsOn(true), 60)
    return () => clearTimeout(timer)
  }, [topViewed])

  const maxCount = Math.max(...topViewed.map((t) => t.viewCount), 1) // 兜底 1 防除零

  return (
    <div className="card grid-card" data-testid="top-viewed-card">
      <div className="card-head">
        <div className="card-title">浏览量 Top10</div>
        <div className="card-note">打开详情次数 · 倒序</div>
      </div>
      {state.loading ? (
        <SkeletonBlock />
      ) : state.error ? (
        <RegionError message={state.error} />
      ) : topViewed.length === 0 ? (
        <EmptyHint testKey="top" />
      ) : (
        <>
          <div>
            {topViewed.map((t) => (
              <div className="bar-row" key={t.id}>
                <div className="bar-name" title={t.title}>
                  {t.title}
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: barsOn ? `${(t.viewCount / maxCount) * 100}%` : 0 }} />
                </div>
                <div className="bar-val">{fmtNum(t.viewCount)}</div>
              </div>
            ))}
          </div>
          <div className="legend">
            <span>
              <i style={{ background: '#f97316' }} />
              Top1
            </span>
            <span>
              <i style={{ background: '#0066ff' }} />
              Top2-10
            </span>
            <span>条长按浏览量比例渲染</span>
          </div>
        </>
      )}
    </div>
  )
}

// ── 反馈分析表（倒序 + >50% row-red + 留言展开）──────────────────────────────

function FeedbackTable({ state }: { state: RegionState<StatsFeedback> }) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const list = state.data?.list ?? []

  return (
    <div className="card grid-card" data-testid="feedback-card">
      <div className="card-head">
        <div className="card-title">反馈分析（按"没帮助占比"倒序）</div>
        <div className="card-note">占比 &gt;50% 标红 · 留言仅后台可见</div>
      </div>
      {state.loading ? (
        <SkeletonBlock />
      ) : state.error ? (
        <RegionError message={state.error} />
      ) : list.length === 0 ? (
        <EmptyHint testKey="feedback" />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 26 }} />
              <th>教程</th>
              <th>有帮助</th>
              <th>没帮助</th>
              <th style={{ width: '34%' }}>没帮助占比</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <FeedbackRows
                key={item.tutorialId}
                item={item}
                expanded={expandedId === item.tutorialId}
                onToggle={() =>
                  setExpandedId((cur) => (cur === item.tutorialId ? null : item.tutorialId))
                }
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

/** 单条反馈行 + 展开时的黄底留言明细行（本地展开无请求，交互 2） */
function FeedbackRows({
  item,
  expanded,
  onToggle,
}: {
  item: FeedbackAnalysisItem
  expanded: boolean
  onToggle: () => void
}) {
  const hasComments = item.comments.length > 0
  const rateText = item.notHelpfulRate === null ? '—' : `${item.notHelpfulRate}%`
  return (
    <>
      <tr className={item.isRed ? 'row-red' : undefined}>
        <td>
          {hasComments ? (
            <span
              className={`exp-toggle${expanded ? ' open' : ''}`}
              title="展开留言"
              data-testid={`feedback-expand-${item.tutorialId}`}
              onClick={onToggle}
            >
              ▶
            </span>
          ) : (
            <span className="exp-toggle" style={{ visibility: 'hidden' }}>
              ▶
            </span>
          )}
        </td>
        <td className="t-name">{item.title}</td>
        <td className="num">{item.helpfulYes}</td>
        <td className={`num${item.isRed ? ' num-danger' : ''}`}>{item.helpfulNo}</td>
        <td>
          <div className="ratio-cell">
            <div className="ratio-bar">
              <div
                className="ratio-fill"
                style={{ width: `${item.notHelpfulRate === null ? 0 : Math.min(item.notHelpfulRate, 100)}%` }}
              />
            </div>
            <span className="ratio-num">{rateText}</span>
          </div>
        </td>
      </tr>
      {expanded && hasComments && (
        <tr className="detail-row">
          <td colSpan={5}>
            <div className="detail-box">
              <div className="detail-title">✉ "没帮助"留言明细（{item.comments.length} 条）</div>
              {item.comments.map((c) => (
                <div className="msg-item" key={`${c.userId}-${c.updatedAt}`}>
                  <div className="msg-avatar">{c.displayName.slice(0, 1) || '?'}</div>
                  <div>
                    <span className="msg-meta">
                      {c.displayName} · {fmtTime(c.updatedAt)}
                    </span>
                    <br />
                    {c.comment}
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── 覆盖度（分类网格 / 模块聚合双 Tab，交互 3）───────────────────────────────

type CoverageTab = 'category' | 'module'

function CoverageCard({ state }: { state: RegionState<StatsCoverage> }) {
  const [tab, setTab] = useState<CoverageTab>('category')
  const matrix = state.data?.matrix ?? []
  const modules = state.data?.modules ?? []

  return (
    <div className="card coverage-card" data-testid="coverage-card">
      <div className="card-head">
        <div className="card-title">内容覆盖度</div>
        <div className="tabs">
          <button
            type="button"
            className={`tab${tab === 'category' ? ' active' : ''}`}
            data-testid="coverage-tab-category"
            onClick={() => setTab('category')}
          >
            分类视图
          </button>
          <button
            type="button"
            className={`tab${tab === 'module' ? ' active' : ''}`}
            data-testid="coverage-tab-module"
            onClick={() => setTab('module')}
          >
            模块聚合视图
          </button>
        </div>
      </div>

      {state.loading ? (
        <SkeletonBlock />
      ) : state.error ? (
        <RegionError message={state.error} />
      ) : (
        <>
          <div className={`tab-panel${tab === 'category' ? ' active' : ''}`}>
            {tab === 'category' &&
              (matrix.length === 0 ? (
                <EmptyHint testKey="coverage-cate" />
              ) : (
                <>
                  <div className="cover-grid">
                    {matrix.map((cell) => (
                      <CoverCellItem key={cell.categoryId} cell={cell} />
                    ))}
                  </div>
                  <div className="legend">
                    <span>已启用分类 {matrix.length} 个 · 计数按前台可见口径统计</span>
                    <span style={{ color: 'var(--cta)' }}>0 篇标"待补充"，提示补稿方向</span>
                  </div>
                </>
              ))}
          </div>
          <div className={`tab-panel${tab === 'module' ? ' active' : ''}`}>
            {tab === 'module' &&
              (modules.length === 0 ? (
                <EmptyHint testKey="coverage-mod" />
              ) : (
                <>
                  {modules.map((mod) => (
                    <ModuleRowItem key={mod.erpModule} mod={mod} maxCount={Math.max(...modules.map((m) => m.tutorialCount), 1)} />
                  ))}
                  <div className="legend">
                    <span>按分类的 ERP 模块映射聚合模块级覆盖数，驱动角色推荐命中集</span>
                  </div>
                </>
              ))}
          </div>
        </>
      )}
    </div>
  )
}

/** 分类网格单元：0 篇橙虚线框 + "待补充"角标（UI-ELEM-04） */
function CoverCellItem({ cell }: { cell: CoverageCell }) {
  return (
    <div className={`cover-cell${cell.isBlank ? ' blank' : ''}`}>
      <div className="cover-name">
        {cell.name}
        {cell.isBlank && <span className="badge-blank">待补充</span>}
      </div>
      <div className="cover-count">
        {cell.tutorialCount}
        <small> 篇</small>
      </div>
      <span className="cover-mod">映射：{moduleLabel(cell.erpModule)}</span>
    </div>
  )
}

/** 模块聚合行：蓝渐变条按篇数占比；空白模块橙色条 + 橙字（UI-ELEM-04） */
function ModuleRowItem({ mod, maxCount }: { mod: CoverageModule; maxCount: number }) {
  const pct = Math.max((mod.tutorialCount / maxCount) * 100, mod.isBlank ? 4 : 0)
  return (
    <div className={`mod-row${mod.isBlank ? ' blank-row' : ''}`}>
      <div className="mod-name">{mod.moduleName}</div>
      <div className="mod-bar">
        <div className="mod-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="mod-val">
        {mod.isBlank ? '0 篇 · 待补充' : `${mod.tutorialCount} 篇 · 覆盖 ${mod.categoryCount} 分类`}
      </div>
    </div>
  )
}

// ── 页面 ────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const overview = useStatsRegion<StatsOverview>('/api/stats/overview')
  const feedback = useStatsRegion<StatsFeedback>('/api/stats/feedback')
  const coverage = useStatsRegion<StatsCoverage>('/api/stats/coverage')

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div>
          <div className="page-title">统计看板</div>
          <div className="page-desc">
            指标口径：仅统计前台可见教程（已下架教程历史计数不计入）· 零反馈教程不计入平均有帮助率
          </div>
        </div>
      </div>
      <MetricsSection state={overview} />
      <div className="grid-2">
        <TopViewedChart state={overview} />
        <FeedbackTable state={feedback} />
      </div>
      <CoverageCard state={coverage} />
    </div>
  )
}
