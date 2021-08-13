// index.js
// 获取应用实例
import { request } from '../../request/index.js'
import regeneratorRuntime from '../../lib/runtime/runtime'
const app = getApp()

Page({
  categoriesList: [],  // 全局变量
  data: {
    leftContainList: [],
    rightContainList: [],
    activeCate: 0,
    scrollTop: 0
  },
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true,
      })
    }
  },
  onReady() {
    const cates = wx.getStorageSync('cates')
    if (!cates) {
      this.getCategoriesList()
    } else {
      if (Date.now() - cates.time > 1000 * 10) {
        this.getCategoriesList()
      } else {
        const message = cates.data
        this.categoriesList = message
        const leftContainList = message.map((v) => v.cat_name)
        this.setData({
          leftContainList,
          rightContainList: message[0].children || []
        })
      }
    }
  },
  async getCategoriesList() {
    const result = await request({
      url: 'categories'
    })
    const { message } = result.data
    wx.setStorageSync('cates', {
      time: Date.now(),
      data: message
    })
    this.categoriesList = message
    const leftContainList = message.map((v) => v.cat_name)
    this.setData({
      leftContainList,
      rightContainList: message[0].children || []
    })
  },
  // 点击事件
  handleCateTap(e) {
    console.log(e)
    const { index } = e.currentTarget.dataset
    this.setData({
      activeCate: index,
      rightContainList: this.categoriesList[index].children || [],
      scrollTop: 0
    })
  },
})
