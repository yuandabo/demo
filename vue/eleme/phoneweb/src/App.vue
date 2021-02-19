<template>
  <div id="app">
    <van-loading v-show="loading"
                 size="24px">加载中...</van-loading>
    <keep-alive>
      <router-view :seller="seller"
                   :ratings="ratings" />
    </keep-alive>
  </div>
</template>

<script>
import { getAll } from '@/api/send'
export default {
  // 声明引入的组件
  data () {
    return {
      seller: {
        'name': '粥品香坊（回龙观）',
        'description': '蜂鸟专送',
        'deliveryTime': 38,
        'score': 4.2,
        'serviceScore': 4.1,
        'foodScore': 4.3,
        'rankRate': 69.2,
        'minPrice': 20,
        'deliveryPrice': 4,
        'ratingCount': 24,
        'sellCount': 90,
        'bulletin': `粥品香坊其烹饪粥料的秘方源于中国千年古法，
          在融和现代制作工艺，由世界烹饪大师屈浩先生领衔研发。坚守纯天然、0添加的良心品质深得消费者青睐，发展至今成为粥类的引领品牌。
          是2008年奥运会和2013年园博会指定餐饮服务商。`,
        'avatar': 'http://static.galileo.xiaojukeji.com/static/tms/seller_avatar_256px.jpg'
      },
      ratings: [],
      loading: false
    }
  },
  created () {
    // this.getAll()
  },
  methods: {
    getAll () {
      getAll()
        .then((res) => {
          if (res.code === '200') {
            this.seller = res.data.seller
            this.ratings = res.data.ratings
          } else {
            this.$toast('请求失败')
          }
        })
        .catch((err) => {
          console.error(err)
          this.$toast('请求失败')
        })
        .finally(() => {
          this.loading = false
        })
    }

  }
}
</script>

<style lang="scss" scoped>
#app {
  height: 100vh;
  width: 100%;
  overflow: hidden;
}
</style>
