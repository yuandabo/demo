import goods from '@/pages/goods'
import ratings from '@/pages/ratings'
import seller from '@/pages/seller'
import order from '@/pages/order'
import foods from '@/pages/foods'
import address from '@/pages/addressChoose'
import search from '@/pages/search'
import recommendDetails from '@/pages/recommendDetails'
import foodsDetails from '@/pages/foodsDetails'
import orderFinish from '@/pages/orderFinish'

export const routes =
  [
    {
      path: '*',
      redirect: '/goods'
    },
    {
      path: '/goods',
      redirect: '/goods/index',
      name: 'goods',
      component: goods,
      children: [{
        path: 'index',
        component: foods
      }, {
        path: 'ratings',
        component: ratings
      }, {
        path: 'seller',
        component: seller
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
      component: order
    },
    {
      path: '/address',
      name: 'address',
      component: address
    },
    {
      path: '/search',
      name: 'search',
      component: search
    },
    {
      path: '/recommendDetails',
      name: 'recommendDetails',
      component: recommendDetails
    },
    {
      path: '/foodsDetails',
      name: 'foodsDetails',
      component: foodsDetails
    },
    {
      path: '/orderFinish',
      name: 'orderFinish',
      component: orderFinish
    }
  ]
