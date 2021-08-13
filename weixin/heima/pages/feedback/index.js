// pages/feedback/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabsList: [
      {
        title: '体验问题',
        id: 1,
      },
      {
        title: '商品、商家投诉',
        id: 2,
      },
    ],
  },

  handleTabchange(e) {
    console.log(e)
  },
  handleSubmit(){
    wx.navigateBack({
      delta: 1
    });
  }
})