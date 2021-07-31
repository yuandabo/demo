<!-- 飞行总经历 -->
<template>
  <div class="flight-experience">
    <ModuleTitle :title="compon.name" :module="false" :dateForm="dateForm" :inlineDateShow="true">
      <transition-group
        name="fade"
        tag="div"
        :style="{ background: background }"
        class="experience-content"
        slot="content"
      >
        <ExperienceItems
          v-for="item in dataList"
          :key="item.field"
          :iconUrl="item.iconUrl"
          :title="item.name"
          :value="item.value"
          :unit="item.unit"
          :valueOpacity=".8"
        ></ExperienceItems>
        <!-- <NoData v-else></NoData> -->
      </transition-group>
    </ModuleTitle>
    <Divider :margin="'0 0 15px 0'" />
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import ModuleTitle from '@/views/components/HomeModule.vue'
import ExperienceItems from '@/views/components/ExperienceItems.vue'
import { HOME } from '@/request/urls'
import { APP_MODULE_INFO_ITEM, Time } from '@/utils/types'
import { appPost } from '@/request/index'
import Divider from '@/components/Divider/index.vue'
@Component({
  name: 'FlightExperience',
  components: {
    ModuleTitle,
    ExperienceItems,
    Divider
    // NoData
  }
})
export default class extends Vue {
  @Prop({ default: () => ({}) }) readonly compon!: APP_MODULE_INFO_ITEM // 模块信息
  @Prop() readonly dateForm!: Time

  @Watch('dateForm', { deep: true })
  dateFormChange ():void{
    this.getFlightExperience()
  }

  private loading = false
  private dataList: APP_MODULE_INFO_ITEM[] = []

  private get noData () {
    return this.dataList.length > 0
  }

  private background = 'rgba(49, 71, 99)'

  private created (): void {
    this.getFlightExperience()
  }

  private getFlightExperience () {
    // this.loading = true
    appPost(HOME.FLIGHTEXPERIENCE, {
      moduleId: this.compon.moduleId,
      ...this.dateForm
    })
      .then((res: unknown) => {
        // console.log('FlightExperience', res)
        this.dataList = res as APP_MODULE_INFO_ITEM[]
      })
      .finally(() => {
        this.loading = false
        this.background = 'transparent'
      })
  }
}
</script>
<style lang="scss" scoped>
.flight-experience {
  .experience-content {
    min-height: 190px;
    display: flex;
    flex-wrap: wrap;
    margin: 12px 20px;
    // padding: 10px 0;
    border-radius: 9px;
    .experience-items {
      width: calc(25% - 20px);
      margin: 10px;
      box-sizing: border-box;
    }
  }
}
</style>
