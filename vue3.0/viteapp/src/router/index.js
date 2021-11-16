import { createRouter, createWebHashHistory } from 'vue-router'
import { store } from '../store/index'

import Layout from '../layout/index.vue'
import Home from '../views/home/index.vue'
import Login from '../layout/login/index.vue'

const routes = [
    {
        path: '/',
        redirect: '/admin/home'
    },
    {
        path: '/login',
        component: Login,
        name: 'login'
    },
    {
        path: '/admin',
        component: Layout,
        children: [
            {
                path: '',
                redirect: 'home'
            },
            {
                path: 'home',
                name: 'home',
                component: Home
            }
        ]
    },
    {
        path: '/elem',
        component: Layout,
        children: [
            {
                path: '',
                redirect: 'elem'
            },
            {
                path: 'elem',
                name: 'elem',
                component: () => import('@/views/elementPlus/index.vue')
            }
        ]
    }
]

export const router = createRouter({
    // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
    history: createWebHashHistory(),
    routes, // short for `routes: routes`
})

router.beforeEach((to, from, next) => {
    const userInfo = store.state.user.userInfo
    // to.meta.dirty = true
    if (!userInfo && to.name !== 'login') {
        next('login')
    } else {
        next()
    }
})