<template>
  <div>
    <scroll ref="div"
            class="wrapper seller"
            :pulldown="true">
      <div class="content">
        <div class="seller-img">
          <image width="100vw"
                 height="90"
                 src="https://cube.elemecdn.com/2/14/7059f0fe8c3eb2c691a595ef7f734png.png?x-oss-process=image/format,webp/resize,w_686">
          </image>
          <div class="img-title">
            品牌故事|欢迎光临
          </div>
          <div class="img-text">
            我们是源自长沙
          </div>
        </div>
        <div class="seller-card">
          <div class="card-title">
            <div class="title-left">
              <div class="title-name">茶颜悦色（仰天湖）</div>
              <div class="title-address">湖南省长沙市天心区</div>
            </div>
            <div class="title-right">
              <van-icon name="phone-o"
                        color="#1989fa"
                        size="40" />
            </div>
          </div>
          <div class="card-photo">
            <image width="80px"
                   height="80px"
                   src="/static/img/jordan.png">
            </image>
            <image width="80px"
                   height="80px"
                   src="/static/img/jordan.png">
            </image>
          </div>
          <div class="card-info">
            <div class="info-name">商家类型</div>
            <div class="info-address">商家品类：奶茶果汁<br>营业时间：10：00-22：30</div>
          </div>
          <van-button plain
                      type="info"
                      size="mini"
                      style="padding:10px"
                      color="#999">查看营业资质</van-button>
        </div>
      </div>
    </scroll>
  </div>
</template>

<script>
import betterScroll from 'better-scroll'
import star from '@/components/star'
export default {
  components: {
    star
  },
  props: {
    seller: {
      type: Object
    }
  },
  watch: {
  },
  mounted () {
  },
  methods: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='scss' scoped>
.seller {
  /* position: absolute;
  top: 174px;
  bottom: 0;
  left: 0; */
  width: 100%;
  overflow: hidden;
  // background: #ffffff;
  .seller-img {
    margin-top: 10px;
    // text-align: center;
    /deep/.van-image {
      display: flex;
      justify-content: center;
    }
    /deep/.van-image__img {
      width: 95vw;
      border-radius: 10px 10px 0 0;
    }
    image {
      height: 90px;
      width: 100vw;
    }
    .img-title {
      box-sizing: border-box;
      background: #ffffff;
      margin: 0 auto;
      width: 95vw;
      padding: 10px 7px;
      color: #000;
      font-weight: 500;
      font-size: 14px;
    }
    .img-text {
      background: #ffffff;
      margin: 0 auto;
      width: 95vw;
      padding: 0 7px 10px 7px;
      box-sizing: border-box;
      font-size: 12px;
      border-radius: 0 0 10px 10px;
    }
  }
  .seller-card {
    box-sizing: border-box;
    padding: 10px 5px;
    background: #ffffff;
    margin: 10px auto;
    width: 95vw;
    border-radius: 10px;
    .card-title {
      display: flex;
      .title-left {
        flex: 5;
        border-right: 1px solid #ddd;
        .title-name {
          font-weight: 500;
          font-size: 14px;
        }
        .title-address {
          font-size: 12px;
        }
      }
      .title-right {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
    .card-photo {
      display: flex;
      overflow-x: auto;
      overflow-y: hidden;
      image {
        width: 80px;
        height: 80px;
      }
    }
    .card-info {
      .info-name {
        font-weight: 500;
        font-size: 14px;
      }
      .info-address {
        font-size: 12px;
      }
    }
  }
}
.overview {
  padding: 18px;
}
.title {
  margin-bottom: 8px;
  line-height: 14px;
  color: rgb(7, 17, 27);
  font-size: 14px;
}
.desc {
  font-size: 0px;
  padding-bottom: 18px;
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
.star {
  display: inline-block;
  margin-right: 12px;
  vertical-align: top;
}
.text {
  display: inline-block;
  vertical-align: top;
  line-height: 18px;
  margin-right: 12px;
  font-size: 10px;
  color: rgb(77, 85, 93);
}
.remark {
  display: flex;
  font-size: 10;
  padding-top: 18px;
}
.block {
  flex: 1;
  text-align: center;
  border-right: 1px solid rgba(7, 17, 27, 0.1);
}
.block:last-child {
  border-right: 0px;
}
.h2 {
  margin-bottom: 4px;
  line-height: 4px;
  font-size: 10px;
  color: rgb(147, 153, 159);
}
.content {
  line-height: 24px;
  font-size: 10px;
  color: rgb(7, 17, 27);
}
.stress {
  font-size: 24px;
}
.split {
  width: 100%;
  height: 16px;
  background-color: rgba(7, 17, 27, 0.1);
  border-top: 1px solid rgba(7, 17, 27, 0.1);
  border-bottom: 1px solid rgba(7, 17, 27, 0.1);
}
.bulletin {
  padding: 18px 18px 0 18px;
}
.content-warpper {
  padding: 0 12px 16px 12px;
}
.bulletin-content {
  line-height: 24px;
  font-size: 12px;
  color: rgb(240, 20, 20);
  margin: 0 6px;
}
.supports-content-item {
  padding: 16px 12px;
  font-size: 0px;
}
.supports-content-icon {
  display: inline-block;
  background-image: url("/static/img/decrease_1@2x.png");
  background-size: 16px 16px;
  background-repeat: no-repeat;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  vertical-align: top;
}
.supports-content-text {
  color: rgb(7, 17, 27);
  line-height: 16px;
  vertical-align: top;
  font-size: 12px;
}
.pics {
  padding: 18px;
}
.pics-title {
  margin-bottom: 12px;
  line-height: 14px;
  color: rgb(7, 17, 27);
  font-size: 14px;
}
.pics-list {
  font-size: 0px;
}
.pic-wrapper {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
}
.pic-item {
  display: inline-block;
  margin-right: 6px;
  width: 120px;
  height: 90px;
}
.pic-item:last-child {
  margin: 0;
}
.info {
  padding: 18px 18px 0 18px;
}
.info-title {
  padding-bottom: 12px;
  line-height: 14px;
  color: rgb(7, 17, 27);
  font-size: 14px;
}
.info-item {
  padding: 16px 12px;
  line-height: 16px;
  font-size: 12px;
  color: rgb(7, 17, 27);
}
</style>
