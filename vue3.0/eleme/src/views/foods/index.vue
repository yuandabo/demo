<template>
  <div class="flexdir-column foods">
    <div class="goods-img">
      <Swipe />
    </div>
    <div class="shoperrecommend">
      <shoperrecommend :goods="goods"
                       @foodAdd="foodAdd" />
    </div>
    <!-- <van-divider /> -->
    <div class="goods-body">
      <div class="wrapper menu-warpper"
              :pulldown="true">
        <ul class="content">
          <li v-for="(a,index) in goods"
              :key="a.id"
              class="menu-item"
              :class="getMenuItemClass(index)"
              @click="selectMenu(index)">
            <span class="menu-text">{{ a.name }}</span>
          </li>
        </ul>
      </div>

      <div ref="foodsscroll"
              class="wrapper foods-warpper"
              :pulldown="true"
              :listen-scroll="true"
              :top-init="true"
              :top="top"
              :probe-type="3"
              @pulldown="pulldown"
              @scroll="foodsScroll">
        <ul class="relative">
          <!-- <div class="flexdir-align foods-warpper-topWords"
               style="justify-content: center;">
            继续上拉回到顶部
            <van-icon name="back-top" />
          </div> -->
          <li v-for="(a,index) in goods"
              :key="index"
              class="food-list food-list-hook"
              ref="liItem">
            <h1 class="food-list-title">{{ a.name }}</h1>
            <ul>
              <li v-for="(item,index2) in a.foods"
                  :key="index2"
                  class="food-item gradient-line line"
                  @click="goToFoodDetails(item)">
                <div class="foods-image">
                  <van-image width="90px"
                             height="90px"
                             :src="item.image">
                    <template v-slot:error>
                      <van-image width="90px"
                                 height="90px"
                                 src="/img/kobe.png" />
                    </template>
                  </van-image>
                </div>
                <span class="foods-content">
                  <h1 class="foods-content-name">{{ item.name }}</h1>
                  <div class="singleTextOverflow foods-content-desc">原料：{{ item.description }}</div>
                  <div class="foods-content-extra">
                    <span>月售{{ item.sellCount||0 }}</span>
                    <!-- <span>好评率{{item.rating}}%</span> -->
                  </div>
                  <div class="food-priAndcar">
                    <div class="foods-price">
                      <span class="foods-price-now">
                        <span class="now-symbol">￥</span>
                        <span class="now-price">{{ item.price }}</span>
                      </span>
                      <span v-show="item.oldPrice"
                            class="foods-price-old">￥{{ item.oldPrice }}</span>
                    </div>
                    <div class="cartcontrol-warpper">
                      <cartcontrol ref="cartcontrol"
                                   :food="item"
                                   @foodAdd="foodAdd"
                                   @foodDec="foodDec" />
                    </div>
                  </div>
                </span>
              </li>
            </ul>
          </li>
        </ul>
      </div>

    </div>
    <shopcar ref="shopcar"
             class="goods-shopcar"
             :selectfoods="selectfoods"
             :deliveryprice="seller.deliveryPrice"
             :minprice="seller.minPrice" />
  </div>
</template>

<script>
import Swipe from './swipe/indev.vue'
import shopcar from '@/components/shopcar/index.vue'
import cartcontrol from '@/components/cartcontrol/index.vue'
import shoperrecommend from '@/views/shoperRecommend/index.vue'
import { useStore } from '@/pinia/index.js'
import { storeToRefs } from 'pinia'
import { Image, Icon } from 'vant'
import {defineComponent} from 'vue'
import setup from '@/setup/cartcontrol/index.js'
export default defineComponent({
  name: 'foods',
  setup() {
    const store = useStore()
    const { shopCarData } = storeToRefs(store)
    return {
      shopCarData,
      store,
      ...setup
    }
  },
  components: {
    shopcar,
    cartcontrol,
    shoperrecommend,
    Swipe,
    [Image.name]: Image,
    [Icon.name]: Icon
  },
  // mixins: [mixins],
  props: {
    seller: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      loading: false,
      ulkey: 0,
      currentIndex: 0,
      top: false,
      currentLiItemTop: null
    }
  },
  computed: {
    goods () {
      return this.shopCarData
    },
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
    /**
     * @description: 计算当前视频栏分类高度 用于联动左侧分类栏
     */
    FOODSLENGTHLIST () {
      const arr = [0]
      this.goods.forEach((v, index) => {
        let val = 0
        if (index === 0) {
          val = v.foods.length * 140 + 26
        } else {
          val = v.foods.length * 140 + arr[index] + 26
        }
        arr.push(val)
      })
      return arr
    }
  },
  methods: {
    goToFoodDetails (item) {
      this.$router.push({ name: 'foodsDetails', params: { details: item } })
    },
    computedTop () {
      const goodBody = document.getElementsByClassName('goods-body')[0]
      if (goodBody) {
        const top = goodBody.getBoundingClientRect().top
        if (top === 0) {
          this.top = true
          this.$nextTick(() => {
            this.$refs.foodsscroll._initScroll()
          })
        }
      }
    },
    /**
     * @description: 食品栏滚动事件
     * @param {*}  pos
     * @return {*}
     */
    foodsScroll (pos) {
      const { liItem } = this.$refs
      // 计算偏移量
      const item = liItem.length > 0 ? liItem[0] : null;
      if (item) { 
        const { top } = item.getBoundingClientRect()
        if (this.currentLiItemTop == null) this.currentLiItemTop = top;
        const y = Math.abs(top - this.currentLiItemTop)
        const array = this.FOODSLENGTHLIST
        let postionsIndex = 0
        if (array.indexOf(y) !== -1) {
          this.currentIndex = array.indexOf(y)
          return
        }
        for (let index = 0; index < array.length; index++) {
          const element = array[index]
          if (y === 0) {
            postionsIndex = 0
            break
          }
          if (index > 0) {
            if (y > element && y < array[index + 1]) {
              postionsIndex = index
              break
            }
          }
        }
        this.currentIndex = postionsIndex
      }
    },
    getMenuItemClass (index) {
      if (index === this.currentIndex) {
        return 'current'
      }
      return ''
    },
    foodDec ($event) {
      this.store.changeOneData({ id: $event.id, numberSize: -1 })
    },
    foodAdd ($event) {
      this.store.changeOneData({ id: $event.food.id })
      this.$refs.shopcar.drop($event.target)
    },
    pulldown () {
      const goods = document.getElementsByClassName('goods')[0]
      setTimeout(() => {
        goods.scrollTop = 0
      }, 500)
    },
    selectMenu (index) {
      this.top = true
      this.currentIndex = Number(index)
      const foodList = document.getElementsByClassName('food-list-hook')
      const el = foodList[index]
      // if (!this.$refs.foodsscroll.scroll) {
        this.$nextTick(() => {
          el.scrollIntoView()
          // this.$refs.foodsscroll._initScroll()
          // this.$refs.foodsscroll.scroll.scrollToElement(el, 300)
        })
        return
      // }
      // this.$refs.foodsscroll.scroll.scrollToElement(el, 300)
    }
  }
})
</script>

