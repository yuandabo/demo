import axios from 'axios'

axios.defaults.headers.post['Content-Type'] = 'application/json'

// 创建一个 axios 实例
const service = axios.create({
  timeout: 30000
})

// 请求拦截器
service.interceptors.request.use(
  async config => {
      config.data = config.data || {}
      config.baseURL = process.env.VUE_APP_baseURL
      console.log(config.baseURL)
      return config
    },
    error => {
      // 发送失败
      // console.log(error)
      Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const data = response.data
    return data
  },
  error => {
    if (error && error.response) {
      switch (error.response.status) {
        case 400:
          error.message = '请求错误';
          break
        case 401:
          error.message = '未登录';
          break
        case 403:
          error.message = '拒绝访问';
          break
        case 404:
          error.message = `请求地址出错: ${error.response.config.url}`;
          break
        case 408:
          error.message = '请求超时';
          break
        case 500:
          error.message = '服务器内部错误';
          break
        case 501:
          error.message = '服务未实现';
          break
        case 502:
          error.message = '网关错误';
          break
        case 503:
          error.message = '服务不可用';
          break
        case 504:
          error.message = '网关超时';
          break
        case 505:
          error.message = 'HTTP版本不受支持';
          break
        default:
          break
      }
    }
    // log.error(error)
    return Promise.reject(error)
  }
)

export default service