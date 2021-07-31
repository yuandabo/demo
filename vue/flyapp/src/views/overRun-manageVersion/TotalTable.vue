<template>
  <div class="total-table">
    <div class="title">{{ module.name }}</div>
    <RateChoose
      :pad="'10px'"
      :center="'center'"
      :tagsList="dateTagsList"
      :title="'日期：'"
      @active-change="dateActiveChange"
    ></RateChoose>
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
            <div v-if="scope.row" :class="compareRate(scope, col.field)">
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
          :sortable="col.sortable"
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
  SORTLIST
} from '@/dict/table'
import { SORTLISTTYPE, APP_MODULE_INFO_ITEM } from '@/utils/types'
import RateChoose, { Tag } from '@/components/Choose/index.vue'
import TableMixin from '@/mixins/table-load/tablePage'
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
    [TableColumn.name]: TableColumn,
    RateChoose
  },
  mixins: [TableMixin]
})
export default class extends Vue {
  @Prop() module!: APP_MODULE_INFO_ITEM
  @Prop() fleetForm!: { fleetId: string }
  @Watch('fleetForm', { deep: true })
  fleetFormChange () :void{
    this.getOverRunTable()
  }

  @Watch('module', { deep: true })
  moduleChange () :void {
    this.getFormList()
  }

  private form = {
    startTime: null,
    endTime: null
  }

  private tableList: ListItem[] = []

  private sortOptions = {
    prop: '',
    order: 'normal'
  }

  private dateTagsList: Tag[] = []
  private get tableHeadList () {
    if (this.module.header) return this.module.header
    return []
  }

  private created (): void {
    this.$emit('load', this.load)
  }

  private mounted (): void {
    // this.getFormList()
    this.getOverRunTable()
  }

  private load () {
    (this as any).pageOptions.pageNum += 1
    this.getOverRunTable()
  }

  private dateActiveChange (val: Tag): void {
    this.refreshTable()
    this.form.startTime = val.startTime as null
    this.form.endTime = val.endTime as null
    this.getOverRunTable()
  }

  private getFormList () {
    appPost(HOME.INIT, {
      moduleId: this.module.moduleId
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('TotalTableFormList', res)
        this.dateTagsList = res.date
      })
      .catch((err) => console.log(err))
  }

  private getOverRunTable (type = '') {
    const { order, prop } = this.sortOptions
    appPost(HOME.OVERRUNEVENTSUMMARY, {
      ...this.form,
      ...this.fleetForm,
      orderByColumn: prop,
      isAsc: SORTLIST()[order as keyof SORTLISTTYPE],
      pageNum: (this as any).pageOptions.pageNum,
      pageSize: (this as any).pageOptions.pageSize
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('getOverRun', res)
        if (type === 'sort') {
          this.tableList = res
        } else {
          this.tableList = this.tableList.concat(res)
        }
        // this.pageOptions.total = res.totalSize
      })
      .finally(() => {
        (this as any).closeFn((this as any).finishing, this.tableList)
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
      ;(this as any).getOverRunTable('sort')
    }
  }

  private refreshTable () {
    this.sortOptions = {
      prop: '',
      order: 'normal'
    }
    this.tableList = []
    ;(this as any).pageOptions.pageNum = 1
    ;(this as any).pageOptions.total = 0
  }
}
</script>

<style lang="scss" scoped>
.total-table {
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
