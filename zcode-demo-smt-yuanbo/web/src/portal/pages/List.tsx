import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { get } from '../../shared/api'
import type { Category, Page, Tutorial } from '../../shared/types'
import TutorialCard from '../components/TutorialCard'
import './List.css'

/** 每页条数（任务交互口径固定 10） */
const PAGE_SIZE = 10
/** 搜索 1s 超时兜底：仅关键词搜索请求参与竞速，分类/标签/翻页浏览请求不受污染（AC-EG-11、tech-design §8） */
const SEARCH_TIMEOUT_MS = 1000
/** 热门搜索词：种子高频标签硬编码（任务前置确认项） */
const HOT_WORDS = ['算料', 'BOM', '报工', '对账', '扫码']
/** 标签筛选胶囊清单：设计稿 #tagBox 六枚（无独立标签聚合接口，硬编码） */
const FILTER_TAGS = ['算料', 'BOM', '扫码', '报工', '审批', '对账']
/** 空关键词提示文案（AC-FN-02 交互前置条件，不发请求） */
const EMPTY_KEYWORD_HINT = '请输入关键词，例如：算料'
/** 列表/树骨架占位数 */
const ROW_SKELETON_COUNT = 4
const TREE_SKELETON_COUNT = 7

/** 列表筛选状态（URL query 为唯一数据源，双向同步） */
interface ListFilters {
  categoryId: number | null
  keyword: string
  tags: string[]
  page: number
}

/** query 正整数解析：非法/缺省回退 null（page 由调用方兜底 1） */
function parsePositiveInt(raw: string | null): number | null {
  if (!raw) return null
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 ? value : null
}

/** URL query → 筛选状态（带参进入/刷新保持的回填口径） */
function parseFilters(params: URLSearchParams): ListFilters {
  return {
    categoryId: parsePositiveInt(params.get('categoryId')),
    keyword: (params.get('keyword') ?? '').trim(),
    tags: (params.get('tag') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== ''),
    page: parsePositiveInt(params.get('page')) ?? 1,
  }
}

/** 筛选状态 → URL query：空值参数剔除（"全部教程"清 categoryId、第 1 页省 page） */
function filtersToParams(filters: ListFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.categoryId != null) params.set('categoryId', String(filters.categoryId))
  if (filters.keyword) params.set('keyword', filters.keyword)
  if (filters.tags.length) params.set('tag', filters.tags.join(','))
  if (filters.page > 1) params.set('page', String(filters.page))
  return params
}

/** 列表请求参数（与 get-api-tutorials.md 契约对齐：tag 逗号多值交集、pageSize=10） */
function buildTutorialsQuery(filters: ListFilters): string {
  const params = filtersToParams(filters)
  params.set('page', String(filters.page))
  params.set('pageSize', String(PAGE_SIZE))
  return params.toString()
}

/** 分页条目：首尾恒显 + 当前页 ±1 窗口，间隔插省略号（设计稿「1 … n」口径） */
function pageItems(current: number, totalPages: number): Array<number | 'dots'> {
  const wanted = new Set([1, totalPages, current - 1, current, current + 1])
  const sorted = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const items: Array<number | 'dots'> = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push('dots')
    items.push(p)
  })
  return items
}

interface ListState {
  loading: boolean
  data: Page<Tutorial> | null
  error: boolean
}

