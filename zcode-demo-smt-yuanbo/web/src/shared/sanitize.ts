import DOMPurify from 'dompurify'

/**
 * 富文本白名单渲染（AC-NF-04：渲染前脚本剥离防注入）：
 * 存储原文，portal/m 详情页渲染前统一过本函数（tech-design §6）。
 * 白名单口径与 admin RichEditor 产出对齐：标题/段落/列表/加粗斜体/链接/图片/表格。
 */
const ALLOWED_TAGS = [
  'h2',
  'h3',
  'h4',
  'h5',
  'p',
  'br',
  'hr',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'sub',
  'sup',
  'blockquote',
  'pre',
  'code',
  'ol',
  'ul',
  'li',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'div',
  'span',
  'figure',
  'figcaption',
]

/** 允许属性白名单：script/iframe/style 标签与 on* 事件属性均不在集内，天然剥离；
 * class 保留——admin RichEditor 的图片占位（img-ph）等展示类标记需在编辑器回读时存活（无脚本执行面） */
const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'class']

/** 图片懒加载 + 外链新开：净化后属性补齐（弱网可用性 tech-design §8） */
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node instanceof HTMLImageElement) {
    node.setAttribute('loading', 'lazy')
    node.setAttribute('decoding', 'async')
  }
  if (node instanceof HTMLAnchorElement && node.getAttribute('href')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

/** 富文本净化：白名单外的标签/属性/事件全剥离；空输入返回空串 */
export function sanitizeRichText(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}
