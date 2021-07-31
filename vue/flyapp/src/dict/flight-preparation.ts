// QAR超限事件的存在的模块id 映射表
export type MODULEINFOTYPE = {
  [key:string]: string
}
export const MODULEINFO = ():MODULEINFOTYPE => (
  {
    top5Events: '',
    chainComparisonRoseTop5Event: '',
    yearOnYearIncrease: '',
    'APP_PERSONAL:typicalAirportOverrunEvents': ''
  }
)
export const TOPIC_MODULELIST = (): string[] => ['top5Events', 'chainComparisonRoseTop5Event', 'yearOnYearIncrease']
