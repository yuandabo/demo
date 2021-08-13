<!-- > 调用组件：飞行总经历、  < -->
<template>
  <div
    class="experience-items"
    @click="$emit('item-click')"
    :style="{ cursor: isPointer ? 'pointer' : 'none', background: itemsBackground  }"
  >
    <el-image v-if="iconUrl" :src="iconUrl" fit="cover" class="icon">
      <div slot="placeholder" class="image-slot" style="border-radius: 0" />
      <div slot="error" class="image-slot" style="border-radius: 0">加载失败</div>
    </el-image>
    <div class="content" :style="{ textAlign: align, width: contentWidth }">
      <div class="title" :style="{ opacity: titleOpacity }">{{ title }}</div>
      <span class="value" :style="{ fontWeight: valueFontWeihgt }">
        <span>{{ value.toString() }}</span>
        <span class="unit">{{ unit }}</span>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Image } from 'element-ui'
@Component({
  name: 'ExperienceItems',
  components: {
    [Image.name]: Image
  }
})
export default class extends Vue {
  @Prop({ default: '', required: false }) private iconUrl!: string
  @Prop({ default: '', required: true }) private title!: string
  @Prop({ default: '', required: true }) private value!: string
  @Prop({ default: '' }) private unit!: string
  @Prop({ default: 'left' }) private align!: string
  @Prop({ default: 600 }) private valueFontWeihgt!: number
  @Prop({ default: '160px' }) private contentWidth!: string
  @Prop({ default: false }) private isPointer!: boolean
  @Prop({ default: 'rgba(0, 0, 0, 0.15)' }) private itemsBackground!:string
  @Prop({ default: 1 }) private titleOpacity!:number
}
</script>
<style lang="scss" scoped>
.experience-items {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 75px;
  width: 226px;
  border-radius: 9px;
  &:last-child {
    margin-right: 0;
  }
  .icon {
    flex: 0 0 66px;
    margin: 6px 0 5px 0;
    height: 64px;
    width: 66px;
  }
  .content {
    display: flex;
    flex-direction: column;
    align-content: center;
    justify-content: center;
    height: 55px;
    white-space: nowrap;
    padding: 15px 4px 12px 4px;
    overflow: hidden;
    letter-spacing: 1px;
    .title {
      // width: 105px;
      height: 20px;
      font-size: 14px;
      font-weight: 400;
      color: #FFFFFF;
      line-height: 20px;
      letter-spacing: 1px;
    }
    .value {
      margin-top: 3px;
      // width: 79px;
      height: 25px;
      font-size: 18px;
      font-weight: bold;
      color: #FFFFFF;
      line-height: 25px;
      letter-spacing: 1px;
    }
    .unit {
      // font-size: 14px;
    }
  }
}
</style>
