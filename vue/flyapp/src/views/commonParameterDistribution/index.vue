<!-- FIR趋势 -->
<template>
  <div class="commonParameterDistribution">
    <Nav
      :content="$t(`title.${title}`)"
      @leftIcon-click="$router.go(-1)" />
    <ChoosePanel
      :buts="officeList"
      @clear="panelClear"
      @select-blur="panelBlur"
    >
      <el-form-item label="日期：">
        <DateChoose
          :display="'inline-block'"
          :pad="'0'"
          :tagsList="dateTagsList"
          @active-change="dateActiveChange"
        ></DateChoose>
      </el-form-item>
    </ChoosePanel>
    <div v-if="handMaxModule.length > 0" class="chart-title">{{handMaxModule[0].name}}</div>
    <div class="chart-wrap">
      <MyChart ref="barOption0"></MyChart>
      <MyChart ref="boxPlotOption0"></MyChart>
    </div>
    <div v-if="ftModule.length > 0" class="chart-title">{{ftModule[0].name}}</div>
     <div class="chart-wrap">
      <MyChart ref="barOption1"></MyChart>
      <MyChart ref="boxPlotOption1"></MyChart>
    </div>
  </div>
</template>

<script lang="ts">
import { FormItem } from 'element-ui'
import variables from '@/styles/_variables.scss'
import { Vue, Component } from 'vue-property-decorator'
import { appPost } from '@/request/index'
import { HOME, PARAMS } from '@/request/urls'
import { APP_MODULE_INFO_ITEM, Time } from '@/utils/types'
import { MODULEINFO } from '@/dict/qarrun'
import ChoosePanel, { FLEET } from '@/components/ChoosePanel/index.vue'
import MyChart, { ECOption } from '@/components/MyChart/index.vue'
import { getParamBarOption, getBoxPlotOption } from '@/dict/charts'
import DateChoose, { Tag } from '@/components/Choose/index.vue'
import Nav from '@/components/Nav/index.vue'
type BarData = {
  xAxisData?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seriesData: any[]
  unit: string
  legendData?: []
  boxplotMax?: number
}
type Form = {
  fleetId: string
  startTime?: null | number
  endTime?: null | number
}
@Component({
  name: 'commonParameterDistribution',
  components: {
    ChoosePanel,
    MyChart,
    DateChoose,
    [FormItem.name]: FormItem,
    Nav
  }
})
export default class extends Vue {
  private moduleList:APP_MODULE_INFO_ITEM[] = []

  private get handMaxModule () {
    return this.moduleList.filter((v:APP_MODULE_INFO_ITEM) => v.moduleId === 'APP_MANAGE:MaximumVerticalOverloadDistributionOfGrounding')
  }

  private get ftModule () {
    return this.moduleList.filter((v:APP_MODULE_INFO_ITEM) => v.moduleId === 'APP_MANAGE:DistanceFrom50ftToGround')
  }

  private barData: BarData[] = []
  private boxPlotData: BarData[] = []

