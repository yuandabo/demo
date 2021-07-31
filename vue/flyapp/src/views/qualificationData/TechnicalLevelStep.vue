<template>
  <div>
    <div class="technical-level-step">
      <div
        style="flex:1"
        v-for="(step, index) in stepList"
        :key="step.index"
        @click="handleStep(step)"
      >
        <div class="step-header">
          <div
            class="step__circle"
            :class="{
              'active-circle': isActive(step),
              step__circle__disable: !step.clickAble
            }"
          >
            <i
              v-if="isShowIcon(step.index)"
              class="el-icon-check circle__icon"
            ></i>
          </div>
          <i
            class="step__line-inner-nolmal"
            :style="lineIndexStyle(index)"
            :class="{
              'active-line': step.clickAble,
              'center-line': isActiveLastItem(step.techNo)
            }"
          ></i>
        </div>
        <div class="step-main">
          <div
            class="nolmal-title"
            :class="{ 'suceess-title': step.clickAble }"
          >
            {{ step.techNo }}
          </div>
        </div>
      </div>
    </div>
    <Divider :margin="'10px 0 0 0'"></Divider>
  </div>
</template>

<script lang="ts">
import { Message } from 'element-ui'
import { Component, Vue, Prop } from 'vue-property-decorator'
import Divider from '@/components/Divider/index.vue'
type StepItem = {
  techNo: string
  index: number
  clickAble: boolean
}
type Tech = {
  startTime: number | null
  endTime: number | null
  techNo: string
}
@Component({
  name: 'Home',
  components: {
    Divider
  }
})
export default class extends Vue {
  @Prop() currenStepList: any

  private get stepList (): StepItem[] {
    const { levelList, personalLevel } = this.currenStepList
    if (levelList) {
      return levelList.map((v: string, index: number) => ({
        techNo: v,
        index: index,
        clickAble: personalLevel.some((tech: Tech) => tech.techNo === v),
        info: personalLevel.filter((tech: Tech) => tech.techNo === v)[0]
      }))
    }
    return []
  }

  private active: number[] = [] // 记录当前活跃step的index
  private activeStepList:StepItem[] = [] // 记录当前活跃step的信息

  private isShowIcon (index: number) {
    return this.active.indexOf(index) >= 0
  }

  /**
   * @description: step高亮计算规则：根据 index 进行比较，active 存首尾index，比较规则为 compare, 获取step数据时应先初始化 index
   * @param {*} step
   * @return {*}
   */
  private handleStep (step: StepItem) {
    if (!step.clickAble) {
      Message.warning('当前暂未达到该阶段。')
      return
    }
    const index = step.index
    const { length } = this.active
    if (length === 0) {
      this.active.push(index)
      this.activeStepList.push(step)
    } else if (length === 1) {
      this.insertActive(step)
    } else if (length === 2) {
      this.replaceActive(step)
    } else {
      Error('程序异常联系管理员')
    }
    if (this.active.length === 2) this.$emit('step-change', this.activeStepList)
  }

  private replaceActive (step: StepItem) {
    const { index } = step
    const findIndex = this.active.indexOf(index)
    if (findIndex >= 0) {
      this.active.splice(findIndex, 1)
      this.activeStepList.splice(findIndex, 1)
    } else {
      this.compare(index, this.active)
      this.insertActive(step)
    }
  }

  /**
   * @description: 计算步长，返回步长短的
   */
  private compare (index: number, arr: number[]) {
    const addressFirst = Math.abs(arr[0] - index)
    const addressEnd = Math.abs(arr[1] - index)
    const spliceNum = addressFirst > addressEnd ? 1 : 0
    this.active.splice(spliceNum, 1)
    this.activeStepList.splice(spliceNum, 1)
  }

  private insertActive (step: StepItem) {
    const { index } = step
    const findIndex = this.active.indexOf(index)
    if (findIndex >= 0) {
      this.active.splice(findIndex, 1)
      this.activeStepList.splice(findIndex, 1)
      return
    }
    if (index > this.active[0]) {
      this.active.push(index)
      this.activeStepList.push(step)
    } else {
      this.active.unshift(index)
      this.activeStepList.unshift(step)
    }
  }

  private isActive (step: StepItem): boolean {
    const index = step.index
    const min = this.active[0]
    const max = this.active[1]
    if (index === min || index === max) return true
    if (index > min && index < max) return true
    return false
  }

  private lineIndexStyle (index: number) {
    if (index === this.stepList.length - 1) {
      return {
        width: '50%',
        right: '50%'
      }
    }
    if (index === 0) {
      return {
        width: '50%',
        left: '50%'
      }
    }
    return {}
  }

  private isActiveLastItem (techNo: string) {
    const { personalLevel } = this.currenStepList
    return personalLevel[personalLevel.length - 1].techNo === techNo
  }
}
</script>

<style lang="scss" scoped>
@mixin step-title {
  display: inline-block;
  margin: 10px 0;
  padding: 5px 10px;
  position: relative;
  // left: -50%;
  text-align: center;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
  color: #ffffff;
  line-height: 20px;
  letter-spacing: 1px;
  // cursor: pointer;
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10+ and Edge */
  user-select: none; /* Standard syntax */
}
.technical-level-step {
  display: flex;
  .nolmal-title {
    @include step-title;
    background: #bcc3cc;
    color: #1b385b;
  }
  .suceess-title {
    background: #2c79de;
    color: $default-font-color;
  }
  .step-header {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    text-align: center;
    .step__circle {
      position: relative;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      z-index: 1;
      width: 24px;
      height: 24px;
      font-size: 14px;
      box-sizing: border-box;
      background: #fff;
      transition: 0.15s ease-out;
      .circle-icon {
        color: #315677;
        font-size: 18px;
        font-weight: 800;
      }
    }
    .step__circle__disable {
      background: #bcc3cc;
    }
    .active-circle {
      background: #2bd69b;
    }
    .step__line-inner-nolmal {
      position: absolute;
      display: block;
      border: 4px solid;
      border-color: inherit;
      transition: 0.15s ease-out;
      box-sizing: border-box;
      width: 100%;
      z-index: -1;
    }
    .active-line {
      border-color: #2c79de;
    }
    .center-line {
      width: 110%;
      left: 0;
      right: 0;
      border-radius: 0 20px 20px 0;
      z-index: 0;
    }
    .first-line {
      width: 50%;
      left: 50%;
    }
    .last-line {
      width: 50%;
      right: 50%;
    }
  }
  .step-main {
    text-align: center;
    .step__title {
      @include step-title;
      background: #bcc3cc;
      color: #1b385b;
    }
  }
}
</style>
