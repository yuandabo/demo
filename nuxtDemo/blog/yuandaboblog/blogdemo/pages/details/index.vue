<!--
 * @Author: your name
 * @Date: 2020-09-24 10:23:26
 * @LastEditTime: 2020-09-27 15:34:20
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \app\pages\details\index.vue
-->
<template>
  <div v-html="str">
  </div>
</template>

<script>
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);
export default {
  data () {
    return {
      currentId: this.$route.query.id,
      str: '<pre><code class="javascript">var a = 1</code></pre>'
    }
  }
}
</script>
