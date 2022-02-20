<!--
 * @Author: your name
 * @Date: 2021-03-10 15:30:47
 * @LastEditTime: 2022-02-21 00:59:29
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo2\vue\eleme\phoneweb\src\views\orderFinish\index.vue
-->
<template>
  <div class="orderFinish">
    <van-nav-bar left-arrow
                 title="订单生成"
                 :border="false"
                 :fixed="true"
                 @click-left="onClickLeft">
      <template #right>
        <van-icon name="service-o" />
      </template>
    </van-nav-bar>
    <div class="global-card order-info">
      <div class="flex-1 g-fS-12">
        <div class="order-cart g-fS-14">
          <div class="cart-title">527烧烤</div>
          <div class="cart-content">
            <div v-for="(item,index) in selectfoods"
                 :key="index"
                 class="content-item">
              <div>
                <van-image width="50"
                           height="50"
                           :src="item.image" />
              </div>
              <div class="flex-1 pad-left">
                <div class="weight">{{item.name}}</div>
                <div class="N6"><span class="g-fS-10">￥</span>{{item.price}}</div>
                <div class="N6"><span class="g-fS-10">x</span>{{item.count}}</div>
              </div>
              <div>
                <span class="g-fS-10">￥</span>{{(item.price*item.count).toFixed(1)}}
              </div>
            </div>
          </div>
          <div class="flexdir m10-p10">
            <div class="flex-1">配送费</div>
            <div class="flex-1 right"><span class="g-fS-10">￥</span>5.6</div>
          </div>
          <div class="flexdir m10-p10">
            <div class="flex-1">包装费</div>
            <div class="flex-1 right"><span class="g-fS-10">￥</span>2.6</div>
          </div>
          <div class="cart-price">
            <div class="price-left">优惠说明</div>
            <div class="price-right right">小计<span class="g-fS-10">￥</span>{{totalPrice}}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="global-card g-fS-14">
      <div class="margin10">
        <h1 class="m15-p10">配送信息</h1>
        <div class="flexdir m15-p10">
          <div class="flex-1">送达时间</div>
          <div class="flex-1 right">尽快送达</div>
        </div>
        <div class="flexdir m15-p10">
          <div class="flex-1">收货地址</div>
          <div class="flex-1 right">xx</div>
        </div>
        <div class="flexdir m15-p10">
          <div class="flex-1">配送方式</div>
          <div class="flex-1 right">蜂鸟快送</div>
        </div>
      </div>
    </div>
    <div class="global-card g-fS-14 margin-bot">
      <div class="margin10">
        <h1 class="m15-p10">订单信息</h1>
        <div class="flexdir m15-p10">
          <div class="flex-1">订单号</div>
          <div class="flex-1 right">1231233453453453453</div>
        </div>
        <div class="flexdir m15-p10">
          <div class="flex-1">支付方式</div>
          <div class="flex-1 right">在线支付</div>
        </div>
        <div class="flexdir m15-p10">
          <div class="flex-1">下单时间</div>
          <div class="flex-1 right">2021-03-11 00:36</div>
        </div>
        <div class="flexdir m15-p10">
          <div class="flex-1">订单备注</div>
          <div class="flex-1 right">无需餐具</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useStore } from '@/pinia/index.js'
import { NavBar, Image, Icon } from 'vant'
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'order-finish',
  components: {
    [NavBar.name]:NavBar,
    [Image.name]:Image,
    [Icon.name]:Icon
  },
  setup() {
    const store = useStore()
    return {
      shopCarData: store.shopCarData
    }
  },
  computed: {
    selectfoods: {
      get: function () {
        const foods = []
        this.goods.forEach((good) => {
          good.foods.forEach((food) => {
            if (food.count) {
              foods.push(food)
            }
          })
        })
        return foods
      }
    },
    goods () {
      return this.shopCarData
    },
    totalPrice () {
      let total = 5.6 + 2.6;
      this.selectfoods.forEach((food) => {
        total += food.price * food.count;
      });
      return total;
    },
    totalCount () {
      let count = 0
      this.selectfoods.forEach((food) => {
        count += food.count
      })
      return count.toFixed(1)
    }
  },
  methods: {
    onClickLeft () {
      this.$router.go(-1)
    }
  }
})
</script>

<style lang="scss" scoped>
@import "@/assets/color.scss";
.orderFinish {
  height: 100vh;
  overflow: auto;
  background-image: linear-gradient(90deg, #0af, #0085ff);
  :deep(.van-nav-bar) {
    background-image: linear-gradient(90deg, #0af, #0085ff);
    .van-icon {
      color: #ffffff;
    }
  }
  :deep(.van-nav-bar__title) {
    color: #ffffff;
    font-size: 14px;
  }
  .order-info {
    margin-top: 10vh;
  }
  .order-cart {
    margin: 0 10px;
    background: #fff;
    box-shadow: 0 0.013333rem 0.026667rem 0 rgba(0, 0, 0, 0.05);
    box-shadow: 0 0.133333vw 0.266667vw 0 rgba(0, 0, 0, 0.05);
    border-radius: 5px;
    .cart-title {
      padding: 15px 20px;
      font-weight: 500;
      color: $nolmal-textColor;
    }
    .cart-content {
      .content-item {
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
      }
      :deep(img) {
        border-radius: 3px;
      }
    }
    .cart-price {
      padding: 7px 10px;
      display: flex;
      justify-content: space-between;
      .price-left {
        padding: 7px 10px;
        color: #bbb;
        font-size: 12px;
      }
      .price-right {
        padding: 7px 10px;
        font-size: 16px;
      }
    }
  }
}
</style>