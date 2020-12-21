<template>
  <view class="uni-flex uni-column my">
    <!-- 输入框 -->
    <view class="flex-item flex-item-V">
      <view class="uni-flex uni-row search-warpper">
        <input class="flex-item search search-box"
               ref="input"
               type="number"
               value=""
               v-model="inputValue"
               placeholder="在这输入基金代码.例(320007)" />
        <view class="icon flex-item">
          <uni-icons class="icon flex-item"
                     type="plus"
                     @click="searchClick"
                     size="30" />
        </view>
        <view class="icon flex-item">
          <uni-icons class="icon flex-item"
                     type="refresh-filled"
                     size="30"
                     @click="refresh" />
        </view>
      </view>
    </view>
    <!-- 上证指数 -->
    <view class="list-header">
      <view class="index-item"
            v-for="(item,index) in indexList"
            :key="index">
        <view class="">
          <view class="">
            {{item.f14}}
          </view>
          <view class="nums">
            {{item.f2}}
            <text class="nums-text"
                  :style="{backgroundColor:item.f3>=0?'red':'rgb(30, 191, 60)'}">{{item.f3}}%</text>
          </view>
        </view>
      </view>
    </view>
    <!-- 基金列表表头 -->
    <view class="flex-item flex-item-V">
      <view class="uni-flex uni-row back-white uni-card-header bor-bottom flex-item flex-item-V">
        <view class="pad-right"
              :style="{width:item.width,textAlign:item.textAlign}"
              v-for="(item,index) in listMockData"
              :key="index">
          {{item.label}}
        </view>
      </view>
    </view>
    <!-- 基金列表body -->
    <view class="flex-item flex-item-V uni-flex uni-column list-body">
      <view class="flex-item flex-item-V">
        <template v-if="showList"
                  class="flex-item flex-item-V">
          <view class="mar-top back-white uni-card-content"
                v-for="(item,index) in sharesData"
                :key="index"
                @click="routeTo(item)">

            <view class="uni-flex uni-row pad"
                  style="width: 100%;">
              <view class="pad-right"
                    :style="{width:item2.width}"
                    v-for="(item2,index2) in listMockData"
                    :key="index2">
                <view class="uni-flex uni-column">
                  <view class="flex-item pad-right uni-flex uni-row font-12px"
                        :style="{justifyContent:item2.width==='25%'?'center':'left',alignItem:'center'}">
                    <span v-if="item2.value==='gszzl'">{{item.gsz}}
                      <view :style="{color:item.gszzl >= 0?'red':'green'}">{{item[item2.value]}}%</view>
                    </span>
                    <span v-else-if="item2.value==='inOrOut'"
                          :style="{color:item.color}">{{item['inOrOut']}}</span>
                    <span v-else-if="item2.value==='chicang'"
                          style="color:#409EFF;cursor: pointer;text-decoration: underline;"
                          @click.stop="changeChiCang(item,item2)">{{item['chicang']}}</span>
                    <span v-else
                          class="flex-item">
                      <!-- 第一行 -->
                      {{item[item2.value]}}
                      <span class="flex-item"
                            v-if="signList.indexOf(item2.value)!== -1">
                        %
                      </span>
                      <!-- 名字 -->
                      <view class="flex-item"
                            v-if="item2.value==='NAME'">
                        {{item.FCODE}}
                      </view>
                      <!-- 单位净值 -->
                      <view class="flex-item"
                            :style="{color:item.RZDF>0?'red':'green'}"
                            v-else-if="item2.value==='DWJZ'">
                        {{(Number.parseFloat(item.RZDF)).toFixed(2)}}
                        <span class="flex-item">
                          %
                        </span>
                      </view>
                    </span>
                  </view>
                </view>
              </view>
            </view>

          </view>
        </template>
        <template v-else
                  class="flex-item flex-item-V">
          <view style="width: 100%;height: 50px;line-height: 50px;text-align: center;">
            暂无数据
          </view>
        </template>
      </view>
    </view>
    <!-- <view class="flex-item flex-item-V">
		</view> -->
    <!-- 页面底部收益栏 -->
    <view class="flex-item-V getOrout">
      <view v-if="showList"
            class="flex-item flex-item-V back-white uni-flex getOroutList">
        <text class="flex-box1"
              :style="{color:totalCount>0?'red':'green'}">今日预计{{totalCount>0?'收益':'亏损'}}：{{totalCount}}元</text>
        <text class="flex-box1 viewPhoto"
              @click="openPop">
          <!-- <text class="viewPhoto-text">查看指数图</text> -->
        </text>
      </view>
      <!-- <view class="back-white" style="display: flex;align-items: center;justify-content:center;border-top: 1px solid #F1F1F1;" @click="getSharesData">
				刷新<uni-icons class="icon flex-item" type="refreshempty" size="30" />
			</view> -->
    </view>
    <!-- 指数图 -->
    <uni-popup ref="popup">
      <view class="uni-padding-wrap">
        <view class="page-section swiper">
          <view class="page-section-spacing">
            <swiper class="swiper"
                    :autoplay="true"
                    :interval="3000"
                    :duration="500"
                    :circular="true">
              <swiper-item v-for="(img,index) in imgs"
                           :key="index">
                <image class="swiper-img"
                       :src="img.src"
                       mode=""></image>
              </swiper-item>
            </swiper>
          </view>
        </view>
      </view>
    </uni-popup>
    <!-- 更改持仓 -->
    <uni-popup ref="chicangpopup">
      <view class="chicangpopup">
        <text style="font-size: 18px;font-weight: bold;">填写新的持仓</text>
        <view class="search-warpper">
          <input class="search search-box"
                 style="margin: 20px 10px;"
                 v-model="newchicang"
                 placeholder="持仓"></input>
        </view>
        <button @click="updateChicang"
                type="default"
                size="mini">确认更改</button>
      </view>
    </uni-popup>
  </view>
