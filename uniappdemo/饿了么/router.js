import {
  RouterMount,
  createRouter,
  runtimeQuit
} from 'uni-simple-router';

let first = null;
const router = createRouter({
  h5: {
    vueRouterDev: true, //完全使用vue-router开发 默认 false  
    // paramsToQuery: false,
    // vueRouterDev: false,
    // vueNext: false,
    // mode: 'hash',
    // base: '/',
    // linkActiveClass: 'router-link-active',
    // linkExactActiveClass: 'router-link-exact-active',
    // scrollBehavior: (to, from, savedPostion) => ({ x: 0, y: 0 }),
    // fallback: true
  },
  platform: process.env.VUE_APP_PLATFORM,
  APP: {
    animation: {
      animationType: 'slide-in-top',
      animationDuration: 300
    }
  },
  // routerBeforeEach: (to, from, next) => {
  //   console.log('+++++routerBeforeEach++++')
  //   next();
  // },
  // routerAfterEach: (to, from) => {
  //   console.log('--------routerAfterEach----')
  // },
  routerErrorEach: ({
    type,
    msg
  }) => {
    console.log({
      type,
      msg
    });
    router.$lockStatus = false;
    // #ifdef APP-PLUS
    if (type === 3) {
      runtimeQuit();
    }
    // #endif
  },
  debugger: true,
  routes: [
    ...ROUTES,
    // {
    //   path: '*',
    //   redirect: (to) => {
    //     return {
    //       name: 'foods'
    //     }
    //   }
    // },
    {
      path: '/',
      name: 'goods',
      component: () => import('@/pages/goods/index.vue'),
      // redirect: (to) => {
      //   return {
      //     path: '/pages/goods/foods/index'
      //   }
      // },
      children: [
        {
          path: 'goods/foods',
          name: 'foods',
          component: () => import('@/pages/goods/foods/index.vue'),
        },
        {
          path: 'goods/ratings',
          name: 'ratings',
          component: () => import('@/pages/goods/ratings/index.vue'),
        },
        {
          path: 'goods/seller',
          name: 'seller',
          component: () => import('@/pages/goods/seller/index.vue'),
        },
      ]
    },
    {
      path: '/recommendDetails',
      name: 'recommendDetails',
      component: () => import('@/pages/recommendDetails/index.vue')
    },
    {
      path: '/foodsDetails',
      name: 'foodsDetails',
      component: () => import('@/pages/foodsDetails/index.vue')
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/pages/search/index.vue')
    }
  ]
});
// console.log(router)
// let count = 0;
// router.beforeEach((to, from, next) => {
// console.log(to)
// console.log(from)
// count++
// if (count == 1) {
//   next({
//     path: '/pages/login/login',
//     NAVTYPE: 'replaceAll'
//   })
// } else {
//   next();
// }
// next();
// });
// router.afterEach((to, from, next) => {
//   console.log('afterEach---跳转结束')
// });

export {
  router,
  RouterMount
}
