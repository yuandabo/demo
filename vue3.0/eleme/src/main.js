import { createApp } from 'vue'
import App from './App.vue'
import '@/assets/index.scss'
import router from './router/index'
import { createPinia } from 'pinia';
import {db} from '@/utils/db'
// import scroll from '@/components/scroll/index.vue';

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
app.config.globalProperties.$db = db

app
.use(router)
.use(createPinia())
.mount('#app')