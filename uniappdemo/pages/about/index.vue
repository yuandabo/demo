<template>
  <view class="about">
    <view class="flex-item flex-item-V about-search">
      <view class="uni-flex uni-row search-warpper">
        <!-- <uni-searchbar ref='search' class="flex-item search" :placeholder="search.placeholder" @confirm="confirm()"></uni-searchbar> -->
        <input class="flex-item search search-box"
               ref="input"
               type="number"
               value=""
               v-model="inputValue"
               placeholder="在这输入你的持仓.例(1000)" />
        <view class="icon">
          <uni-icons class="icon"
                     type="plus"
                     @click="searchClick"
                     size="30" />
        </view>
        <view class="icon">
          <uni-icons class="icon"
                     type="refresh-filled"
                     size="30"
                     @click="getSharesData" />
        </view>
      </view>
    </view>
    <view class="about-card">
      <uni-card title="今日收益情况"
                :extra="`本金：${currentMoney}元`">
        <view class="about-title">
          <view class="title-left">
            <view :style="{color:currentData.RZDF>0?'red':'green'}">
              日涨跌幅<br />
              <text class="rzdf">{{currentData.RZDF}}</text>
            </view>
          </view>
          <view class="title-right">
            <view class="dwjz-war">
              单位净值{{fsrq}}<br />
              <text class="dwjz">{{currentData.DWJZ}}</text>
            </view>
          </view>
        </view>
        <view class="about-content"
              :style="{color:getOrOut>0?'red':'green'}">
          {{getOrOut>0?'收韭菜':'被收割'}}：{{getOrOut}}元
        </view>
        <!-- <view class="">
				本金：{{currentMoney}}
			</view> -->
      </uni-card>
      <view class="about-tabs">
        <ms-tabs :list="list"
                 v-model="active"></ms-tabs>
      </view>
      <view class="qiun-charts"
            v-show="active===0&&showcharts">
        <canvas style="z-index: 10;"
                canvas-id="canvasLineA"
                id="canvasLineA"
                class="charts"
                @touchstart="touchLineA"></canvas>
      </view>
      <image v-if="active===1"
             class="about-img"
             :src="`http://j4.dfcfw.com/charts/pic6/${code}.png`"></image>
      <!-- 操作备忘录 -->
      <view class="about-details">
        操作备忘录：
        <textarea class="details-textarea"
                  placeholder="备忘录，可以放一些大佬们的操作、预持有时间、预收益率在此（失焦保存）"
                  v-model="textArea"
                  @blur="changeTextArea" />
      </view>
    </view>
    <!-- 底部操作按钮 -->
    <view class="button-check">
      <button class="checkBut"
              @click="selectToMy">
        {{isSelectWord}}
      </button>
      <button class="checkBut2"
              type="default"
              @click="open()">{{name}}重仓持股</button>
    </view>

    <!-- 持仓详情弹窗 -->
    <view class="had"
          v-show="show">
      <view class="had-mes">
        {{name}}持仓详情:
      </view>
      <view class="uni-flex uni-row had-about">
        <view class="flex-item about-had">
          重仓持股
        </view>
        <view class="flex-item about-eva">
          估值
        </view>
      </view>
      <view class="uni-flex uni-row had-list"
            :style="{color:item.ChangeRatio>0?'red':'green'}"
            v-for="(item) in Holds"
            :key="item.CYGP">
        <view class="flex-item list-sname">
          {{item.SName}}
        </view>
        <view class="flex-item list-item">
          {{computedFloatNum(item.ChangeRatio)}}
        </view>
      </view>
      <button type="default"
              class="button-close"
              @click="closeHad">关闭</button>
    </view>
  </view>
</template>

