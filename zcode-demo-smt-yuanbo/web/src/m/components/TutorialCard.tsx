import { Link } from 'react-router-dom'
import type { Tutorial } from '../../shared/types'

/** 关键词命中片段（hit 段渲染为 em 高亮，ui_m_list.html .t-title em 口径） */
interface TextPart {
  text: string
  hit: boolean
}

/**
 * 按关键词切分文本为命中/未命中片段（大小写不敏感，中文按整词命中）。
 * 命中范围=标题/摘要/标签三字段（AC-FN-02 同源），与后端 LIKE 命中规则对齐。
 */
export function splitByKeyword(text: string, keyword: string): TextPart[] {
  const kw = keyword.trim()
  if (!kw || !text) return [{ text, hit: false }]
  const lowerText = text.toLowerCase()
  const lowerKw = kw.toLowerCase()
  const parts: TextPart[] = []
  let cursor = 0
  let idx = lowerText.indexOf(lowerKw, cursor)
  while (idx !== -1) {
    if (idx > cursor) parts.push({ text: text.slice(cursor, idx), hit: false })
    parts.push({ text: text.slice(idx, idx + kw.length), hit: true })
    cursor = idx + kw.length
    idx = lowerText.indexOf(lowerKw, cursor)
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false })
  return parts
}

/** 命中词高亮行：hit 段包 <em>（#0066ff），纯展示无交互不加 testid */
function Highlight({ text, keyword }: { text: string; keyword: string }) {
  return (
    <>
      {splitByKeyword(text, keyword).map((part, i) =>
        part.hit ? <em key={i}>{part.text}</em> : <span key={i}>{part.text}</span>,
      )}
    </>
  )
}

interface TutorialCardProps {
  tutorial: Tutorial
  /** 当前搜索关键词（空串不高亮） */
  keyword: string
}

/**
 * m 端教程卡片（ui_m_list.html .tcard）：标题（命中词 em 高亮 + 置顶角标 AC-RULE-17）
 * + 摘要两行截断 + 标签（命中高亮）+ 分类徽标 + 浏览/收藏 meta；点击进 #/detail/:id。
 */
export default function TutorialCard({ tutorial, keyword }: TutorialCardProps) {
  return (
    <Link
      className="tcard"
      to={`/detail/${tutorial.id}`}
      data-testid={`tutorial-card-${tutorial.id}`}
    >
      <div className="t-title">
        {tutorial.isTop === 1 && <span className="t-top">置顶</span>}
        <Highlight text={tutorial.title} keyword={keyword} />
      </div>
      <div className="t-sum">
        <Highlight text={tutorial.summary} keyword={keyword} />
      </div>
      {tutorial.tags.length > 0 && (
        <div className="t-tags">
          {tutorial.tags.map((tag) => (
            <span className="ttag" key={tag}>
              <Highlight text={tag} keyword={keyword} />
            </span>
          ))}
        </div>
      )}
      <div className="t-foot">
        <span className="t-cat">{tutorial.categoryName}</span>
        <span className="t-meta">
          👁 {tutorial.viewCount.toLocaleString()} · ⭐ {tutorial.favCount.toLocaleString()}
        </span>
      </div>
    </Link>
  )
}
