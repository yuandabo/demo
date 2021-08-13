<template>
  <div class="line">
    <span class="line-index" :style="`background-color: ${color || '#2C78D1'};`">{{ index + 1 }}</span>
    <span class="line-content">
      <span class="line-title">{{ data.eventName }}</span>
      <span class="line-length">
        <span class="line-length-checked" :style="{width: `${data.percentage}%`}"></span>
      </span>
    </span>
    <span class="line-value" :style="`color: ${color || 'inherit'};`"><span>{{ `${data.eventNumber}/${data.percentage}%` }}</span></span>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { TopicItem } from '../topic.vue'
@Component({
  name: 'TopLine'
})
export default class extends Vue {
  @Prop() data!: TopicItem
  @Prop() color!: string
  @Prop() index!: number
}
</script>
<style lang="scss" scoped>
.line {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  color: $text-font-color;
  .line-index {
    margin-right: 10px;
    text-align: center;
    width: 20px;
    height: 20px;
    line-height: 20px;
    border-radius: 50%;
    color: #FAFCFC;
  }
  .line-content {
    width: calc(100% - 100px);
    display: block;
    .line-title {
      font-size: 14px;
      margin-bottom: 4px;
      display: block;
      color: #DADCE0;
    }
    .line-length {
      display: block;
      height: 12px;
      width: 100%;
      background-color: #BCBFBF;
      border-radius: 6px;
      position: relative;
      overflow: hidden;
      .line-length-checked {
        position: absolute;
        height: 12px;
        background-color: #26E0DD;
        border-radius: 6px;
        transition: .5s;
      }
    }
  }
  .line-value {
    display: flex;
    justify-content: center;
    width: 73px;
    margin-left: 3px;
    padding-top: 19px;
    font-weight: Bold;
    font-size: 13px;
    word-break: break-all;
  }
}
</style>
