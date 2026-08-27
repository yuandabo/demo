import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, AUTH_REQUIRED_EVENT, del, get } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import { personaName, rolePersonaText } from '../../shared/constants'
import { fmtNum, fmtTime } from '../../shared/format'
import type { FavoriteItem, FavoriteResult, HistoryItem, Page, Tutorial } from '../../shared/types'
import './My.css'

/** 取数口径固定 page=1&pageSize=20（任务交互 1）；Tab 徽标用响应 total，取消收藏本地 -1 联动 */
const PAGE_SIZE = 20
/** 面板骨架行数（交互 1 Loading 态） */
const SKELETON_ROWS = 3
const TOAST_MS = 2000
const TIP_UNFAV_FAIL = '取消收藏失败，请重试'
/** 历史面板底部固定说明（元素表） */
const SYNC_NOTE = '提示：阅读进度按滚动位置与步骤勾选自动保存，同一账号在小程序端续读同步。'
/** 已下架正文不可见说明（收藏/历史两面板共用，AC-FN-20） */
const OFFLINE_NOTE = '该教程已下架，正文不可见'

type TabKey = 'fav' | 'his'

/** 离线条目同类推荐位：分类 → 同类可见教程首条；null=该分类暂无可见教程（仅显示浏览更多） */
type RelEntry = { id: number; title: string } | null

interface MyPageState {
  loading: boolean
  error: boolean
  favorites: FavoriteItem[]
  histories: HistoryItem[]
  favTotal: number
  hisTotal: number
}

/** 401/未登录基线：面板不渲染"暂无收藏"空态（避免误导），走登录引导视图 */
const INITIAL_STATE: MyPageState = {
  loading: false,
  error: false,
  favorites: [],
  histories: [],
  favTotal: 0,
  hisTotal: 0,
}

/**
 * 进度徽章三档配色（元素表/验收标准）：100% 绿 .full；1-99% 中间档蓝 .mid；
 * 低进度橙 .low。分档界取 50（原型锚点：60/75=mid、25/40=low，50 为自然中点）。
 */
function progressTier(progress: number): 'full' | 'mid' | 'low' {
  if (progress >= 100) return 'full'
  return progress >= 50 ? 'mid' : 'low'
}

/** 进度徽章 + mini 进度条（AC-FN-23：三档配色，width=progress%） */
function ProgressView({ tutorialId, progress }: { tutorialId: number; progress: number }) {
  return (
    <>
      <span className={`pb ${progressTier(progress)}`} data-testid={`his-progress-badge-${tutorialId}`}>
        {progress}%
      </span>
      <span className="mini-prog" aria-hidden>
        <i data-testid={`his-mini-bar-${tutorialId}`} style={{ width: `${progress}%` }} />
      </span>
    </>
  )
}

/** 已下架同类推荐行：《同类教程》→ #/detail/:id 与 浏览{分类}更多 → #/list?categoryId=（AC-FN-20/AC-EG-10） */
function OfflineRelLinks({
  tutorialId,
  categoryId,
  categoryName,
  rel,
}: {
  tutorialId: number
  categoryId: number
  categoryName: string | null
  rel: RelEntry
}) {
  return (
    <p>
      同类推荐：
      {rel ? (
        <Link className="rel-link" to={`/detail/${rel.id}`} data-testid={`offline-rel-link-${tutorialId}`}>
          《{rel.title}》→
        </Link>
      ) : (
        <span className="rel-ph">该分类暂无可见教程</span>
      )}
      &nbsp;&nbsp;
      <Link
        className="rel-link"
        to={`/list?categoryId=${categoryId}`}
        data-testid={`offline-more-link-${tutorialId}`}
      >
        浏览{categoryName ?? '同类'}更多教程 →
      </Link>
    </p>
  )
}

