import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, get, post } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import type { CheckinResult, CheckinStatus } from '../../shared/types'
import BadgeCard from '../components/BadgeCard'
import PhoneShell from '../components/PhoneShell'
import { useRoleSheet } from '../components/RoleSheet'
import TabBar from '../components/TabBar'
import WeekCalendar, { summarizeWeek } from '../components/WeekCalendar'

/** 徽章 key（后端 badges 数组元素）与阈值（AC-RULE-12：坚持者=连续 7 天；百科达人=累计完成 20 篇） */
const BADGE_PERSIST = 'persist'
const BADGE_ENCYCLOPEDIA = 'encyclopedia'
const PERSIST_TARGET_DAYS = 7
const ENCYCLOPEDIA_TARGET_TUTORIALS = 20
const BADGE_TOTAL = 2
/** 每日打卡积分（与后端 CHECKIN_POINTS 一致，「今日打卡后 N+10 分」预告用） */
const POINTS_PER_CHECKIN = 10

interface CheckinPageState {
  loading: boolean
  error: boolean
  data: CheckinStatus | null
}

/** 未登录/等待登录引导：不进取数流程，页面渲染登录引导（避免误导「全 0 新用户」） */
const INITIAL_STATE: CheckinPageState = { loading: false, error: false, data: null }

/** 浏览器本地日期串 yyyy-MM-dd（仅周历三态判定；演示环境与服务器本地日期一致） */
function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * m 学习打卡页 #/checkin（ui_m_checkin.html，FE-06）：
 * 本周日历卡（✓绿/✕灰/今橙）+ 积分卡（渐变蓝 + 打卡后 +10 动效）
 * + 徽章墙（坚持者 streak/7、百科达人 completedTutorials/20，锁定/解锁）+ 底部打卡大按钮
 * （POST /api/checkins 幂等：duplicated → toast「今日已打卡」积分不增，AC-FN-16/AC-RULE-12）
 * + 未登录 RoleSheet 引导登录后自动加载（AC-FN-03 同款模式）。
 */
