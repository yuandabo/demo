<template>
  <div class="shoperRecommend">
    <div class="shoperRecommend-word-warpper"
         @click="$router.push('/recommendDetails')">
      <span class="shoperRecommend-word">商家推荐</span>
      <span class="flexdir-align shoperRecommend-icon">
        <van-icon name="arrow" />
      </span>
    </div>
    <ul class="flexdir shoperRecommend-img-ul">
      <li v-for="(item) in foods"
          :key="item.id"
          class="flex-1 shoperRecommend-img-item"
          @click="goToFoodDetails(item)">
        <van-image :src="item.image">
          <template v-slot:loading>
            <van-loading type="spinner"
                         size="20" />
          </template>
        </van-image>
        <div class="shoperRecommend-desc">
          <h1 class="shoperRecommend-desc-title">{{ item.name }}</h1>
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
  </div>
</template>

<script>
// import axios from 'axios'
//  import store from '@/store'
import cartcontrol from '@/components/cartcontrol/index.vue'
// import mixins from '@/mixins/cartcontrol'
import { Image, Icon, Loading } from 'vant'
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'shoperRecommend',
  components: {
    cartcontrol,
    [Icon.name]: Icon,
    [Image.name]: Image,
    [Loading.name]: Loading
  },
  // mixins: [mixins],
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
  computed: {
    // recommendWidth () {
    //   console.log(this.goods)
    //   if (this.goods.length) return `${this.goods[0].foods.length * 110}px`
    //   return 0
    // },
    foods () {
      if (this.goods.length) return this.goods[0].foods.filter((v) => v.isRecomend)
      return []
    }
  },
  mounted () {
  },
  methods: {
    goToFoodDetails (item) {
      this.$router.push({ name: 'foodsDetails', params: { details: item } })
    },
    foodDec ($event) {
      this.store.changeOneData({ id: $event.id, numberSize: -1 })
    },
    foodAdd ($event) {
      console.log('foodAdd', $event)
      this.$emit('foodAdd', $event)
    },
    changeImgPos () {
      console.log('123213')
      this.$emit('dosomenthing')
    }
  }
})
</script>

<style scoped>
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
/* .shoperRecommend-img {
  height: 100px;
  width: 100px;
  background-color: antiquewhite;
  border-radius: 10px;
} */
.shoperRecommend-desc {
  /* width: 100px; */
  /* height: 70px; */
  /* box-sizing: border-box; */
}

.shoperRecommend-desc-title {
  width: 100%;
  /* height: 10px;
  line-height: 10px; */
  padding: 5px;
  font-size: 12px;
  font-weight: 500;
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
  /* height: 15px;
  line-height: 15px; */
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
.shoperRecommend {
  margin: 10px 0;
}
.shoperRecommend-word-warpper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 14px;
  padding: 5px 5px 10px 5px;
  color: #323233;
  font-weight: 500;
  .shoperRecommend-icon {
    padding-right: 10px;
  }
}
.shoperRecommend-img-item {
  display: inline-block;
  /* width: 100px; */
  /* height: 170px; */
  padding: 0px 0px 5px 5px;
  :deep( .van-image img) {
    border-radius: 5px;
    height: 100px;
  }
  &:last-child {
    padding: 0 5px;
  }
}
</style>
