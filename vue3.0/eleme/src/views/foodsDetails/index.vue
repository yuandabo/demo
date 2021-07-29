<!--
 * @Author: your name
 * @Date: 2021-03-05 11:33:34
 * @LastEditTime: 2021-03-11 01:24:48
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo2\vue\eleme\phoneweb\src\views\foodsDetails\index.vue
-->
<template>
  <div class="food-detail">
    <van-nav-bar left-arrow
                 :border="false"
                 :fixed="true"
                 @click-left="onClickLeft">
      <template #right>
        <van-icon name="share"
                  @click="onClickRight"
                  :color="'#ffffff'" />
      </template>
    </van-nav-bar>
    <van-image :src="details.image" />
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
        <ul>
          <li v-for="(item,index) in ratings"
              :key="index"
              class="rating-text-li gradient-line line">
            <div class="rating-text-li-left">
              <img class="rating-text-li-left-avatar"
                   :src="item.avatar"
                   width="28"
                   height="28">
            </div>
            <div class="rating-text-li-right">
              <div class="rating-text-li-right-name">{{ item.username }}</div>
              <star :size="24"
                    :score="item.score"
                    class="rating-text-li-right-star" />
              <div class="rating-text-li-right-text">{{ item.text }}</div>
              <div class="rating-text-li-right-time">{{ item.rateTime }}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <van-share-sheet v-model="showShare"
                     title="立即分享给好友"
                     :options="options"
                     @select="onSelect" />
  </div>
</template>

<script>
import cartcontrol from '@/components/cartcontrol'
import star from '@/components/star'
import store from '@/store'
import { mapGetters } from 'vuex'
export default {
  components: {
    cartcontrol,
    star
  },
  data () {
    return {
      // details: {},
      showShare: false,
      options: [
        { name: '微信', icon: 'wechat' },
        { name: '微博', icon: 'weibo' },
        { name: '复制链接', icon: 'link' },
        { name: '分享海报', icon: 'poster' },
        { name: '二维码', icon: 'qrcode' }
      ],
      ratings: [
        { avatar: 'img/kobe.png', username: 'yuandabo', score: 0, text: '非常不好', rateTime: '20200829' },
        { avatar: 'img/kobe.png', username: 'yuandabo', score: 5, text: '非常好', rateTime: '20200829' },
        { avatar: 'img/kobe.png', username: 'yuandabo', score: 3, text: '一般般', rateTime: '20200829' },
        { avatar: 'img/kobe.png', username: 'yuandabo', score: 3, text: '', rateTime: '20200829' },
        { avatar: 'img/kobe.png', username: 'yuandabo', score: 0, text: '非常不好', rateTime: '20200829' },
        { avatar: 'img/kobe.png', username: 'yuandabo', score: 5, text: '非常好', rateTime: '20200829' },
        { avatar: 'img/kobe.png', username: 'yuandabo', score: 3, text: '一般般', rateTime: '20200829' }
      ]
    }
  },
  computed: {
    ...mapGetters([
      'shopCarData'
    ]),
    details () {
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
  },
  methods: {
    onSelect (option) {
      this.showShare = false
    },
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
}
</script>

<style lang="scss" scoped>
@import "@/assets/color";
.food-detail {
  position: relative;
  height: 100vh;
  overflow: auto;
  /deep/ .van-nav-bar {
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
