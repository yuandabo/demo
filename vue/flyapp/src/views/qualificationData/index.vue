<template>
  <div class="qualificationData">
    <Nav :content="$t(`title.${title}`)"
         @leftIcon-click="$router.go(-1)" />
    <div class="qualificationData-content">
      <TypeChoose class="date-choose"
                  :pad="'10px 0 10px 43px'"
                  :center="'left'"
                  :nameKey="'actype'"
                  :tagsList="dateTagsList"
                  :defaultActive="defaultActive"
                  @active-change="dateActiveChange" />
      <TechnicalLevelStep :currenStepList="currenStepList"
                          @step-change="stepChangeHandle" />
      <component v-for="compo in componentList"
                 :key="compo.moduleId"
                 :compon="compo"
                 :is="MODULEINFOLIST[compo.moduleId]"
                 :date-form="form"
                 :radarAndTableModuleInfo="radarAndTableModuleInfo" />
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import TypeChoose, { Tag } from '@/components/Choose/index.vue'
import { APP_MODULE_INFO_ITEM, Time } from '@/utils/types'
import FlightExperience from './FlightExperience.vue'
import TechnicalLevelStep from './TechnicalLevelStep.vue'
import FourDimension from './FourDimension.vue'
import { appPost } from '@/request/index'
import { HOME, QUALI_DATA } from '@/request/urls'
import { MODULEINFO } from '@/dict/qualification-data'
import Nav from '@/components/Nav/index.vue'
type StepLevelListItem = {
  actype: string
  leveList: string[]
  personalLevel: unknown[]
}
@Component({
  name: 'qualificationData',
  components: {
    TypeChoose,
    FlightExperience,
    TechnicalLevelStep,
    FourDimension,
    Nav
  }
})
export default class extends Vue {
  private form: Time = {
    startTime: null,
    endTime: null,
    actype: ''
  }

  private defaultActive = ''
  private dateTagsList: Tag[] = []
  private resData: StepLevelListItem[] = []
  private currenStepList = {
    levelList: [],
    personalLevel: []
  } // 默认取res最后一个

  // 循环列表
  private resComponents: APP_MODULE_INFO_ITEM[] = []

  private get componentList () {
    const set = new Set(Object.keys(this.MODULEINFOLIST))
    const keyArr: string[] = []
    return this.resComponents.filter((v) => {
      const componentName = this.MODULEINFOLIST[v.moduleId]
      const index = keyArr.indexOf(componentName)
      if (index > -1) return false
      if (index === -1 && set.has(v.moduleId)) {
        keyArr.push(componentName)
        return true
      }
      return false
    })
  }

  private get radarAndTableModuleInfo () {
    return this.resComponents.filter((v) => v.moduleId === 'APP_PERSONAL:radarMapOfFourDimensions' || v.moduleId === 'statisticsOfQAREvents')
  }

  private get moduleId () {
    return this.$route.params.moduleId
  }

  private get title () {
    return (this.$route.meta as any).title
  }

  private get MODULEINFOLIST () {
    return MODULEINFO()
  }

  private dateActiveChange (data: any) {
    this.currenStepList = data
    this.form.actype = data.actype
  }

  private mounted (): void {
    this.getModuleInfo()
    this.getStepLevelAndChoose()
  }

  private setDefaultActive () {
    const resData = this.resData
    const { length } = resData
    if (length > 0) {
      this.defaultActive = length - 1 + ''
      this.form.actype = resData[length - 1].actype
    }
  }

  private getStepLevelAndChoose () {
    // this.loading = true
    appPost(QUALI_DATA.LEVEL, {})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('getStepLevel', res)
        const { length } = res
        this.dateTagsList = res
        this.resData = res
        if (length > 0) this.currenStepList = res[length - 1]
        this.setDefaultActive()
      })
      .finally(() => {
        // this.loading = false
        // this.background = 'transparent'
      })
  }

  private getModuleInfo () {
    appPost(HOME.MODULE_INFO, {
      moduleId: this.moduleId
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('commonQualificationData', res)
        const list: APP_MODULE_INFO_ITEM[] = res as APP_MODULE_INFO_ITEM[]
        this.resComponents = list
      })
  }

  private stepChangeHandle (activeStepList: any) {
    const { length } = activeStepList
    if (length === 2) {
      const time1 = activeStepList[0].info
      const time2 = activeStepList[1].info
      this.form.startTime = time1.startTime
      this.form.endTime = time2.endTime
    }
  }
}
</script>

<style lang="scss" scoped>
.qualificationData {
  height: 100vh;
  width: 100vw;
  .qualificationData-content {
    padding-bottom: 20px;
    height: calc(100vh - 69px - 20px);
    overflow: auto;
  }
  // overflow: auto;
  // display: flex;
  // flex-direction: column;
  .date-choose {
    min-height: 30px;
    // padding: 20px 40px;
  }
}
</style>
