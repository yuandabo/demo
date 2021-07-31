/* eslint-disable */
/************ 本项目中本SDK接口仅供env/index.ts调用，项目中使用请 *****************/
/* 注意事项：数据为空时应该传 null 防止原生端报错 */
/**
 * h5调用iPad APP接口SDK
 */
// console.log(navigator.userAgent)
export interface JsTranferIOSType {
  /** 是否是iPad APP环境 */
  isIPad: () => boolean
  /** 原生返回token的回调 */
  getTokenCallback: null | ((data: any) => void)
  /** 原生点击返回按钮回调 */
  backClickCallback: null | ((data: any) => void)
  h5GetUserTypeCallback: null | ((data: any) => void)
  h5GetRequsetBaseUrlCallback: null | ((data: any) => void)
}
const JsTranferIOS: JsTranferIOSType = {
  /**
   * 判断是否是iPad设备
   */
  isIPad: function () {
    // return navigator.userAgent.toLowerCase().indexOf('ipad') > -1 && window.webkit
    return window.webkit
  },
  getTokenCallback: null,
  backClickCallback: null,
  h5GetUserTypeCallback: null,
  h5GetRequsetBaseUrlCallback: null
}
window.JsTranferIOS = JsTranferIOS

/**
 * 打开 | 关闭 IOS 底部导航栏
 * des: 首页打开。其他均不显示
 * params: '0' 不显示， '1' 显示
*/
export const showTabBar = function (mode: string = '0') :void {
  console.log('showTabBar', mode)
  const params = {
    showTabBar: mode
  }
  if (!JsTranferIOS.isIPad()) {
    return
  }
  window.webkit.messageHandlers.showTabBar.postMessage(params)
}

/**
 * 跳转航班报告页面
 */
export const pageToNativeFlightReport = ( params = null ) => {
  if (!JsTranferIOS.isIPad()) {
    return
  }
  window.webkit.messageHandlers.h5PageToFlightReport.postMessage(params)
}


/**
 * 获取原生用户类型
 */
 const requestUserType = function (callback: any) {
  if (!JsTranferIOS.isIPad()) {
    console.info('当前非iPad环境，返回空userType')
    return (typeof callback === 'function') ? callback('') : ''
  }
  JsTranferIOS.h5GetUserTypeCallback = (data) => {
    if (typeof callback === 'function') {
      callback(data)
      JsTranferIOS.h5GetUserTypeCallback = null
    }
  }
  window.webkit.messageHandlers.h5GetUserType.postMessage(null)
}

/**
 * 获取原生请求API
 */
 const requestBaseUrl = function (callback: any) {
  if (!JsTranferIOS.isIPad()) {
    return (typeof callback === 'function') ? callback('') : ''
  }
  JsTranferIOS.h5GetRequsetBaseUrlCallback = (data) => {
    if (typeof callback === 'function') {
      callback(data)
      JsTranferIOS.h5GetRequsetBaseUrlCallback = null
    }
  }
  window.webkit.messageHandlers.h5GetRequsetBaseUrl.postMessage(null)
}



/**
 * 获取原生token
 */
const requestToken = function (callback: any, params: { isOverdue: '0' | '1' }) {
  if (!JsTranferIOS.isIPad()) {
    console.info('当前非iPad环境，返回空token')
    const nullStr = ''
    return (typeof callback === 'function') ? callback(nullStr) : nullStr
  }
  JsTranferIOS.getTokenCallback = (data) => {
    // Message('getTokenCallback')
    // console.log('getTokenCallback', data)
    if (typeof callback === 'function') {
      callback(data)
      JsTranferIOS.getTokenCallback = null
    }
  }
  window.webkit.messageHandlers.getToken.postMessage(params || null)
}

/**
 * 通用调用原生方法
 */
const transferOC = function (functionName: string, param: any) {
  if (!JsTranferIOS.isIPad()) {
    console.info('当前非iPad环境')
    return
  }
  window.webkit.messageHandlers[functionName].postMessage(param || null)
}

/**
 * TODO: 注册回调
 */
const registerCallback = function(callbackName: keyof JsTranferIOSType, callback: (data?: any) => void) {
  if (callbackName && typeof callback === 'function') {
    JsTranferIOS.backClickCallback = callback
  }
}

export {
  requestToken,
  transferOC,
  registerCallback,
  requestUserType,
  requestBaseUrl,
  JsTranferIOS
}
