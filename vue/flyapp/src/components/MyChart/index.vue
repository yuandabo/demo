<template>
  <div class="my-chart" ref="myChart"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator'
import * as echarts from 'echarts/core'
import { BarChart, BarSeriesOption, RadarChart, ScatterChart, BoxplotChart, RadarSeriesOption, LineChart, LineSeriesOption } from 'echarts/charts'
import { TitleComponent, TitleComponentOption, GridComponent, GridComponentOption, LegendComponent, TooltipComponent, DatasetComponent, MarkPointComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
// ToolboxComponent
// 注册必须的组件
echarts.use([TitleComponent, GridComponent, BarChart, RadarChart, ScatterChart, CanvasRenderer, LegendComponent, TooltipComponent, LineChart, BoxplotChart, DatasetComponent, MarkPointComponent])
// 通过 ComposeOption 来组合出的 Option 类型
export type ECOption = echarts.ComposeOption<BarSeriesOption | RadarSeriesOption | GridComponentOption | TitleComponentOption | LineSeriesOption>
type RadarTarget = {
  id: number,
  style: { text:string }
}
type RadarEvent = {
  target: RadarTarget
}
export type AxisNameClickOption = {
  componentType:string
  name:string
  targetType:string
  event:RadarEvent
}

@Component({
  name: 'MyChart'
})
export default class extends Vue {
  @Prop() data!: Array<Record<string, string | number>>
  mounted (): void {
    this.initEchart()
    this.initEvent()
  }

  activated (): void {
    if (this.chart) {
      this.chart.resize()
    }
  }

  beforeDestroy (): void {
    if (!this.chart) return
    this.chart.dispose()
    this.chart = undefined
  }

  private chart: echarts.ECharts | undefined = undefined

  private initEchart () {
    this.chart = echarts.init(this.$refs.myChart as HTMLElement)
  }

  private initEvent () {
    if (this.chart) {
      this.chart.on('click', (params) => {
        const { componentType, targetType } = params
        if (componentType === 'radar' && targetType === 'axisName') {
          this.axisNameClick({
            componentType: params.componentType,
            name: params.name,
            targetType: params.targetType,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            event: params.event as any
          })
        }
      })
    }
  }

  @Emit('axisname-click')
  axisNameClick (params:AxisNameClickOption) :AxisNameClickOption {
    return params
  }

  public setOption (option: ECOption, notMerge?:boolean): void {
    (this.chart as echarts.ECharts).setOption(option, !!notMerge)
  }
}
</script>
