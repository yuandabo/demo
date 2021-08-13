import { Vue, Prop, Component } from 'vue-property-decorator'

@Component({})
export default class extends Vue {
  @Prop() closeFn!: (a:boolean, b:any[]) => void

  private loading = false

  /** 表格页码数据 */
  private pageOptions = {
    pageNum: 1,
    pageSize: 30,
    total: 0
  }

  private get finishing () {
    const { pageNum, pageSize, total } = this.pageOptions
    return pageNum * pageSize >= total
  }
}
