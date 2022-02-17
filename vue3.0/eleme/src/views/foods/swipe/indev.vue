<template>
  <van-swipe class="my-swipe"
             :autoplay="10000"
             indicator-color="white">
    <van-swipe-item>
      <van-image height="90"
                 :src="'https://cube.elemecdn.com/2/14/7059f0fe8c3eb2c691a595ef7f734png.png?x-oss-process=image/format,webp/resize,w_686'">
        <template v-slot:error>
          <van-image width="100vw"
                     height="90"
                     src="https://cube.elemecdn.com/2/14/7059f0fe8c3eb2c691a595ef7f734png.png?x-oss-process=image/format,webp/resize,w_686" />
        </template>
      </van-image>
    </van-swipe-item>
    <van-swipe-item>
      <van-image height="90"
                 :src="'https://cube.elemecdn.com/2/14/7059f0fe8c3eb2c691a595ef7f734png.png?x-oss-process=image/format,webp/resize,w_686'">
        <template v-slot:error>
          <van-image width="100vw"
                     height="90"
                     src="https://cube.elemecdn.com/2/14/7059f0fe8c3eb2c691a595ef7f734png.png?x-oss-process=image/format,webp/resize,w_686" />
        </template>
      </van-image>
    </van-swipe-item>
  </van-swipe>
</template>

<script>
import { Swipe, SwipeItem, Image } from 'vant'
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'swipe',
  components: {
    [Swipe.name]: Swipe,
    [SwipeItem.name]: SwipeItem,
    [Image.name]: Image
  }
})
</script>

<style>
</style>
