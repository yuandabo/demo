<!--
 * @Author: your name
 * @Date: 2020-09-22 09:04:29
 * @LastEditTime: 2020-09-22 17:13:05
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \yuandaboblog\blog\components\cart.vue
-->
<template>
  <v-card class="mx-auto"
          max-width="400">
    <v-img class="white--text align-end"
           height="200px"
           :src="current.src">
      <v-card-title>{{current.title}}</v-card-title>
    </v-img>

    <v-card-subtitle class="pb-0">二级标题</v-card-subtitle>

    <!-- <v-card-text class="text--primary">
      <div>Whitehaven Beach</div>

      <div>Whitsunday Island, Whitsunday Islands</div>
    </v-card-text> -->

    <v-card-actions>
      <v-btn color="orange"
             text>
        分享
      </v-btn>

      <v-btn color="orange"
             text>
        查看详情
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'card',
  props: {
    current: {
      type: Object,
      default: () => {
        { }
      }
    }
  }
}
</script>

<style>
</style>