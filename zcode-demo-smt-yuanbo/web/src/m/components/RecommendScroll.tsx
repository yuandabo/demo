import { Link } from 'react-router-dom'
import type { RecommendTutorial } from '../../shared/types'

/** 加载期骨架卡数量：固定 3 张灰底占位，视觉稳定不随数据量变化 */
const SKELETON_COUNT = 3

interface RecommendScrollProps {
  list: RecommendTutorial[]
  loading: boolean
}

/**
 * 角色推荐横滑卡（ui_m_home.html 推荐区，AC-RULE-16）：
 * 加载骨架屏 → 卡片 ≤6 条（不足显示实际数量）→ 0 条空态文案；点击进 #/detail/:id。
 */
export default function RecommendScroll({ list, loading }: RecommendScrollProps) {
  if (loading) {
    return (
      <div className="hscroll" data-testid="recommend-skeleton">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div className="sk-card" key={i} />
        ))}
      </div>
    )
  }
  if (list.length === 0) {
    return (
      <div className="rc-empty" data-testid="recommend-empty">
        暂无推荐，去分类浏览
      </div>
    )
  }
  return (
    <div className="hscroll">
      {list.map((item) => (
        <Link
          className="rc-card"
          key={item.id}
          to={`/detail/${item.id}`}
          data-testid={`recommend-card-${item.id}`}
        >
          <span className="rc-tag">{item.categoryName}</span>
          <span className="rc-title">{item.title}</span>
          <span className="rc-meta">
            👁 {item.viewCount.toLocaleString()} · ⭐ {item.favCount.toLocaleString()}
          </span>
        </Link>
      ))}
    </div>
  )
}