/** 分类树（两级 + 计数 + 二级展开；选中态由 filters.categoryId 驱动） */
function CategoryTree({
  categories,
  totalCount,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
}: {
  categories: Category[] | null
  totalCount: number
  selectedId: number | null
  expandedIds: Set<number>
  onSelect: (id: number | null) => void
  onToggle: (id: number) => void
}) {
  if (!categories) {
    return (
      <div data-testid="tree-skeleton">
        {Array.from({ length: TREE_SKELETON_COUNT }, (_, i) => (
          <div className="sk-tree-line" key={i} />
        ))}
      </div>
    )
  }

  const countOf = (count: number | undefined): { text: string; zero: boolean } => {
    const value = count ?? 0
    return { text: String(value), zero: value === 0 }
  }

  const renderCount = (count: number | undefined) => {
    const { text, zero } = countOf(count)
    return <span className={`cnt-n${zero ? ' zero' : ''}`}>{text}</span>
  }

  return (
    <div className="tree" data-testid="category-tree">
      <button
        type="button"
        className={`tree-row${selectedId == null ? ' on' : ''}`}
        data-testid="tree-node-all"
        onClick={() => onSelect(null)}
      >
        全部教程 {renderCount(totalCount)}
      </button>
      {categories.map((category) => {
        const children = category.children ?? []
        return (
          <Fragment key={category.id}>
            <button
              type="button"
              className={`tree-row${selectedId === category.id ? ' on' : ''}`}
              data-testid={`tree-node-${category.id}`}
              onClick={() => onSelect(category.id)}
            >
              {category.name}
              {children.length > 0 ? (
                <span className="right">
                  <span
                    role="button"
                    aria-label={`展开 ${category.name} 子分类`}
                    tabIndex={0}
                    className={`arrow-box${expandedIds.has(category.id) ? ' open' : ''}`}
                    data-testid={`tree-toggle-${category.id}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(category.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        onToggle(category.id)
                      }
                    }}
                  >
                    <span className="arrow">▶</span>
                  </span>
                  {renderCount(category.tutorialCount)}
                </span>
              ) : (
                renderCount(category.tutorialCount)
              )}
            </button>
            {children.length > 0 && (
              <div className={`child${expandedIds.has(category.id) ? ' show' : ''}`}>
                {children.map((child) => (
                  <button
                    type="button"
                    key={child.id}
                    className={`tree-row${selectedId === child.id ? ' on' : ''}`}
                    data-testid={`tree-node-${child.id}`}
                    onClick={() => onSelect(child.id)}
                  >
                    {child.name} {renderCount(child.tutorialCount)}
                  </button>
                ))}
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

/** 分页器：页码胶囊 + 首尾翻页 + 省略号（当前页蓝底，边界禁用） */
function Pager({
  page,
  totalPages,
  onGo,
}: {
  page: number
  totalPages: number
  onGo: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="pager" data-testid="pager">
      <button
        type="button"
        className="pg"
        data-testid="page-prev"
        disabled={page <= 1}
        onClick={() => onGo(page - 1)}
      >
        « 上一页
      </button>
      {pageItems(page, totalPages).map((item, i) =>
        item === 'dots' ? (
          <span className="dots" key={`dots-${i}`}>
            …
          </span>
        ) : (
          <button
            type="button"
            key={item}
            className={`pg${item === page ? ' on' : ''}`}
            data-testid={`page-num-${item}`}
            onClick={() => onGo(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="pg"
        data-testid="page-next"
        disabled={page >= totalPages}
        onClick={() => onGo(page + 1)}
      >
        下一页 »
      </button>
    </div>
  )
}

/**
 * portal 列表页 #/list：分类树/标签多选交集/关键词搜索组合检索 + 置顶角标 + 分页 + 空态。
 * 筛选状态与 URL query 双向同步（宫格 categoryId / 工作台 erpModule / keyword / tag / page 带参进入可刷新保持）。
 * 关键词搜索请求走 AbortController + 1s 超时竞速，超时展示提示条且筛选完整保留（AC-FN-02 / AC-EG-11 / AC-NF-01 / UI-IXD-01/02 / UI-ELEM-01）。
 */
export default function List() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => parseFilters(searchParams), [searchParams])
  const { categoryId, keyword, tags, page } = filters

  // 输入框与 URL keyword 分离：输入态不打请求，回车/点按钮才提交（交互 2）
  const [kwInput, setKwInput] = useState(keyword)
  const [kwHint, setKwHint] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [catError, setCatError] = useState(false)
  const [listState, setListState] = useState<ListState>({ loading: true, data: null, error: false })
  const [timedOut, setTimedOut] = useState(false)
  const [searching, setSearching] = useState(false)

  // 仅关键词搜索请求参与 1s 竞速：提交前置位，fetch effect 消费后复位（浏览请求不置位）
  const raceTimeoutRef = useRef(false)
  // 同参数重复搜索/重试的触发器（URL 不变时也要重发请求）
  const [fetchNonce, setFetchNonce] = useState(0)

  // URL keyword 变化（热门词/清空筛选/带参进入）回填输入框
  useEffect(() => setKwInput(keyword), [keyword])

  // 分类树独立取数：与列表并行，各自 skeleton（交互 1）
  useEffect(() => {
    let alive = true
    get<{ list: Category[] }>('/api/categories?withCount=1')
      .then((data) => {
        if (alive) setCategories(data.list ?? [])
      })
      .catch(() => {
        if (alive) setCatError(true)
      })
    return () => {
      alive = false
    }
  }, [])

  // 工作台 erpModule 带参入口（UI-IXD-14）：归一化为首个映射该模块的一级分类 categoryId，URL 可回填
  const erpModuleParam = searchParams.get('erpModule')
  useEffect(() => {
    if (!erpModuleParam || catError || categoryId != null) return
    const matched = categories?.find((c) => c.erpModule === erpModuleParam)
    if (!matched) return
    setSearchParams(
      filtersToParams({ categoryId: matched.id, keyword, tags, page: 1 }),
      { replace: true },
    )
  }, [erpModuleParam, categories, catError, categoryId, keyword, tags, page, setSearchParams])

  // 选中二级分类时自动展开其父级（宫格/URL 带子分类进入时选中节点可见）
  useEffect(() => {
    if (categoryId == null || !categories) return
    const parent = categories.find((c) => c.children?.some((child) => child.id === categoryId))
    if (parent) setExpandedIds((prev) => new Set(prev).add(parent.id))
  }, [categoryId, categories])

  // 列表取数：URL query 或显式重试触发；搜索请求 1s 超时竞速，超时保留筛选与上次内容
  useEffect(() => {
    let alive = true
    const isSearch = raceTimeoutRef.current
    raceTimeoutRef.current = false

    const controller = new AbortController()
    const timer = isSearch
      ? window.setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
      : undefined

    setListState((prev) => ({ ...prev, loading: true, error: false }))
    setTimedOut(false)
    if (isSearch) setSearching(true)

    get<Page<Tutorial>>(`/api/tutorials?${buildTutorialsQuery(filters)}`, controller.signal)
      .then((data) => {
        if (!alive) return
        setListState({ loading: false, data, error: false })
        setSearching(false)
      })
      .catch(() => {
        if (!alive) return
        setSearching(false)
        if (controller.signal.aborted) {
          // 1s 超时兜底：不发新请求，列表保持上次内容，筛选完整保留（AC-EG-11）
          setTimedOut(true)
          setListState((prev) => ({ ...prev, loading: false }))
          return
        }
        setListState((prev) => ({ ...prev, loading: false, error: true }))
      })

    return () => {
      alive = false
      controller.abort()
      if (timer !== undefined) window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, fetchNonce])

  const applyFilters = (next: ListFilters, replace = false) => {
    setSearchParams(filtersToParams(next), { replace })
  }

  const submitSearch = (rawKeyword: string) => {
    const nextKeyword = rawKeyword.trim()
    if (!nextKeyword) {
      setKwHint(EMPTY_KEYWORD_HINT)
      return
    }
    setKwHint('')
    raceTimeoutRef.current = true
    setFetchNonce((n) => n + 1)
    applyFilters({ categoryId, keyword: nextKeyword, tags, page: 1 })
  }

  const retrySearch = () => {
    raceTimeoutRef.current = true
    setFetchNonce((n) => n + 1)
  }

  const clearFilters = () => {
    setKwHint('')
    applyFilters({ categoryId: null, keyword: '', tags: [], page: 1 })
  }

  const toggleTag = (tag: string) => {
    const nextTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    applyFilters({ categoryId, keyword, tags: nextTags, page: 1 })
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage === page) return
    window.scrollTo({ top: 0 })
    applyFilters({ categoryId, keyword, tags, page: nextPage })
  }

  const totalCount = (categories ?? []).reduce((sum, c) => sum + (c.tutorialCount ?? 0), 0)

  // 选中分类名（含二级）：树未就绪时兜底 id 文本，避免 meta 闪空
  const selectedCategoryName = useMemo(() => {
    if (categoryId == null) return '全部教程'
    for (const category of categories ?? []) {
      if (category.id === categoryId) return category.name
      const child = category.children?.find((c) => c.id === categoryId)
      if (child) return child.name
    }
    return `分类 ${categoryId}`
  }, [categoryId, categories])

  const total = listState.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const showEmpty = !listState.loading && !listState.error && (listState.data?.list.length ?? 0) === 0

  return (
    <>
      <div className="page-h">
        <span className="bar-i" />
        <h1>全部教程</h1>
        <span className="sub">分类 + 标签 + 关键词，1 秒内返回结果</span>
      </div>

      <div className="search-card card">
        <form
          className="search-row"
          onSubmit={(e) => {
            e.preventDefault()
            submitSearch(kwInput)
          }}
        >
          <input
            type="text"
            value={kwInput}
            placeholder="搜索教程标题/摘要/标签"
            data-testid="search-input"
            onChange={(e) => {
              setKwInput(e.target.value)
              if (kwHint) setKwHint('')
            }}
          />
          <button type="submit" className="btn btn-p" data-testid="search-submit-btn" disabled={searching}>
            {searching ? '搜索中…' : '搜 索'}
          </button>
        </form>
        {kwHint && (
          <div className="kw-hint" data-testid="search-empty-hint" role="alert">
            {kwHint}
          </div>
        )}
        <div className="hot-words">
          热门搜索：
          {HOT_WORDS.map((word) => (
            <button type="button" key={word} data-testid={`hot-word-${word}`} onClick={() => submitSearch(word)}>
              {word}
            </button>
          ))}
        </div>
      </div>

      <div className="layout">
        <aside className="side">
          <div className="card">
            <h3>分类目录</h3>
            {catError ? (
              <div className="list-error" data-testid="tree-error">
                分类加载失败，请稍后重试
              </div>
            ) : (
              <CategoryTree
                categories={categories}
                totalCount={totalCount}
                selectedId={categoryId}
                expandedIds={expandedIds}
                onSelect={(id) => applyFilters({ categoryId: id, keyword, tags, page: 1 })}
                onToggle={toggleExpand}
              />
            )}
          </div>
          <div className="card">
            <h3>
              标签筛选 <span className="thint">可多选（交集）</span>
            </h3>
            <div className="tags" data-testid="tags-panel">
              {FILTER_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tg${tags.includes(tag) ? ' sel' : ''}`}
                  data-testid={`tag-option-${tag}`}
                  aria-pressed={tags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="list">
          <div className="list-meta" data-testid="list-meta">
            共 <b data-testid="list-total">{total}</b> 篇已发布教程 · 当前分类：
            <b>{selectedCategoryName}</b> · 标签：<b>{tags.length ? tags.join(' + ') : '未选'}</b>
            <button type="button" className="clr" data-testid="clear-filters-btn" onClick={clearFilters}>
              ✕ 清空筛选
            </button>
          </div>

          {timedOut && (
            <div className="timeout-alert" data-testid="search-timeout-alert" role="alert">
              搜索超时，请重试
              <button type="button" className="retry" data-testid="search-retry-link" onClick={retrySearch}>
                重试
              </button>
            </div>
          )}

          {listState.loading ? (
            <div data-testid="list-skeleton">
              {Array.from({ length: ROW_SKELETON_COUNT }, (_, i) => (
                <div className="sk-row" key={i} />
              ))}
            </div>
          ) : listState.error ? (
            <div className="list-error" data-testid="list-error">
              列表加载失败，请稍后重试
            </div>
          ) : showEmpty ? (
            <div className="empty" data-testid="empty-state">
              <div className="eic">🔍</div>
              <b>未找到相关教程</b>
              试试清空筛选或去分类浏览，也可以换个关键词（支持标题 / 摘要 / 标签模糊命中）
              <div className="ops">
                <button type="button" className="btn btn-p" data-testid="empty-clear-btn" onClick={clearFilters}>
                  清空筛选
                </button>
                <Link className="btn btn-g" to="/" data-testid="empty-go-home">
                  去分类浏览
                </Link>
              </div>
            </div>
          ) : (
            <>
              {listState.data?.list.map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} variant="row" />
              ))}
              <Pager page={page} totalPages={totalPages} onGo={goToPage} />
            </>
          )}
        </section>
      </div>
    </>
  )
}
