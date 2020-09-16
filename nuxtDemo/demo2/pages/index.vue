<template>
  <div>
    <ul>
      <li><nuxt-link :to="{name:'index'}">HOME</nuxt-link></li>
      <li><nuxt-link :to="{name:'bar'}">bar</nuxt-link></li>
      <li><nuxt-link :to="{name:'foo',params:{id:'123123'}}">foo</nuxt-link></li>
    </ul>
  </div>
</template>

<script>

export default {
  components: {

  },
  transition:'test'
}
</script>

<style>

</style>