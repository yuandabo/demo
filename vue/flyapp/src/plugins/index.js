
import Vue from 'vue'
import {
  Loading, Message
} from 'element-ui'

Vue.use(Loading.directive)

function LoadingClass () {
  this.load = null
  this.open = function () {
    if (!this.load) this.load = Loading.service({ fullscreen: false })
    // setTimeout(() => {
    //   this.close()
    // }, 2000)
  }
  this.close = function () {
    if (this.load) {
      this.load.close()
      // this.load = null
    }
  }
}

const load = new LoadingClass()

Vue.prototype.$loading = load

Vue.prototype.$message = (msg, type = 'info') => {
  Message({
    dangerouslyUseHTMLString: process.env.NODE_ENV === 'development',
    message: msg,
    type
  })
}
