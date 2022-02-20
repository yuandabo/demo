<template>
  <div class="header">
    <!-- <van-search v-model="value"
                placeholder="请输入搜索关键词" /> -->
    <van-nav-bar :border="false">
      <template #right>
        <van-icon name="search"
                  size="18"
                  color="#ffffff"
                  @click="$router.push('/search')" />
      </template>
    </van-nav-bar>
    <div class="content-warpper">
      <div class="avatar">
        <div class="img">
          <van-image class="imgdom"
                     width="80"
                     height="80"
                     :src="seller.avatar">
            <template v-slot:error>
              <van-image width="80"
                         height="80"
                         src="img/jordan.png" />
            </template>
          </van-image>
          <!-- <img class="imgdom"
               width="80"
               height="80"
               v-bind:src="seller.avatar" /> -->
        </div>
        <div class="content">
          <div class="title">
            <van-icon class="brand"
                      :name="getIcon('brand2x')" />
            <span class="name">{{ seller.name }}</span>
          </div>
          <div class="description">{{ seller.description }}</div>
          <div class="description">平均配送时间：{{ seller.deliveryTime }}分钟</div>
          <div v-if="seller.supports"
               class="supports">
            <!-- <span class="icon" /> -->
            <van-icon class="icon"
                      :name="getIcon('decrease_1@2x')" />
            <span class="text">{{ seller.supports[0].description }}</span>
          </div>
          <!-- <div class="supports-count" @click="showDetail">
            <span class="count" v-if="seller.supports">{{seller.supports.length}}个</span>
            <span class="icon-keyboard_arrow_right:before"></span>
          </div>-->
        </div>
      </div>
      <img src="https://cube.elemecdn.com/7/b9/68df600d2b16a206de723f9e81c88png.png?x-oss-process=image/format,webp/resize,w_750"
           class="backgroundImg"
           width="100vw"
           height="200">
    </div>
    <div class="bulletin-wrapper">
      <!-- <span class="bulletin-title" /> -->
      <van-icon class="bulletin-title"
                :name="getIcon('bulletin')" />
      <span class="bulletin-text">{{ seller.bulletin }}</span>
      <span />
    </div>
    <!-- <div class="background">
        <img :src="seller.avatar" alt="">
    </div>-->
    <!-- <transition name="fade">
      <div class="detail" v-show="detailShow">
        <div class="detail-warpper clearfix">
          <div class="detail-main">
            <h1 class="detail-name">{{seller.name}}</h1>
            <div class="star-warpper">
              <star :size="48" :score="seller.score"></star>
            </div>
            <div class="detail-content">
              <div class="content-line"></div>
              <div class="content-text">优惠信息</div>
              <div class="content-line"></div>
            </div>
            <ul class="supports-content" v-if="seller.supports">
              <li v-for="(a,index) in seller.supports" :key="index">
                <span class="supports-content-icon"></span>
                <span class="supports-content-text">{{seller.supports[index].description}}</span>
              </li>
            </ul>
            <div class="detail-content">
              <div class="content-line"></div>
              <div class="content-text">商家公告</div>
              <div class="content-line"></div>
            </div>
            <div class="etail-content-2">{{seller.bulletin}}</div>
          </div>
        </div>
        <div class="detail-close">
          <i class="layui-icon layui-icon-close" style="font-size:40px;" @click="hiddenDetail"></i>
        </div>
      </div>
    </transition>-->
  </div>
</template>

