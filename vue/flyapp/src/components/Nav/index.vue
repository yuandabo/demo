<template>
  <div class="nav-warp">
    <div class="app-icon"></div>
    <transition name="fade">
      <div class="nav">
        <div class="nav-left" @click="$emit('leftIcon-click')">
          <i v-if="showLeftIcon" class="el-icon-arrow-left" style="font-size: 16px; font-weight: bold"></i>
        </div>
        <div class="nav-content multiple-line">
          {{ content }}
        </div>
        <div class="nav-right"></div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
@Component({
  name: 'ModuleTitle'
})
export default class extends Vue {
  @Prop({ default: 'content' }) content!: string
  @Prop({ default: true }) showLeftIcon!: false
}
</script>

<style lang="scss" scoped>
.nav-warp {
  height: 69px;
  background-color: rgb(27,56,91);
  overflow: hidden;
  .app-icon {
    height: 20px;
  }
}
.nav {
  position: relative;
  display: -webkit-flex;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 49px;
  .nav-left{
    // height: 69px;
    position: absolute;
    top: 0px;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    padding: 0 20px;
    font-size: 14px;
    // cursor: pointer;
  }
  .nav-content {
    max-width: 60%;
    margin: 0 auto;
    color: #ffffff;
    font-weight: 700;
    font-size: 20px;
    letter-spacing: 1px;
  }
  .nav-right {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    display: -webkit-box;
    display: -webkit-flex;
    display: flex;
    -webkit-box-align: center;
    -webkit-align-items: center;
    align-items: center;
    padding: 0 16px;
    font-size: 14px;
    cursor: pointer;
  }
}
</style>
