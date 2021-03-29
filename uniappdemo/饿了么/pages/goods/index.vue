<template>
	<div ref="goods" class="goods" id="goods" :style="{ height:height}" @scroll="scroll">
		<vheader :seller="seller" />
		<vtag class="tag" :active="active" @tabs-click="tagclick" />
		<router-view ref="router" :seller="seller" @scrollToTop="scrollToTop" />

	</div>
</template>

<script>
	import axios from '@/js_sdk/gangdiedao-uni-axios'
	import vheader from '@/layout/header'
	import vtag from '@/layout/tag'
	import {
		getAll
	} from '@/api/send'
	import {
		debounce
	} from '@/utils'
	// import mixins from '@/mixins/cartcontrol'
	import store from '@/store'
	export default {
		name: 'goods',
		components: {
			vheader,
			vtag
		},
		// mixins: [mixins],
		// props: {
		//   seller: {
		//     type: Object,
		//     default () {
		//       return {}
		//     }
		//   }
		// },
		data() {
			return {
				goods: [],
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
				listHeight: [], // foods列表的高度
				scrollY: 0, // 存储foods当前坐标
				showCom: true,
				loading: false,
				ulkey: 0,
				currentIndex: 0,
				height: '',
				value: '',
				path: '/goods/foods',
				active: 0
			}
		},
		created() {
			this.initHeight()
		},
		mounted() {
			this.getAll()
		},
		methods: {
			initHeight() {
				if (this.$route.fullPath === '/goods/foods') {
					this.active = 0
					this.height = '93vh'
					return
				}
				if (this.$route.fullPath === '/goods/ratings') {
					this.active = 1
					this.height = '100vh'
					return
				}
				if (this.$route.fullPath === '/goods/seller') {
					this.active = 2
					this.height = '100vh'
					return
				}

			},
			scrollToTop() {
				this.$refs.goods.scrollTo(0, 0)
			},
			scroll() {
				// console.log(this.$route)
				if (this.$route.fullPath === '/goods/foods') this.$refs.router.computedTop()
			},
			tagclick(name) {
				const {
					detail
				} = name
				const index = detail.index
				if (index === 0) {
					// this.height = '93vh'
					this.path = '/goods/foods'
				} else if (index === 1) {
					// this.height = '100vh'
					this.path = '/goods/ratings'
				} else if (index === 2) {
					// this.height = '100vh'
					this.path = '/goods/seller'
				}
				// console.log(detail)
				this.$router.push({
					path: this.path
				})
				// uni.navigateTo({ url: this.path })
			},
			/*
			初始化数据（number）
			tip:后台初始化时number为'null',以及其他的页面无法根据（quancode）取到number,所以全程使用初始化的List进行操作，1可以解决无法取到Number的问题，2可以减少http请求
			*/
			initCount() {
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
			async getAll() {
				// if (this.$mode) {
				axios('../../static/data.json')
					.then((res) => {
						console.log('res', res)
						this.goods = res.data.goods
						// this.seller = res.data.seller
						store.commit('app/shopcar/shopCarDataSet', res.data.goods)
					})
				// } else {
				//   const data = await getAll()
				//   if (data.code === '200') {
				//     const goods = data.data.goods
				//     const arr = []
				//     // 过滤数据
				//     for (let i = 0, length = goods.length; i < length; i++) {
				//       const item = goods[i]
				//       if (item.foods && item.foods.length !== 0) {
				//         arr.push(item)
				//       }
				//     }
				//     this.goods = arr
				//     this.initCount() // 初始化count
				//   }
				// }
				this.loading = false
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import '@/assets/index.scss';

	.goods {
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
			background: -webkit-linear-gradient(top,
					rgba(7, 17, 27, 0.1),
					transparent,
					transparent);
			background: linear-gradient(to bottom,
					rgba(7, 17, 27, 0.1) transparent,
					transparent);
		}
	}
</style>
