<!-- 近三个月严重超限事件明细 -->
<template>
  <div>
    <Nav :content="$t(`title.${title}`)"
         @leftIcon-click="$router.go(-1)" />
    <MyScroll class="content-box"
              :probeType="2"
              :click="true"
              :dataList="tableList"
              :pulldown="true"
              :pullup="true"
              @pulldown="pulldown"
              @scrollToEnd="pullup"
              ref="scroll">
      <div class="overrun-detail-page"
           ref="tablewarp">
        <div class="refresh"
             ref="refresh">
          <i :class="loading ? 'el-icon-loading' : 'el-icon-refresh-right'" />{{
            loading ? '加载中' : '松开刷新'
          }}
        </div>
        <el-table :data="tableList"
                  @row-click="rowClickHandle"
                  @sort-change="tableSortChange">
          <el-table-column v-for="item in tableColumnList"
                           :key="item.field"
                           :prop="item.field"
                           :label="item.name"
                           header-align="center"
                           :align="'center'"
                           :min-width="item.minWidth"
                           :sortable="'orderContent' in item ? 'custom' : false" />
        </el-table>
        <div class="load">
          <i :class="loading ? 'el-icon-loading' : 'el-icon-refresh-right'" /><span>{{ finishing ? '已经到底了' : '上拉加载更多' }}</span>
        </div>
      </div>
    </MyScroll>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Table, TableColumn } from 'element-ui'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { pageToNativeFlightReport } from '@/env/js-tansfer-ios'
import {
  FLIGHTDETAIL,
  INFOTABLEHEAD,
  SORTLISTTYPE
} from '@/utils/types'
import { SORTLIST } from '@/dict/table'
import MyScroll from '@/components/MyScroll/index.vue'
import Nav from '@/components/Nav/index.vue'
// RESPONCE_PAGINATION_TYPE
interface EventDetailItem {
  eventLevelName?: string | number
  eventName?: string
  eventNo?: string
  flightInfo?: number | string
  peakValue?: string
}
@Component({
  name: 'OverrunDetail',
  components: {
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    MyScroll,
    Nav
  }
})
export default class extends Vue {
  private loading = false
  /** 表格页码数据 */
  private pageOptions = {
    pageNum: 1,
    pageSize: 30,
    total: 0
  }

  private get title () {
    return (this.$route.meta as any).title
  }

  private sortOptions = {
    prop: '',
    order: ''
  }

  private get finishing () {
    const { pageNum, pageSize, total } = this.pageOptions
    return pageNum * pageSize >= total
  }

  private tableList: EventDetailItem[] = []

  private get tableColumnList () {
    return [
      { name: '事件编号', field: 'eventNo' },
      { name: '事件名', field: 'eventName' },
      { name: '事件等级', field: 'eventLevelName', orderContent: 'adce.evt_level' },
      { name: '峰值', field: 'peakValue', orderContent: 'adce.peak_value' },
      { name: '航班信息', field: 'flightInfo', orderContent: 'adcf.dep_date' }
    ]
  }

  private get noData () {
    return this.tableList.length > 0
  }

  private get field () {
    return this.$route.params.field
  }

  private created (): void {
    this.getList()
  }

  private getList (type = '') {
    const { order, prop } = this.sortOptions
    this.loading = true
    appPost(HOME.SEVERITYEVENTDETAIL, {
      isAsc: SORTLIST()[order as keyof SORTLISTTYPE],
      orderByColumn: prop,
      pageNum: this.pageOptions.pageNum,
      pageSize: this.pageOptions.pageSize,
      field: this.field
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('近三个月严重超限事件明细', res)
        if (type === 'sort') {
          this.tableList = res.data
        } else {
          this.tableList = this.tableList.concat(res.data)
        }
        this.pageOptions.total = res.totalSize
      })
      .finally(() => {
        setTimeout(() => {
          this.loading = false
          this.close(this.finishing, this.tableList)
          if (type === 'refresh') {
            (this.$refs.refresh as HTMLElement).style.position = 'absolute'
            ; (this.$refs.refresh as any).style.top = '-40px'
          }
        }, 500)
      })
  }

  private load () {
    this.pageOptions.pageNum += 1
    this.getList()
  }

  private tableSortChange ({
    prop,
    order
  }: {
    prop: string
    order: string | null
  }) {
    if (order === null) this.sortOptions.order = 'normal'
    const arr = this.tableColumnList.filter((v: INFOTABLEHEAD) => v.field === prop && 'orderContent' in v)
    if (arr.length > 0) {
      this.pageOptions.pageNum = 1
      this.pageOptions.total = 0
      this.sortOptions.prop = arr[0].orderContent as string
      this.sortOptions.order = order as string
      this.getList('sort')
    }
  }

  private rowClickHandle (row: FLIGHTDETAIL) {
    pageToNativeFlightReport({
      flightId: row.flightId,
      date: row.sortDate,
      aircraftNumber: row.aircraftNumber,
      flightNumber: row.fleetGroup,
      takeOff: row.takeOffTime,
      land: row.arrAptIcao
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }

  private pulldown () {
    this.loading = true
    // ;(this.$refs.scroll as any).scroll.scrollBy(0, -10)
    ; (this.$refs.refresh as any).style.position = 'relative'
    ; (this.$refs.refresh as any).style.top = '0'
    // ;(this.$refs.refresh as any).style.transform = 'translateY(10px)'
    this.refresh('refresh')
  }

  private refresh (type = '') {
    this.pageOptions = {
      pageNum: 1,
      pageSize: 30,
      total: 0
    }
    this.tableList = []
    this.sortOptions = {
      prop: '',
      order: ''
    }
    this.getList(type)
  }

  private pullup () {
    // console.log('pullup')
    if (this.loading || this.finishing) return
    this.loading = true
    this.load()
  }

  private close (val: boolean, list: any) {
    setTimeout(() => {
      this.loading = false
    }, 200)
    this.tableList = list
  }
}
</script>
<style lang="scss" scoped>
.content-box {
  width: 100vw;
  height: calc(100vh - 69px);
  overflow: hidden;
}
.overrun-detail-page {
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
}
</style>
