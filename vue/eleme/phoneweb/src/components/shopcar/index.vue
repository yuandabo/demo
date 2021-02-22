<template>
  <div class="shopcar">
    <div class="content">
      <div class="content-left"
           @click="toggleList">
        <div class="shop-logo-warpper">
          <div class="shop-logo">
            <van-icon :name="getCartIcon()"
                      size="35"
                      :badge="totalCount" />
          </div>
          <!-- <div class="shopcar-num"
               v-show="totalCount > 0">{{totalCount}}</div> -->
        </div>
        <div class="pay-money"
             :class="[totalCount > 0?'price-highlight':'']">￥{{totalPrice}}</div>
        <!-- <div class="post-money">餐具费：{{deliveryprice}}元</div> -->
      </div>
      <div class="content-right"
           @click="routerTo">
        <div class="content-right-pay"
             @click="postTotalPrice()"
             :class="[totalPrice >= minprice?'content-right-pay-highlight':'']">{{payDesc}}</div>
      </div>
    </div>
    <transition name="fade">
      <div class="shopcar-list"
           v-show="listShow">
        <div class="shopcar-list-head">
          <h1 class="shopcar-list-head-title">购物车</h1>
          <span class="empty"
                @click="cleanlist">清空</span>
        </div>
        <div class="shopcar-list-content">
          <ul>
            <li class="shopcar-list-content-food gradient-line line"
                v-for="(food,index) in selectfoods"
                :key="index">
              <span class="shopcar-list-content-food-name">{{food.name}}</span>
              <div class="shopcar-list-content-food-price">
                <span>￥{{food.price*food.count}}</span>
              </div>
              <div class="shopcar-control">
                <carcontrol :food="food"></carcontrol>
              </div>
            </li>
          </ul>
        </div>
        <!-- <div class="shopcar-list-content-div"></div> -->
      </div>
    </transition>
    <div class="list-mask"
         @click="maskClick"
         v-show="maskShow"></div>
  </div>
</template>

