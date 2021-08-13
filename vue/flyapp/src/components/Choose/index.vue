<template>
  <div
    class="choose"
    :style="{ justifyContent: center, display: display, padding: pad }"
  >
    <span v-if="title">{{ title }}</span>
    <div
      class="tag"
      :style="{ width: tagWidth }"
      :class="computerBGC(tag.active)"
      v-for="tag in filterTagsList"
      :key="tag.active"
      @click="changeActive(tag)"
    >
      {{ tag[nameKey] }}
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator'
export interface Tag {
  active?: string
  name: string
  value?: string
  endTime?: number | null
  startTime?: number | null
  actypeId?: string
  color?: string
}
@Component({
  name: 'Choose'
})
export default class extends Vue {
  @Prop({ default: () => [], required: true }) readonly tagsList!: Array<Tag>
  @Prop({ default: '', required: false }) readonly title: string | undefined
  @Prop({ default: 'center', required: false }) readonly center: string | undefined
  @Prop({ default: '106px', required: false }) readonly tagWidth: string | undefined
  @Prop({ default: '' }) readonly display: string | undefined
  @Prop({ default: '20px 40px' }) readonly pad: string | undefined
  @Prop({ default: 'name' }) nameKey!: string // 按钮显示文字得属性
  @Prop() radioProp!: string // 用于分辨循环时prop
  @Prop({ default: 700 }) fontWeight!: number
  @Prop({ default: '' }) defaultActive!: string

  @Watch('tagsList')
  tagsListChange ():void{
    this.active = ''
  }

  @Watch('defaultActive')
  defaultActiveChange (val:string):void {
    this.active = val
  }

  private active = ''

  private get filterTagsList () {
    let i = 0
    return this.tagsList.map((x) => {
      if (x.active === undefined) {
        x.active = i++ + ''
      }
      return x
    })
  }

  private computerBGC (active: string): string {
    return this.active === active ? 'tag-active' : ''
  }

  private changeActive (tag: Tag): void {
    this.active = tag.active as string
    this.$emit('active-change', tag, this.radioProp)
  }
}
</script>

<style lang="scss" scoped>
.choose {
  display: flex;
  align-items: center;
  .tag {
    background-color: $default-btn-bg;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    line-height: 30px;
    width: 106px;
    margin-right: 10px;
    font-size: $sm-font-size;
    font-weight: 400;
    color: $default-font-color;
    border-radius: 6px;
    box-sizing: border-box;
    white-space: nowrap;
    letter-spacing: 1px;
    // cursor: pointer;
    -webkit-user-select: none; /* Safari */
    -ms-user-select: none; /* IE 10+ and Edge */
    user-select: none; /* Standard syntax */
    transition: .3s;
  }
  .tag-active {
    background-color: $default-btn-selected-bg;
    color: #142928;
    font-weight: 500;
  }
}
</style>
