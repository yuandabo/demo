<!-- 近三个月严重超限事件明细 -->
<template>
  <div class="overrun-detail-page">
    <div class="title">{{ compon.name }}</div>
    <el-table
      ref="table"
      :data="tableList"
      @row-click="rowClickHandle"
      @sort-change="tableSortChange"
    >
      <el-table-column
        v-for="item in tableColumnList"
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
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Table, TableColumn } from 'element-ui'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { pageToNativeFlightReport } from '@/env/js-tansfer-ios'
import {
  APP_MODULE_INFO_ITEM,
  FLIGHTDETAIL,
  INFOTABLEHEAD,
  SORTLISTTYPE
} from '@/utils/types'
import { SORTLIST } from '@/dict/table'
import { TranslaterPoint } from '@better-scroll/core'
// RESPONCE_PAGINATION_TYPE
export interface EventDetailItem {
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
    [TableColumn.name]: TableColumn
  }
})
export default class extends Vue {
  @Prop({ default: () => ({}) }) readonly compon!: APP_MODULE_INFO_ITEM // 模块信息
  @Prop() closeFn!: (a:boolean, b:EventDetailItem[]) => void
  @Prop({ default: () => ({}) }) readonly pos!: TranslaterPoint
  @Prop({ default: null }) readonly scroll!: any
  @Watch('compon', { deep: true })
  componChange () :void {
    this.refresh()
  }

  @Watch('pos', { deep: true })
  poChange ():void {
    const { top } = (this.$refs.table as any).$el.getBoundingClientRect()
    if (top <= 69 && !this.fixedTableShow) {
      this.fixedTableShow = true
      this.$emit('show-fixedTable', this.fixedTableShow)
    }
    if (top > 69 && this.fixedTableShow) {
      this.fixedTableShow = false
      this.$emit('show-fixedTable', this.fixedTableShow)
    }
  }

  private fixedTableShow = false
  private loading = false
  /** 表格页码数据 */
  private pageOptions = {
    pageNum: 1,
    pageSize: 30,
    total: 0
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
    return this.compon.header
  }

  private get noData () {
    return this.tableList.length > 0
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
      pageSize: this.pageOptions.pageSize
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
        this.loading = false
        this.closeFn(this.finishing, this.tableList)
      })
  }

  load ():void {
    if (this.loading || this.finishing) return
    this.pageOptions.pageNum += 1
    this.getList()
  }

  tableSortChange ({
    prop,
    order
  }: {
    prop: string
    order: string | null
  }) :void {
    if (order === null) this.sortOptions.order = 'normal'
    const arr = this.compon.header.filter((v:INFOTABLEHEAD) => v.field === prop && 'orderContent' in v)
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
}
</script>
<style lang="scss" scoped>
.overrun-detail-page {
  min-height: 100px;
  .title {
    // margin: 10px 0;
    text-align: center;
    font-size: $md-font-size;
    color: $default-font-color;
    font-weight: 600;
    padding: 12px;
  }
}
</style>
