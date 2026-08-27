import { Link } from 'react-router-dom'
import type { Tutorial } from '../../shared/types'

/** grid 变体 meta 左侧图标：浏览量 / 热门浏览量 / 更新时间（首页三区块口径） */
export type GridMeta = 'view' | 'hot' | 'date'

/**
 * 卡片渲染所需字段子集：Tutorial 全量与 GET /api/recommend 的 list 项
 * （无 isTop/updatedAt 等列）均满足，推荐位/列表位/首页区块共用本卡。
 */
export type TutorialCardData = Pick<
  Tutorial,
  'id' | 'title' | 'summary' | 'tags' | 'categoryName' | 'viewCount' | 'favCount'
> &
  Partial<Pick<Tutorial, 'isTop' | 'updatedAt'>>

const META_ICONS: Record<GridMeta, string> = { view: '👁', hot: '🔥', date: '🕒' }

interface TutorialCardProps {
  tutorial: TutorialCardData
  /** 卡片变体：grid=首页三区块网格卡；row=列表页横行卡（默认 grid） */
  variant?: 'grid' | 'row'
  /** grid 变体 meta 左侧内容（row 变体固定 👁/★/🕒 三列，无需指定） */
  meta?: GridMeta
}

/** 浏览量千分位（设计稿 2,341 口径）；空值兜底 0 */
function formatCount(value: number): string {
  return (value ?? 0).toLocaleString('en-US')
}

/** "2026-08-15 10:20:00" → "2026-08-15"（卡片日期展示口径）；推荐位无该列兜底空串 */
function formatDate(value: string | undefined): string {
  return (value ?? '').slice(0, 10)
}

function TagPills({ tags }: { tags: string[] }) {
  if (!tags?.length) return null
  return (
    <>
      {tags.map((tag) => (
        <span className="tag" key={tag}>
          #{tag}
        </span>
      ))}
    </>
  )
}

/**
 * 教程卡片两变体（UI 设计稿 .tcard / .row-card）：整卡点击进详情 #/detail/:id；
 * row 变体 isTop=1 显示橙色「置顶」角标（UI-ELEM-01）。
 */
export default function TutorialCard({ tutorial, variant = 'grid', meta = 'view' }: TutorialCardProps) {
  const to = `/detail/${tutorial.id}`
  const testid = `tutorial-card-${tutorial.id}`

  if (variant === 'row') {
    return (
      <Link className="row-card card" to={to} data-testid={testid}>
        <div className="rc-l">
          <div className="crumb">
            教程中心 / {tutorial.categoryName}
          </div>
          <h3>
            {tutorial.title}
            {tutorial.isTop === 1 && <span className="pin">置顶</span>}
          </h3>
          <p>{tutorial.summary}</p>
          <div className="rc-tags">
            <TagPills tags={tutorial.tags} />
          </div>
        </div>
        <div className="rc-r">
          <span className="n">
            👁 <b>{formatCount(tutorial.viewCount)}</b>
          </span>
          <span className="n">
            ★ <b>{formatCount(tutorial.favCount)}</b>
          </span>
          <span className="n">🕒 {formatDate(tutorial.updatedAt)}</span>
          {/* 设计稿为按钮样式文案；整卡同目标跳转，用 span 避免交互元素嵌套 */}
          <span className="btn btn-g go">进入详情 →</span>
        </div>
      </Link>
    )
  }

  return (
    <Link className="tcard card" to={to} data-testid={testid}>
      <div>
        <TagPills tags={tutorial.tags} />
      </div>
      <h3>{tutorial.title}</h3>
      <p>{tutorial.summary}</p>
      <div className="tc-meta">
        <span className="v">
          {META_ICONS[meta]}{' '}
          {meta === 'date' ? formatDate(tutorial.updatedAt) : formatCount(tutorial.viewCount)}
        </span>
        <span className="cat">{tutorial.categoryName}</span>
      </div>
    </Link>
  )
}
