// pages/user/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    collectNums: 0
  },
  onShow() {
    const userInfo = wx.getStorageSync('userinfo') || {}
    const collect = wx.getStorageSync('collect') || []
    this.setData({
      userInfo,
      collectNums: collect.length
    })
  },
})