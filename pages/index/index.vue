<template>
  <view class="fix-top-window">
    <!-- 欢迎横幅 -->
    <view class="welcome-banner">
      <view class="banner-bg-shapes">
        <view class="shape shape-1"></view>
        <view class="shape shape-2"></view>
        <view class="shape shape-3"></view>
      </view>
      <view class="banner-content">
        <view class="banner-left">
          <view class="banner-greeting">
            <text class="greeting-icon">&#9754;</text>
            <text class="greeting-text">{{ greeting }}</text>
          </view>
          <text class="banner-title">医疗设备管理系统</text>
          <text class="banner-desc">实时掌握设备状态，高效管理资产信息</text>
        </view>
        <view class="banner-right">
          <view class="banner-time">
            <text class="time-num">{{ currentTime }}</text>
            <text class="time-date">{{ currentDate }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="uni-container">
      <!-- 统计卡片行 -->
      <view class="stats-row">
        <view
          class="stat-card"
          v-for="card in statCards"
          :key="card.key"
          @click="navTo(card.url)"
        >
          <view class="stat-card-bg" :class="'stat-bg-' + card.key"></view>
          <view class="stat-card-inner">
            <view class="stat-icon-wrap" :class="'stat-icon-' + card.key">
              <text :class="card.icon"></text>
            </view>
            <view class="stat-body">
              <text class="stat-number">{{ stats[card.field] }}</text>
              <text class="stat-label">{{ card.label }}</text>
            </view>
            <view class="stat-trend">
              <text class="stat-arrow">&#8599;</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 两栏布局 -->
      <view class="main-grid">
        <!-- 左栏 -->
        <view class="grid-col grid-col-chart">
          <view class="content-card chart-card" v-if="deptRingData.series.length && deptRingData.series[0].data.length">
            <view class="card-header">
              <view class="card-header-left">
                <view class="card-dot card-dot-green"></view>
                <text class="card-title">使用科室设备分布</text>
              </view>
            </view>
            <view class="chart-body">
              <qiun-data-charts type="ring" :chartData="deptRingData" :eopts="deptRingOpts" echartsH5 echartsApp />
            </view>
          </view>

          <view class="content-card chart-card" v-if="categoryRingData.series.length && categoryRingData.series[0].data.length">
            <view class="card-header">
              <view class="card-header-left">
                <view class="card-dot card-dot-pink"></view>
                <text class="card-title">设备分类统计</text>
              </view>
            </view>
            <view class="chart-body">
              <qiun-data-charts type="ring" :chartData="categoryRingData" :eopts="categoryRingOpts" echartsH5 echartsApp />
            </view>
          </view>

          <view class="content-card quick-card">
            <view class="card-header">
              <view class="card-header-left">
                <view class="card-dot card-dot-blue"></view>
                <text class="card-title">快捷入口</text>
              </view>
            </view>
            <view class="quick-grid">
              <view
                class="quick-item"
                v-for="item in quickActions"
                :key="item.key"
                @click="navTo(item.url)"
              >
                <view class="quick-icon" :class="'quick-icon-' + item.color">
                  <text :class="item.icon"></text>
                </view>
                <text class="quick-label">{{ item.label }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 右栏 -->
        <view class="grid-col grid-col-list">
          <view class="content-card status-overview-card">
            <view class="card-header">
              <view class="card-header-left">
                <view class="card-dot card-dot-purple"></view>
                <text class="card-title">设备状态总览</text>
              </view>
              <text class="status-header-total">共 {{ totalDeviceCount }} 台</text>
            </view>
            <view class="status-progress-list" v-if="totalDeviceCount > 0">
              <view
                class="status-progress-item"
                v-for="s in statusSummary"
                :key="s.key"
                @click="navToStatus(s.key)"
              >
                <view class="status-progress-header">
                  <view class="status-progress-left">
                    <view class="status-progress-dot" :class="'status-dot-' + s.key"></view>
                    <text class="status-progress-label">{{ s.label }}</text>
                  </view>
                  <view class="status-progress-right">
                    <text class="status-progress-count">{{ s.count }}台</text>
                    <text class="status-progress-percent">{{ totalDeviceCount > 0 ? (s.count / totalDeviceCount * 100).toFixed(1) : 0 }}%</text>
                  </view>
                </view>
                <view class="status-progress-track">
                  <view
                    class="status-progress-fill"
                    :class="'status-fill-' + s.key"
                    :style="{ width: (s.count / totalDeviceCount * 100) + '%' }"
                  ></view>
                </view>
              </view>
            </view>
            <view class="empty-tip" v-else>
              <text>暂无设备数据</text>
            </view>
          </view>

          <view class="content-card alert-card" v-if="alertList.length">
            <view class="card-header">
              <view class="card-header-left">
                <view class="card-dot card-dot-red"></view>
                <text class="card-title">待处理提醒 <text class="alert-title-count">{{ alertList.length }}</text></text>
              </view>
              <text class="card-more" @click="navTo('/pages/medical-device-alert/list')">
                全部提醒
                <text class="card-more-arrow">&gt;</text>
              </text>
            </view>
            <view class="alert-home-list">
              <view class="alert-home-item" v-for="item in alertList" :key="item._id" @click="navTo('/pages/medical-device-alert/edit?id=' + item._id)">
                <view class="alert-home-dot" :class="'alert-home-dot-' + (item.alert_type || 1)"></view>
                <view class="alert-home-body">
                  <view class="alert-home-title">{{ item.title || '未命名提醒' }}</view>
                  <view class="alert-home-meta">
                    <uni-tag :text="alertTypeText(item.alert_type)" size="small" />
                    <text class="alert-home-date">{{ item.alert_date_text }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="content-card recent-card">
            <view class="card-header">
              <view class="card-header-left">
                <view class="card-dot card-dot-orange"></view>
                <text class="card-title">最近添加的设备</text>
              </view>
              <text class="card-more" @click="navTo('/pages/medical-device/list')">
                全部设备
                <text class="card-more-arrow">&gt;</text>
              </text>
            </view>
            <view class="recent-list" v-if="recentDevices.length">
              <view
                class="recent-item"
                v-for="item in recentDevices"
                :key="item._id"
                @click="navTo('/pages/medical-device/edit?id=' + item._id)"
              >
                <view class="recent-item-left">
                  <view
                    class="recent-avatar"
                    :style="{ background: getAvatarColor(item.name) }"
                  >
                    <text>{{ item.name.charAt(0) }}</text>
                  </view>
                  <view class="recent-info">
                    <text class="recent-name">{{ item.name }}</text>
                    <text class="recent-code">编号: {{ item.code || '--' }}</text>
                  </view>
                </view>
                <view class="recent-item-right">
                  <uni-tag :text="getStatusText(item.status)" :type="getStatusType(item.status)" size="small" />
                </view>
              </view>
            </view>
            <view class="empty-tip" v-else>
              <text class="empty-icon">&#128722;</text>
              <text>暂无设备数据</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  data() {
    return {
      currentTime: '',
      currentDate: '',
      greeting: '',
      timer: null,
      statCards: [
        { key: 'device', label: '设备总数', field: 'totalDevices', icon: 'admin-icons-shebeitongji', url: '/pages/medical-device/list' },
        { key: 'inuse', label: '使用中设备', field: 'totalInUse', icon: 'admin-icons-activity', url: '/pages/medical-device/list?status=2' },
        { key: 'location', label: '存放位置', field: 'totalLocations', icon: 'admin-icons-ziyuan', url: '/pages/medical-device-location/list' },
        { key: 'dept', label: '使用部门', field: 'totalDepartments', icon: 'admin-icons-manager-user', url: '/pages/opendb-department/list' },
        { key: 'alert', label: '待处理提醒', field: 'totalAlerts', icon: 'admin-icons-safety', url: '/pages/medical-device-alert/list' }
      ],
      alertList: [],
      avatarColors: ['#6366f1', '#f5576c', '#4facfe', '#43e97b', '#f093fb', '#f59e0b', '#ed4014', '#2d8cf0', '#10b981', '#667eea'],
      stats: {
        totalDevices: 0,
        totalInUse: 0,
        totalLocations: 0,
        totalDepartments: 0,
        totalAlerts: 0
      },
      recentDevices: [],
      deptRingData: { series: [{ data: [] }] },
      categoryRingData: { series: [{ data: [] }] },
      categoryRingOpts: {
        color: ['#ec4899', '#f472b6', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#f9a8d4', '#d946ef', '#c026d3', '#db2777'],
        series: {
          avoidLabelOverlap: true,
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11,
            lineHeight: 15,
            color: '#475569'
          },
          emphasis: {
            scale: true,
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              fontSize: 13,
              fontWeight: 'bold',
              color: '#0f172a'
            }
          },
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          radius: ['38%', '68%']
        },
        legend: { show: false }
      },

      deptRingOpts: {
        color: ['#6366f1', '#f5576c', '#4facfe', '#43e97b', '#f093fb', '#f59e0b', '#ed4014', '#2d8cf0', '#19be6b', '#94a3b8'],
        series: {
          avoidLabelOverlap: true,
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11,
            lineHeight: 15,
            color: '#475569'
          },
          emphasis: {
            scale: true,
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              fontSize: 13,
              fontWeight: 'bold',
              color: '#0f172a'
            }
          },
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          radius: ['38%', '68%']
        },
        legend: { show: false }
      },
      totalDeviceCount: 0,
      statusSummary: [
        { key: 'normal', label: '正常', count: 0 },
        { key: 'inuse', label: '使用中', count: 0 },
        { key: 'repair', label: '维修中', count: 0 },
        { key: 'scrap', label: '报废', count: 0 },
        { key: 'unused', label: '未投入', count: 0 },
        { key: 'other', label: '其他', count: 0 }
      ],
      quickActions: [
        { key: 'dashboard', label: '3D监控大屏', icon: 'admin-icons-activity', url: '/pages/medical-device-dashboard/index', color: 'orange' },
        { key: 'add', label: '新增设备', icon: 'admin-icons-add', url: '/pages/medical-device/add', color: 'purple' },
        { key: 'category', label: '设备分类', icon: 'admin-icons-manager-tag', url: '/pages/medical-device-category/list', color: 'pink' },
        { key: 'location', label: '存放位置', icon: 'admin-icons-ziyuan', url: '/pages/medical-device-location/list', color: 'blue' },
        { key: 'dept', label: '使用部门', icon: 'admin-icons-manager-user', url: '/pages/opendb-department/list', color: 'green' }
      ]
    }
  },
  onLoad() {
    this.updateTime()
    this.timer = setInterval(() => this.updateTime(), 1000)
    this.setGreeting()
    this.loadAll()
  },
  onShow() {
    this.loadStatusSummary()
    this.loadDeviceCount()
    this.loadInUseCount()
    this.loadAlertCount()
    this.loadAlertList()
  },
  onUnload() {
    clearInterval(this.timer)
  },
  methods: {
    setGreeting() {
      const hour = new Date().getHours()
      if (hour < 6) this.greeting = '夜深了，注意休息'
      else if (hour < 9) this.greeting = '早上好'
      else if (hour < 12) this.greeting = '上午好'
      else if (hour < 14) this.greeting = '中午好'
      else if (hour < 18) this.greeting = '下午好'
      else this.greeting = '晚上好'
    },
    updateTime() {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      this.currentTime = h + ':' + m + ':' + s
      const y = now.getFullYear()
      const mo = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const weekdays = ['日', '一', '二', '三', '四', '五', '六']
      this.currentDate = y + '年' + mo + '月' + d + '日 星期' + weekdays[now.getDay()]
    },
    async loadAll() {
      uni.showLoading({ mask: true })
      try {
        await Promise.all([
          this.loadDeviceCount(),
          this.loadInUseCount(),
          this.loadLocationCount(),
          this.loadDeptCount(),
          this.loadRecentDevices(),
          this.loadDeptStats(),
          this.loadCategoryStats(),
          this.loadStatusSummary(),
          this.loadAlertCount(),
          this.loadAlertList()
        ])
      } catch (e) {
        console.error(e)
      }
      uni.hideLoading()
    },
    async loadDeviceCount() {
      const res = await db.collection('medical-device').where({ deleted: 0 }).count()
      this.stats.totalDevices = res.result.total || 0
    },
    async loadInUseCount() {
      const res = await db.collection('medical-device').where({ deleted: 0, status: 2 }).count()
      this.stats.totalInUse = res.result.total || 0
    },
    async loadLocationCount() {
      const res = await db.collection('medical-device-location').where({ deleted: 0 }).count()
      this.stats.totalLocations = res.result.total || 0
    },
    async loadDeptCount() {
      const res = await db.collection('opendb-department').count()
      this.stats.totalDepartments = res.result.total || 0
    },
    async loadRecentDevices() {
      const res = await db.collection('medical-device').where({ deleted: 0 })
        .orderBy('created_at', 'desc')
        .limit(6)
        .get()
      this.recentDevices = res.result.data || []
    },
    async loadDeptStats() {
      const deptRes = await db.collection('opendb-department').get()
      const departments = deptRes.result.data || []
      const stats = []
      for (const dept of departments) {
        const countRes = await db.collection('medical-device')
          .where({ deleted: 0, dept_id: dept._id })
          .count()
        if (countRes.result.total > 0) {
          stats.push({ name: dept.name, count: countRes.result.total })
        }
      }
      stats.sort((a, b) => b.count - a.count)
      const top = stats.slice(0, 10)
      this.deptRingData = {
        series: [{ data: top.map(s => ({ name: s.name, value: s.count })) }]
      }
    },
    async loadCategoryStats() {
      const catRes = await db.collection('medical-device-category').where({ deleted: 0 }).get()
      const categories = catRes.result.data || []
      const stats = []
      for (const cat of categories) {
        const countRes = await db.collection('medical-device')
          .where({ deleted: 0, category_id: cat._id })
          .count()
        if (countRes.result.total > 0) {
          stats.push({ name: cat.name, count: countRes.result.total })
        }
      }
      stats.sort((a, b) => b.count - a.count)
      const top = stats.slice(0, 10)
      this.categoryRingData = {
        series: [{ data: top.map(s => ({ name: s.name, value: s.count })) }]
      }
    },
    async loadAlertCount() {
      try {
        const res = await db.collection('medical-device-alert').where({ deleted: 0, is_read: 0 }).count()
        this.stats.totalAlerts = res.result.total || 0
      } catch (e) {}
    },
    async loadAlertList() {
      try {
        const dbCmd = db.command
        const res = await db.collection('medical-device-alert').where({ deleted: 0, is_read: 0 }).orderBy('alert_date', 'desc').limit(5).get()
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
    },
    alertTypeText(val) {
      return { 1: '保养到期', 2: '校验到期', 3: '维修提醒', 4: '其他' }[val] || '-'
    },
    async loadStatusSummary() {
      const [normal, inuse, repair, scrap, unused, other] = await Promise.all([
        db.collection('medical-device').where({ deleted: 0, status: 1 }).count(),
        db.collection('medical-device').where({ deleted: 0, status: 2 }).count(),
        db.collection('medical-device').where({ deleted: 0, status: 3 }).count(),
        db.collection('medical-device').where({ deleted: 0, status: 4 }).count(),
        db.collection('medical-device').where({ deleted: 0, status: 5 }).count(),
        db.collection('medical-device').where({ deleted: 0, status: 6 }).count()
      ])
      const list = [
        { key: 'normal', label: '正常', count: normal.result.total || 0 },
        { key: 'inuse', label: '使用中', count: inuse.result.total || 0 },
        { key: 'repair', label: '维修中', count: repair.result.total || 0 },
        { key: 'scrap', label: '报废', count: scrap.result.total || 0 },
        { key: 'unused', label: '未投入', count: unused.result.total || 0 },
        { key: 'other', label: '其他', count: other.result.total || 0 }
      ]
      this.totalDeviceCount = list.reduce((sum, s) => sum + s.count, 0)
      this.statusSummary = list
    },
    getStatusText(status) {
      const map = { 1: '正常', 2: '使用中', 3: '维修中', 4: '报废', 5: '未投入', 6: '其他' }
      return map[status] || '未知'
    },
    getStatusType(status) {
      const map = { 1: 'success', 2: 'primary', 3: 'warning', 4: 'error', 5: 'default', 6: 'info' }
      return map[status] || 'default'
    },
    getAvatarColor(name) {
      let hash = 0
      for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
      }
      return this.avatarColors[Math.abs(hash) % this.avatarColors.length]
    },
    navTo(url) {
      uni.navigateTo({ url })
    },
    navToStatus(key) {
      const map = { normal: 1, inuse: 2, repair: 3, scrap: 4, unused: 5, other: 6 }
      const status = map[key]
      if (status !== undefined) {
        uni.navigateTo({ url: '/pages/medical-device/list?status=' + status })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.fix-top-window {
  background: #f0f2f5;
  min-height: 100vh;
}

/* ====== 欢迎横幅 ====== */
.welcome-banner {
  position: relative;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a78bfa 100%);
  padding: 36px 40px;
  overflow: hidden;

  .banner-bg-shapes {
    position: absolute;
    inset: 0;
    pointer-events: none;

    .shape {
      position: absolute;
      border-radius: 50%;
      opacity: 0.1;
    }

    .shape-1 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, #fff 0%, transparent 70%);
      top: -150px;
      right: -80px;
      animation: shapeFloat 8s ease-in-out infinite;
    }

    .shape-2 {
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, #fff 0%, transparent 70%);
      bottom: -100px;
      left: 20%;
      animation: shapeFloat 6s ease-in-out infinite reverse;
    }

    .shape-3 {
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, #fff 0%, transparent 70%);
      top: 20px;
      right: 35%;
      animation: shapeFloat 10s ease-in-out infinite;
    }
  }

  .banner-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    max-width: 1280px;
    margin: 0 auto;
  }

  .banner-left {
    display: flex;
    flex-direction: column;
  }

  .banner-greeting {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;

    .greeting-icon {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.9);
    }

    .greeting-text {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }
  }

  .banner-title {
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }

  .banner-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.75);
    font-weight: 400;
  }

  .banner-right {
    .banner-time {
      text-align: right;
    }

    .time-num {
      display: block;
      font-size: 32px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      letter-spacing: 2px;
      font-variant-numeric: tabular-nums;
    }

    .time-date {
      display: block;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.65);
      margin-top: 2px;
    }
  }
}

