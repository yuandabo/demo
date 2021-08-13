<template>
  <div class="home-page">
    <!-- <button
      v-if="isMock"
      style="positon: absolute; top: 0; right: 0"
      @click="_changeUser">切换用户</button> -->
    <Nav :showLeftIcon="false" :content="'首页'" />
    <!-- 吸顶表头 -->
    <div class="fix-tableHeader" v-show="fixedTableShow">
      <el-table
        @sort-change="tableSortChange"
      >
        <el-table-column
          v-for="item in seriousTable.common.header"
          :key="item.field"
          :prop="item.field"
          :label="item.name"
          header-align="center"
          :align="'center'"
          :min-width="item.minWidth"
          :sortable="'orderContent' in item ? 'custom' : false"
        >
        </el-table-column>
      </el-table>
    </div>
    <!-- body 有上拉加载、下拉刷新功能，管理版与个人版首页有所不同。 -->
    <MyScroll
      class="content-box"
      :probeType="3"
      :click="true"
      :listenScroll="true"
      :dataList="dataList"
      :pulldown="true"
      :pullup="!isManageVersion"
      @pulldown="pulldown"
      @scrollToEnd="pullup"
      @scroll="scroll"
      ref="scroll"
    >
      <div class="scroll-content">
        <div class="refresh" ref="refresh">
          <i :class="loading ? 'el-icon-loading' : 'el-icon-refresh-right'" />{{
            loading ? '加载中' : '松开刷新'
          }}
        </div>
        <!-- 管理版专属筛选框 -->
        <transition name="fade">
          <commonApplication>
            <template v-slot:former>
              <FormManageVersion
                v-if="isManageVersion"
                :pos="pos"
                @date-change="dateChange"
                @office-change="officeChange"
              ></FormManageVersion>
            </template>
          </commonApplication>
        </transition>
        <!-- 下方显示什么根据后台控制 -->
        <transition-group name="fade" tag="p" style="margin: 0">
          <component
            v-for="compon in componentsList"
            :key="compon.moduleId"
            :is="moduleInfoList[compon.moduleId]"
            :compon="compon"
            :pos="pos"
            :showSticky="showSticky"
            :scroll="$refs.scroll"
            :form-date="form"
            @refresh-scroll="refreshScroll"
            @switch-all="(val) => (switchAll = val)"
            @show-sticky="(val) => (showSticky = val)"
          >
          </component>
        </transition-group>
        <!-- 表格 因为需要支持上拉加载 不参与排序 固定在最后一一个组件 -->
        <transition name="fade">
          <seriousOverrunEventRecord
            v-if="seriousTable.show"
            :compon="seriousTable.common"
            :closeFn="close"
            :pos="pos"
            :scroll="$refs.scroll"
            @show-fixedTable="(data) => fixedTableShow = data"
            ref="seriousTable"
          >
          </seriousOverrunEventRecord>
        </transition>
        <div class="load" v-if="!isManageVersion && seriousTable.show">
          <i
            v-if="!finishing"
            :class="loading ? 'el-icon-loading' : 'el-icon-refresh-right'"
          /><span>{{ finishing ? '已经到底了' : '上拉加载更多' }}</span>
        </div>
      </div>
    </MyScroll>
    <transition name="fade">
      <div
        id="show-all-stikey"
        class="show-all show-all-stikey"
        v-if="showSticky"
        @click="stickyClicHandle"
      >
        <div class="btn">
          <i class="reda-icon descending"></i>
          <span>收起</span>
        </div>
      </div>
    </transition>
    <!-- <NoData v-else></NoData> -->
  </div>
</template>

<script lang="ts">
import { Table, TableColumn } from 'element-ui'
import { Component, Vue } from 'vue-property-decorator'
import commonApplication from './CommonApps.vue'
import totalFlightExperience from './FlightExperience.vue'
import typicalOverrunEvents from './TypicalOverrunEvent.vue'
import seriousOverrunEventRecord, { EventDetailItem } from './OverrunDetail.vue'
import FormManageVersion from './Form-manageVersion.vue'
import measurementParameters from './MeasurementParameters-manageVersion.vue'
import keyFlights from './ImportFlight-manageVersion.vue'
import MyScroll from '@/components/MyScroll/index.vue'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { APP_MODULE_INFO_ITEM, Time } from '@/utils/types'
import { showManage, getUserTypeCode, JsTranferIOS, _changeUserType } from '@/env'
import { Tag } from '@/components/Choose/index.vue'
import { FLEET } from '@/components/ChoosePanel/index.vue'
import { TranslaterPoint } from '@better-scroll/core'
import { MODULEIDLIST } from '@/dict/interface'
import { MODULEINFO, MODULEINFOTYPE, HOMENOSORTLIST } from '@/dict/home'
import Nav from '@/components/Nav/index.vue'
import { canvasWM } from '@/plugins/waterMark/index'
// import NoData from '@/components/NoData/index.vue'
type ScrollEmit = {
  prop: string
  collapseStatus: string[]
}
@Component({
  name: 'Home',
  components: {
    commonApplication,
    totalFlightExperience,
    typicalOverrunEvents,
    seriousOverrunEventRecord,
    FormManageVersion,
    measurementParameters,
    keyFlights,
    MyScroll,
    Nav,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn
    // NoData
  }
})
export default class extends Vue {
  public $refs!: {
    seriousTable: seriousOverrunEventRecord,
    refresh: HTMLElement
  }

