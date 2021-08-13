<template>
  <div class="experience-items">
    <el-image :src="icon" fit="cover" class="icon"></el-image>
    <div class="content">
      <div class="title">{{title}}</div>
      <span class="value">{{value.toString() + unit}}</span>
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
  @Prop({ default: '', required: true }) private icon!: string
  @Prop({ default: '', required: true }) private title!: string
  @Prop({ default: '', required: true }) private value!: string
  @Prop({ default: '' }) private unit!: string
}
</script>
<style lang="scss" scoped>
.experience-items {
  background-color: $module-bg;
  border-radius: 0 6px 6px 0;
  display: flex;
  height: 63px;
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
    width: 226px;
    height: 75px;
    margin-left: 7px;
    white-space: nowrap;
    padding: 10px 4px;
    overflow: hidden;
    font-size: $md-font-size;
    letter-spacing: 1px;
    .title {
      color: $sm-title-font-color;
      font-size: 14px;
      height: 20px;
      line-height: 20px;
      opacity: .8;
    }
    .value {
      color: $default-font-color;
      font-size: 18px;
      font-weight: 600;
      line-height: 25px;
    }
  }
}
</style>
