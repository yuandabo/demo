import { request } from '../../request/index.js'
import regeneratorRuntime from '../../lib/runtime/runtime'
import { requestPayment, showToast } from '../../utils/wxsync.js'
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
    const address = wx.getStorageSync('address') || {}
    this.setData({
      cart,
      addressInfo: address,
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
  async handleCompute() {
    try {
      const { cart,totalPrice, totalNum,addressInfo } =this.data
      const token = wx.getStorageSync('token') || ''
      if (!token) {
        wx.navigateTo({
          url: '/pages/auth/index',
        })
        return
      }
      const result = await request({
        url: 'my/orders/create',
        method: 'POST',
        data: {
          order_price: totalPrice,
          consignee_addr: addressInfo.all,
          goods: cart.map(v=> ({
            goods_id: v.goods_id,
            goods_number: v.num,
            goods_price: v.goods_price
          }))
        },
      })
      const { pay } = await request({
        url: 'my/orders/req_unifiedorder',
        method: 'POST',
        data: {
          order_number: result.data.message.order_number,
        },
      })
      requestPayment(pay) 

      const result2 = await request({
        url: 'my/orders/chkOrder',
        method: 'POST',
        data: {
          order_number: result.data.message.order_number,
        }
      })
      console.log(result2)
      await showToast({ title: '支付成功' })

      let newCart = wx.getStorageSync('cart')
      newCart = newCart.filter((v) => !v.checked)
      wx.setStorageSync('cart', newCart)

      // 8 支付成功了 跳转到订单页面
      wx.navigateTo({
        url: '/pages/order/index',
      })
    } catch (error) {
      console.log(error)
      await showToast({ title: '支付失败' })
    }
  },
})
