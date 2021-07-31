<!-- 航前准备--个人版 -->
<template>
  <div>
    <Nav :content="$t(`title.${title}`)"
         @leftIcon-click="$router.go(-1)" />
    <div class="periodic-summary-page"
         v-loading="loading">
      <screen-form :moduleId="moduleId"
                   @form-change="formChangeHandle" />
      <topic :moduleList="topicModuleList"
             :formData="screenForm" />
      <typical-events :module="typicalModule"
                      :formData="screenForm" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ScreenForm, { FormData } from './screenForm.vue'
import Topic from './topic.vue'
import TypicalEvents from './typicalEvents.vue'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { APP_MODULE_INFO_ITEM } from '@/utils/types'
import { MODULEINFO, TOPIC_MODULELIST } from '@/dict/flight-preparation'
import Nav from '@/components/Nav/index.vue'
// todo any类型的需要设置正确的interface
@Component({
  name: 'Flight-perparation',
  components: {
    ScreenForm,
    Topic,
    TypicalEvents,
    Nav
  }
})
export default class extends Vue {
  private loading = false
  private screenForm: FormData = {
    runway: '',
    airPort: '',
    actype: '',
    flightPhase: '',
    transfiniteType: '',
    date: '',
    startTime: null,
    endTime: null
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

  private get topicModuleList () {
    return this.componentList.filter((v) => TOPIC_MODULELIST().indexOf(v.moduleId) > -1)
  }

  private get typicalModule () {
    const arr = this.componentList.filter((v) => v.moduleId === 'APP_PERSONAL:typicalAirportOverrunEvents')
    if (arr.length > 0) return arr[0]
    return {}
  }
  /**
   */

  private get moduleId () {
    return this.$route.params.moduleId
  }

  private get title () {
    return (this.$route.meta as any).title
  }

  private mounted (): void {
    this.getModuleInfo()
  }

  private getModuleInfo () {
    appPost(HOME.MODULE_INFO, {
      moduleId: this.moduleId
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        // console.log('Flight-perparation', res)
        const list: APP_MODULE_INFO_ITEM[] = res as APP_MODULE_INFO_ITEM[]
        this.resComponents = list
      })
  }

  private formChangeHandle (val: FormData) {
    this.screenForm = val
  }
}
</script>

<style lang="scss" scoped>
.periodic-summary-page {
  height: calc(100vh - 69px);
  overflow: auto;
}
</style>
