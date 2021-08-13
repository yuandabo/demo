<template>
  <div ref="wrapper">
    <slot></slot>
  </div>
</template>
<script lang="ts">
import BScroll, { BScrollInstance, TranslaterPoint } from '@better-scroll/core'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
@Component({
  name: 'MyScroll'
})
export default class extends Vue {
  /**
   * 1 滚动的时候会派发scroll事件，会截流。
   * 2 滚动的时候实时派发scroll事件，不会截流。
   * 3 除了实时派发scroll事件，在swipe的情况下仍然能实时派发scroll事件
   */
  @Prop({ default: '' }) private probeType!: number
  /**
   * 点击列表是否派发click事件
   */
  @Prop({ default: false }) private click!: boolean
  /**
   * 是否开启横向滚动
   */
  @Prop({ default: false }) private scrollX!: boolean
  /**
   * 是否派发滚动事件
   */
  @Prop({ default: false }) private listenScroll!: boolean
  /**
   * 列表的数据
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Prop({ default: null, required: false }) private dataList!: Array<any>
  /**
   * 是否派发滚动到底部的事件，用于上拉加载
   */
  @Prop({ default: false }) private pullup!: boolean
  /**
   * 是否派发顶部下拉的事件，用于下拉刷新
   */
  @Prop({ default: false }) private pulldown!: boolean
  /**
   * 是否派发列表滚动开始的事件
   */
  @Prop({ default: false }) private beforeScroll!: boolean
  /**
   * 当数据更新后，刷新scroll的延时。
   */
  @Prop({ default: 500 }) private refreshDelay!: number

  private scroll:BScrollInstance|undefined

  private mounted () {
    // 保证在DOM渲染完毕后初始化better-scroll
    setTimeout(() => {
      this._initScroll()
    }, 200)
  }

  private _initScroll () {
    if (!this.$refs.wrapper) {
      return
    }
    // better-scroll的初始化
    this.scroll = new BScroll(this.$refs.wrapper as HTMLElement, {
      probeType: this.probeType,
      click: this.click,
      scrollX: this.scrollX,
      bounce: {
        top: this.pulldown,
        bottom: false,
        left: false,
        right: false
      },
      bounceTime: 500,
      outOfBoundaryDampingFactor: 0.3,
      swipeBounceTime: 200
    })

    // 是否派发滚动事件
    if (this.listenScroll) {
      this.scroll.on('scroll', (pos:TranslaterPoint) => {
        this.$emit('scroll', pos)
      })
    }

    // 是否派发滚动到底部事件，用于上拉加载
    if (this.pullup) {
      this.scroll.on('scrollEnd', () => {
        // 滚动到底部
        if ((this.scroll as BScrollInstance).y <= ((this.scroll as BScrollInstance).maxScrollY + 50)) {
          this.$emit('scrollToEnd')
        }
      })
    }

    // 是否派发顶部下拉事件，用于下拉刷新
    if (this.pulldown) {
      this.scroll.on('touchEnd', (pos:TranslaterPoint) => {
        // 下拉动作
        if (pos.y > 50) {
          this.$emit('pulldown')
        }
      })
    }

    // 是否派发列表滚动开始的事件
    if (this.beforeScroll) {
      this.scroll.on('beforeScrollStart', () => {
        this.$emit('beforeScroll')
      })
    }
  }

  private disable () {
    // 代理better-scroll的disable方法
    this.scroll && this.scroll.disable()
  }

  private enable () {
    // 代理better-scroll的enable方法
    this.scroll && this.scroll.enable()
  }

  private refresh () {
    // console.log('scroll-refresh')
    // 代理better-scroll的refresh方法
    this.scroll && this.scroll.refresh()
  }

  // private scrollTo () {
  //   // 代理better-scroll的scrollTo方法
  //   this.scroll && this.scroll.scrollTo.apply(this.scroll)
  // }

  // private scrollToElement () {
  //   // 代理better-scroll的scrollToElement方法
  //   this.scroll && this.scroll.scrollToElement.apply(this.scroll, arguments)
  // }

  // 监听数据的变化，延时refreshDelay时间后调用refresh方法重新计算，保证滚动效果正常
  @Watch('dataList', { deep: true })
  onDataListChange () :void {
    setTimeout(() => {
      this.refresh()
    }, this.refreshDelay)
  }
}
</script>
