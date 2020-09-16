<template>
  <div>
      <h2>Index page</h2>
      <ul>
        <li><nuxt-link :to="{path:'/'}">Home</nuxt-link></li>
        <ul>
        <li><nuxt-link :to="{path:'/foo/123',parmas:{title:'yuandabo'}}">page-1</nuxt-link></li>
        <li><nuxt-link :to="{path:'/foo/456',params:{title:'yuandabo.com'}}">page-2</nuxt-link></li>
      </ul>
      </ul>
  </div>
</template>

<script>
export default {
  created(){
    console.log('路由传参',this.$route.params)
  }
}
</script>

<style>

</style>