<!-- 机队与日期筛选-管理版 -->
<template>
  <div class="form-manageVersion" v-loading="loading">
    <ChoosePanel
      :buts="officeList"
      @clear="panelClear"
      @select-blur="panelBlur"
      ref="panel"
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
  </div>
</template>

<script lang="ts">
import { Form, FormItem, Select, Option } from 'element-ui'
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import DateChoose, { Tag } from '@/components/Choose/index.vue'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import ChoosePanel, { FLEET } from '@/components/ChoosePanel/index.vue'
import { getUserTypeCode } from '@/env'
import { MODULEIDLIST } from '@/dict/interface'
import { Time } from '@/utils/types'
import { TranslaterPoint } from '@better-scroll/core'
type FLIGHTFORMRES = {
  fleet: FLEET[]
  date: Time[]
}
@Component({
  name: 'FormManageVersion',
  components: {
    DateChoose,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Select.name]: Select,
    [Option.name]: Option,
    ChoosePanel
  }
})
export default class extends Vue {
  @Prop() pos!:TranslaterPoint

  @Watch('pos', { deep: true })
  poChange ():void {
    const { panel } = (this.$refs as any)
    if (panel.show) panel.show = false
  }

  private loading = false
  private officeList: FLEET[] = []

  private dateTagsList: Time[] = []

  private dateActiveChange (data: Tag): void {
    this.$emit('date-change', data)
  }

  private officeChange (data: FLEET) {
    this.$emit('office-change', data)
  }

  private mounted (): void {
    this.getTimeList()
  }

  private getTimeList () {
    const userCode = getUserTypeCode()
    const list = MODULEIDLIST()
    appPost(HOME.INIT, {
      moduleId: list[userCode as 'MANAGE' | 'PERSONAL'].HOME
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: FLIGHTFORMRES | any) => {
        // console.log('FormManageVersion', res)
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

  private panelClear () {
    this.officeChange({} as FLEET)
  }

  private panelBlur (val: FLEET) {
    this.officeChange(val)
  }
}
</script>
