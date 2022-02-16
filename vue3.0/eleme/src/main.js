import { createApp } from 'vue'
import App from './App.vue'
// import 'ant-design-vue/dist/antd.css'
import './style/index.scss'
// import Ant from 'ant-design-vue'
import router from './router/index'
// import { store } from './store/index'
import { createPinia } from 'pinia';


const app = createApp(App)

// app.config.errorHandler = (err, vm, info) => {
//     // 处理错误
//     // `info` 是 Vue 特定的错误信息，比如错误所在的生命周期钩子
//     console.log(err);
// }

// app.config.warnHandler = function(msg, vm, trace) {
//     // `trace` 是组件的继承关系追踪
//     console.log(msg);
// }

// 设置全局变量
app.config.globalProperties.$author = 'yuandabo'

app
.use(router)
// .use(store)
.use(createPinia())
.mount('#app')