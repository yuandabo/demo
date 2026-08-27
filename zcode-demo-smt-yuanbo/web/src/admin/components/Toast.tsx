import { useCallback, useRef, useState } from 'react'

/** admin 端轻量 toast（行内操作/弹窗确认反馈，替代 alert）：ok 深色 / error 红 */
export type ToastType = 'ok' | 'error'

export interface ToastItem {
  id: number
  text: string
  type: ToastType
}

const TOAST_TTL_MS = 2600

/** push 追加一条并 2.6s 自动消失（FE-03 起后台各页可复用） */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const push = useCallback((text: string, type: ToastType = 'ok') => {
    const id = (seq.current += 1)
    setToasts((cur) => [...cur, { id, text, type }])
    window.setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), TOAST_TTL_MS)
  }, [])

  return { toasts, push }
}

/** 顶部居中悬浮宿主：pointer-events:none 保证不遮挡页面交互 */
export function ToastHost({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="toast-host" data-testid="toast-host">
      {toasts.map((t) => (
        <div className={`toast${t.type === 'error' ? ' error' : ''}`} key={t.id} data-testid="toast-item">
          {t.text}
        </div>
      ))}
    </div>
  )
}
