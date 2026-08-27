import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, del, get } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import { categoryIcon } from '../../shared/constants'
import { fmtNum } from '../../shared/format'
import type { FavoriteItem, FavoriteResult, HistoryItem, Page } from '../../shared/types'
import PhoneShell from '../components/PhoneShell'
import ProgressRing from '../components/ProgressRing'
import { useRoleSheet } from '../components/RoleSheet'
import TabBar from '../components/TabBar'
import { usePullToRefresh } from '../usePullToRefresh'

/** 一次取全收藏/历史（演示量级 ≤100 内单页取全；Tab 计数与局部移除都以列表长度为唯一事实源，不另存 total 防双源漂移） */
const PAGE_SIZE_ALL = 100
/** 缩略底色四色板（ui_m_favorite.html t-prod/t-buy/t-new/t-sale），按分类 id 取模保证同类同色 */
const THUMB_BG = ['t-prod', 't-buy', 't-new', 't-sale'] as const
/** 双面板骨架卡数（任务交互 1：骨架卡占位） */
const SKELETON_COUNT = 3

type TabKey = 'fav' | 'his'

interface FavPageState {
  loading: boolean
  error: boolean
  favorites: FavoriteItem[]
  histories: HistoryItem[]
}

/** 未登录/等待登录引导：不进取数流程，面板不渲染空态（避免误导「暂无收藏」） */
const INITIAL_STATE: FavPageState = { loading: false, error: false, favorites: [], histories: [] }

/** 最近阅读时间：今天 HH:mm / 昨天 HH:mm / MM-DD HH:mm（契约 yyyy-MM-dd HH:mm:ss，拆串计算不受时区影响） */
function fmtLastRead(raw: string): string {
  const [date, time] = raw.split(' ')
  const [y, m, d] = date.split('-').map(Number)
  const hm = (time ?? '').slice(0, 5)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const then = new Date(y, m - 1, d)
  const days = Math.round((today.getTime() - then.getTime()) / 86_400_000)
  if (days === 0) return `今天 ${hm}`
  if (days === 1) return `昨天 ${hm}`
  return `${m}-${d} ${hm}`
}

/** 收藏卡片：可点主体（缩略+标题+meta）+ ❤️ 取消收藏；isOffline 灰显不可进正文（UI-ELEM-02/AC-RULE-04） */
function FavoriteCard({
  item,
  busy,
  onUnfavorite,
}: {
  item: FavoriteItem
  busy: boolean
  onUnfavorite: (tutorialId: number) => void
}) {
  const bg = THUMB_BG[item.categoryId % THUMB_BG.length]
  const main = (
    <>
      <span className={`fthumb ${bg}`}>{categoryIcon(item.categoryName)}</span>
      <span className="f-body">
        <span className="f-title">{item.title}</span>
        <span className="f-meta">
          <span className="f-cat">{item.categoryName ?? '未分类'}</span>
          <span>收藏于 {item.favoritedAt.slice(5, 10)}</span>
          {item.isOffline ? <span className="off-tag">已下架</span> : <span>👁 {fmtNum(item.viewCount)}</span>}
        </span>
      </span>
    </>
  )
  return (
    <div className={`fcard${item.isOffline ? ' off' : ''}`} data-testid={`fav-card-${item.tutorialId}`}>
      {/* 已下架：静态 div 不提供正文入口（善后拦截）；正常条目 Link 进详情续读 */}
      {item.isOffline ? (
        <div className="f-main">{main}</div>
      ) : (
        <Link className="f-main" to={`/detail/${item.tutorialId}`} data-testid={`fav-card-link-${item.tutorialId}`}>
          {main}
        </Link>
      )}
      {/* 已下架教程的收藏同样可取消（delete-api-favorites 契约：取消不校验可见性） */}
      <button
        type="button"
        className="f-heart"
        data-testid={`fav-unfav-btn-${item.tutorialId}`}
        disabled={busy}
        onClick={() => onUnfavorite(item.tutorialId)}
      >
        {item.isOffline ? '🤍' : '❤️'}
      </button>
    </div>
  )
}

/** 历史卡片：进度环 + 最近阅读/完成时间；isOffline 灰显标注同收藏列表规则（AC-FN-23） */
function HistoryCard({ item }: { item: HistoryItem }) {
  const bg = THUMB_BG[item.categoryId % THUMB_BG.length]
  const lastRead =
    item.progress >= 100
      ? `完成于 ${item.updatedAt.slice(5, 10)}`
      : `上次阅读 ${fmtLastRead(item.updatedAt)} · 续读与 PC 同步`
  const main = (
    <>
      <span className={`fthumb ${bg}`}>{categoryIcon(item.categoryName)}</span>
      <span className="f-body">
        <span className="f-title">{item.title}</span>
        <span className="h-time">{lastRead}</span>
        {item.isOffline && (
          <span className="f-meta">
            <span className="off-tag">已下架</span>
          </span>
        )}
      </span>
    </>
  )
  return (
    <div className={`fcard${item.isOffline ? ' off' : ''}`} data-testid={`his-card-${item.tutorialId}`}>
      {item.isOffline ? (
        <div className="f-main">{main}</div>
      ) : (
        <Link className="f-main" to={`/detail/${item.tutorialId}`} data-testid={`his-card-link-${item.tutorialId}`}>
          {main}
        </Link>
      )}
      <ProgressRing progress={item.progress} testId={`progress-ring-${item.tutorialId}`} />
    </div>
  )
}

