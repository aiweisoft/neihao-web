<template>
	<view class="header">
		<!-- #ifdef H5 -->
		<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
			style="position: absolute; width: 0; height: 0">
			<symbol xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" id="icon-bug">
				<path
					d="M127.88 73.143c0 1.412-.506 2.635-1.518 3.669-1.011 1.033-2.209 1.55-3.592 1.55h-17.887c0 9.296-1.783 17.178-5.35 23.645l16.609 17.044c1.011 1.034 1.517 2.257 1.517 3.67 0 1.412-.506 2.635-1.517 3.668-.958 1.033-2.155 1.55-3.593 1.55-1.438 0-2.635-.517-3.593-1.55l-15.811-16.063a15.49 15.49 0 0 1-1.196 1.06c-.532.434-1.65 1.208-3.353 2.322a50.104 50.104 0 0 1-5.192 2.974c-1.758.87-3.94 1.658-6.546 2.364-2.607.706-5.189 1.06-7.748 1.06V47.044H58.89v73.062c-2.716 0-5.417-.367-8.106-1.102-2.688-.734-5.003-1.631-6.945-2.692a66.769 66.769 0 0 1-5.268-3.179c-1.571-1.057-2.73-1.94-3.476-2.65L33.9 109.34l-14.611 16.877c-1.066 1.14-2.344 1.711-3.833 1.711-1.277 0-2.422-.434-3.434-1.304-1.012-.978-1.557-2.187-1.635-3.627-.079-1.44.333-2.705 1.236-3.794l16.129-18.51c-3.087-6.197-4.63-13.644-4.63-22.342H5.235c-1.383 0-2.58-.517-3.592-1.55S.125 74.545.125 73.132c0-1.412.506-2.635 1.518-3.668 1.012-1.034 2.21-1.55 3.592-1.55h17.887V43.939L9.308 29.833c-1.012-1.033-1.517-2.256-1.517-3.669 0-1.412.505-2.635 1.517-3.668 1.012-1.034 2.21-1.55 3.593-1.55s2.58.516 3.593 1.55l13.813 14.106h67.396l13.814-14.106c1.012-1.034 2.21-1.55 3.592-1.55 1.384 0 2.581.516 3.593 1.55 1.012 1.033 1.518 2.256 1.518 3.668 0 1.413-.506 2.636-1.518 3.67l-13.814 14.105v23.975h17.887c1.383 0 2.58.516 3.593 1.55 1.011 1.033 1.517 2.256 1.517 3.668l-.005.01zM89.552 26.175H38.448c0-7.23 2.489-13.386 7.466-18.469C50.892 2.623 56.92.082 64 .082c7.08 0 13.108 2.541 18.086 7.624 4.977 5.083 7.466 11.24 7.466 18.469z">
				</path>
			</symbol>
		</svg>
		<!-- #endif -->
		<view class="navbar" :class="{'navbar-mini':!matchLeftWindow,'popup-menu':popupMenuOpened}">
			<view class="navbar-left">
				<view class="logo pointer" @click="linkTo">
					<image class="logo-image" :src="logo" mode="heightFix"></image>
					<text class="logo-text">{{appName}}</text>
				</view>
				<uni-icons @click="toggleSidebar" type="bars" class="menu-icon" size="30" color="#999"></uni-icons>
			</view>
			<view class="navbar-middle">
				<text class="title-text">{{navigationBarTitleText}}</text>
			</view>
			<view class="navbar-right pointer">
				<!-- #ifdef H5 -->
				<view v-if="logs.length" @click="showErrorLogs" class="menu-item debug pointer navbar-right-item-gap">
					<svg class="svg-icon">
						<use xlink:href="#icon-bug"></use>
					</svg>
					<uni-badge class="debug-badge" :text="logs.length" type="error"></uni-badge>
				</view>
				<!-- #endif -->
				<view @click="showAlerts" class="menu-item alert-bell pointer navbar-right-item-gap">
					<svg class="bell-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
						<path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
					</svg>
					<uni-badge v-if="alertCount > 0" class="alert-badge" :text="alertCount" type="error"></uni-badge>
				</view>

				<!-- 欢迎按钮 -->
				<view @click="showWelcome" class="menu-item welcome-btn pointer navbar-right-item-gap">
					<svg class="welcome-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
					</svg>
				</view>

				<!-- 主题选择器 -->
				<view class="navbar-right-item-gap" style="position: relative;" :class="{'popup-menu': themeMenuOpened}">
					<view class="theme-selector" @click="toggleThemeMenu">
						<uni-icons type="color-filled" size="24" color="#999" />
						<uni-icons class="arrowdown" type="arrowdown" color="#666" size="13"></uni-icons>
					</view>
					<view class="uni-mask" @click="closeThemeMenu" />
					<view class="theme-menu" :class="{ 'show': themeMenuOpened }">
						<view v-for="(theme, index) in themes" :key="index"
							class="menu-item hover-highlight"
							:class="{ 'active': themeIndex === index }"
							@click="changeTheme(index)">
							<text>{{ theme.text }}</text>
						</view>
						<view class="popup-menu__arrow"></view>
					</view>
				</view>

				<!-- 语言选择器 -->
				<view class="navbar-right-item-gap" style="position: relative;" :class="{'popup-menu': langMenuOpened}">
					<view class="lang-selector" @click="toggleLangMenu">
						<view class="admin-icons-lang" />
						<uni-icons class="arrowdown" type="arrowdown" color="#666" size="13"></uni-icons>
					</view>
					<view class="uni-mask" @click="closeLangMenu" />
					<view class="lang-menu" :class="{ 'show': langMenuOpened }">
						<view v-for="(lang, index) in langs" :key="index"
							class="menu-item hover-highlight"
							:class="{ 'active': langIndex === index }"
							@click="changeLanguage(index)">
							<text>{{ lang.text }}</text>
						</view>
						<view class="popup-menu__arrow"></view>
					</view>
				</view>

				<view class="" style="position: relative;">
					<view v-show="userInfo.nickname || userInfo.username || userInfo.mobile || userInfo.email" class="navbar-user" @click="togglePopupMenu">
						<view class="admin-icons-user user-icon" />
						<view class="username ml-s"><text>{{userInfo.nickname || userInfo.username || userInfo.mobile || userInfo.email}}</text></view>
						<uni-icons class="arrowdown" type="arrowdown" color="#666" size="13"></uni-icons>
					</view>
					<view class="uni-mask" @click="togglePopupMenu" />
					<view class="navbar-menu">
						<template v-if="userInfo.nickname || userInfo.username || userInfo.mobile || userInfo.email">
							<view class="menu-item hover-highlight" @click="changePassword">
								<text>修改密码</text>
							</view>
							<view class="menu-item hover-highlight">
								<text class="logout pointer" @click="logout">退出登录</text>
							</view>
						</template>
						<view class="popup-menu__arrow"></view>
					</view>
				</view>
			</view>
		</view>
		<uni-popup ref="errorLogsPopup" type="top">
			<view class="alert-popup-overlay">
				<view class="alert-modal-box error-log-modal">
					<view class="alert-modal-header">
						<text class="alert-modal-title">错误日志</text>
					</view>
					<view class="alert-modal-body">
						<error-log />
					</view>
					<view class="alert-modal-footer">
						<view class="btn-modal-close" @click="closeErrorLogs">关闭</view>
					</view>
				</view>
			</view>
		</uni-popup>
		<uni-popup ref="alertPopup" type="top">
			<view class="alert-popup-overlay">
				<view class="alert-modal-box">
					<view class="alert-modal-header">
						<text class="alert-modal-title">报警提醒</text>
						<text v-if="alertList.length" class="alert-modal-mark-all" @click="markAllAlertRead">全部标记已读</text>
					</view>
					<view class="alert-modal-body">
						<view v-if="alertList.length === 0" class="alert-empty">暂无未读提醒</view>
						<view v-for="item in alertList" :key="item._id" class="alert-item" @click="goAlert(item)">
							<view class="alert-item-left">
								<view class="alert-dot" :class="'alert-dot-' + (item.alert_type || 1)"></view>
							</view>
							<view class="alert-item-body">
								<view class="alert-item-title">{{ item.title || '未命名提醒' }}</view>
								<view class="alert-item-desc">{{ item.description || '' }}</view>
								<view class="alert-item-meta">
									<uni-tag :type="alertTypeTag(item.alert_type)" :text="alertTypeText(item.alert_type)" size="small" />
									<text class="alert-item-date">{{ item.alert_date_text }}</text>
								</view>
							</view>
						</view>
					</view>
					<view class="alert-modal-footer">
						<button class="btn-modal-close" @click="closeAlertPopup">关闭</button>
					</view>
				</view>
			</view>
		</uni-popup>
		<uni-popup ref="welcomePopup" type="center">
			<view class="welcome-modal">
				<view class="welcome-icon-wrap">
					<svg class="welcome-heart" viewBox="0 0 24 24" width="48" height="48" fill="currentColor" stroke="none">
						<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
					</svg>
				</view>
				<text class="welcome-text">欢迎使用</text>
				<text class="welcome-sub">医疗设备管理系统</text>
				<button class="welcome-btn-close" @click="closeWelcome">知道了</button>
			</view>
		</uni-popup>
		<!-- 冗余代码，临时处理 uni-datetime-picker 国际化不生效的问题 -->
		<!-- #ifdef H5 -->
		<uni-datetime-picker type="date" v-show="false"></uni-datetime-picker>
		<!-- #endif -->
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations
	} from 'vuex'

	import errorLog from '@/windows/components/error-log.vue'
	import config from '@/admin.config.js'

	export default {
		components: {
			errorLog
		},
		props: {
			navigationBarTitleText: {
				type: String
			},
			matchLeftWindow: {
				type: Boolean
			},
			showLeftWindow: {
				type: Boolean
			}
		},
		data() {
			return {
				...config.navBar,
				popupMenuOpened: false,
				themeMenuOpened: false,
				langMenuOpened: false,
				mpCapsule: 0,
				langIndex:0,
				alertCount: 0,
				alertList: []
			}
		},
		computed: {
			...mapState('app', ['appName', 'routes', 'theme']),
			...mapState('error', ['logs']),
			userInfo () {
				return this.$uniIdPagesStore.store.userInfo
			},
			themeIndex () {
				let i = 0
				this.themes.forEach((theme,index) => {
					if(theme.value === this.theme) i = index
				})
				return i
			}
		},
		mounted() {
			// #ifdef MP
			let menuButtonInfo = uni.getMenuButtonBoundingClientRect()
			this.mpCapsule = menuButtonInfo.width
			// #endif

			// #ifdef H5
			let locale = uni.getLocale();
			this.$nextTick(() => {
				let index = this.langs.findIndex((item) => {
					return item.lang === locale;
				});
				this.changeLanguage(index)
			})
			// #endif
			this.loadAlertCount()
			setInterval(() => this.loadAlertCount(), 60000)
		},
		methods: {
			...mapMutations('app',['SET_THEME']),
			showWelcome() {
				if (this.popupMenuOpened) {
					this.popupMenuOpened = false
				}
				this.$refs.welcomePopup.open()
			},
			closeWelcome() {
				this.$refs.welcomePopup.close()
			},
			showErrorLogs() {
				if (this.popupMenuOpened) {
					this.popupMenuOpened = false
				}
				this.$refs.errorLogsPopup.open()
			},
			showPasswordPopup() {
				if (this.popupMenuOpened) {
					this.popupMenuOpened = false
				}
				this.$refs.passwordPopup.open()
			},
			logout() {
				this.popupMenuOpened = false
				this.$uniIdPagesStore.mutations.logout()
			},
			toggleSidebar() {
				if (!this.showLeftWindow) {
					uni.showLeftWindow()
				} else {
					uni.hideLeftWindow()
				}
			},
			togglePopupMenu() {
				this.popupMenuOpened = !this.popupMenuOpened
				// 关闭其他菜单
				if (this.popupMenuOpened) {
					this.themeMenuOpened = false
					this.langMenuOpened = false
				}
			},
			toggleThemeMenu() {
				this.themeMenuOpened = !this.themeMenuOpened
				// 关闭其他菜单
				if (this.themeMenuOpened) {
					this.popupMenuOpened = false
					this.langMenuOpened = false
				}
			},
			toggleLangMenu() {
				this.langMenuOpened = !this.langMenuOpened
				// 关闭其他菜单
				if (this.langMenuOpened) {
					this.popupMenuOpened = false
					this.themeMenuOpened = false
				}
			},
			closeThemeMenu() {
				this.themeMenuOpened = false
			},
			closeLangMenu() {
				this.langMenuOpened = false
			},
			changePassword() {
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/userinfo/change_pwd/change_pwd',
					complete: () => {
						this.popupMenuOpened = false
					}
				})
			},
			changeLanguage(index) {
				if (!index || index < 0) index = 0;
				const lang = this.langs[index].lang || 'zh-Hans'
				if (!this.$i18n) {
					uni.showToast({
						icon: 'error',
						title: '暂不支持',
						duration: 2000
					})
					return;
				}
				this.$i18n.locale = lang
				this.langIndex = index;
				this.langMenuOpened = false;
				uni.setLocale(lang)
			},
			linkTo() {
				uni.reLaunch({
					url: '/'
				})
			},
			changeTheme(index) {
				const theme = this.themes[index].value || 'default'
				if(this.theme !== theme) this.SET_THEME(theme)
				this.themeMenuOpened = false;
			},
			async loadAlertCount() {
				try {
					const db = uniCloud.database()
					const res = await db.collection('medical-device-alert').where({ deleted: 0, is_read: 0 }).count()
					this.alertCount = res.result.total || 0
				} catch (e) {}
			},
			async showAlerts() {
				this.popupMenuOpened = false
				try {
					const db = uniCloud.database()
					const dbCmd = db.command
					const res = await db.collection('medical-device-alert').where({ deleted: 0, is_read: 0 }).orderBy('alert_date', 'desc').limit(50).get()
					const deviceIds = [...new Set(res.result.data.map(i => i.device_id).filter(Boolean))]
					const deviceMap = {}
					if (deviceIds.length) {
						const deviceRes = await db.collection('medical-device').where({ _id: dbCmd.in(deviceIds) }).get()
						deviceRes.result.data.forEach(d => { deviceMap[d._id] = d.name })
					}
					this.alertList = res.result.data.map(item => ({
						...item,
						device_id_text: deviceMap[item.device_id] || '-',
						alert_date_text: item.alert_date ? new Date(item.alert_date).toLocaleDateString('zh-CN') : '-'
					}))
				} catch (e) {
					this.alertList = []
				}
				this.$refs.alertPopup.open()
			},
			closeErrorLogs() {
				this.$refs.errorLogsPopup.close()
			},
			closeAlertPopup() {
				this.$refs.alertPopup.close()
			},
			markAllAlertRead() {
				const db = uniCloud.database()
				db.collection('medical-device-alert').where({ deleted: 0, is_read: 0 }).update({ is_read: 1, read_date: Date.now(), updated_at: Date.now() }).then(() => {
					this.alertCount = 0
					this.alertList = []
					uni.showToast({ title: '全部标记为已读', icon: 'success' })
				}).catch((err) => {
					uni.showModal({ content: err.message || '操作失败', showCancel: false })
				})
			},
			alertTypeText(val) {
				return { 1: '保养到期', 2: '校验到期', 3: '维修提醒', 4: '其他' }[val] || '-'
			},
			alertTypeTag(val) {
				return { 1: 'warning', 2: 'primary', 3: 'error', 4: 'default' }[val] || 'default'
			},
			goAlert(item) {
				this.$refs.alertPopup.close()
				uni.navigateTo({
					url: '/pages/medical-device-alert/edit?id=' + item._id
				})
			}
		}
	}
