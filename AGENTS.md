# 智能编码代理指南

本文档为在 neihao-web 项目中工作的 AI 编码代理提供项目规范与协作规则。

### ⚠️ 重要：与 device 的关系

本项目和同级目录下的 **`device`** 共同构成一套完整的**医疗设备管理系统**：

| 项目 | 模板 | 定位 | 用户 |
|------|------|------|------|
| **neihao-web**（本项目） | uni-admin v2.5.13 | 管理后台 Web 端 | 管理员 |
| **device** | uni-starter v2.2.15 | 移动端 App（H5/App/小程序） | 普通用户/医护人员 |

**两项目共享同一个 uniCloud 支付宝云环境**（相同的数据库和云函数）。neihao-web 的 `uniCloud-alipay/` 包含全部 158 个数据库 schema（含 7 个医疗设备业务表），device 仅有 93 个基础表。

**开发时注意**：修改数据库 schema 或云函数需两项目同步更新。业务数据互通（如 device 端报修 → neihao-web 端维修处理）。

- **device 位置**：`../device/`
- **device AGENTS.md** 参见 `../device/AGENTS.md`，包含移动端代码规范、国际化、推送、App 升级等说明

## 项目概述

neihao-web 是一个基于 **uni-app + uniCloud（支付宝云）** 的后台管理系统（uni-admin v2.5.13 模板），使用 **Vue 2/3 双兼容**（条件编译）、**纯 JavaScript**（无 TypeScript）、**Vuex** 状态管理、**vue-i18n** 国际化、**SCSS** 样式。主要开发工具为 **HBuilderX**。

## 构建 / 构建 / Lint / 测试

```bash
# 项目无 ESLint / Prettier / TypeScript / 测试框架配置
npm test                              # 仅输出提示信息（无实际测试）
npx vue-cli-service uni-build --platform h5       # 构建 H5
npx vue-cli-service uni-build --platform mp-weixin # 构建微信小程序
```

- **PostCSS**：`postcss.config.js` 配置了 autoprefixer（>1%，last 2 versions）和 `postcss-import`（支持 `@/` 路径别名）
- **Webpack**：`vue.config.js` 生产构建时移除 console，watchOptions 过滤 uni_modules 中的 md/package.json
- **路径别名**：`@/` → 项目根目录
- **条件编译**：`#ifdef H5` / `#ifdef VUE3` / `#ifndef MP` 等，由 uni-app 编译器在构建时处理

## 项目结构

```
neihao-web/
├── pages/                          # 主包页面
│   ├── index/                      # 首页（仪表盘）
│   ├── login/                      # 登录
│   ├── demo/                       # 功能演示（icons, table）
│   ├── error/                      # 404
│   ├── medical-device/             # 设备台账（list/add/edit/import）
│   ├── medical-device-category/    # 设备分类（list/add/edit）
│   ├── medical-device-location/    # 存放位置（list/add/edit）
│   ├── medical-device-repair/      # 维修记录（list/add/edit）
│   ├── medical-device-repair-request/ # 设备报修（list/add/edit）
│   ├── medical-device-maintenance/ # 保养计划（list/add/edit）
│   ├── medical-device-alert/       # 报警提醒（list/add/edit）
│   ├── opendb-department/          # 使用部门（list/add/edit）
│   ├── system/                     # 【分包】系统管理（菜单/权限/角色/用户/应用/标签/日志）
│   └── uni-stat/                   # 【分包】统计分析（页面/用户/事件/支付等）
├── components/                     # 公共组件（14个：uni-nav-menu, uni-stat-breadcrumb, uni-data-menu 等）
├── windows/                        # 多窗口组件（topWindow, leftWindow, error-log）
├── store/                          # Vuex（modules: app, user, error）
│   ├── index.js                    # Vuex 入口（plugins: createPersistedState）
│   └── modules/
│       ├── app.js                  # 应用状态/主题/菜单
│       ├── user.js                 # 用户信息
│       └── error.js                # 错误日志
├── i18n/                           # 国际化（zh-Hans, zh-Hant, en JSON）
├── js_sdk/                         # SDK
│   ├── validator/                  # 19个 schema 校验器（由 uniCloud schema 自动生成）
│   ├── uni-admin/                  # admin SDK
│   ├── uni-id-pages/               # uni-id 登录 SDK
│   ├── uni-stat/                   # 统计 SDK
│   └── ext-storage/                # 扩展存储
├── common/                         # 公共样式
│   ├── theme.scss                  # 主题变量
│   ├── uni.css                     # 基础样式
│   ├── uni-icons.css               # 图标样式
│   └── admin-icons.css             # admin 自定义图标
├── static/                         # 静态资源（logo.svg 等）
├── uni_modules/                    # ~40 个 uni-app 插件模块（uni-id-pages, uni-upgrade-center 等）
├── uniCloud-alipay/                # uniCloud 支付宝云
│   ├── cloudfunctions/             # 云函数
│   └── database/                   # 数据库 Schema
├── admin.config.js                 # 登录路径/导航栏/侧边菜单/主题配置
├── pages.json                      # 路由、分包、窗口、登录拦截
├── uni.scss                        # 全局 SCSS 变量和双主题变量
├── main.js                         # 入口（Vue 2/3 条件编译）
└── App.vue                         # 根组件（store 初始化、登录回调、主题/上传配置）
```

## 代码风格与协作规则

### Vue 组件规范

