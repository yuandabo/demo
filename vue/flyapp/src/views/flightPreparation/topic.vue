<template>
  <div class="topic-wrap">
    <div class="top-content" v-for="(item, index) of topicData" :key="item.moduleId + index">
      <div class="title">{{ item.name }}</div>
      <top-line v-for="(it, index) of item.list" :key="it.eventNo" :color="colorList[index]" :data="it" :index="index"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Row, Col } from 'element-ui'
import TopLine from './components/topLine.vue'
import { appPost } from '@/request/index'
import { FLIGHTPREPARATION } from '@/request/urls'
import { FormData } from './screenForm.vue'
import { APP_MODULE_INFO_ITEM } from '@/utils/types'
export interface TopicItem {
  index: number
  eventName: string
  num: number
  percentage: number
}
interface topicDataType {
  name: string
  list: TopicItem[]
}
@Component({
  name: 'Topic',
  components: {
    [Row.name]: Row,
    [Col.name]: Col,
    TopLine
  }
})
export default class extends Vue {
  @Prop() formData?: FormData
  @Prop() moduleList!: APP_MODULE_INFO_ITEM[]

  @Watch('formData', { deep: true })
  formDataChange ():void {
    this.getList()
  }

  private colorList: string[] = ['#EA4025', '#F68000', '#31AF0B']
  private topicData: topicDataType[] = []

  private mounted ():void {
    this.getList()
  }

  private getList () {
    appPost(FLIGHTPREPARATION.TOPEVENT, {
      ...this.formData
    })
      .then((res: any) => {
        // console.log('topic', res)
        this.topicData = res
      })
  }
}
</script>
<style lang="scss" scoped>
.topic-wrap {
  height: 379px;
  margin: 10px;
  display: flex;
  flex-wrap: wrap;
  .top-content {
    background: rgba(0, 0, 0, 0.2);
    padding: 10px;
    border-radius: 10px;
    margin: 5px;
    flex: auto;
    min-width: 300px;
    .title {
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      margin: 16px;
      color: #FAFCFC;
    }
  }
}
</style>
