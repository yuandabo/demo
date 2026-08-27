import { Link } from 'react-router-dom'
import type { Category, ErpModule } from '../../shared/types'

/** 8 大模块宫格图标（ui_m_home.html 宫格区口径，按 erpModule 映射） */
const MODULE_ICONS: Record<ErpModule, string> = {
  sales: '📈',
  project: '📁',
  file: '🗂️',
  produce: '🏭',
  purchase: '🛒',
  inventory: '📦',
  hrFinance: '💰',
  system: '⚙️',
}

/** 4 个通用分类（无 erpModule 映射）按名称配图标 */
const GENERIC_CATEGORY_ICONS: Record<string, string> = {
  新手入门: '🚀',
  最佳实践: '🏆',
  常见问题: '❓',
  开放平台: '🔌',
}

/** 兜底图标：管理员新增的未映射分类不出现空图标 */
const FALLBACK_ICON = '📚'

function iconOf(category: Category): string {
  return (
    (category.erpModule && MODULE_ICONS[category.erpModule]) ||
    GENERIC_CATEGORY_ICONS[category.name] ||
    FALLBACK_ICON
  )
}

/** 加载期骨架格数量：与 12 格 3 列宫格等高（4 行） */
const SKELETON_COUNT = 12

interface CategoryGridProps {
  list: Category[]
  loading: boolean
}

/**
 * 3 列分类宫格（ui_m_home.html 宫格区，AC-FN-24）：
 * 角标=该分类前台可见教程数，0 篇显示「待补充」；点击进 #/list?categoryId={id}&name={名}。
 */
export default function CategoryGrid({ list, loading }: CategoryGridProps) {
  if (loading) {
    return (
      <div className="grid" data-testid="category-skeleton">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div className="sk-cell" key={i} />
        ))}
      </div>
    )
  }
  if (list.length === 0) return null
  return (
    <div className="grid">
      {list.map((cell) => {
        const count = cell.tutorialCount ?? 0
        return (
          <Link
            className="cell"
            key={cell.id}
            to={`/list?categoryId=${cell.id}&name=${encodeURIComponent(cell.name)}`}
            data-testid={`category-cell-${cell.id}`}
          >
            <span className="ci">{iconOf(cell)}</span>
            <span className="cn">{cell.name}</span>
            <span className={`cc${count === 0 ? ' empty' : ''}`}>
              {count === 0 ? '待补充' : `${count} 篇`}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
