<!-- FIR趋势 -->
<template>
  <div class="FRI">
    <Nav :content="$t(`title.${title}`)"
         @leftIcon-click="$router.go(-1)" />
    <div class="FRI-content">
      <div v-if="module.name"
           class="chart-title">{{module.name}}</div>
      <ChoosePanel :buts="officeList"
                   @clear="panelClear"
                   @select-blur="panelBlur" />
      <div class="chart-wrap">
        <MyChart ref="lineChart"></MyChart>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import variables from '@/styles/_variables.scss'
import { Vue, Component } from 'vue-property-decorator'
import { appPost } from '@/request/index'
import { HOME, FRI } from '@/request/urls'
import { APP_MODULE_INFO_ITEM } from '@/utils/types'
import { MODULEINFO } from '@/dict/qarrun'
import ChoosePanel, { FLEET } from '@/components/ChoosePanel/index.vue'
import MyChart, { ECOption } from '@/components/MyChart/index.vue'
import { getFRILineOption } from '@/dict/charts'
import Nav from '@/components/Nav/index.vue'
type LineData = {
  xAxisData: string[]
  legendData: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seriesData: any[]
}
@Component({
  name: 'FRI',
  components: {
    ChoosePanel,
    MyChart,
    Nav
  }
})
export default class extends Vue {
  private module = {}

  private lineData: LineData = {
    legendData: [],
    xAxisData: [],
    seriesData: []
  }

  private form = {
    fleetId: ''
  }

  private get moduleId () {
    return this.$route.params.moduleId
  }

  private get title () {
    return (this.$route.meta as any).title
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

  private officeList: FLEET[] = []

  private mounted (): void {
    this.getFleetList()
    this.getModuleInfo()
    this.getLineData()
  }

  private getLineData () {
    this.lineData = {
      legendData: [],
      xAxisData: [],
      seriesData: []
    }
    appPost(FRI.LINE_DATA, {
      ...this.form
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('FRITrend-LINE_DATA', res)
        const { curveData, label, xShaft } = res
        this.lineData.xAxisData = xShaft
        for (let index = 0, length = label.length; index < length; index++) {
          const element = label[index]
          this.lineData.legendData.push(element.name as string)
          this.lineData.seriesData.push({
            name: element.name,
            type: 'line',
            // stack: '总量',
            data: curveData[index].list,
            symbolSize: 8,
            // symbol: 'circle',
            itemStyle: {
              color: element.color,
              shadowBlur: 4
            }
          })
        }
        this.setLineChart()
      })
  }

  private getFleetList () {
    appPost(HOME.INIT, { moduleId: this.moduleId })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('FRITrend-getFleetList', res)
        if (res.fleet) {
          this.officeList = [res.fleet]
        } else {
          this.$message('fleet 列表缺失')
        }
      })
  }

  private getModuleInfo () {
    appPost(HOME.MODULE_INFO, {
      moduleId: this.moduleId
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('FRITrend-getModuleInfo', res)
        const list: APP_MODULE_INFO_ITEM[] = res as APP_MODULE_INFO_ITEM[]
        this.module = list[0]
      })
  }

  private panelClear () {
    this.officeChange({} as FLEET)
  }

  private panelBlur (val: FLEET) {
    this.officeChange(val)
  }

  private officeChange (data: FLEET) {
    this.form.fleetId = data.officeId || ''
    this.getLineData()
  }

  private setLineChart () {
    const radarOption = getFRILineOption(variables, this.lineData);
    (this.$refs.lineChart as MyChart).setOption(radarOption as ECOption)
  }
}
</script>

<style lang="scss" scoped>
.FRI {
  width: 100vw;
  height: 100vh;
  .FRI-content {
    height: calc(100vh - 69px);
  }
  .chart-title {
    height: 48px;
    line-height: 48px;
    margin: 10px 0;
    text-align: center;
    font-size: $md-font-size;
    color: $default-font-color;
    font-weight: 600;
  }
  .chart-wrap {
    height: calc(100vh - 257px);
    .my-chart {
      height: 100%;
      display: inline-block;
      width: 100%;
    }
  }
}
</style>
