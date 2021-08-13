<template>
  <div class="bar">
    <div class="title">{{ module.name }}</div>
    <div class="chooses-warp">
      <RateChoose
        :pad="'0 10px'"
        :center="'center'"
        :tagsList="dateTagsList"
        :title="'日期：'"
        @active-change="dateActiveChange"
      />
      <RateChoose
        :pad="'0 10px'"
        :center="'center'"
        :tagsList="eventTagsList"
        :title="'事件等级：'"
        @active-change="eventActiveChange"
      />
    </div>
    <div class="chart-wrap">
      <MyChart ref="barChart"/>
    </div>
    <Divider :margin="0"/>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import MyChart, { ECOption } from '@/components/MyChart/index.vue'
import variables from '@/styles/_variables.scss'
import RateChoose, { Tag } from '@/components/Choose/index.vue'
import { APP_MODULE_INFO_ITEM } from '@/utils/types'
import { appPost } from '@/request/index'
import { HOME, QAR } from '@/request/urls'
import Divider from '@/components/Divider/index.vue'
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
  name: string
  type: string
  data: EventListItem[]
  itemStyle: { color:string, shadowBlur?: number }
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
  @Prop() fleetForm!: { fleetId: string }

  @Watch('fleetForm', { deep: true })
  fleetFormChange () :void{
    this.getBarData()
  }

  private form = {
    startTime: null,
    endTime: null,
    transfiniteType: ''
  }

  private dateTagsList: Tag[] = []

  private eventTagsList: Tag[] = []

  /* BAR */
  private barData:BarDataItem = {
    legendList: [],
    xAxisDataList: [],
    series: []
  }
  /* BAR */

  private mounted (): void {
    this.getFormList().then(() => {
      this.getBarData()
    })
  }

  private getFormList () {
    return appPost(HOME.INIT, {
      moduleId: this.module.moduleId
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        console.log('overrungetFormList', res)
        this.eventTagsList = res.transfiniteType
        this.dateTagsList = res.date
      })
  }

  private getBarData () {
    this.barData = {
      legendList: [],
      xAxisDataList: [],
      series: []
    }
    appPost(QAR.BARDATA, {
      ...this.form,
      ...this.fleetForm
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        this.barData.series = []
        this.barData.xAxisDataList = []
        // console.log('QAR.BARDATA', res)
        const list:BarResponseItem[] = res
        const length = list.length
        list.forEach((v) => {
          const filterList = this.eventTagsList.filter(tag => tag.value === v.eventLevel)
          const name = filterList[0].name
          const color = filterList[0].color
          if (this.barData.legendList.length < length) this.barData.legendList.push(name)
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
            smooth: true,
            symbolSize: 8
          })
        })
        this.setBarOption()
      })
  }

  private dateActiveChange (val: Tag): void {
    this.form.startTime = val.startTime as null
    this.form.endTime = val.endTime as null
    this.getBarData()
  }

  private eventActiveChange ({ value }: { value: string}): void {
    this.form.transfiniteType = value
    this.getBarData()
  }

  private setBarOption () {
    const option = getOverRunBarOption(variables, this.barData)
    ;(this.$refs.barChart as MyChart).setOption(option as ECOption, true)
  }
}
</script>

<style lang="scss" scoped>
.bar {
  text-align: center;
  .title {
    margin: 10px 0;
    text-align: center;
    font-size: $md-font-size;
    color: $default-font-color;
    font-weight: 600;
    padding: 16px;
  }
  .chooses-warp {
    display: flex;
    justify-content: center;
  }
  .chart-wrap {
    height: 300px;
    width: 100vw;
    .my-chart {
      height: 100%;
      // display: inline-block;
      width: 95%;
    }
  }
}
</style>
