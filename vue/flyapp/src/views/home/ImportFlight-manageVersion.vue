<!-- 重点航班-管理版 -->
<template>
  <div class="ImportFlight">
    <ModuleTitle :title="compon.name" :module="false">
      <div class="experience-content" slot="content" :style="{ background: background }">
        <ExperienceItems
          v-for="item in dataList"
          :key="item.name"
          :iconUrl="item.iconUrl"
          :title="item.name"
          :value="item.value"
          :unit="item.unit"
          :isPointer="true"
          :titleOpacity=".8"
          :itemsBackground="'#3a5575'"
          @item-click="routerToDetail(item)"
        ></ExperienceItems>
      </div>
    </ModuleTitle>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import ModuleTitle from '@/views/components/HomeModule.vue'
import ExperienceItems from '@/views/components/ExperienceItems.vue'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { APP_MODULE_INFO_ITEM, Time } from '@/utils/types'
interface ExperienceItem {
  iconUrl: string
  name: string
  value: string
  unit?: string
  field: string
}
@Component({
  name: 'ImportFlight',
  components: {
    ModuleTitle,
    ExperienceItems
  }
})
export default class extends Vue {
  @Prop({ default: () => ({}) }) readonly compon!: APP_MODULE_INFO_ITEM // 模块信息
  @Prop() formDate! :Time
  @Watch('compon', { deep: true })
  componChange () :void {
    this.getList()
  }

  @Watch('formDate', { deep: true })
  formDateChange () :void {
    this.getList()
  }

  private background = 'rgba(49,71,99)'
  private loading = false
  private dataList: ExperienceItem[] = []

  private created ():void {
    this.getList()
  }

  private getList () {
    // this.loading = true
    appPost(HOME.MANAGEKEYFLIGHTS, { ...this.formDate })
      .then((res: unknown) => {
        // console.log('keyFlights', res)
        this.dataList = res as ExperienceItem[]
      })
      .catch(() => {
        this.dataList = []
      })
      .finally(() => {
        this.loading = false
        this.background = 'transparent'
      })
  }

  private routerToDetail (val:ExperienceItem) {
    const { field } = val
    const params = {
      startTime: this.formDate.startTime,
      endTime: this.formDate.endTime,
      field: field,
      fleetId: this.formDate.fleetId as string
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.$router.push({ name: 'FilghtDetail', params: params as any })
  }
}
</script>
<style lang="scss" scoped>
.ImportFlight {
  .experience-content {
    margin: 12px 20px;
    display: flex;
    flex-wrap: wrap;
    border-radius: 9px;
    // background: rgba(49,71,99);
    .experience-items {
      width: calc(25% - 20px);
      margin: 10px;
      box-sizing: border-box;
    }
  }
}
</style>
