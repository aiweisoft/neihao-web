<template>
  <view class="dashboard-root">
    <!-- #ifdef H5 -->
    <view class="app-grid">
      <view class="topbar">
        <view class="topbar-left">
          <view class="back-btn" @click="goBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </view>
          <view class="hospital-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </view>
          <text class="hospital-name">山西省康复研究中心 · 设备监控</text>
        </view>
        <view class="topbar-center">{{ clockText }}</view>
        <view class="topbar-right">
          <view class="kpi-card" @click="navToDeviceList()"><text class="kpi-label">总数</text><text class="kpi-value total">{{ floorKpiTotal }}</text></view>
          <view class="kpi-card" @click="navToDeviceList(2)"><text class="kpi-label">使用中</text><text class="kpi-value inuse">{{ floorKpiInUse }}</text></view>
          <view class="kpi-card" @click="navToDeviceList(1)"><text class="kpi-label">正常</text><text class="kpi-value normal">{{ floorKpiNormal }}</text></view>
          <view class="kpi-card" @click="navToDeviceList(3)"><text class="kpi-label">维修中</text><text class="kpi-value repair">{{ floorKpiRepair }}</text></view>
          <view class="kpi-card" @click="navToDeviceList(5)"><text class="kpi-label">未投入</text><text class="kpi-value unused">{{ floorKpiUnused }}</text></view>
        </view>
      </view>

      <view class="sidebar">
        <view class="sidebar-header">
          <text class="sidebar-title">{{ activeFloor !== null ? 'F' + activeFloor + ' 设备' : '设备列表' }}</text>
          <text class="sidebar-count">{{ filteredEquip.length }}</text>
        </view>
        <view class="floor-tabs">
          <view
            v-for="f in availableFloors"
            :key="f.num"
            class="floor-tab"
            :class="{ active: activeFloor === f.num }"
            @click="switchFloor(f.num)"
          >
            <view class="floor-dot" :style="{ background: f.color }"></view>
            {{ f.label }}
          </view>
          <view
            class="floor-tab floor-tab-all"
            :class="{ active: activeFloor === null }"
            @click="switchFloor(null)"
          >全部</view>
        </view>
        <view class="sidebar-search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索设备名称或位置..."
          />
        </view>
        <view class="equip-list" ref="equipListEl">
          <template v-if="displayEquipList.length">
            <view
              v-for="(group, status) in groupedEquip"
              :key="status"
            >
              <view class="status-group-label" v-if="group.length">{{ status === 'alarm' ? '告警' : statusLabels[status] }} ({{ group.length }})</view>
              <view
                v-for="eq in group"
                :key="eq._id"
                class="equip-item"
                :class="{ active: selectedId === eq._id }"
                @click="selectEquipById(eq._id)"
              >
                <view class="status-dot" :class="mapStatus(eq).visualStatus"></view>
                <view class="equip-icon" v-html="getIconSVG(mapStatus(eq).type3D)"></view>
                <view class="equip-info">
                  <view class="equip-name">{{ eq.name }}</view>
                  <view class="equip-meta">{{ eq.locationName || '--' }}</view>
                </view>
                <view class="floor-badge" v-if="activeFloor === null">{{ eq.floorLabel || '1F' }}</view>
                <view class="status-badge" :class="mapStatus(eq).visualStatus">{{ eq._hasAlert ? '告警' : statusLabels[eq.status] }}</view>
              </view>
            </view>
          </template>
          <view class="empty-list" v-else>
            <text>暂无设备数据</text>
          </view>
        </view>

        <view class="detail-panel" :class="{ visible: selectedId }" v-if="selectedEquip">
          <view class="detail-header">
            <text class="detail-title">{{ selectedEquip.name }}</text>
            <view class="status-badge" :class="mapStatus(selectedEquip).visualStatus" style="margin-left:8px;">{{ selectedEquip._hasAlert ? '告警' : statusLabels[selectedEquip.status] }}</view>
          </view>
          <view class="detail-grid">
            <view class="detail-field"><text class="d-label">设备编号</text><text class="d-value">{{ selectedEquip.code || '--' }}</text></view>
            <view class="detail-field"><text class="d-label">品牌</text><text class="d-value">{{ selectedEquip.brand || '--' }}</text></view>
            <view class="detail-field"><text class="d-label">规格型号</text><text class="d-value">{{ selectedEquip.model || '--' }}</text></view>
            <view class="detail-field"><text class="d-label">厂家</text><text class="d-value">{{ selectedEquip.manufacturer || '--' }}</text></view>
            <view class="detail-field"><text class="d-label">存放位置</text><text class="d-value">{{ selectedEquip.locationName || '--' }}</text></view>
            <view class="detail-field"><text class="d-label">使用部门</text><text class="d-value">{{ selectedEquip.deptName || '--' }}</text></view>
            <view class="detail-field" style="grid-column:1/-1"><text class="d-label">产品编号</text><text class="d-value">{{ selectedEquip.serial_no || '--' }}</text></view>
          </view>
          <view class="detail-actions">
            <view class="btn-locate-small" @click="flyToEquip3D(selectedEquip)">定位到设备</view>
            <view class="btn-detail" @click="navToEdit(selectedEquip._id)">查看详情</view>
          </view>
        </view>
      </view>

      <view class="scene-area">
        <view id="scene-container" ref="sceneContainer">
          <view class="loading-overlay" :class="{ hidden: !loading }">
            <view class="loader-spinner"></view>
            <text>正在加载 3D 场景...</text>
          </view>
        </view>
        <view class="display-toggles">
          <view class="toggle-item" @click="toggleOption('showExterior')">
            <view class="toggle-check" :class="{ checked: showExterior }">
              <text v-if="showExterior">✓</text>
            </view>
            <text>外围轮廓线</text>
          </view>
          <view class="toggle-item" @click="toggleOption('showSideLabels')">
            <view class="toggle-check" :class="{ checked: showSideLabels }">
              <text v-if="showSideLabels">✓</text>
            </view>
            <text>楼层标签</text>
          </view>
          <view class="toggle-item" @click="toggleOption('showEquipLabels')">
            <view class="toggle-check" :class="{ checked: showEquipLabels }">
              <text v-if="showEquipLabels">✓</text>
            </view>
            <text>设备名称</text>
          </view>
          <view class="toggle-sep"></view>
          <view class="toggle-item toggle-autofocus" @click="toggleAutoFocus">
            <view class="toggle-check autofocus-check" :class="{ active: autoFocusActive }">
              <text v-if="autoFocusActive">⏸</text>
              <text v-else>▶</text>
            </view>
            <text>自动巡游</text>
          </view>
        </view>
        <view class="floor-legend">
          <view v-for="f in availableFloors" :key="f.num" class="floor-legend-item">
            <view class="legend-dot" :style="{ background: f.color }"></view>
            <text>{{ f.label }}</text>
          </view>
        </view>
        <view class="scene-hint">拖动旋转 · 滚轮缩放 · 点击设备查看详情</view>
      </view>

      <view class="alertbar">
        <view class="alertbar-label">
          <view class="alert-dot"></view>
          <text>实时告警</text>
        </view>
        <view class="alert-track">
          <view class="alert-scroll" ref="alertScrollEl">
            <view
              v-for="(a, i) in alertItems"
              :key="i"
              class="alert-item"
            >
              <text class="alert-type" :class="a.severity">{{ a.type }}</text>
              <text>{{ a.floor ? '[' + a.floor + '] ' : '' }}{{ a.name }}</text>
              <text class="alert-sep">|</text>
              <text class="alert-time">{{ a.time }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <view class="not-supported">
      <text class="not-supported-icon">🖥</text>
      <text class="not-supported-title">3D 设备监控</text>
      <text class="not-supported-desc">该页面仅支持在 H5（浏览器）平台查看</text>
      <text class="not-supported-hint">请使用电脑浏览器打开管理后台访问此功能</text>
    </view>
    <!-- #endif -->
  </view>
</template>

<script>
// #ifdef H5
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
// #endif

const db = uniCloud.database()

const FLOOR_NAMES = ['一层', '二层', '三层', '四层', '五层']
const FLOOR_LABELS = ['1F', '2F', '3F', '4F', '5F']
const FLOOR_COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#F59E0B', '#EC4899']
const STATUS_COLORS = { online: '#22C55E', alarm: '#EF4444', maintenance: '#F59E0B', offline: '#6B7280' }

const EQUIP_TYPES_3D = {
  'CT Scanner': { shape: 'box', w: 0.8, h: 0.7, d: 0.6, color: '#4B89DC' },
  'MRI Machine': { shape: 'box', w: 1.0, h: 0.8, d: 0.7, color: '#7C3AED' },
  'Ultrasound': { shape: 'cylinder', r: 0.25, h: 0.5, color: '#06B6D4' },
  'Ventilator': { shape: 'box', w: 0.4, h: 0.6, d: 0.3, color: '#84CC16' },
  'X-Ray': { shape: 'box', w: 0.7, h: 0.5, d: 0.4, color: '#F97316' },
  'Infusion Pump': { shape: 'box', w: 0.2, h: 0.5, d: 0.2, color: '#EC4899' },
  'Defibrillator': { shape: 'box', w: 0.4, h: 0.3, d: 0.3, color: '#EF4444' },
  'Patient Monitor': { shape: 'box', w: 0.4, h: 0.5, d: 0.2, color: '#14B8A6' },
  'Dialysis Machine': { shape: 'box', w: 0.6, h: 0.7, d: 0.5, color: '#8B5CF6' },
  'Anesthesia Machine': { shape: 'box', w: 0.5, h: 0.6, d: 0.4, color: '#F43F5E' }
}

export default {
  data() {
    return {
      loading: true,
      clockText: '',
      clockTimer: null,
      devices: [],
      locations: [],
      categories: [],
      departments: [],
      alertData: [],
      activeFloor: null,
      selectedId: null,
      searchQuery: '',
      kpiTotal: 0,
      kpiInUse: 0,
      kpiNormal: 0,
      kpiRepair: 0,
      kpiUnused: 0,
      availableFloors: [],
      sceneFloorGroups: {},
      showExterior: true,
      showSideLabels: true,
      showEquipLabels: true,
      autoFocusActive: false,
      autoFocusTimer: null,
      autoFocusIndex: 0
    }
  },
  computed: {
    statusLabels() {
      return { 1: '正常', 2: '使用中', 3: '维修中', 4: '报废', 5: '未投入', 6: '其他' }
    },
    statusOrder() {
      return ['alarm', 3, 4, 1, 2, 5, 6]
    },
    floorKpiTotal() {
      return this.activeFloor !== null ? this.filteredEquip.length : this.kpiTotal
    },
    floorKpiInUse() {
      return this.activeFloor !== null ? this.filteredEquip.filter(d => d.status === 2).length : this.kpiInUse
    },
    floorKpiNormal() {
      return this.activeFloor !== null ? this.filteredEquip.filter(d => d.status === 1).length : this.kpiNormal
    },
    floorKpiRepair() {
      return this.activeFloor !== null ? this.filteredEquip.filter(d => d.status === 3).length : this.kpiRepair
    },
    floorKpiUnused() {
      return this.activeFloor !== null ? this.filteredEquip.filter(d => d.status === 5).length : this.kpiUnused
    },
    filteredEquip() {
      let list = this.devices
      if (this.activeFloor !== null) {
        list = list.filter(d => d._floor === this.activeFloor)
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        list = list.filter(d =>
          (d.name || '').toLowerCase().includes(q) ||
          (d.locationName || '').toLowerCase().includes(q) ||
          (d.code || '').toLowerCase().includes(q)
        )
      }
      return list
    },
    groupedEquip() {
      const groups = { alarm: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
      this.filteredEquip.forEach(d => {
        if (d._hasAlert) {
          groups.alarm.push(d)
        } else {
          const s = d.status || 1
          if (groups[s] !== undefined) {
            groups[s].push(d)
          }
        }
      })
      return groups
    },
    displayEquipList() {
      const order = this.statusOrder
      const list = []
      order.forEach(s => {
        if (this.groupedEquip[s] && this.groupedEquip[s].length) {
          list.push(...this.groupedEquip[s])
        }
      })
      return list
    },
    selectedEquip() {
      if (!this.selectedId) return null
      return this.devices.find(d => d._id === this.selectedId) || null
    },
    alertItems() {
      const items = []
      const alarmDevices = this.devices.filter(d => d._hasAlert)
      alarmDevices.forEach(d => {
        items.push({
          name: d.name,
          floor: d.floorLabel || '',
          type: '设备告警',
          severity: 'critical',
          time: this.formatTime(new Date())
        })
      })
      const mtDevices = this.devices.filter(d => !d._hasAlert && d.status === 3)
      mtDevices.forEach(d => {
        items.push({
          name: d.name,
          floor: d.floorLabel || '',
          type: '维修提醒',
          severity: 'warning',
          time: this.formatTime(d.updated_at)
        })
      })
      if (!items.length) {
        items.push({ name: '系统', floor: '', type: '日常巡检', severity: 'info', time: '08:00' })
        items.push({ name: '设备中心', floor: '', type: '环境监测', severity: 'info', time: '07:30' })
      }
      return items
    },
  },
  onLoad() {
    this.updateClock()
    this.clockTimer = setInterval(() => this.updateClock(), 1000)
    this.initAll()
  },
  onUnload() {
    if (this.clockTimer) clearInterval(this.clockTimer)
    if (this.autoFocusTimer) clearInterval(this.autoFocusTimer)
    this.disposeScene()
  },
  methods: {
    updateClock() {
      const now = new Date()
      this.clockText = now.toLocaleDateString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      })
    },

    async initAll() {
      uni.showLoading({ mask: true, title: '加载设备数据...' })
      try {
        await this.fetchData()
        this.processData()
        this.updateStats()
        this.buildFloorGroup()
      } catch (e) {
        console.error('数据加载失败:', e)
      }
      uni.hideLoading()
      this.loading = false
      this.$nextTick(() => {
        // #ifdef H5
        this.initScene()
        // #endif
      })
    },

    async fetchData() {
      const [devRes, locRes, catRes, deptRes, alertRes, devCountRes] = await Promise.all([
        db.collection('medical-device').where({ deleted: 0 }).limit(1000).get(),
        db.collection('medical-device-location').where({ deleted: 0 }).limit(500).get(),
        db.collection('medical-device-category').where({ deleted: 0 }).limit(500).get(),
        db.collection('opendb-department').limit(500).get(),
        db.collection('medical-device-alert').where({ deleted: 0, is_read: 0 }).limit(500).get().catch(() => ({ result: { data: [] } })),
        db.collection('medical-device').where({ deleted: 0 }).count()
      ])
      this.devices = devRes.result.data || []
      this.locations = locRes.result.data || []
      this.categories = catRes.result.data || []
      this.departments = deptRes.result.data || []
      this.alertData = alertRes.result.data || []
      this._deviceTotal = devCountRes.result.total || 0
    },

    processData() {
      const locMap = {}
      this.locations.forEach(l => { locMap[l._id] = l })
      const catMap = {}
      this.categories.forEach(c => { catMap[c._id] = c })
      const deptMap = {}
      this.departments.forEach(d => { deptMap[d._id] = d })
      const alertDeviceIds = new Set(this.alertData.map(a => a.device_id).filter(Boolean))

      this.devices.forEach(d => {
        const loc = locMap[d.location_id] || {}
        const cat = catMap[d.category_id] || {}
        const dept = deptMap[d.dept_id] || {}
        d.categoryName = cat.name || '未分类'
        d.locationName = loc.name || '未知位置'
        d.locationFloor = loc.floor || ''
        d.deptName = dept.name || ''
        d._hasAlert = alertDeviceIds.has(d._id)

        const floorNum = this.parseFloor(loc.floor)
        d._floor = floorNum
        d.floorLabel = 'F' + floorNum
      })
    },

    parseFloor(floorStr) {
      if (!floorStr) return 1
      const s = String(floorStr).trim()
      const numMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7 }
      const match = s.match(/(\d+)/)
      if (match) {
        const n = parseInt(match[1])
        return Math.max(1, Math.min(5, n))
      }
      for (const [cn, n] of Object.entries(numMap)) {
        if (s.includes(cn)) return n
      }
      return 1
    },

    mapStatus(device) {
      if (device._hasAlert) {
        return { visualStatus: 'alarm', statusColor: STATUS_COLORS.alarm, type3D: this.inferType3D(device), dbStatus: device.status || 1 }
      }
      const s = device.status || 1
      if (s === 2) {
        return { visualStatus: 'primary', statusColor: '#3B82F6', type3D: this.inferType3D(device), dbStatus: s }
      }
      if (s === 3) {
        return { visualStatus: 'repair', statusColor: '#F59E0B', type3D: this.inferType3D(device), dbStatus: s }
      }
      if (s === 4 || s === 5) {
        return { visualStatus: 'gray', statusColor: '#6B7280', type3D: this.inferType3D(device), dbStatus: s }
      }
      return { visualStatus: 'active', statusColor: '#22C55E', type3D: this.inferType3D(device), dbStatus: s }
    },

    inferType3D(device) {
      const n = (device.categoryName || '').toLowerCase()
      if (n.includes('ct') || n.includes('断层')) return 'CT Scanner'
      if (n.includes('mri') || n.includes('磁共振') || n.includes('核磁')) return 'MRI Machine'
      if (n.includes('超声') || n.includes('b超') || n.includes('彩超')) return 'Ultrasound'
      if (n.includes('呼吸') || n.includes('ventilator')) return 'Ventilator'
      if (n.includes('x光') || n.includes('x线') || n.includes('x射') || n.includes('x-ray')) return 'X-Ray'
      if (n.includes('输液') || n.includes('infusion')) return 'Infusion Pump'
      if (n.includes('除颤') || n.includes('defibrillator')) return 'Defibrillator'
      if (n.includes('监护') || n.includes('monitor') || n.includes('心电')) return 'Patient Monitor'
      if (n.includes('透析') || n.includes('dialysis')) return 'Dialysis Machine'
      if (n.includes('麻醉') || n.includes('anesthesia')) return 'Anesthesia Machine'
      return 'Patient Monitor'
    },

    buildFloorGroup() {
      const usedFloors = new Set()
      this.devices.forEach(d => { usedFloors.add(d._floor) })
      const floorNums = Array.from(usedFloors).sort((a, b) => a - b)
      this.availableFloors = floorNums.map(fn => ({
        num: fn,
        label: 'F' + fn,
        name: fn <= 5 ? FLOOR_NAMES[fn - 1] : fn + '层',
        color: FLOOR_COLORS[(fn - 1) % 5],
        y3d: (fn - 1) * 3
      }))
    },

    updateStats() {
      this.kpiTotal = this._deviceTotal || this.devices.length
      this.kpiInUse = this.devices.filter(d => d.status === 2).length
      this.kpiNormal = this.devices.filter(d => d.status === 1).length
      this.kpiRepair = this.devices.filter(d => d.status === 3).length
      this.kpiUnused = this.devices.filter(d => d.status === 5).length
    },

    // ========== 3D Scene ==========
    initScene() {
      // #ifdef H5
      let container = this.$refs.sceneContainer
      if (!container) return
      if (container.$el) container = container.$el
      const rect = container.getBoundingClientRect()
      const w = rect.width || window.innerWidth
      const h = rect.height || window.innerHeight

      this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      this._renderer.setSize(w, h)
      this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this._renderer.shadowMap.enabled = true
      this._renderer.shadowMap.type = THREE.PCFSoftShadowMap
      this._renderer.toneMapping = THREE.ACESFilmicToneMapping
      this._renderer.toneMappingExposure = 1.0
      container.appendChild(this._renderer.domElement)

      this._labelRenderer = new CSS2DRenderer()
      this._labelRenderer.setSize(w, h)
      this._labelRenderer.domElement.style.position = 'absolute'
      this._labelRenderer.domElement.style.top = '0'
      this._labelRenderer.domElement.style.pointerEvents = 'none'
      container.appendChild(this._labelRenderer.domElement)

      this._scene = new THREE.Scene()
      this._scene.background = new THREE.Color(0x0A0E17)
      this._scene.fog = new THREE.Fog(0x0A0E17, 35, 55)
      this._focusInfoLabel = null
      this._highlightedGroup = null

      this._camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100)
      this._camera.position.set(28, 20, 28)
      this._camera.lookAt(0, 4, 0)

      this._controls = new OrbitControls(this._camera, this._renderer.domElement)
      this._controls.enableDamping = true
      this._controls.dampingFactor = 0.1
      this._controls.maxPolarAngle = Math.PI / 2.05
      this._controls.minDistance = 8
      this._controls.maxDistance = 45
      this._controls.target.set(0, 4, 0)

      this.setupLights()
      this.buildBuilding()
      this.animate()

      this._rafId = requestAnimationFrame(() => {})
      this._renderer.domElement.addEventListener('click', this._onSceneClick)
      window.addEventListener('resize', this._onResize)
      document.addEventListener('keydown', this._onKeyDown)
      // #endif
    },

    setupLights() {
      // #ifdef H5
      const ambient = new THREE.AmbientLight(0x404060, 0.7)
      this._scene.add(ambient)

      const dirLight = new THREE.DirectionalLight(0xffeedd, 2.0)
      dirLight.position.set(15, 25, 15)
      dirLight.castShadow = true
      dirLight.shadow.mapSize.width = 2048
      dirLight.shadow.mapSize.height = 2048
      this._scene.add(dirLight)

      const fillLight = new THREE.DirectionalLight(0x8888ff, 0.5)
      fillLight.position.set(-10, 10, -10)
      this._scene.add(fillLight)

      const hemiLight = new THREE.HemisphereLight(0x8888ff, 0x444422, 0.5)
      this._scene.add(hemiLight)
      // #endif
    },

    buildBuilding() {
      // #ifdef H5
      const BLDG_W = 20
      const BLDG_D = 16
      const maxFloor = Math.max(1, ...this.availableFloors.map(f => f.num))
      const topFloor = this.availableFloors.length > 0 ? this.availableFloors[this.availableFloors.length - 1] : { y3d: 0, num: 1 }

      // Ground plane
      const groundGeo = new THREE.PlaneGeometry(40, 40)
      const groundMat = new THREE.MeshStandardMaterial({ color: 0x0A0E17, roughness: 1 })
      const ground = new THREE.Mesh(groundGeo, groundMat)
      ground.rotation.x = -Math.PI / 2
      ground.position.y = -0.05
      ground.receiveShadow = true
      this._scene.add(ground)

      // Grid
      const gridHelper = new THREE.GridHelper(40, 30, 0x1A2332, 0x152032)
      gridHelper.position.y = 0
      this._scene.add(gridHelper)

      // Site outline
      const sitePts = [
        new THREE.Vector3(-BLDG_W / 2, 0.02, -BLDG_D / 2),
        new THREE.Vector3(BLDG_W / 2, 0.02, -BLDG_D / 2),
        new THREE.Vector3(BLDG_W / 2, 0.02, BLDG_D / 2),
        new THREE.Vector3(-BLDG_W / 2, 0.02, BLDG_D / 2),
        new THREE.Vector3(-BLDG_W / 2, 0.02, -BLDG_D / 2)
      ]
      const siteGeo = new THREE.BufferGeometry().setFromPoints(sitePts)
      const siteLine = new THREE.Line(siteGeo, new THREE.LineBasicMaterial({ color: 0x3B82F6, transparent: true, opacity: 0.2 }))
      this._scene.add(siteLine)

      this._equip3DMap = new Map()
      this._floorSlabs = []
      this._roomGroups = []
      this._equipGroups = []

      // Build each floor
      this.availableFloors.forEach(f => {
        this.buildFloor(f, BLDG_W, BLDG_D)
      })

      // Exterior edges
      this.buildExterior(BLDG_W, BLDG_D, topFloor.y3d + 3)

      // Floor labels on side
      this.buildFloorSideLabels(BLDG_W)

      this.switchFloor3D(this.activeFloor)
      // #endif
    },

    buildFloor(f, BLDG_W, BLDG_D) {
      // #ifdef H5
      const color = new THREE.Color(f.color)
      const slabMat = new THREE.MeshPhysicalMaterial({
        color, transparent: true, opacity: 0.12, roughness: 0.3,
        metalness: 0.1, side: THREE.DoubleSide, depthWrite: false
      })
      const slabGeo = new THREE.PlaneGeometry(BLDG_W - 0.2, BLDG_D - 0.2)
      const slab = new THREE.Mesh(slabGeo, slabMat)
      slab.rotation.x = -Math.PI / 2
      slab.position.y = f.y3d + 0.05
      slab.userData.floorNum = f.num
      this._scene.add(slab)
      this._floorSlabs.push(slab)

      // Room walls for this floor
      const roomGroup = new THREE.Group()
      roomGroup.userData.floorNum = f.num
      const wallMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 })

      // Get devices on this floor, group by department
      const floorDevices = this.devices.filter(d => d._floor === f.num && (d.status === 1 || d.status === 2 || d.status === 3))
      const deptGroups = {}
      floorDevices.forEach(d => {
        const deptKey = d.deptName || '未分配科室'
        if (!deptGroups[deptKey]) deptGroups[deptKey] = []
        deptGroups[deptKey].push(d)
      })
      const deptNames = Object.keys(deptGroups)
      if (deptNames.length === 0) return

      // Arrange departments in a grid on the floor
      const cols = Math.ceil(Math.sqrt(deptNames.length))
      const rows = Math.ceil(deptNames.length / cols)
      const cellW = BLDG_W / cols
      const cellD = BLDG_D / rows

      deptNames.forEach((deptName, idx) => {
        const col = idx % cols
        const row = Math.floor(idx / cols)
        const cx = -BLDG_W / 2 + cellW * col + cellW / 2
        const cz = -BLDG_D / 2 + cellD * row + cellD / 2
        const hw = cellW / 2 - 0.3
        const hd = cellD / 2 - 0.3

        // Department outline
        const y = f.y3d + 0.08
        const pts = [
          new THREE.Vector3(cx - hw, y, cz - hd),
          new THREE.Vector3(cx + hw, y, cz - hd),
          new THREE.Vector3(cx + hw, y, cz + hd),
          new THREE.Vector3(cx - hw, y, cz + hd),
          new THREE.Vector3(cx - hw, y, cz - hd)
        ]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        roomGroup.add(new THREE.Line(geo, wallMat))

        // Department label
        const div = document.createElement('div')
        div.textContent = deptName.length > 6 ? deptName.slice(0, 6) + '..' : deptName
        div.style.color = f.color
        div.style.fontSize = '10px'
        div.style.fontWeight = '600'
        div.style.fontFamily = 'Inter, system-ui, sans-serif'
        div.style.background = 'rgba(10,14,23,0.75)'
        div.style.padding = '1px 6px'
        div.style.borderRadius = '4px'
        div.style.border = '1px solid ' + f.color + '44'
        div.style.whiteSpace = 'nowrap'
        const label = new CSS2DObject(div)
        label.position.set(cx, y + 0.15, cz)
        roomGroup.add(label)

        // Place equipment in this department
        const equipInDept = deptGroups[deptName]
        const n = equipInDept.length
        const spacing = 1.2
        const margin = 0.8

        const colCount = Math.ceil(Math.sqrt(n))
        const rowCount = Math.ceil(n / colCount)
        const startX = cx - (colCount - 1) * spacing / 2
        const startZ = cz - (rowCount - 1) * spacing / 2

        equipInDept.forEach((eq, ei) => {
          const c = ei % colCount
          const r = Math.floor(ei / colCount)
          const ex = startX + c * spacing
          const ez = startZ + r * spacing
          const eqGroup = this.createEquipMesh(eq, ex, f.y3d, ez, f.color)
          eqGroup.userData.device = eq
          this._scene.add(eqGroup)
          this._equipGroups.push(eqGroup)
          this._equip3DMap.set(eq._id, eqGroup)
        })
      })

      // Floor perimeter
      const y = f.y3d + 0.08
      const perimPts = [
        new THREE.Vector3(-BLDG_W / 2, y, -BLDG_D / 2),
        new THREE.Vector3(BLDG_W / 2, y, -BLDG_D / 2),
        new THREE.Vector3(BLDG_W / 2, y, BLDG_D / 2),
        new THREE.Vector3(-BLDG_W / 2, y, BLDG_D / 2),
        new THREE.Vector3(-BLDG_W / 2, y, -BLDG_D / 2)
      ]
      const perimGeo = new THREE.BufferGeometry().setFromPoints(perimPts)
      const perimMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 })
      roomGroup.add(new THREE.Line(perimGeo, perimMat))

      this._scene.add(roomGroup)
      this._roomGroups.push(roomGroup)
      // #endif
    },

    createEquipMesh(eq, x, floorY, z, floorColor) {
      // #ifdef H5
      const statusInfo = this.mapStatus(eq)
      const type3D = statusInfo.type3D
      const t = EQUIP_TYPES_3D[type3D] || EQUIP_TYPES_3D['Patient Monitor']
      const statusColor = statusInfo.statusColor
      const color = new THREE.Color(t.color)
      const group = new THREE.Group()

      let mesh
      let wireframe = null
      if (t.shape === 'cylinder') {
        const geo = new THREE.CylinderGeometry(t.r, t.r, t.h, 16)
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 })
        mesh = new THREE.Mesh(geo, mat)
        mesh.position.y = t.h / 2
      } else {
        const geo = new THREE.BoxGeometry(t.w, t.h, t.d)
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 })
        mesh = new THREE.Mesh(geo, mat)
        mesh.position.y = t.h / 2
        const edges = new THREE.EdgesGeometry(geo)
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 })
        wireframe = new THREE.LineSegments(edges, edgeMat)
        wireframe.position.y = t.h / 2
        group.add(wireframe)
      }
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData.isEquipment = true
      mesh.userData.equipId = eq._id
      group.add(mesh)

      // Status ring
      const ringGeo = new THREE.TorusGeometry(0.3, 0.05, 8, 24)
      const ringMat = new THREE.MeshStandardMaterial({
        color: statusColor, emissive: statusColor, emissiveIntensity: statusInfo.visualStatus === 'alarm' ? 0.8 : 0.5,
        transparent: true, opacity: 0.9
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.y = (t.shape === 'cylinder' ? t.h : t.h) + 0.15
      ring.rotation.x = Math.PI / 2
      group.add(ring)

      // Glow
      const glowGeo = new THREE.RingGeometry(0.1, 0.5, 24)
      const glowMat = new THREE.MeshBasicMaterial({
        color: statusColor, transparent: true, opacity: 0.2,
        side: THREE.DoubleSide, depthWrite: false
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      glow.rotation.x = -Math.PI / 2
      glow.position.y = 0.01
      group.add(glow)

      // Label
      const div = document.createElement('div')
      div.textContent = eq.name
      div.style.color = '#8899AA'
      div.style.fontSize = '10px'
      div.style.fontWeight = '500'
      div.style.fontFamily = 'Inter, system-ui, sans-serif'
      div.style.background = 'rgba(19,25,38,0.85)'
      div.style.padding = '1px 6px'
      div.style.borderRadius = '4px'
      div.style.border = '1px solid rgba(30,41,59,0.6)'
      div.style.whiteSpace = 'nowrap'
      const nameLabel = new CSS2DObject(div)
      nameLabel.position.y = (t.shape === 'cylinder' ? t.h : t.h) + 0.5
      group.add(nameLabel)
      group.userData.nameLabel = nameLabel

      group.position.set(x, floorY, z)
      group.userData.equipId = eq._id
      group.userData.floorNum = eq._floor
      group.userData.ringMat = ringMat
      group.userData.glowMat = glowMat
      group.userData.meshMat = mesh.material
      group.userData.statusColor = statusColor
      group.userData.wireframe = (t.shape !== 'cylinder') ? wireframe : null
      return group
      // #endif
    },

    buildExterior(BLDG_W, BLDG_D, topY) {
      // #ifdef H5
      const group = new THREE.Group()
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x3B82F6, transparent: true, opacity: 0.15 })
      this.availableFloors.forEach(f => {
        const y = f.y3d
        const pts = [
          new THREE.Vector3(-BLDG_W / 2, y, -BLDG_D / 2),
          new THREE.Vector3(BLDG_W / 2, y, -BLDG_D / 2),
          new THREE.Vector3(BLDG_W / 2, y, BLDG_D / 2),
          new THREE.Vector3(-BLDG_W / 2, y, BLDG_D / 2),
          new THREE.Vector3(-BLDG_W / 2, y, -BLDG_D / 2)
        ]
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), edgeMat))
      })
      const topPts = [
        new THREE.Vector3(-BLDG_W / 2, topY, -BLDG_D / 2),
        new THREE.Vector3(BLDG_W / 2, topY, -BLDG_D / 2),
        new THREE.Vector3(BLDG_W / 2, topY, BLDG_D / 2),
        new THREE.Vector3(-BLDG_W / 2, topY, BLDG_D / 2),
        new THREE.Vector3(-BLDG_W / 2, topY, -BLDG_D / 2)
      ]
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(topPts), edgeMat))
      this._scene.add(group)
      this._exteriorGroup = group
      // #endif
    },

    buildFloorSideLabels(BLDG_W) {
      // #ifdef H5
      const group = new THREE.Group()
      this.availableFloors.forEach(f => {
        const div = document.createElement('div')
        div.textContent = f.label
        div.style.color = f.color
        div.style.fontSize = '18px'
        div.style.fontWeight = '700'
        div.style.fontFamily = 'Inter, system-ui, sans-serif'
        div.style.background = 'rgba(10,14,23,0.6)'
        div.style.padding = '2px 8px'
        div.style.borderRadius = '6px'
        div.style.border = '1px solid ' + f.color + '66'
        const label = new CSS2DObject(div)
        label.position.set(-BLDG_W / 2 - 0.8, f.y3d + 1.5, 0)
        group.add(label)
      })
      this._scene.add(group)
      this._sideLabelsGroup = group
      // #endif
    },

    switchFloor3D(floorNum) {
      // #ifdef H5
      const showAll = floorNum === null
      this._floorSlabs.forEach(slab => {
        slab.visible = showAll || slab.userData.floorNum === floorNum
        slab.material.opacity = showAll ? 0.2 : (slab.userData.floorNum === floorNum ? 0.2 : 0)
      })
      this._roomGroups.forEach(g => {
        const visible = showAll || g.userData.floorNum === floorNum
        g.visible = visible
        g.children.forEach(child => {
          child.visible = visible
        })
      })
      this._equipGroups.forEach(g => {
        const visible = showAll || g.userData.floorNum === floorNum
        g.visible = visible
        g.children.forEach(child => {
          child.visible = visible
        })
      })
      this.applyDisplayToggles()
      // #endif
    },

    applyDisplayToggles() {
      // #ifdef H5
      if (this._exteriorGroup) {
        this._exteriorGroup.visible = this.showExterior
      }
      if (this._sideLabelsGroup) {
        this._sideLabelsGroup.visible = this.showSideLabels
      }
      this._equip3DMap.forEach((g) => {
        if (g.userData.nameLabel) {
          g.userData.nameLabel.visible = g.visible && this.showEquipLabels
        }
      })
      // #endif
    },

    toggleOption(key) {
      this[key] = !this[key]
      this.applyDisplayToggles()
    },

    toggleAutoFocus() {
      if (this.autoFocusActive) {
        this.stopAutoFocus()
      } else {
        this.startAutoFocus()
      }
    },

    startAutoFocus() {
      if (this.autoFocusTimer) return
      this.autoFocusActive = true
      this.autoFocusIndex = 0
      this.nextFocus()
      this.autoFocusTimer = setInterval(() => {
        this.nextFocus()
      }, 5000)
    },

    stopAutoFocus() {
      if (this.autoFocusTimer) {
        clearInterval(this.autoFocusTimer)
        this.autoFocusTimer = null
      }
      this.autoFocusActive = false
    },

    nextFocus() {
      // #ifdef H5
      const list = this.displayEquipList
      if (!list.length) return
      if (this.autoFocusIndex >= list.length) {
        this.autoFocusIndex = 0
      }
      const eq = list[this.autoFocusIndex]
      this.autoFocusIndex++
      if (eq && eq._id) {
        this._isAutoFocusing = true
        this.selectEquipById(eq._id)
        this._isAutoFocusing = false
      }
      // #endif
    },

    animate() {
      // #ifdef H5
      if (!this._scene) return
      let alarmTime = 0
      const loop = () => {
        if (!this._scene || !this._renderer) return
        this._rafId = requestAnimationFrame(loop)
        this._controls.update()
        alarmTime += 0.03
        this._equip3DMap.forEach((g) => {
          if (g.userData.ringMat && g.userData.statusColor === STATUS_COLORS.alarm) {
            const p = 0.6 + 0.4 * Math.sin(alarmTime * 3)
            g.userData.ringMat.opacity = p
            g.userData.ringMat.emissiveIntensity = 0.3 + 0.7 * p
            if (g.userData.glowMat) g.userData.glowMat.opacity = 0.1 + 0.3 * p
          }
        })
        this._renderer.render(this._scene, this._camera)
        this._labelRenderer.render(this._scene, this._camera)
      }
      loop()
      // #endif
    },

    _onSceneClick(event) {
      // #ifdef H5
      if (!this._renderer) return
      const rect = this._renderer.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, this._camera)
      const meshes = []
      this._equip3DMap.forEach(g => {
        g.traverse(child => {
          if (child.isMesh && child.userData.isEquipment) meshes.push(child)
        })
      })
      const hits = raycaster.intersectObjects(meshes)
      if (hits.length > 0) {
        const id = hits[0].object.userData.equipId
        if (id) this.selectEquipById(id)
      }
      // #endif
    },

    _onResize() {
      // #ifdef H5
      if (!this._renderer) return
      let container = this.$refs.sceneContainer
      if (!container) return
      if (container.$el) container = container.$el
      const rect = container.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      this._camera.aspect = w / h
      this._camera.updateProjectionMatrix()
      this._renderer.setSize(w, h)
      this._labelRenderer.setSize(w, h)
      // #endif
    },

    _onKeyDown(e) {
      if (e.key === 'Escape') {
        this.selectedId = null
        this.clear3DHighlight()
      }
    },

    disposeScene() {
      // #ifdef H5
      if (this._rafId) cancelAnimationFrame(this._rafId)
      if (this._renderer) {
        this._renderer.domElement.removeEventListener('click', this._onSceneClick)
        window.removeEventListener('resize', this._onResize)
        document.removeEventListener('keydown', this._onKeyDown)
        this._renderer.dispose()
        this._renderer = null
      }
      if (this._labelRenderer) {
        this._labelRenderer = null
      }
      this._scene = null
      this._camera = null
      this._controls = null
      // #endif
    },

    // ========== Operations ==========
    switchFloor(floorNum) {
      this.activeFloor = floorNum
      this.selectedId = null
      this._restoreHighlight()
      this._updateFocusLabel(null)
      this.switchFloor3D(floorNum)
      // #ifdef H5
      if (!this._camera || !this._controls) return
      if (floorNum === null) {
        this._flyCameraTo(new THREE.Vector3(28, 20, 28), new THREE.Vector3(0, 4, 0))
      } else {
        const floor = this.availableFloors.find(f => f.num === floorNum)
        if (floor) {
          const fy = floor.y3d
          this._flyCameraTo(new THREE.Vector3(14, fy + 10, 14), new THREE.Vector3(0, fy + 1.5, 0))
        }
      }
      // #endif
    },

    // #ifdef H5
    _flyCameraTo(endPos, endTarget) {
      if (!this._camera || !this._controls) return
      const startPos = this._camera.position.clone()
      const startTarget = this._controls.target.clone()
      const dur = 600
      const t0 = performance.now()
      const anim = (t) => {
        const p = Math.min((t - t0) / dur, 1)
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
        this._camera.position.lerpVectors(startPos, endPos, e)
        this._controls.target.lerpVectors(startTarget, endTarget, e)
        this._controls.update()
        if (p < 1) requestAnimationFrame(anim)
      }
      requestAnimationFrame(anim)
    },
    // #endif

    filterSidebar() {
      // reactive via computed, no-op needed
    },

    selectEquipById(id) {
      if (!this._isAutoFocusing) {
        this.stopAutoFocus()
      }
      this._restoreHighlight()
      this.selectedId = id
      const eq = this.devices.find(d => d._id === id)
      if (!eq) {
        this._updateFocusLabel(null)
        return
      }
      this.flyToEquip3D(eq)
      this._updateFocusLabel(eq)
      this._highlightEquip(eq)
    },

    flyToEquip3D(eq) {
      // #ifdef H5
      if (!this._camera || !this._controls) return
      const g = this._equip3DMap.get(eq._id)
      if (!g) return
      const pos = new THREE.Vector3(g.position.x, g.position.y + 5, g.position.z + 7)
      const target = new THREE.Vector3(g.position.x, g.position.y + 0.5, g.position.z)
      const startPos = this._camera.position.clone()
      const startTarget = this._controls.target.clone()
      const dur = 800
      const t0 = performance.now()
      const anim = (t) => {
        const p = Math.min((t - t0) / dur, 1)
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
        this._camera.position.lerpVectors(startPos, pos, e)
        this._controls.target.lerpVectors(startTarget, target, e)
        this._controls.update()
        if (p < 1) requestAnimationFrame(anim)
      }
      requestAnimationFrame(anim)
      // #endif
    },

    _updateFocusLabel(eq) {
      // #ifdef H5
      if (!this._scene) return
      if (!eq) {
        if (this._focusInfoLabel) {
          this._focusInfoLabel.visible = false
        }
        return
      }
      const g = this._equip3DMap.get(eq._id)
      if (!g) return

      if (this._focusInfoLabel) {
        this._scene.remove(this._focusInfoLabel)
      }

      const statusInfo = this.mapStatus(eq)
      const statusLabel = this.statusLabels[eq.status] || '未知'
      const statusClass = statusInfo.visualStatus
      const hasImage = Array.isArray(eq.image_url) && eq.image_url.length > 0

      const div = document.createElement('div')
      div.style.background = 'rgba(19,25,38,0.95)'
      div.style.border = '1px solid rgba(59,130,246,0.5)'
      div.style.borderRadius = '10px'
      div.style.padding = '0'
      div.style.minWidth = '200px'
      div.style.backdropFilter = 'blur(8px)'
      div.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)'
      div.style.overflow = 'hidden'
      div.style.display = 'flex'
      div.style.alignItems = 'flex-start'

      // Image thumbnail
      if (hasImage) {
        const imgWrap = document.createElement('div')
        imgWrap.style.width = '60px'
        imgWrap.style.height = '60px'
        imgWrap.style.borderRadius = '0'
        imgWrap.style.background = '#0A0E17'
        imgWrap.style.display = 'flex'
        imgWrap.style.alignItems = 'center'
        imgWrap.style.justifyContent = 'center'
        imgWrap.style.overflow = 'hidden'
        imgWrap.style.cursor = 'pointer'
        imgWrap.style.flexShrink = '0'

        const img = document.createElement('img')
        img.src = eq.image_url[0]
        img.style.width = '100%'
        img.style.height = '100%'
        img.style.objectFit = 'cover'
        img.style.pointerEvents = 'auto'

        imgWrap.addEventListener('click', (e) => {
          e.stopPropagation()
          e.preventDefault()
          const urls = Array.isArray(eq.image_url) ? eq.image_url.filter(Boolean) : []
          if (urls.length) {
            uni.previewImage({ current: urls[0], urls })
          }
        })

        imgWrap.appendChild(img)
        div.appendChild(imgWrap)
      }

      const body = document.createElement('div')
      body.style.padding = '10px 12px 10px ' + (hasImage ? '10px' : '12px')
      body.style.flex = '1'
      body.style.minWidth = '0'

      // Header row: icon + name + status
      const header = document.createElement('div')
      header.style.display = 'flex'
      header.style.alignItems = 'center'
      header.style.gap = '8px'
      header.style.marginBottom = '8px'

      const iconSVG = this.getIconSVG(statusInfo.type3D)
      const iconWrap = document.createElement('div')
      iconWrap.style.width = '28px'
      iconWrap.style.height = '28px'
      iconWrap.style.borderRadius = '6px'
      iconWrap.style.background = 'rgba(59,130,246,0.15)'
      iconWrap.style.display = 'flex'
      iconWrap.style.alignItems = 'center'
      iconWrap.style.justifyContent = 'center'
      iconWrap.style.color = '#3B82F6'
      iconWrap.style.flexShrink = '0'
      iconWrap.innerHTML = iconSVG

      const nameDiv = document.createElement('div')
      nameDiv.textContent = eq.name
      nameDiv.style.color = '#F0F4F8'
      nameDiv.style.fontSize = '13px'
      nameDiv.style.fontWeight = '600'
      nameDiv.style.fontFamily = 'Inter, system-ui, sans-serif'
      nameDiv.style.whiteSpace = 'nowrap'
      nameDiv.style.flex = '1'

      const statusBadge = document.createElement('span')
      statusBadge.textContent = eq._hasAlert ? '告警' : statusLabel
      statusBadge.style.fontSize = '10px'
      statusBadge.style.padding = '1px 6px'
      statusBadge.style.borderRadius = '4px'
      statusBadge.style.fontFamily = 'Inter, system-ui, sans-serif'
      statusBadge.style.whiteSpace = 'nowrap'
      statusBadge.style.flexShrink = '0'
      if (statusClass === 'alarm') {
        statusBadge.style.background = 'rgba(239,68,68,0.2)'
        statusBadge.style.color = '#EF4444'
      } else if (statusClass === 'online') {
        statusBadge.style.background = 'rgba(34,197,94,0.2)'
        statusBadge.style.color = '#22C55E'
      } else if (statusClass === 'maintenance') {
        statusBadge.style.background = 'rgba(245,158,11,0.2)'
        statusBadge.style.color = '#F59E0B'
      } else {
        statusBadge.style.background = 'rgba(107,114,128,0.2)'
        statusBadge.style.color = '#6B7280'
      }

      header.appendChild(iconWrap)
      header.appendChild(nameDiv)
      header.appendChild(statusBadge)

      // Info rows
      const info = document.createElement('div')
      info.style.display = 'flex'
      info.style.flexDirection = 'column'
      info.style.gap = '3px'

      const fields = [
        { label: '编号', value: eq.code || '--' },
        { label: '位置', value: eq.locationName || '--' },
        { label: '部门', value: eq.deptName || '--' }
      ]

      fields.forEach(f => {
        const row = document.createElement('div')
        row.style.display = 'flex'
        row.style.gap = '8px'
        row.style.fontSize = '11px'
        row.style.fontFamily = 'Inter, system-ui, sans-serif'

        const lbl = document.createElement('span')
        lbl.textContent = f.label
        lbl.style.color = '#556677'
        lbl.style.width = '28px'
        lbl.style.flexShrink = '0'

        const val = document.createElement('span')
        val.textContent = f.value
        val.style.color = '#8899AA'

        row.appendChild(lbl)
        row.appendChild(val)
        info.appendChild(row)
      })

      body.appendChild(header)
      body.appendChild(info)
      div.appendChild(body)

      const label = new CSS2DObject(div)
      label.position.copy(g.position)
      label.position.y += 2.5
      label.position.x += 1.5
      this._focusInfoLabel = label
      this._scene.add(label)
      // #endif
    },

    _highlightEquip(eq) {
      // #ifdef H5
      if (!eq) return
      const g = this._equip3DMap.get(eq._id)
      if (!g) return
      this._highlightedGroup = g

      const ud = g.userData
      // Save original values
      ud._origRingOpacity = ud.ringMat.opacity
      ud._origRingEmissive = ud.ringMat.emissiveIntensity
      ud._origGlowOpacity = ud.glowMat.opacity
      ud._origMeshEmissive = ud.meshMat && ud.meshMat.emissive ? ud.meshMat.emissive.getHex() : null

      // Enhance ring
      ud.ringMat.opacity = 1
      ud.ringMat.emissiveIntensity = 1.2
      ud.ringMat.color.set(0xFFD700)
      ud.ringMat.emissive.set(0xFFD700)

      // Enhance glow
      ud.glowMat.opacity = 0.5
      ud.glowMat.color.set(0xFFD700)

      // Highlight mesh
      if (ud.meshMat) {
        if (ud.meshMat.emissive) {
          ud.meshMat.emissive.set(0xFFD700)
          ud.meshMat.emissiveIntensity = 0.6
        } else {
          ud.meshMat.emissive = new THREE.Color(0xFFD700)
          ud.meshMat.emissiveIntensity = 0.6
        }
      }

      // Highlight wireframe
      if (ud.wireframe) {
        ud._origWireOpacity = ud.wireframe.material.opacity
        ud.wireframe.material.opacity = 0.4
        ud.wireframe.material.color.set(0xFFD700)
      }
      // #endif
    },

    _restoreHighlight() {
      // #ifdef H5
      if (!this._highlightedGroup) return
      const ud = this._highlightedGroup.userData

      if (ud._origRingOpacity !== undefined) {
        ud.ringMat.opacity = ud._origRingOpacity
        ud.ringMat.emissiveIntensity = ud._origRingEmissive
        if (ud.statusColor) {
          ud.ringMat.color.set(ud.statusColor)
          ud.ringMat.emissive.set(ud.statusColor)
        }
      }

      if (ud._origGlowOpacity !== undefined) {
        ud.glowMat.opacity = ud._origGlowOpacity
        if (ud.statusColor) {
          ud.glowMat.color.set(ud.statusColor)
        }
      }

      if (ud._origMeshEmissive !== undefined && ud._origMeshEmissive !== null && ud.meshMat) {
        ud.meshMat.emissive.set(ud._origMeshEmissive)
        ud.meshMat.emissiveIntensity = 0
      } else if (ud.meshMat) {
        ud.meshMat.emissive = null
        ud.meshMat.emissiveIntensity = 0
      }

      if (ud.wireframe && ud._origWireOpacity !== undefined) {
        ud.wireframe.material.opacity = ud._origWireOpacity
        ud.wireframe.material.color.set(0xffffff)
      }

      this._highlightedGroup = null
      // #endif
    },

    clear3DHighlight() {
      // Highlight not needed since selection is in sidebar
    },

    // ========== Navigation ==========
    navToDeviceList(status) {
      if (status !== undefined) {
        uni.navigateTo({ url: '/pages/medical-device/list?status=' + status })
      } else {
        uni.navigateTo({ url: '/pages/medical-device/list' })
      }
    },
    navToEdit(id) {
      uni.navigateTo({ url: '/pages/medical-device/edit?id=' + id })
    },
    goBack() {
      uni.redirectTo({ url: '/pages/index/index' })
    },

    // ========== Utils ==========
    formatTime(dateVal) {
      if (!dateVal) return '--'
      try {
        const d = new Date(dateVal)
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
      } catch (e) {
        return '--'
      }
    },

    getIconSVG(type3D) {
      const icons = {
        'CT Scanner': '<circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
        'MRI Machine': '<rect x="6" y="8" width="12" height="8" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
        'Ultrasound': '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5"/>',
        'Ventilator': '<rect x="8" y="5" width="8" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 12h3M15 12h3" stroke="currentColor" stroke-width="1.5"/><path d="M12 5V3" stroke="currentColor" stroke-width="1.5"/>',
        'X-Ray': '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5"/><path d="M10 10l4 4M14 10l-4 4" stroke="currentColor" stroke-width="1.0"/>',
        'Infusion Pump': '<rect x="10" y="4" width="4" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
        'Defibrillator': '<path d="M8 18V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 12h4" stroke="currentColor" stroke-width="2"/>',
        'Patient Monitor': '<rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="8,14 10,10 12,13 14,9 16,12" fill="none" stroke="currentColor" stroke-width="1.5"/>',
        'Dialysis Machine': '<rect x="8" y="5" width="8" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>',
        'Anesthesia Machine': '<rect x="7" y="6" width="10" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 16h4" stroke="currentColor" stroke-width="1.5"/>'
      }
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">' + (icons[type3D] || icons['Patient Monitor']) + '</svg>'
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  --surface-primary: #0A0E17;
  --surface-secondary: #131926;
  --surface-elevated: #1A2332;
  --text-primary: #F0F4F8;
  --text-secondary: #8899AA;
  --text-tertiary: #556677;
  --border-default: #1E293B;
  --accent-primary: #3B82F6;
  --accent-hover: #60A5FA;
  --status-online: #22C55E;
  --status-alarm: #EF4444;
  --status-maintenance: #F59E0B;
  --status-offline: #6B7280;
  --status-online-bg: rgba(34,197,94,0.15);
  --status-alarm-bg: rgba(239,68,68,0.15);
  --status-maintenance-bg: rgba(245,158,11,0.15);
  --status-offline-bg: rgba(107,114,128,0.15);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--surface-primary);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.app-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: 56px 1fr 72px;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* Top Bar */
