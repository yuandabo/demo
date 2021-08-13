// components/cart/cart.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    goodsInfo: {
      type: Object,
      value: {},
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    addcartHandle() {
      const { goodsInfo } = this.properties
      const cart = wx.getStorageSync('cart') || []
      const index = cart.findIndex((v) => v.goods_id === goodsInfo.goods_id)
      if (index === -1) {
        goodsInfo.num = 1
        goodsInfo.checked = true
        cart.push(goodsInfo)
      } else {
        cart[index].num++
      }
      wx.setStorageSync('cart', cart)
      wx.showToast({
        title: '加入成功',
        icon: 'success',
        // true 防止用户 手抖 疯狂点击按钮
        mask: true,
      })
    },
  },
})