  private form:Form = {
    fleetId: '',
    startTime: null,
    endTime: null
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
  private dateTagsList: Time[] = []

  private mounted (): void {
    this.getFleetList()
    this.getModuleInfo()
    this.getBarAndBoxPlotData()
  }

  private getBarAndBoxPlotData () {
    this.barData = []
    this.boxPlotData = []
    appPost(PARAMS.BAR_AND_BoxPlot_DATA, {
      ...this.form
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('getBarAndBoxPlotData', res)
        res.forEach((element:any, index:number) => {
          const unit = element.unit || ''
          const arr = element.intervalDistribution.map((v:any) => v.x)
          const boxplotMax = Math.ceil(Math.max(element.currentModels.maximum, element.allModels.maximum))
          if (index === 0) {
            arr.unshift('<0.9')
            arr.push('>2')
          }
          if (index === 1) {
            arr.unshift('<800')
            arr.push('>3600')
          }
          this.barData.push({
            seriesData: [{
              type: 'bar',
              data: element.intervalDistribution.map((v:any) => v.y),
              itemStyle: {
                color: '#73EFFF'
              }
            }],
            xAxisData: arr,
            unit: unit
          })
          this.setBarChart('barOption', index)
          const labelList = ['lowest', 'lowerQuartile', 'average', 'upperQuartile', 'maximum']
          /*
当数据量不足4个，不足以画箱线图时(最大值、最小值、上下四分位），对应箱线图处只用展示均值，并且均值下方展示提示文案：数据量不足，暂无箱线图
          */
          if (Object.keys(element.currentModels).length !== 5 ||
          Object.keys(element.allModels).length !== 5) {
            this.boxPlotData.push({
              seriesData: [
                {
                  type: 'scatter',
                  data: [
                    [-1, element.currentModels.average], // 均值打点
                    [1, element.allModels.average] // 均值打点
                  ],
                  label: {
                    show: true,
                    position: 'bottom',
                    color: '#45FFA1',
                    formatter: '{@y} \n 数据量不足\n暂无箱线图',
                    fontSize: 8
                  },
                  itemStyle: {
                    color: '#45FFA1'
                  }
                }
              ],
              unit: unit,
              boxplotMax: boxplotMax
            })
          } else {
            this.boxPlotData.push({
              seriesData: [
                {
                  type: 'boxplot',
                  name: '个人',
                  data: [
                    {
                      name: '个人',
                      value: labelList.map(v => element.currentModels[v]),
                      itemStyle: {
                        color: 'rgb(45,121,126)',
                        borderColor: '#45FFA1'
                      }
                    }
                  ]
                },
                {
                  type: 'boxplot',
                  name: '同机型',
                  data: [
                    {
                      name: '同机型',
                      value: labelList.map(v => element.allModels[v]),
                      itemStyle: {
                        color: 'rgba(255,167,135,.5)',
                        borderColor: 'rgba(255,167,135)'
                      }
                    }
                  ]
                }
              ],
              unit: unit,
              boxplotMax: boxplotMax
            })
          }
          // console.log(this.boxPlotData)
          this.setBoxPlotChart('boxPlotOption', index)
        })
        // this.setBoxPlotChart('maxBoxPlotOption')
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
        if (res.date) {
          this.dateTagsList = res.date
        } else {
          this.$message('date 列表缺失')
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
        this.moduleList = res
      })
  }

  private dateActiveChange (data: Tag): void {
    this.form.startTime = data.startTime
    this.form.endTime = data.endTime
    this.getBarAndBoxPlotData()
  }

  private panelClear () {
    this.officeChange({} as FLEET)
  }

  private panelBlur (val: FLEET) {
    this.officeChange(val)
  }

  private officeChange (data: FLEET) {
    this.form.fleetId = data.officeId || ''
    this.getBarAndBoxPlotData()
  }

  private setBarChart (ref:string, index:number) {
    // console.log(`${ref}${index}`)
    if ('seriesData' in this.barData[index]) {
      const barOption = getParamBarOption(variables, this.barData[index]);
      (this.$refs[`${ref}${index}`] as MyChart).setOption(barOption as any, true)
    }
  }

  private setBoxPlotChart (ref:string, index:number) {
    if ('seriesData' in this.barData[index]) {
      const boxPlotOption = getBoxPlotOption(variables, this.boxPlotData[index]);
      (this.$refs[`${ref}${index}`] as MyChart).setOption(boxPlotOption as any, true)
    }
  }
}
</script>

<style lang="scss" scoped>
.commonParameterDistribution {
  width: 100vw;
  .chart-title {
    margin: 10px 0;
    text-align: center;
    font-size: $md-font-size;
    color: $default-font-color;
    font-weight: 600;
  }
  .chart-wrap {
    height: calc((100vh - 72px - 80px - 69px) / 2 - 20px);
    .my-chart {
      height: 100%;
      display: inline-block;
      width: 50%;
    }
  }
  ::v-deep .el-form-item{
    margin-bottom: 0;
  }
}
</style>
