<template>
  <el-form :model="formData" class="app-form" label-width="72px" size="mini">
    <div class="form">
      <div
        v-for="item of formItem"
        :key="item.prop"
        :style="{width: item.width}"
      >
        <el-form-item :label="`${item.label}：`" :label-width="item.labelWidth">
          <!--    机场    -->
          <airport-select
            v-if="item.type === 'airPort'"
            :airports="item.data"
            v-model="formData[item.prop]"
            @change="airPortChange"
          ></airport-select>
          <!-- select  -->
          <el-select
            v-else-if="item.type === 'select'"
            v-model="formData[item.prop]"
            size="mini"
            class="app-select"
            placeholder=""
            popper-class="pd-select app-select-popper"
            @change="(val) => $emit('form-change', formData)"
          >
            <el-option
              v-for="(option, index) of item.data"
              :key="index"
              :label="option"
              :value="option"
            ></el-option>
          </el-select>
          <Choose
            v-else-if="item.type === 'radio'"
            :pad="'0'"
            :center="'flex-start'"
            :radioProp="item.prop"
            :tagsList="item.data"
            :nameKey="item.nameKey"
            :fontWeight="400"
            @active-change="selectChange"
          />
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Form, FormItem, Select, Option, Row, Col } from 'element-ui'
import AirportSelect from './components/airportSelect.vue'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import Choose, { Tag } from '@/components/Choose/index.vue'
interface OptionData {
  aptIcao: string
  aptIata: string
  aptName: string
}
interface SeletctOption {
  name: string
  id: string
}
interface TimeSelectOption {
  name: string
  startTime: string
  endTime: string
}
interface FlyAndIniteOpton {
  name: string
  value: string
}
interface FlightFormItem {
  label: string
  type: 'select' | 'radio' | 'airPort'
  prop: string
  data: OptionData[] | SeletctOption[] | TimeSelectOption[] | FlyAndIniteOpton[]
  width?: string
  labelWidth?: number | string,
  nameKey?: string
}
export type FormData = {
  airPort: string
  runway: string
  actype?: string
  flightPhase: string
  transfiniteType: string
  startTime?: number | null
  endTime?: number | null
  date: string
}
@Component({
  name: 'ScreenForm',
  components: {
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Select.name]: Select,
    [Option.name]: Option,
    [Row.name]: Row,
    [Col.name]: Col,
    AirportSelect,
    Choose
  }
})
export default class extends Vue {
  @Prop() moduleId!: string

  private runwayList = []
  private formItem: FlightFormItem[] = [
    {
      label: '机场',
      type: 'airPort',
      prop: 'airPort',
      data: [],
      labelWidth: '88px',
      width: '26%'
    },
    {
      label: '跑道',
      type: 'select',
      prop: 'runway',
      data: [],
      labelWidth: '98px',
      width: '37%'
    },
    {
      label: '机型',
      type: 'radio',
      prop: 'actype',
      data: [],
      labelWidth: '60px',
      nameKey: 'actypeName',
      width: '37%'
    },
    {
      label: '飞行阶段',
      type: 'radio',
      prop: 'flightPhase',
      data: [],
      labelWidth: '88px',
      width: '26%'
    },
    {
      label: '超限率类型',
      type: 'radio',
      prop: 'transfiniteType',
      data: [],
      labelWidth: '98px',
      width: '37%'
    },
    {
      label: '日期',
      type: 'radio',
      prop: 'date',
      data: [],
      labelWidth: '60px',
      width: '37%'
    }
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formData: FormData = {
    runway: '',
    airPort: '',
    actype: '',
    flightPhase: '',
    transfiniteType: '',
    startTime: null,
    endTime: null,
    date: ''
  }

  private mounted (): void {
    this.getSelectList()
  }

  private getSelectList () {
    appPost(HOME.INIT, {
      moduleId: this.moduleId
    })
      .then((res: any) => {
        const formItemList = this.formItem
        // console.log('screenForm', res)
        const { runway } = res
        this.runwayList = runway
        let runwayList:any[] = []
        for (const key in runway) {
          const element = runway[key]
          runwayList = runwayList.concat(element)
        }
        for (const key in formItemList) {
          const element = formItemList[key]
          if (element.prop === 'runway') {
            element.data = runwayList
          } else if (element.prop === 'actype') {
            element.data = res.personalActype
          } else {
            element.data = res[element.prop]
          }
        }
      })
    // .finally(() => {})
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private selectChange (item: Tag, prop:string) {
    // console.log(item, prop)
    if (prop === 'date') {
      this.formData.startTime = item.startTime
      this.formData.endTime = item.endTime
    } else if (prop === 'actype') {
      this.formData.actype = item.actypeId
    } else {
      (this.formData as any)[prop as keyof FormData] = item.value
    }
    this.$emit('form-change', this.formData)
  }

  private airPortChange (val:string) {
    // 筛选跑道
    const runwayData = this.formItem.filter(v => v.prop === 'runway')
    if (val in this.runwayList) {
      runwayData[0].data = this.runwayList[val as any]
    } else {
      runwayData[0].data = []
    }
    this.$emit('form-change', this.formData)
  }
}
</script>
<style lang="scss" scoped>
.app-form {
  padding: 10px;
  .form{
    display: flex;
    flex-wrap: wrap;
  }
}
::v-deep .el-select{
  width: 100px;
}
.pd-select {
  width: 90px !important;
  .el-select-dropdown__item.hover,
  .el-select-dropdown__item:hover {
    background-color: transparent;
  }
}
</style>
