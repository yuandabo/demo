/*
 * @Author: your name
 * @Date: 2021-03-05 16:04:35
 * @LastEditTime: 2021-03-05 17:37:47
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo2\vue\eleme\phoneweb\src\store\modules\app\modules\shopcar.js
 */
// 设置文件
export default {
  namespaced: true,
  state: {
    // 存放缓存的路由
    shopCarData: []
  },
  actions: {
  },
  mutations: {
    shopCarDataSet (state, data) {
      console.log('shopCarDataSet')
      state.shopCarData = data
    },
    changeOneData (state, data) {
      const { id, numberSize = 1 } = data
      const goods = JSON.parse(JSON.stringify(state.shopCarData))
      console.log('goods', goods)
      let quantities
      // id
      for (let i = 0, length = goods.length; i < length; i++) {
        const item = goods[i]
        for (let j = 0, length2 = item['foods'].length; j < length2; j++) {
          const foods = item['foods'][j]
          if (foods['id'] === id && foods.hasOwnProperty('count')) {
            const count = foods.count
            // 获取计算值小数点后的位数长度，乘以10的长度次方，解决浮点数运算问题
            // const length = this.getAfterDotNums(count)
            // const POW = Math.pow(10, length)
            // 加法运算
            quantities = count + numberSize
            if (quantities > 9999) {
              this.$toast('数量最为多9999')
            } else if (quantities < 0) {
              this.$toast('数量不能少于0')
            } else {
              // 标记与回显
              foods.count = quantities
              // this.editProduct({ id, quantities })
            }
            break
          }
        }
      }
      state.shopCarData = goods
    }
  }
}
