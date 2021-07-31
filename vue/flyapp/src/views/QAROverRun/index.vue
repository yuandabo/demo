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
              @scrollToEnd="pullup">
      <div class="overRun">
        <Bar :module="barModule"></Bar>
        <TotalTable :module="tableModule"
                    :closeFn="close"></TotalTable>
        <div class="load">
          <i v-if="!finishing"
             :class="loading ? 'el-icon-loading' : 'el-icon-refresh-right'" /><span>{{ finishing ? '已经到底了' : '加载更多' }}</span>
        </div>
      </div>
    </MyScroll>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Bar from './Bar.vue'
import TotalTable from './TotalTable.vue'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { APP_MODULE_INFO_ITEM } from '@/utils/types'
import { MODULEINFO } from '@/dict/qarrun'
import myTableMixin from '@/mixins/table-load/index'
import MyScroll from '@/components/MyScroll/index.vue'
import Nav from '@/components/Nav/index.vue'
@Component({
  name: 'QAROverRun',
  components: {
    Bar,
    TotalTable,
    MyScroll,
    Nav
  },
  mixins: [myTableMixin]
})
export default class extends Vue {
  private barModule = {}
  private tableModule = {}
  private get moduleId () {
    return this.$route.params.moduleId
  }

  private get title () {
    return (this.$route.meta as any).title
  }

  private tableList = []
  private get dataList () {
    return {
      resComponents: this.componentList,
      tableList: this.tableList
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
  /**
   */

  private showBar = true
  private showTable = true

  private mounted (): void {
    this.getModuleInfo()
  }

  private getModuleInfo () {
    appPost(HOME.MODULE_INFO, {
      moduleId: this.moduleId
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('QAROverRun', res)
        const list: APP_MODULE_INFO_ITEM[] = res as APP_MODULE_INFO_ITEM[]
        this.resComponents = list
        list.forEach((e) => {
          if (e.moduleId === 'frequencyAndRateOfEventsInRecent13months') {
            this.barModule = e
          }
          if (e.moduleId === 'summaryOfOverrunEventsInRecent13Months') {
            this.tableModule = e
          }
        })
      })
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