<style lang="scss" scoped>
.foods {
  background: #fff;
  .goods-img {
    margin: 15px 5px;
    padding: 0px 5px;
    :deep(.van-image) {
      display: flex;
      justify-content: center;
    }
    :deep(.van-image__img) {
      // width: 90%;
      border-radius: 3px;
    }
  }
  .goods-body {
    // flex: 0;
    display: flex;
    overflow: hidden;
    :deep(.van-image__img) {
      // width: 90%;
      border-radius: 3px;
    }
    // height: 93vh;
    .menu-warpper {
      // height: 93vh;
      flex: 1;
      // width: 120px;
      // position: relative;
      // top: 0px;
      background-color: #f3f5f7;
    }
    .foods-warpper {
      height: 93vh;
      flex: 4;
      font-size: 12px;
      // line-height: 12px;
      // position: relative;
      // top: 0px;
      // left: 0;
      .foods-warpper-topWords {
        position: absolute;
        width: 100%;
        // padding: 20px;
        box-sizing: border-box;
        transform: translateY(-100%) translateZ(0);
      }
      .food-list {
        .food-list-title {
          padding-left: 14px;
          height: 26px;
          line-height: 26px;
          border-left: 1px solid #d9dde1;
          font-size: 13px;
          color: rgb(24, 23, 23);
        }
        .food-item {
          display: flex;
          padding-top: 10px;
          margin: 0 10px;
          // padding-bottom: 30px;
          .foods-image {
            flex: 0;
            width: 100px;
            margin-right: 10px;
          }
          .foods-content {
            flex: 1;
            .foods-content-name {
              margin: 2px 0 15px 0;
              height: 14px;
              font-size: 15px;
              line-height: 14px;
              color: rgb(0, 0, 0);
            }
            .foods-content-desc {
              width: 120px;
              margin-bottom: 15px;
              font-size: 12px;
              color: rgb(59, 60, 61);
            }
            .food-priAndcar {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 18px;
              .foods-price {
                flex: 1;
                // font-weight: 500;
                // line-height: 24px;
                .foods-price-now {
                  margin-right: 8px;
                  font-size: 16px;
                  line-height: 14px;
                  color: rgb(240, 20, 20);
                  .now-symbol {
                    font-size: 10px;
                  }
                  .now-price {
                    font-size: 16px;
                  }
                }
                .foods-price-old {
                  font-size: 10px;
                  // line-height: 10px;
                  color: rgb(147, 153, 159);
                  text-decoration: line-through;
                }
              }
              .cartcontrol-warpper {
                flex: 1;
              }
            }
          }
        }
      }
    }
  }
  .goods-shopcar {
    position: fixed;
    height: 7vh;
    z-index: 57;
    bottom: 0;
  }
  .menu-icon {
    height: 12px;
    width: 12px;
    vertical-align: top;
    background-image: url("/img/special_3@2x.png");
    background-size: 12px 12px;
    background-repeat: no-repeat;
    margin-right: 2px;
  }
  .menu-item {
    display: flex;
    flex-direction: column;
    vertical-align: top;
    font-size: 12px;
    // width: 61px;
    // height: 30px;
    line-height: 13px;
    padding: 10px;
    border-color: #f3f5f7;
  }
  .menu-text {
    display: table-cell;
    width: 56px;
    vertical-align: middle;
    font-size: 12px;
  }
  .gradient-line {
    position: relative;
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
      background: -webkit-linear-gradient(
        top,
        rgba(7, 17, 27, 0.1),
        transparent
      );
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

  .foods-content-extra {
    font-size: 10px;
    line-height: 10px;
    margin-bottom: 15px;
    color: rgb(74, 75, 77);
  }

  .current {
    background-color: #ffffff;
    font-weight: 500;
    z-index: 10;
  }
  .my-swipe .van-swipe-item {
    width: 100vw;
    height: 90px;
    // padding: 0 5px;
    color: #fff;
    font-size: 20px;
    line-height: 90px;
    text-align: center;
    // background-color: #39a9ed;
  }
} 
.wrapper {
  overflow: auto;
}
</style>
