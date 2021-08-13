/**
 * 此处为统一请求出入口，请勿在此处写业务逻辑
 * 新的业务逻辑在src/request/index中新建
 * 错误处理只做返回（不在此处作错误弹窗）
 */
import axios from 'axios'
const service = axios.create({
  // withCredentials: true,
  timeout: 15000
})
service.interceptors.request.use(
  config => config,
  error => {
    console.error(error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => response,
  error => {
    console.error(error)
    return Promise.reject(error)
  }
)

export default service
