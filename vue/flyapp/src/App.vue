<template>
  <div class="app">
    <transition :name="transitionName">
      <keep-alive>
        <router-view />
      </keep-alive>
    </transition>
  </div>
</template>

<script lang="ts">
// https://github.com/vuejs/vue-router/blob/next/examples/transitions/app.js
import { Route } from 'vue-router'
import { Vue, Component, Watch } from 'vue-property-decorator'
@Component({
})
export default class extends Vue {
  private transitionName = ''
  @Watch('$route')
  routerChange (to: Route, from: Route): void {
    if (to.path === '/' && from.path === '/') return
    if (to.path === '/' && from.path !== '') {
      this.transitionName = 'slide-right'
    } else {
      const toDepth = to.path.split('/').length
      const fromDepth = from.path.split('/').length
      this.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
    }
  }
}
</script>

<style lang="scss" scoped>
.app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  will-change: transform;
  transition: all 0.4s;
  position: absolute;
}

.slide-right-enter {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-right-leave-active {
  opacity: 0;
  transform: translateX(100%);
}

.slide-left-enter {
  opacity: 0;
  transform: translateX(100%);
}

.slide-left-leave-active {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
