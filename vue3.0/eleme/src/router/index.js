import { routes } from './routes'
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

/**
* 路由拦截
* 权限验证
*/
// router.beforeEach((to, from, next) => {
// NProgress.start()
// 路由进入添加缓存 exclude为true的不缓存
// if (to.meta.exclude !== true) {
//   store.commit('app/menu/keepAliveAdd', to.name)
// }
// // 如果返回时，前一个路由不缓存，清空loading
// if (from.meta.exclude === true) {
//   Vue.$loading.hide()
// }
// const prev = from.meta.from || []

// // 判断如果是后退，需要删除缓存组件
// if (prev.indexOf(to.path) !== -1) {
//   // 后退操作清空loading
//   Vue.$loading.hide()
//   store.commit('app/menu/keepAlivedelete', from.name)
// }
// addDynamicRoutes(router, to, next, NProgress)
// })

// router.afterEach(to => {
// 进度条
// NProgress.done()
// })
export default router