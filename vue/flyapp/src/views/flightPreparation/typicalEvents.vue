<template>
  <div class="typical">
    <div v-if="module.name" class="app-divider">
      <span>{{ module.name }}</span>
    </div>
    <div class="typical-content" v-for="(item, index) of list" :key="index">
      {{ item }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { FormData } from './screenForm.vue'
import { APP_MODULE_INFO_ITEM } from '@/utils/types'
@Component({
  name: 'TypicalEvents',
  components: {
  }
})
export default class extends Vue {
  @Prop() formData?: FormData
  @Prop() module?: APP_MODULE_INFO_ITEM

  @Watch('formData', { deep: true })
  formDataChange () :void{
    this.getTypicalEvents()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private list: string[] = []

  private getTypicalEvents () {
    appPost(HOME.TYPICALOVRRUNEVENTS, {
      moduleId: this.module?.moduleId,
      ...this.formData
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res:any) => {
        // // console.log('TypicalOverrunEvent', res)
        this.list = res
      })
      // .finally(() => {})
  }

  private created ():void {
    this.getTypicalEvents()
  }
}
</script>

<style lang="scss">
.typical {
  margin: 10px;
  padding-bottom: 20px;
  .app-divider {
    height: 21px;
    line-height: 21px;
    display: table;
    white-space: nowrap;
    text-align: center;
    background: 0 0;
    font-weight: 600;
    width: 50%;
    margin: 16px auto;
    color: #FAFCFC;
    font-size: 15px;
    span {
      padding: 0 20px;
      font-size: 15px;
      color: rgba(250, 252, 252, 1);
      font-weight: bold;
    }
    &:before {
      content: "";
      display: table-cell;
      // position: relative;
      top: 50%;
      width: 50%;
      border-top: 2px solid rgba(250, 252, 252, 0.3);
      transform: translateY(50%);
    }
    &:after {
      content: "";
      display: table-cell;
      // position: relative;
      top: 50%;
      width: 50%;
      border-top: 2px solid rgba(250, 252, 252, 0.3);
      transform: translateY(50%);
    }
  }
  .typical-content {
    background-color: $module-bg;
    padding: 20px;
    font-weight: bold;
    line-height: 23px;
    overflow: hidden;
    transition: all .5s ease-in-out;
    color: #C7CBD2;
    font-size: 14px;
    &:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    &:nth-child(2) {
      border-radius: 10px 10px 0 0;
    }
    &:last-child {
      border-radius: 0 0 10px 10px;
    }
  }
}
</style>
