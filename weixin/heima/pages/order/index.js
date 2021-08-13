import { request } from '../../request/index.js'
import regeneratorRuntime from '../../lib/runtime/runtime'
Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabsList: [
      {
        title: '全部',
        id: 1,
      },
      {
        title: '待付款',
        id: 2,
      },
      {
        title: '代发货',
        id: 3,
      },
      {
        title: '退款/退货',
        id: 4,
      },
    ],
    orderList: [],
  },
  queryParams: {
    type: 1
  },
  onLoad: function (options) {
    this.getOrderList()
  },
  async getOrderList() {
    const result = await request({
      url: 'my/orders/all',
      data: this.queryParams,
    })
    const { orders } = result.data.message
    this.setData({
      orderList: orders.map((v) => ({
        ...v,
        create_time_cn: new Date(v.create_time * 1000).toLocaleString()
      })),
    })
  },
  handleTabchange(e) {
    console.log(e)
    const { detail } = e 
    this.queryParams.type = detail + 1
    this.getOrderList()
  },
})
