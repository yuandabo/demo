<template>
  <div class="foods">
    <div class="goods-img">
      <van-swipe class="my-swipe"
                 :autoplay="3000"
                 indicator-color="white">
        <van-swipe-item>
          <van-image width="99vw"
                     height="90"
                     :src="'https://cube.elemecdn.com/2/14/7059f0fe8c3eb2c691a595ef7f734png.png?x-oss-process=image/format,webp/resize,w_686'">
            <template v-slot:error>
              <van-image width="100vw"
                         height="90"
                         src="https://cube.elemecdn.com/2/14/7059f0fe8c3eb2c691a595ef7f734png.png?x-oss-process=image/format,webp/resize,w_686">
              </van-image>
            </template>
          </van-image>
        </van-swipe-item>
        <van-swipe-item>
          <van-image width="99vw"
                     height="90"
                     :src="'https://cube.elemecdn.com/2/14/7059f0fe8c3eb2c691a595ef7f734png.png?x-oss-process=image/format,webp/resize,w_686'">
            <template v-slot:error>
              <van-image width="100vw"
                         height="90"
                         src="https://cube.elemecdn.com/2/14/7059f0fe8c3eb2c691a595ef7f734png.png?x-oss-process=image/format,webp/resize,w_686">
              </van-image>
            </template>
          </van-image>
        </van-swipe-item>
      </van-swipe>
    </div>
    <div class="shoperrecommend"
         v-show="showCom">
      <shoperrecommend :goods="goods"></shoperrecommend>
    </div>
    <div class="goods-body">
      <div class="manu-warpper"
           ref="div">
        <ul>
          <li v-for="(a,index) in goods"
              :key="a.id"
              class="menu-item"
              :class="getMenuItemClass(index)"
              @click="selectMenu(index)">
            <span class="manu-text">{{a.name}}</span>
          </li>
        </ul>
      </div>

      <div class="foods-warpper"
           @scroll="foodsScroll"
           ref="f">
        <ul>
          <li v-for="(a,index) in goods"
              :key="index"
              class="food-list food-list-hook">
            <h1 class="food-list-title">{{a.name}}</h1>
            <ul>
              <li v-for="(item,index) in a.foods"
                  :key="index"
                  class="food-item gradient-line line">
                <div class="foods-image">
                  <!-- <img width="90px"
                       height="90px"
                       :src="item.image" /> -->
                  <van-image class="imgdom"
                             width="90px"
                             height="90px"
                             :src="item.image">
                    <template v-slot:error>
                      <van-image class="imgdom"
                                 width="90px"
                                 height="90px"
                                 src="img/kobe.png"></van-image>
                    </template>
                  </van-image>
                </div>
                <span class="foods-content">
                  <h1 class="foods-content-name">{{item.name}}</h1>
                  <div class="foods-content-desc">{{item.description||'暂无介绍'}}</div>
                  <div class="foods-content-extra">
                    <span>月售{{item.sellCount||0}}</span>
                    <!-- <span>好评率{{item.rating}}%</span> -->
                  </div>
                  <div class="food-priAndcar">
                    <div class="foods-price">
                      <span class="foods-price-now">
                        <span class="now-symbol">￥</span>
                        <span class="now-price">{{item.price}}</span>
                      </span>
                      <span v-show="item.oldPrice"
                            class="foods-price-old">￥{{item.oldPrice}}</span>
                    </div>
                    <div class="cartcontrol-warpper">
                      <cartcontrol v-bind:food="item"
                                   @foodAdd="foodAdd"
                                   @foodDec="foodDec"></cartcontrol>
                    </div>
                  </div>
                </span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
    <shopcar class="goods-shopcar"
             :selectfoods="selectfoods"
             :deliveryprice="seller.deliveryPrice"
             :minprice="seller.minPrice"></shopcar>
  </div>
</template>

