<template>
  <div class="home-module-wrap">
    <div class="title" v-if="title">
      <span class="title-word">{{title}}</span>
      <span class="title-date">{{moduleDate}}</span>
    </div>
    <div :class="module ? 'module-content' : ''" class="module-box">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Time } from '@/utils/types'
import { parseTime } from '@/utils'
@Component({
  name: 'PeriodicModule'
})
export default class extends Vue {
  @Prop({ default: '' }) private title!: string
  @Prop({ default: true }) private module?: boolean
  @Prop() dateForm!: Time

  private get moduleDate () {
    const { startTime, endTime } = this.dateForm
    if (startTime && endTime) return `${parseTime(startTime, '{y}/{m}/{d}')}-${parseTime(endTime, '{y}/{m}/{d}')}`
    return ''
  }
}
</script>
<style lang="scss" scoped>
.home-module-wrap {
  padding: 18px 10px 10px;
  & > .title {
    display: flex;
    align-items: center;
    // justify-content: center;
    font-weight: 600;
    font-size: 14px;
    &::before {
      margin: 0 10px;
      content: '';
      display: inline-block;
      width: 4px;
      height: 20px;
      border-radius: 2px;
      background-color: $title-before-bg;
      vertical-align: middle;
    }
    span {
      vertical-align: middle;
    }
    .title-word {
      font-size: 14px;
      font-weight: bold;
      color: #FFFFFF;
      letter-spacing: 1px;
    }
    .title-date {
      margin-left: 7px;
      font-size: 12px;
      font-weight: bold;
      color: #FFFFFF;
      line-height: 17px;
      opacity: .5;
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
