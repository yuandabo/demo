<template>
  <div class="land-key-quota-page">
    <div class="chart-title">{{module.name}}</div>
    <div class="tab-warp">
      <span class="tab" :class="showActive(tab.actypeSeries)?'bold':''" v-for="tab in tabList" :key="tab.actypeSeries" @click="tabClickHandle(tab)">
        {{tab.actypeSeries}}
        <div v-show="showActive(tab.actypeSeries)" class="el-tabs__active-bar" />
      </span>
    </div>
    <div class="series-choose">
      <SeriesChoose :pad="'20px 0'" :nameKey="'actypeName'" :tagWidth="'86px'" :tagsList="seriesTagsList" @active-change="seriesActiveChange"/>
    </div>
    <div class="chart-wrap">
      <MyChart ref="radarChart" @axisname-click="axisnameClick"></MyChart>
      <MyChart ref="batChart"></MyChart>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import SeriesChoose, { Tag } from '@/components/Choose/index.vue'
import MyChart, { ECOption, AxisNameClickOption } from '@/components/MyChart/index.vue'
import variables from '@/styles/_variables.scss'
import { appPost } from '@/request/index'
import { HOME, SUMMARY } from '@/request/urls'
import { APP_MODULE_INFO_ITEM, Time } from '@/utils/types'
import { RADAR_LABEL } from '@/dict/periodic-summary'
import { OptionIndicator, getRadarOpiton, getScatterOption } from '@/dict/charts'
type ActypeItem = {
  actype: string
  actypeName: string
}
type TabItem = {
  actypeSeries: string
  actypeDetail: ActypeItem[]
}
type RadarData = {
  indicator: OptionIndicator[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seriesData: any[]
  color: { [key:string]: string }
}
type ScatterData = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seriesData: any[],
  unit: string
}
type ListItem = {
  x: number
  y: number
}
type Distribution = {
  field: string
  list: ListItem[]
}
@Component({
  name: 'LandKeyQuota',
  components: {
    MyChart,
    SeriesChoose
  }
})
export default class extends Vue {
  @Prop({ default: () => ({}) }) module!: APP_MODULE_INFO_ITEM // 模块信息
  @Prop({ default: () => ({ startTime: 0, endTime: 0 }) }) dateForm!: Time
  @Watch('dateForm', { deep: true })
  dateFormChange ():void{
    this.getRadarAndScatter()
  }

  private form = {
    actype: ''
  }

  private radarData:RadarData = {
    indicator: [],
    seriesData: [],
    color: {}
  }

  private scatterData:ScatterData = {
    seriesData: [],
    unit: ''
  }

  private intervalDistribution:Distribution[] = []

  private timeLoading = false
  private tabActiveName = '1'
  private radarActiveName = '' // 雷达图当前激活

  private seriesTagsList:ActypeItem[] = []

  private tabList:TabItem[] = []

  private showActive (name:string):boolean {
    return name === this.tabActiveName
  }

  mounted () :void {
    this.getTimeList()
    this.getRadarAndScatter()
  }

  private getRadarAndScatter () {
    this.radarData = {
      indicator: [],
      seriesData: [],
      color: {}
    }
    this.scatterData = {
      seriesData: [],
      unit: ''
    }
    this.intervalDistribution = []
    appPost(SUMMARY.RADAR_AND_SCATTER, {
      ...this.form,
      ...this.dateForm
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res:any) => {
        console.log('getBarAndScatter', res)
        const { radarMap, intervalDistribution } = res
        if (!radarMap) {
          this.setRadarChart(true)
          this.setBarChart()
          return
        }
        const personalList = radarMap.personal.data
        const commonList = radarMap.withTheModel.data
        // 雷达图数据筛选
        for (let index = 0, length = personalList.length; index < length; index++) {
          const element = personalList[index]
          const commonItem = commonList[index]
          this.radarData.indicator.push({
            name: element.name,
            x: element.value,
            y: commonItem.value,
            radarActiveName: '',
            unit: element.unit,
            field: element.field
          })
        }
        for (const key in radarMap) {
          const element = radarMap[key]
          this.radarData.seriesData.push({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value: element.data.map((v:any) => v.value),
            name: RADAR_LABEL()[key],
            itemStyle: {
              color: element.color
            }
          })
          this.radarData.color[key] = element.color
        }
        // 散点图
        this.intervalDistribution = intervalDistribution || []
        this.initRadarIndicator()
      })
  }

