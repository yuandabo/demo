import goods from '@/views/goods'
import ratings from '@/views/ratings'
import seller from '@/views/seller'
import order from '@/views/order'
import foods from '@/views/foods'
import address from '@/views/addressChoose'
export const routes =
  [
    {
      path: '*',
      redirect: '/goods'
    },
    {
      path: '/goods',
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
      },]
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
  ]
