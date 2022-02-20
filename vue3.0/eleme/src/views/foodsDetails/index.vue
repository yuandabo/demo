<!--
 * @Author: your name
 * @Date: 2021-03-05 11:33:34
 * @LastEditTime: 2022-02-19 16:57:29
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo2\vue\eleme\phoneweb\src\pages\foodsDetails\index.vue
-->
<template>
  <div class="food-detail">
    <van-nav-bar left-arrow
                 :border="false"
                 :fixed="true"
                 @click-left="onClickLeft">
      <template #right>
        <van-icon name="share"
                  :color="'#ffffff'"
                  @click="onClickRight" />
      </template>
    </van-nav-bar>
    <img class="top-img"
         :src="details.image">
    <div class="global-card detail-title">
      <h1 class="title m15-p10">{{ details.name }}</h1>
      <div class="N6 m10-p10 sellNums">月售:{{ details.sellCount }}</div>
      <div class="flexdir m10-p10 priceAndControl">
        <div class="global-nowprice global-fontSize-16px price">
          ￥{{ details.price }}
        </div>
        <div class="control">
          <cartcontrol :food="details"
                       @foodAdd="foodAdd"
                       @foodDec="foodDec" />
        </div>
      </div>
    </div>
    <div class="global-card detail-content">
      <h1 class="m15-p10">商品详情</h1>
      <div class="g-fS-10 m10-p10">
        <span class="pad-right N6">原料</span><span>其他</span>
      </div>
      <div class="g-fS-10 m10-p10">
        <span class="pad-right N6">价格说明</span><span>
          <van-icon name="question" />
        </span>
      </div>
    </div>
    <div class="global-card detail-evaluate">
      <h1 class="m15-p10">商品评价</h1>
      <div class="rating-text">
        <virtual-list style="height: 360px; overflow-y: auto;"
                      :data-key="'uid'"
                      :data-sources="items"
                      :data-component="itemComponent" />
      </div>
    </div>
    <!-- <van-share-sheet v-model="showShare"
                     title="立即分享给好友"
                     :options="options"
                     @select="onSelect" /> -->
  </div>
</template>

<script>
import {defineComponent} from 'vue'
import VirtualList from 'vue-virtual-scroll-list'
import cartcontrol from '@/components/cartcontrol/index.vue'
// import star from '@/components/star'
//  import store from '@/store'
import { useStore } from '@/pinia/index.js'
import { storeToRefs } from 'pinia'
import axios from 'axios'
import ratingItem from './components/ratings.vue'
import { Icon, NavBar } from 'vant'
export default defineComponent({
  name: 'foods-details',
  setup() {
    const store = useStore()
    const { shopCarData } = storeToRefs(store)
    return {
      store,
      shopCarData
    }
  },
  components: {
    cartcontrol,
    // star,
    'virtual-list': VirtualList,
    ratingItem,
    [Icon.name]: Icon,
    [NavBar.name]: NavBar
  },
  data () {
    return {
      // details: {},
      // showShare: false,
      // options: [
      //   { name: '微信', icon: 'wechat' },
      //   { name: '微博', icon: 'weibo' },
      //   { name: '复制链接', icon: 'link' },
      //   { name: '分享海报', icon: 'poster' },
      //   { name: '二维码', icon: 'qrcode' }
      // ],
      itemComponent: ratingItem,
      items: [
        { avatar: '/img/kobe.png', username: 'yuandabo', score: 0, text: '非常不好', rateTime: '20200829', uid: '1' },
        { avatar: '/img/kobe.png', username: 'yuandabo', score: 5, text: '非常好', rateTime: '20200829', uid: '2' },
        { avatar: '/img/kobe.png', username: 'yuandabo', score: 3, text: '一般般', rateTime: '20200829', uid: '3' }
      ]
    }
  },
  computed: {
    // ...mapState([
    //   'shopCarData'
    // ]),
    details () {
      console.log(this.$route.params)
      const { id } = this.$route.params.details
      const goods = this.shopCarData
      // id
      for (let i = 0, length = goods.length; i < length; i++) {
        const item = goods[i]
        for (let j = 0, length2 = item['foods'].length; j < length2; j++) {
          const foods = item['foods'][j]
          if (foods['id'] === id) {
            return foods
          }
        }
      }
      return {}
    }
  },
  created () {
    // this.getAll()
  },
  methods: {
    // 获取后台数据
    async getAll () {
      // if (this.$mode) {
      axios('../../data.json')
        .then((res) => {
          console.log('res', res)
          this.goods = res.data.goods
          // this.seller = res.data.seller
          this.store.shopCarDataSet(res.data.goods)
        })
      // } else {
      //   const data = await getAll()
      //   if (data.code === '200') {
      //     const goods = data.data.goods
      //     const arr = []
      //     // 过滤数据
      //     for (let i = 0, length = goods.length; i < length; i++) {
      //       const item = goods[i]
      //       if (item.foods && item.foods.length !== 0) {
      //         arr.push(item)
      //       }
      //     }
      //     this.goods = arr
      //     this.initCount() // 初始化count
      //   }
      // }
      this.loading = false
    },
    // onSelect (option) {
    //   this.showShare = false
    // },
    onClickLeft () {
      this.$router.go(-1)
    },
    onClickRight () {
      this.showShare = true
    },
    foodDec ($event) {
      store.commit('app/shopcar/changeOneData', { id: $event.id, numberSize: -1 })
    },
    foodAdd ($event) {
      store.commit('app/shopcar/changeOneData', { id: $event.food.id })
    },
    /**
     * 获取小数点后数字数量，整数返回0
     * @param {*} val 需要处理的数字
     */
    getAfterDotNums (val) {
      const hasDot = String(val).indexOf('.') !== -1
      if (hasDot) {
        return String(val).substring(String(val).indexOf('.') + 1).length
      } else {
        return 0
      }
    },
    /**
     * 步长控制器
     * @param {*} id 需要修改方案条目
     * @param {*} numberSize 步长器，现只支持加减算法，传入1为加1，-1为减一
     */
    stepperChange ({ id }, numberSize = 1) {
      const goods = this.goods
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
    }
  }
})
</script>

<style lang="scss" scoped>
@import "@/assets/color.scss";
@import "@/assets/index.scss";
.food-detail {
  position: relative;
  height: 100vh;
  overflow: auto;
  .top-img {
    width: 100vw;
    // height: 200px;
  }
  // image {
  //   width: 100vw;
  // }
  :deep( .van-nav-bar) {
    width: 100vw;
    position: fixed;
    background: none;
  }
  .detail-title {
    .title {
      // margin-left: 5px;
    }
    .priceAndControl {
      justify-content: space-between;
    }
    .sellNums {
      font-size: $nolmal-textSize;
    }
  }
}
.rating-text-li {
  display: flex;
  margin: 18px;
  height: 69px;
}
.rating-text-li-left {
  flex: 0 0 28px;
}
.rating-text-li-right {
  flex: 1;
  margin-left: 12px;
  position: relative;
}
.rating-text-li-left-avatar {
  border-radius: 50%;
}
.rating-text-li-right-name {
  width: 100%;
  font-size: 10px;
  line-height: 10px;
  padding-bottom: 4px;
}
.rating-text-li-right-star {
  width: 100%;
  height: 12px;
  margin-right: 6px;
  margin-left: 0;
}
.rating-text-li-right-text {
  line-height: 18px;
  font-size: 12px;
  color: rgb(7, 17, 27);
  font-weight: 500;
}
.rating-text-li-right-time {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 10px;
  font-weight: 200;
  color: rgb(147, 157, 159);
  line-height: 12px;
}
</style>