<script>
import carcontrol from '@/components/cartcontrol'
import { saveOrder } from '@/api/send'
export default {
  name: 'shopcar',
  data () {
    return {
      fold: true,
      maskShow: false
    }
  },
  props: {
    deliveryprice: {
      type: Number,
      default: 0
    },
    minprice: {
      type: Number,
      default: 0
    },
    selectfoods: {
      type: Array,
      default () {
        return [

        ];
      }
    }
  },
  components: {
    carcontrol
  },
  computed: {
    totalPrice () {
      let total = 0;
      this.selectfoods.forEach((food) => {
        total += food.price * food.count;
      });
      return total;
    },
    totalCount () {
      let count = 0;
      this.selectfoods.forEach((food) => {
        count += food.count;
      })
      return count;
    },
    payDesc () {
      if (this.totalPrice === 0) {
        return `￥${this.minprice}元起`;
      } else if (this.totalPrice < this.minprice) {
        let diff = this.minprice - this.totalPrice;
        return `还差￥${diff}元`;
      } else {
        return '去结算';
      }
    },
    listShow () {
      if (!this.totalCount) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.fold = true;
        return false;
      }
      let show = !this.fold;
      return show;
    }
  },
  mounted () {
    this.open()
  },
  methods: {
    routerTo () {
      if (this.totalPrice >= this.minprice) {
        this.$db.setDb('order', { selectfoods: this.selectfoods, totalPrice: this.totalPrice })
        this.$router.push({ path: '/order' })
      }
    },
    maskClick () {
      this.fold = true
      this.maskShow = false
    },
    getCartIcon () {
      let name = this.totalCount > 0 ? 'cartblue' : 'cartgrey'
      return this.getIcon(name)
    },
    getIcon (name) {
      return `img/${name}.png`
    },
    toggleList () {
      if (!this.totalCount) {
        return;
      }
      this.fold = !this.fold;
      this.maskShow = !this.maskShow;
    },
    cleanlist () {
      console.log(this.selectfoods)
      this.selectfoods.forEach((food) => {
        food.count = 0;
      })
      this.maskShow = false;
    },
    //结算
    postTotalPrice () {
      if (this.payDesc !== '去结算') {
        return
      }
      if (!this.$db.getDb('phoneNum')) {
        this.open()
        return
      }
      const selects = JSON.stringify(this.cleanSelects(this.selectfoods))
      // 本地储存订单信息
      saveOrder({
        price: this.totalPrice,
        selects: selects,
        phoneNum: this.$db.getDb('phoneNum')
      })
        .then(res => {
          // console.log(res)
          if (res.code === '200') {
            this.$message({
              type: 'success',
              message: '下单成功请等待上菜'
            });
            const data = JSON.stringify(this.selectfoods)
            this.$db.setDb('selectfoods', data)
            this.$router.push({
              path: '/order',
              query: {
                id: res.data
              }
            })
          }
        })
      this.$db.cleanDb()
    },
    // 过滤selects
    cleanSelects (arr) {
      let returnArr = []
      arr.forEach(item => {
        returnArr.push({
          name: item.name,
          count: item.count
        })
      })
      // console.log(returnArr)
      return returnArr
    },
    // 开启电话输入框
    open () {
      // this.$prompt('请输入手机号', '提示', {
      //   confirmButtonText: '确定',
      //   cancelButtonText: '先看看',
      //   inputPattern: /^1[3456789]\d{9}$/,
      //   inputErrorMessage: '手机号格式不正确',
      //   // center: true
      // }).then(({ value }) => {
      //   this.$message({
      //     type: 'success',
      //     message: '你的手机号是: ' + value
      //   });
      //   this.$db.setDb('phoneNum', value)
      //   // console.log(this.$db.getDb('phoneNum'))
      // }).catch(() => {
      //   this.$message({
      //     type: 'info',
      //     message: '取消输入'
      //   });
      // });
    },
    // 开启历史选择框
    openHistoryOrder () {
      this.$confirm('系统查询到有历史订单, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message({
          type: 'success',
          message: '进入成功!'
        });
      }).catch(() => {
        this.$db.cleanDb()
        this.$message({
          type: 'info',
          message: '取消进入'
        });
      });
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.shopcar {
  /* position: fixed; */
  /* left: 0; */
  /* bottom: 0; */
  width: 100%;
  height: 48px;
  z-index: 50;
  background-color: #f3f5f7;
}
.content {
  display: flex;
  // background-color: #141d27;
  // font-size: 0;
  .content-left {
    flex: 4;
  }
  .content-right {
    flex: 2;
    display: flex;
    justify-content: center;
    align-items: baseline;
    // width: 105px;
    padding: 7px 5px;
    font-size: 16px;
  }
}
.content-right-pay {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 38px;
  width: 100%;
  border-radius: 30px;
  color: #ffffff;
  font-weight: 700;
  background-color: #acacac;
}
.shopcar-list-content-div {
  background-color: #fff;
  height: 230px;
}
.shop-logo-warpper {
  display: inline-block;
  // position: relative;
  // top: -10px;

  margin-left: 12px;
  // padding: 6px;
  // width: 56px;
  // height: 56px;
  // box-sizing: border-box;
  // vertical-align: top;
  // border-radius: 50%;
  // background-color: #141d27;
}
.shopcar-num {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 16px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background-color: rgb(240, 20, 20);
  box-shadow: 0 4px 8px 9 rgba(0, 0, 0, 0.4);
}
.pay-money {
  display: inline-block;
  vertical-align: top;
  margin-top: 12px;
  line-height: 24px;
  padding-right: 12px;
  box-sizing: border-box;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.4);
}
.post-money {
  display: inline-block;
  vertical-align: top;
  margin: 12px 0 0 12px;
  line-height: 24px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
}
.shop-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  line-height: 44px;
  border-radius: 50%;
  // background: #2b343c;
  font-size: 30px;
  text-align: center;
  /deep/.van-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /deep/.van-info {
    z-index: 61;
  }
}
.price-highlight {
  color: rgb(0, 160, 220);
}
.content-right-pay-highlight {
  background-color: rgb(0, 160, 220);
  color: #fff;
}
.shopcar-list {
  position: absolute;
  left: 0;
  top: -310px;
  z-index: 60;
  width: 100%;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
.shopcar-list-head {
  height: 40px;
  background-color: #f3f5f7;
  font-weight: 200;
  padding: 0 18px;
  line-height: 40px;
  border-bottom: 1px solid rgba(7, 17, 27, 0.1);
}
.shopcar-list-head-title {
  float: left;
  font-size: 14px;
  color: rgb(7, 17, 27);
}
.empty {
  float: right;
  font-size: 12px;
  color: rgb(0, 160, 220);
}
.shopcar-list-content {
  padding: 0 18px;
  // max-height: 217px;
  height: 273px;
  overflow: auto;
  background-color: #fff;
}
.shopcar-list-content-food {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 80px;
  position: relative;
  // padding: 12px 0;
  box-sizing: border-box;
  color: rgb(7, 17, 27);
  height: 24px;
}
.gradient-line {
  position: relative;
  margin-top: 20px;
  transform: translate(0px, 0px);
}
.line::after {
  height: 1px;
  content: "";
  position: absolute;
  background: rgba(7, 17, 27, 0.1);
  bottom: 0;
  left: 0;
  right: 0;
  transform: translate(0px, 0px);
}
@media only screen and (-webkit-min-device-pixel-ratio: 2) {
  .line::after {
    background: -webkit-linear-gradient(top, rgba(7, 17, 27, 0.1), transparent);
    background: linear-gradient(to bottom, rgba(7, 17, 27, 0.1), transparent);
    transform: translate(0px, 0px);
  }
}
@media only screen and (-webkit-min-device-pixel-ratio: 3) {
  .line::after {
    background: -webkit-linear-gradient(
      top,
      rgba(7, 17, 27, 0.1),
      transparent,
      transparent
    );
    background: linear-gradient(
      to bottom,
      rgba(7, 17, 27, 0.1) transparent,
      transparent
    );
  }
}
.shopcar-list-content-food-name {
  font-size: 14px;
  color: rgb(7, 17, 27);
}
.shopcar-list-content-food-price {
  // position: absolute;
  // right: 90px;
  // bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  color: rgb(240, 20, 20);
}
.shopcar-control {
  position: absolute;
  right: 0;
  bottom: 0px;
}
.list-mask {
  z-index: 50;
  background-color: rgba(39, 39, 39, 0.897);
  position: absolute;
  width: 100%;
  height: 50vh;
  bottom: 355px;
}
</style>
