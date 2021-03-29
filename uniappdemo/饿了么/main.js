import Vue from 'vue'
import App from './App'
import {
  router,
  RouterMount
} from './router.js'
import '@/components'
import store from './store'
// import '@/assets/index.scss'
Vue.use(router)
Vue.config.productionTip = false
Vue.prototype.$store = store
App.mpType = 'app'

const app = new Vue({
  store,
  ...App
})
// Vue.prototype.$vm = app
// //v1.3.5起 H5端 你应该去除原有的app.$mount();使用路由自带的渲染方式
RouterMount(app, router, '#app')

app.$mount() //为了兼容小程序及app端必须这样写才有效果