.topbar {
  grid-column: 1 / -1;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-default);
  z-index: 10;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.hospital-icon svg {
  width: 26px;
  height: 26px;
  color: var(--accent-primary);
}
.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.15s;
  &:hover {
    color: var(--text-primary);
    background: var(--surface-elevated);
  }
  svg {
    width: 18px;
    height: 18px;
  }
}
.hospital-name {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.topbar-center {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 12px;
  border-radius: 8px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-default);
  min-width: 60px;
  cursor: pointer;
  transition: border-color 0.2s;
  &:hover {
    border-color: var(--accent-primary);
  }
}
.kpi-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  font-weight: 600;
}
.kpi-value {
  font-size: 20px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.2;
}
.kpi-value.total { color: var(--text-primary); }
.kpi-value.inuse { color: var(--accent-primary); }
.kpi-value.normal { color: var(--status-online); }
.kpi-value.repair { color: var(--status-maintenance); }
.kpi-value.unused { color: var(--text-tertiary); }

/* Sidebar */
.sidebar {
  grid-column: 1;
  grid-row: 2 / 4;
  background: var(--surface-secondary);
  border-right: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 5;
}
.sidebar-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sidebar-title {
  font-size: 15px;
  font-weight: 600;
}
.sidebar-count {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  background: var(--surface-elevated);
  padding: 2px 10px;
  border-radius: 10px;
}