- **只用 Options API**（`export default { ... }`），**禁止** `<script setup>` 和 Composition API
- 生命周期：`onLoad`（获取 URL 参数、初始化数据）、`onReady`（操作 `$refs`、绑定校验规则）、`onShow`、`onUnload`（清理定时器）
- 样式：`<style lang="scss" scoped>`，全局变量直接使用 `uni.scss` 中的变量无需 import

### 核心组件模式

**列表页** — `unicloud-db` + `uni-table` + `uni-pagination`：
- `loadtime="manual"` + `@load` 事件 + `v-slot:default="{ data, pagination, loading, error }"`
- 在 `@load` 中并行查询关联表填充显示字段（`_text` 后缀）
- 软删除：查询用 `where='deleted == 0'`，删除用 `.update({ deleted: 1 })`

**表单页** — `uni-forms` + `uni-easyinput` + schema 校验器：
- 校验器从 `js_sdk/validator/` 引入，通过 `this.$refs.form.setRules(this.rules)` 绑定
- 新增提交用 `.add()`，编辑通过 `onLoad(e) { this.getDetail(e.id) }` 获取详情后用 `.doc(id).update()`
- 操作成功后通过 `getOpenerEventChannel().emit('refreshData')` 通知列表页刷新

### 组件使用清单

| 组件 | 用途 |
|------|------|
| `unicloud-db` | 数据列表（含分页），ref 调用 `loadData()` |
| `uni-forms` / `uni-forms-item` / `uni-easyinput` | 表单输入与校验 |
| `uni-data-select` | 下拉选择（关联表选项） |
| `uni-datetime-picker` | 日期选择（`return-type="timestamp"`）|
| `uni-table` / `uni-tr` / `uni-th` / `uni-td` | 数据表格 |
| `uni-tag` | 状态标签（type: primary/success/warning/error/info/default）|
| `uni-pagination` | 分页（v-model 绑定 `pagination.current`）|
| `uni-file-picker` | 图片上传（`fileMediatype="image" mode="grid"`）|
| `uni-stat-breadcrumb` | 面包屑导航 |
| `uni-popup` | 弹窗（type: center/top/bottom）|
| `uni-icons` | 图标 |

### 导入顺序与命名规范

```javascript
import { mapState, mapActions } from 'vuex'        // 1. Vuex
import config from '@/admin.config.js'              // 2. 项目配置
import { validator } from '../../js_sdk/validator/xxx' // 3. SDK / 工具
import UniDataMenu from '@/components/xxx/xxx.vue'  // 4. 组件
```

- **文件/目录**：`kebab-case`（`user-list.vue`, `medical-device/`）
- **变量/函数**：`camelCase`；**常量**：`UPPER_SNAKE_CASE`
- **Vuex**：mutation 用 `SET_*`，action 用 `camelCase` 动词短语，模块全命名空间（`namespaced: true`）

### 状态管理

3 个命名空间模块：`app`（应用状态/主题/菜单）、`user`（用户信息）、`error`（错误日志）。
```javascript
...mapActions({ init: 'app/init' })
...mapMutations('app', ['SET_THEME'])
this.$uniIdPagesStore.store.hasLogin         // 通过 uni-id-pages 校验登录状态
this.$uniIdPagesStore.store.userInfo          // 当前用户信息
```

### 国际化

语言文件在 `i18n/` 下为 JSON 格式，键按功能域组织。组件中使用：`{{ $t('login.field.username') }}`。

### 错误处理

```javascript
// async/await 风格
try { const res = await db.collection('xxx').get() }
catch (error) { uni.showToast({ title: '操作失败', icon: 'none' }) }

// Promise 风格
db.collection('xxx').add(data).catch(err => {
  uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
})
```

### SCSS / 主题

- 全局变量（`$uni-color-primary`, `$uni-spacing-row-base`, `$uni-border-color` 等）在 `uni.scss` 中定义，组件中直接使用
- 双主题：`default`（蓝色 `#6366f1`）和 `green`（绿色 `#10b981`），通过 CSS 变量 `.theme-default` / `.theme-green` 切换
- 使用 `rpx` 响应式单位，不要硬编码颜色值，优先使用 SCSS 变量

### 关键约定

- **禁止**：TypeScript 类型注解、`<script setup>`、Composition API、ESLint 注释
- **禁止**：`@ts-ignore`、`@ts-expect-error`、`as any`
- **禁止**：对 `input` / `textarea` 设置 `box-sizing: border-box`（H5 平台会导致输入框无法聚焦）
- **软删除**：所有删除操作为逻辑删除（`deleted: 1`），不是真删除
- **表单校验**：使用 `js_sdk/validator/` 中的 schema 校验器，不要手动编写校验规则
- **数据刷新**：子页面通过 `getOpenerEventChannel().emit('refreshData')` 通知列表页
- **文件编码**：UTF-8，注释中的中文是项目语言，不要翻译
- **条件编译**：`#ifdef H5` / `#ifdef VUE3` / `#ifndef MP` 等处理平台差异

### Git 提交规范

```
type(scope): subject
```
类型：`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`

---

## 补充信息

- **device 位置**：`../device/`
- **device AGENTS.md**：`../device/AGENTS.md`，包含移动端侧完整代码规范、国际化配置、App 推送、升级中心等
- **关联业务场景**：device 端用户扫码查看设备、发起报修 → neihao-web 管理员处理维修流程；device 端设备台账数据与 neihao-web 同步

*版本: 2.5.13，基于 uni-admin 模板，为 AI 编码代理优化*
