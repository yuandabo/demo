import { Vue, Component } from 'vue-property-decorator'

@Component({})
export default class extends Vue {
  private loading = false
  private finishing = false
  private tableList = []
  load: unknown
  // private get dataList () {
  //   return {
  //     resComponents: this.resComponents,
  //     typical: this.collapseStatus,
  //     tableList: this.tableList
  //   }
  // }

  private pullup () {
    if (this.loading) return
    this.loading = true
    if (typeof this.load === 'function') this.load()
  }

  private close (val:boolean, list:any) {
    setTimeout(() => {
      this.loading = false
    }, 200)
    this.finishing = val
    this.tableList = list
  }
}
