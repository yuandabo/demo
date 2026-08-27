import type { CheckinStatus } from '../../shared/types'

/** 周表头（后端 weekCalendar 恒为周一→周日 7 项，get-api-checkins 契约） */
const DOW_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const

interface WeekCalendarProps {
  weekCalendar: CheckinStatus['weekCalendar']
  /** 今日 yyyy-MM-dd（浏览器本地口径，仅用于格子三态判定） */
  today: string
  todayChecked: boolean
}

/** 日历格四态：done ✓ 绿 / miss ✕ 灰 / today「今」橙 / future 未来置灰（无 ✕） */
type DayState = 'done' | 'miss' | 'today' | 'future'

const DAY_TEXT: Record<DayState, { glyph: string; label: string }> = {
  done: { glyph: '✓', label: '已打' },
  miss: { glyph: '✕', label: '中断' },
  today: { glyph: '今', label: '待打' },
  future: { glyph: '', label: '' },
}

function dayState(date: string, isChecked: boolean, today: string, todayChecked: boolean): DayState {
  if (date === today) return todayChecked ? 'done' : 'today'
  // 日期串 yyyy-MM-dd 同格式字典序比较即时间先后，无需转 Date
  if (date > today) return 'future'
  return isChecked ? 'done' : 'miss'
}

export interface WeekSummary {
  /** 本周已打天数（含今日已打；后端未来日期恒 false，直接计 isChecked 即准确） */
  doneCount: number
  /** 本周中断天数（过去未打，不含今日与未来） */
  missCount: number
  /** 本月累计已打天数（工程兜底：API 未提供全月口径，以周历内本月已打天数近似） */
  monthCount: number
}

/** 周历统计：头部统计行与图例共用一份口径，避免两处各算漂移 */
export function summarizeWeek(week: CheckinStatus['weekCalendar'], today: string): WeekSummary {
  const month = today.slice(0, 7)
  let doneCount = 0
  let missCount = 0
  let monthCount = 0
  for (const { date, isChecked } of week) {
    if (isChecked) {
      doneCount++
      if (date.slice(0, 7) === month) monthCount++
    } else if (date < today) {
      missCount++
    }
  }
  return { doneCount, missCount, monthCount }
}

/** 本周打卡日历（ui_m_checkin.html 日历卡 grid + 图例）：7 格三态 + 已打/中断计数 */
export default function WeekCalendar({ weekCalendar, today, todayChecked }: WeekCalendarProps) {
  const summary = summarizeWeek(weekCalendar, today)
  return (
    <>
      <div className="cal-grid" data-testid="week-calendar">
        {DOW_LABELS.map((label) => (
          <span className="dow" key={label}>
            {label}
          </span>
        ))}
        {weekCalendar.map((day, index) => {
          const state = dayState(day.date, day.isChecked, today, todayChecked)
          return (
            <span className={`day ${state}`} data-testid={`week-day-${index}`} key={day.date}>
              <span className="g">
                {state === 'future' ? String(Number(day.date.slice(8))) : DAY_TEXT[state].glyph}
              </span>
              {DAY_TEXT[state].label && <span className="lbl">{DAY_TEXT[state].label}</span>}
            </span>
          )
        })}
      </div>
      <div className="legend" data-testid="cal-legend">
        <span className="lg">
          <i className="lg-done" />
          已打卡 {summary.doneCount} 天
        </span>
        <span className="lg">
          <i className="lg-today" />
          今天待打卡
        </span>
        <span className="lg">
          <i className="lg-miss" />
          中断 {summary.missCount} 天
        </span>
      </div>
    </>
  )
}
