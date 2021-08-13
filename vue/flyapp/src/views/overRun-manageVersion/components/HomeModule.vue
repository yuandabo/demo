<template>
  <div class="home-module-wrap">
    <div class="app-divider">
      <span>{{ title }}</span>
    </div>
    <div :class="module ? 'module-content' : ''" class="module-box">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
@Component({
  name: 'ModuleTitle'
})
export default class extends Vue {
  @Prop({ default: '' }) private title!: string
  @Prop({ default: true }) private module?: boolean
}
</script>
<style lang="scss">
.home-module-wrap {
  padding: 18px 10px 10px;
  .app-divider{
    display: table;
    white-space: nowrap;
    text-align: center;
    background: 0 0;
    font-weight: 500;
    width: 50%;
    margin: 16px auto;
    span {
      padding: 0 20px;
      font-size: 15px;
      color: rgba(250, 252, 252, 1);
      font-weight: 600;
    }
    &:before {
      content: "";
      display: table-cell;
      // position: relative;
      top: 50%;
      width: 50%;
      border-top: 2px solid rgba(250, 252, 252, 0.3);
      transform: translateY(50%);
    }
    &:after {
      content: "";
      display: table-cell;
      // position: relative;
      top: 50%;
      width: 50%;
      border-top: 2px solid rgba(250, 252, 252, 0.3);
      transform: translateY(50%);
    }
  }
  & > .module-content {
    background-color: $module-bg;
  }
  & > .module-box {
    margin-top: 10px;
    border-radius: 9px;
    padding: 18px 10px;
  }
}
</style>
