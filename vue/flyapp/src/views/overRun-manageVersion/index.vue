<template>
  <div>
    <Nav :content="$t(`title.${title}`)"
         @leftIcon-click="$router.go(-1)" />
    <MyScroll class="content-box"
              :probeType="2"
              :click="true"
              :listenScroll="true"
              :dataList="dataList"
              :pullup="true"
              @scrollToEnd="pullup"
              @scroll="scroll">
      <div class="overRun">
        <ChoosePanel :buts="officeList"
                     @clear="panelClear"
                     @select-blur="panelBlur"
                     ref="panel" />
        <Divider :margin="0" />
        <template v-for="compon in componentList">
          <component :is="COMPONENTLIST[compon.moduleId]"
                     :key="compon.moduleId"
                     :module="compon"
                     :fleetForm="form"
                     @refresh-scroll="refreshScroll" />
        </template>
        <TotalTable v-if="showTable"
                    :module="tableModule"
                    :fleetForm="form"
                    :closeFn="close" />
        <div class="load">
          <i v-if="!finishing"
             :class="loading ? 'el-icon-loading' : 'el-icon-refresh-right'" /><span>{{finishing ? '已经到底了' : '加载更多'}}</span>
        </div>
      </div>
    </MyScroll>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Bar from './Bar.vue'
import TotalTable from './TotalTable.vue'
import TypicalOverrunEvent from './TypicalOverrunEvent.vue'
import ChoosePanel, { FLEET } from '@/components/ChoosePanel/index.vue'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { MODULEINFO } from '@/dict/overrun_manage'
import { APP_MODULE_INFO_ITEM } from '@/utils/types'
import Divider from '@/components/Divider/index.vue'
import myTableMixin from '@/mixins/table-load/index'
import MyScroll from '@/components/MyScroll/index.vue'
import Nav from '@/components/Nav/index.vue'
type ScrollEmit = {
  prop: string
  collapseStatus: string[]
}
@Component({
  name: 'OverRun-manageVersion',
  components: {
    Bar,
    TotalTable,
    TypicalOverrunEvent,
    ChoosePanel,
    Divider,
    MyScroll,
    Nav
  },
  mixins: [myTableMixin]
})
export default class extends Vue {
  // private barModule = {}
  private tableModule = {}
  private showBar = true
  private showTable = true
  private collapseStatus: string[] = []

  private get dataList () {
    return {
      resComponents: this.componentList,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tableList: (this as any).tableList,
      collapseStatus: this.collapseStatus
    }
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

  private get moduleId () {
    return this.$route.params.moduleId
  }

  private get title () {
    return (this.$route.meta as any).title
  }
  /**
   */

  private form = {
    fleetId: ''
  }

  private officeList: FLEET[] = []

  private mounted (): void {
    this.getFleetList()
    this.getList()
  }

  private getFleetList () {
    // const userCode = getUserTypeCode()
    // const list = MODULEIDLIST()
    appPost(HOME.INIT, { moduleId: this.moduleId })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        console.log('overRun-manageVersion', res)
        if (res.fleet) {
          this.officeList = [res.fleet]
        } else {
          this.$message('fleet 列表缺失')
        }
      })
  }

  private refreshScroll (val: ScrollEmit) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.collapseStatus = val.collapseStatus as string[]
  }

  private panelClear () {
    this.officeChange({} as FLEET)
  }

  private panelBlur (val: FLEET) {
    this.officeChange(val)
  }

  private officeChange (data: FLEET) {
    this.form.fleetId = data.officeId || ''
  }

  private getList () {
    appPost(HOME.MODULE_INFO, {
      moduleId: this.moduleId
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('MODULE_INFO', res)
        const list: APP_MODULE_INFO_ITEM[] = res as APP_MODULE_INFO_ITEM[]
        this.resComponents = res as APP_MODULE_INFO_ITEM[]
        list.forEach(e => {
          if (e.moduleId === 'summaryOfOverrunEvents') {
            this.tableModule = e
          }
          // if (e.moduleId === 'eventsAndRateOfEvents') {
          //   this.barModule = e
          // }
        })
        // this.seriousTableData()
      })
  }

  private scroll (): void {
    const { panel } = (this.$refs as any)
    if (panel.show) panel.show = false
  }
}
</script>

<style lang="scss" scoped>
.content-box {
  position: relative;
  width: 100vw;
  height: calc(100vh - 69px);
  overflow: hidden;
}
.overRun {
  padding-bottom: 20px;
  .load {
    padding-bottom: 20px;
    width: 100vw;
    height: 30px;
    line-height: 30px;
    text-align: center;
    font-size: 13px;
    color: #cec9c9;
  }
}
</style>
