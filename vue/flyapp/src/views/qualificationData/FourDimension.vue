<template>
  <div class="BarAndTable">
    <template v-for="compon in componentList">
      <template v-if="compon.moduleId === 'Divider'">
        <Divider
          :margin="'0'"
          :key="compon.moduleId"
          :direction="'column'"
        ></Divider>
      </template>
      <component
        :dateForm="dateForm"
        v-else
        :module="compon"
        :key="compon.moduleId"
        :is="radarTableDict[compon.moduleId]"
      ></component>
    </template>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import FourDimensionRadar from './components/FourDimensionRadar.vue'
import FourDimensionTable from './components/FourDimensionTable.vue'
import Divider from '@/components/Divider/index.vue'
import { Time, APP_MODULE_INFO_ITEM } from '@/utils/types'
import { RADARORTABLE } from '@/dict/qualification-data'
@Component({
  name: 'BarAndTable',
  components: {
    FourDimensionRadar,
    FourDimensionTable,
    Divider
  }
})
export default class extends Vue {
  @Prop() readonly dateForm!: Time
  @Prop({ default: () => ({}) }) readonly compon!: APP_MODULE_INFO_ITEM // 模块信息
  @Prop() radarAndTableModuleInfo!: APP_MODULE_INFO_ITEM[]

  private get componentList () {
    const arr: APP_MODULE_INFO_ITEM[] = this.radarAndTableModuleInfo
    arr.splice(1, 0, {
      moduleId: 'Divider'
    } as APP_MODULE_INFO_ITEM)
    return arr
  }

  private get radarTableDict () {
    return RADARORTABLE()
  }
}
</script>

<style lang="scss" scoped>
.BarAndTable {
  height: 400px;
  display: flex;
  flex: 1;
  align-items: flex-start;
}
</style>
