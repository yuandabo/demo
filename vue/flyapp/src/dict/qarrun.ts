// QAR超限事件的存在的模块id 映射表
export type MODULEINFOTYPE = {
  [key:string]: string
}
export const MODULEINFO = ():MODULEINFOTYPE => (
  {
    frequencyAndRateOfEventsInRecent13months: 'Bar',
    summaryOfOverrunEventsInRecent13Months: 'TotalTable'
  }
)
