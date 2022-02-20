<template>
  <div class="cartcontrol">
    <div v-show="!isZero"
         ref="dec"
         class="cart-decrease"
         @click.stop="decreaseCart">
      <Icon :name="getIcon('dec')"
                size="25" />
    </div>
    <div v-show="!isZero"
         ref="count"
         class="cart-count">{{ props.food.count }}</div>
    <div class="cart-add"
         @click.stop="addCart">
      <Icon :name="getIcon('add')"
                size="25" />
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed, getCurrentInstance } from 'vue'
import { Icon } from 'vant'
  
const {proxy} = getCurrentInstance()

const props = defineProps({
  food: Object
})
const isZero =  computed(() => props.food.count === 0)
const getIcon = function (name) {
    return `img/${name}.png`
}
function addCart(event) {
    if (isZero) {
      proxy.$refs.count.className = 'cart-count'
      proxy.$refs.dec.className = 'cart-decrease'
    }
    proxy.$emit('foodAdd', { food: props.food, target: event.target })
}
const decreaseCart = function () {
    if (props.food.count - 1 === 0) {
      proxy.$refs.count.className = 'widthDec'
      proxy.$refs.dec.className = 'decHide'
      setTimeout(() => {
        proxy.$refs.dec.className = 'display-none'
        proxy.$refs.count.className = 'display-none'
      }, 500)
    }
    proxy.$emit('foodDec', props.food)
}
</script>

<style lang="scss" scoped>
.cartcontrol {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  :deep(.van-icon) {
    display: flex;
    align-items: center;
    justify-items: center;
  }
  .cart-decrease {
    flex: 0;
  }
  .cart-count {
    height: 1.25rem;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
  }
  .cart-add {
    flex: 0;
  }
}
// 减少按钮动画
@keyframes myfirst {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.decHide {
  animation: myfirst 1s;
}
// 显示框动画
@keyframes widthToZero {
  from {
    width: 100%;
  }
  to {
    width: 0%;
    display: none;
  }
}
.widthDec {
  animation: widthToZero 1s;
}
.display-none {
  display: none;
}
</style>
