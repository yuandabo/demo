import axios from './axios'
import { aesEncrypt, aesDecrypt, jiaRao, jieRao } from '@/utils/aes'
import { getToken, getUserType, reqToken, JsTranferIOS, getBaseUrl } from '@/env'
import { AxiosRequestConfig, Method } from 'axios'
/**
 * 可根据不同业务需求配置不同的请求方法
 * 错误处理只做返回（不在此处作错误弹窗）
 */
/** 使用mock文件的数据 */
// const useMockFile = window.globalConfig?.devMock && (process.env.NODE_ENV === 'development')

/**
 * 获取请求参数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRequestParam ({ url, param }: any): AxiosRequestConfig {
  const token = getToken()
  const userType = getUserType()
  getBaseUrl()
  // 请求体
  const data = {
    appBundleVersion: '5',
    appVersion: '1.0.5',
    deviceId: '82CAE290-B5E3-49C5-B9C3-7CC6FA187E56',
    languageType: 'CN',
    requestContent: jiaRao(aesEncrypt(JSON.stringify(param))),
    userType: userType
  }
  const config = {
    method: 'post' as Method,
    url,
    baseURL: (window.globalConfig.ADMIN_SERVICE as string),
    headers: {
      // 'User-Agent': 'APP',
      // 'Accept-Language': 'zh-Hans-CN;q=1',
      // 'media-type': 'application/x-www-form-urlencoded',
      'content-type': 'application/json;charset=UTF-8',
      xtoken: aesEncrypt(token + ',' + Date.now().toString())
    },
    data
  }
  if (process.env.NODE_ENV === 'development' && !JsTranferIOS.isIPad()) {
    config.headers.xtoken = token
    if (url === '/services/login') {
      config.baseURL = ''
      config.headers = {
        'content-type': 'application/json;charset=UTF-8',
        xtoken: ''
      }
      config.data = param
    } else {
      config.baseURL = (window.globalConfig.ADMIN_HOST as string) + (window.globalConfig.ADMIN_SERVICE as string)
    }
    console.log(url, 'params:', param, config)
  }
  // Message(`${config.baseURL + config.url}`)
  return config
}

/**
 * 重试
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function retry ({ url, param, resolve }: any) {
  console.log('retry')
  i++
  reqToken().then(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appPost(url, param).then((content: any) => {
      resolve(content)
    })
  })
}

let i = 0
/**
 *  APP相关请求
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function appPost (url: string, param: unknown): Promise<any> {
  const config = getRequestParam({ url, param })
  /**
   * 使用MOCK文件数据
   * TODO: mockFile会被打包，暂时必须注释掉
   */
  //  if (process.env.NODE_ENV === 'development') {
  //   // eslint-disable-next-line @typescript-eslint/no-var-requires
  //   const { default: res } = require(`../../mockFile${config.baseURL}${url}`)
  //   // 本地数据有问题不返回，尝试请求接口
  //   if (res.code) {
  //     // console.log('mock info: ' + url, res)
  //     return Promise.resolve(res)
  //   }
  // }
  return new Promise((resolve, reject) => {
    axios(config).then(response => {
      // 鉴权失败
      if (response.headers.exceptioncode === '4') {
        // console.log('request: authentication failed')
        return reject(new Error('authentication failed'))
      }
      const result = response.data
      // 请求成功
      if (result.responseCode === '200') {
        let content = result.resultContent
        if (result.resultContentEncrypted === 'true' && content) {
          content = JSON.parse(aesDecrypt(jieRao(content)))
        }
        if (process.env.NODE_ENV === 'development') console.log('response:', content)
        return resolve(content)
      } else if (result.responseCode === '201') {
        // 重试处理
        // console.log('request: token is overdue, try get token and request again')
        if (i === 0) return retry({ url, param, resolve, reject })
        return reject(result)
      } else {
        // if (process.env.NODE_ENV === 'development') // console.log('err:', response)
        if (response.config.url === '/services/login') {
          resolve(response)
        }
        return reject(result)
      }
    }).catch((error) => {
      console.error(error)
    })
  })
}
