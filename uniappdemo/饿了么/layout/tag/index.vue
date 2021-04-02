<template>
  <!-- <div class="tag gradient-line line">
    <div class="tag-item">
      <router-link to="/goods">请点餐</router-link>
    </div>
    <div class="tag-item">
      <router-link to='/ratings'>评论</router-link>
    </div>
    <div class="tag-item">
      <router-link to='/seller'>商家</router-link>
    </div>
  </div> -->
  <van-tabs class="tab"
            :active="active"
            :color="'#1989fa'"
            @click="tabsClick">
    <van-tab title="点餐" />
    <van-tab title="评价" />
    <van-tab title="商家" />
  </van-tabs>
</template>

<script>
export default {
  props: {
    active: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      // active: 0
    }
  },
  methods: {
    tabsClick (name, title) {
      this.$emit('tabs-click', name)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
		@import '@/assets/index.scss';
.tab {
  display: flex;
  width: 100%;
  height: 40px;
  line-height: 40px;
  /deep/ .tab-active-class {
    color: #1989fa;
    // width: 40px;
    // height: 3px;
    border-radius: 3px;
    // border-bottom: 3px solid #1989fa;
  }
}

/deep/ .van-tab {
  padding: 0 8px;
}
</style>
