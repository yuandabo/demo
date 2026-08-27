import { Fragment } from 'react'
import type { Category } from '../../shared/types'

/** 分类下拉：两级树平铺（子分类缩进），value=categoryId（服务端命中该分类及子分类）；TutorialList / Review 筛选共用 */
export default function CategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: number | ''
  onChange: (v: number | '') => void
}) {
  return (
    <select
      className="select"
      value={value}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      data-testid="filter-category-select"
    >
      <option value="">全部分类</option>
      {categories.map((c) => (
        <Fragment key={c.id}>
          <option value={c.id}>{c.name}</option>
          {c.children.map((ch) => (
            <option key={ch.id} value={ch.id}>
              　└ {ch.name}
            </option>
          ))}
        </Fragment>
      ))}
    </select>
  )
}
