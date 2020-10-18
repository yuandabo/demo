<!--
 * @Author: yuandabo
 * @Date: 2020-09-21 09:05:21
 * @LastEditTime: 2020-09-24 10:19:16
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \yuandaboblog\blog\layouts\default.vue
-->
<template>
  <v-app id="index">
    <v-navigation-drawer v-model="drawer"
                         app
                         clipped>
      <v-list dense>
        <v-list-item v-for="item in items"
                     :key="item.text"
                     link
                     nuxt
                     :to="item.path">
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              {{ item.text }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-subheader class="mt-4 grey--text text--darken-1">友情链接</v-subheader>
        <v-list>
          <v-list-item v-for="item in items2"
                       :key="item.text"
                       link>
            <v-list-item-avatar>
              <img :src="item.src"
                   alt="">
            </v-list-item-avatar>
            <v-list-item-title v-text="item.text"></v-list-item-title>
          </v-list-item>
        </v-list>
        <v-list-item class="mt-4"
                     link>
          <v-list-item-action>
            <v-icon color="grey darken-1">mdi-plus-circle-outline</v-icon>
          </v-list-item-action>
          <v-list-item-title class="grey--text text--darken-1">Browse Channels</v-list-item-title>
        </v-list-item>
        <v-list-item link>
          <v-list-item-action>
            <v-icon color="grey darken-1">mdi-cog</v-icon>
          </v-list-item-action>
          <v-list-item-title class="grey--text text--darken-1">Manage Subscriptions</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app
               clipped-left
               color="red"
               dense>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <!-- <v-icon
        class="mx-4"
        large
      >
        mdi-YuanDaBo
      </v-icon> -->
      <v-toolbar-title class="mr-12 align-center">
        <span class="title">YuanDaBo</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-row align="center"
             style="max-width: 650px">
        <v-text-field :append-icon-cb="() => {}"
                      placeholder="输入你想知道的"
                      single-line
                      append-icon="mdi-magnify"
                      color="white"
                      hide-details></v-text-field>
      </v-row>
    </v-app-bar>

    <v-main>
      <v-container class="fill-height"
                   style="align-items:flex-start">
        <nuxt />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  props: {
    source: String,
  },
  data: () => ({
    drawer: null,
    items: [
      { icon: 'mdi-trending-up', text: '主页', path: '/' },
      { icon: 'mdi-view-grid', text: '目录', path: '/menu' },
      { icon: 'mdi-youtube-subscription', text: '更多', path: '/more' },
      // { icon: 'mdi-history', text: 'History' },
      // { icon: 'mdi-playlist-play', text: 'Playlists' },
      // { icon: 'mdi-clock', text: 'Watch Later' },
    ],
    items2: [
      { src: 'https://avatars0.githubusercontent.com/u/33678850?s=400&u=d31072c6c79fcd19fbdbaeccd2f8796d4bf54cf4&v=4', text: 'MoBenw' },
      { src: 'https://avatars3.githubusercontent.com/u/38675949?s=400&u=3bd618f2687049533a845f47e3d97a785369cee3&v=4', text: 'superxzl' },
      // { picture: 48, text: 'Xbox Ahoy' },
      // { picture: 58, text: 'Nokia' },
      // { picture: 78, text: 'MKBHD' },
    ],
  }),
  created () {
    this.$vuetify.theme.dark = true
  },
}
</script>