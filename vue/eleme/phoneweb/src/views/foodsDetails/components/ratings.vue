<!-- 虚拟滚动 item  -->
<template>
  <div class="rating-text-li gradient-line line">
    <div class="rating-text-li-left">
      <img class="rating-text-li-left-avatar"
           :src="source.avatar"
           width="28"
           height="28">
    </div>
    <div class="rating-text-li-right">
      <div class="rating-text-li-right-name">{{ source.username }}</div>
      <star :size="24"
            :score="source.score"
            class="rating-text-li-right-star" />
      <div class="rating-text-li-right-text">{{ source.text }}</div>
      <div class="rating-text-li-right-time">{{ source.rateTime }}</div>
    </div>
  </div>
</template>

<script>
import star from '@/components/star'
export default {
  name: 'ratings-component',
  components: {
    star
  },
  props: {
    source: {
      type: Object,
      require: true,
      default: () => ({})
    }
  },
  data () {
    return {
    }
  },
  computed: {
  },
  created () {
  },
  methods: {
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/color.scss";
@import "@/assets/index.scss";
.food-detail {
  position: relative;
  height: 100vh;
  overflow: auto;
  image {
    width: 100vw;
  }
  /deep/ .van-nav-bar {
    width: 100vw;
    position: fixed;
    background: none;
  }
  .detail-title {
    .title {
      // margin-left: 5px;
    }
    .priceAndControl {
      justify-content: space-between;
    }
    .sellNums {
      font-size: $nolmal-textSize;
    }
  }
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
</style>
