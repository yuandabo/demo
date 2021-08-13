// index.js
// 获取应用实例
import { request } from '../../request/index.js'
import regeneratorRuntime from '../../lib/runtime/runtime'
const app = getApp()

Page({
  data: {
    swiperList: [],
    cartList: [],
    floorList: [],
  },
  onReady() {
    this.getSwiperList()
    this.getCartList()
    this.getFloorList()
  },
  async getSwiperList() {
    const result = await request({
      url: 'home/swiperdata',
    })
    const { data } = result
    this.setData({
      swiperList: data.message,
    })
  },
  async getCartList() {
    const result = await request({
      url: 'home/catitems',
    })
    const { data } = result
    this.setData({
      cartList: data.message,
    })
  },
  async getFloorList() {
    const { data } = await request({ url: 'home/floordata' })
    this.setData({
      floorList: data.message
    })
  },
})
