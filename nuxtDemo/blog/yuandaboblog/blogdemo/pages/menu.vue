<!--
 * @Author: your name
 * @Date: 2020-09-21 09:05:21
 * @LastEditTime: 2020-09-23 17:11:15
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: 
-->
<template>
  <v-container>
    <v-row no-gutters
           justify="start"
           align-content='start'>
      <v-col cols="12"
             sm="4"
             v-for="(card,index) in cardsData"
             :key="index">
        <v-cart class="mr-5 mb-5"
                :current="card" />
        <!-- <v-skeleton-loader ref="skeleton"
                           :boilerplate="boilerplate"
                           :type="type"
                           :tile="tile"
                           class="mx-auto"></v-skeleton-loader> -->
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import vcart from '~/components/v-cart.vue'
export default {
  components: {
    vcart
  },
  data () {
    return {
      cardsData: [
        { title: 'javascript权威指南', src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg' },
        { title: 'javascript高级程序设计', src: 'https://cdn.vuetifyjs.com/images/cards/road.jpg' },
        { title: 'Best airlines', src: 'https://cdn.vuetifyjs.com/images/cards/plane.jpg' },
        { title: 'javascript权威指南', src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg' },
        { title: 'javascript高级程序设计', src: 'https://cdn.vuetifyjs.com/images/cards/road.jpg' },
        { title: 'Best airlines', src: 'https://cdn.vuetifyjs.com/images/cards/plane.jpg' },
        { title: 'javascript权威指南', src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg' },
        { title: 'javascript高级程序设计', src: 'https://cdn.vuetifyjs.com/images/cards/road.jpg' },
        { title: 'Best airlines', src: 'https://cdn.vuetifyjs.com/images/cards/plane.jpg' }
      ],
      boilerplate: false,
      tile: false,
      type: 'list-item-avatar-three-line',
    }
  }
}
</script>
