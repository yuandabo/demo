// pages/search/index.js
import { request } from '../../request/index.js'
import regeneratorRuntime from '../../lib/runtime/runtime'
Page({
  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    inpValue: '',
  },
  async getSearchList(query) {
    const result = await request({
      url: 'goods/qsearch',
      data: { query }
    })
    this.setData({
      list: result.data.message,
    })
  },

  handleInput(e){
    console.log(e)
    const { value } = e.detail
    this.getSearchList(value)
  }
})