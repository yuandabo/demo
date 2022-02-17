<template>
  <div class="stepper">
    <div class="cart-decrease"
         @click.stop="decreaseCart">
      <button type="button"
              class="van-stepper__minus button"
              :disabled="countIsZero"></button>
    </div>
    <input v-if="showInput"
           ref="steInput"
           type="text"
           class="van-stepper__input input"
           v-model="inputValue"
           @input="input" />
    <div v-else
         class="bac-grey"
         @click.stop="divClick">{{currentStepper.count}}</div>
    <div class="cart-add"
         @click.stop="addCartNums">
      <button type="button"
              class="van-stepper__plus button"></button>
    </div>
  </div>
</template>

<script>
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'stepper-item',
  props: {
    currentStepper: {
      type: Object
    },
    countIsZero: {
      type: Boolean
    },
    // 是否显示input框
    showInput: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      inputValue: 0
    }
  },
  created () {
    this.inputValue = this.currentStepper.number
    this.input() // 初始化回显inputValue
  },
  methods: {
    input () {
      this.$emit('input', this.inputValue)
    },
    // 获取小数点后数字长度
    getAfterDotNums (val) {
      return String(val).substring(String(val).indexOf('.') + 1).length
    },
    decreaseCart () {
      // 如果input模式 修改不发请求，enter在发请求
      if (this.showInput) {
        const number = this.inputValue
        const length = this.getAfterDotNums(number)
        const POW = Math.pow(10, length)
        this.inputValue = (number * POW - POW * 1) / POW
        // 触发input事件
        this.input()
        return
      }
      // 抛出事件，父组件发修改请求
      this.$emit('decreaseCart')
    },
    addCartNums () {
      // 如果input模式 修改不发请求，enter在发请求
      if (this.showInput) {
        const number = this.inputValue
        const length = this.getAfterDotNums(number)
        const POW = Math.pow(10, length)
        this.inputValue = (number * POW + POW * 1) / POW
        this.input()
        return
      }
      this.$emit('addCartNums')
    },
    divClick () {
      this.$emit('divClick')
    }
  }
})
</script>

<style lang="scss" scoped>
.stepper {
  display: flex;
  justify-content: center;
  align-items: center;
  .cart-decrease {
    flex: 0;
  }
  .cart-add {
    flex: 0;
  }
  .input {
    flex: 1;
  }
  ::v-deep.van-stepper__plus,
  ::v-deep.van-stepper__minus {
    border-radius: 50%;
    background: #3a89fd;
    color: #ffffff;
  }
  ::v-deep.van-stepper__minus {
    background: #ffffff;
    color: #3a89fd;
    border: 1px solid #3a89fd;
  }
}
.button {
  width: 25px;
  height: 25px;
  font-size: 16px;
}
.input {
  height: 25px;
  width: 25px;
  font-size: 16px;
}
.bac-grey {
  height: 25px;
  width: 25px;
  line-height: 25px;
  text-align: center;
  background-color: #f2f3f5;
  font-size: 16px;
  color: #000;
  // font-weight: 500;
}
</style>
