<template>
  <div class="total-table">
    <div class="title">{{ module.name }}</div>
    <el-table
      :height="350"
      :data="tableList"
      @row-click="rowClick"
    >
      <template v-for="col in tableHeadList">
        <el-table-column
          :key="col.field"
          :prop="col.field"
          :label="col.name"
          align="center"
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
import { APP_MODULE_INFO_ITEM, Time } from '@/utils/types'
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
  @Prop() readonly dateForm!: Time

  @Watch('dateForm', { deep: true })
  dateFormChange ():void{
    this.tableList = []
    this.fourDimensionTable()
  }

  private tableList: ListItem[] = []

  private get tableHeadList () {
    if (this.module.header) return this.module.header
    return []
  }

  private mounted (): void {
    this.fourDimensionTable()
  }

  private load () {
    // this.pageOptions.pageNum += 1
    this.fourDimensionTable()
  }

  private fourDimensionTable () {
    appPost(HOME.OVERRUNEVENTSUMMARY, {
      ...this.dateForm
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('FourDimensionTable', res)
        this.tableList = res
      })
      .finally(() => {
        // // console.log('finishing', this.finishing)
      })
  }

  public rowClick ({ field }: { field: string}): void {
    this.$router.push({ name: 'Detail', params: { field } })
  }
}
</script>

<style lang="scss" scoped>
.total-table {
  flex: 1;
  padding: 0 5px;
  .title {
    text-align: center;
    font-size: $md-font-size;
    color: $default-font-color;
    padding-bottom: 16px;
    font-weight: 500;
    letter-spacing: 1px;
  }
  .red-word {
    color: #ff4f45;
  }
}
</style>
