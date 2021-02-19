import 'vant/lib/button/style';
import * as vantUi from '@/plugin/vant'
import Vue from 'vue'
for (let i in vantUi) {
  Vue.use(vantUi[i])
}
Vue.prototype.$loading = vantUi['Loading']