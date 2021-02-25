<template>
  <div>
    <van-divider />
    <div class="shoperRecommend-word-warpper">
      <span class="shoperRecommend-word">商家推荐</span>
    </div>
    <scroll ref="siscroll"
            class="wrapper shoperRecommend-img-warrper"
            :pulldown="true"
            :scroll-x="true"
            :data="foods"
            @click="changeImgPos()">
      <ul class="shoperRecommend-img-ul"
          :style="{width:recommendWidth}">
        <li class="shoperRecommend-img-item"
            v-for="(item) in foods"
            :key="item.id">
          <van-image :src="item.image"
                     fit="contain">
            <template v-slot:loading>
              <van-loading type="spinner"
                           size="20" />
            </template>
          </van-image>
          <div class="shoperRecommend-desc">
            <h1 class="shoperRecommend-desc-title">{{ item.name }}</h1>
            <span class="shoperRecommend-desc-monthseller">月售{{ item.sellCount }}</span>
            <div>
              <span class="shoperRecommend-desc-newprice">
                <span class="shoperRecommend-desc-doller1">￥</span>{{ item.price }}
              </span>
              <span v-if="item.oldPrice"
                    class="shoperRecommend-desc-oldprice">￥{{ item.oldPrice }}</span>
            </div>
            <cartcontrol :food="item"
                         @foodAdd="foodAdd"
                         @foodDec="foodDec" />
          </div>
        </li>
      </ul>
    </scroll>
  </div>
</template>

<script>
import cartcontrol from '@/components/cartcontrol'
export default {
  components: {
    cartcontrol
  },
  props: {
    goods: {
      type: Array
    },
    food: {
      type: Object
    }
  },
  data () {
    return {
      // recommendFoodList: [
      //   { id: '1', count: '0', name: '蜜汁炸鸡', monthSellNums: 162, price: 16, oldPrice: 25, src: 'https://cube.elemecdn.com/d/a5/c034ad58e55d8d7fc08558bbba13ajpeg.jpeg?x-oss-process=image/resize,m_lfit,w_241/watermark,g_se,x_4,y_4,image_YS8xYS82OGRlYzVjYTE0YjU1ZjJlZmFhYmIxMjM4Y2ZkZXBuZy5wbmc_eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8yOA%3D%3D/quality,q_90/format,webp' }
      // ]
    }
  },
  mounted () {
  },
  computed: {
    recommendWidth () {
      console.log(this.goods)
      if (this.goods.length) return `${this.goods[0].foods.length * 110}px`
      return 0
    },
    foods () {
      if (this.goods.length) return this.goods[0].foods
      return []
    }
  },
  methods: {
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
    },
    foodDec ($event) {
      this.stepperChange($event, -1)
    },
    foodAdd ($event) {
      this.stepperChange($event)
    },
    changeImgPos () {
      console.log('123213')
      this.$emit('dosomenthing')
    }
  }
}
</script>

<style scoped>
.shoperRecommend-word-warpper {
  /* height: 30px; */
  /* line-height: 30px; */
  width: 100%;
  /* box-sizing: border-box; */
  font-size: 14px;
  margin-left: 10px;
  /* font-weight: 600; */
}
.shoperRecommend-word {
  display: inline-block;
  /* height: 30px; */
  /* line-height: 30px; */
}
.shoperRecommend-tip {
  display: inline-block;
  position: relative;
  left: 50px;
  height: 30px;
  line-height: 30px;
  font-size: 6px;
  color: rgb(147, 153, 159, 0.5);
}
.shoperRecommend-img-warrper {
  width: 100vw;
  overflow: hidden;
  /* height: 170px; */
  margin-left: 10px;
  box-sizing: border-box;
}
.shoperRecommend-img-ul {
  /* width: 450px; */
}
.shoperRecommend-img-item {
  display: inline-block;
  width: 100px;
  /* height: 170px; */
  padding: 0px 10px 10px 0px;
}
/* .shoperRecommend-img {
  height: 100px;
  width: 100px;
  background-color: antiquewhite;
  border-radius: 10px;
} */
.shoperRecommend-desc {
  width: 100px;
  height: 70px;
  box-sizing: border-box;
}

.shoperRecommend-desc-title {
  width: 100%;
  height: 10px;
  line-height: 10px;
  padding: 5px;
  font-size: 12px;
  font-weight: 700;
  color: rgb(7, 17, 27);
}
.shoperRecommend-desc-monthseller {
  display: block;
  width: 100%;
  height: 10px;
  line-height: 10px;
  padding: 5px;
  font-size: 8px;
}
.shoperRecommend-desc-newprice {
  width: 100%;
  height: 15px;
  line-height: 15px;
  margin: 0 5px;
  font-size: 14px;
  font-weight: 500;
  color: red;
}
.shoperRecommend-desc-doller1 {
  font-size: 8px;
  color: red;
}

.shoperRecommend-desc-oldprice {
  font-size: 8px;
  color: rgb(147, 153, 159);
  text-decoration-line: line-through;
}
.cartcontrolImg {
  position: absolute;
}
</style>
<style lang="scss" scoped>
.shoperRecommend-img-item {
  /deep/ img {
    border-radius: 5px;
    // height: 100px;
  }
}
</style>
