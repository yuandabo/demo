let ajaxNums = 0
const defaultConfigure = {
  header: {
    'content-type': 'application/json'
  },
  method: 'GET',
  dataType: 'json',
  responseType: 'text',
}
const baseUrl = 'https://api-hmugo-web.itheima.net/api/public/v1/'
export const request = (params) => {
  const isTokenInterface = params.url.includes('my')
  if(isTokenInterface) {
    defaultConfigure.header.Authorization = wx.getStorageSync('token') || ''
  }
  ajaxNums++
  wx.showLoading({
    title: '加载中',
    mask: true
  })
  return new Promise((resolve, reject) => {
    wx.request({
      ...Object.assign(defaultConfigure, params),
      url: baseUrl + params.url,
      success: (result) => {
        resolve(result)
      },
      fail: (err) => {
        reject(err)
      },
      complete: () => {
        ajaxNums--
        if(ajaxNums === 0) {
          wx.hideLoading()
        }
      },
    })
  })
}
