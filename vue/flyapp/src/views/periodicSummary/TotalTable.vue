<template>
  <div class="total-table">
    <div class="title">{{ module.name }}</div>
    <el-table
      :data="tableList"
      @row-click="rowClick"
      @sort-change="tableSortChange"
    >
      <template v-for="col in tableHeadList">
        <el-table-column
          v-if="'orderContent' in col"
          :key="col.field"
          :prop="col.field"
          :label="col.name"
          align="center"
          :sortable="'orderContent' in col ? 'custom' : false"
        >
          <template slot-scope="scope">
            <div :class="compareRate(scope, col.field)">
              {{ scope.row[col.field] }}%
              <span v-if="compareRate(scope, col.field) === 'red-word'"
                ><i class="el-icon-top" style="font-weight:600"></i
              ></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-else
          :key="col.field"
          :prop="col.field"
          :label="col.name"
          align="center"
          :formatter="columnFormatter"
        ></el-table-column>
      </template>
    </el-table>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { Table, TableColumn } from 'element-ui'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import {
  SORTLIST,
  QARPUVERRUNADDUNITLABEL,
  QAR_OVERRUN_ADDLABEL
} from '@/dict/table'
import { SORTLISTTYPE, APP_MODULE_INFO_ITEM, Time } from '@/utils/types'
interface ListItem {
  actypeSeries: string
  id: string | number
  name: string
  numberOfMildOverruns: number
  mildOverrunRate: number
  mildFleetOverrunRate: number
  numberOfSeriousOverruns: number
  seriousOverrunRate: number
  seriousFleetOverrunRate: number
}
@Component({
  name: 'TotalTable',
  components: {
    [Table.name]: Table,
    [TableColumn.name]: TableColumn
  }
})
export default class extends Vue {
  @Prop() module!: APP_MODULE_INFO_ITEM
  @Prop({ default: () => ({ startTime: 0, endTime: 0 }) }) dateForm!: Time
  @Prop() closeFn!: (a:boolean, b:any[]) => void

  @Watch('dateForm', { deep: true })
  dateFormChange ():void{
    this.getList()
  }

  private tableList: ListItem[] = []
  /** 表格页码数据 */
  private pageOptions = {
    pageNum: 1,
    pageSize: 30,
    total: 0
  }

  private sortOptions = {
    prop: '',
    order: 'normal'
  }

  private loading = false
  private get finishing () {
    // const { pageNum, pageSize, total } = this.pageOptions
    // return pageNum * pageSize >= total
    return true
  }

  private get tableHeadList () {
    if (this.module.header) return this.module.header
    return []
  }

  private mounted (): void {
    this.getList()
    this.$emit('load', this.load)
  }

  private load () {
    if (this.loading || this.finishing) return
    this.pageOptions.pageNum += 1
    this.getList()
  }

  private getList (type = '') {
    const { order, prop } = this.sortOptions
    this.loading = true
    appPost(HOME.OVERRUNEVENTSUMMARY, {
      ...this.dateForm,
      isAsc: SORTLIST()[order as keyof SORTLISTTYPE],
      orderByColumn: prop,
      pageNum: this.pageOptions.pageNum,
      pageSize: this.pageOptions.pageSize
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('getOverRun', res)
        // this.pageOptions.total = res.totalSize
        // if (type === 'sort') {
        this.tableList = res
        // } else {
        //   this.tableList = this.tableList.concat(res)
        // }
      })
      .finally(() => {
        this.loading = false
        this.closeFn(this.finishing, this.tableList)
      })
  }

  public rowClick ({ field }: { field: string}): void {
    this.$router.push({ name: 'Detail', params: { field } })
  }

  public compareRate ({ row }: { row: ListItem }, field: string): string {
    const {
      mildOverrunRate,
      mildFleetOverrunRate,
      seriousOverrunRate,
      seriousFleetOverrunRate
    } = row
    const obj = {
      mildOverrunRate: mildOverrunRate > mildFleetOverrunRate,
      seriousOverrunRate: seriousOverrunRate > seriousFleetOverrunRate
    }
    if (field in obj) {
      return (obj as any)[field] ? 'red-word' : ''
    }
    return ''
  }

  private tableSortChange ({
    prop,
    order
  }: {
    prop: string
    order: string | null
  }) {
    if (order === null) this.sortOptions.order = 'normal'
    const arr = this.module.header.filter((v) => v.field === prop && 'orderContent' in v)
    if (arr.length > 0) {
      (this as any).pageOptions.pageNum = 1
      ;(this as any).pageOptions.total = 0
      ;(this as any).sortOptions.prop = arr[0].orderContent as string
      ;(this as any).sortOptions.order = order as string
      ;(this as any).getList('sort')
    }
  }

  private columnFormatter (
    row: ListItem,
    { property }: { property: string },
    cellValue: unknown
  ) {
    const unitList: string[] = QARPUVERRUNADDUNITLABEL()
    // 拼接百分号
    if (unitList.indexOf(property) >= 0) {
      cellValue += '%'
    }
    // 拼接row.actypeSeries号码
    if (QAR_OVERRUN_ADDLABEL().indexOf(property) >= 0 && row.actypeSeries) {
      cellValue += `（${row.actypeSeries}）`
    }
    return cellValue
  }
}
</script>

<style lang="scss" scoped>
.total-table {
  // padding-bottom: 50px;
  // height: 300px;
  flex: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  .title {
    margin: 10px 0;
    text-align: center;
    font-size: $md-font-size;
    color: $default-font-color;
    font-weight: 600;
    padding: 16px;
  }
  .red-word {
    color: #ff4f45;
  }
}
</style>