<script>
import { Icon, Image, NavBar} from 'vant'
import { useStore } from '@/pinia/index.js'
import { storeToRefs } from 'pinia'
import {defineComponent} from 'vue'
export default defineComponent({
  components: {
    [Icon.name]: Icon,
    [Image.name]: Image,
    [NavBar.name]: NavBar
  },
  setup() {
    const store = useStore()
    const { seller } = storeToRefs(store)
    return {
      seller
    }
  },
  props: {},
  data () {
    return {
      detailShow: false,
      loading: false
    }
  },
  methods: {
    getIcon (name) {
      return `img/${name}.png`
    },
    showDetail: function () {
      this.detailShow = true
    },
    hiddenDetail: function () {
      this.detailShow = false
    }
  }
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.header {
  color: #fff;
  position: relative;
  // overflow: hidden;
  :deep( .van-image__img) {
    border-radius: 10px;
  }
  :deep( .van-nav-bar) {
    width: 100vw;
    background-color: unset;
    position: absolute;
    z-index: 10;
  }
  :deep(.van-search__content) {
    border-radius: 20px;
  }
  :deep(.van-search .van-cell) {
    padding: 0px 8px 0 0;
  }
}
.content-warpper {
  padding-top: 30px;
  // font-size: 0px;
  position: relative;
  text-align: center;
  .backgroundImg {
    display: block;
    position: absolute;
    top: -20px;
    left: 0;
    // height: 80px;
    width: 100vw;
    z-index: -1;
    background-repeat: no-repeat;
  }
}
.avatar {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
}
.content {
  width: 100%;
  padding-top: 30px;
  display: block;
  font-size: 14px;
  // margin-left: 14px;
  text-align: center;
  background: #ffff;
}
.title {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2px 0px 8px 0px;
}
.brand {
  :deep(.van-icon__image) {
    display: inline-block;
    vertical-align: top;
    width: 30px;
    height: 18px;
    background-size: 30px 18px;
    background-repeat: no-repeat;
    border-radius: 10px;
  }
}
.name {
  margin-left: 6px;
  font-size: 16px;
  line-height: 18px;
  font-weight: 500;
  color: #333333;
}
.description {
  height: 20px;
  line-height: 20px;
  color: #333333;
  padding-bottom: 5px;
}
.img {
  position: relative;
  width: 80px;
  height: 80px;
  display: block;
  /* vertical-align: top; */
  text-align: center;
  border-radius: 2px;
  .imgdom {
    position: absolute;
    bottom: -25px;
    left: 0;
  }
}
.supports .icon {
  :deep(.van-icon__image) {
    display: inline-block;
    vertical-align: top;
    width: 12px;
    height: 12px;
    margin-right: 4px;
    background-size: 12px 12px;
    background-repeat: no-repeat;
  }
}
.supports .text {
  line-height: 12px;
  font-size: 10px;
  vertical-align: top;
  color: #999999;
}
.supports-count {
  position: absolute;
  right: 12px;
  bottom: 18px;
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.2);
  text-align: center;
}
.count {
  font-size: 10px;
}
.icon-keyboard_arrow_right:before {
  font-size: 10px;
}
.bulletin-wrapper {
  height: 28px;
  line-height: 28px;
  padding: 0 22px 0 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #999999;
  background: #fff;
}
.bulletin-title {
  :deep(.van-icon__image) {
    display: inline-block;
    width: 22px;
    height: 12px;
    background-size: 22px 12px;
    background-repeat: no-repeat;
    vertical-align: center;
    // margin-top: 8px;
  }
}
.bulletin-text {
  font-size: 10px;
  margin: 0 4px;
  vertical-align: top;
}
.background img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  filter: blur(10px);
}
.detail {
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #ffffff;
  color: #333333;
}
.detail-warpper {
  min-height: 100%;
  width: 100%;
}
.clearfix {
  display: inline-block;
  zoom: 1;
}
.clearfix:after {
  display: block;
  height: 0px;
  line-height: 0px;
  content: ".";
  clear: both;
  visibility: hidden;
}
.detail-main {
  margin-top: 64px;
  padding-bottom: 64px;
  font-size: 16px;
  line-height: 16px;
}
.detail-close {
  position: relative;
  width: 32px;
  height: 32px;
  margin: -64px auto 0 auto;
  clear: both;
}
.detail-name {
  line-height: 16px;
  font-size: 16px;
  text-align: center;
  color: #333333;
}
.star-warpper {
  margin-top: 18px;
  padding: 2px 0;
  text-align: center;
}
.detail-content {
  display: flex;
  width: 80%;
  margin: 30px auto 24px auto;
}
.content-line {
  flex: 1;
  position: relative;
  top: -6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
.content-text {
  padding: 0 12px;
  font-size: 14px;
  font-weight: 500;
}
.supports-content-icon {
  display: inline-block;
  background-image: url("/img/decrease_1@2x.png");
  background-size: 16px 16px;
  background-repeat: no-repeat;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  vertical-align: top;
}
.supports-content-text {
  color: #333333;
  line-height: 12px;
  vertical-align: top;
}
.supports-content {
  width: 80%;
  margin: 0 auto;
  list-style: none;
  font-size: 12px;
}
.etail-content-2 {
  width: 80%;
  margin: 0 auto;
  font-size: 12px;
  line-height: 24px;
  color: #333333;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
