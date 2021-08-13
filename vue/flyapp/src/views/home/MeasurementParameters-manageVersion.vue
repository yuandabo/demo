<!-- 测量参数-管理版 -->
<template>
  <div class="measurementParameters">
    <ModuleTitle :title="compon.name" :module="false">
      <div class="experience-warp" slot="content">
        <transition-group
          name="fade"
          tag="div"
          class="experience-content"
          :style="{ background: background }"
        >
          <ExperienceItems
            style="flex:1;min-width: 0;"
            v-for="item in dataList"
            :key="item.field || item.name"
            :title="item.name"
            :valueFontWeihgt="400"
            :contentWidth="'100%'"
            :align="'center'"
            :value="item.value"
            :unit="item.unit"
            :itemsBackground="'#3a5575'"
            @item-click="routerToDetail(item)"
          ></ExperienceItems>
        </transition-group>
        <transition-group name="fade" tag="div" class="measurement-content" :style="{ background: background }">
          <MeasurementCard
            :scroll="scroll"
            style="flex:1"
            v-for="card in listLabel"
            :key="card.field || card.name"
            :boxList="card.valueList"
            :name="card.name"
            @item-click="routerToDetail(card)"
          ></MeasurementCard>
        </transition-group>
      </div>
    </ModuleTitle>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import ModuleTitle from '@/views/components/HomeModule.vue'
import ExperienceItems from '@/views/components/ExperienceItems.vue'
import MeasurementCard, { BoxItem } from './components/MeasurementCard.vue'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { APP_MODULE_INFO_ITEM, Time } from '@/utils/types'
interface ExperienceItem {
  icon: string
  title: string
  value: string
  unit?: string
  field: string
  flightList: any[]
}
@Component({
  name: 'MeasurementParameters',
  components: {
    ModuleTitle,
    ExperienceItems,
    MeasurementCard
  }
})
export default class extends Vue {
  @Prop({ default: () => ({}) }) readonly compon!: APP_MODULE_INFO_ITEM // 模块信息
  @Prop({ default: null }) readonly scroll!: any
  @Prop() formDate! :Time
  @Watch('compon', { deep: true })
  componChange () :void {
    this.getList()
  }

  @Watch('formDate', { deep: true })
  formDateChange () :void {
    this.getList()
  }

  private background = 'rgba(49, 71, 99)'
  private loading = false
  private listLabel: BoxItem[] = []

  private afterFlyingHeightList = []

  private airTurbulenceList = []

  private GPWSList = []

  private TCASList = []

  private dataList: ExperienceItem[] = []

  private created (): void {
    this.getList()
  }

  private getList () {
    // this.loading = true
    appPost(HOME.MEASUREMENTPARAMETERS, { moduleId: this.compon.moduleId, ...this.formDate })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        if (res.basis) {
          this.dataList = res.basis as ExperienceItem[]
        } else {
          this.$message('basis 列表缺失')
        }
        if (res.listLabel) {
          this.listLabel = res.listLabel
        } else {
          this.$message('listLabel 列表缺失')
        }
      })
      .finally(() => {
        this.loading = false
        this.background = 'transparent'
      })
  }

  private routerToDetail (val: ExperienceItem) {
    // console.log('routerToDetail', val)
    const { field } = val
    const params = {
      startTime: this.formDate.startTime,
      endTime: this.formDate.endTime,
      field: field,
      fleetId: this.formDate.fleetId as string
    }
    this.$router.push({ name: 'FilghtDetail', params: params as any })
  }
}
</script>

<style lang="scss" scoped>
.measurementParameters {
  .experience-warp {
    // margin: 20px;
    // padding: 10px 0;
  }
  .experience-content {
    min-height: 75px;
    margin-top: 20px;
    padding: 10px 10px 0;
    display: flex;
    border-radius: 9px;
    // background: rgba(49,71,99);
    .experience-items {
      margin-right: 5px;
    }
    :last-child {
      margin-right: 0;
    }
  }
  .measurement-content {
    min-height: 300px;
    padding: 10px;
    display: flex;
    // background: rgba(49, 71, 99);
  }
}
</style>