@keyframes shapeFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.05); }
}

/* ====== 容器 ====== */
.uni-container {
  padding: 24px 32px;
  max-width: 1340px;
  margin: 0 auto;
}

/* ====== 统计卡片行 ====== */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  position: relative;
  border-radius: 14px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);

    .stat-number {
      transform: scale(1.06);
    }

    .stat-card-bg {
      opacity: 0.12;
      transform: scale(1.15);
    }
  }

  &:active {
    transform: translateY(-1px);
  }
}

.stat-card-bg {
  position: absolute;
  top: -40%;
  right: -30%;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  opacity: 0.08;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.stat-bg-device {
  background: radial-gradient(circle, #6366f1 0%, transparent 70%);
}

.stat-bg-inuse {
  background: radial-gradient(circle, #f59e0b 0%, transparent 70%);
}

.stat-bg-location {
  background: radial-gradient(circle, #0ea5e9 0%, transparent 70%);
}

.stat-bg-dept {
  background: radial-gradient(circle, #10b981 0%, transparent 70%);
}

.stat-card-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 20px 22px;
  gap: 16px;
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;

  [class*="admin-icons-"] {
    font-size: 24px;
    color: #fff;
  }
}

.stat-icon-device {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.stat-icon-inuse {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.stat-icon-location {
  background: linear-gradient(135deg, #0ea5e9, #38bdf8);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.stat-icon-dept {
  background: linear-gradient(135deg, #10b981, #34d399);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.stat-bg-alert {
  background: radial-gradient(circle, #ef4444 0%, transparent 70%);
}

.stat-icon-alert {
  background: linear-gradient(135deg, #ef4444, #f87171);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-number {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
  letter-spacing: -0.5px;
  transition: transform 0.3s ease;
  display: block;
}

.stat-label {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 3px;
  font-weight: 500;
  white-space: nowrap;
  display: block;
}

.stat-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 10px;
  flex-shrink: 0;

  .stat-arrow {
    font-size: 16px;
    color: #6366f1;
    font-weight: 700;
  }
}

/* ====== 两栏布局 ====== */
.main-grid {
  display: flex;
  gap: 24px;
}

.grid-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.grid-col-chart {
  flex: 1.4;
  min-width: 0;
}

.grid-col-list {
  flex: 1;
  min-width: 0;
}

/* ====== 内容卡片通用 ====== */
.content-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.card-dot-green { background: #10b981; }
.card-dot-pink { background: #ec4899; }
.card-dot-blue { background: #0ea5e9; }
.card-dot-purple { background: #6366f1; }
.card-dot-orange { background: #f59e0b; }
.card-dot-red { background: #ef4444; }

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.card-more {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6366f1;
  cursor: pointer;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #eef2ff;
    color: #4f46e5;

    .card-more-arrow {
      transform: translateX(3px);
    }
  }
}

.card-more-arrow {
  font-size: 14px;
  font-weight: 700;
  transition: transform 0.2s ease;
}

/* ====== 图表卡片 ====== */
.chart-card {
  .chart-body {
    width: 100%;
    height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}



/* ====== 快捷入口 ====== */
.quick-card {
  .quick-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .quick-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.25s ease;
    background: #f8fafc;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }
  }

  .quick-icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;

    [class*="admin-icons-"] {
      font-size: 20px;
      color: #fff;
    }
  }

  .quick-icon-purple { background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 3px 10px rgba(99, 102, 241, 0.25); }
  .quick-icon-pink { background: linear-gradient(135deg, #ec4899, #f472b6); box-shadow: 0 3px 10px rgba(236, 72, 153, 0.25); }
  .quick-icon-blue { background: linear-gradient(135deg, #0ea5e9, #38bdf8); box-shadow: 0 3px 10px rgba(14, 165, 233, 0.25); }
  .quick-icon-green { background: linear-gradient(135deg, #10b981, #34d399); box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25); }
  .quick-icon-orange { background: linear-gradient(135deg, #f97316, #fb923c); box-shadow: 0 3px 10px rgba(249, 115, 22, 0.25); }

  .quick-label {
    font-size: 12px;
    color: #475569;
    font-weight: 500;
  }
}

/* ====== 设备状态总览（进度条） ====== */
.status-overview-card {
  .status-header-total {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 500;
  }

  .status-progress-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* 单项 */
  .status-progress-item {
    cursor: pointer;
    padding: 10px 14px;
    border-radius: 10px;
    background: #f8fafc;
    transition: all 0.25s ease;

    &:hover {
      background: #f1f5f9;
      transform: translateX(3px);

      .status-progress-fill {
        filter: brightness(1.1);
      }
    }
  }

  .status-progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 7px;
  }

  .status-progress-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
  }

  .status-progress-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot-normal { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); }
  .status-dot-inuse { background: #6366f1; box-shadow: 0 0 6px rgba(99, 102, 241, 0.5); }
  .status-dot-repair { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
  .status-dot-scrap { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.5); }
  .status-dot-unused { background: #94a3b8; box-shadow: 0 0 6px rgba(148, 163, 184, 0.5); }
  .status-dot-other { background: #8b5cf6; box-shadow: 0 0 6px rgba(139, 92, 246, 0.5); }

  .status-progress-label {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
  }

  .status-progress-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .status-progress-count {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }

  .status-progress-percent {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    min-width: 36px;
    text-align: right;
  }

  .status-progress-track {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 99px;
    overflow: hidden;
  }

  .status-progress-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 2px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
      animation: progressShimmer 2.5s ease-in-out infinite;
    }
  }

  @keyframes progressShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .status-fill-normal { background: linear-gradient(90deg, #10b981, #34d399); }
  .status-fill-inuse { background: linear-gradient(90deg, #6366f1, #818cf8); }
  .status-fill-repair { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .status-fill-scrap { background: linear-gradient(90deg, #ef4444, #f87171); }
  .status-fill-unused { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }
  .status-fill-other { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
}

.alert-title-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ef4444;
  color: #fff;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 6px;
  line-height: 1;
}

.alert-home-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.alert-home-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #fef2f2;
  }

  .alert-home-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 5px;
    flex-shrink: 0;
  }

  .alert-home-dot-1 { background: #f59e0b; }
  .alert-home-dot-2 { background: #6366f1; }
  .alert-home-dot-3 { background: #ef4444; }
  .alert-home-dot-4 { background: #94a3b8; }

  .alert-home-body {
    flex: 1;
    min-width: 0;
  }

  .alert-home-title {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .alert-home-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .alert-home-date {
    font-size: 11px;
    color: #94a3b8;
  }
}

/* ====== 最近设备列表 ====== */
.recent-card {
  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f8fafc;
    }
  }

  .recent-item-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }

  .recent-avatar {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    text {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
    }
  }

  .recent-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .recent-name {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recent-code {
    font-size: 11px;
    color: #94a3b8;
  }

  .recent-item-right {
    flex-shrink: 0;
    margin-left: 10px;
  }

  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 36px 0;
    color: #94a3b8;
    font-size: 14px;

    .empty-icon {
      font-size: 32px;
      opacity: 0.4;
    }
  }
}

/* ====== 响应式 ====== */
@media screen and (max-width: 1100px) {
  .main-grid {
    flex-direction: column;
  }

  .grid-col-chart,
  .grid-col-list {
    flex: 1;
  }
}

@media screen and (max-width: 900px) {
  .welcome-banner {
    padding: 28px 24px;

    .banner-title {
      font-size: 22px;
    }

    .banner-right .time-num {
      font-size: 26px;
    }
  }

  .uni-container {
    padding: 20px;
  }

  .stats-row {
    flex-wrap: wrap;
    gap: 12px;
  }

  .stat-card {
    min-width: calc(50% - 6px);
    flex: 1 1 auto;
  }

  .quick-card .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 640px) {
  .welcome-banner {
    padding: 24px 16px;

    .banner-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .banner-right {
      width: 100%;

      .banner-time {
        text-align: left;
      }
    }

    .banner-title {
      font-size: 20px;
    }

    .banner-right .time-num {
      font-size: 22px;
    }
  }

  .uni-container {
    padding: 14px;
  }

  .stat-card {
    min-width: 100%;
  }

  .stats-row {
    margin-bottom: 16px;
  }

  .content-card {
    padding: 16px;
  }

  .main-grid {
    gap: 16px;
  }

  .grid-col {
    gap: 16px;
  }

  .quick-card .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .recent-item {
    padding: 8px 6px;
  }
}
</style>
