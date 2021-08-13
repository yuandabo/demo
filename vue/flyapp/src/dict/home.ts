// 首页的已经存在的模块id  key: 对应后端给的moduleId value: 对应前端业务代码的routername 等
// 格式：后端moduleId: 前端routerName
export type MODULEINFOTYPE = {
  [key:string]: string
}
export const MODULEINFO = ():MODULEINFOTYPE => (
  {
    'app_personal:commonApplication': 'commonApplication',
    totalFlightExperience: 'totalFlightExperience',
    typicalOverrunEvents: 'typicalOverrunEvents',
    seriousOverrunEventRecord: 'seriousOverrunEventRecord',
    measurementParameters: 'measurementParameters',
    keyFlights: 'keyFlights',
    commonOverrunEvent: 'commonOverrunEvent',
    commonQarEvent: 'commonQarEvent',
    commonQualificationData: 'commonQualificationData',
    commonPreFlightPreparation: 'commonPreFlightPreparation',
    commonCycleSummary: 'commonCycleSummary',
    commonFriTrends: 'FRI',
    commonParameterDistribution: 'commonParameterDistribution'
  }
)
export const HOMENOSORTLIST: string[] = ['seriousOverrunEventRecord', 'app_personal:commonApplication']
