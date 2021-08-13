import { request } from '../../request/index.js'
import regeneratorRuntime from '../../lib/runtime/runtime'
Page({
  data: {
    tabsList: [
      {
        title: '综合',
        id: '0',
      },
      {
        title: '销量',
        id: '1',
      },
      {
        title: '价格',
        id: '2',
      },
    ],
    goodsList: [],
  },
  finish: false,
  queryParams: {
    pagenum: 1,
    pagesize: 20,
    cid: '',
    query: '',
    total: 0,
  },
  onLoad: function (options) {
    this.queryParams.cid = options.cid
    this.getGoodList()
  },
  handleTabchange(e) {
    console.log(e)
    const { detail } = e
  },
  async getGoodList() {
    const result = await request({
      url: 'goods/search',
      data: this.queryParams,
    })
    console.log(result)
    const { total, goods } = result.data.message
    this.queryParams.total = total
    this.setData({
      goodsList: this.data.goodsList.concat(goods),
    })
    if (this.queryParams.pagenum * this.queryParams.pagesize > total)
      this.finish = true
  },
  onReachBottom() {
    console.log('onReachBottom')
    if (this.finish) return
    this.queryParams.pagenum++
    this.getGoodList()
  },
  onPullDownRefresh(){
    console.log('onPullDownRefresh')
    this.queryParams.pagenum = 1
    this.finish = false
    this.setData({
      goodsList: []
    })
    this.getGoodList()
  }
})
