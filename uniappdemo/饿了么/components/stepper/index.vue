<template>
  <div>
    <div v-if="countIsZero">
      <button class="van-button van-button--info van-button--normal"
              round
              type="info"
              size="small"
              @click.stop="addCart">加入清单</button>
    </div>
    <!-- inputChange 内部input事件，  divClick-内部click事件-->
    <stepper-item v-else
                  :currentStepper="currentStepper"
                  :countIsZero="countIsZero"
                  @decreaseCart="decreaseCart"
                  @addCartNums="addCartNums"
                  @divClick="$emit('divClick')" />
  </div>
</template>

<script>
import stepperItem from './stepper-item'
export default {
  name: 'stepper',
  components: {
    stepperItem
  },
  props: {
    currentStepper: {
      type: Object
    }
  },
  data () {
    return {
    }
  },
  computed: {
    countIsZero () {
      if (!this.currentStepper.hasOwnProperty('count')) {
        return false
      }
      return this.currentStepper.count === 0
    }
  },
  methods: {
    addCart () {
      this.addCartNums()
      console.log(123)
    },
    addCartNums () {
      this.$emit('addCartNums')
    },
    decreaseCart () {
      this.$emit('decreaseCart')
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/index.scss";
.stepper {
  /deep/.van-stepper__plus,
  /deep/.van-stepper__minus {
    border-radius: 50%;
    background: #3a89fd;
    color: #ffffff;
  }
  /deep/.van-stepper__minus {
    background: #ffffff;
    color: #3a89fd;
    border: 1px solid #3a89fd;
  }
}
</style>
