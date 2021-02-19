import Vue from 'vue'
import App from './App.vue'
import router from '@/router'
import {
  db
} from '@/utils/db'
import {
  Button,
  Toast,
  Loading,
  Popup,
  Skeleton,
  Icon,
  Image as VanImage,
  Tab, Tabs,
  NavBar,
  SubmitBar,
  Field,
  AddressEdit,
  ActionSheet, Swipe, SwipeItem,
  Switch
} from 'vant'
import 'vant/lib/button/style'
import { mode } from '@/utils/env'

Vue.use(Loading)
Vue.use(Popup)
Vue.use(Skeleton)
Vue.use(Toast)
Vue.use(Icon)
Vue.use(VanImage)
Vue.use(Tab)
Vue.use(Tabs)
Vue.use(NavBar)
Vue.use(SubmitBar)
Vue.use(Field)
Vue.use(AddressEdit)
Vue.use(ActionSheet)
Vue.use(Swipe)
Vue.use(SwipeItem)
Vue.use(Button)
Vue.use(Switch)
Vue.config.productionTip = false
Vue.prototype.$db = db
Vue.prototype.$mode = mode
// Vue.prototype.$baseUrl = 

new Vue({
  render: h => h(App),
  router
}).$mount('#app')