/* Floor Tabs */
.floor-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-default);
  overflow-x: auto;
  &::-webkit-scrollbar { height: 2px; }
  &::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 1px; }
}
.floor-tab {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: var(--text-tertiary);
  transition: all 0.15s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 5px;
  &:hover { color: var(--text-secondary); background: rgba(255,255,255,0.03); }
  &.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
}
.floor-tab-all {
  margin-left: auto;
  padding: 8px 16px;
  border-bottom-style: dashed;
}
.floor-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sidebar-search {
  padding: 8px 16px;
  input {
    display: block;
    width: 100%;
    height: 32px;
    padding: 0 12px;
    line-height: 32px;
    border-radius: 6px;
    border: 1px solid var(--border-default);
    background: var(--surface-elevated);
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
    &::placeholder { color: var(--text-tertiary); }
    &:focus { border-color: var(--accent-primary); }
  }
}

.equip-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }
}

.status-group-label {
  padding: 8px 16px 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  font-weight: 600;
}

.equip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-left: 3px solid transparent;
  &:hover { background: var(--surface-elevated); }
  &.active { background: var(--surface-elevated); border-left-color: var(--accent-primary); }
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  &.active { background: var(--status-online); box-shadow: 0 0 6px var(--status-online); }
  &.primary { background: var(--accent-primary); box-shadow: 0 0 6px var(--accent-primary); }
  &.alarm { background: var(--status-alarm); box-shadow: 0 0 6px var(--status-alarm); animation: pulse-dot 1s ease-in-out infinite; }
  &.repair { background: var(--status-maintenance); box-shadow: 0 0 6px var(--status-maintenance); }
  &.gray { background: var(--status-offline); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}

