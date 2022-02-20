<template>
  <div ref="div"
       class="ratings">
    <div class="ratings-content">
      <div class="content-top">
        <div class="content-left">
          <h1 class="score">{{ seller.score }}</h1>
          <div class="title">综合评分</div>
          <div class="rank">高于周围商家{{ seller.rankRate }}</div>
        </div>

        <div class="content-right">
          <div class="score-wrapper">
            <span class="score-wrapper-title">服务态度</span>
            <star :size="36"
                  :score="seller.serviceScore"
                  class="star" />
            <span class="score-wrapper-score">{{ seller.serviceScore }}</span>
          </div>
          <div class="score-wrapper">
            <span class="score-wrapper-title">商品评分</span>
            <star :size="36"
                  :score="seller.foodScore"
                  class="star" />
            <span class="score-wrapper-score">{{ seller.foodScore }}</span>
          </div>
          <div class="delivery-wrapper">
            <span class="delivery-wrapper-title">送达时间</span>
            <span class="delivery">{{ seller.deliveryTime }}分钟</span>
          </div>
        </div>
      </div>
      <div class="bottom-border" />
      <div>
        <div class="content">
          <div class="content-bottom">
            <!-- <div class="bottom-border"></div> -->
            <div class="bottom-ratings">
              <div class="bottom-ratings-all line gradient-line">
                <span class="ratings-one"
                      @click="type='0'">全部{{ allcontents }}</span>
                <span class="ratings-two"
                      @click="type='1'">满意{{ wellcontents.wellnum }}</span>
                <span class="ratings-three"
                      @click="type='2'">一般{{ commoncontents.commonnum }}</span>
              </div>
              <div class="select-ratings">
                <van-checkbox v-model="checked">只看有内容的评价</van-checkbox>
              </div>
            </div>
          </div>
          <yb-scroll class="rating-text">
            <ul class="relative">
              <li v-for="(item,index) in computedRatings"
                  :key="index"
                  class="rating-text-li gradient-line line">
                <div class="rating-text-li-left">
                  <img class="rating-text-li-left-avatar"
                       :src="item.avatar"
                       width="28"
                       height="28">
                </div>
                <div class="rating-text-li-right">
                  <div class="rating-text-li-right-name">{{ item.username }}</div>
                  <star :size="24"
                        :score="item.score"
                        class="rating-text-li-right-star" />
                  <div class="rating-text-li-right-text">{{ item.text }}</div>
                  <div class="rating-text-li-right-time">{{ item.rateTime }}</div>
                </div>
              </li>
            </ul>
          </yb-scroll>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import star from '@/components/star/index.vue'
import Scroll from '@/components/scroll/index.vue'

// import betterScroll from 'better-scroll'
import { Checkbox } from 'vant'
import {defineComponent} from 'vue'
import { useStore } from '@/pinia/index.js'
import { storeToRefs } from 'pinia'
export default defineComponent({
  name: 'ratings',
  setup() {
    const store = useStore()
    const { seller } = storeToRefs(store)
    return {
      seller
    }
  },
  components: {
    star,
    [Checkbox.name]: Checkbox,
    'yb-scroll': Scroll
  },
  props: {
  },
  data () {
    return {
      ratings: [
        { avatar: 'img/kobe.png', username: 'yuandabo', score: 0, text: '非常不好', rateTime: '20200829' },
        { avatar: 'img/kobe.png', username: 'yuandabo', score: 5, text: '非常好', rateTime: '20200829' },
        { avatar: 'img/kobe.png', username: 'yuandabo', score: 3, text: '一般般', rateTime: '20200829' }
      ],
      onlyhascontents: false,
      type: '0',
      checked: false
    }
  },
  computed: {
    /**
     * @description: 默认 全部  1 满意 2 一般 3 有内容
     * @param {*}
     * @return {*}
     */
    computedRatings () {
      let arr = []
      if (this.type === '0') {
        arr = JSON.parse(JSON.stringify(this.ratings))
      }
      if (this.type === '1') {
        arr = JSON.parse(JSON.stringify(this.wellcontents().wellArr))
      }
      if (this.type === '2') {
        arr = JSON.parse(JSON.stringify(this.commoncontents().commonArr))
      }
      if (this.checked) {
        arr = JSON.parse(JSON.stringify(this.changetohascontents().constantsArr))
      }
      return arr
    },
    allcontents () {
      return this.ratings.length
    }

  },
  mounted () {
  },
  methods: {
    /**
     * @description:  0 全部 1
     * @param {*}
     * @return {*}
     */
    changeRatings () { },
    // _innitScroll () {
    //   this.ratingsScroll = new betterScroll(this.$refs.div, { click: true, probeType: 3 })
    // },
    // 满意
    wellcontents () {
      let [wellnum, wellArr] = [0, []]
      this.ratings.forEach((item) => {
        if (item.score >= 3) {
          wellArr.push(item)
          wellnum++
        }
      })
      return {
        wellArr,
        wellnum
      }
    },
    // 一般
    commoncontents () {
      let [commonnum, commonArr] = [0, []]
      this.ratings.forEach((item) => {
        if (item.score < 3) {
          commonArr.push(item)
          commonnum++
        }
      })
      return { commonnum, commonArr }
    },
    // 有内容
    changetohascontents () {
      let [constants, constantsArr, ratings] = [0, [], []]
      if (this.type === '0') {
        ratings = this.ratings
      }
      if (this.type === '1') {
        ratings = this.wellcontents().wellArr
      }
      if (this.type === '2') {
        ratings = this.commoncontents().commonArr
      }
      ratings.forEach((item) => {
        if (item.text !== '') {
          constantsArr.push(item)
          constants++
        }
      })
      return { constants, constantsArr }
    }
  }
})
</script>

