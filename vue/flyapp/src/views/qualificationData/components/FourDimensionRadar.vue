<template>
  <div class="four-dimension-radar">
    <MyChart ref="radarChart"></MyChart>
    <div class="dimension-list">
      <span class="dimension"><span class="icon" style="background:#a9c0dc"></span>20分</span>
      <span class="dimension"><span class="icon" style="background:#89aedc"></span>40分</span>
      <span class="dimension"><span class="icon" style="background:#5e92d1"></span>60分</span>
      <span class="dimension"><span class="icon" style="background:#4178b8"></span>80分</span>
      <span class="dimension"><span class="icon" style="background:#376193"></span>100分</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import DataChoose from '@/components/Choose/index.vue'
import MyChart, { ECOption } from '@/components/MyChart/index.vue'
import variables from '@/styles/_variables.scss'
import { Time, APP_MODULE_INFO_ITEM } from '@/utils/types'
import { getFourRadarOption } from '@/dict/charts'
import { appPost } from '@/request/index'
import { QUALI_DATA } from '@/request/urls'
 type OptionIndicator = {
  x: number
  name: string
  min: number
}
type RadarData = {
  indicator: OptionIndicator[]
  seriesData: any[]
  color: { [key:string]: string },
  title: string
}
@Component({
  name: 'FourDimensionRadar',
  components: {
    MyChart,
    DataChoose
  }
})
export default class extends Vue {
  @Prop() module! :APP_MODULE_INFO_ITEM
  @Prop() readonly dateForm!: Time

  @Watch('dateForm', { deep: true })
  dateFormChange ():void{
    this.getRadarData()
  }

  // private radarActiveName = '' // 雷达图当前激活
  private radarData:RadarData = {
    indicator: [],
    seriesData: [],
    color: {},
    title: ''
  }

  mounted () :void {
    // this.getRadarData()
  }

  private getRadarData () {
    this.radarData = {
      indicator: [],
      seriesData: [],
      color: {},
      title: ''
    }
    appPost(QUALI_DATA.RADAR, {
      ...this.dateForm
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res:any) => {
        console.log('getRadar', res)
        const { personal, fleetAverage } = res
        if (!personal || !fleetAverage) {
          this.setRadarChart()
          return
        }
        this.radarData.seriesData.push({
          value: Object.values(personal),
          name: '个人',
          itemStyle: {
            color: '#C2FFB9'
          }
        })
        this.radarData.seriesData.push({
          value: Object.values(fleetAverage),
          name: '均值',
          itemStyle: {
            color: '#42E0FF'
          }
        })
        const obj:any = {
          actualOperation: '实操',
          style: '作风',
          theory: '理论',
          training: '训练'
        }
        for (const key in personal) {
          const element = personal[key]
          this.radarData.indicator.push({
            name: obj[key],
            x: element,
            min: 0
          })
        }
        this.radarData.title = this.module.name
        this.setRadarChart()
      })
  }

  private setRadarChart () {
    const radarOption = getFourRadarOption(variables, this.radarData);
    (this.$refs.radarChart as MyChart).setOption(radarOption as ECOption, true)
  }
}
</script>
<style lang="scss" scoped>
.four-dimension-radar {
  flex:1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  .my-chart {
    height: 90%;
    display: inline-block;
    width: 100%;
  }
  .dimension-list{
    height: 10%;
    display: flex;
    align-items: center;
    .dimension {
      display: flex;
      align-items: center;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 1px;
    }
    .icon {
      margin-right: 5px;
      display: inline-block;
      width: 12px;
      height: 12px;
      opacity: .5;
      transform: rotate(45deg)
    }
  }
}
</style>
