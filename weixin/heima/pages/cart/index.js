// pages/cart/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    cart: {},
    addressInfo: {},
    totalPrice: 0,
    totalNum: 0,
    allChecked: false,
  },

  onShow() {
    const cart = wx.getStorageSync('cart') || []
    this.setData({
      cart
    })
    this.setCart(cart)
  },

  handleGetAdrress() {
    wx.chooseAddress({
      success: (result) => {
        const { provinceName, cityName, countyName, detailInfo } = result
        result.all = provinceName + cityName + countyName + detailInfo
        this.setData({
          addressInfo: result,
        })
        wx.setStorageSync('address', result)
      },
      fail: () => {},
      complete: () => {},
    })
  },
  // 全选
  handleItemAllCheck() {
    const { cart } = this.data
    cart.forEach((v) => {
      v.checked = true
    })
    this.setCart(cart)
  },
  handeItemChange(e) {
    console.log(e)
    const id = e.currentTarget.dataset.id
    const { cart } = this.data
    const index = cart.findIndex((v) => v.goods_id === id)
    cart[index].checked = !cart[index].checked
    this.setCart(cart)
  },
  // 设置购物车状态同时 重新计算 底部工具栏的数据 全选 总价格 购买的数量
  setCart(cart) {
    let allChecked = true
    // 1 总价格 总数量
    let totalPrice = 0
    let totalNum = 0
    cart.forEach((v) => {
      if (v.checked) {
        totalPrice += v.num * v.goods_price
        totalNum += v.num
      } else {
        allChecked = false
      }
    })
    // 判断数组是否为空
    allChecked = cart.length != 0 ? allChecked : false
    this.setData({
      cart,
      totalPrice,
      totalNum,
      allChecked,
    })
    wx.setStorageSync('cart', cart)
  },
  hanleDec(e) {
    const { id } = e.currentTarget.dataset
    const { cart } = this.data
    const index = cart.findIndex((v) => v.goods_id === id)
    cart[index].num--
    this.setCart(cart)
  },
  hanleAdd(e) {
    const { id } = e.currentTarget.dataset
    const { cart } = this.data
    const index = cart.findIndex((v) => v.goods_id === id)
    cart[index].num++
    this.setCart(cart)
  }
})