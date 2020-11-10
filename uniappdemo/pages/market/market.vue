<template>
	<view class="market">
		<view class="flex-item flex-item-V market-listHeader">
			<view class="uni-flex uni-row back-white uni-card-header bor-bottom flex-item flex-item-V">
				<view class="pad-right" :style="{width:item.width,textAlign:item.textAlign}" v-for="(item,index) in listMockData"
				 :key="index">
					{{item.label}}
				</view>
			</view>
		</view>
		<view class="flex-item flex-item-V uni-flex uni-column market-listBodyer">
			<view class="flex-item flex-item-V listBodyer-warpper">
				<template v-if="showList" class="flex-item flex-item-V">
					<view class="mar-top back-white uni-card-content" v-for="(item,index) in sharesData" :key="index" @click="routeTo(item)">
						<view class="uni-flex uni-row pad" style="width: 100%;">
							<view class="pad-right" :style="{width:item2.width,color:'#000000'}" v-for="(item2,index2) in listMockData"
							 :key="index2">
								<view class="uni-flex uni-column">
									<view class="flex-item pad-right uni-flex uni-row font-12px" :style="{justifyContent:item2.width==='25%'?'center':'left'}">
										<span class="flex-item">{{item[item2.value]}}</span>
										<span class="flex-item" v-if="signList.indexOf(item2.value)!== -1">
											%
										</span>
									</view>
								</view>
							</view>
						</view>
					</view>
				</template>
				<template v-else class="flex-item flex-item-V">
					<view style="width: 100%;height: 50px;line-height: 50px;text-align: center;">
						暂无数据
					</view>
				</template>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				listMockData: [{
						label: '鸡名',
						value: 'SHORTNAME',
						width: '50%',
						textAlign: 'left'
					},
					{
						label: '单位净值',
						value: 'DWJZ',
						width: '25%'
					},
					{
						label: '发财代码',
						value: 'FCODE',
						width: '25%',
						textAlign: 'center'
					},
					{
						label: '日涨跌幅',
						value: 'RZDF',
						width: '25%',
						textAlign: 'right'
					}
				],
				showList: false,
				sharesData: [],
				signList: ['RZDF', 'gszzl'],
			};
		},
		created() {
			this.getSharesData()
			uni.setNavigationBarTitle({
				title: '市场'
			});
		},
		onShow(){
			this.getSharesData()
		},
		methods: {
			routeTo(msg) {
				uni.navigateTo({
					url: `../about/index?codes=${msg.FCODE}`
				})
			},
			// 获取数据
			getSharesData() {
				uni.showLoading({
					title: '加载中'
				});
				uni.request({
						url: `https://swt.gosql.cn/fund/index/runking`,
						method: 'GET',
						withCredentials: true
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
							this.toast(msg)
							return
						}
						if (!data.length) {
							this.showList = false
							return
						}
						this.sharesData = data
						this.showList = true
					})
			},
			onShareAppMessage: function() {
				qq.showShareMenu({
					showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import '../../common/uni.css';
	.market{
		display: flex;flex-direction: column;overflow: hidden;height: 100vh;
		.market-listHeader{
			flex: 0;
		}
		.market-listBodyer{
			flex: 1;overflow: auto;
			.listBodyer-warpper{
				flex:1;overflow:auto;
			}
		}
	}
	.back-white {
		background: #FFF;
	}

	.bor-bottom {
		border-bottom: 1px solid #F1F1F1;
	}

	.pad-right {
		padding-right: 5px;
	}

	.pad-right:first-child {
		padding: 0 5px;
	}

	.mar-top {
		/* margin-top: 20px; */
		border-bottom: 1px solid #F1F1F1;
	}

	.mar-top:first-child {
		margin: 0;
	}

	.pad {
		padding: 10px 0;
	}
</style>