.equip-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg {
    width: 16px;
    height: 16px;
    color: var(--text-secondary);
  }
}

.equip-info {
  flex: 1;
  min-width: 0;
}
.equip-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.equip-meta {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.floor-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
  background: rgba(59,130,246,0.15);
  color: var(--accent-primary);
}

.status-badge {
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
  &.active { background: var(--status-online-bg); color: var(--status-online); }
  &.primary { background: rgba(59,130,246,0.15); color: var(--accent-primary); }
  &.alarm { background: var(--status-alarm-bg); color: var(--status-alarm); }
  &.repair { background: var(--status-maintenance-bg); color: var(--status-maintenance); }
  &.gray { background: var(--status-offline-bg); color: var(--status-offline); }
}

.empty-list {
  padding: 40px 16px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

/* Detail Panel */
.detail-panel {
  display: none;
  border-top: 1px solid var(--border-default);
  padding: 16px;
  background: var(--surface-elevated);
  &.visible { display: block; }
}
.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.detail-title {
  font-size: 15px;
  font-weight: 600;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  margin-bottom: 12px;
}
.detail-field {
  .d-label {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-tertiary);
    font-weight: 600;
  }
  .d-value {
    display: block;
    font-size: 13px;
    color: var(--text-primary);
    font-weight: 500;
  }
}
.detail-actions {
  display: flex;
  gap: 8px;
}
.btn-locate-small {
  flex: 1;
  padding: 7px;
  border: 1px solid var(--accent-primary);
  background: transparent;
  color: var(--accent-primary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: var(--accent-primary); color: #fff; }
}
.btn-detail {
  flex: 1;
  padding: 7px;
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--text-secondary); color: var(--text-primary); }
}

