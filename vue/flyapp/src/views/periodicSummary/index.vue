<!-- 周期汇总 -->
<template>
  <div class="flight-preparation-page">
    <Nav :content="$t(`title.${title}`)"
         @leftIcon-click="$router.go(-1)" />
    <MyScroll class="content-box"
              :probeType="2"
              :click="true"
              :dataList="dataList"
              :pullup="true"
              @scrollToEnd="pullup"
              ref="scroll">
      <div>
        <DataChoose class="date-choose"
                    :center="'left'"
                    :tagsList="dateTagsList"
                    :title="'日期：'"
                    @active-change="dateActiveChange"></DataChoose>
        <Divider :margin="'0'"></Divider>
        <component v-for="module in componentList"
                   :key="module.moduleId"
                   :is="COMPONENTLIST[module.moduleId]"
                   :date-form="form"
                   :module="module"
                   :closeFn="close"
                   @load="(fn) => load = fn"
                   @refresh-scroll="refreshScroll"></component>
        <div class="load">
          <i :class="loading ? 'el-icon-loading' : 'el-icon-refresh-right'" />{{finishing ? '已经到底了' : '加载更多'}}
        </div>
      </div>
    </MyScroll>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import LandKeyQuota from './LandKeyQuota.vue'
import DataChoose, { Tag } from '@/components/Choose/index.vue'
import TypicalOverrunEvent from './TypicalOverrunEvent.vue'
import FlightExperience from './FlightExperience.vue'
import TotalTable from './TotalTable.vue'
import Divider from '@/components/Divider/index.vue'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { APP_MODULE_INFO_ITEM, Time } from '@/utils/types'
import { MODULEINFO } from '@/dict/periodic-summary'
import MyScroll from '@/components/MyScroll/index.vue'
import Nav from '@/components/Nav/index.vue'
type ScrollEmit = {
  prop: string
  collapseStatus: string[]
}
@Component({
  name: 'periodicSummary', // 资质数据
  components: {
    LandKeyQuota,
    TypicalOverrunEvent,
    FlightExperience,
    DataChoose,
    TotalTable,
    Divider,
    MyScroll,
    Nav
  }
})
export default class extends Vue {
  /** scoll 加载逻辑
   */
  load: unknown
  private loading = false
  private finishing = false
  private tableList = []
  private collapseStatus = []
  private get dataList () {
    return {
      componentList: this.componentList,
      tableList: this.tableList,
      typical: this.collapseStatus
    }
  }
  /**
   */

  private form: Time = {
    startTime: null,
    endTime: null
  }

  /**
   * @description: 循环组件数据
   */
  private resComponents: APP_MODULE_INFO_ITEM[] = []

  private get componentList (): APP_MODULE_INFO_ITEM[] {
    const set = new Set(Object.keys(this.COMPONENTLIST))
    return this.resComponents.filter((x) => set.has(x.moduleId))
  }

  private get COMPONENTLIST () {
    return MODULEINFO()
  }

  /**
   * 选择框数据
   */
  private dateTagsList: Tag[] = []

  private get moduleId () {
    return this.$route.params.moduleId
  }

  private get title () {
    return (this.$route.meta as any).title
  }

  private dateActiveChange (data: Tag): void {
    this.form.startTime = data.startTime as number
    this.form.endTime = data.endTime as number
  }

  private mounted (): void {
    this.getTimeList()
    this.getModuleInfo()
  }

  private getTimeList () {
    appPost(HOME.INIT, { moduleId: this.moduleId })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('periodicSummary-form', res)
        this.dateTagsList = res.date
      })
  }

  private getModuleInfo () {
    this.loading = true
    appPost(HOME.MODULE_INFO, {
      moduleId: this.moduleId
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('periodicSummary-moduleinfo', res)
        const list: APP_MODULE_INFO_ITEM[] = res as APP_MODULE_INFO_ITEM[]
        this.resComponents = list
      })
      .finally(() => {
        this.loading = false
      })
  }

  private pulldown () {
    this.getModuleInfo()
  }

  private pullup () {
    if (this.finishing) return
    this.loading = true
    if (typeof this.load === 'function') this.load()
  }

  private close (val: boolean, list: any) {
    this.loading = false
    this.finishing = val
    this.tableList = list
  }

  private refreshScroll (val: ScrollEmit) {
    (this as any)[val.prop] = val[val.prop as keyof ScrollEmit]
  }
}
</script>

<style lang="scss" scoped>
.flight-preparation-page {
  position: relative;
  height: 100vh;
  width: 100vw;
  // overflow: hidden;
  .content-box {
    height: calc(100vh - 69px);
    overflow: hidden;
  }
  .load {
    padding-bottom: 20px;
    width: 100vw;
    height: 30px;
    line-height: 30px;
    text-align: center;
    font-size: 13px;
    color: #cec9c9;
  }
  .date-choose {
    padding: 20px 40px;
  }
}
</style>
