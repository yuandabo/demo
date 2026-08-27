import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, del, emitLoginSuccess, getToken, onLoginSuccess, post } from '../../shared/api'
import { fmtNum } from '../../shared/format'
import type { FavoriteResult, FeedbackResult, PortalTutorialDetail } from '../../shared/types'
import RoleLoginModal from '../components/RoleLoginModal'
import ShareModal from '../components/ShareModal'

/** 留言长度上限（AC-RULE-20，输入 maxlength 与计数同源） */
const COMMENT_MAX = 200
/** toast 展示时长 */
const TOAST_MS = 2000
/** 未选评价点提交的提示（交互 3 空态） */
const TIP_PICK_FIRST = '请先选择「有帮助」或「没帮助」'
/** 提交成功提示（评价 upsert 唯一可改，AC-RULE-15） */
const TIP_FEEDBACK_OK = '反馈已提交，每篇教程仅一条评价，可随时修改'
/** 未登录引导副文案：收藏（元素表）/ 评价（AC-EG-07 原文口径） */
const LOGIN_SUB_FAV = '登录后才能收藏与评价，选择角色继续（免密演示，登录后回到原操作位）'
const LOGIN_SUB_VOTE = '登录后即可收藏/评价，选择角色继续（免密演示，登录后回到原操作位）'

/** 被登录引导中断、待重放的操作：本组件弹窗与全局 401 弹窗共用同一事件消费（AC-FN-03） */
interface PendingAction {
  kind: 'fav' | 'vote'
  helpful?: 1 | 0
  comment?: string
}

/** myFeedback 契约为 0/1/null；显式归一防脏数据（AC-FN-25） */
function normalizeFeedback(value: number | null): 1 | 0 | null {
  if (value === 1) return 1
  if (value === 0) return 0
  return null
}

interface DetailInteractionProps {
  data: PortalTutorialDetail
  /** 收藏数联动回调：标题区/信息卡与按钮计数同步（UI-IXD-06） */
  onFavCount: (favCount: number) => void
}

/**
 * 详情互动区（FE-03）：评价二选一互斥（选票即时高亮、提交落库两段式，UI-IXD-07）+
 * 留言条件展开（仅"没帮助"，UI-IXD-08）+ 收藏切换（UI-IXD-06）+ 分享（ShareModal）。
 * 未登录点击先弹选角色登录，登录成功经 auth:login-success 事件自动重放被中断操作并停留原位（AC-FN-03/AC-EG-07）。
 */
