/** 展示层格式化工具（Dashboard / TutorialList 共用，自各自页面抽提去重） */

/** 千分位（4,823）；null/undefined 不进此函数，调用方先判空 */
export function fmtNum(n: number): string {
  return n.toLocaleString('en-US')
}

/** "2026-08-20 15:20:00" → "2026-08-20 15:20"（契约时间格式固定 yyyy-MM-dd HH:mm:ss） */
export function fmtTime(s: string): string {
  return s.slice(0, 16)
}
