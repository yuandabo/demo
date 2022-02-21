<template>
  <div class="shopcar">
    <div class="content">
      <div class="content-left" @click="toggleList">
        <div class="shop-logo-warpper">
          <div class="shop-logo">
            <Icon :name="getCartIcon()" size="35" :badge="totalCount" />
          </div>
          <!-- <div class="shopcar-num"
               v-show="totalCount > 0">{{totalCount}}</div> -->
        </div>
        <div
          class="pay-money"
          :class="[totalCount > 0 ? 'price-highlight' : '']"
        >
          ￥{{ totalPrice }}
        </div>
        <!-- <div class="post-money">餐具费：{{deliveryprice}}元</div> -->
      </div>
      <div class="content-right" @click="routerTo">
        <div
          class="content-right-pay"
          @click="postTotalPrice()"
          :class="[totalPrice >= minprice ? 'content-right-pay-highlight' : '']"
        >
          {{ payDesc }}
        </div>
      </div>
    </div>
    <transition name="fade">
      <div class="shopcar-list" v-show="listShow">
        <div class="shopcar-list-head">
          <h1 class="shopcar-list-head-title">购物车</h1>
          <span class="empty" @click="cleanlist">清空</span>
        </div>
        <div class="shopcar-list-content">
          <ul>
            <li
              class="shopcar-list-content-food gradient-line line"
              v-for="(food, index) in selectfoods"
              :key="index"
            >
              <span class="shopcar-list-content-food-name">{{
                food.name
              }}</span>
              <div class="shopcar-list-content-food-price">
                <span>￥{{ food.price * food.count }}</span>
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
    <div class="list-mask" @click="maskClick" v-show="maskShow"></div>
    <div v-for="(ball, index) in balls" :key="index">
      <transition
        @before-enter="beforeDrop"
        @enter="dropping"
        @after-enter="afterDrop"
      >
        <div v-show="ball.show" class="flexdir-alignjust ball">
          1
          <!-- <div class="inner inner-hook"></div> -->
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import carcontrol from "@/components/cartcontrol/index.vue";
import { saveOrder } from "@/api/send";
import { Icon } from "vant";
import { defineProps, computed, getCurrentInstance } from "vue";

const fold = true;
const maskShow = false;
const balls = [{ show: false }, { show: false }, { show: false }];
const dropBalls = [];
const instance = getCurrentInstance();
defineProps({
  deliveryprice: {
    type: Number,
    default: 0,
  },
  minprice: {
    type: Number,
    default: 0,
  },
  selectfoods: {
    type: Array,
    default() {
      return [];
    },
  },
});
const totalPrice = computed(() => {
  let total = 0;
  instance.selectfoods.forEach((food) => {
    total += food.price * food.count;
  });
  return total;
});
const totalCount = computed(() => {
  let count = 0;
  instance.selectfoods.forEach((food) => {
    count += food.count;
  });
  return count;
});
const payDesc = computed(() => {
  if (instance.totalPrice === 0) {
    return `￥${instance.minprice}元起`;
  } else if (instance.totalPrice < instance.minprice) {
    let diff = instance.minprice - instance.totalPrice;
    return `还差￥${diff}元`;
  } else {
    return "去结算";
  }
});
const listShow = computed(() => {
  if (!instance.totalCount) {
    instance.fold = true;
    return false;
  }
  let show = !instance.fold;
  return show;
});

function drop(el) {
  for (let i = 0; i < instance.balls.length; i++) {
    const ball = instance.balls[i];
    if (!ball.show) {
      ball.show = true;
      ball.el = el;
      instance.dropBalls.push(ball);
      return;
    }
  }
}
function beforeDrop(el) {
  const ball = instance.dropBalls[instance.dropBalls.length - 1];
  const rect = ball.el.getBoundingClientRect();
  const x = rect.left - 26;
  const y = -(window.innerHeight - rect.top - 42);
  el.style.display = "";
  el.style.transform =
    el.style.webkitTransform = `translate3d(${x}px,${y}px,0)`;
}
function dropping(el, done) {
  el.offsetWidth; // 取offsetWidth会使浏览器重绘
  // setTimeout(() => {
  el.style.transform = el.style.webkitTransform = `translate3d(0,0,0)`;
  // }, 200)
  el.addEventListener("transitionend", done);
}
function afterDrop(el) {
  const ball = instance.dropBalls.shift();
  if (ball) {
    ball.show = false;
    el.style.display = "none";
  }
}
function routerTo() {
  if (instance.totalPrice >= instance.minprice) {
    instance.$router.push({ path: "/order" });
  }
}
function maskClick() {
  instance.fold = true;
  instance.maskShow = false;
}
function getCartIcon() {
  let name = instance.totalCount > 0 ? "cartblue" : "cartgrey";
  return instance.getIcon(name);
}
function getIcon(name) {
  return `img/${name}.png`;
}
function toggleList() {
  if (!instance.totalCount) {
    return;
  }
  instance.fold = !instance.fold;
  instance.maskShow = !instance.maskShow;
}
function cleanlist() {
  console.log(instance.selectfoods);
  instance.selectfoods.forEach((food) => {
    food.count = 0;
  });
  instance.maskShow = false;
}
//结算
function postTotalPrice() {
  if (instance.payDesc !== "去结算") {
    return;
  }
  // if (!instance.$db.getDb('phoneNum')) {
  //   instance.open()
  //   return
  // }
  const selects = JSON.stringify(instance.cleanSelects(instance.selectfoods));
  // 本地储存订单信息
  // saveOrder({
  //   price: instance.totalPrice,
  //   selects: selects,
  //   phoneNum: instance.$db.getDb('phoneNum')
  // })
  //   .then(res => {
  //     // console.log(res)
  //     if (res.code === '200') {
  //       instance.$message({
  //         type: 'success',
  //         message: '下单成功请等待上菜'
  //       });
  //       const data = JSON.stringify(instance.selectfoods)
  //       instance.$db.setDb('selectfoods', data)
  //       instance.$router.push({
  //         path: '/order',
  //         query: {
  //           id: res.data
  //         }
  //       })
  //     }
  //   })
  // instance.$db.cleanDb()
}
// 过滤selects
function cleanSelects(arr) {
  let returnArr = [];
  arr.forEach((item) => {
    returnArr.push({
      name: item.name,
      count: item.count,
    });
  });
  // console.log(returnArr)
  return returnArr;
}
// 开启历史选择框
function openHistoryOrder() {
  instance.$confirm("系统查询到有历史订单, 是否继续?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      instance.$message({
        type: "success",
        message: "进入成功!",
      });
    })
    .catch(() => {
      instance.$db.cleanDb();
      instance.$message({
        type: "info",
        message: "取消进入",
      });
    });
}
</script>
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
  font-weight: 500;
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
  font-weight: 500;
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
  font-weight: 500;
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
  :deep(.van-icon) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :deep(.van-info) {
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
  font-weight: 500;
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
.ball {
  position: fixed;
  left: 32px;
  bottom: 22px;
  z-index: 200;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: rgb(0, 160, 220);
  transition: all 0.4s cubic-bezier(0.49, 0, 0.75, 0.41);
  color: #ffffff;
}
</style>
