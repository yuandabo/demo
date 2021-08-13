// pages/collect/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabsList: [
      {
        title: '商品收藏',
        id: 1,
      },
      {
        title: '品牌收藏',
        id: 2,
      },
      {
        title: '店铺收藏',
        id: 3,
      },
      {
        title: '浏览器足迹',
        id: 4,
      },
    ],
    collect: [],
  },

  onShow() {
    const collect = wx.getStorageSync('collect') || []
    this.setData({
      collect
    })
  },

  handleTabchange(e) {
    console.log(e)
  },
})