/* Scene Area */
.scene-area {
  grid-column: 2;
  grid-row: 2;
  position: relative;
  overflow: hidden;
  background: var(--surface-primary);
}
#scene-container {
  width: 100%;
  height: 100%;
  position: relative;
  canvas { display: block; }
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--surface-primary);
  z-index: 20;
  transition: opacity 0.5s;
  &.hidden { opacity: 0; pointer-events: none; }
}
.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-default);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-overlay text {
  color: var(--text-tertiary);
  font-size: 14px;
}

.display-toggles {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(19,25,38,0.9);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
  z-index: 5;
}
.toggle-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}
.toggle-check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-default);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
  background: transparent;
  transition: all 0.15s ease;
}
.toggle-check.checked {
  background: #3B82F6;
  border-color: #3B82F6;
}
.toggle-sep {
  height: 1px;
  background: var(--border-default);
  margin: 2px 0;
}
.toggle-autofocus {
  margin-top: 2px;
}
.autofocus-check {
  font-size: 8px;
  line-height: 1;
}
.autofocus-check.active {
  background: #F59E0B;
  border-color: #F59E0B;
}

.floor-legend {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(19,25,38,0.9);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 11px;
  z-index: 5;
}
.floor-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  color: var(--text-secondary);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.scene-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--text-tertiary);
  background: rgba(10,14,23,0.8);
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid var(--border-default);
  pointer-events: none;
  white-space: nowrap;
}

