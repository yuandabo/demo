<template>
  <div class="cartcontrol">
    <div v-show="!isZero"
         ref="dec"
         class="cart-decrease"
         @click.stop="decreaseCart">
      <image :src="getIcon('dec')"
             size="25" />
    </div>
    <div v-show="!isZero"
         ref="count"
         class="cart-count">{{ food.count }}</div>
    <div class="cart-add"
         @click.stop="addCart">
      <image :src="getIcon('add')"
             size="25" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'cartcontrol',
  props: {
    food: {
      type: Object
    }
  },
  data () {
    return {
      // isZero: true
    }
  },
  computed: {
    isZero () {
      return this.food.count === 0
    }
  },
  methods: {
    // getDecIcon () {
    //   let name = this.food.count > 0 ? 'dec' : 'whitedec'
    //   return `img/${name}.png`
    // },
    getIcon (name) {
      return `/static/img/${name}.png`
    },
    addCart (event) {
      if (this.isZero) {
        this.$refs.count.className = 'cart-count'
        this.$refs.dec.className = 'cart-decrease'
        // this.isZero = false
      }
      this.$emit('foodAdd', { food: this.food, target: event.target })
    },
    decreaseCart () {
      if (this.food.count - 1 === 0) {
        this.$refs.count.className = 'widthDec'
        this.$refs.dec.className = 'decHide'
        setTimeout(() => {
          // this.isZero = true
          this.$refs.dec.className = 'display-none'
          this.$refs.count.className = 'display-none'
        }, 500)
      }
      this.$emit('foodDec', this.food)
    }
  }
}
</script>

<style lang="scss" scoped>
		@import '@/assets/index.scss';
.cartcontrol {
  image {
    width: 25px;
    height: 25px;
  }
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  // align-items: center;
  /deep/.van-icon {
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
    // background-color: #f2f3f5;
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
