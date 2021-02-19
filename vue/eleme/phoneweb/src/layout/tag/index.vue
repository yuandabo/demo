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
  <van-tabs v-model="active"
            color="rgb(0, 160, 220)"
            @click="tabsClick">
    <van-tab title="点餐"></van-tab>
    <van-tab title="评价"></van-tab>
    <van-tab title="商家"></van-tab>
  </van-tabs>
</template>

<script>
export default {
  data () {
    return {
      active: 0
    }
  },
  methods: {
    tabsClick (name, title) {
      this.$emit('tabs-click', name)
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.tag {
  display: flex;
  width: 100%;
  height: 40px;
  line-height: 40px;
}
.tag-item {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: rgb(7, 17, 27);
  font-weight: 500;
  box-sizing: border-box;
  border: 1px solid #f0f0f0a1;
}
.gradient-line {
  position: relative;
}
.line::after {
  height: 1px;
  content: "";
  position: absolute;
  background: rgba(7, 17, 27, 0.1);
  bottom: 0;
  left: 0;
  right: 0;
}
@media only screen and (-webkit-min-device-pixel-ratio: 2) {
  .line::after {
    background: -webkit-linear-gradient(top, rgba(7, 17, 27, 0.1), transparent);
    background: linear-gradient(to bottom, rgba(7, 17, 27, 0.1), transparent);
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
.router-link-exact-active {
  color: rgb(240, 20, 20);
  font-weight: 700;
}
a {
  color: rgb(7, 17, 27);
}
.tag:after {
  clear: both;
  content: "";
  display: block;
  height: 0;
}
</style>
