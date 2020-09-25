<!--
 * @Author: your name
 * @Date: 2020-09-24 10:23:26
 * @LastEditTime: 2020-09-25 14:27:16
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \app\pages\details\index.vue
-->
<template>
  <div>
    <pre><code class="javascript">var a = 1</code></pre>
  </div>
</template>

<script>
import 'highlight.js/styles/github.css';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);
// import hljs from 'highlight.js'
// import Vue from 'vue'
// Vue.use(hljs.vuePlugin)
export default {
  // components: {
  //   highlightjs: Vue.use(hljs.vuePlugin)
  // }
}
</script>