export default function Checkin() {
  const navigate = useNavigate()
  const { user, restoring } = useAuth()
  const { openRoleSheet } = useRoleSheet()

  const [state, setState] = useState<CheckinPageState>(INITIAL_STATE)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  /** 首次打卡成功后积分数字 +10 弹跳动效开关（600ms 自动关） */
  const [pointsPulse, setPointsPulse] = useState(false)

  const toastTimer = useRef(0)
  const pulseTimer = useRef(0)
  const requestIdRef = useRef(0)
  /** 在途锁走 ref 而非 busy 状态：同步双击时 setState 未及生效，仅按钮禁用挡不住同一宏任务内的第二次 click */
  const busyRef = useRef(false)
  const loadRef = useRef<() => Promise<void>>(async () => {})

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2000)
  }, [])
  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current)
      window.clearTimeout(pulseTimer.current)
    },
    [],
  )

  /** 取打卡状态聚合；401 已由 api.ts 广播弹 RoleSheet，回空态待登录后自动重载 */
  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setState({ loading: true, error: false, data: null })
    try {
      const data = await get<CheckinStatus>('/api/checkins')
      if (requestIdRef.current !== requestId) return
      setState({ loading: false, error: false, data })
    } catch (err) {
      if (requestIdRef.current !== requestId) return
      if (err instanceof ApiError && err.code === 401) setState(INITIAL_STATE)
      else setState({ loading: false, error: true, data: null })
    }
  }, [])
  loadRef.current = load

  // 进入/登录态变化：未登录弹 RoleSheet 引导（登录后 user 变化自动回本页加载，AC-FN-03）
  useEffect(() => {
    if (restoring) return
    if (!user) {
      openRoleSheet()
      return
    }
    void loadRef.current()
  }, [restoring, user?.id, openRoleSheet])

  /**
   * 今日打卡：按钮 loading 禁用防抖（在途仅首次生效）；duplicated=true 幂等分支积分不增
   * （响应 totalPoints 与库内一致，统一按响应回写即天然不涨）；成功后本地推进今日格，
   * 不整页重取。失败恢复可点可重试。
   */
  const submit = useCallback(async () => {
    if (busyRef.current || !state.data || state.data.todayChecked) return
    busyRef.current = true
    setBusy(true)
    try {
      const result = await post<CheckinResult>('/api/checkins', {})
      if (result.duplicated) showToast('今日已打卡')
      else {
        showToast('打卡成功 +10 积分')
        setPointsPulse(true)
        window.clearTimeout(pulseTimer.current)
        pulseTimer.current = window.setTimeout(() => setPointsPulse(false), 600)
      }
      setState((s) => ({
        ...s,
        data: s.data && {
          ...s.data,
          todayChecked: true,
          totalPoints: result.totalPoints,
          streak: result.streak,
          badges: result.badges,
          weekCalendar: s.data.weekCalendar.map((day) =>
            day.date === result.checkinDate ? { ...day, isChecked: true } : day,
          ),
        },
      }))
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '打卡失败，请重试')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }, [state.data, showToast])

  /** 直达（TabBar 进入无历史）时返回首页，避免 navigate(-1) 退出应用 */
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (idx !== undefined && idx > 0) navigate(-1)
    else navigate('/')
  }

  const data = state.data
  const today = toLocalDateStr(new Date())
  const summary = data ? summarizeWeek(data.weekCalendar, today) : null
  const checked = data?.todayChecked ?? false
  const streak = data?.streak ?? 0
  const unlockedCount = data
    ? [BADGE_PERSIST, BADGE_ENCYCLOPEDIA].filter((key) => data.badges.includes(key)).length
    : 0

  return (
    <PhoneShell
      tabBar={<TabBar />}
      footer={
        <div className="cta">
          <button
            type="button"
            className="cta-btn"
            data-testid="checkin-submit-btn"
            disabled={busy || !data || checked}
            onClick={() => void submit()}
          >
            {busy ? '打卡中…' : checked ? '📅 今日已打卡' : '📅 今日打卡 +10 积分'}
          </button>
          <div className="cta-note" data-testid="checkin-btn-note">
            {checked
              ? `今日已打卡 · 已连续 ${streak} 天 · 明日记得再来`
              : `今日未打卡 · 打卡后连续 ${streak + 1} 天 · 当日重复点击无效`}
          </div>
        </div>
      }
      header={
        <div className="nav">
          <button type="button" className="back" data-testid="back-btn" onClick={goBack}>
            ‹
          </button>
          <span className="nav-title" data-testid="checkin-nav-title">
            学习打卡
          </span>
        </div>
      }
    >
      <div className="body">
        {/* 骨架屏：日历/积分/徽章三区块灰块占位（交互 1 Loading 态） */}
        {state.loading && (
          <div data-testid="checkin-skeleton">
            <div className="cal-card">
              <span className="sk-line w40" />
              <span className="sk-line w60" />
              <div className="cal-grid">
                {Array.from({ length: 7 }, (_, i) => (
                  <span className="sk-day" key={i} />
                ))}
              </div>
            </div>
            <div className="sk-block" />
            <div className="sk-bcard" />
            <div className="sk-bcard" />
          </div>
        )}

        {state.error && (
          <div className="load-error" data-testid="load-error">
            加载失败，请稍后重试
            <button type="button" data-testid="load-retry-btn" onClick={() => void load()}>
              重试
            </button>
          </div>
        )}

        {/* 未登录（或登录中放弃）：引导选角色登录，登录后本页自动加载 */}
        {!restoring && !user && (
          <div className="empty" data-testid="guest-guide">
            <div className="e-ico">📅</div>
            <div className="e-title">登录后开始学习打卡</div>
            <div className="e-sub">每日打卡 +10 积分，连续 7 天赢「坚持者」徽章</div>
            <button type="button" className="e-btn" data-testid="guest-login-btn" onClick={() => openRoleSheet()}>
              选角色登录
            </button>
          </div>
        )}

        {data && (
          <>
            {/* 日历卡：头部统计 + 本周 7 格三态 + 图例 */}
            <div className="cal-card">
              <div className="cal-title">📅 本周打卡</div>
              <div className="cal-sub" data-testid="cal-stats">
                连续 <b>{streak}</b> 天 · 本月累计 <b>{summary?.monthCount ?? 0}</b> 天 · 已打卡{' '}
                <b>{summary?.doneCount ?? 0}</b>/{data.weekCalendar.length} 天
              </div>
              <WeekCalendar weekCalendar={data.weekCalendar} today={today} todayChecked={data.todayChecked} />
            </div>

            {/* 积分卡：当前积分 + 今日打卡后预告 + 规则文案 */}
            <div className="pt-card" data-testid="points-card">
              <div>
                <div className="pt-label">当前积分</div>
                <div className="pt-row">
                  <span className={`pt-num${pointsPulse ? ' pop' : ''}`} data-testid="points-num">
                    {data.totalPoints}
                  </span>
                  <span className="pt-unit">分</span>
                </div>
                <div className="pt-next" data-testid="points-next">
                  {checked ? '今日已打卡 · 积分已到账' : `今日打卡后 ${data.totalPoints + POINTS_PER_CHECKIN} 分`}
                </div>
              </div>
              <span className="pt-pill">+10 积分 / 天</span>
            </div>
            <div className="pt-rule">
              打卡规则：每日可打卡 1 次 +10 积分；中断只清连续天数，不清积分、不扣徽章进度。
            </div>

            {/* 徽章墙：解锁计数 + 去学习入口 + 两张徽章卡 */}
            <div className="sec-hd sec-hd-gap">
              <span className="sec-title">
                徽章墙<em data-testid="badge-wall-count">{unlockedCount} / {BADGE_TOTAL} 已解锁</em>
              </span>
              <Link className="sec-more" to="/list" data-testid="go-learn-link">
                去学习 ›
              </Link>
            </div>
            <BadgeCard
              icon="🏅"
              name="坚持者"
              unlocked={data.badges.includes(BADGE_PERSIST)}
              current={streak}
              target={PERSIST_TARGET_DAYS}
              unit="天"
              desc={`需连续打卡 ${PERSIST_TARGET_DAYS} 天 · 当前连续 ${streak} 天`}
              note="中断后从第 1 天重新累计"
              testid="badge-card-persist"
            />
            <BadgeCard
              icon="📖"
              name="百科达人"
              unlocked={data.badges.includes(BADGE_ENCYCLOPEDIA)}
              current={data.completedTutorials}
              target={ENCYCLOPEDIA_TARGET_TUTORIALS}
              unit="篇"
              desc={`需累计完成 ${ENCYCLOPEDIA_TARGET_TUTORIALS} 篇教程 · 已完成 ${data.completedTutorials} 篇`}
              note="阅读进度 100% 记为完成"
              testid="badge-card-encyclopedia"
            />
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
