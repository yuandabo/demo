// QAR超限事件的存在的模块id 映射表
export type MODULEINFOTYPE = {
  [key: string]: string
}
export const MODULEINFO = (): MODULEINFOTYPE => ({
  flightExperience: 'FlightExperience',
  'APP_PERSONAL:typicalTransfiniteEvents': 'TypicalOverrunEvent',
  keyIndexOfLandingControl: 'LandKeyQuota',
  'APP_PERSONAL:totalOfOverrunEvents': 'TotalTable'
})

export const RADAR_LABEL = (): MODULEINFOTYPE => ({
  personal: '个人',
  withTheModel: '机队同机型'
})