</script>

<style lang="scss">
	.header {
		height: 60px;
		width: 100%;
		box-sizing: border-box;
		border-bottom: 1px solid #f1f5f9;
		background-color: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		color: #64748b;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
	}

	.navbar {
		font-size: 14px;
		position: relative;
		height: 100%;
		padding: 0 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		min-width: 223px;
		display: flex;
		align-items: center;
		gap: 4px;

		.logo-image {
			width: 28px;
			height: 28px;
		}

		.logo-text {
			margin-left: 6px;
			font-size: 16px;
			font-weight: 600;
			color: #0f172a;
			letter-spacing: -0.02em;
		}
	}

	.menu-icon {
		width: 30px;
		height: 30px;
		line-height: 30px;
		color: #94a3b8;
		transition: color 0.15s ease;
	}

	.menu-icon:hover {
		color: #6366f1;
	}

	.navbar-middle,
	.navbar-right {
		flex: 1;
		/* #ifdef MP */
		margin-right: 97px;
		/* #endif */
	}

	.navbar-right-item-gap {
		margin-right: 30px;
	}


	.navbar-left {
		display: flex;
	}

	// 在平板以下，保持navbar-middle
	@media screen and (max-width: 767px) {
		.navbar-left {
			flex: 1;
			/* #ifdef MP */
			margin-right: 97px;
			/* #endif */
		}
	}

	.navbar-middle,
	.username {
		display: flex;
		align-items: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.navbar-middle {
		text-align: left;
		justify-content: flex-start;
	}

	.username {
		max-width: 150px;
		font-size: 13px;
		color: #475569;
	}

	.title-text {
		font-size: 15px;
		font-weight: 500;
		line-height: 30px;
		color: #0f172a;
	}

	.navbar-menu {
		display: flex;
	}

	.menu-item {
		padding: 8px 16px;
		font-size: 14px;
		color: #475569;
		line-height: 1;
		transition: color 0.15s ease;
	}

	.menu-item:hover {
		color: #6366f1;
	}

	.debug {
		display: inline-block;
		position: relative;
	}

	.debug-badge {
		position: absolute;
		top: 5px;
		right: 14px;
		transform: translateY(-50%) translateX(100%) scale(0.8);
	}

	.arrowdown {
		margin-top: 4px;
		margin-left: 3px;
		color: #94a3b8;
	}

	.person {
		margin-top: 2px;
		margin-right: 2px;
	}

	.navbar-right {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 4px;
	}

	.navbar-right .uni-mask {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(255, 255, 255, 0);
		z-index: 999;
	}

	.popup-menu__arrow {
		position: absolute;
		top: -6px;
		right: 20px;
		border-width: 6px;
		margin-right: 3px;
		border-top-width: 0;
		border-bottom-color: #e2e8f0;
		filter: drop-shadow(0 6px 12px rgba(0, 0, 0, .1));
	}

	.popup-menu__arrow::after {
		content: " ";
		position: absolute;
		display: block;
		width: 0;
		height: 0;
		border-color: transparent;
		border-style: solid;
		border-width: 10px;
		top: 1px;
		margin-left: -10px;
		border-top-width: 0;
		border-bottom-color: #fff;
	}

	.menu-icon,
	.navbar-middle,
	.popup-menu__arrow,
	.navbar-right .uni-mask,
	.theme-menu,
	.lang-menu {
		display: none;
	}

	.navbar-mini .menu-icon {
		display: block;
	}

	.navbar-user {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 6px 10px;
		border-radius: 8px;
		transition: background-color 0.15s ease;
		cursor: pointer;
		gap: 4px;
	}

	.navbar-user:hover {
		background-color: #f1f5f9;
	}

	.navbar-mini .logo,
	.navbar-mini .debug,
	.navbar-menu {
		display: none;
	}

	.navbar-menu {
		width: 140px;
		flex-direction: column;
		align-items: stretch;
		position: absolute;
		right: 0;
		top: 36px;
		background-color: #fff;
		z-index: 999;
		padding: 6px 0;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 10px -5px rgba(0, 0, 0, 0.04);
	}

	/* 小屏时，弹出下拉菜单 */
	.popup-menu .navbar-menu {
		display: flex;
	}

	.popup-menu .popup-menu__arrow,
	.popup-menu .navbar-right .uni-mask {
		display: block;
	}

	/* 主题和语言菜单的遮罩层显示 */
	.popup-menu .uni-mask {
		display: block;
	}

	/* 主题和语言菜单在小屏时显示 */
	.theme-menu.show,
	.lang-menu.show {
		display: flex;
	}

	.theme-menu.show .popup-menu__arrow,
	.lang-menu.show .popup-menu__arrow {
		display: block;
	}

	.hover-highlight:hover {
		color: $menu-text-color-actived;
	}

	.svg-icon {
		width: 1em;
		height: 1em;
		vertical-align: -.15em;
		fill: currentColor;
		overflow: hidden;
	}

	.password-popup {
		padding: 30px;
	}

	.alert-bell {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.15s ease;

		&:hover {
			background-color: #f1f5f9;
		}

		.bell-icon {
			width: 20px;
			height: 20px;
			color: #64748b;
			display: block;
			transition: color 0.15s ease;
		}

		&:hover .bell-icon {
			color: #6366f1;
		}
	}

	.alert-badge {
		position: absolute;
		top: 2px;
		right: 0;
		transform: translateY(-50%) translateX(50%) scale(0.8);
	}

	.welcome-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;

		&:hover {
			background-color: #f1f5f9;

			.welcome-icon {
				color: #f43f5e;
			}
		}

		.welcome-icon {
			width: 20px;
			height: 20px;
			color: #64748b;
			display: block;
			transition: color 0.15s ease;
		}
	}

	.welcome-modal {
		background: #fff;
		border-radius: 16px;
		padding: 40px 48px 32px;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		margin-top: 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 320px;

		.welcome-icon-wrap {
			width: 72px;
			height: 72px;
			border-radius: 50%;
			background: linear-gradient(135deg, #f43f5e, #fb7185);
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 20px;
			box-shadow: 0 8px 24px rgba(244, 63, 94, 0.25);

			.welcome-heart {
				color: #fff;
			}
		}

		.welcome-text {
			font-size: 22px;
			font-weight: 700;
			color: #0f172a;
			margin-bottom: 6px;
		}

		.welcome-sub {
			font-size: 14px;
			color: #94a3b8;
			margin-bottom: 28px;
		}

		.welcome-btn-close {
			background: linear-gradient(135deg, #6366f1, #8b5cf6);
			border: none;
			color: #fff;
			padding: 10px 40px;
			border-radius: 10px;
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
			box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);

			&:hover {
				transform: translateY(-2px);
				box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
			}

			&:active {
				transform: translateY(0);
			}
		}
	}

	.alert-popup-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.alert-modal-box {
		pointer-events: auto;
		width: 680px;
		max-width: 90vw;
		max-height: 75vh;
		background: #fff;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		margin-top: 300px;

		.alert-modal-header {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 20px 20px 12px;
			border-bottom: 1px solid #e2e8f0;
		}

		.alert-modal-title {
			font-size: 16px;
			font-weight: 600;
			color: #0f172a;
		}

		.alert-modal-mark-all {
			font-size: 12px;
			color: #6366f1;
			cursor: pointer;
			padding: 4px 8px;
			border-radius: 4px;
			transition: background-color 0.15s;

			&:hover {
				background-color: #eef2ff;
			}
		}

		.alert-modal-body {
			flex: 1;
			min-height: 0;
			overflow-y: auto;
			padding: 8px 20px;
		}

		.alert-modal-footer {
			flex-shrink: 0;
			display: flex;
			justify-content: center;
			padding: 12px 20px 20px;
			border-top: 1px solid #e2e8f0;
		}

		.alert-empty {
			text-align: center;
			color: #94a3b8;
			padding: 40px 0;
			font-size: 14px;
		}

		.alert-item {
			display: flex;
			gap: 12px;
			padding: 12px;
			border-radius: 8px;
			cursor: pointer;
			transition: background-color 0.15s;
			margin-bottom: 4px;

			&:hover {
				background-color: #f8fafc;
			}

			&:last-child {
				margin-bottom: 0;
			}
		}

		.alert-item-left {
			flex-shrink: 0;
			padding-top: 4px;
		}

		.alert-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;

			&-1 { background-color: #f59e0b; }
			&-2 { background-color: #6366f1; }
			&-3 { background-color: #ef4444; }
			&-4 { background-color: #94a3b8; }
		}

		.alert-item-body {
			flex: 1;
			min-width: 0;
		}

		.alert-item-title {
			font-size: 14px;
			font-weight: 500;
			color: #0f172a;
			margin-bottom: 4px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.alert-item-desc {
			font-size: 12px;
			color: #64748b;
			line-height: 1.5;
			margin-bottom: 6px;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}

		.alert-item-meta {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.alert-item-date {
			font-size: 11px;
			color: #94a3b8;
		}

		.error-log-modal {
			margin-top: 500px;
			overflow: visible;

			.alert-modal-body {
				max-height: 30vh;
			}
		}

		.btn-modal-close {
			background: #fff;
			border: 1.5px solid #e2e8f0;
			color: #64748b;
			padding: 6px 32px;
			border-radius: 8px;
			font-size: 13px;
			font-weight: 500;
			transition: all 0.15s ease;

			&:hover {
				border-color: #6366f1;
				color: #6366f1;
				background-color: #eef2ff;
			}
		}
	}


	.language-item {
		font-stretch: 12px;
		vertical-align: baseline;
		text-decoration: underline;
	}

	.lang-icon {
		font-size: 18px;
		margin-top: 5px;
		margin-right: 30px;
	}

	.user-icon {
		font-size: 20px;
	}

	// 主题和语言选择器样式
	.theme-selector,
	.lang-selector {
		display: flex;
		align-items: center;
		cursor: pointer;
		padding: 5px;
		border-radius: 4px;
		transition: background-color 0.2s;

		&:hover {
			background-color: rgba(0, 0, 0, 0.05);
		}

		.arrowdown {
			margin-top: 4px;
			margin-left: 3px;
		}
	}

	.theme-menu,
	.lang-menu {
		width: 120px;
		flex-direction: column;
		align-items: stretch;
		position: absolute;
		right: 0;
		top: 36px;
		background-color: #fff;
		z-index: 999;
		padding: 6px 0;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 10px -5px rgba(0, 0, 0, 0.04);
		display: none;

		.menu-item {
			padding: 8px 16px;
			font-size: 14px;
			color: #475569;
			line-height: 1;
			cursor: pointer;
			transition: all 0.15s ease;

			&.active {
				color: #6366f1;
				font-weight: 500;
			}

			&:hover {
				color: #6366f1;
				background-color: #f8fafc;
			}
		}

		.popup-menu__arrow {
			position: absolute;
			top: -6px;
			right: 20px;
			border-width: 6px;
			margin-right: 3px;
			border-top-width: 0;
			border-bottom-color: #e2e8f0;
			filter: drop-shadow(0 6px 12px rgba(0, 0, 0, .1));
		}

		.popup-menu__arrow::after {
			content: " ";
			position: absolute;
			display: block;
			width: 0;
			height: 0;
			border-color: transparent;
			border-style: solid;
			border-width: 10px;
			top: 1px;
			margin-left: -10px;
			border-top-width: 0;
			border-bottom-color: #fff;
		}
	}

</style>
