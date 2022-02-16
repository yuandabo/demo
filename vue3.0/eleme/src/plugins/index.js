import 'vant/lib/button/style'
import * as vantUi from '@/plugins/vant'
import 'vant/lib/index.css'
import Vue from 'vue'
// 导入vant-ui
const useVantUi = (context, vant) => {
  for (const key in vant) {
    const component = vant[key]
    context.use(component)
  }
}
// Vue.prototype.$loading = vantUi['Loading']

export default {
  async install (Vue, options) {
    // Vant
    useVantUi(Vue, vantUi)
  }
}