</template>
<script>
import uniNumberBox from "@/components/uni-number-box/uni-number-box.vue"
import uniIcons from "@/components/uni-icons/uni-icons.vue"
import uniPopup from '@/components/uni-popup/uni-popup.vue'
import uniPopupMessage from '@/components/uni-popup/uni-popup-message.vue'
import uniPopupDialog from '@/components/uni-popup/uni-popup-dialog.vue'
import uniBadge from "@/components/uni-badge/uni-badge.vue"
// TODO 修复Android v3 加载过慢问题
// #ifdef APP-PLUS
var domModule = weex.requireModule('dom');
domModule.addRule('fontFace', {
  'fontFamily': "uniicons",
  'src': "url('/static/uni.ttf')"
});
// #endif

export default {
  name: 'my',
  components: {
    uniIcons,
    uniPopup,
    uniPopupMessage,
    uniPopupDialog,
    uniBadge,
    uniNumberBox
  },
  data () {
    return {
      sharesData: [],
      listMockData: [{
        label: '基金名称',
        value: 'NAME',
        width: '50%',
        textAlign: 'left'
      },
      // {
      // 	label: '净值',
      // 	value: 'DWJZ',
      // 	width: '25%',
      // 	textAlign: 'center'
      // },
      // {
      // 	label: '净值',
      // 	value: 'DWJZ',
      // 	width: '25%',
      // 	textAlign: 'center'
      // },
      {
        label: '估值',
        value: 'gszzl',
        width: '25%',
        textAlign: 'center'
      },
      {
        label: '持仓',
        value: 'chicang',
        width: '25%',
        textAlign: 'center'
      },
      {
        label: '预计收益',
        value: 'inOrOut',
        width: '25%',
        textAlign: 'center'
      },
      ],
      signList: ['RZDF', 'gszzl'],
      code: '',
      codes: '',
      currentCode: '',
      search: {
        placeholder: '输入神秘代码,示例（320007）'
      },
      showList: true,
      totalCount: 0, // 今日总shou'yi 
      inputValue: '',
      imgs: [{
        src: 'http://webquoteklinepic.eastmoney.com/GetPic.aspx?token=44c9d251add88e27b65ed86506f6e5da&nid=1.000001&type=&unitWidth=-6&ef=&formula=RSI&imageType=KXL'
      },
      {
        src: 'http://webquotepic.eastmoney.com/GetPic.aspx?nid=0.399001&imageType=r&token=44c9d251add88e27b65ed86506f6e5da'
      },
      {
        src: 'http://webquotepic.eastmoney.com/GetPic.aspx?nid=0.399006&imageType=r&token=44c9d251add88e27b65ed86506f6e5da'
      }
      ],
      indexList: [],
      newchicang: '',
      currentFCODE: ''
    }
  },
  onLoad () {
    if (this.first) {
      this.getSharesData()
      this.getIndex()
    }
    // setTimeout(()=>{this.$refs.chicangpopup.open()},0)
    this.first = true
    setInterval(() => {
      this.getIndex()
      this.getSharesData()
    }, 10000)
  },
  onShow () {
    this.getSharesData()
    this.getIndex()
  },
  methods: {
    bindChange (val) {
      this.newchicang = val
    },
    updateChicang () {
      console.log(this.currentFCODE, this.newchicang)
      this.updataHasMoney('', this.currentFCODE, '', this.newchicang)
      this.$refs.chicangpopup.close()
      this.refresh()
    },
    // 修改持仓
    changeChiCang (val1, val2) {
      console.log(val1, val2)
      this.currentFCODE = val1.FCODE
      this.$refs.chicangpopup.open()
    },
    refresh () {
      this.currentFCODE = ''
      this.getSharesData()
      this.getIndex()
    },
    updataHasMoney (FSRQDay, code, RZDF, newchiyou) {
      if (!FSRQDay) {
        FSRQDay = new Date()
      }
      if (!uni.getStorageSync('about') || !uni.getStorageSync('about').hasOwnProperty(code)) {
        return
      }
      // about -- 持仓情况
      let about = uni.getStorageSync('about') || {}
      let money = Number(about[code]['hasHowMuchMoney']) || 0
      let date = about[code]['date'] // 保存时的时间
      if (FSRQDay && RZDF && date < FSRQDay) {
        money = Number.parseFloat(money * (1 + Number(RZDF) / 100)).toFixed(2)
        date = FSRQDay
      }
      about[code]['hasHowMuchMoney'] = money
      if (newchiyou) {
        about[code]['hasHowMuchMoney'] = newchiyou
      }
      about[code]['date'] = FSRQDay
      console.log(about)
      uni.setStorageSync('about', about)
    },
    // 获取指数数据
    getIndex () {
      uni.showLoading({
        title: '实时获取指数数据中...'
      });
      uni.request({
        url: 'https://swt.gosql.cn/fund/index/market',
        method: 'GET',
        withCredentials: true
      })
        .then(response => {
          var [error, res] = response
          const {
            code,
            data,
            msg
          } = res.data
          uni.hideLoading()
          if (code === 1) {
            this.indexList = data.a
          } else {
            this.toast(msg)
          }
        })
    },
    openPop () {
      this.$refs.popup.open()
    },
    searchClick () {
      this.confirm()
    },
    routeTo (msg) {
      uni.navigateTo({
        url: `../about/index?codes=${msg.FCODE}`
      })
    },
    del (item) {
      const about = uni.getStorageSync('about')
      if (about.hasOwnProperty(item.FCODE)) {
        this.$delete(about, [item.FCODE])
        console.log(about)
        uni.setStorageSync('about', about)
      }
      const codes = uni.getStorageSync('codes')
      let codesArray = codes.split('_')
      codesArray = codesArray.filter((value) => value !== item.FCODE)
      if (codesArray.length) {
        codesArray = codesArray.join('_')
        uni.setStorageSync('codes', codesArray)
        this.codes = codesArray
      } else {
        uni.removeStorageSync('codes');
        this.codes = ''
      }
      this.getSharesData()
    },
    cleanStorage () {
      uni.clearStorageSync();
    },
    checkIsRepeat (value) {
      // 获取实时codes
      this.codes = uni.getStorageSync('codes')
      let codesArray = this.codes.split('_')
      return codesArray.find(item => item === value)
    },
    toast (msg) {
      uni.showToast({
        title: msg,
        duration: 2000,
        icon: 'none'
      });
    },
    confirm () {
      // this.$refs.input.value
      const value = this.inputValue
      let msg
      uni.showLoading({
        title: '加载中'
      });
      if (typeof Number(value) !== 'number' || String(value).length !== 6) {
        msg = '格式错误'
      } else if (this.checkIsRepeat(value)) {
        msg = '重复代码'
      } else {
        let code
        // 设置当前code
        this.code = value
        // 不是第一条
        if (this.codes) {
          this.codes = this.codes + '_' + value
        } else {
          this.codes = value
        }
        // uni.setStorageSync('codes', codes)
        this.checkData()
        return
      }
      this.toast(msg)
    },
    // 检查当前code是否合法
    checkData () {
      uni.request({
        url: 'https://swt.gosql.cn/fund/index/setUserCode',
        data: {
          fund_code: this.code,
          _ajax: 1
        },
        method: 'POST',
        withCredentials: true
      })
        .then(response => {
          var [error, res] = response
          const {
            code,
            data,
            msg
          } = res.data
          if (code === 1) {
            uni.setStorageSync('codes', this.codes)
            this.getSharesData()
          } else {
            this.toast(msg)
          }
        })
    },
    // 获取数据
    getSharesData () {
      this.totalCount = 0
      const _this = this
      uni.showLoading({
        title: '加载中'
      });
      const codes = uni.getStorageSync('codes') || ''
      if (uni.getStorageSync('codes')) {
        this.codes = codes
      } else {
        this.sharesData = []
      }
      uni.request({
        url: `https://swt.gosql.cn/fund/index/index?codes=${codes}`,
        // data: {
        // 	codes: codes,
        // 	_ajax: 1
        // },
        method: 'POST',
        withCredentials: true
      })
        .then(response => { //data为一个数组，数组第一项为错误信息，第二项为返回数据
          var [error, res] = response;
          const {
            code,
            msg
          } = res.data
          let {
            data
          } = res.data
          if (code !== 1) {
            this.toast(msg)
            return
          }
          if (!data.length) {
            _this.showList = false
            return
          }
          const about = uni.getStorageSync('about') || {}
          let totalCount = 0
          for (let i = 0, length = data.length; i < length; i++) {
            // 设置字体颜色
            if (data[i].gszzl >= 0) {
              data[i].color = "red"
            } else {
              data[i].color = "green"
            }
            // 更新持仓
            const date = new Date(data[i].FSRQ).getDate()
            this.updataHasMoney(date, data[i].FCODE, data[i].RZDF)
            // 计算盈亏 如果本地储存存在该基金的code
            if (about[data[i].FCODE] && about[data[i].FCODE] !== 0) {
              data[i].inOrOut = (about[data[i].FCODE]['hasHowMuchMoney'] * data[i].gszzl / 100).toFixed(2) || '0'
              // 计算盈亏
              totalCount = (Number.parseFloat(Number(totalCount) +
                Number((about[data[i].FCODE]['hasHowMuchMoney'] * data[i].gszzl / 100))).toFixed(2))
              data[i].chicang = about[data[i].FCODE]['hasHowMuchMoney'] ? Number((about[data[i].FCODE]['hasHowMuchMoney'])) : 0
            } else {
              // data[i].inOrOut = '详情'
              // data[i].color = "#409EFF"
            }
          }
          this.totalCount = totalCount
          _this.sharesData = data
          _this.showList = true
          uni.hideLoading()
        })
    },
    // qq 小程序专用f分享
    onShareAppMessage: function () {
      qq.showShareMenu({
        showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../../common/uni.css";
$uni-searchbar-height: 36px;

.chicangpopup {
  margin: 0 auto;
  text-align: center;
  width: 80vw;
  height: 40vw;
  background-color: #ffffff;
}

.my {
  height: 100vh;
  overflow: hidden;

  .search-warpper {
    align-items: center;

    .search-box {
      display: block;
      // height: 100%;
      background: white;
      border: 1px solid #bebebe;
      border-radius: 20px;
      padding: 5px 10px;
    }

    .search {
      flex: 1;
    }
  }

  .list-header {
    display: flex;
    overflow-x: auto;
    background: #ffffff;
    border-bottom: 1px solid #f1f1f1;

    .index-item {
      flex: 1;
      padding: 5px 10px;
      border-right: 1px solid #f1f1f1;

      .nums {
        display: flex;
        align-items: center;

        .nums-text {
          padding: 0px 1px;
          color: #ffffff;
          font-size: 20upx;
          border-radius: 20%;
          margin-left: 2px;
        }
      }
    }
  }

  .list-body {
    flex: 1;
    overflow: auto;
  }

  .getOrout {
    flex: 0;
    z-index: 50;

    .getOroutList {
      height: 30px;
      line-height: 30px;
      padding-left: 20px;
      border-top: 1px solid #ececec;

      .viewPhoto {
        text-align: right;
        margin-right: 20px;

        .viewPhoto-text {
          padding: 1px 2px;
          background: #007aff;
          color: #ffffff;
          border-radius: 10%;
        }
      }
    }
  }
}

.swiper-img {
  width: 90vw;
}

.nodata {
  width: 100%;
  height: 20px;
  line-height: 20px;
  text-align: center;
}

.bor-bottom {
  border-bottom: 1px solid #f1f1f1;
}

/* 	.full-width {
		width: 100%;
	} */

.back-white {
  background: #fff;
}

.pad {
  padding: 10px 0;
}

.pad-right {
  padding-right: 5px;
}

.pad-right:first-child {
  padding: 0 5px;
}

.mar-top {
  /* margin-top: 20px; */
  border-bottom: 1px solid #f1f1f1;
}

.mar-top:first-child {
  margin: 0;
}

.uni-searchbar {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: row;
  position: relative;
  padding: 16rpx;
  background-color: #ffffff;
}

.uni-searchbar__box {
  /* #ifndef APP-NVUE */
  display: flex;
  box-sizing: border-box;
  /* #endif */
  overflow: hidden;
  position: relative;
  flex: 1;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  height: 36px;
  padding: 5px 8px 5px 0px;
  border-width: 0.5px;
  border-style: solid;
  border-color: #e5e5e5;
}

.uni-searchbar__box-icon-search {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: row;
  width: 32px;
  justify-content: center;
  align-items: center;
  color: #808080;
}

.uni-searchbar__box-search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.uni-searchbar__box-icon-clear {
  align-items: center;
  line-height: 24px;
  padding-left: 5px;
}

.uni-searchbar__text-placeholder {
  font-size: 28rpx;
  color: #808080;
  margin-left: 5px;
}

.uni-searchbar__cancel {
  padding-left: 10px;
  line-height: 36px;
  font-size: 14px;
  color: #333;
}

.icon {
  width: 30px;
  flex: 0;
  padding-right: 10px;
  // background-color: #FFFFFF;
}

.flex-box1 {
  flex: 1;
}
</style>
