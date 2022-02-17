<template>
  <div class="flexdir-column relative order">
    <div class="order-background" />
    <van-nav-bar title="确认订单"
                 left-arrow
                 :fixed="true"
                 @click-left="onClickLeft" />
    <van-notice-bar style="margin:5px 10px;border-radius:5px"
                    left-icon="volume-o"
                    text="为减少接触，降低风险，请修改下方备注。" />
    <div class="flex-1 g-fS-12">
      <div class="order-address">
        <!-- <div class="address-titile">订单配送至</div> -->
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
        <div class="flexdir cart-sendpay">
          <div class="flex-1">配送费</div>
          <div class="flex-1 right"><span class="g-fS-10">￥</span>5.6</div>
        </div>
        <div class="flexdir cart-sendpay">
          <div class="flex-1">包装费</div>
          <div class="flex-1 right"><span class="g-fS-10">￥</span>2.6</div>
        </div>
        <div class="cart-price">
          <div class="price-left">优惠说明</div>
          <div class="price-right right">小计<span class="g-fS-10">￥</span>{{totalPrice}}</div>
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

    <van-submit-bar :price="totalPrice*100"
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
import { useStore } from '@/pinia/index.js'
// //  import store from '@/store'
import { NavBar, NoticeBar, SubmitBar, ActionSheet, Field, Image, Icon } from 'vant'
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'order',
  setup() {
    const store = useStore()
    return {
      shopCarData: store.shopCarData
    }
  },
  components: {
    [NavBar.name]: NavBar,
    [NoticeBar.name]: NoticeBar,
    [SubmitBar.name]: SubmitBar,
    [ActionSheet.name]: ActionSheet,
    [Image.name]: Image,
    [Icon.name]: Icon
  },
  data () {
    return {
      fold: true,
      maskShow: false,
      // selectfoods: [],
      id: this.$route.query.id,
      mes: {},
      payList: [],
      message: '',
      sheetshow: false,
      actions: [{ name: '选项一' }, { name: '选项二' }, { name: '选项三' }],
      address: '请选择收获地址',
      // totalPrice: 0
    }
  },
  computed: {
    // ...mapState([
    //   'shopCarData'
    // ]),
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
    // console.log(this.$db.getDb('order'))
    if (this.$route.query.content) {
      // const { addressDetail } = this.$route.query.content
      this.address = this.$route.query.content
    }
    // if (this.$db.getDb('order')) {
    //   const { selectfoods, totalPrice } = this.$db.removeGetDb('order')
    //   this.selectfoods = selectfoods
    //   this.totalPrice = totalPrice
    // }
    // this.queryById()
  },
  methods: {
    onSelect () { },
    onSubmit () {
      this.$router.push({ path: '/orderFinish' })
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
})
</script>

<style lang="scss" scoped>
@import "@/assets/color.scss";
.order {
  height: 90vh;
  padding-bottom: 100px;
  overflow-x: hidden;
  overflow-y: auto;
  ::v-deep.van-submit-bar {
    // position: relative;
  }
  ::v-deep.van-nav-bar {
    // z-index: 1;
    background-image: linear-gradient(90deg, #0af, #0085ff);
    .van-icon {
      color: #ffffff;
    }
  }
  ::v-deep.van-nav-bar__title {
    color: #ffffff;
    font-size: 14px;
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
    padding: 5px 15px;
    color: #ffffff;
    // background: #ffffff;
    .address-titile {
      font-size: 16px;
      line-height: 1.21;
      color: hsla(0, 0%, 100%, 0.8);
    }
    .address-content {
      display: flex;
      align-items: center;
      font-size: 22px;
      font-weight: 500;
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
    border-radius: 5px;
    .send-time,
    .send-pay {
      padding: 10px 20px;
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
    border-radius: 5px;
    .cart-title {
      padding: 15px 20px;
      // font-size: 16px;
      font-weight: 500;
      color: $nolmal-textColor;
    }
    .cart-content {
      // padding: 15px;
      // font-size: 16px;
      .content-item {
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
      }
      ::v-deep img {
        border-radius: 3px;
      }
    }
    .cart-sendpay {
      margin: 10px;
      padding: 0px 10px;
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
    border-radius: 5px;
    ::v-deep.van-field {
      border-radius: 5px;
    }
  }
}
</style>
