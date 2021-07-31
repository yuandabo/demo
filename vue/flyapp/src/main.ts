import Vue from 'vue'

import 'normalize.css'
import '@/styles/index.scss'

import App from '@/App.vue'
import router from '@/router'
import i18n from '@/locale'

// https://blog.csdn.net/qq_34917408/article/details/108974590
import 'default-passive-events'

import '@/plugins'
// import '@/env'

Vue.config.productionTip = false

new Vue({
  router,
  i18n,
  render: (h) => h(App)
}).$mount('#app')
