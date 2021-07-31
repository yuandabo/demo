<!-- 典型超限事件 -->
<template>
  <div class="typical-overrun-event">
    <ModuleTitle :title="compon.name">
      <div slot="content" ref="event">
        <template>
          <div class="event-item" v-for="(item, index) in constList" :key="index">{{item}}</div>
          <el-collapse v-model="collapseStatus" class="single-collapse">
            <el-collapse-item name="item">
              <div class="event-item" v-for="(item, index) in collapseList" :key="index">{{item}}</div>
            </el-collapse-item>
          </el-collapse>
          <div class="show-all" v-if="eventList.length > lengthLimit" ref="put">
            <div class="btn" @click="switchAll">
              <i class="reda-icon" :class="isOpen ? 'ascending' : 'descending'"></i>
              <span>{{ isOpen ? '收起' : '查看全部' }}</span>
            </div>
          </div>
        </template>
        <!-- <NoData :loading="loading" v-else></NoData> -->
      </div>
    </ModuleTitle>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import ModuleTitle from './components/HomeModule.vue'
import { Collapse, CollapseItem } from 'element-ui'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { TranslaterPoint } from '@better-scroll/core'
// import NoData from '@/components/NoData/index.vue'
import { APP_MODULE_INFO_ITEM } from '@/utils/types'
@Component({
  name: 'TypicalOverrunEvent',
  components: {
    ModuleTitle,
    // NoData,
    [Collapse.name]: Collapse,
    [CollapseItem.name]: CollapseItem
  }
})
export default class extends Vue {
  @Prop({ default: () => ({}) }) readonly compon!: APP_MODULE_INFO_ITEM // 模块信息
  @Prop({ default: () => ({}) }) readonly pos!: TranslaterPoint
  @Prop({ default: false }) readonly showSticky!: boolean
  @Watch('compon', { deep: true })
  componChange () :void {
    this.getTypicalEvents()
  }

  @Watch('pos', { deep: true })
  poChange ():void {
    if (this.isOpen) {
      const bodyHeight:number = (document.querySelector('body') as HTMLElement).getBoundingClientRect().bottom
      const { bottom: buttonHeight, top: buttonTop } = (this.$refs.put as HTMLElement).getBoundingClientRect()
      const { top: eventTop } = (this.$refs.event as HTMLElement).getBoundingClientRect()
      if (bodyHeight <= buttonTop && bodyHeight <= buttonHeight && !this.showSticky) this.$emit('show-sticky', true)
      if (bodyHeight >= buttonTop && this.showSticky) this.$emit('show-sticky', false)
      if (eventTop >= bodyHeight - 20 && this.showSticky) this.$emit('show-sticky', false)
    }
  }

  // @Watch('showSticky')
  // showStickyChange (val: boolean):void {
  //   if (!val && this.isOpen) this.switchAll()
  // }

  private loading = false
  private lengthLimit = 2

  private collapseStatus: string[] = []

  /** 全部事件 */
  private eventList: string[] = []

  private putChange (val:any) {
    // console.log(val)
  }

  private created ():void {
    this.getTypicalEvents()
  }

  private mounted () {
    this.$emit('switch-all', this.switchAll)
  }

  /** 固定展示条数的内容 */
  private get constList () {
    return this.eventList.slice(0, this.lengthLimit)
  }

  /** 可折叠内容 */
  private get collapseList () {
    if (this.eventList.length > this.lengthLimit) return this.eventList.slice(this.lengthLimit)
    return []
  }

  private get isOpen () {
    return this.collapseStatus.length
  }

  private get noData () {
    return this.eventList.length > 0
  }

  private getTypicalEvents () {
    // this.loading = true
    appPost(HOME.TYPICALOVRRUNEVENTS, { moduleId: this.compon.moduleId })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res:any) => {
        // console.log('TypicalOverrunEvent', res)
        this.eventList = res as string[]
      })
      .finally(() => {
        this.loading = false
      })
  }

  private switchAll () {
    if (this.isOpen) {
      this.collapseStatus = []
    } else {
      this.collapseStatus.push('item')
    }
    this.$emit('refresh-scroll', { collapseStatus: this.collapseStatus, prop: 'collapseStatus' })
  }
}
</script>
<style lang="scss" scoped>
.typical-overrun-event {
  .event-item {
    font-weight: bold;
    line-height: 23px;
    overflow: hidden;
    transition: all .5s ease-in-out;
    color: #C7CBD2;
    font-size: 14px;
    &:not(:first-child) {
      border-top: 1px solid $default-line-color;
      padding-top: 15px;
      margin-top: 15px;
    }
  }
  .el-collapse {
    .event-item {
      border-top: 1px solid $default-line-color;
      padding-top: 15px;
      margin-top: 15px;
    }
  }
  .show-all {
    text-align: center;
    margin-top: 15px;
    .btn {
      // cursor: pointer;
      display: inline-block;
      width: 100px;
      height: 30px;
      line-height: 20px;
      border-radius: 18px;
      background-color: $default-btn-bg;
      font-size: 12px;
      color: $default-font-color;
      .reda-icon {
        margin-right: 7px;
      }
    }
  }
  .show-all-stikey{
    text-align: center;
    position: fixed;
    bottom: 0;
    width: 100%;
    left: 0;
  }
}
</style>
