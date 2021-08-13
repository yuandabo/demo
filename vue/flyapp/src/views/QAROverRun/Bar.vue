<template>
  <div class="bar">
    <div class="title">{{ module.name }}</div>
    <RateChoose
      :pad="0"
      :center="'center'"
      :tagsList="dateTagsList"
      :title="'事件等级：'"
      @active-change="dateActiveChange"
    ></RateChoose>
    <div class="chart-wrap">
      <MyChart ref="barChart"></MyChart>
    </div>
    <Divider />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import MyChart, { ECOption } from '@/components/MyChart/index.vue'
import variables from '@/styles/_variables.scss'
import RateChoose, { Tag } from '@/components/Choose/index.vue'
import Divider from '@/components/Divider/index.vue'
import { APP_MODULE_INFO_ITEM } from '@/utils/types'
import { appPost } from '@/request/index'
import { HOME, QAR } from '@/request/urls'
import { getOverRunBarOption } from '@/dict/charts'
type EventListItem = {
  dateStr: string
  flightTotalNum: number
  num: number
  rate: number
  value?: number
}
type BarResponseItem = {
  eventLevel: string
  eventList: EventListItem[]
}
type BarSeriesItem = {
  name?: string
  type: string
  data: EventListItem[]
  itemStyle: { color: string }
  symbolSize?: number
  smooth?: boolean
}
type BarDataItem = {
  legendList: string[]
  xAxisDataList: string[]
  series: BarSeriesItem[]
}
@Component({
  name: 'Bar',
  components: {
    MyChart,
    RateChoose,
    Divider
  }
})
export default class extends Vue {
  @Prop() module!: APP_MODULE_INFO_ITEM
  @Watch('module', { deep: true })
  moduleChange ():void {
    this.getFormList().then(() => {
      this.getBarData()
    })
  }

  private form = {
    fleet: '',
    startTime: null,
    endTime: null,
    transfiniteType: ''
  }

  private dateTagsList: Tag[] = []

  /* BAR */
  private barData:BarDataItem = {
    legendList: [],
    xAxisDataList: [],
    series: []
  }
  /* BAR */

  private getFormList () {
    return appPost(HOME.INIT, {
      moduleId: this.module.moduleId
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('qragetFormList', res)
        this.dateTagsList = res.transfiniteType
      })
  }

  private getBarData () {
    this.barData = {
      legendList: [],
      xAxisDataList: [],
      series: []
    }
    appPost(QAR.BARDATA, {
      ...this.form
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        this.barData.series = []
        // console.log('QAR.BARDATA', res)
        const list:BarResponseItem[] = res
        const length = list.length
        list.forEach((v) => {
          const filterList = this.dateTagsList.filter(tag => tag.value === v.eventLevel)
          const name = filterList[0].name
          const color = filterList[0].color
          if (this.barData.legendList.length < length) this.barData.legendList.push(name as string)
          if (this.barData.xAxisDataList.length < length) {
            v.eventList.forEach(event => {
              if (this.barData.xAxisDataList.indexOf(event.dateStr) < 0) this.barData.xAxisDataList.push(event.dateStr)
            })
          }
          this.barData.series.push({
            name: name,
            type: 'bar',
            data: v.eventList.map((e) => ({ value: e.num, ...e })),
            itemStyle: { color: color as string }
          })
          this.barData.series.push({
            name: name,
            type: 'line',
            data: v.eventList.map((e) => ({ value: e.num, ...e })),
            itemStyle: { color: color as string },
            symbolSize: 8,
            smooth: true
          })
        })
        this.setBarOption()
      })
      .finally(() => {
        // ;(this as any).$loading.close()
      })
  }

  private dateActiveChange ({ value }: { value: string}): void {
    this.form.transfiniteType = value
    this.getBarData()
  }

  private setBarOption () {
    const option: ECOption = getOverRunBarOption(variables, this.barData) as ECOption
    ;(this.$refs.barChart as MyChart).setOption(option, true)
  }
}
</script>

<style lang="scss" scoped>
.bar {
  // flex: 3;
  // padding-top: 50px;
  text-align: center;
  .title {
    margin: 10px 0;
    text-align: center;
    font-size: $md-font-size;
    color: $default-font-color;
    font-weight: 600;
    padding: 16px;
  }
  .chart-wrap {
    width: 100vw;
    height: 300px;
    .my-chart {
      height: 100%;
      display: inline-block;
      width: 100vw;
    }
  }
}
</style>
