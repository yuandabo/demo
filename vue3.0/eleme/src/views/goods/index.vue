<template>
  <div ref="goods"
       class="goods"
       @scroll="scroll">
    <vheader />
    <vtag class="tag"
          @tabs-click="tagclick" />
    <router-view ref="router"/>

  </div>
</template>

<script>
import { defineComponent } from 'vue'
import axios from 'axios'
import vheader from '@/layout/header/index.vue'
import vtag from '@/layout/tag/index.vue'
import { getAll } from '@/api/send'
import { debounce } from '@/utils/index.js'
// import mixins from '@/mixins/cartcontrol'
//  import store from '@/store'
import { useStore } from '@/pinia/index.js'
import { storeToRefs } from 'pinia'
export default defineComponent({
  name: 'goods',
  setup() {
    const store = useStore()
    const { shopCarData, seller } = storeToRefs(store)
    store.initGoodsData();
    store.initSellerData();
    return {
      store,
      shopCarData,
      seller
    }
  },
  components: {
    vheader,
    vtag
  },
  // mixins: [mixins],
  props: {},
  data () {
    return {
      goods: [],
      listHeight: [], // foods列表的高度
      scrollY: 0, // 存储foods当前坐标
      showCom: true,
      loading: false,
      ulkey: 0,
      currentIndex: 0,
      height: '93vh',
      value: '',
      path: '/goods/index'
    }
  },
  mounted () {
    // this.getAll()
  },
  methods: {
    scroll () {
      // if (this.path === '/goods/index') this.$refs.router.computedTop()
    },
    tagclick (name) {
      if (name === 0) {
        // this.height = '93vh'
        this.path = '/goods/index'
      } else if (name === 1) {
        // this.height = '100vh'
        this.path = '/goods/ratings'
      } else if (name === 2) {
        // this.height = '100vh'
        this.path = '/goods/seller'
      }
      this.$router.push({ path: this.path })
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
    // async getAll () {
    //   // if (this.$mode) {
    //   axios('./data.json')
    //     .then((res) => {
    //       this.goods = res.data.goods
    //       this.store.shopCarDataSet(res.data.goods)
    //     })
    //   // } else {
    //   //   const data = await getAll()
    //   //   if (data.code === '200') {
    //   //     const goods = data.data.goods
    //   //     const arr = []
    //   //     // 过滤数据
    //   //     for (let i = 0, length = goods.length; i < length; i++) {
    //   //       const item = goods[i]
    //   //       if (item.foods && item.foods.length !== 0) {
    //   //         arr.push(item)
    //   //       }
    //   //     }
    //   //     this.goods = arr
    //   //     this.initCount() // 初始化count
    //   //   }
    //   // }
    //   this.loading = false
    // }
  }
})
</script>

<style lang="scss" scoped>
.goods {
  width: 100%;
  height: 93vh;
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
