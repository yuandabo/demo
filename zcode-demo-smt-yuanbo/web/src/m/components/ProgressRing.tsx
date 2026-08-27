interface ProgressRingProps {
  /** 阅读进度百分比 0-100（AC-RULE-11 跨端单值覆盖，取最新） */
  progress: number
  /** 定位用（历史卡片按 tutorialId 区分），纯展示组件无交互 */
  testId?: string
}

/**
 * 阅读进度环形徽章（ui_m_favorite.html .ring，AC-FN-23）：
 * conic-gradient 蓝色进度弧 + 中心白圆「N%」；100% 绿色 #16a34a 全环 +「✓」（完成口径）。
 * 弧度按 progress 动态计算（N×3.6°），不依赖设计稿 p30/p60 离散档位。
 */
export default function ProgressRing({ progress, testId }: ProgressRingProps) {
  // 防御性钳位：后端契约 0-100 整数，脏数据（null/NaN/越界）兜底 0 不白屏
  const raw = typeof progress === 'number' && Number.isFinite(progress) ? progress : 0
  const pct = Math.min(100, Math.max(0, Math.round(raw)))
  const done = pct >= 100
  const deg = Math.round(pct * 3.6)
  const gradient = done
    ? 'conic-gradient(#16a34a 0 360deg)'
    : `conic-gradient(#0066ff 0 ${deg}deg, #e2e8f0 ${deg}deg 360deg)`
  return (
    <span
      className={done ? 'ring done' : 'ring'}
      style={{ background: gradient }}
      data-testid={testId}
      role="img"
      aria-label={`阅读进度 ${pct}%`}
    >
      <i>{done ? '✓' : `${pct}%`}</i>
    </span>
  )
}
