<!--
 * @Author: your name
 * @Date: 2020-09-21 09:05:21
 * @LastEditTime: 2020-09-24 11:03:12
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \yuandaboblog\blog\pages\index.vue
-->
<template>
  <div class="container fill-height">
    <div class="yuandabo-info">
      <v-card class="mx-auto"
              :class="`d-flex flex-column  align-center`"
              width="400">
        <div></div>
        <!-- <v-img class="white--text align-end"
               height="200px"
               width="200px"
               src="https://avatars2.githubusercontent.com/u/45970965?s=400&u=f06a37391874939cdec279f3476b0cc99101d95b&v=4">
          <v-card-title>Top 10 Australian beaches</v-card-title>
        </v-img> -->
        <v-avatar color="orange"
                  size="200">
          <v-img class="white--text align-end"
                 src="https://avatars2.githubusercontent.com/u/45970965?s=400&u=f06a37391874939cdec279f3476b0cc99101d95b&v=4">
            <!-- <v-card-title>Top 10 Australian beaches</v-card-title> -->
          </v-img>
        </v-avatar>
        <v-card-subtitle class="pb-0">yuandabo</v-card-subtitle>

        <v-card-text style="flex:1"
                     class="text--primary">
          <div>{{info.career}}</div>
          <div>{{info.description}}</div>
          <div class="mt-1">
            <v-chip class="ma-2"
                    :color="chip.color"
                    v-for="chip in chips"
                    :key="chip.id">
              {{chip.text}}
            </v-chip>
          </div>
          <v-divider class="mt-2"
                     :inset="false"></v-divider>
          <div :class="`d-flex justify-space-between mt-4`"><span> 联系方式：电话：{{info.phoneNumber}}</span> <span> qq：{{info.qq}} </span> </div>
        </v-card-text>

        <v-card-actions>
          <v-btn color="orange"
                 text>
            分享
          </v-btn>

          <v-btn color="orange"
                 text>
            Explore
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script>

export default {
  data () {
    return {
      info: {
        phoneNumber: 176084822465,
        qq: 540496776,
        career: '前端开发工程师',
        description: '热爱生活，热爱开发'
      },
      chips: [
        {
          id: '1',
          color: 'primary',
          text: 'primary'
        },
        {
          id: '2',
          color: 'secondary',
          text: 'secondary'
        },
        {
          id: '3',
          color: 'red',
          text: 'red'
        }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.yuandabo-info {
  height: 80vh;
  width: 50%;
  margin: 0 auto;
  display: flex;
  justify-content: center;
}
</style>