/** 收藏条目行：正常条目整行进详情；已下架灰显 + 徽章 + 不可访问（UI-ELEM-02/AC-FN-20） */
function FavoriteRow({
  item,
  busy,
  rel,
  onUnfavorite,
}: {
  item: FavoriteItem
  busy: boolean
  rel: RelEntry
  onUnfavorite: (tutorialId: number) => void
}) {
  const meta = item.isOffline
    ? `${item.categoryName ?? '未分类'} · 收藏于 ${item.favoritedAt.slice(0, 10)} · ${OFFLINE_NOTE}`
    : `${item.categoryName ?? '未分类'} · 收藏于 ${item.favoritedAt.slice(0, 10)} · 👁 ${fmtNum(item.viewCount)}${
        item.tags.length ? ` · ${item.tags.map((t) => `#${t}`).join(' ')}` : ''
      }`
  const body = (
    <>
      <span className="st" aria-hidden>
        ⭐
      </span>
      <div className="mid">
        <h3>
          {item.title}
          {item.isOffline && (
            <span className="badge-off" data-testid={`offline-badge-${item.tutorialId}`}>
              已下架
            </span>
          )}
        </h3>
        <p>{meta}</p>
        {item.isOffline && (
          <OfflineRelLinks
            tutorialId={item.tutorialId}
            categoryId={item.categoryId}
            categoryName={item.categoryName}
            rel={rel}
          />
        )}
      </div>
      <div className="ops">
        {item.isOffline ? (
          <button
            type="button"
            className="btn btn-g"
            disabled
            data-testid={`offline-forbid-btn-${item.tutorialId}`}
          >
            不可访问
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-g"
            data-testid={`fav-unfav-btn-${item.tutorialId}`}
            disabled={busy}
            onClick={(e) => {
              // 阻断冒泡到整行 Link（原型 event.preventDefault() 同款防误跳详情）
              e.preventDefault()
              e.stopPropagation()
              onUnfavorite(item.tutorialId)
            }}
          >
            {busy ? '取消中…' : '取消收藏'}
          </button>
        )}
      </div>
    </>
  )
  return item.isOffline ? (
    <div className="mrow card off" data-testid={`fav-item-${item.tutorialId}`}>
      {body}
    </div>
  ) : (
    <Link className="mrow card" to={`/detail/${item.tutorialId}`} data-testid={`fav-item-${item.tutorialId}`}>
      {body}
    </Link>
  )
}

/**
 * 历史条目行：进度徽章 + mini 进度条 + 续读按钮（<100% 继续阅读 → / =100% 重新学习），
 * 正常条目整行进详情续读（AC-FN-23/UI-IXD-11 链路，详情页按 myProgress 定位）；
 * 已下架灰显保留进度徽章、不可进正文（交互 4 历史面板同规格）。
 */
function HistoryRow({ item, rel }: { item: HistoryItem; rel: RelEntry }) {
  const done = item.progress >= 100
  const body = (
    <>
      <span className="st" aria-hidden>
        📄
      </span>
      <div className="mid">
        <h3>
          {item.title}
          {item.isOffline && (
            <span className="badge-off" data-testid={`offline-badge-${item.tutorialId}`}>
              已下架
            </span>
          )}
        </h3>
        <p>
          {item.categoryName ?? '未分类'} · 最近阅读 {fmtTime(item.updatedAt)}
          {item.isOffline ? ` · ${OFFLINE_NOTE}` : ''}
        </p>
        {item.isOffline && (
          <OfflineRelLinks
            tutorialId={item.tutorialId}
            categoryId={item.categoryId}
            categoryName={item.categoryName}
            rel={rel}
          />
        )}
      </div>
      <div className="ops">
        <ProgressView tutorialId={item.tutorialId} progress={item.progress} />
        {item.isOffline ? (
          <button
            type="button"
            className="btn btn-g"
            disabled
            data-testid={`offline-forbid-btn-${item.tutorialId}`}
          >
            不可访问
          </button>
        ) : (
          /* 无 onClick：点击自然冒泡到整行 Link 完成跳转（原型同款） */
          <button
            type="button"
            className={`btn ${done ? 'btn-g' : 'btn-p'}`}
            data-testid={`his-resume-btn-${item.tutorialId}`}
          >
            {done ? '重新学习' : '继续阅读 →'}
          </button>
        )}
      </div>
    </>
  )
  return item.isOffline ? (
    <div className="mrow card off" data-testid={`his-item-${item.tutorialId}`}>
      {body}
    </div>
  ) : (
    <Link className="mrow card" to={`/detail/${item.tutorialId}`} data-testid={`his-item-${item.tutorialId}`}>
      {body}
    </Link>
  )
}

/** 面板空态（虚线框 + 去浏览入口，任务元素表） */
function EmptyTip({ icon, title, sub, action, testKey }: { icon: string; title: string; sub: string; action: string; testKey: string }) {
  return (
    <div className="empty-tip" data-testid={testKey}>
      <div className="e-ico" aria-hidden>
        {icon}
      </div>
      <b>{title}</b>
      <span className="e-sub">{sub}</span>
      <Link className="btn btn-p" to="/list" data-testid={`${testKey}-go-list-btn`}>
        {action}
      </Link>
    </div>
  )
}