<style lang="scss" scoped>
.ratings {
  /* position: absolute; */
  /* top: 174px; */
  /* bottom: 0; */
  /* left: 0; */
  width: 100%;
  background: #fff;
  overflow: hidden;
}
.content-top {
  display: flex;
  padding: 18px 0;
  font-weight: 500;
}
.content-left {
  flex: 0 0 137px;
  padding: 6px 0;
  width: 137px;
  border-right: 1px solid rgba(7, 17, 27, 0.1);
  text-align: center;
}
.content-right {
  flex: 1;
  padding: 6px 0 6px 24px;
}
.score {
  margin-bottom: 6px;
  line-height: 28px;
  font-size: 24px;
  color: rgb(255, 153, 0);
}
.title {
  margin-bottom: 8px;
  line-height: 12px;
  font-size: 12px;
  color: rgb(147, 153, 159);
}
.rank {
  line-height: 10px;
  font-size: 10px;
  color: rgb(147, 157, 159);
}
.score-wrapper {
  margin-bottom: 8px;
  font-size: 0;
}
.score-wrapper-title {
  display: inline-block;
  vertical-align: text-top;
  line-height: 18px;
  font-size: 12px;
  color: rgb(7, 17, 27);
}
.star {
  display: inline-block;
  margin: 0 12px;
  vertical-align: text-top;
}
.score-wrapper-score {
  display: inline-block;
  vertical-align: text-top;
  line-height: 18px;
  font-size: 12px;
  color: rgb(255, 153, 0);
}
.delivery-wrapper {
  font-size: 0px;
  line-height: 18px;
}
.delivery-wrapper-title {
  line-height: 18px;
  font-size: 12px;
  color: rgb(7, 17, 27);
}
.delivery {
  margin-left: 12px;
  font-size: 12px;
  color: rgb(147, 153, 159);
}
.bottom-border {
  width: 100%;
  height: 16px;
  background-color: rgba(7, 17, 27, 0.1);
  border-top: 1px solid rgba(7, 17, 27, 0.1);
  border-bottom: 1px solid rgba(7, 17, 27, 0.1);
}
.bottom-ratings {
  width: 100%;
  height: 100px;
}
.bottom-ratings-all span {
  display: inline-block;
  line-height: 30px;
  border: 1px solid rgba(7, 17, 27, 0.1);
  padding: 0 20px;
  margin-right: 10px;
}
.bottom-ratings-all {
  padding: 10px 18px;
  font-size: 10px;
  line-height: 10px;
  margin: 0 auto;
  // width: 80%;
}
.select-ratings {
  padding: 10px 18px;
  width: 100%;
  // height: 40px;
  border-bottom: 1px solid rgba(7, 17, 27, 0.1);
}
// .select-ratings-span {
//   display: inline-block;
//   width: 100%;
//   text-align: center;
//   line-height: 18px;
//   height: 18px;
//   padding: 10px 18px;
//   color: rgb(147, 157, 159);
//   font-size: 12px;
// }
.rating-text {
  width: 100%;
  // height: 400px;
  // overflow: hidden;
}
.rating-text-li {
  display: flex;
  margin: 18px;
  height: 69px;
}
.rating-text-li-left {
  flex: 0 0 28px;
}
.rating-text-li-right {
  flex: 1;
  margin-left: 12px;
  position: relative;
}
.rating-text-li-left-avatar {
  border-radius: 50%;
}
.rating-text-li-right-name {
  width: 100%;
  font-size: 10px;
  line-height: 10px;
  padding-bottom: 4px;
}
.rating-text-li-right-star {
  width: 100%;
  height: 12px;
  margin-right: 6px;
  margin-left: 0;
}
.rating-text-li-right-text {
  line-height: 18px;
  font-size: 12px;
  color: rgb(7, 17, 27);
  font-weight: 500;
}
.rating-text-li-right-time {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 10px;
  font-weight: 200;
  color: rgb(147, 157, 159);
  line-height: 12px;
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
.ratings-one {
  background-color: rgb(0, 160, 220);
  border-radius: 10px;
}
.ratings-two {
  border-radius: 10px;
  background-color: rgba(0, 160, 220, 0.2);
}
.ratings-three {
  border-radius: 10px;
}
.hascontents {
  border-radius: 10px;
  background-color: rgba(0, 160, 220, 0.1);
}
</style>