  private tabClickHandle (tab: TabItem) {
    this.seriesTagsList = tab.actypeDetail
    this.tabActiveName = tab.actypeSeries
  }

  private getTimeList () {
    appPost(HOME.INIT, { moduleId: this.module.moduleId })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res:any) => {
        // console.log('FlightPreparation', res)
        this.tabList = res.actype
      })
  }
  /**
   * @description: 用于雷达图驱动
   * @param {*}
   * @return {*} 注意传出的参数必须是target.style.text用于formaterr高亮判断
   */

  private axisnameClick (params:AxisNameClickOption):void{
    this.initRadarIndicator(params.event?.target.style.text)
  }

  private initRadarIndicator (name?:string) {
    /**
     * @description: indicator 格式要求，需要radarActiveName用于高亮，x、y用于回显
     */
    const indicator = this.radarData.indicator
    if (name) {
      this.radarActiveName = name
    } else {
      // init
      this.radarActiveName = '着陆接地姿态'
    }
    indicator.forEach(e => {
      e.radarActiveName = this.radarActiveName
    })
    this.setRadarChart()
    // 筛选散点图数据
    const intervalDistribution = this.intervalDistribution.filter((v:any) => v.name === this.radarActiveName)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scatterSeriesData:any[] = []
    for (let index = 0, length = intervalDistribution.length; index < length; index++) {
      const element = intervalDistribution[index]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scatterSeriesData = scatterSeriesData.concat(element.list.map((v:any) => ([v.x, v.y])))
    }
    this.scatterData.seriesData = scatterSeriesData
    this.scatterData.unit = this.radarData.indicator.filter(v => v.name === this.radarActiveName)[0].unit
    this.setBarChart()
  }

  private seriesActiveChange (data:Tag):void {
    this.form.actype = data.actypeId as string
    this.getRadarAndScatter()
  }

  private setRadarChart (type = false) {
    const radarOption = getRadarOpiton(variables, this.radarData);
    (this.$refs.radarChart as MyChart).setOption(radarOption as ECOption, type)
  }

  private setBarChart () {
    const option: ECOption = getScatterOption(variables, this.scatterData, this.radarActiveName, this.radarData.color) as ECOption;
    (this.$refs.batChart as MyChart).setOption(option, true)
  }
}
</script>
<style lang="scss" scoped>
.land-key-quota-page {
  width: 100vw;
  .chart-title {
    margin: 10px 0;
    text-align: center;
    color: $default-font-color;
    font-weight: 600;
    padding: 0 16px;
    font-size: 16px;
  }
  .tab-warp {
    text-align: center;
    height: 20px;
    font-size: 13px;
    // font-weight: bold;
    color: #FFFFFF;
    line-height: 20px;
    letter-spacing: 1px;
    transition: all .3s cubic-bezier(.645,.045,.355,1);
    .tab {
      position: relative;
      padding: 10px;
      margin: 10px;
      font-weight: 400;
    }
    .bold {
      font-weight: bold;
    }
  }
  .series-choose{
    height: 70px;
  }
  .el-tabs__active-bar {
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background-color: #409eff;
    z-index: 1;
    transition: all .3s cubic-bezier(.645,.045,.355,1);
    list-style: none;
  }
  .experience-content {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: -25px;
    .experience-items {
      margin: 0 10px 25px;
    }
  }
  .chart-wrap {
    height: 300px;
    .my-chart {
      height: 100%;
      display: inline-block;
      width: 45%;
      &:last-child{
        width: 55%;
      }
    }
  }
}
</style>
