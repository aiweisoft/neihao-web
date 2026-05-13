export default {
	login: {
		url: '/pages/login/login'
	},
	index: {
		url: '/pages/index/index'
	},
	error: {
		url: '/pages/error/404'
	},
	navBar: {
		logo: '/static/logo.svg',
		langs: [{
			text: '中文简体',
			lang: 'zh-Hans'
		}, {
			text: '中文繁體',
			lang: 'zh-Hant'
		}, {
			text: 'English',
			lang: 'en'
		}],
		themes: [{
			text: '默认',
			value: 'default'
		}, {
			text: '绿柔',
			value: 'green'
		}],
		debug: {
			enable: process.env.NODE_ENV !== 'production',
			engine: [{
				name: '百度',
				url: 'https://www.baidu.com/baidu?wd=ERR_MSG'
			}, {
				name: '谷歌',
				url: 'https://www.google.com/search?q=ERR_MSG'
			}]
		}
	},
	sideBar: {
		staticMenu: [{
			menu_id: "basic-data",
			text: '基础数据',
			icon: 'admin-icons-manager-tag',
			url: "",
			children: [{
				menu_id: "device-category",
				text: '设备分类',
				icon: 'admin-icons-manager-tag',
				value: '/pages/medical-device-category/list',
			}, {
				menu_id: "device-location",
				text: '存放位置',
				icon: 'admin-icons-ziyuan',
				value: '/pages/medical-device-location/list',
			}, {
				menu_id: "department",
				text: '使用部门',
				icon: 'admin-icons-manager-user',
				value: '/pages/opendb-department/list',
			}]
		}, {
			menu_id: "system_management",
			text: '系统管理',
			icon: 'admin-icons-xitongguanli',
			url: "",
			children: [{
				menu_id: "system_user",
				text: '用户管理',
				icon: 'admin-icons-manager-user',
				value: '/pages/system/user/list',
			}, {
				menu_id: "system_role",
				text: '角色管理',
				icon: 'admin-icons-manager-role',
				value: '/pages/system/role/list',
			}, {
				menu_id: "system_permission",
				text: '权限管理',
				icon: 'admin-icons-manager-permission',
				value: '/pages/system/permission/list',
			}, {
				menu_id: "system_menu",
				text: '菜单管理',
				icon: 'admin-icons-manager-menu',
				value: '/pages/system/menu/list',
			}]
		}]
	},
	uniStat: {

	}
}
