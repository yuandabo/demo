// 设置文件
export default {
  namespaced: true,
  state: {
    // 存放缓存的路由
    keepAlive: ['foods', 'goods']
  },
  actions: {
  },
  mutations: {
    keepAliveSet (state, data) {
      state.keepAlive = data
    }
  }
}
