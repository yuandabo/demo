import { request } from '../../request/index.js'
import regeneratorRuntime from '../../lib/runtime/runtime'
Page({
  goods_id: '',
  data: {
    swiperList: [],
    goodsInfo: {},
    isCollect: false
  },
  onShow() {},
  onLoad(options) {
    const { goods_id } = options
    this.goods_id = goods_id
  },
  onReady() {
    this.getSwiperList()
  },
  async getSwiperList() {
    const result = await request({
      url: 'goods/detail',
      data: {
        goods_id: this.goods_id,
      },
    })
    const { message } = result.data
    // 1 获取缓存中的商品收藏的数组
    const collect = wx.getStorageSync('collect') || []
    // 2 判断当前商品是否被收藏
    const isCollect = collect.some((v) => v.goods_id == message.goods_id)
    console.log(isCollect)
    this.setData({
      swiperList: message.pics,
      goodsInfo: message,
      isCollect
    })
  },
  handlePrevewImage(e) {
    const { dataset } = e.currentTarget
    const current = dataset.pics_mid
    const urls = this.data.swiperList.map((v) => v.pics_mid)
    wx.previewImage({
      current,
      urls,
    })
  },
  handleCollect(){
    let isCollect = false
    // 1 获取缓存中的商品收藏的数组
    let collect = wx.getStorageSync('collect') || []
    // 2 判断当前商品是否被收藏
    const index = collect.findIndex((v) => v.goods_id == this.goods_id)
    if(index !== -1){
      collect.splice(index, 1)
      isCollect = false
      wx.showToast({
        title: '取消成功',
        icon: 'success',
        mask: true,
      })
    } else {
      isCollect = true
      collect.push(this.data.goodsInfo)
      wx.showToast({
        title: '收藏成功',
        icon: 'success',
        mask: true,
      })
    }
    wx.setStorageSync('collect', collect)
    this.setData({
      isCollect
    })
  }
})