  private loading = false
  private finishing = false
  private tableList:EventDetailItem[] = []
  private get dataList () {
    return {
      resComponents: this.resComponents,
      typical: this.collapseStatus,
      tableList: this.tableList
    }
  }

  private showSticky = false
  private isManageVersion = false
  private resComponents: APP_MODULE_INFO_ITEM[] = [] // 后端给的菜单数据表格不一定再最后并且可能会有当前未做的菜单，前端根据已有的进行判断
  private collapseStatus = []
  switchAll: unknown

  private get moduleInfoList () {
    return MODULEINFO()
  }

  private get components () {
    const set = new Set(Object.keys(this.moduleInfoList))
    return this.resComponents.filter((x) => set.has(x.moduleId))
  }

  private get componentsList () {
    return this.components.filter((x) => !HOMENOSORTLIST.includes(x.moduleId))
  }

  private form:Time = {
    fleetId: '',
    startTime: null,
    endTime: null
  }

  private officeList = []

  private dateTagsList = []

  private pos: TranslaterPoint = { x: 0, y: 0 }

  private fixedTableShow = false

  // 表格数据
  private seriousTable: { show: boolean; common: APP_MODULE_INFO_ITEM } = {
    show: false,
    common: {
      moduleId: '',
      name: '',
      header: [],
      sort: 0,
      iconUrl: ''
    }
  }

  private get noData () {
    return this.resComponents.length > 0
  }

  private get isMock () {
    return process.env.NODE_ENV === 'development' && !JsTranferIOS.isIPad()
  }

  private mounted (): void {
    this.isManageVersion = showManage()
    // this.getModuleList()
    this.$nextTick(() => {
      this.getWaterWare()
    })
  }

  private activated () {
    this.getModuleList()
  }

  private getWaterWare () {
    appPost(HOME.BASICSINIT, {
    }).then((res) => {
      canvasWM({
        container: document.querySelector('.app') as HTMLElement,
        content: `${res.jc}  ${res.name}`
      })
    })
  }

  private getModuleList (type = 'normol') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).$loading.open()
    const userCode = getUserTypeCode()
    const list = MODULEIDLIST()
    appPost(HOME.MODULE_INFO, {
      moduleId: list[userCode as 'MANAGE' | 'PERSONAL'].HOME,
      ...this.form
    })
      .then((res) => {
        // console.log('home', res)
        this.resComponents = res as APP_MODULE_INFO_ITEM[]
        this.seriousTableData()
      })
      .finally(() => {
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any).$loading.close()
          this.loading = false
          if (type === 'refresh') {
            this.$refs.refresh.style.position = 'absolute'
            this.$refs.refresh.style.top = '-40px'
          }
        }, 1000)
      })
  }

  private dateChange (data: Tag): void {
    this.form.startTime = data.startTime
    this.form.endTime = data.endTime
    this.getModuleList()
  }

  private officeChange (data: FLEET) {
    this.form.fleetId = data.officeId || ''
    this.getModuleList()
  }

  // 单独处理表格的数据
  private seriousTableData () {
    const list = this.components
    for (let index = 0, length = list.length; index < length; index++) {
      const item = list[index]
      if (
        this.moduleInfoList[item.moduleId as keyof MODULEINFOTYPE] ===
        'seriousOverrunEventRecord'
      ) {
        this.seriousTable.show = true
        this.seriousTable.common = item
        break
      }
    }
  }

  private pulldown () {
    this.loading = true
    this.$refs.refresh.style.position = 'relative'
    this.$refs.refresh.style.top = '0'
    this.getModuleList('refresh')
  }

  private pullup () {
    if (this.loading || this.finishing) return
    this.loading = true
    this.$refs.seriousTable.load()
  }

  private scroll (pos: TranslaterPoint) {
    this.pos = pos
  }

  private refreshScroll (val: ScrollEmit) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)[val.prop] = val[val.prop as keyof ScrollEmit]
  }

  private stickyClicHandle () {
    this.showSticky = false
    if (typeof this.switchAll === 'function') this.switchAll()
  }

  private close (val: boolean, list: EventDetailItem[]) {
    setTimeout(() => {
      this.loading = false
    }, 200)
    this.finishing = val
    this.tableList = list
  }

  private _changeUser () {
    _changeUserType()
  }

  private tableSortChange ({
    prop,
    order
  }: {
    prop: string
    order: string | null
  }) :void {
    this.$refs.seriousTable.tableSortChange({
      prop,
      order
    })
  }
}
</script>

<style lang="scss" scoped>
.home-page {
  position: relative;
  margin-bottom: 64px;
  min-height: 100vh;
  width: 100vw;
  .fix-tableHeader {
    z-index: 1000;
    position: fixed;
    width: 100%;
    ::v-deep .el-table__empty-block {
      display: none;
    }
  }
  .scroll-content{
    &::after{
      display: block;
      height: 74px;
      width: 100%;
      content: '';
      background-color: transparent;
    }
  }
  .content-box {
    height: calc(100vh - 69px);
    overflow: hidden;
  }
  .refresh {
    width: 100vw;
    height: 40px;
    line-height: 40px;
    position: absolute;
    top: -40px;
    text-align: center;
    font-size: 16px;
  }
  .load {
    width: 100vw;
    height: 30px;
    line-height: 30px;
    text-align: center;
    font-size: 13px;
    color: #cec9c9;
  }
  .show-all {
    text-align: center;
    padding-top: 15px;
    .btn {
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
  .show-all-stikey {
    text-align: center;
    position: fixed;
    bottom: 0;
    width: 100%;
    left: 0;
  }
}
</style>
