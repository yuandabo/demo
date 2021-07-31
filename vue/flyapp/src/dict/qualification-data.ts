// 资质数据的存在的模块id 映射表
export type MODULEINFOTYPE = {
  [key:string]: string
}
export const MODULEINFO = ():MODULEINFOTYPE => (
  {
    'APP_PERSONAL:qualificationFlightExperience': 'FlightExperience',
    'APP_PERSONAL:radarMapOfFourDimensions': 'FourDimension',
    statisticsOfQAREvents: 'FourDimension'
  }
)

export const RADARORTABLE = ():MODULEINFOTYPE => (
  {
    'APP_PERSONAL:radarMapOfFourDimensions': 'FourDimensionRadar',
    statisticsOfQAREvents: 'FourDimensionTable'
  }
)
