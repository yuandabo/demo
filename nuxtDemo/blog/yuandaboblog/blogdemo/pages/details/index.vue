<!--
 * @Author: your name
 * @Date: 2020-09-24 10:23:26
 * @LastEditTime: 2020-09-28 17:19:13
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \app\pages\details\index.vue
-->
<template>
  <!-- <pre v-highlightjs="str"><code class="javascript"></code></pre> -->
  <div class="posts">
    <h1 class="title">{{ article.title }}</h1>
    <section class="article">
      <editor-preview :content="str" />
    </section>
  </div>
</template>

<script>
import { cutString } from '~/plugins/filters'
export default {
  head () {
    return {
      title: `${this.article.title}`,
      meta: [
        {
          hid: 'keywords',
          name: 'keywords',
          content: this.article.title,
        },
        // {
        //   hid: 'description',
        //   name: 'description',
        //   content: cutString(this.article.content, 60),
        // },
      ],
    }
  },
  data () {
    return {
      currentId: this.$route.query.id,
      str: `<pre>// HTML 代码如下<br/>var a = document.getElementById('test');<br/>a.tabIndex</pre><br/>`,
      article: {
        title: "title"
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.posts {
  margin-bottom: 30px;
  .title {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 15px;
  }
  .article {
    margin-bottom: 20px;
  }
}
</style>