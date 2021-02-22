<template>
  <div class="flexdir-column order">
    <div class="order-background" />
    <van-nav-bar title="确认订单"
                 left-arrow
                 @click-left="onClickLeft" />
    <div class="flex-1">
      <div class="order-address">
        <div class="address-titile">订单配送至</div>
        <div class="address-content"
             @click="$router.push({path:'/address'})">{{address}}
          <van-icon name="arrow" />
        </div>
      </div>
      <div class="order-send">
        <div class="send-time">
          <div>送达时间</div>
          <div class="right"
               @click="sheetshow = true">尽快送达(11:00)</div>
        </div>
        <div class="send-pay">
          <div>支付方式</div>
          <div class="right">在线支付</div>
        </div>
      </div>
      <div class="order-cart">
        <div class="cart-title">527烧烤</div>
        <div class="cart-content">
          <div v-for="(item,index) in selectfoods"
               :key="index"
               class="content-item">
            <div class="flex-1">
              {{item.description}}
            </div>
            <div class="flex-1">
              {{item.price}}/每份
            </div>
            <div class="flex-1">
              {{item.count}}份
            </div>
          </div>
        </div>
        <div v-for="(item,index) in payList"
             :key="index"
             class="cart-sendpay">
          <div>配送费</div>
          <div class="right">￥5.6</div>
        </div>
        <div class="cart-price">
          <div class="price-left">优惠说明</div>
          <div class="price-right right">小计￥{{totalPrice}}</div>
        </div>
      </div>
      <div class="remark">
        <van-field v-model="message"
                   rows="2"
                   autosize
                   label="留言"
                   type="textarea"
                   maxlength="50"
                   placeholder="请输入留言"
                   show-word-limit />
      </div>
    </div>

    <van-submit-bar :price="3050"
                    button-text="提交订单"
                    button-type="info"
                    @submit="onSubmit" />
    <van-action-sheet v-model="sheetshow"
                      :actions="actions"
                      @select="onSelect" />
  </div>
</template>

<script>
// import carcontrol from '../cartcontrol/cartcontrol'
import { queryById } from '@/api/send'
export default {
  name: '',
  //   components: {
  //     carcontrol
  //   },
  data () {
    return {
      fold: true,
      maskShow: false,
      selectfoods: [],
      id: this.$route.query.id,
      mes: {},
      payList: [],
      message: '',
      sheetshow: false,
      actions: [{ name: '选项一' }, { name: '选项二' }, { name: '选项三' }],
      address: '请选择收获地址',
      totalPrice: 0
    }
  },
  computed: {
    // totalPrice () {
    //   let total = 0
    //   this.selectfoods.forEach((food) => {
    //     total += food.price * food.count
    //   })
    //   return total
    // },
    totalCount () {
      let count = 0
      this.selectfoods.forEach((food) => {
        count += food.count
      })
      return count
    },
    payDesc () {
      if (this.totalPrice === 0) {
        return `￥${this.minprice}元起`
      } else if (this.totalPrice < this.minprice) {
        const diff = this.minprice - this.totalPrice
        return `还差￥${diff}元`
      } else {
        return '去结算'
      }
    },
    listShow () {
      if (!this.totalCount) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.fold = true
        return false
      }
      const show = !this.fold
      return show
    }
  },
  activated () {
    console.log(this.$db.getDb('order'))
    if (this.$route.query.content) {
      // const { addressDetail } = this.$route.query.content
      this.address = this.$route.query.content
    }
    if (this.$db.getDb('order')) {
      const { selectfoods, totalPrice } = this.$db.removeGetDb('order')
      this.selectfoods = selectfoods
      this.totalPrice = totalPrice
    }
    this.queryById()
  },
  methods: {
    onSelect () { },
    onSubmit () {
      this.$router.push({ path: '/goods' })
    },
    onClickLeft () { this.$router.push({ path: '/goods/index' }) },
    queryById () {
      queryById({ id: this.id })
        .then((res) => {
          if (res.code === '200') {
            this.mes = res.data[0]
          }
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.order {
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  /deep/.van-submit-bar {
    position: relative;
  }
  /deep/.van-nav-bar {
    // z-index: 1;
    background-image: linear-gradient(90deg, #0af, #0085ff);
    .van-icon {
      color: #ffffff;
    }
  }
  /deep/.van-nav-bar__title {
    color: #ffffff;
  }
  .order-background {
    z-index: -1;
    width: 100vw;
    height: 70vh;
    position: absolute;
    top: 0;
    left: 0;
    background-image: linear-gradient(90deg, #0af, #0085ff);
  }
  .order-address {
    padding: 15px;
    color: #ffffff;
    .address-titile {
      font-size: 16px;
      line-height: 1.21;
      color: hsla(0, 0%, 100%, 0.8);
    }
    .address-content {
      display: flex;
      align-items: center;
      font-size: 22px;
      font-weight: bold;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: calc(100% - 0.4rem);
      max-width: calc(100% - 4vw);
    }
  }
  .order-send {
    background: #fff;
    box-shadow: 0 0.013333rem 0.026667rem 0 rgba(0, 0, 0, 0.05);
    box-shadow: 0 0.133333vw 0.266667vw 0 rgba(0, 0, 0, 0.05);
    margin: 10px;
    .send-time,
    .send-pay {
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      div {
        flex: 1;
        // text-align: center;
      }
    }
  }
  .order-cart {
    margin: 10px;
    // flex: 1;
    background: #fff;
    box-shadow: 0 0.013333rem 0.026667rem 0 rgba(0, 0, 0, 0.05);
    box-shadow: 0 0.133333vw 0.266667vw 0 rgba(0, 0, 0, 0.05);
    .cart-title {
      padding: 15px 20px;
      font-size: 16px;
      font-weight: bold;
    }
    .cart-content {
      // padding: 15px;
      font-size: 16px;
      .content-item {
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
      }
    }
    .cart-sendpay {
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
  .remark {
    margin: 10px;
    // flex: 1;
    background: #fff;
  }
}

.right {
  text-align: right;
}
</style>