/**
 * m 收藏历史页 #/favorite（ui_m_favorite.html，FE-05）：
 * 收藏/历史双 Tab（本地面板切换不重复请求）+ 与 PC 同数据源刷新可见（AC-FN-15）
 * + 已下架灰显拦截（UI-ELEM-02/AC-RULE-04）+ 历史倒序与进度环跨端取最新值（AC-FN-23/AC-RULE-11）
 * + 未登录 RoleSheet 引导登录后自动加载（AC-FN-03）+ 下拉刷新（交互 5，复用列表页模式）。
 */
export default function Favorite() {
  const navigate = useNavigate()
  const { user, restoring } = useAuth()
  const { openRoleSheet } = useRoleSheet()

  const [state, setState] = useState<FavPageState>(INITIAL_STATE)
  const [tab, setTab] = useState<TabKey>('fav')
  const [busyFavId, setBusyFavId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const listBodyRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef(0)
  const requestIdRef = useRef(0)
  const loadRef = useRef<(mode: 'skeleton' | 'refresh') => Promise<void>>(async () => {})
  /** 同 tick 连点闸：busyFavId 状态在批量点击内不重渲染，ref 锁先挡一道（口径同 DetailInteraction favInFlightRef） */
  const favInFlightRef = useRef(false)

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2000)
  }, [])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  /**
   * 并行取收藏+历史（同一数据源，AC-FN-15）：mode=skeleton 骨架重置，refresh 下拉保留原列表；
   * 401 已由 api.ts 广播弹 RoleSheet，回空态待登录后自动重载。
   */
  const load = useCallback(
    async (mode: 'skeleton' | 'refresh') => {
      const requestId = ++requestIdRef.current
      if (mode === 'skeleton') setState({ loading: true, error: false, favorites: [], histories: [] })
      try {
        const [favPage, hisPage] = await Promise.all([
          get<Page<FavoriteItem>>(`/api/favorites?page=1&pageSize=${PAGE_SIZE_ALL}`),
          get<Page<HistoryItem>>(`/api/histories?page=1&pageSize=${PAGE_SIZE_ALL}`),
        ])
        if (requestIdRef.current !== requestId) return
        setState({
          loading: false,
          error: false,
          favorites: favPage.list ?? [],
          histories: hisPage.list ?? [],
        })
      } catch (err) {
        if (requestIdRef.current !== requestId) return
        if (mode === 'refresh') showToast('刷新失败，请重试')
        else if (err instanceof ApiError && err.code === 401) setState(INITIAL_STATE)
        else setState((s) => ({ ...s, loading: false, error: true }))
      }
    },
    [showToast],
  )
  loadRef.current = load

  // 进入/登录态变化：未登录弹 RoleSheet 引导（登录后 user 变化自动回本页加载，AC-FN-03）
  useEffect(() => {
    if (restoring) return
    if (!user) {
      openRoleSheet()
      return
    }
    void loadRef.current('skeleton')
  }, [restoring, user?.id, openRoleSheet])

  /** 取消收藏：DELETE 后局部移除（Tab 计数随列表长度联动，不整页刷新）；失败 toast 卡片保留。
   * ref 锁防同 tick 双击双发（state 锁在同批点击内不生效） */
  const unfavorite = useCallback(
    async (tutorialId: number) => {
      if (favInFlightRef.current) return
      favInFlightRef.current = true
      setBusyFavId(tutorialId)
      try {
        await del<FavoriteResult>(`/api/favorites/${tutorialId}`)
        setState((s) => ({ ...s, favorites: s.favorites.filter((item) => item.tutorialId !== tutorialId) }))
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : '取消收藏失败，请重试')
      } finally {
        favInFlightRef.current = false
        setBusyFavId(null)
      }
    },
    [showToast],
  )

  // 下拉刷新（交互 5 跨端取最新，复用列表页 UI-IXD-13 模式）
  const { armed, refreshing } = usePullToRefresh(listBodyRef, () => load('refresh'))

  /** 直达（TabBar 进入无历史）时返回首页，避免 navigate(-1) 退出应用 */
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (idx !== undefined && idx > 0) navigate(-1)
    else navigate('/')
  }

  // 双面板共用骨架/错误分支：仅活动面板渲染（testid 唯一）；数据列表双面板常驻（Tab 切换不重取）
  const skeleton = (
    <div data-testid="pane-skeleton">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <div className="sk-fcard" key={i}>
          <span className="sk-thumb" />
          <span className="sk-lines">
            <span className="sk-line w90" />
            <span className="sk-line w60" />
          </span>
        </div>
      ))}
    </div>
  )
  const errorView = (
    <div className="load-error" data-testid="load-error">
      加载失败，请稍后重试
      <button type="button" data-testid="load-retry-btn" onClick={() => void load('skeleton')}>
        重试
      </button>
    </div>
  )
  const paneBody = (pane: TabKey, list: FavoriteItem[] | HistoryItem[], emptyView: ReactNode, children: ReactNode) => {
    if (pane !== tab && (state.loading || state.error)) return null
    return state.loading ? skeleton : state.error ? errorView : list.length === 0 ? (user ? emptyView : null) : children
  }

  return (
    <PhoneShell
      tabBar={<TabBar />}
      header={
        <header>
          <div className="nav">
            <button type="button" className="back" data-testid="back-btn" onClick={goBack}>
              ‹
            </button>
            <span className="nav-title" data-testid="fav-nav-title">
              收藏与历史
            </span>
          </div>
          <div className="tabs">
            <button
              type="button"
              className={`tab-btn${tab === 'fav' ? ' on' : ''}`}
              data-testid="tab-fav"
              onClick={() => setTab('fav')}
            >
              收藏<em>{state.favorites.length}</em>
            </button>
            <button
              type="button"
              className={`tab-btn${tab === 'his' ? ' on' : ''}`}
              data-testid="tab-his"
              onClick={() => setTab('his')}
            >
              历史<em>{state.histories.length}</em>
            </button>
          </div>
          <div className="sync-note" data-testid="sync-note">
            🔄 与 PC 端实时同步 · 任一端收藏 / 取消，另一端刷新即可见
          </div>
        </header>
      }
    >
      <div className="list-body" ref={listBodyRef}>
        <div className="refresh" data-testid="refresh-bar">
          <span className={`arr${armed ? ' up' : ''}${refreshing ? ' spin' : ''}`}>↑</span>
          {refreshing ? '正在刷新…' : <>下拉刷新… <span className="sep">·</span> 任一端操作后下拉取最新</>}
        </div>

        {/* 未登录（或登录中放弃）：引导选角色登录，登录后本页自动加载 */}
        {!restoring && !user && (
          <div className="empty" data-testid="guest-guide">
            <div className="e-ico">🔑</div>
            <div className="e-title">登录后查看收藏与历史</div>
            <div className="e-sub">与 PC 端共用同一账号数据，任一端操作另一端刷新即可见</div>
            <button type="button" className="e-btn" data-testid="guest-login-btn" onClick={() => openRoleSheet()}>
              选角色登录
            </button>
          </div>
        )}

        {/* 收藏面板：列表/已下架灰显/空态引导（AC-FN-15 m 端承载） */}
        <div className={tab === 'fav' ? '' : 'hidden'} data-testid="pane-fav">
          {paneBody(
            'fav',
            state.favorites,
            <div className="empty" data-testid="empty-fav">
              <div className="e-ico">⭐</div>
              <div className="e-title">暂无收藏</div>
              <div className="e-sub">收藏的教程会显示在这里，与 PC 端实时同步</div>
              <Link className="e-btn" to="/" data-testid="empty-fav-home-link">
                去首页逛逛
              </Link>
            </div>,
            <>
              {state.favorites.map((item) => (
                <FavoriteCard
                  key={item.tutorialId}
                  item={item}
                  busy={busyFavId !== null}
                  onUnfavorite={(tutorialId) => void unfavorite(tutorialId)}
                />
              ))}
              <div className="empty-hint" data-testid="fav-end-hint">
                已下架教程仅作留存展示，不可进入正文
              </div>
            </>,
          )}
        </div>

        {/* 历史面板：倒序列表 + 进度环（AC-FN-23/AC-RULE-11） */}
        <div className={tab === 'his' ? '' : 'hidden'} data-testid="pane-his">
          {paneBody(
            'his',
            state.histories,
            <div className="empty" data-testid="empty-his">
              <div className="e-ico">🕘</div>
              <div className="e-title">暂无阅读记录</div>
              <div className="e-sub">登录后阅读教程会自动记录进度，三端一致</div>
            </div>,
            <>
              {state.histories.map((item) => (
                <HistoryCard key={item.tutorialId} item={item} />
              ))}
              <div className="empty-hint" data-testid="his-end-hint">
                阅读进度按账号记录，三端一致
              </div>
            </>,
          )}
        </div>
      </div>

      {toast && (
        <div className="mtoast" data-testid="m-toast">
          {toast}
        </div>
      )}
    </PhoneShell>
  )
}
