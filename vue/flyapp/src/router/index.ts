import Vue from 'vue'
import VueRouter, { Route, RouteConfig } from 'vue-router'
import {
  getToken,
  pageChange,
  registerBackCallback,
  init,
  getUserType,
  showTabBar
} from '@/env'
import { Message } from 'element-ui'

import i18n from '@/locale'

// 固定页面文件不使用懒加载，打包到app.js
// 为了打包成一个文件，暂不使用懒加载
import Home from '@/views/home/index.vue'
// import FlightPreparation from '@/views/flightPreparation/index.vue'
// import PeriodicSummary from '@/views/periodicSummary/index.vue'
// import QAROverRun from '@/views/QAROverRun/index.vue'
// import QualificationData from '@/views/qualificationData/index.vue'

Vue.use(VueRouter)

/**
 * 固定路由
 */
export const constantRoutes: Array<RouteConfig> = [
  {
    path: '/',
    component: Home,
    name: 'Home',
    meta: { title: 'home' }
  },
  {
    path: '/flightPreparation',
    component: () => import('@/views/flightPreparation/index.vue'),
    name: 'commonPreFlightPreparation',
    meta: { title: 'flightPreparation' }
  },
  {
    path: '/periodicSummary',
    component: () => import('@/views/periodicSummary/index.vue'),
    name: 'commonCycleSummary',
    meta: { title: 'periodicSummary' }
  },
  {
    path: '/qualificationData',
    component: () => import('@/views/qualificationData/index.vue'),
    name: 'commonQualificationData',
    meta: { title: 'QualificationData' }
  },
  {
    path: '/QAROverRun',
    component: () => import('@/views/QAROverRun/index.vue'),
    name: 'commonQarEvent',
    meta: { title: 'QAROverRun' }
  },
  {
    path: '/detail',
    component: () => import('@/views/detail/index.vue'),
    name: 'Detail',
    meta: { title: 'Detail' }
  },
  // 管理版路由
  {
    path: '/overRun-manage',
    component: () => import('@/views/overRun-manageVersion/index.vue'),
    name: 'commonOverrunEvent',
    meta: { title: 'OverRunManageVersion' }
  },
  {
    path: '/FilghtDetail',
    component: () => import('@/views/home/FilghtDetail.vue'),
    name: 'FilghtDetail',
    meta: { title: 'FilghtDetail' }
  },
  {
    path: '/FRI',
    component: () => import('@/views/FRITrend-manageVersion/index.vue'),
    name: 'FRI',
    meta: { title: 'FRI' }
  },
  {
    path: '/parameterDistribution',
    component: () => import('@/views/commonParameterDistribution/index.vue'),
    name: 'commonParameterDistribution',
    meta: { title: 'CommonParameterDistribution' }
  }
]

const createRouter = () =>
  new VueRouter({
    scrollBehavior: (to, from, savedPosition) => {
      if (savedPosition) {
        return savedPosition
      } else {
        return { x: 0, y: 0 }
      }
    },
    base: process.env.BASE_URL,
    routes: constantRoutes
  })

const router = createRouter()

export function addRoutes (routes: RouteConfig[]): void {
  routes.forEach((item) => {
    router.addRoute(item)
  })
}

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter (): void {
  const newRouter = createRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(router as any).matcher = (newRouter as any).matcher // reset router
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.beforeEach(async (to: Route, from: Route, next: any) => {
  const { path } = to
  if (path === '/') {
    showTabBar('1')
  } else {
    showTabBar('0')
  }
  if (getToken() && getUserType()) {
    // console.log('has token')
    next()
  } else {
    // console.log('no token')
    init()
      .then(() => {
        // console.log('next')
        next()
      })
      .catch((err) => {
        Message(`糟糕！获取token和userType失败${err}`)
      })
  }
})

router.afterEach((to: Route) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  document.title = i18n.t(`title.${(to.meta as any).title}`) as string
  /** 通知iPad端 */
  pageChange(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    i18n.t(`title.${(to.meta as any).title}`) as string,
    to.name === 'Home' ? '0' : '1'
  )
})

/** 注册iPad上返回按钮回调 */
registerBackCallback(() => {
  router.back()
})

export default router
