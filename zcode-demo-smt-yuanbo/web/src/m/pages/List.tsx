import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { get } from '../../shared/api'
import type { Category, Page, Tutorial } from '../../shared/types'
import PhoneShell from '../components/PhoneShell'
import TabBar from '../components/TabBar'
import TutorialCard from '../components/TutorialCard'
import { usePullToRefresh } from '../usePullToRefresh'

/** 关键词搜索 1s 超时兜底（AC-EG-11：中止请求并提示「搜索超时，请重试」） */
const SEARCH_TIMEOUT_MS = 1000
/** 列表分页：与 PC 同口径 page=1&pageSize=20（同端点同参数） */
const PAGE_SIZE = 20
/** 骨架屏灰卡数（任务交互 1：3 张占位） */
const CARD_SKELETON_COUNT = 3
/** chips 加载占位数（仅撑住行高，纯展示） */
const CHIP_SKELETON_COUNT = 5

type ListError = 'timeout' | 'network' | null

interface ListState {
  loading: boolean
  list: Tutorial[]
  total: number
  error: ListError
}

const INITIAL_LIST_STATE: ListState = { loading: true, list: [], total: 0, error: null }

/** HH:mm（下拉刷新「上次更新」口径，ui_m_list.html） */
function formatHm(date: Date): string {
  const two = (n: number) => String(n).padStart(2, '0')
  return `${two(date.getHours())}:${two(date.getMinutes())}`
}

/**
 * m 列表搜索页 #/list（ui_m_list.html，AC-FN-24/AC-FN-08、AC-EG-11、UI-IXD-13）：
 * 顶部返回导航 + 搜索框（进入即聚焦）+ 横滑分类 chips + 下拉刷新 + 教程卡片流。
 * keyword/categoryId 以 URL 参数为单一数据源（首页宫格携参进入、chip/搜索切换均同步 URL）。
 */
