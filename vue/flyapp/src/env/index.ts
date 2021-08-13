import { requestToken, requestUserType, transferOC, registerCallback, JsTranferIOS, requestBaseUrl, showTabBar } from './js-tansfer-ios'
import { aesDecrypt } from '@/utils/aes'
import { appPost } from '@/request/index'

/** 存储的token */
let token = ''
let userType = ''
let baseUrl = ''
// const mockToken = 'aLa5WwDPzwH/HsOb9KPD0EOXT1sx7IL1BvZ1a3WyWDPXnBQXAVvgRpr1VHk2Ya4T'
const mockUserType = 'app_personal'
const userTypeList:{[k: string]: string} = { 0: 'app_personal', 1: 'app_manage' }

/**
 * 初始化
 * @returns Promise
 */
const init = function () :Promise<unknown> {
  // console.log('sys init', '1')
  // reqToken(false)
  // reqUserType()
  if (process.env.NODE_ENV === 'development' && !JsTranferIOS.isIPad()) {
    return appPost('/services/login', {
      data: {
        name: 'A123',
        password: 'PRduRAX925eKXJV3Ik5XCw==',
        systemCode: 'auth',
        imageId: '',
        imagePinCode: '',
        mobilephoneVerificationCodeToken: '',
        mobilephoneVerificationCode: ''
      }
    }).then(res => {
      // console.log('env', res)
      const { data } = res
      token = data.data.xtoken
      userType = data.data.bizType
      // console.log(token, userType)
      // return res
    })
  }
  return Promise.all([reqToken(false), reqUserType(), reqBaseUrl()])
}

/** 获取userType */
const getUserType = function (): string {
  if (!JsTranferIOS.isIPad()) {
    return mockUserType
  }
  return userType
}

/** 获取网络请求地址 */
const getBaseUrl = function (): string {
  return baseUrl
}

/** 获取token */
const getToken = function (): string {
  // if (!JsTranferIOS.isIPad()) {
  //   return mockToken
  // }
  return token
}

/** 获取showManage */
const showManage = function (): boolean {
  return getUserType() === userTypeList['1' as keyof typeof userTypeList]
}

/** 获取用户类型代码 */
const getUserTypeCode = function (): string {
  return getUserType() === userTypeList['1' as keyof typeof userTypeList] ? 'MANAGE' : 'PERSONAL'
}

/**
 * 请求token
 * @param isOverdue 是否token已过期
 * @returns Promise
 */
const reqToken = function (isOverdue = true): Promise<string> {
  // console.log('reqToken', '2')
  return new Promise((resolve, reject) => {
    requestToken((data: string) => {
      const _token = aesDecrypt(data)
      token = _token
      // if (!token) reject('reject:no token')
      resolve(data)
    }, { isOverdue: isOverdue ? '1' : '0' })
  })
}

/**
 * @description: 请求用户类型
 * @param {*}
 * @return {*}
 */
const reqUserType = function ():Promise<string> {
  // console.log('reqUserType', '2')
  return new Promise((resolve, reject) => {
    requestUserType((data: string) => {
      userType = userTypeList[data as keyof typeof userTypeList] || ''
      // if (!userType) reject()
      resolve(data)
    })
  })
}

/**
 * @description: 请求网络请求地址（API）
 * @param {*}
 * @return {*}
 */
const reqBaseUrl = function ():Promise<string> {
  // console.log('reqUserType', '2')
  // Message(`reqBaseUrl`)
  return new Promise((resolve, reject) => {
    requestBaseUrl((data: string) => {
      baseUrl = data
      // if (!data) reject()
      resolve(data)
    })
  })
}

/** 页码改变上报 */
const pageChange = function (title: string, canBack: '0' | '1'): void {
  transferOC('pageChange', {
    title,
    canBack
  })
}

/** 注册页码改变回调 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registerBackCallback = function (callback: (data?: any) => void): void {
  registerCallback('backClickCallback', callback)
}

/* 修改用户类型 -- 开发模式才用 */
const _changeUserType = function () : void{
  userType = userType === userTypeList[0] ? userTypeList[1] : userTypeList[0]
}
export {
  init,
  getToken,
  reqToken,
  reqUserType,
  getUserType,
  pageChange,
  registerBackCallback,
  showManage,
  JsTranferIOS,
  getUserTypeCode,
  getBaseUrl,
  _changeUserType,
  showTabBar
}
