import Vue from 'vue'
import App from './App.vue'
import router from '@/router'
//  import store from '@/store'
import '@/components'
import {
  db
} from '@/utils/db'
import plugin from '@/plugins'
import { mode } from '@/utils/env'
import 'vant/lib/button/style'
import '@/assets/index.scss'

import VueLazyload from 'vue-lazyload'

Vue.use(VueLazyload)

Vue.use(plugin)
Vue.config.productionTip = false
Vue.prototype.$db = db
Vue.prototype.$mode = mode
// Vue.prototype.$baseUrl =

new Vue({
  render: (h) => h(App),
  router,
  store
}).$mount('#app')
