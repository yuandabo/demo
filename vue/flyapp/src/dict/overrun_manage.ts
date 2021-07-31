// 超限事件管理版的存在的模块id 映射表
export type MODULEINFOTYPE = {
  [key:string]: string
}
export const MODULEINFO = ():MODULEINFOTYPE => (
  {
    eventsAndRateOfEvents: 'Bar',
    typicalOverrunEventsInRecent13Months: 'TypicalOverrunEvent'
  }
)
