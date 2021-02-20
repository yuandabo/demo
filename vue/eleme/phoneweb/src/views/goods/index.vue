<template>
  <div ref="goods"
       class="goods">
    <vheader :seller="seller" />
    <vtag class="tag"
          @tabs-click="tagclick" />
    <router-view :goods="goods"
                 :seller="seller" />
  </div>
</template>

<script>
import axios from 'axios'
import vheader from '@/layout/header'
import vtag from '@/layout/tag'
import { getAll } from '@/api/send'
import mixins from './mixins'
export default {
  name: 'goods',
  components: {
    vheader,
    vtag
  },
  mixins: [mixins],
  props: {
    seller: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  data () {
    return {
      goods: [],
      listHeight: [], // foods列表的高度
      scrollY: 0, // 存储foods当前坐标
      showCom: true,
      loading: false,
      ulkey: 0,
      currentIndex: 0
    }
  },
  computed: {
  },
  mounted () {
    this.getAll()
  },
  methods: {
    tagclick (name) {
      let path
      if (name === 0) {
        path = '/goods/index'
      } else if (name === 1) {
        path = '/goods/ratings'
      } else if (name === 2) {
        path = '/goods/seller'
      }
      this.$router.push({ path })
    },
    /*
    初始化数据（number）
    tip:后台初始化时number为'null',以及其他的页面无法根据（quancode）取到number,所以全程使用初始化的List进行操作，1可以解决无法取到Number的问题，2可以减少http请求
    */
    initCount () {
      const goods = this.goods
      for (let i = 0, length = goods.length; i < length; i++) {
        const item = goods[i]
        // console.log(item)
        for (let j = 0, length2 = item['foods'].length; j < length2; j++) {
          const foods = item['foods'][j]
          // 无数据时后台给的'null'
          if (!foods.hasOwnProperty('count') || foods['count'] === 'null') {
            this.$set(foods, 'count', 0)
          }
        }
      }
    },
    // 获取后台数据
    async getAll () {
      if (this.$mode) {
        axios('./data.json')
          .then((res) => {
            this.goods = res.data.goods
          })
      } else {
        const data = await getAll()
        if (data.code === '200') {
          const goods = data.data.goods
          const arr = []
          // 过滤数据
          for (let i = 0, length = goods.length; i < length; i++) {
            const item = goods[i]
            if (item.foods && item.foods.length !== 0) {
              arr.push(item)
            }
          }
          this.goods = arr
          this.initCount() // 初始化count
        }
      }
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
.goods {
  height: 93vh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  .tag {
    flex: 0;
    background: #fff;
  }
}
.gradient-line {
  position: relative;
  transform: translate(0px, 0px);
}
.line::after {
  height: 1px;
  content: "";
  position: absolute;
  background: rgba(7, 17, 27, 0.1);
  bottom: 0;
  left: 0;
  right: 0;
  transform: translate(0px, 0px);
}
@media only screen and (-webkit-min-device-pixel-ratio: 2) {
  .line::after {
    background: -webkit-linear-gradient(top, rgba(7, 17, 27, 0.1), transparent);
    background: linear-gradient(to bottom, rgba(7, 17, 27, 0.1), transparent);
    transform: translate(0px, 0px);
  }
}
@media only screen and (-webkit-min-device-pixel-ratio: 3) {
  .line::after {
    background: -webkit-linear-gradient(
      top,
      rgba(7, 17, 27, 0.1),
      transparent,
      transparent
    );
    background: linear-gradient(
      to bottom,
      rgba(7, 17, 27, 0.1) transparent,
      transparent
    );
  }
}
</style>
