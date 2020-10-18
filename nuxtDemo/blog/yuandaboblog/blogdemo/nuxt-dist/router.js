import Vue from 'vue'
import Router from 'vue-router'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _062ad01e = () => interopDefault(import('..\\pages\\details\\index.vue' /* webpackChunkName: "pages/details/index" */))
const _5771a4ad = () => interopDefault(import('..\\pages\\menu.vue' /* webpackChunkName: "pages/menu" */))
const _6e61dfa3 = () => interopDefault(import('..\\pages\\more.vue' /* webpackChunkName: "pages/more" */))
const _37140260 = () => interopDefault(import('..\\pages\\test.vue' /* webpackChunkName: "pages/test" */))
const _777bf618 = () => interopDefault(import('..\\pages\\index.vue' /* webpackChunkName: "pages/index" */))

// TODO: remove in Nuxt 3
const emptyFn = () => {}
const originalPush = Router.prototype.push
Router.prototype.push = function push (location, onComplete = emptyFn, onAbort) {
  return originalPush.call(this, location, onComplete, onAbort)
}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: decodeURI('/'),
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/details",
    component: _062ad01e,
    name: "details"
  }, {
    path: "/menu",
    component: _5771a4ad,
    name: "menu"
  }, {
    path: "/more",
    component: _6e61dfa3,
    name: "more"
  }, {
    path: "/test",
    component: _37140260,
    name: "test"
  }, {
    path: "/",
    component: _777bf618,
    name: "index"
  }],

  fallback: false
}

export function createRouter () {
  return new Router(routerOptions)
}
