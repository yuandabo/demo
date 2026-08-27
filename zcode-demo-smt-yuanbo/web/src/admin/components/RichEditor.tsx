import { useEffect, useRef } from 'react'

/**
 * contenteditable 富文本编辑器（tech-design §7：document.execCommand 工具条——
 * 加粗 / H2 步骤标题 / 无序·有序列表 / 插入图片 URL / 插入视频外链 / 预览切换）。
 * 非受控：innerHtml 仅在挂载时按 initialHtml 初始化一次，页面以 key 重挂载换内容；
 * 编辑经 onInput 上抛 html 字符串。步骤标题序号由 CSS counter 自动编号（admin.css .editor h2）。
 */

/** prompt 输入拼进 insertHTML 前转义（URL 进属性与文本节点，防注入） */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface RichEditorProps {
  /** 初始 HTML（页面取数 / 恢复本地快照后以 key 重挂载传入，运行期不随 prop 刷新） */
  initialHtml: string
  onChange: (html: string) => void
  /** 预览态：工具条禁用 + 编辑区只读浅黄底（设计稿 togglePreview） */
  preview: boolean
  onTogglePreview: () => void
  /** 提审缺失"正文"高亮（AC-EG-01） */
  invalid?: boolean
}

/** 工具条直连 execCommand 的四键（image/video 走 insertHTML 分支，不在此表） */
type ToolKey = 'bold' | 'h2' | 'ul' | 'ol'

/** 工具条命令表（execCommand 直用） */
const TOOL_CMDS: Record<ToolKey, { cmd: string; val?: string }> = {
  bold: { cmd: 'bold' },
  h2: { cmd: 'formatBlock', val: 'h2' },
  ul: { cmd: 'insertUnorderedList' },
  ol: { cmd: 'insertOrderedList' },
}

export default function RichEditor({ initialHtml, onChange, preview, onTogglePreview, invalid }: RichEditorProps) {
  const areaRef = useRef<HTMLDivElement>(null)

  // 仅挂载时初始化一次：后续内容由浏览器 contenteditable 自管，React 不回写
  //（依赖空数组——父组件换内容时以 key 重挂载，避免每次 onInput 后重写 innerHTML 导致光标跳回行首）
  useEffect(() => {
    if (areaRef.current) areaRef.current.innerHTML = initialHtml
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * 工具条 mousedown 统一阻止默认行为：否则点击按钮会把焦点/选区移出编辑区，
   * Chrome 折叠 selection 后 execCommand 作用于空选区（经典富文本工具条坑，
   * 预览切换按钮无需编辑区选区，一并处理无副作用）。
   */
  function keepSelection(e: React.MouseEvent): void {
    if ((e.target as HTMLElement).closest('button')) e.preventDefault()
  }

  function exec(cmd: string, val?: string): void {
    const el = areaRef.current
    if (!el || preview) return
    el.focus()
    document.execCommand(cmd, false, val)
    // execCommand 不保证触发 oninput（浏览器差异），命令后手动同步
    onChange(el.innerHTML)
  }

  function runTool(key: ToolKey): void {
    if (preview) return
    const { cmd, val } = TOOL_CMDS[key]
    exec(cmd, val)
  }

  function insertImage(): void {
    const url = window.prompt('请输入图片 URL：', 'https://cdn.jlc-erp-demo.com/img/step.png')
    if (!url) return
    const safe = escapeHtml(url.trim())
    exec('insertHTML', `<div class="img-ph">🖼 图片：${safe}</div><p><br></p>`)
  }

  function insertVideo(): void {
    const url = window.prompt('请输入视频外链（mp4 直链）：', 'https://cdn.jlc-erp-demo.com/videos/demo.mp4')
    if (!url) return
    const safe = escapeHtml(url.trim())
    exec('insertHTML', `<p>▶ 视频外链：<a href="${safe}">${safe}</a></p>`)
  }

  return (
    <div className="rich-editor">
      <div className="toolbar" data-testid="editor-toolbar" onMouseDown={keepSelection}>
        <button
          type="button"
          className="tb-btn bold"
          title="加粗"
          disabled={preview}
          onClick={() => runTool('bold')}
          data-testid="editor-bold-btn"
        >
          <b>B</b>
        </button>
        <span className="tb-sep" />
        <button
          type="button"
          className="tb-btn heading"
          title="步骤标题（H2）"
          disabled={preview}
          onClick={() => runTool('h2')}
          data-testid="editor-h2-btn"
        >
          H 步骤标题
        </button>
        <button
          type="button"
          className="tb-btn"
          title="无序列表"
          disabled={preview}
          onClick={() => runTool('ul')}
          data-testid="editor-ul-btn"
        >
          • 列表
        </button>
        <button
          type="button"
          className="tb-btn"
          title="有序列表"
          disabled={preview}
          onClick={() => runTool('ol')}
          data-testid="editor-ol-btn"
        >
          1. 列表
        </button>
        <span className="tb-sep" />
        <button
          type="button"
          className="tb-btn"
          title="插入图片 URL"
          disabled={preview}
          onClick={insertImage}
          data-testid="editor-image-btn"
        >
          🖼 图片
        </button>
        <button
          type="button"
          className="tb-btn"
          title="插入视频外链"
          disabled={preview}
          onClick={insertVideo}
          data-testid="editor-video-btn"
        >
          ▶ 视频
        </button>
        <span className="tb-sep" />
        <button
          type="button"
          className={`tb-btn${preview ? ' preview-on' : ''}`}
          title="预览前台渲染效果"
          onClick={onTogglePreview}
          data-testid="editor-preview-btn"
        >
          👁 预览
        </button>
      </div>
      <div
        ref={areaRef}
        className={`editor${invalid ? ' field-error' : ''}${preview ? ' previewing' : ''}`}
        contentEditable={!preview}
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        data-testid="rich-editor-area"
      />
    </div>
  )
}
