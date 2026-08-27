import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { post } from '../../shared/api'

/** 复制按钮文案三态：默认 / 已复制 / 失败（1.5s 后回默认，UI-IXD-09） */
const COPY_LABELS = { idle: '复制', done: '已复制', failed: '复制失败' } as const
/** 复制反馈复位时长 */
const COPY_RESET_MS = 1500

interface ShareModalProps {
  open: boolean
  tutorialId: number
  onClose: () => void
}

/** PC 端详情 URL（复制目标：打开直达该教程，AC-FN-06） */
function buildPcUrl(tutorialId: number): string {
  return `${window.location.origin}/portal.html#/detail/${tutorialId}`
}

/** 小程序端详情 URL（二维码内容：扫码直达同篇教程续读，AC-FN-06） */
function buildMobileUrl(tutorialId: number): string {
  return `${window.location.origin}/m.html#/detail/${tutorialId}`
}

/**
 * 分享弹窗（FE-01 规格，FE-03 详情页接线）：
 * 打开即静默打点 POST /api/tutorials/:id/share（失败不阻断）；
 * 链接行展示 PC 端 URL 可复制（1.5s "已复制"反馈）；qrcode 包渲染小程序端 URL 二维码。
 */
export default function ShareModal({ open, tutorialId, onClose }: ShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const resetTimerRef = useRef<number | null>(null)
  const [copyState, setCopyState] = useState<keyof typeof COPY_LABELS>('idle')
  const [qrFailed, setQrFailed] = useState(false)

  const pcUrl = buildPcUrl(tutorialId)

  // 打开/换篇：静默打点（按动作计数，重开 +1）+ 重新生成二维码
  useEffect(() => {
    if (!open) return
    post<{ shareCount: number }>(`/api/tutorials/${tutorialId}/share`).catch(() => undefined)
    setCopyState('idle')
    setQrFailed(false)
    const canvas = canvasRef.current
    if (!canvas) {
      setQrFailed(true)
      return
    }
    QRCode.toCanvas(canvas, buildMobileUrl(tutorialId), { width: 150, margin: 1 })
      .then(() => setQrFailed(false))
      .catch(() => setQrFailed(true))
  }, [open, tutorialId])

  // 卸载清复位定时器
  useEffect(
    () => () => {
      if (resetTimerRef.current != null) window.clearTimeout(resetTimerRef.current)
    },
    [],
  )

  /** 复制链接：clipboard API 优先，非安全上下文降级 execCommand；失败短暂提示不弹错误框 */
  async function copyLink() {
    let copied = false
    try {
      await navigator.clipboard.writeText(pcUrl)
      copied = true
    } catch {
      const input = linkInputRef.current
      if (input) {
        input.select()
        copied = document.execCommand('copy')
      }
    }
    setCopyState(copied ? 'done' : 'failed')
    if (resetTimerRef.current != null) window.clearTimeout(resetTimerRef.current)
    resetTimerRef.current = window.setTimeout(() => setCopyState('idle'), COPY_RESET_MS)
  }

  if (!open) return null

  return (
    <div
      className="sm-mask"
      data-testid="share-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sm-dlg">
        <button
          type="button"
          className="sm-close"
          data-testid="share-close-btn"
          aria-label="关闭分享弹窗"
          onClick={onClose}
        >
          ✕
        </button>
        <h3>🔗 分享教程</h3>
        <div className="sm-lbl">教程链接（PC 端）</div>
        <div className="sm-link-row">
          <input
            ref={linkInputRef}
            readOnly
            value={pcUrl}
            data-testid="share-link-input"
            onClick={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            className="btn btn-p"
            data-testid="share-copy-btn"
            onClick={() => void copyLink()}
          >
            {COPY_LABELS[copyState]}
          </button>
        </div>
        <div className="sm-lbl center">手机扫码在小程序打开本教程</div>
        <div className="sm-qr-box">
          {qrFailed ? (
            <div className="sm-qr-fallback" data-testid="share-qr-fallback">
              二维码生成失败，请复制链接
            </div>
          ) : (
            <canvas ref={canvasRef} width={150} height={150} data-testid="share-qr-canvas" />
          )}
        </div>
        <div className="sm-qr-cap">二维码内容 = 本篇教程小程序端 URL · 扫码直达续读</div>
      </div>
    </div>
  )
}
