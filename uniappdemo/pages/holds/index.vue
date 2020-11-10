<template>
	<view class="holds">
		<view class="total">
			<view class="total-title">
				总金额(元)
			</view>
			<view class="total-nums">
				{{total}}
			</view>
			<view class="total-info">

			</view>
		</view>
		<view class="list">
			<view v-for="(item,index) in sharesData" :key="index">
				<uni-card :title="item.NAME">
					<view class="cart">
						<view class="cart-money">
							<view class="money-title">
								金额
							</view>
							<view class="money-content">
								{{item.hasHowMuchMoney}}
							</view>
						</view>
					</view>
				</uni-card>
			</view>
		</view>
		<view class="">

		</view>
		<view class="">

		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				total: 0,
				sharesData: []
			};
		},
		created() {
			uni.setNavigationBarTitle({
				title: '基金'
			})
			this.computedTotal()
			this.getSharesData()
		},
		onShow() {
			this.computedTotal()
			this.getSharesData()
		},
		methods: {
			// 计算总持仓
			computedTotal() {
				this.total = 0
				const about = uni.getStorageSync('about')
				for (let i in about) {
					if (about[i].hasOwnProperty('hasHowMuchMoney')) {
						this.total += Number(about[i]['hasHowMuchMoney'])
					}
				}
			},
			// 获取数据
			getSharesData() {
				uni.showLoading({
					title: '加载中'
				});
				const about = uni.getStorageSync('about')
				if (Object.keys(about).length===0) {
					this.sharesData = []
					uni.hideLoading()
					return
				}
				const codes =Object.keys(about).join('_')
				uni.request({
						url: `https://swt.gosql.cn/fund/index/index?codes=${codes}`,
						method: 'POST',
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
						const about = uni.getStorageSync('about') || {}
						for (let i = 0, length = data.length; i < length; i++) {
							if (about.hasOwnProperty(data[i]['FCODE'])) {
								data[i].hasHowMuchMoney = about[data[i]['FCODE']].hasHowMuchMoney
							} else {
								data[i].hasHowMuchMoney = 0
							}
						}
						this.sharesData = data
					})
			}
		}
	}
</script>

<style lang="scss">
	.holds {
		display: flex;
		flex-direction: column;
		height: 100vh;
		// background: #FFFFFF;
		z-index: -1;

		.total {
			padding: 50px 10px;
			flex: 0;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			background: linear-gradient(#077fff, #4fa4ff);

			.total-title {
				padding: 5px 10px;
				font-size: 20upx;
				color: rgba(243, 243, 243, 0.5);
			}

			.total-nums {
				padding: 5px 20px;
				font-size: 40upx;
				color: #FFFFFF;
			}
		}

		.list {
			flex: 1;

			.cart {
				.cart-money {
					.money-title {
						font-size: 20upx;
						color: #BEBEBE;
					}

					.money-content {
						font-size: 25upx;
						color: #000000;
					}
				}
			}
		}
	}
</style>
