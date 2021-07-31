<!-- -->
<template>
  <div class="choose-panel">
    <el-form
      ref="form"
      :model="form"
      inline
      class="app-form app-select"
      label-width="90px"
    >
      <el-form-item label="机队：">
        <el-popover
          placement="bottom"
          width="280"
          trigger="click"
          @hide="popoverHideHandle"
          v-model="show"
        >
          <template v-slot:reference>
            <el-input
              v-model="value"
              placeholder="请选择"
              :popper-class="popperClass"
              :clearable="true"
              readonly
            >
            <template v-slot:suffix>
              <div>
                  <i v-show="show" class="el-icon-circle-close" @click="clearSelect"></i>
                  <i :class="show ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
              </div>
            </template>
            </el-input>
          </template>
          <div>
            <div class="title">请选择查看机队</div>
            <div class="timeline">
              <el-timeline>
                <el-timeline-item
                  v-for="activity in activities"
                  :key="activity.officeId"
                  :color="'#fff'"
                  :hide-timestamp="true"
                >
                  <span @click="timeLineClickHandle(activity)">{{ activity.officeName }}</span>
                </el-timeline-item>
              </el-timeline>
            </div>
            <div class="buts">
              <template v-for="but in buttonList">
                <el-button
                  size="mini"
                  type="info"
                  :key="but.officeId"
                  @click="butClick(but)"
                  >{{ but.officeName }}</el-button
                >
              </template>
            </div>
          </div>
        </el-popover>
      </el-form-item>
      <slot></slot>
    </el-form>
  </div>
</template>

<script lang="ts">
import { Input, Timeline, TimelineItem, Button, Popover, Form, FormItem } from 'element-ui'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
export type FLEET = {
  allUserNum: number
  children: FLEET[]
  code: string
  officeEnName: string
  officeId: string
  officeName: string
  userHaveThis: true
}
// type Activ = {
//   content: string
// }
@Component({
  name: 'ChoosePanel',
  components: {
    [Input.name]: Input,
    [Timeline.name]: Timeline,
    [TimelineItem.name]: TimelineItem,
    [Button.name]: Button,
    [Popover.name]: Popover,
    [Form.name]: Form,
    [FormItem.name]: FormItem
  }
})
export default class extends Vue {
  @Prop({ default: () => ({}) }) readonly popperClass!: string
  @Prop({ default: () => [] }) buts!: FLEET[]

  @Watch('buts', { deep: true })
  butsChange (val:FLEET[]) :void {
    this.buttonList = val
  }

  @Watch('$route')
  routerChange () :void{
    this.show = false
  }

  private show = false

  private form = {
    fleet: ''
  }

  private buttonList:FLEET[] = []
  /**
   * @description: 用于回显input,无实际意义
  */
  private value = ''
  /**
   * @description: 用于返回给后台的值
  */
  private backToAdminValue = {}
  private valueList: string[] = []
  // content
  private activities: FLEET[] = []
  private full = false

  private clearSelect () {
    this.buttonList = this.buts
    this.full = false
    this.valueList = []
    this.activities = []
    this.value = ''
    this.backToAdminValue = {}
    this.$emit('clear')
    this.show = false
  }

  private butClick (but: FLEET) {
    if (this.full && this.valueList.indexOf(but.officeName) >= 0) { // 最后一级且值相同不处理
      return
    } else if (this.full && this.valueList.indexOf(but.officeName) < 0) { // 最后一集值不同替换最后一级
      this.valueList[this.valueList.length - 1] = but.officeName
      this.activities[this.activities.length - 1] = { ...but }
    } else { // 非最后一级处理
      this.valueList.push(but.officeName)
      this.activities.push({ ...but })
    }
    if (but.children.length <= 0) {
      this.full = true // 最后一级设置为 true
      setTimeout(() => {
        this.show = false
      }, 200)
    }
    this.value = this.valueList.join('·')
    this.backToAdminValue = but
    /**
     * @description: 用于更新btns列表
     */
    this.computedButtonList(but)
  }

  private computedButtonList (but: FLEET) {
    const children = but.children
    if (children && children.length !== 0) {
      this.buttonList = children
    }
  }

  private timeLineClickHandle (but: FLEET) {
    const { officeName } = but
    this.computedButtonList(but) // 修改buttonList
    const index = this.valueList.indexOf(officeName)
    const length = this.valueList.length
    if (index === length) return
    if (this.full && index !== this.valueList.length - 1) this.full = false // 在操作数据前进行判断
    this.valueList.splice(index + 1, length)
    this.activities.splice(index + 1, length)
    this.backToAdminValue = but
  }

  private popoverHideHandle () {
    this.$emit('select-blur', this.backToAdminValue)
  }
}
</script>

<style lang="scss" scoped>
.choose-panel {
  .timeline {
    text-align: left;
  }
  .app-form {
    padding: 10px;
    ::v-deep .el-input {
      height: 30px;
      line-height: 30px;
      background-color: $default-btn-bg;
      width: 260px;
      border-radius: 6px;
      .el-input__inner {
        height: 20px;
        line-height: 20px;
        width: 221px;
        background-color: $default-btn-bg;
        border: none;
        border-radius: 6px;
        padding-right: 0;
        letter-spacing: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        word-break: break-all;
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10+ and Edge */
        user-select: none; /* Standard syntax */
        color: #FFFFFF;
        font-weight: 500;
      }
    }
    .el-form-item {
      margin-bottom: 0;
    }
  }
}
.buts {
  display: flex;
  flex-wrap: wrap;
  text-align: left;
}
::v-deep .el-timeline {
  padding: 0;
  cursor: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
}
::v-deep .el-timeline-item__content {
  display: flex;
  align-items: flex-start;
  color: #fff;
  cursor: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
}
::v-deep .el-timeline-item__wrapper {
  padding-left: 18px;
  cursor: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  // top: -10px;
}
::v-deep .title {
  // padding: 5px 0;
  text-align: center;
  cursor: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
}
::v-deep .el-timeline-item {
  margin-left: 5px;
  padding: 5px;
  cursor: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
}
::v-deep .el-button {
  margin: 5px 5px 0 0;
}
::v-deep .el-button + .el-button {
  margin-left: 0;
}
</style>
