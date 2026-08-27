/** 字号三档（AC-RULE-21：标准/大/特大；仅正文区域生效） */
export const FONT_SIZE_OPTIONS = [
  { px: 15, tag: 'A', label: '标准' },
  { px: 17, tag: 'A⁺', label: '大' },
  { px: 19, tag: 'A⁺⁺', label: '特大' },
] as const

export const FONT_SIZE_DEFAULT = 17

/** 档位 localStorage 记忆（再次进入保持所选档位，UI-IXD-04） */
const FONT_SIZE_KEY = 'm-font-size'

/** 读档位：脏值（非三档之一）回退默认 17px */
export function readFontSize(): number {
  const raw = Number(localStorage.getItem(FONT_SIZE_KEY))
  return FONT_SIZE_OPTIONS.some((o) => o.px === raw) ? raw : FONT_SIZE_DEFAULT
}

export function saveFontSize(px: number): void {
  localStorage.setItem(FONT_SIZE_KEY, String(px))
}

/**
 * 字号三档浮层（ui_m_detail.html .fs-panel，AC-RULE-21 / UI-IXD-04）：
 * 父级把选中档位写到正文容器（.article CSS 变量），仅正文区域字号变化。
 */
export default function FontSizePanel({
  value,
  onChange,
}: {
  value: number
  onChange: (px: number) => void
}) {
  return (
    <div className="fs-panel" data-testid="fs-panel">
      <div className="fs-title">字号调节</div>
      {FONT_SIZE_OPTIONS.map((opt) => (
        <button
          key={opt.px}
          type="button"
          className={`fs-opt${value === opt.px ? ' on' : ''}`}
          data-testid={`fs-opt-${opt.px}`}
          onClick={() => {
            saveFontSize(opt.px)
            onChange(opt.px)
          }}
        >
          <span>{opt.tag}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
