// import goods from '@/views/goods'
// import ratings from '@/views/ratings'
// import seller from '@/views/seller'
// import order from '@/views/order'
// import foods from '@/views/foods'
// import address from '@/views/addressChoose'
// import search from '@/views/search'
// import recommendDetails from '@/views/recommendDetails'
// import foodsDetails from '@/views/foodsDetails'
// import orderFinish from '@/views/orderFinish'

export const routes =
  [
    {
      path: '/',
      redirect: '/goods'
    },
    {
      path: '/goods',
      redirect: '/goods/index',
      name: 'goods',
      component: () => import('@/views/goods/index.vue'),
      children: [{
        path: 'index',
        component: () => import('@/views/foods/index.vue'),
      }, {
        path: 'ratings',
        component: () => import('@/views/ratings/index.vue'),
      }, {
        path: 'seller',
        component: () => import('@/views/seller/index.vue'),
      }]
    },
    // {
    //   path: '/ratings',
    //   name: 'ratings',
    //   component: ratings
    // },
    {
      path: '/order',
      name: 'order',
      component: () => import('@/views/order/index.vue'),
    },
    {
      path: '/address',
      name: 'address',
      component: () => import('@/views/addressChoose/index.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/search/index.vue'),
    },
    {
      path: '/recommendDetails',
      name: 'recommendDetails',
      component: () => import('@/views/recommendDetails/index.vue'),
    },
    {
      path: '/foodsDetails',
      name: 'foodsDetails',
      component: () => import('@/views/foodsDetails/index.vue'),
    },
    {
      path: '/orderFinish',
      name: 'orderFinish',
      component: () => import('@/views/orderFinish/index.vue'),
    }
  ]
