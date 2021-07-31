<!-- 航班明细列表 -->
<template>
  <div class="filghtDetail">
    <Nav :content="$t(`title.${title}`)"
         @leftIcon-click="$router.go(-1)" />
    <el-table :height="'100vh'"
              :data="tableList"
              v-loading="loading"
              @row-click="rowClickHandle"
              @sort-change="tableSortChange">
      <el-table-column v-for="item in tableColumnList"
                       :key="item.field"
                       :prop="item.field"
                       :label="item.name"
                       header-align="center"
                       :align="'center'"
                       :min-width="item.minWidth"
                       :sortable="item.sortable">
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Table, TableColumn } from 'element-ui'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { pageToNativeFlightReport } from '@/env/js-tansfer-ios'
import { SORTLIST } from '@/dict/table'
import { SORTLISTTYPE, FLIGHTDETAIL } from '@/utils/types'
import Nav from '@/components/Nav/index.vue'
@Component({
  name: 'FilghtDetail',
  components: {
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    Nav
  }
})
export default class extends Vue {
  private header = [
    { field: 'flightDate', name: '日期', sortable: 'custom' },
    { field: 'flightNumber', name: '航班号', sortable: false },
    { field: 'aircraftNumber', name: '飞机号', sortable: false },
    { field: 'depAptIcao', name: '起飞机场', sortable: false },
    { field: 'arrAptIcao', name: '降落机场', sortable: false },
    { field: 'takeOffTime', name: '起飞时刻', sortable: false },
    { field: 'fleetGroup', name: '机组', sortable: false }
  ]

  private tableList: FLIGHTDETAIL[] = []

  private loading = false
  private pageOptions = {
    pageNum: 1,
    pageSize: 30,
    total: 0
  }

  private get noData () {
    return this.tableList.length > 0
  }

  private get tableColumnList () {
    return this.header
  }

  private get routeParams () {
    return this.$route.params
  }

  private get title () {
    return (this.$route.meta as any).title
  }

  private tableSortChange ({
    prop,
    order
  }: {
    prop: string
    order: string | null
  }) {
    if (order === null) order = 'normal'
    this.getList(prop, order)
  }

  private created (): void {
    this.getList()
  }

  private rowClickHandle (row: FLIGHTDETAIL) {
    pageToNativeFlightReport({
      date: row.flightDate,
      takeOff: row.depAptIcao,
      land: row.arrAptIcao,
      flightNumber: row.flightNumber,
      actLong: row.actLong,
      aircraftNumber: row.aircraftNumber,
      flightId: row.flightId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }

  private getList (prop = '', order = 'normal') {
    this.loading = true
    appPost(HOME.FLIGHTLIST, {
      isAsc: SORTLIST()[order as keyof SORTLISTTYPE],
      orderByColumn: prop,
      pageNum: this.pageOptions.pageNum,
      pageSize: this.pageOptions.pageSize,
      ...this.routeParams
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        this.tableList = res.data
        this.pageOptions.total = res.totalSize
      })
      .finally(() => {
        this.loading = false
      })
  }
}
</script>

<style lang="scss" scoped>
.filghtDetail {
  height: 100vh;
  width: 100vw;
}
</style>