export default function DetailInteraction({ data, onFavCount }: DetailInteractionProps) {
  // 互动镜像状态：进入/换篇从详情派生，操作后按响应局部更新（刷新与小程序端同源一致，AC-FN-25）
  const [favorited, setFavorited] = useState(data.myFavorite === true)
  const [favCount, setFavCount] = useState(data.favCount)
  /** 两段式选择值：选择即时高亮，提交才落库（原型 vote+submitFb 两段）；成功后按响应回写 */
  const [picked, setPicked] = useState<1 | 0 | null>(() => normalizeFeedback(data.myFeedback))
  const [helpfulYes, setHelpfulYes] = useState(data.helpfulYes)
  const [helpfulNo, setHelpfulNo] = useState(data.helpfulNo)
  const [comment, setComment] = useState('')
  const [busyFav, setBusyFav] = useState(false)
  const [busyVote, setBusyVote] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginSubtitle, setLoginSubtitle] = useState(LOGIN_SUB_FAV)

  const commentRef = useRef<HTMLInputElement>(null)
  /** 仅点击触发展开时聚焦留言框（初始 myFeedback=0 展开但不抢焦点） */
  const focusCommentRef = useRef(false)
  const toastTimerRef = useRef<number | null>(null)
  /** 同 tick 连点闸：busy 状态在批量点击内不重渲染，ref 锁先挡一道（防连点） */
  const favInFlightRef = useRef(false)
  const voteInFlightRef = useRef(false)
  const pendingRef = useRef<PendingAction | null>(null)
  // 重放引用：登录成功事件回调里取最新闭包（fresh token/状态），避免 render 闭包过期
  const replayFavRef = useRef<() => void>(() => undefined)
  const replayVoteRef = useRef<(helpful: 1 | 0, withComment?: string) => void>(() => undefined)

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

  // 详情落地：互动镜像整体对齐（换篇/重试共用）
  useEffect(() => {
    setFavorited(data.myFavorite === true)
    setFavCount(data.favCount)
    setPicked(normalizeFeedback(data.myFeedback))
    setHelpfulYes(data.helpfulYes)
    setHelpfulNo(data.helpfulNo)
    setComment('')
  }, [data])

  // 点击"没帮助"后聚焦留言框（UI-IXD-08）；仅用户点击路径置位
  useEffect(() => {
    if (picked === 0 && focusCommentRef.current) {
      commentRef.current?.focus()
      focusCommentRef.current = false
    }
  }, [picked])

  /** 互动失败统一处理：401 记待重放（全局登录弹窗由 api.ts 的 auth:required 事件驱动）；其余按业务文案 toast */
  const handleActionError = useCallback(
    (err: unknown, pending: PendingAction) => {
      if (err instanceof ApiError && err.code === 401) {
        pendingRef.current = pending
        return
      }
      showToast(err instanceof ApiError ? err.message : '操作失败，请重试')
    },
    [showToast],
  )

  /** 游客点击互动：不发请求，弹本组件登录引导（场景化副文案），登录成功后重放 */
  const askLogin = useCallback((pending: PendingAction) => {
    pendingRef.current = pending
    setLoginSubtitle(pending.kind === 'fav' ? LOGIN_SUB_FAV : LOGIN_SUB_VOTE)
    setLoginOpen(true)
  }, [])

  /** 收藏切换：读 getToken() 而非 render 闭包的 user——登录回放同步执行时闭包 user 仍为 null 会再次拦截 */
  const toggleFavorite = useCallback(async () => {
    if (!getToken()) {
      askLogin({ kind: 'fav' })
      return
    }
    if (favInFlightRef.current) return
    favInFlightRef.current = true
    setBusyFav(true)
    try {
      const result = favorited
        ? await del<FavoriteResult>(`/api/favorites/${data.id}`)
        : await post<FavoriteResult>(`/api/favorites/${data.id}`, {})
      setFavorited(result.favorited)
      setFavCount(result.favCount)
      onFavCount(result.favCount)
    } catch (err) {
      handleActionError(err, { kind: 'fav' })
    } finally {
      favInFlightRef.current = false
      setBusyFav(false)
    }
  }, [favorited, data.id, onFavCount, askLogin, handleActionError])
  replayFavRef.current = () => void toggleFavorite()

  /** 评价提交：upsert（每人每篇一条可改，AC-RULE-15），按响应联动选中态与计数 */
  const submitVote = useCallback(
    async (helpful: 1 | 0, withComment?: string) => {
      if (!getToken()) {
        askLogin({ kind: 'vote', helpful, comment: withComment })
        return
      }
      if (voteInFlightRef.current) return
      voteInFlightRef.current = true
      setBusyVote(true)
      try {
        const result = await post<FeedbackResult>(`/api/feedbacks/${data.id}`, {
          helpful,
          comment: helpful === 0 ? (withComment ?? null) : null,
        })
        setPicked(result.helpful === 0 ? 0 : 1)
        setHelpfulYes(result.helpfulYes)
        setHelpfulNo(result.helpfulNo)
        showToast(TIP_FEEDBACK_OK)
      } catch (err) {
        handleActionError(err, { kind: 'vote', helpful, comment: withComment })
      } finally {
        voteInFlightRef.current = false
        setBusyVote(false)
      }
    },
    [data.id, askLogin, handleActionError, showToast],
  )
  replayVoteRef.current = (helpful, withComment) => void submitVote(helpful, withComment)

  /** 选票：即时高亮不落库（两段式）；游客先走登录引导，登录后自动提交该次评价（AC-EG-07） */
  const onPick = (helpful: 1 | 0) => {
    if (!getToken()) {
      askLogin({ kind: 'vote', helpful })
      return
    }
    if (helpful === 0) focusCommentRef.current = true
    setPicked(helpful)
  }

  /** 提交反馈：未选先提示；留言仅随"没帮助"提交（AC-RULE-20） */
  const onSubmitFeedback = () => {
    if (busyVote) return
    if (picked == null) {
      showToast(TIP_PICK_FIRST)
      return
    }
    const text = picked === 0 ? comment.trim() : undefined
    void submitVote(picked, text || undefined)
  }

  // 登录成功统一消费：本组件弹窗与全局 401 弹窗都广播 auth:login-success → 重放被中断操作（AC-FN-03）
  useEffect(
    () =>
      onLoginSuccess(() => {
        const pending = pendingRef.current
        pendingRef.current = null
        if (!pending) return
        if (pending.kind === 'fav') replayFavRef.current()
        else replayVoteRef.current(pending.helpful ?? 0, pending.comment)
      }),
    [],
  )

  /** 关闭登录弹窗且未登录成功 → 放弃被中断操作（无残留态，交互 1/4 空态） */
  const closeLoginModal = () => {
    setLoginOpen(false)
    pendingRef.current = null
  }

  return (
    <div className="dt-fb-box" data-testid="detail-interaction">
      <div className="dt-fb-q">这篇教程对你有帮助吗？</div>
      <div className="dt-fb-btns">
        <button
          type="button"
          className={`dt-fb${picked === 1 ? ' on-good' : ''}`}
          data-testid="fb-good-btn"
          aria-pressed={picked === 1}
          disabled={busyVote}
          onClick={() => onPick(1)}
        >
          👍 有帮助 {fmtNum(helpfulYes)}
        </button>
        <button
          type="button"
          className={`dt-fb${picked === 0 ? ' on-bad' : ''}`}
          data-testid="fb-bad-btn"
          aria-pressed={picked === 0}
          disabled={busyVote}
          onClick={() => onPick(0)}
        >
          👎 没帮助 {fmtNum(helpfulNo)}
        </button>
      </div>

      {/* 留言框：仅"没帮助"选中展开（切回有帮助收起），选填 ≤200 字仅进后台（UI-IXD-08 / AC-RULE-20） */}
      {picked === 0 && (
        <div className="dt-fb-msgwrap" data-testid="fb-comment-wrap">
          <input
            ref={commentRef}
            className="dt-fb-msg"
            type="text"
            maxLength={COMMENT_MAX}
            value={comment}
            data-testid="fb-comment-input"
            placeholder="告诉我们哪里没帮助（选填，≤200 字，仅平台可见，如：截图是旧版界面，按步骤找不到按钮）"
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="dt-fb-cnt">
            <span data-testid="fb-comment-count">{comment.length}</span>/{COMMENT_MAX}
          </div>
        </div>
      )}

      <div className="dt-fb-sub">
        <button
          type="button"
          className="btn btn-p"
          data-testid="fb-submit-btn"
          disabled={busyVote}
          onClick={onSubmitFeedback}
        >
          提交反馈
        </button>
        <span className="dt-fb-note">留言仅平台运营可见，不会公开展示</span>
      </div>

      <div className="dt-acts">
        <button
          type="button"
          className="btn btn-o"
          data-testid="share-btn"
          onClick={() => setShareOpen(true)}
        >
          🔗 分享
        </button>
        <button
          type="button"
          className={`btn ${favorited ? 'btn-p' : 'btn-g'}`}
          data-testid="fav-btn"
          aria-pressed={favorited}
          disabled={busyFav}
          onClick={() => void toggleFavorite()}
        >
          {favorited ? `★ 已收藏（${fmtNum(favCount)}）` : `☆ 收藏（${fmtNum(favCount)}）`}
        </button>
        <Link className="btn btn-g" to="/list" data-testid="back-list-btn">
          返回列表
        </Link>
      </div>

      <ShareModal open={shareOpen} tutorialId={data.id} onClose={() => setShareOpen(false)} />
      <RoleLoginModal
        open={loginOpen}
        subtitle={loginSubtitle}
        onClose={closeLoginModal}
        onLoginSuccess={emitLoginSuccess}
      />
      {toast && (
        <div className="dt-toast" data-testid="detail-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
