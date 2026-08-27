interface BadgeCardProps {
  icon: string
  name: string
  /** 达标条件行（如「需连续打卡 7 天 · 当前连续 2 天」） */
  desc: string
  /** 进度行补充说明（如「中断后从第 1 天重新累计」） */
  note: string
  /** 已解锁（badges 数组判定；中断不回收，AC-RULE-12 兜底） */
  unlocked: boolean
  /** 当前进度值（streak / completedTutorials） */
  current: number
  /** 达标阈值（7 天 / 20 篇） */
  target: number
  /** 进度单位（天 / 篇） */
  unit: string
  testid: string
}

/** 徽章卡（ui_m_checkin.html 徽章墙）：锁定灰 / 解锁彩 + 进度条；解锁后进度仍按当前值渲染（中断重计不回收） */
export default function BadgeCard({
  icon,
  name,
  desc,
  note,
  unlocked,
  current,
  target,
  unit,
  testid,
}: BadgeCardProps) {
  const value = current ?? 0
  const percent = Math.min(100, Math.round((value / target) * 1000) / 10)
  return (
    <div className={`badge-card${unlocked ? ' got' : ''}`} data-testid={testid}>
      <span className="b-ico">{icon}</span>
      <span className="b-body">
        <span className="b-name">
          {name}
          <span className={`b-lock${unlocked ? ' got' : ''}`}>{unlocked ? '✓ 已解锁' : '🔒 未解锁'}</span>
        </span>
        <span className="b-desc">{desc}</span>
        <span className="b-bar">
          <i style={{ width: `${percent}%` }} />
        </span>
        <span className="b-prog">
          进度 {value} / {target} {unit} · {note}
        </span>
      </span>
      <span className="b-state">{unlocked ? '✓' : '🔒'}</span>
    </div>
  )
}
