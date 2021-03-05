import goods from '@/views/goods'
import ratings from '@/views/ratings'
import seller from '@/views/seller'
import order from '@/views/order'
import foods from '@/views/foods'
import address from '@/views/addressChoose'
import search from '@/views/search'
import recommendDetails from '@/views/recommendDetails'
import foodsDetails from '@/views/foodsDetails'

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
    }
  ]
