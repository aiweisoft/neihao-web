# 医疗设备管理系统

基于 **uni-app + uniCloud（支付宝云）** 构建的医疗设备全生命周期管理后台系统。采用 uni-admin v2.5.13 管理后台模板，支持 PC 宽屏与移动端自适应。

## 功能模块

### 设备管理
- **设备台账** — 医疗设备 CRUD，支持设备编号、名称、品牌、规格型号、注册证号、采购信息、使用状态等字段管理
- **Excel 导入** — 通过云函数解析 xlsx 文件，批量导入设备数据并自动校验字段
- **设备分类** — 多层设备分类管理
- **存放位置** — 设备存放位置管理
- **使用部门** — 部门管理（基于 opendb-department）

### 维修管理
- **设备报修** — 报修申请提交与流程跟踪
- **维修记录** — 维修历史记录查询与管理

### 保养管理
- **保养计划** — 定期保养计划制定，支持设置提前提醒天数和到期自动状态更新
- **报警提醒** — 自动生成保养到期提醒（通过定时云函数扫描），支持已读/未读管理

### 系统管理
- **菜单管理** — 动态菜单配置
- **权限管理** — 细粒度权限控制
- **角色管理** — 角色定义与权限分配
- **用户管理** — 用户账户管理
- **应用管理** — 多应用配置与发布管理
- **标签管理** — 标签维护
- **用户日志** — 操作日志审计

### 统计分析（uni-stat）
- 用户分析（概况、活跃度、趋势、留存、粘性、平台对比）
- 设备分析（概况、活跃度、趋势、留存、粘性、平台对比）
- 页面分析（受访页、入口页、内容统计）
- 事件与转化分析
- 报错统计（JS 报错、App 原生报错）
- 场景值分析、渠道分析
- 支付订单分析（概况、明细、漏斗、用户价值排行）

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | uni-app（Vue 2/3 双兼容，条件编译） |
| 状态管理 | Vuex（modules: app, user, error） |
| 国际化 | vue-i18n（简体中文、繁体中文、English） |
| UI 组件 | uni-ui 生态（uni-table, uni-forms, uni-easyinput 等） |
| 后端平台 | uniCloud 支付宝云 |
| 云函数 | 10 个云函数（含定时任务、Excel 导入、短信、升级、统计等） |
| 数据库 | 158 个集合 Schema（含 uni-id 用户体系、uni-stat 统计、业务数据） |
| 用户认证 | uni-id（登录、注册、重置密码、手机/邮箱验证） |
| 样式 | SCSS + 双主题（默认蓝 / 绿柔） |

## 项目结构

```
neihao-web/
├── pages/                          # 主包页面
│   ├── medical-device/             # 设备台账（list/add/edit/import）
│   ├── medical-device-category/    # 设备分类
│   ├── medical-device-location/    # 存放位置
│   ├── medical-device-repair/      # 维修记录
│   ├── medical-device-repair-request/ # 设备报修
│   ├── medical-device-maintenance/ # 保养计划
│   ├── medical-device-alert/       # 报警提醒
│   ├── opendb-department/          # 使用部门
│   ├── login/                      # 登录
│   ├── index/                      # 仪表盘
│   └── error/                      # 404
├── pages/system/                   # 【分包】系统管理
├── pages/uni-stat/                 # 【分包】统计分析
├── components/                     # 公共组件
├── store/                          # Vuex 状态管理
├── i18n/                           # 国际化
├── js_sdk/                         # SDK（校验器、admin SDK 等）
├── uniCloud-alipay/                # 云端
│   ├── cloudfunctions/             # 10 个云函数
│   └── database/                   # 158 个数据库 Schema
├── uni_modules/                    # ~40 个 uni-app 插件模块
└── admin.config.js                 # 导航/菜单/主题配置
```

## 快速开始

```bash
# 安装依赖
npm install

# 运行到 H5（PC 浏览器）
npx vue-cli-service uni-build --platform h5

# 运行到微信小程序
npx vue-cli-service uni-build --platform mp-weixin
```

开发推荐使用 **HBuilderX** 打开项目，内置 uni-app 编译支持和 uniCloud 管理功能。

## 数据库初始化

项目包含完整的数据库初始化数据（`uniCloud-alipay/database/db_init.json`），在 uniCloud 控制台初始化数据库后即可使用。

## 定时任务

- **maintenance-alert-cron** — 定时扫描保养计划，自动生成保养到期提醒（报警提醒模块），支持提前 N 天提醒和逾期自动标记

## 许可证

[MIT](LICENSE)