<script>
import betterScroll from 'better-scroll';
import shopcar from '@/components/shopcar';
import cartcontrol from '@/components/cartcontrol'
import shoperrecommend from '@/components/shoperRecommend'
import mixins from './mixins'
export default {
  props: {
    goods: {
      type: Array
    },
    seller: {
      type: Object
    }
  },
  data () {
    return {
      // goods: [],
      listHeight: [],// foods列表的高度
      scrollY: 0,//存储foods当前坐标
      showCom: true,
      loading: false,
      ulkey: 0,
      currentIndex: 0
    }
  },
  mixins: [mixins],
  components: {
    shopcar,
    cartcontrol,
    shoperrecommend
  },
  computed: {
    selectfoods: {
      get: function () {
        let foods = [];
        this.goods.forEach((good) => {
          good.foods.forEach((food) => {
            if (food.count) {
              foods.push(food);
            }
          });
        });
        return foods;
      },
    }
  },
  mounted () {
    this.$nextTick(() => {
      this._innitScroll()
      this._calculateHeight()
    })
  },
  methods: {
    foodsScroll ($event) {
      // console.log($event)
    },
    getMenuItemClass (index) {
      // console.log(index, this.currentIndex)
      if (index === this.currentIndex) {
        // this.ulkey++
        return 'current'
      }
      return ''
    },
    foodDec ($event) {
      this.stepperChange($event, -1)
    },
    foodAdd ($event) {
      this.stepperChange($event)
    },
    // 初始化scroll
    _innitScroll () {
      const goods = document.getElementsByClassName('goods')[0]
      this.menuScroll = new betterScroll(this.$refs.div, { click: true, probeType: 3 });
      this.foodScroll = new betterScroll(this.$refs.f, { click: true, probeType: 3 });
      this.foodScroll.on('scroll', (pos) => {
        this.scrollY = Math.abs(Math.round(pos.y));
        if (pos.y === 0) {
          this.foodScroll.scrollBy(0, -1)
        }
        if (pos.y >= 50) {
          goods.scrollTop = 0
        }
      })
      this.foodScroll.scrollBy(0, -1);
    },
    // 计算右边高度
    _calculateHeight () {
      return new Promise((resolve, reject) => {
        let foodList = this.$refs.f.getElementsByClassName('food-list-hook');
        let height = 0;
        let arr = [0]
        for (let i = 0; i < foodList.length; i++) {
          let item = foodList[i];
          height += item.clientHeight;
          arr.push(height);
        }
        this.listHeight = arr
      })
    },
    selectMenu (index) {
      this.currentIndex = Number(index)
      let foodList = this.$refs.f.getElementsByClassName('food-list-hook');
      let el = foodList[index];
      this.foodScroll.scrollToElement(el, 300);
      if (index === 0) {
        this.foodScroll.scrollBy(0, -1)
      }
    },
  }
}
</script>

<style lang="scss" scoped>
.foods {
  background: #fff;
  .goods-img {
    /deep/.van-image {
      display: flex;
      justify-content: center;
    }
    /deep/.van-image__img {
      width: 90%;
      border-radius: 20px;
    }
    // display: flex;
    // justify-content: center;
    margin: 8px 0;
  }
  .goods-body {
    // flex: 0;
    display: flex;
    overflow: hidden;
    height: 93vh;
    .manu-warpper {
      flex: 1;
      // width: 120px;
      // position: relative;
      // top: 0px;
      background-color: #f3f5f7;
    }
    .foods-warpper {
      flex: 4;
      font-size: 12px;
      // line-height: 12px;
      // position: relative;
      // top: 0px;
      // left: 0;
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
              margin-bottom: 15px;
              font-size: 12px;
              // line-height: 10px;
              color: rgb(59, 60, 61);
            }
            .food-priAndcar {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 18px;
              .foods-price {
                flex: 1;
                // font-weight: 700;
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
    // height: 7vh;
    z-index: 57;
    bottom: 0;
  }
  .menu-icon {
    height: 12px;
    width: 12px;
    vertical-align: top;
    background-image: url("./special_3@2x.png");
    background-size: 12px 12px;
    background-repeat: no-repeat;
    margin-right: 2px;
  }
  .menu-item {
    display: flex;
    flex-direction: column;
    vertical-align: top;
    font-size: 12px;
    width: 61px;
    height: 30px;
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
    font-weight: 700;
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
</style>