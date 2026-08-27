import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import {
  ERP_MODULE_LABELS,
  ERP_ROLE_DEMOS,
  ERP_ROLE_LABELS,
  ROLE_MODULE_MAP,
  categoryCellMeta,
} from '../../shared/constants'
import type { Category, Page, RecommendResult, Tutorial } from '../../shared/types'
import TutorialCard from '../components/TutorialCard'
import type { GridMeta, TutorialCardData } from '../components/TutorialCard'

/** 首页四区块并列取数口径：最近更新 / 热门 / 宫格角标（tech-design §7） */
const LATEST_QUERY = '/api/tutorials?sort=latest&page=1&pageSize=6'
const HOT_QUERY = '/api/tutorials?sort=hot&page=1&pageSize=6'

/** 区块骨架占位数：三卡区块 6 卡、宫格 12 格（设计稿布局） */
const CARD_SKELETON_COUNT = 6
const CELL_SKELETON_COUNT = 12

interface BlockState<T> {
  loading: boolean
  data: T | null
  error: boolean
}

/**
 * 区块独立取数：loading/data/error 三态，deps 变化重取并清旧数据回骨架。
 * 各区块各自调用互不阻塞（先到先渲染）；卸载/重取后丢弃过期响应。
 */
function useBlock<T>(fetcher: () => Promise<T>, deps: ReadonlyArray<unknown>): BlockState<T> {
  const [state, setState] = useState<BlockState<T>>({ loading: true, data: null, error: false })

  useEffect(() => {
    let alive = true
    setState({ loading: true, data: null, error: false })
    fetcher()
      .then((data) => {
        if (alive) setState({ loading: false, data, error: false })
      })
      .catch(() => {
        // 含 401（api.ts 已广播登录引导）：区块降级失败占位，不白屏不阻塞其他区块
        if (alive) setState({ loading: false, data: null, error: true })
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

/** 区块空占位（任务 FE-02：任一区块空列表显示图标+文案，页面不报错） */
function EmptyHint({ text }: { text: string }) {
  return (
    <div className="blk-empty" data-testid="block-empty">
      📭 {text}
    </div>
  )
}

/** 区块头：▎标题 + 灰副文 + 右侧"更多"链接（四区块共用，设计稿 .sec-h） */
function SectionHeader({
  title,
  sub,
  linkText,
  testid,
}: {
  title: string
  sub: string
  linkText: string
  testid: string
}) {
  return (
    <div className="sec-h">
      <span className="bar-i" />
      <h2>{title}</h2>
      <span className="sub">{sub}</span>
      <Link className="more" to="/list" data-testid={testid}>
        {linkText}
      </Link>
    </div>
  )
}

/** 教程卡网格区块体：骨架 / 失败 / 空态 / 卡片四态（推荐·最近更新·热门共用） */
function CardGrid({
  block,
  meta,
  emptyText,
}: {
  block: BlockState<TutorialCardData[]>
  meta: GridMeta
  emptyText: string
}) {
  if (block.loading) {
    return (
      <div className="tgrid" data-testid="grid-skeleton">
        {Array.from({ length: CARD_SKELETON_COUNT }, (_, i) => (
          <div className="sk-card" key={i} />
        ))}
      </div>
    )
  }
  if (block.error) return <EmptyHint text="加载失败，请稍后重试" />
  if (!block.data?.length) return <EmptyHint text={emptyText} />
  return (
    <div className="tgrid">
      {block.data.map((tutorial) => (
        <TutorialCard key={tutorial.id} tutorial={tutorial} meta={meta} />
      ))}
    </div>
  )
}

/** 分类宫格：骨架 / 失败 / 空态 / 12 格（角标=N 篇，0 篇灰标"待补充"，点击带 categoryId 跳列表） */
function CategoryGrid({ block }: { block: BlockState<Category[]> }) {
  if (block.loading) {
    return (
      <div className="cgrid" data-testid="categories-skeleton">
        {Array.from({ length: CELL_SKELETON_COUNT }, (_, i) => (
          <div className="sk-cell" key={i} />
        ))}
      </div>
    )
  }
  if (block.error) return <EmptyHint text="加载失败，请稍后重试" />
  if (!block.data?.length) return <EmptyHint text="暂无分类" />

  return (
    <div className="cgrid" data-testid="categories-grid">
      {block.data.map((category) => {
        const count = category.tutorialCount ?? 0
        const { icon, sub } = categoryCellMeta(category.name, category.erpModule)
        return (
          <Link
            key={category.id}
            className="ccell"
            to={`/list?categoryId=${category.id}`}
            data-testid={`category-cell-${category.id}`}
          >
            <span
              className={`corner${count === 0 ? ' zero' : ''}`}
              data-testid={`category-count-${category.id}`}
            >
              {count === 0 ? '待补充' : `${count} 篇`}
            </span>
            <span className="ic">{icon}</span>
            <b>{category.name}</b>
            <span className="cnt">{sub}</span>
          </Link>
        )
      })}
    </div>
  )
}

/**
 * 教程首页 #/：① 角色推荐（登录按 ERP 角色映射命中集浏览量 Top6，游客全站 Top6）
 * ② 分类宫格 ③ 最近更新 ④ 热门教程（AC-FN-01/17/22、AC-RULE-16/17、UI-IXD-01、UI-ELEM-05）。
 * 推荐区随 AuthContext 用户角色变化即时重取（FE-01 登录回调 → user 更新 → 本处联动）。
 */
export default function Home() {
  const { user } = useAuth()
  const erpRole = user?.erpRole ?? null

  const recommend = useBlock<TutorialCardData[]>(
    async () => (await get<RecommendResult>('/api/recommend')).list,
    [erpRole],
  )
  const latest = useBlock<TutorialCardData[]>(
    async () => (await get<Page<Tutorial>>(LATEST_QUERY)).list,
    [],
  )
  const hot = useBlock<TutorialCardData[]>(
    async () => (await get<Page<Tutorial>>(HOT_QUERY)).list,
    [],
  )
  const categories = useBlock<Category[]>(
    async () => (await get<{ list: Category[] }>('/api/categories?withCount=1')).list,
    [],
  )

  const roleLabel = erpRole ? ERP_ROLE_LABELS[erpRole] : ''
  const mappedNames = erpRole
    ? ROLE_MODULE_MAP[erpRole].map((m) => ERP_MODULE_LABELS[m]).join(' / ')
    : ''

  return (
    <>
      {/* ① 角色推荐横幅：登录显示角色映射口径，游客降级"热门推荐"（chip 隐藏） */}
      <section className="sec" data-testid="recommend-section">
        <div className="role-hero" data-testid="recommend-hero">
          <div className="ic">{erpRole ? ERP_ROLE_DEMOS[erpRole].icon : '🔥'}</div>
          <div>
            <h2 data-testid="recommend-title">
              {roleLabel ? `为你推荐 · ${roleLabel}相关` : '热门推荐'}
            </h2>
            <p data-testid="recommend-subtitle">
              {roleLabel
                ? `已按你的 ERP 角色（${roleLabel}）匹配「${mappedNames}」分类，按浏览量取 Top 6`
                : '全站已发布教程按浏览量 Top 6'}
            </p>
          </div>
          {roleLabel && (
            <span className="chip" data-testid="recommend-role-chip">
              角色：{roleLabel}
            </span>
          )}
        </div>
        <div className="role-grid">
          <CardGrid block={recommend} meta="view" emptyText="暂无推荐" />
        </div>
      </section>

      {/* ② 分类宫格：启用一级分类 + 前台可见计数角标（UI-IXD-01 跳列表选中） */}
      <section className="sec" data-testid="categories-section">
        <SectionHeader
          title="分类浏览"
          sub="8 大业务模块 + 4 个通用分类"
          linkText="全部教程 →"
          testid="all-tutorials-link"
        />
        <CategoryGrid block={categories} />
      </section>

      {/* ③ 最近更新：前台可见口径按更新时间倒序 Top6 */}
      <section className="sec" data-testid="latest-section">
        <SectionHeader
          title="最近更新"
          sub="按更新时间排序"
          linkText="更多 →"
          testid="latest-more-link"
        />
        <CardGrid block={latest} meta="date" emptyText="暂无数据" />
      </section>

      {/* ④ 热门教程：前台可见口径按浏览量倒序 Top6 */}
      <section className="sec" data-testid="hot-section">
        <SectionHeader
          title="热门教程"
          sub="按浏览量排序"
          linkText="更多 →"
          testid="hot-more-link"
        />
        <CardGrid block={hot} meta="hot" emptyText="暂无数据" />
      </section>
    </>
  )
}
