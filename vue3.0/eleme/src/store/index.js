import { createApp } from 'vue'
import { createStore } from 'vuex'

import user from './modules/user'
// 创建一个新的 store 实例
export const store = createStore({
  state () {
    return {
    }
  },
  mutations: {
  },
  modules: {
    user
  }
})