<script>
import uniSearchbar from "@/components/uni-search-bar/uni-search-bar";
import uniCard from '@/components/uni-card/uni-card.vue'
import msTabs from '@/components/ms-tabs/ms-tabs.vue'
import uCharts from '@/js_sdk/u-charts/u-charts/u-charts.js'
// 
// import { setDb, etDb, setMarkIntoDb, getMarkIntoDb } from '@/utils/localStrorage'
var _self;
var canvaLineA = null;
export default {
  components: {
    uniSearchbar,
    uniCard,
    msTabs
  },
  data () {
    return {
      code: '',
      currentData: {},
      search: {
        placeholder: '输入持仓金额'
      },
      about: {},
      getOrOut: 0,
      Holds: [],
      show: false,
      inputValue: '',
      currentMoney: 0,
      name: '',
      list: [{
        title: '业绩走势图'
      }, {
        title: '净值估算图'
      }],
      active: 0,
      cWidth: '',
      cHeight: '',
      pixelRatio: 1,
      line: {
        categories: [],
        series: []
      },
      showcharts: true,
      isSelectWord: '',
      textArea: ''//操作注释
    }
  },
  computed: {
    fsrq () {
      if (this.currentData.FSRQ) {
        return (this.currentData.FSRQ).substring(5, 10) + '更新'
      }
      return ''
    }
  },
  onLoad: function (option) { //option为object类型，会序列化上个页面传递的参数
    this.code = option.codes
    this.getSharesData()
    this.selectWord()
    this._initMark()
    //
    _self = this;
    this.cWidth = uni.upx2px(750);
    this.cHeight = uni.upx2px(500);
  },
  methods: {
    setDb (key, value) {
      uni.setStorageSync(key, value)
    },
    //  取缓存
    getDb (key) {
      return uni.getStorageSync(key)
    },
    // 存储mark
    setMarkIntoDb (code, mark) {
      const obj = this.getDb('about')
      // obj[code].mark = mark
      this.$set(obj[code], 'mark', mark)
      console.log('obj', obj, code)
      this.setDb('about', obj)
    },
    // 获取mark
    getMarkIntoDb (code) {
      const obj = this.getDb('about')
      if (obj[code].hasOwnProperty('mark')) return obj[code].mark
      return ''
    },
    _initMark () {
      this.textArea = this.getMarkIntoDb(this.code) || ''
    },
    // 修改备注
    changeTextArea () {
      this.setMarkIntoDb(this.code, this.textArea)
    },
    selectWord () {
      const codes = uni.getStorageSync('codes') || ''
      let codesArray = codes.split('_')
      // const isSel = codesArray.find(item => item === this.code) ? '取消自选' : '加自选'
      this.isSelectWord = codesArray.find(item => item === this.code) ? '取消自选' : '加自选'
    },
    // 自选按钮
    selectToMy () {
      let codes = uni.getStorageSync('codes')
      let codesArray = codes.split('_')
      if (this.isSelectWord === '取消自选') {
        codesArray = codesArray.filter((value) => value !== this.code) // 保留不同
        // 不是空数组
        if (codesArray.length) {
          // 
          codesArray = codesArray.join('_')
          uni.setStorageSync('codes', codesArray)
        } else {
          // 清除缓存
          uni.removeStorageSync('codes');
        }
      } else {
        // 加入自选
        if (codesArray.length) {
          codes = codes + `_${this.code}`
        } else {
          codes = this.code
        }
        uni.setStorageSync('codes', codes)
      }
      console.log(uni.getStorageSync('codes'))
      // this.getSharesData()
      this.selectWord()
    },
    // 折线图
    showLineA (canvasId, chartData) {
      canvaLineA = new uCharts({
        $this: _self,
        canvasId: canvasId,
        type: 'line',
        fontSize: 8,
        legend: {
          show: false
        },
        dataLabel: false,
        dataPointShape: false,
        background: '#FFFFFF',
        pixelRatio: _self.pixelRatio,
        categories: chartData.categories,
        series: chartData.series,
        animation: true,
        xAxis: {
          type: 'grid',
          gridColor: '#CCCCCC',
          gridType: 'dash',
          dashLength: 8,
          labelCount: 3,
          disableGrid: true
          // itemCount:3
        },
        yAxis: {
          disabled: false,
          // showTitle: true,
          axisLine: false,
          calibration: false,
          // disableGrid: true,
          disableGrid: false,
          gridType: 'solid',
          gridColor: '#e5e5e5',
          dashLength: 8,
          splitNumber: 4,
          min: -10,
          max: 10,
          format: (val) => {
            return val.toFixed(0) + '%'
          }
        },
        width: _self.cWidth * _self.pixelRatio - 20,
        height: _self.cHeight * _self.pixelRatio,
        extra: {
          line: {
            type: 'straight'
          }
        }
      });

    },
    touchLineA (e) {
      canvaLineA.showToolTip(e, {
        format: function (item, category) {
          return category + ' ' + item.name + ':' + item.data
        }
      });
    },
    computedFloatNum (num) {
      if (num !== '--') {
        return (Number.parseFloat(num) * 100).toFixed(2) + '%'
      }
      return num
    },
    searchClick () {
      this.confirm()
    },
    onShareAppMessage: function () {
      qq.showShareMenu({
        showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
      })
    },
    // 计算今日盈亏
    computeGetOrOut () {
      const obj = uni.getStorageSync('about') || {}
      if (obj[this.code]) {
        // 本金
        this.currentMoney = obj[this.code].hasHowMuchMoney
        this.getOrOut = Number.parseFloat((obj[this.code].hasHowMuchMoney * this.currentData.gszzl / 100)).toFixed(2)
      }
    },
    toast (msg) {
      uni.showToast({
        title: msg,
        duration: 2000,
        icon: 'none'
      });
    },
    confirm () {
      if (!this.inputValue) {
        this.toast('请输入持仓再确定')
        return
      } else if (this.inputValue == 0) {
        this.$delete(this.about, this.code)
        uni.setStorageSync('about', this.about)
        return
      }
      const value = this.inputValue
      this.currentMoney = value
      const obj = uni.getStorageSync('about') || {}
      uni.showLoading({
        title: '加载中'
      });
      this.about[this.code] = {
        hasHowMuchMoney: value,
        date: new Date().getDate()
      }
      this.about = Object.assign(obj, this.about)
      this.getOrOut = value * this.currentData.gszzl / 100
      uni.setStorageSync('about', this.about)
      uni.hideLoading()
    },
    getSharesData () {
      const _this = this
      uni.showLoading({
        title: '加载中'
      });
      uni.request({
        url: `https://swt.gosql.cn/fund/index/index?codes=${this.code}`,
        // data: {
        // 	codes: this.code,
        // 	_ajax: 1
        // },
        method: 'POST'
      })
        .then(response => { //data为一个数组，数组第一项为错误信息，第二项为返回数据
          var [error, res] = response;
          uni.hideLoading()
          const {
            code,
            msg
          } = res.data
          let {
            data
          } = res.data
          if (code !== 1) {
            uni.showToast({
              title: msg,
              duration: 2000,
              icon: 'none'
            })
            return
          }
          if (!data.length) {
            _this.showList = false
            return
          }
          _this.currentData = data[0]
          this.Holds = data[0].Holds
          this.name = data[0].NAME
          // 初始化折线图数据
          const arr = data[0].DAYRESULT.reverse()
          let series = []
          for (let i = 0, length = arr.length; i < length; i++) {
            this.line.categories.push(arr[i].FSRQ)
            series.push(arr[i].JZZZL)
            // if(i===0||i/3===0||i===length-1){
            // }
          }
          this.line.series.push({
            name: '业绩走势',
            data: series
          })
          if (this.line.series.length !== 0) {
            _self.showLineA("canvasLineA", this.line);
          }
          uni.setNavigationBarTitle({
            title: data[0].NAME
          });
          this.computeGetOrOut()
          uni.hideLoading()
        })
    },
    open () {
      this.show = true
      this.showcharts = false
    },
    closeHad () {
      this.show = false
      this.showcharts = true
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../../common/uni.css";

page {
  background: #ffffff;
}

.about {
  height: 100vh;
  display: flex;
  flex-direction: column;
  // overflow: auto;
  .about-search {
    flex: 0;

    .search-warpper {
      align-items: center;
    }
  }

  .about-card {
    flex: 1;
    overflow: auto;
  }

  .about-tabs {
    height: 50px;
  }
}

.icon {
  width: 30px;
  flex: 0;
  padding-right: 10px;
  // background-color: #FFFFFF;
}
.about-details {
  margin: 7px;
  border-top: 5px solid #efeff4;
  height: 200px;
  background-color: #ffffff;
  .details-textarea {
    width: 100%;
    height: 100%;
  }
}
.about-title {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30upx;
  // height: 88upx;
  // line-height: 88upx;
  color: #686868;
  align-items: center;
  // text-align: center;
  box-sizing: border-box;
  // border-bottom: 2upx solid #D8D8D8;
  background-color: #ffffff;

  .title-left {
    flex: 1;
    text-align: center;

    .rzdf {
      font-size: 45upx;
    }
  }

  .title-right {
    flex: 1;
    text-align: center;

    .dwjz-war {
      overflow: hidden;
    }

    .dwjz {
      font-size: 45upx;
    }
  }
}

.about-content {
  // margin-top: 10px;
  padding: 0 10px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  background-color: #ffffff;
  font-size: 30upx;
}

.about-img {
  margin: 10px auto;
  display: block;
  width: 90%;
  border-radius: 10px;
  // position: absolute;
  // bottom: 10px;
}

.title-mon {
  width: 80px;
  text-align: center;
}

.search {
  flex: 1;
}

.search-box {
  display: block;
  // height: 100%;
  background: white;
  border: 1px solid #bebebe;
  border-radius: 20px;
  padding: 5px 10px;
}

.button-check {
  flex: 0;
  display: flex;
  // position: fixed;
  // bottom: 0;
  // height: 40px;
  // line-height: 40px;
  // background: #007AFF;
  color: #ffffff;
  font-size: 30upx;
  // margin-top: 20px;
  border-radius: 0px;
  width: 100%;
  font-size: 20upx;

  .checkBut {
    flex: 1;
    font-size: 25upx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #007aff;
  }

  .checkBut2 {
    flex: 5;
    font-size: 25upx;
    background: #007aff;
    display: flex;
    align-items: center;
    overflow: hidden;
    justify-content: center;
    color: #ffffff;
    text-overflow: ellipsis;
    word-break: break-word;
  }

  // border: 1px solid #E5E5E5;
}

.had {
  padding: 20px 0;
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 95vh;
  // border-radius: 40px 40px 0 0;
  // border: 1px solid #E5E5E5;
  // height: 50vh;
  background: white;
  z-index: 9999;

  .had-mes {
    margin: 0 0 20px 20px;
    font-size: 16px;
    // font-weight: bold;
    display: flex;
    align-items: center;

    .had-about {
      justify-content: center;
      align-items: center;

      .about-had {
        text-align: center;
        background: white;
      }

      .about-eva {
        text-align: center;
        background: white;
      }
    }
  }

  .had-list {
    justify-content: center;
    align-items: center;

    .list-sname {
      text-align: center;
      background: white;
      padding: 7px 0;
      border-bottom: 1px solid #d9d9d9;
      margin-left: 10px;
    }

    .list-item {
      text-align: center;
      background: white;
      padding: 7px 0;
      border-bottom: 1px solid #d9d9d9;
      margin-right: 10px;
    }
  }
}

.flex-item {
  flex: 1;
}

.button-close {
  position: fixed;
  bottom: 0;
  height: 40px;
  line-height: 40px;
  background: #007aff;
  color: #ffffff;
  font-size: 30upx;
  // margin-top: 20px;
  border-radius: 0px;
  width: 100%;
}

.qiun-charts {
  width: 730upx;
  margin: 0 auto;
  // height: 300upx;
  background-color: #ffffff;
  border-top: 5px solid rgb(239, 239, 244);
  position: relative;
  top: 5px;
}

.charts {
  width: 730upx;
  height: 500upx;
  background-color: #ffffff;
}
</style>
