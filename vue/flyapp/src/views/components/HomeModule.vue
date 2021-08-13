<template>
  <div class="home-module-wrap">
    <div
      class="title"
      style="display: flex;align-items: center;"
      v-if="dateShow">
      <div>
        <div class="title-word">{{ title }}</div>
        <div class="title-date">{{ moduleDate }}</div>
      </div>
    </div>
    <div class="title" v-else>
      <span>{{ title }}</span>
      <span v-if="inlineDateShow" class="title-date">{{moduleDate}}</span>
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
  name: 'ModuleTitle'
})
export default class extends Vue {
  @Prop({ default: '' }) private title!: string
  @Prop({ default: true }) private module?: boolean
  @Prop() dateForm!: Time
  @Prop({ default: false }) dateShow!: boolean
  @Prop({ default: false }) inlineDateShow! :boolean

  private get moduleDate () {
    const { startTime, endTime } = this.dateForm
    if (startTime && endTime) {
      return `${parseTime(startTime, '{y}/{m}/{d}')}-${parseTime(
        endTime,
        '{y}/{m}/{d}'
      )}`
    }
    return ''
  }
}
</script>
<style lang="scss" scoped>
.home-module-wrap {
  padding: 15px 10px 0 10px;
  .title {
    // width: 75px;
    height: 20px;
    font-size: 14px;
    font-weight: bold;
    color: #ffffff;
    line-height: 20px;
    letter-spacing: 1px;
    &::before {
      margin: 0 12px 0 17px;
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
      margin-right: 7px;
      padding: 5px 0;
      letter-spacing: 1px;
    }
    .title-date {
      height: 16px;
      line-height: 16px;
      font-size: 12px;
      opacity: 0.5;
    }
  }
  & > .module-box {
    min-height: 88px;
    // margin-top: 10px;
    border-radius: 9px;
    // padding: 18px 10px;
  }
  & > .module-content {
    margin: 16px 10px 0 10px;
    padding: 18px 20px;
    background-color: #314763;
  }
}
</style>