/* Alert Bar */
.alertbar {
  grid-column: 2;
  grid-row: 3;
  background: var(--surface-secondary);
  border-top: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 0 16px;
  gap: 12px;
}
.alertbar-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.alert-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status-alarm);
  animation: pulse-dot 1s ease-in-out infinite;
}
.alert-track {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 100%;
}
.alert-scroll {
  display: flex;
  gap: 24px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  animation: scroll-alerts 30s linear infinite;
  &:hover { animation-play-state: paused; }
}
@keyframes scroll-alerts {
  0% { transform: translateY(-50%) translateX(0); }
  100% { transform: translateY(-50%) translateX(-50%); }
}
.alert-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
.alert-type {
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  &.critical { background: var(--status-alarm-bg); color: var(--status-alarm); }
  &.warning { background: var(--status-maintenance-bg); color: var(--status-maintenance); }
  &.info { background: rgba(59,130,246,0.15); color: var(--accent-primary); }
}
.alert-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-tertiary);
}
.alert-sep {
  color: var(--border-default);
}

/* Not Supported Fallback */
.not-supported {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #0A0E17;
  gap: 16px;
}
.not-supported-icon {
  font-size: 48px;
}
.not-supported-title {
  font-size: 20px;
  font-weight: 600;
  color: #F0F4F8;
}
.not-supported-desc {
  font-size: 14px;
  color: #8899AA;
}
.not-supported-hint {
  font-size: 12px;
  color: #556677;
}
</style>
