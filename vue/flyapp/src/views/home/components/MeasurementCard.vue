<template>
  <div class="MeasurementCard">
    <div class="title">{{name}}</div>
    <MyScroll ref="scroll1" v-if="noData" class="content-box" :probeType="3" :beforeScroll="true" @beforeScroll="scrollHandle">
      <div>
        <MyScroll class="box" :scrollX="true" :class="getBoxClass(box.value)" v-for="(box, index) in boxList" :key="index" :click="true">
          <div style="display:inline-block;cursor:pointer;" @click="$emit('item-click')">
            <span v-if="showIcon(box.field)">
            <i class="el-icon-warning warning-icon"></i>
            </span>
            <span>{{box}}</span>
            <!-- <span>{{box.value}}{{box.unit}}</span> -->
          </div>
        </MyScroll>
      </div>
    </MyScroll>
    <NoData v-else></NoData>
  </div>
</template>

<script lang="ts">
import MyScroll from '@/components/MyScroll/index.vue'
import { Vue, Component, Prop } from 'vue-property-decorator'
import NoData from '@/components/NoData/index.vue'
export type BoxItem = {
  field:string
  value:string
  unit:string
}
@Component({
  name: 'MeasurementCard',
  components: {
    MyScroll,
    NoData
  }
})
export default class extends Vue {
  @Prop({ default: '', required: true }) private name!: string
  @Prop({ default: () => [], required: true }) private boxList!: BoxItem[]
  @Prop({ default: null }) readonly scroll!: any

  private timeout: any = null

  private getBoxClass (value:string) :string {
    return value !== '' ? 'nolmal-box' : 'warnning-box'
  }

  private showIcon (val:string) {
    return [''].indexOf(val) >= 0
  }

  private get noData () {
    return this.boxList.length > 0
  }

  // private activated () {
  //   /* istanbul ignore next */
  //   const { scroll1 } = this.$refs
  //   scroll1.scroll.enable()
  // }

  // private deactivated () {
  //   /* istanbul ignore next */
  //   const { scroll1 } = this.$refs
  //   scroll1.scroll.disable()
  // }

  private scrollHandle () {
    this.scroll.scroll.disable()
    if (this.timeout !== null) clearTimeout(this.timeout)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    this.timeout = setTimeout(() => {
      // console.log(123132)
      _this.scroll.scroll.enable()
    }, 1000)
  }
}
</script>

<style lang="scss" scoped>
.MeasurementCard {
  min-width: 0;
  text-align: center;
  margin-right: 5px;
  border-radius: 9px;
  height: 300px;
  background-color: rgb(58,85,117);
  &:last-child{
    margin-right: 0;
  }
  .title{
    padding: 20px 0;
    font-size: 14px;
    font-weight: 600;
    color: #FFFFFF;
    line-height: 20px;
    letter-spacing: 1px;
  }
  .content-box{
    height: 220px;
    // overflow-y: auto;
    overflow: hidden;
    text-align: center;
    margin: 0px 10%;
    box-sizing: border-box;
    .box{
      color: #FFFFFF;
      letter-spacing: 1px;
      font-size: 14px;
      .warning-icon{
        margin-right: 5px;
        color: #FF8D57;
        font-size: 16px;
      }
    }
    .nolmal-box{
      margin-bottom: 20px;
      padding: 15px;
      background: #296A8C;
      border-radius: 6px;
      font-weight: 600;
    }
    .warnning-box{
      padding-bottom: 18px;
      font-weight: 400;
      white-space:nowrap;
      overflow: hidden;
      width: 90%;
    }
  }
}
</style>
