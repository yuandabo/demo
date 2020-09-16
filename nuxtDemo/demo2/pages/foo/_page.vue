<template>
  <div>
      <h2>News-Content [{{$route.params.page}}]</h2>
      <ul>
        <li><a href="/">Home</a></li>
      </ul>
  </div>
</template>

<script>
export default {
  validate({ params }) {
    // 必须是number类型
    return /^\d+$/.test(params.page)
  },
  data(){
    return{
      title:this.$route.params.title,
    }
  },
    head(){
        return{
        title:this.title,
        meta:[
            {hid:'description',name:'news',content:'This is news page'}
        ]
        }
    }
}
</script>

<style>

</style>