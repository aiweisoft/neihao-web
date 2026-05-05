<template>
	<view class="uni-sub-menu">
		<view class="uni-sub-menu__title"  :class="{'is-disabled':disabled}" :style="{paddingLeft:paddingLeft}" @click="select">
			<view class="uni-sub-menu__title-sub" :style="{color:disabled?'#999':textColor}">
				<slot name="title"></slot>
			</view>
			<uni-icons class="uni-sub-menu__icon" :class="{transition:isOpen}" type="down" color="#bbb" size="14"></uni-icons>
		</view>
		<view class="uni-sub-menu__content" :class="{'uni-sub-menu--close':!isOpen}" :style="{'background-color':backgroundColor}">
			<view id="content--hook">
				<slot></slot>
			</view>
		</view>
	</view>
</template>

<script>
	import rootParent from '../uni-nav-menu/mixins/rootParent.js'
	export default {
		name: 'uniSubMenu',
		mixins: [rootParent],
		props: {
			// 唯一标识
			index: {
				type: [String,Object],
				default(){
					return ''
				}
			},
			// TODO 自定义类名
			popperClass: {
				type: String,
				default: ''
			},
			// TODO 是否禁用
			disabled: {
				type: Boolean,
				default: false
			},
			// 展开菜单的背景色
			backgroundColor: {
				type: String,
				default: '#f5f5f5'
			},
		},
		data() {
			return {
				height: 0,
				oldheight: 0,
				isOpen: false,
				textColor:'#303133'
			};
		},
		computed: {
			paddingLeft() {
				let subMenu = this.rootMenu && this.rootMenu.SubMenu && this.rootMenu.SubMenu.length || 0;
				return 20 + 20 * subMenu + 'px'
			}
		},
		created() {
			this.init()
		},
		destroyed() {
			// 销毁页面后，将当前页面实例从数据中删除
			if (this.$menuParent) {
				const menuIndex = this.$menuParent.subChildrens.findIndex(item => item === this)
				this.$menuParent.subChildrens.splice(menuIndex, 1)
			}
		},
		methods: {
			init() {
				// 所有父元素
				this.rootMenu = {
					NavMenu: [],
					SubMenu: []
				}
				this.childrens = []
				this.indexPath = []
				// 获取直系的所有父元素实例
				this.getParentAll('SubMenu', this)
				// 获取最外层父元素实例
				this.$menuParent = this.getParent('uniNavMenu', this)
				this.textColor = this.$menuParent.textColor
				// 直系父元素 SubMenu
				this.$subMenu = this.rootMenu.SubMenu

				// 将当前插入到menu数组中
				if(this.$menuParent){
					this.$menuParent.subChildrens.push(this)
				}
			},
			select() {
				if(this.disabled) return
				// 手动开关 sunMenu
				this.$menuParent.selectMenu(this)
			},
			open() {
				this.isOpen = true
			},
			close() {
				this.isOpen = false
			}
		}
	}
</script>

<style lang="scss">
	.uni-sub-menu {
		position: relative;
		/* background-color: #FFFFFF; */
	}

	.uni-sub-menu__title {
		display: flex;
		align-items: center;
		padding: 0 20px;
		padding-right: 12px;
		height: 50px;
		line-height: 50px;
		color: #334155;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		margin: 2px 8px;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.uni-sub-menu__title:hover {
		color: #6366f1;
		outline: none;
		background-color: #f1f5f9;
	}

	.uni-sub-menu__title-sub {
		display: flex;
		align-items: center;
		flex: 1;
		gap: 8px;
	}

	.uni-sub-menu--close {
		height: 0;
	}

	.uni-sub-menu__content {
		overflow: hidden;
	}

	.uni-sub-menu__icon {
		max-height: auto;
		transition: all 0.25s ease;
		opacity: 0.6;
	}

	.uni-sub-menu__title:hover .uni-sub-menu__icon {
		opacity: 1;
	}

	.transition {
		transform: rotate(-180deg);
	}

	.is-disabled {
		color: #cbd5e1;
	}

	.uni-sub-menu__title.is-disabled:hover {
		background-color: inherit;
		color: #cbd5e1;
		cursor: not-allowed;
	}

</style>
