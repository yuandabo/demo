<template>
  <div>
    <div class="shoperRecommend-word-warpper">
      <span class="shoperRecommend-word">商家推荐</span>
    </div>

    <div class="shoperRecommend-img-warrper"
         ref="siscroll"
         @click="changeImgPos()">
      <ul class="shoperRecommend-img-ul">
        <li class="shoperRecommend-img-item">
          <div class="shoperRecommend-img">
            <img width="100px"
                 height="100px"
                 src="https://cube.elemecdn.com/d/a5/c034ad58e55d8d7fc08558bbba13ajpeg.jpeg?x-oss-process=image/resize,m_lfit,w_241/watermark,g_se,x_4,y_4,image_YS8xYS82OGRlYzVjYTE0YjU1ZjJlZmFhYmIxMjM4Y2ZkZXBuZy5wbmc_eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8yOA%3D%3D/quality,q_90/format,webp"
                 alt />
          </div>
          <div class="shoperRecommend-desc">
            <h1 class="shoperRecommend-desc-title">蜜汁炸鸡</h1>
            <span class="shoperRecommend-desc-monthseller">月售162</span>
            <div>
              <span class="shoperRecommend-desc-newprice">
                <span class="shoperRecommend-desc-doller1">￥</span>15
              </span>
              <span class="shoperRecommend-desc-oldprice">￥23</span>
            </div>
          </div>
        </li>
        <li class="shoperRecommend-img-item">
          <div class="shoperRecommend-img">
            <img width="100px"
                 height="100px"
                 src="https://cube.elemecdn.com/d/a5/c034ad58e55d8d7fc08558bbba13ajpeg.jpeg?x-oss-process=image/resize,m_lfit,w_241/watermark,g_se,x_4,y_4,image_YS8xYS82OGRlYzVjYTE0YjU1ZjJlZmFhYmIxMjM4Y2ZkZXBuZy5wbmc_eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8yOA%3D%3D/quality,q_90/format,webp"
                 alt />
          </div>
          <div class="shoperRecommend-desc">
            <h1 class="shoperRecommend-desc-title">蜜汁炸鸡</h1>
            <span class="shoperRecommend-desc-monthseller">月售162</span>
            <div>
              <span class="shoperRecommend-desc-newprice">
                <span class="shoperRecommend-desc-doller1">￥</span>15
              </span>
              <span class="shoperRecommend-desc-oldprice">￥23</span>
            </div>
          </div>
        </li>
        <li class="shoperRecommend-img-item">
          <div class="shoperRecommend-img">
            <img width="100px"
                 height="100px"
                 src="https://cube.elemecdn.com/d/a5/c034ad58e55d8d7fc08558bbba13ajpeg.jpeg?x-oss-process=image/resize,m_lfit,w_241/watermark,g_se,x_4,y_4,image_YS8xYS82OGRlYzVjYTE0YjU1ZjJlZmFhYmIxMjM4Y2ZkZXBuZy5wbmc_eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8yOA%3D%3D/quality,q_90/format,webp"
                 alt />
          </div>
          <div class="shoperRecommend-desc">
            <h1 class="shoperRecommend-desc-title">蜜汁炸鸡</h1>
            <span class="shoperRecommend-desc-monthseller">月售162</span>
            <div>
              <span class="shoperRecommend-desc-newprice">
                <span class="shoperRecommend-desc-doller1">￥</span>15
              </span>
              <span class="shoperRecommend-desc-oldprice">￥23</span>
            </div>
          </div>
        </li>
        <li class="shoperRecommend-img-item">
          <div class="shoperRecommend-img">
            <img width="100px"
                 height="100px"
                 src="https://cube.elemecdn.com/d/a5/c034ad58e55d8d7fc08558bbba13ajpeg.jpeg?x-oss-process=image/resize,m_lfit,w_241/watermark,g_se,x_4,y_4,image_YS8xYS82OGRlYzVjYTE0YjU1ZjJlZmFhYmIxMjM4Y2ZkZXBuZy5wbmc_eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF8yOA%3D%3D/quality,q_90/format,webp"
                 alt />
          </div>
          <div class="shoperRecommend-desc">
            <h1 class="shoperRecommend-desc-title">蜜汁炸鸡</h1>
            <span class="shoperRecommend-desc-monthseller">月售162</span>
            <div>
              <span class="shoperRecommend-desc-newprice">
                <span class="shoperRecommend-desc-doller1">￥</span>15
              </span>
              <span class="shoperRecommend-desc-oldprice">￥23</span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

import betterScroll from 'better-scroll'
import cartcontrol from '@/components/cartcontrol'
export default {
  props: {
    food: {
      type: Object
    }
  },
  mounted () {
    this.initImgScroll()
  },
  methods: {

    initImgScroll () {

      let imgScroll = new betterScroll(this.$refs.siscroll, {
        startX: 0,
        click: true,
        scrollX: true,
        scrollY: false,
        eventPassthrough: 'vertical',
        scroll: true
      })
    },
    changeImgPos () {
      console.log('123213')
      this.$emit('dosomenthing')
    }
  }
  // components:{
  //     cartcontrol
  // }
}
</script>


<style scoped>
.shoperRecommend-word-warpper {
  height: 30px;
  line-height: 30px;
  width: 100%;
  box-sizing: border-box;
  font-size: 14px;
  margin-left: 10px;
  font-weight: 600;
}
.shoperRecommend-word {
  display: inline-block;
  height: 30px;
  line-height: 30px;
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
  height: 170px;
  margin-left: 10px;
  box-sizing: border-box;
}
.shoperRecommend-img-ul {
  width: 450px;
}
.shoperRecommend-img-item {
  display: inline-block;
  width: 100px;
  height: 170px;
  margin: 0px 10px 10px 0px;
}
.shoperRecommend-img {
  height: 100px;
  width: 100px;
  background-color: antiquewhite;
}
.shoperRecommend-desc {
  width: 100px;
  height: 70px;
  box-sizing: border-box;
}

.shoperRecommend-desc-title {
  width: 100%;
  height: 10px;
  line-height: 10px;
  margin: 10px;
  font-size: 12px;
  font-weight: 700;
  color: rgb(7, 17, 27);
}
.shoperRecommend-desc-monthseller {
  display: block;
  width: 100%;
  height: 10px;
  line-height: 10px;
  margin: 10px;
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