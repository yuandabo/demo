import { request } from '../../request/index.js'
import regeneratorRuntime from '../../lib/runtime/runtime'
import { login } from '../../utils/wxsync'
Page({
  /**
   * 页面的初始数据
   */
  data: {},

  async handleGetuserinfo(e) {
    try {
      const { encryptedData, rawData, iv, signature } = e.detail
      const { code } = await login()
      const result = await request({
        url: 'users/wxlogin',
        method: 'POST',
        data: {
          encryptedData,
          rawData,
          iv,
          signature,
          code,
        },
      })
      wx.setStorageSync(
        'token',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjIzLCJpYXQiOjE1NjQ3MzAwNzksImV4cCI6MTAwMTU2NDczMDA3OH0.YPt-XeLnjV-_1ITaXGY2FhxmCe4NvXuRnRB8OMCfnPo'
      )
      wx.navigateBack({
        delta: 1,
      })
    } catch (error) {
      console.log(error)
    }
  },
})
