import Vue from 'vue'
import VueI18n from 'vue-i18n'
import elementEnLocale from 'element-ui/lib/locale/lang/en'
import elementZhLocale from 'element-ui/lib/locale/lang/zh-CN'
import enLocale from './lang/en'
import zhCNLocale from './lang/zh-CN'

Vue.use(VueI18n)

const i18n = new VueI18n({
  locale: 'zh-CN',
  messages: {
    en: {
      ...elementEnLocale,
      ...enLocale
    },
    'zh-CN': {
      ...elementZhLocale,
      ...zhCNLocale
    }
  }
})

export default i18n
