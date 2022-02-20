import { defineStore } from 'pinia';
import axios from 'axios'
export const useStore = defineStore('main', {
  // other options...
  state: () => {
    return {
      shopCarData: [],
      seller: [],
      ratings: [],
    }
  },
  getters: {
    // getMyName: function
    selectfoodsGetter: (state) => {
      const foods = []
      if (state.shopCarData.length === 0) return []
      state.shopCarData.forEach((good) => {
        good.foods.forEach((food) => {
          if (food.count) {
            foods.push(food)
          }
        })
      })
      return foods
    },
  },
  actions: {
    async initGoodsData() {
      const res = await axios('./data.json')
      this.shopCarData = res.data.goods
    },
    shopCarDataSet(data) {
      this.shopCarData = data
    },
    async initSellerData() {
      const res = await axios('./data.json')
      this.seller = res.data.seller
    },
    ratingsDataSet(data) {
      this.seller = data
    },
    async initRatingsData() {
      const res = await axios('./data.json')
      this.seller = res.data.ratings
    },
    ratingsDataSet(data) {
      this.ratings = data
    },
    changeOneData(data) {
      const { id, numberSize = 1 } = data
      const goods = JSON.parse(JSON.stringify(this.shopCarData))
      let quantities
      // id
      for (let i = 0, length = goods.length; i < length; i++) {
        const item = goods[i]
        for (let j = 0, length2 = item['foods'].length; j < length2; j++) {
          const foods = item['foods'][j]
          if (foods['id'] === id && foods.hasOwnProperty('count')) {
            const count = foods.count
            // 加法运算
            quantities = count + numberSize
            if (quantities > 9999) {
              this.$toast('数量最为多9999')
            } else if (quantities < 0) {
              this.$toast('数量不能少于0')
            } else {
              // 标记与回显
              foods.count = quantities
            }
            break
          }
        }
      }
      this.shopCarData = goods
    },
  },
})