<template>
	<scroll-view class="sidebar" scroll-y="true">
		<uni-data-menu ref="menu" :value="currentMenu" :staticMenu="staticMenu" collection="opendb-admin-menus"
			:page-size="500" :field="field" where="enable==true" orderby="sort asc" active-text-color="#6366f1" @select="select">
		</uni-data-menu>
	</scroll-view>
</template>

<script>
	import {
		mapState,
		mapActions
	} from 'vuex'
	import config from '@/admin.config.js'
	export default {
		data() {
			return {
				...config.sideBar,
				field: 'url as value, name as text, menu_id, parent_id, sort, icon, permission',
				currentMenu: '/'
			}
		},
		computed: {
			...mapState('app', ['inited', 'navMenu', 'active']),
			userInfo () {
				return this.$uniIdPagesStore.store.userInfo
			}
		},

		watch: {
			// #ifdef H5
			$route: {
				immediate: true,
				handler(newRoute, oldRoute) {
					const path = newRoute.fullPath
					if (path) {
						this.currentMenu = this.splitFullPath(path)
					}
				}
			},
			// #endif
			userInfo: {
				handler(newVal, oldVal) {
					if (newVal) {
						this.$nextTick(function() {
							this.$refs.menu.load()
						})
					}
				}
			}
		},
		methods: {
			...mapActions({
				setRoutes: 'app/setRoutes'
			}),
			select(e, routes) {
				let url = e.value
				if (!url) {
					url = this.active
				}
				this.clickMenuItem(url)
				this.setRoutes(routes)
				// #ifdef H5
				// #ifdef VUE3
				uni.hideLeftWindow()
				// #endif
				// #endif
			},
			clickMenuItem(url) {
				// #ifdef H5
				if (url.indexOf('http') === 0) {
					return window.open(url)
				}
				// #endif
				if (url[0] !== '/' && url.indexOf('http') !== 0) {
					url = '/' + url
				}
				// #ifndef H5
				if (url === "/") {
					url = config.index.url;
				}
				// #endif
		uni.redirectTo({
				url: url,
				fail: () => {
					uni.showModal({
						title: '提示',
						content: '页面 ' + url + ' 跳转失败',
						showCancel: false
					})
				}
			})
			},
			splitFullPath(path) {
				if (!path) {
					path = '/'
				}
				return path.split('?')[0]
			},
		}
	}
</script>

<style lang="scss">
$primary: #6366f1;
$text: #1e293b;
$text-secondary: #64748b;
$border: #f1f5f9;
$hover-bg: #f8fafc;
$active-bg: rgba(99, 102, 241, 0.08);

.sidebar {
	position: fixed;
	width: 240px;
	height: calc(100vh - (var(--top-window-height)));
	box-sizing: border-box;
	border-right: 1px solid $border;
	background: linear-gradient(180deg, #fafbff 0%, #ffffff 40%);
	padding: 0 0 16px;
	overflow-y: auto;

	&::-webkit-scrollbar {
		width: 4px;
	}
	&::-webkit-scrollbar-thumb {
		background: #e2e8f0;
		border-radius: 4px;
	}
	&::-webkit-scrollbar-track {
		background: transparent;
	}
}

.uni-nav-menu {
	width: 240px !important;
	background-color: transparent !important;
	font-size: 14px;
}

.uni-sub-menu__title {
	display: flex;
	align-items: center;
	padding: 0 16px !important;
	padding-right: 12px !important;
	height: 46px !important;
	line-height: 46px !important;
	color: $text !important;
	cursor: pointer;
	font-size: 14px !important;
	font-weight: 600 !important;
	margin: 1px 8px !important;
	border-radius: 8px !important;
	transition: all 0.2s ease !important;

	&:hover {
		color: $primary !important;
		outline: none;
		background-color: $hover-bg !important;
	}

	.uni-sub-menu__title-sub {
		display: flex;
		align-items: center;
		flex: 1;
		gap: 10px;
	}

	.uni-icons {
		font-size: 14px !important;
		opacity: 0.5;
		transition: all 0.25s ease;
	}

	&:hover .uni-icons {
		opacity: 0.8;
	}
}

.uni-sub-menu__content {
	overflow: hidden;
	background-color: transparent !important;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		left: 24px;
		top: 4px;
		bottom: 4px;
		width: 2px;
		background: #e8eaf6;
		border-radius: 2px;
		pointer-events: none;
	}
}

.uni-sub-menu--close {
	height: 0 !important;
}

.uni-menu-item {
	display: flex;
	align-items: center;
	padding: 0 16px !important;
	padding-left: 48px !important;
	height: 40px !important;
	line-height: 40px !important;
	color: $text-secondary !important;
	transition: all 0.2s ease !important;
	cursor: pointer;
	position: relative;
	font-size: 13.5px !important;
	margin: 1px 8px !important;
	border-radius: 6px !important;

	&:hover {
		outline: none;
		background-color: $hover-bg !important;
		color: $text !important;
	}

	&::before {
		content: '';
		position: absolute;
		left: 20px;
		top: 50%;
		transform: translateY(-50%);
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #d1d5db;
		transition: all 0.2s ease;
	}

	&:hover::before {
		background: $primary;
		transform: translateY(-50%) scale(1.2);
	}

	&.is-active {
		color: $primary !important;
		background-color: $active-bg !important;
		font-weight: 600 !important;

		&::before {
			background: $primary;
			box-shadow: 0 0 6px rgba($primary, 0.4);
			transform: translateY(-50%) scale(1.3);
		}

		&:hover {
			background-color: rgba($primary, 0.1) !important;
		}
	}
}

.uni-menu-item .title {
	margin-left: 6px;
}

[class*="admin-icons-"],
[class^=admin-icons-] {
	font-size: 18px;
	width: 22px;
	text-align: center;
	flex-shrink: 0;
	transition: transform 0.2s ease;
}

.uni-sub-menu__title:hover [class*="admin-icons-"] {
	transform: scale(1.1);
}

.uni-menu-item:hover [class*="admin-icons-"] {
	transform: scale(1.1);
}

.is-active [class*="admin-icons-"] {
	color: $primary;
}
</style>
