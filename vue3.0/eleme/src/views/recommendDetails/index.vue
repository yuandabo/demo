<template>
  <div class="flexdir-column search-foods">
    <van-nav-bar :border="false"
                 right-text="搜索"
                 left-arrow
                 @click-left="$router.go(-1)"
                 @click-right="search">
      <template #title>
        <van-search v-model="value"
                    style="height: 7vh;"
                    placeholder="请输入搜索关键词" />
      </template>
    </van-nav-bar>

    <yb-scroll ref="foodsscroll"
            class="wrapper foods-warpper flex-1"
            :pulldown="true">
      <ul>
        <li v-for="(item,index) in foods"
            :key="index"
            class="food-item">
          <div class="foods-image">
            <van-image class="imgdom"
                       width="100px"
                       height="100px"
                       :src="item.image">
              <template v-slot:error>
                <van-image class="imgdom"
                           width="90px"
                           height="90px"
                           src="/img/kobe.png" />
              </template>
            </van-image>
          </div>
          <span class="foods-content">
            <h1 class="foods-content-name">{{ item.name }}</h1>
            <div class="foods-content-desc">{{ item.description||'暂无介绍' }}</div>
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
                <cartcontrol :food="item"
                             @foodAdd="foodAdd"
                             @foodDec="foodDec" />
              </div>
            </div>
          </span>
        </li>
      </ul>
    </yb-scroll>

    <shopcar ref="shopcar"
             class="goods-shopcar"
             :selectfoods="selectfoods"
             :deliveryprice="seller.deliveryPrice"
             :minprice="seller.minPrice" />
  </div>
</template>

<script>
// import axios from 'axios'
// import mixins from '@/mixins/cartcontrol'
import cartcontrol from '@/components/cartcontrol/index.vue'
import shopcar from '@/components/shopcar/index.vue'
import { useStore } from '@/pinia/index.js'
//  import store from '@/store'
import { NavBar, Search, Image } from 'vant'
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'recommendDetails',
  setup() {
    const store = useStore()
    return {
      shopCarData: store.shopCarData
    }
  },
  components: {
    cartcontrol,
    shopcar,
    [NavBar.name]: NavBar,
    [Search.name]: Search,
    [Image.name]: Image
  },
  // mixins: [mixins],
  data () {
    return {
      value: '',
      seller: {}
    }
  },
  computed: {
    // ...mapState([
    //   'shopCarData'
    // ]),
    goods () {
      return this.shopCarData
    },
    foods: {
      get () {
        let arr = []
        if (this.goods.length) {
          this.goods.forEach((v) => {
            arr = [...arr, ...v.foods]
          })
        }
        return arr
      },
      set (val) {
        this.goods.forEach((v) => { v.foods = v.foods.filter((item) => item.name.indexOf(val) !== -1) })
      }
    },
    selectfoods: {
      get: function () {
        const foods = []
        this.foods.forEach((food) => {
          if (food.count) {
            foods.push(food)
          }
        })
        return foods
      }
    }
  },
  created () {
    // this.getAll()
  },
  methods: {
    search () {
      this.foods = this.value
    },
    foodDec ($event) {
      store.commit('app/shopcar/changeOneData', { id: $event.id, numberSize: -1 })
    },
    foodAdd ($event) {
      store.commit('app/shopcar/changeOneData', { id: $event.food.id })
      this.$refs.shopcar.drop($event.target)
    },
    // 获取后台数据
    // async getAll () {
    //   // if (this.$mode) {
    //   axios('./data.json')
    //     .then((res) => {
    //       // this.goods = res.data.goods
    //       this.seller = res.data.seller
    //     })
    //   // } else {
    //   //   const data = await getAll()
    //   //   if (data.code === '200') {
    //   //     const goods = data.data.goods
    //   //     const arr = []
    //   //     // 过滤数据
    //   //     for (let i = 0, length = goods.length; i < length; i++) {
    //   //       const item = goods[i]
    //   //       if (item.foods && item.foods.length !== 0) {
    //   //         arr.push(item)
    //   //       }
    //   //     }
    //   //     this.goods = arr
    //   //     this.initCount() // 初始化count
    //   //   }
    //   // }
    //   this.loading = false
    // }
  }
})
</script>

<style lang="scss" scoped>
.search-foods {
  height: 93vh;
  background: #ffffff;
  ::v-deep.van-image__img {
    border-radius: 5px;
  }
  ::v-deep .van-search__content {
    border-radius: 20px;
  }
  ::v-deep .van-search .van-cell {
    // padding: 0px 8px 0 0;
  }
  .foods-warpper {
    font-size: 12px;
    margin: 7px 5px;
    overflow: hidden;
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
      margin: 0 10px 10px 10px;
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
          margin-bottom: 15px;
          font-size: 12px;
          // line-height: 10px;
          color: rgb(59, 60, 61);
        }
        .food-priAndcar {
          display: flex;
          justify-content: center;
          align-items: center;
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
  .goods-shopcar {
    position: fixed;
    height: 7vh;
    z-index: 57;
    bottom: 0;
  }
}
</style>
