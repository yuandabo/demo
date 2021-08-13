/** 公共接口 */
export const COMMON = {
  /** 图片上传 */
  // 由组件控制上传，不经过axios，手动添加/services
  UPLOAD_IMAGE: '/file/uploadImage',
  // 由组件加载，不经过axios，手动添加/services
  DOWNLOAD_IMAGE: '/file/image'
}

export const HOME = {
  MODULE_INFO: '/module/info',
  FLIGHTEXPERIENCE: '/flightExperience',
  TYPICALOVRRUNEVENTS: '/typicalOverrunEvents',
  SEVERITYEVENTDETAIL: '/severityEventDetail',
  MEASUREMENTPARAMETERS: '/manage/measurementParameters',
  MANAGEKEYFLIGHTS: '/manage/keyFlights',
  INIT: '/screening/init',
  FLIGHTLIST: '/flightList',
  OVERRUNEVENTSUMMARY: '/overrunEventSummary',
  BASICSINIT: '/basicsInit'
}

export const FLIGHTPREPARATION = {
  TOPEVENT: '/preFlightPreparation'
}

export const QAR = {
  BARDATA: '/eventNumRate'
}

// 周期汇总
export const SUMMARY = {
  RADAR_AND_SCATTER: '/keyIndexOfLandingControl'
}

export const FRI = {
  LINE_DATA: '/manage/friTrend'
}

export const PARAMS = {
  BAR_AND_BoxPlot_DATA: '/manage/parameterDistribution'
}

// 资质数据
export const QUALI_DATA = {
  LEVEL: '/qualificationLevel',
  RADAR: '/fourDimensionsMap'
}
