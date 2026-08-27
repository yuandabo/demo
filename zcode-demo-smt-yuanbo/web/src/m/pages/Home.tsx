import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../shared/api'
import { useAuth } from '../../shared/AuthContext'
import { ERP_ROLE_LABELS } from '../../shared/constants'
import type {
  Category,
  CheckinStatus,
  MessageItem,
  RecommendResult,
  RecommendTutorial,
} from '../../shared/types'
import CategoryGrid from '../components/CategoryGrid'
import PhoneShell from '../components/PhoneShell'
import RecommendScroll from '../components/RecommendScroll'
import { useRoleSheet } from '../components/RoleSheet'
import TabBar from '../components/TabBar'

/**
 * m 首页 #/（ui_m_home.html，AC-FN-24 / AC-RULE-16）：
 * 深色头部（logo + 角色徽章 + 搜索入口）+ 角色推荐横滑 + 分类宫格
 * + 消息入口预留卡（v1.1 迭代池）+ 打卡横幅，套 PhoneShell/TabBar（首页 active）。
 */
export default function Home() {
  const { user } = useAuth()
  const { openRoleSheet } = useRoleSheet()
  // null=加载中（骨架屏 / 卡片隐藏），[]=已加载空态——两类状态分开呈现
  const [recommend, setRecommend] = useState<RecommendTutorial[] | null>(null)
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [message, setMessage] = useState<MessageItem | null>(null)
  const [checkin, setCheckin] = useState<CheckinStatus | null>(null)

  // 宫格：与登录态无关，进页取一次（前台口径仅启用分类，防御性再过滤一级）
  useEffect(() => {
    get<{ list: Category[] }>('/api/categories?withCount=1')
      .then((data) =>
        setCategories(data.list.filter((c) => c.status === 'enabled' && c.parentId === null)),
      )
      .catch(() => setCategories([]))
  }, [])

  // 推荐位：游客全站 Top6；登录按角色命中集 Top6（AC-RULE-16）。
  // 后端 recommend 仅消费 erpRole 查询参数（不解析 token），故登录角色用户显式传参（契约可选参数）
  useEffect(() => {
    setRecommend(null)
    const erpRole = user?.erpRole
    get<RecommendResult>(erpRole ? `/api/recommend?erpRole=${erpRole}` : '/api/recommend')
      .then((data) => setRecommend(data.list))
      .catch(() => setRecommend([]))
  }, [user?.erpRole])

  // 消息（token 隐式按角色过滤）+ 打卡（强制鉴权）：仅登录态请求；登出/切角色即重取刷新
  useEffect(() => {
    setMessage(null)
    setCheckin(null)
    if (!user) return
    get<{ list: MessageItem[] }>('/api/messages')
      .then((data) => setMessage(data.list[0] ?? null))
      .catch(() => setMessage(null))
    get<CheckinStatus>('/api/checkins')
      .then((data) => setCheckin(data))
      .catch(() => setCheckin(null))
  }, [user?.id, user?.erpRole])

  const roleLabel = user?.erpRole ? ERP_ROLE_LABELS[user.erpRole] : null

  return (
    <PhoneShell
      statusbarTheme="dark"
      tabBar={<TabBar />}
      header={
        <header className="hd">
          <div className="hd-row">
            <div className="logo">
              <div className="logo-mark">📚</div>
              <div>
                <div className="logo-name">云ERP教程中心</div>
                <div className="logo-sub">让每个岗位 3 分钟上手云ERP</div>
              </div>
            </div>
            <button
              type="button"
              className="role-pill"
              data-testid="role-pill"
              onClick={() => openRoleSheet()}
            >
              {roleLabel ? (
                <>
                  当前角色：<b>{roleLabel}</b> ▾
                </>
              ) : (
                <>未登录 ▾</>
              )}
            </button>
          </div>
          <Link className="searchbox" to="/list" data-testid="search-entry">
            🔍 <span className="kw">搜索教程：试试「<em>算料</em>」</span>
          </Link>
        </header>
      }
    >
      <div className="body">
        <div className="sec-hd">
          <span className="sec-title">
            {roleLabel ? `为你推荐 · ${roleLabel}` : '全站热门'}
            {roleLabel && <em>按角色匹配</em>}
          </span>
          <Link className="sec-more" to="/list" data-testid="recommend-more">
            全部 ›
          </Link>
        </div>
        <RecommendScroll loading={recommend === null} list={recommend ?? []} />

        <div className="sec-hd sec-hd-gap">
          <span className="sec-title">
            全部分类
            {categories && <em>{categories.length} 个</em>}
          </span>
          <Link className="sec-more" to="/list" data-testid="category-more">
            分类浏览 ›
          </Link>
        </div>
        <CategoryGrid loading={categories === null} list={categories ?? []} />

        {message && (
          <>
            <Link className="msg-card" to="/list" data-testid="message-card">
              <span className="msg-ico">📢</span>
              <span className="msg-body">
                <span className="msg-title">
                  有一条审批待办关联教程
                  <span className="tag-reserve">预留</span>
                </span>
                <span className="msg-sub">{message.title}</span>
              </span>
              <span className="chev">›</span>
            </Link>
            <div className="msg-note">消息推送能力属迭代池功能，当前为预留入口，仅作展示</div>
          </>
        )}

        <Link className="ck-banner" to="/checkin" data-testid="checkin-banner">
          <span>
            <span className="ck-t">
              {checkin ? (checkin.todayChecked ? '📅 今日已打卡' : '📅 今日未打卡') : '📅 打卡赢积分'}
            </span>
            <span className="ck-s">
              {checkin
                ? `已连 ${checkin.streak} 天 · 打卡 +10 积分，赢「坚持者」徽章`
                : '每日打卡 +10 积分，连续 7 天赢「坚持者」徽章'}
            </span>
          </span>
          <span className="ck-btn">去打卡</span>
        </Link>
      </div>
    </PhoneShell>
  )
}
