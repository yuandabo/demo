// components/tabs/tabs.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    tabsList: {
      type: Array,
      value: [],
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    active: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    tabhandleTap(e) {
      const { index } = e.currentTarget.dataset
      this.setData({
        active: index
      })
      this.triggerEvent('tabchange', index)
    }
  },
})