/**
 * portal 我的学习页 #/my（FE-04，复刻 ui_portal_my.html）：
 * 收藏/浏览历史双 Tab（徽标 total 计数）+ 已下架灰显拦截（AC-FN-20/AC-EG-10/UI-ELEM-02）
 * + 进度徽章三档与续读跳转（AC-FN-23）+ 取消收藏（DELETE，局部移除徽标 -1）
 * + 未登录 401 经全局 RoleLoginModal 引导、登录成功回原位自动重载（AC-FN-03 同机制/AC-FN-15 PC 侧展示面）。
 */
export default function My() {
  const { user, restoring } = useAuth()
  const [tab, setTab] = useState<TabKey>('fav')
  const [state, setState] = useState<MyPageState>({ ...INITIAL_STATE, loading: true })
  const [relByCategory, setRelByCategory] = useState<Record<number, RelEntry>>({})
  const [busyFavId, setBusyFavId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const toastTimerRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)
  /** 已请求过同类推荐的分类去重镜像（避免每次重载重复请求） */
  const relFetchedRef = useRef<Set<number>>(new Set())
  /** 同 tick 连点闸：busyFavId 状态在批量点击内不重渲染，ref 锁先挡一道（口径同 DetailInteraction favInFlightRef） */
  const favInFlightRef = useRef(false)

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(null), TOAST_MS)
  }, [])

  useEffect(
    () => () => {
      if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current)
    },
    [],
  )

  /**
   * 并行取收藏+历史（同账号同数据源，AC-FN-15）：
   * 401 由 api.ts 清 token 并广播 auth:required → Layout 弹选角色登录，回未登录基线待登录后重载。
   */
  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setState((s) => ({ ...s, loading: true, error: false }))
    try {
      const [favPage, hisPage] = await Promise.all([
        get<Page<FavoriteItem>>(`/api/favorites?page=1&pageSize=${PAGE_SIZE}`),
        get<Page<HistoryItem>>(`/api/histories?page=1&pageSize=${PAGE_SIZE}`),
      ])
      if (requestIdRef.current !== requestId) return
      setState({
        loading: false,
        error: false,
        favorites: favPage.list ?? [],
        histories: hisPage.list ?? [],
        favTotal: favPage.total ?? 0,
        hisTotal: hisPage.total ?? 0,
      })
      loadRelated([...(favPage.list ?? []), ...(hisPage.list ?? [])])
    } catch (err) {
      if (requestIdRef.current !== requestId) return
      if (err instanceof ApiError && err.code === 401) setState(INITIAL_STATE)
      else setState((s) => ({ ...s, loading: false, error: true }))
    }
  }, [])

  /** 已下架条目同类推荐位：favorites/histories 契约不含 related，按分类去重经列表接口取同类可见教程首条；失败静默降级 */
  const loadRelated = (items: Array<FavoriteItem | HistoryItem>) => {
    const wanted = new Set<number>()
    items.forEach((item) => {
      if (item.isOffline && !relFetchedRef.current.has(item.categoryId)) wanted.add(item.categoryId)
    })
    if (wanted.size === 0) return
    wanted.forEach((id) => relFetchedRef.current.add(id))
    void Promise.all(
      [...wanted].map((categoryId) =>
        get<Page<Tutorial>>(`/api/tutorials?categoryId=${categoryId}&page=1&pageSize=1`)
          .then((page) => [categoryId, page.list?.[0] ?? null] as const)
          .catch(() => [categoryId, null] as const),
      ),
    ).then((entries) => {
      setRelByCategory((prev) => {
        const next = { ...prev }
        entries.forEach(([categoryId, tutorial]) => {
          next[categoryId] = tutorial ? { id: tutorial.id, title: tutorial.title } : null
        })
        return next
      })
    })
  }

  // 进入/登录态变化触发加载：restoring 在途不发（token 恢复前误发 401）；
  // 401 登录成功后 user 变化自动回 #/my 原位重载（AC-FN-03 同机制，交互 1）
  useEffect(() => {
    if (restoring) return
    void load()
  }, [restoring, user?.id, load])

  /** 取消收藏：DELETE 成功局部移除 + 徽标 -1；401 由全局弹窗接管登录后重载，其余失败 toast 且条目保留。
   * ref 锁防同 tick 双击双发（state 锁在同批点击内不生效） */
  const unfavorite = useCallback(
    async (tutorialId: number) => {
      if (favInFlightRef.current) return
      favInFlightRef.current = true
      setBusyFavId(tutorialId)
      try {
        await del<FavoriteResult>(`/api/favorites/${tutorialId}`)
        setState((s) => ({
          ...s,
          favorites: s.favorites.filter((item) => item.tutorialId !== tutorialId),
          favTotal: Math.max(0, s.favTotal - 1),
        }))
      } catch (err) {
        if (!(err instanceof ApiError && err.code === 401)) {
          showToast(err instanceof ApiError ? err.message : TIP_UNFAV_FAIL)
        }
      } finally {
        favInFlightRef.current = false
        setBusyFavId(null)
      }
    },
    [showToast],
  )

  const skeleton = (
    <div data-testid="my-skeleton">
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <div className="sk-mrow" key={i} />
      ))}
    </div>
  )
  const errorView = (
    <div className="my-error" data-testid="my-error">
      列表加载失败，请稍后重试
      <div>
        <button type="button" className="btn btn-p" data-testid="my-retry-btn" onClick={() => void load()}>
          重试
        </button>
      </div>
    </div>
  )
  /** 未登录引导：401 时全局弹窗已弹出，此处提供常驻登录入口（复用 auth:required 事件驱动 Layout 单例弹窗） */
  const guestView = (
    <div className="empty-tip" data-testid="my-guest-tip">
      <div className="e-ico" aria-hidden>
        🔑
      </div>
      <b>登录后查看收藏与阅读进度</b>
      <span className="e-sub">收藏与阅读进度在 PC / 小程序两端实时同步</span>
      <button
        type="button"
        className="btn btn-p"
        data-testid="my-guest-login-btn"
        onClick={() => window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT))}
      >
        选角色登录
      </button>
    </div>
  )

  const renderPane = () => {
    if (state.loading) return skeleton
    if (state.error) return errorView
    if (!user) return guestView
    if (tab === 'fav') {
      return state.favorites.length === 0 ? (
        <EmptyTip
          icon="⭐"
          title="暂无收藏"
          sub="收藏的教程会显示在这里，与小程序端实时同步"
          action="去浏览教程"
          testKey="empty-fav"
        />
      ) : (
        state.favorites.map((item) => (
          <FavoriteRow
            key={item.tutorialId}
            item={item}
            busy={busyFavId === item.tutorialId}
            rel={relByCategory[item.categoryId] ?? null}
            onUnfavorite={(tutorialId) => void unfavorite(tutorialId)}
          />
        ))
      )
    }
    return (
      <>
        {state.histories.length === 0 ? (
          <EmptyTip
            icon="🕘"
            title="暂无阅读记录"
            sub="阅读教程时进度自动保存，可从上次位置续读"
            action="去开始学习"
            testKey="empty-his"
          />
        ) : (
          state.histories.map((item) => (
            <HistoryRow key={item.tutorialId} item={item} rel={relByCategory[item.categoryId] ?? null} />
          ))
        )}
        <p className="his-note" data-testid="my-sync-note">
          {SYNC_NOTE}
        </p>
      </>
    )
  }

  return (
    <>
      {/* 用户信息头（元素表：头像角色名首字 + 标题 + 副文案） */}
      <div className="me-h">
        <div className="avatar" data-testid="my-avatar">
          {user ? personaName(user).charAt(0) : '客'}
        </div>
        <div>
          <h1 data-testid="my-title">我的学习</h1>
          <div className="sub" data-testid="my-sub">
            {user
              ? `${rolePersonaText(user)} · 收藏与阅读进度在 PC / 小程序两端实时同步`
              : '请登录后查看收藏与阅读进度'}
          </div>
        </div>
      </div>

      {/* 双 Tab（徽标 total 计数，交互 2 本地切换不重取） */}
      <div className="tabs">
        <button
          type="button"
          className={tab === 'fav' ? 'on' : ''}
          data-testid="my-tab-fav"
          onClick={() => setTab('fav')}
        >
          收藏列表<span className="n" data-testid="my-fav-total">{state.favTotal}</span>
        </button>
        <button
          type="button"
          className={tab === 'his' ? 'on' : ''}
          data-testid="my-tab-his"
          onClick={() => setTab('his')}
        >
          浏览历史<span className="n" data-testid="my-his-total">{state.hisTotal}</span>
        </button>
      </div>

      {/* 活动面板（数据在页面级 state，切换 Tab 保持已加载状态） */}
      <section data-testid={`pane-${tab}`}>{renderPane()}</section>

      {toast && (
        <div className="my-toast" data-testid="my-toast" role="status">
          {toast}
        </div>
      )}
    </>
  )
}
