<template>
  <div class="address">
    <van-nav-bar title="新增地址"
                 left-arrow
                 @click-left="onClickLeft" />
    <van-address-edit :area-list="areaList"
                      button-type="info"
                      show-postal
                      show-delete
                      show-set-default
                      show-search-result
                      :search-result="searchResult"
                      :area-columns-placeholder="['请选择', '请选择', '请选择']"
                      @save="onSave"
                      @delete="onDelete"
                      @change-detail="onChangeDetail" />
  </div>
</template>

<script>
import { Toast } from 'vant';
export default {
  data () {
    return {
      areaList: {
        province_list: {
          110000: '北京市',
          120000: '天津市'
        },
        city_list: {
          110100: '北京市',
          110200: '县',
          120100: '天津市',
          120200: '县'
        },
        county_list: {
          110101: '东城区',
          110102: '西城区',
          110105: '朝阳区',
          110106: '丰台区',
          120101: '和平区',
          120102: '河东区',
          120103: '河西区',
          120104: '南开区',
          120105: '河北区',
        }
      },
      searchResult: [],
    };
  },
  methods: {
    onClickLeft () {
      this.$router.go(-1)
    },
    onSave (content) {
      Toast('save');
      console.log(content)
      this.$router.replace({ path: '/order', query: { content: content.addressDetail } })
    },
    onDelete () {
      Toast('delete');
    },
    onChangeDetail (val) {
      if (val) {
        this.searchResult = [
          {
            name: '黄龙万科中心',
            address: '杭州市西湖区',
          },
        ];
      } else {
        this.searchResult = [];
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "@/assets/color";
@import '@/assets/index.scss';
.address {
  /deep/.van-button--danger {
    background: #1989fa;
    border: 1px solid #1989fa;
  }
  /deep/ .van-nav-bar .van-icon {
    color: $nolmao-iconGrey;
  }
}
</style>