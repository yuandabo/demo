/*
 * @Author: your name
 * @Date: 2020-09-25 13:56:51
 * @LastEditTime: 2020-09-25 14:21:48
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \app\plugins\hljs.js
 */
// import hljs from 'highlight.js'
import Vue from 'vue'
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);
Vue.use(hljs.vuePlugin);