export default function List() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const keyword = (searchParams.get('keyword') ?? '').trim()
  const rawCategoryId = searchParams.get('categoryId')
  const categoryId =
    rawCategoryId !== null && Number.isFinite(Number(rawCategoryId)) ? Number(rawCategoryId) : null

  // 输入框草稿（未提交），提交时写入 URL；URL keyword 变化（如清空筛选）回写草稿
  const [input, setInput] = useState(keyword)
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [listState, setListState] = useState<ListState>(INITIAL_LIST_STATE)
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [toast, setToast] = useState<string | null>(null)

  const listBodyRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const toastTimer = useRef<number>(0)
  // load 供下拉刷新钩子等异步回调经 ref 取最新闭包，避免闭包过期
  const loadRef = useRef<(mode: 'skeleton' | 'refresh') => Promise<void>>(async () => {})

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  /**
   * 取列表：mode=skeleton（初始化/搜索/chip 切换，骨架屏+回顶）或 refresh（下拉刷新，
   * 保留原列表；refreshing 自旋由 usePullToRefresh 管理）。带关键词时 fetch 竞速 1s
   * 超时（AC-EG-11）；新请求自动中止上一个。
   */
  const load = useCallback(
    async (mode: 'skeleton' | 'refresh') => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      if (mode === 'skeleton') {
        setListState(INITIAL_LIST_STATE)
        listBodyRef.current?.closest('.scroll')?.scrollTo(0, 0)
      }
      const timeoutId = keyword
        ? window.setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
        : 0
      try {
        const query = new URLSearchParams({ page: '1', pageSize: String(PAGE_SIZE) })
        if (keyword) query.set('keyword', keyword)
        if (categoryId !== null) query.set('categoryId', String(categoryId))
        const data = await get<Page<Tutorial>>(`/api/tutorials?${query}`, controller.signal)
        if (controller !== abortRef.current) return // 已被更新的请求取代，丢弃过期响应
        setListState({
          loading: false,
          list: data.list ?? [],
          total: data.total ?? 0,
          error: null,
        })
        setLastUpdated(new Date())
      } catch {
        // 被新请求取代的旧中止不算失败；当前请求被 1s 兜底中止 → 超时提示（AC-EG-11）
        if (controller !== abortRef.current) return
        if (controller.signal.aborted) {
          setListState((s) => ({ ...s, loading: false, error: 'timeout' }))
        } else if (mode === 'refresh') {
          // 下拉刷新失败：toast + 保留原列表（任务交互 4 空态处理）
          showToast('刷新失败，请重试')
        } else {
          setListState((s) => ({ ...s, loading: false, error: 'network' }))
        }
      } finally {
        window.clearTimeout(timeoutId)
      }
    },
    [keyword, categoryId, showToast],
  )
  loadRef.current = load

  // 下拉刷新（UI-IXD-13）：armed/refreshing 与拖拽位移由共用钩子管理
  const { armed, refreshing } = usePullToRefresh(listBodyRef, () => load('refresh'))

  // keyword/categoryId 变化（URL 驱动）→ 骨架屏重取；mount 时首次加载
  useEffect(() => {
    load('skeleton')
  }, [load])

  // chips：一级启用分类（与 PC 筛选树同口径），进页取一次
  useEffect(() => {
    let alive = true
    get<{ list: Category[] }>('/api/categories')
      .then((data) => {
        if (alive)
          setCategories(
            data.list.filter((c) => c.status === 'enabled' && c.parentId === null),
          )
      })
      .catch(() => {
        if (alive) setCategories([])
      })
    return () => {
      alive = false
    }
  }, [])

  // URL keyword 变化时回写输入草稿（清空筛选等场景）
  useEffect(() => {
    setInput(keyword)
  }, [keyword])

  /** 提交搜索 / 切 chip：写入 URL（单一数据源）；参数未变时（重试/同词重搜）直接重取 */
  const applyFilters = useCallback(
    (next: { keyword?: string; categoryId?: number | null }) => {
      const kw = next.keyword !== undefined ? next.keyword : keyword
      const cat = next.categoryId !== undefined ? next.categoryId : categoryId
      if (kw === keyword && cat === categoryId) {
        void loadRef.current('skeleton')
        return
      }
      const params: Record<string, string> = {}
      if (kw) params.keyword = kw
      if (cat !== null) params.categoryId = String(cat)
      setSearchParams(params)
    },
    [keyword, categoryId, setSearchParams],
  )

  /** 直达（TabBar 进入无历史）时返回首页，避免 navigate(-1) 退出应用 */
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (idx !== undefined && idx > 0) navigate(-1)
    else navigate('/')
  }

  const activeCategoryName = useMemo(() => {
    if (categoryId === null) return null
    return (
      categories?.find((c) => c.id === categoryId)?.name ??
      searchParams.get('name') ??
      '指定分类'
    )
  }, [categories, categoryId, searchParams])

  const categoryDistribution = useMemo(() => {
    const counter = new Map<string, number>()
    for (const item of listState.list) {
      counter.set(item.categoryName, (counter.get(item.categoryName) ?? 0) + 1)
    }
    return [...counter.entries()].sort((a, b) => b[1] - a[1])
  }, [listState.list])

  const busy = listState.loading || refreshing

  return (
    <PhoneShell
      tabBar={<TabBar />}
      header={
        <header>
          <div className="nav">
            <button type="button" className="back" onClick={goBack} data-testid="back-btn">
              ‹
            </button>
            <span className="nav-title">教程列表</span>
          </div>
          <form
            className="searchrow"
            onSubmit={(e) => {
              e.preventDefault()
              applyFilters({ keyword: input.trim() })
            }}
          >
            <div className="sinput">
              🔍
              <input
                className="s-ipt"
                data-testid="search-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="搜索教程：标题 / 摘要 / 标签"
                autoFocus
                enterKeyHint="search"
              />
            </div>
            <button type="submit" className="sbtn" disabled={busy} data-testid="search-btn">
              {listState.loading ? '搜索中' : '搜索'}
            </button>
          </form>
          <div className="chips" data-testid="category-chips">
            <button
              type="button"
              className={`chip${categoryId === null ? ' on' : ''}`}
              onClick={() => applyFilters({ categoryId: null })}
              disabled={busy}
              data-testid="chip-all"
            >
              全部
            </button>
            {categories === null
              ? Array.from({ length: CHIP_SKELETON_COUNT }, (_, i) => (
                  <span className="chip sk" key={i} />
                ))
              : categories.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    className={`chip${categoryId === c.id ? ' on' : ''}`}
                    onClick={() => applyFilters({ categoryId: c.id })}
                    disabled={busy}
                    data-testid={`chip-${c.id}`}
                  >
                    {c.name}
                  </button>
                ))}
          </div>
        </header>
      }
    >
      <div className="list-body" ref={listBodyRef}>
        {/* 下拉刷新提示条（UI-IXD-13）：默认「下拉刷新…·上次更新」，释放后「正在刷新…」自旋 */}
        <div className="refresh" data-testid="refresh-bar">
          <span className={`arr${armed ? ' up' : ''}${refreshing ? ' spin' : ''}`}>↑</span>
          {refreshing ? (
            '正在刷新…'
          ) : (
            <>
              下拉刷新… <span className="sep">·</span> 上次更新 {formatHm(lastUpdated)}
            </>
          )}
        </div>

        {!listState.loading && listState.error !== 'timeout' && (keyword || activeCategoryName) && (
          <div className="result-line" data-testid="result-line">
            {keyword && (
              <>
                「<b>{keyword}</b>」相关结果 {listState.total} 篇
              </>
            )}
            {keyword && activeCategoryName && ' · '}
            {activeCategoryName && <>当前筛选：{activeCategoryName}</>}
          </div>
        )}

        {/* 1s 超时兜底（AC-EG-11）：提示条 + 保留关键词一键重试 */}
        {listState.error === 'timeout' && (
          <div className="timeout-tip" data-testid="timeout-tip">
            搜索超时，请重试
            <button
              type="button"
              onClick={() => void loadRef.current('skeleton')}
              data-testid="timeout-retry-btn"
            >
              重试
            </button>
          </div>
        )}

        {listState.loading ? (
          <div data-testid="list-skeleton">
            {Array.from({ length: CARD_SKELETON_COUNT }, (_, i) => (
              <div className="sk-tcard" key={i}>
                <div className="sk-line w60" />
                <div className="sk-line w90" />
                <div className="sk-line w40" />
              </div>
            ))}
          </div>
        ) : listState.error === 'network' ? (
          <div className="load-error" data-testid="load-error">
            加载失败，请稍后重试
            <button
              type="button"
              onClick={() => void loadRef.current('skeleton')}
              data-testid="load-retry-btn"
            >
              重试
            </button>
          </div>
        ) : listState.list.length === 0 ? (
          // 空态引导（AC-FN-02 同源文案）：清空筛选 + 去分类浏览
          <div className="empty" data-testid="empty-state">
            <div className="e-ico">🔍</div>
            <div className="e-title">未找到相关教程</div>
            <div className="e-sub">换个关键词试试，或清空筛选浏览全部内容</div>
            <button
              type="button"
              className="e-btn"
              onClick={() => {
                setInput('')
                applyFilters({ keyword: '', categoryId: null })
              }}
              data-testid="empty-clear-btn"
            >
              清空筛选
            </button>
            <Link className="e-link" to="/" data-testid="empty-browse-link">
              去分类浏览 ›
            </Link>
          </div>
        ) : (
          <>
            {listState.list.map((tutorial) => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} keyword={keyword} />
            ))}
            <div className="empty-hint" data-testid="list-end">
              — 已加载全部 {listState.total} 篇
              {categoryDistribution.length > 0 && (
                <>（{categoryDistribution.map(([name, n]) => `${name} ${n} 篇`).join(' + ')}）</>
              )}
              —
            </div>
          </>
        )}
      </div>
      {toast && (
        <div className="mtoast" data-testid="m-toast">
          {toast}
        </div>
      )}
    </PhoneShell>
  )
}
