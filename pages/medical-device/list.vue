<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">医疗设备台账</view>
          <view class="search-box">
            <uni-data-select
              class="search-dept"
              v-model="deptSearchId"
              :localdata="deptOptions"
              placeholder="按部门筛选"
              clear
              @change="search"
            ></uni-data-select>
            <input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="搜索设备编号/名称/品牌/规格型号" />
            <button class="btn-search" size="mini" @click="search">搜索</button>
          </view>
        </view>
        <view class="page-header-right">
          <button class="btn-primary" size="mini" @click="navigateTo('./add')">
            <text class="btn-icon">+</text>
            <text>新增</text>
          </button>
          <button class="btn-danger" size="mini" :disabled="!selectedIndexs.length" @click="delTable">
            <text>批量删除</text>
          </button>
          <button class="btn-import" size="mini" @click="navigateTo('./import')">
            <text>导入</text>
          </button>
          <!-- #ifdef H5 -->
          <download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData"
            :type="exportExcel.type" :name="exportExcel.filename">
            <button class="btn-export" size="mini">导出 Excel</button>
          </download-excel>
          <!-- #endif -->
        </view>
      </view>
      <view class="page-body">
        <unicloud-db ref="udb" collection="medical-device" :where="where" page-data="replace" :orderby="orderby"
          :getcount="true" :page-size="pageSize"
          v-slot:default="{ data, pagination, loading, error, options }" loadtime="manual" @load="onqueryload">
          <uni-table ref="table" :loading="loading" border stripe type="selection"
            :emptyText="error.message || '暂无数据'" @selection-change="selectionChange">
            <uni-tr>
              <uni-th align="center" width="150">设备编号</uni-th>
              <uni-th align="center">设备名称</uni-th>
              <uni-th align="center">设备照片</uni-th>
              <uni-th align="center">品牌</uni-th>
              <uni-th align="center">规格型号</uni-th>
              <uni-th align="center">使用部门</uni-th>
              <uni-th align="center">设备管理类型</uni-th>
              <uni-th align="center">状态</uni-th>
              <uni-th align="center">生产日期</uni-th>
              <uni-th align="center">使用年限</uni-th>
              <uni-th align="center">操作</uni-th>
            </uni-tr>
            <uni-tr v-for="(item, index) in tableData" :key="index">
              <uni-td align="center" width="120">
                <text class="cell-code">{{ item.code }}</text>
              </uni-td>
              <uni-td align="center">
                <view class="device-name-cell">
                  <text class="cell-name">{{ item.name }}</text>
                  <text v-if="item.short_name" class="short-name">({{ item.short_name }})</text>
                </view>
              </uni-td>
              <uni-td align="center">
                <view v-if="item.image_url && item.image_url.length" class="photo-cell">
                  <image class="photo-thumb" :src="getFirstImage(item.image_url)" mode="aspectFill" @click="previewImage(item.image_url, 0)" />
                </view>
                <text v-else class="cell-empty">无照片</text>
              </uni-td>
              <uni-td align="center">{{ item.brand }}</uni-td>
              <uni-td align="center">{{ item.model }}</uni-td>
              <uni-td align="center">{{ item.dept_id_text || '-' }}</uni-td>
              <uni-td align="center">
                <uni-tag :text="getManagementTypeText(item.management_type)" :type="getManagementTypeType(item.management_type)" size="small" />
              </uni-td>
              <uni-td align="center">
                <uni-tag :text="getStatusText(item.status)" :type="getStatusType(item.status)" size="small" />
              </uni-td>
              <uni-td align="center">{{ item.manufacture_date || '-' }}</uni-td>
              <uni-td align="center">{{ item.service_life ? item.service_life + '年' : '-' }}</uni-td>
              <uni-td align="center">
                <view class="action-group">
                  <button @click="showDetail(item._id)" class="btn-action btn-action-view" size="mini">查看</button>
                  <button @click="navigateTo('./edit?id=' + item._id, false)" class="btn-action btn-action-edit" size="mini">编辑</button>
                  <button @click="confirmDelete(item._id)" class="btn-action btn-action-delete" size="mini">删除</button>
                </view>
              </uni-td>
            </uni-tr>
          </uni-table>
          <view class="pagination-box">
            <uni-pagination show-icon show-page-size :page-size="pagination.size" v-model="pagination.current"
              :total="pagination.count" @change="onPageChanged" @pageSizeChange="changeSize" />
          </view>
        </unicloud-db>
      </view>
    </view>

    <uni-popup ref="detailPopup" type="center" background-color="#fff">
      <view class="detail-popup" v-if="detailData">
        <view class="detail-header">
          <text class="detail-title">设备详情</text>
          <uni-icons type="closeempty" size="20" color="#64748b" @click="closeDetail"></uni-icons>
        </view>
        <scroll-view class="detail-body" scroll-y>
          <view class="detail-section">
            <view class="detail-field" v-if="detailData.image_url && detailData.image_url.length">
              <text class="detail-label">设备照片</text>
              <view class="detail-photos">
                <image v-for="(url, i) in detailData.image_url" :key="i" class="detail-photo" :src="url" mode="aspectFill" @click="previewImage(detailData.image_url, i)" />
              </view>
            </view>
            <view class="detail-field">
              <text class="detail-label">设备编号</text>
              <text class="detail-value">{{ detailData.code }}</text>
            </view>
            <view class="detail-field">
              <text class="detail-label">设备名称</text>
              <text class="detail-value">{{ detailData.name }}</text>
            </view>
            <view class="detail-field" v-if="detailData.short_name">
              <text class="detail-label">设备简称</text>
              <text class="detail-value">{{ detailData.short_name }}</text>
            </view>
            <view class="detail-field">
              <text class="detail-label">品牌</text>
              <text class="detail-value">{{ detailData.brand || '-' }}</text>
            </view>
            <view class="detail-field">
              <text class="detail-label">规格型号</text>
              <text class="detail-value">{{ detailData.model || '-' }}</text>
            </view>
            <view class="detail-field" v-if="detailData.manufacturer">
              <text class="detail-label">生产厂家</text>
              <text class="detail-value">{{ detailData.manufacturer }}</text>
            </view>
            <view class="detail-field" v-if="detailData.serial_no">
              <text class="detail-label">产品编号</text>
              <text class="detail-value">{{ detailData.serial_no }}</text>
            </view>
            <view class="detail-field">
              <text class="detail-label">使用部门</text>
              <text class="detail-value">{{ detailData.dept_id_text || '-' }}</text>
            </view>
            <view class="detail-field" v-if="detailData.location_id_text">
              <text class="detail-label">存放位置</text>
              <text class="detail-value">{{ detailData.location_id_text }}</text>
            </view>
            <view class="detail-field" v-if="detailData.person_in_charge">
              <text class="detail-label">设备负责人</text>
              <text class="detail-value">{{ detailData.person_in_charge }}</text>
            </view>
            <view class="detail-field">
              <text class="detail-label">设备管理类型</text>
              <uni-tag :text="getManagementTypeText(detailData.management_type)" :type="getManagementTypeType(detailData.management_type)" size="small" />
            </view>
            <view class="detail-field">
              <text class="detail-label">状态</text>
              <uni-tag :text="getStatusText(detailData.status)" :type="getStatusType(detailData.status)" size="small" />
            </view>
            <view class="detail-field" v-if="detailData.applicable_scope">
              <text class="detail-label">适用范围</text>
              <text class="detail-value">{{ detailData.applicable_scope }}</text>
            </view>
            <view class="detail-field" v-if="detailData.manufacture_date">
              <text class="detail-label">生产日期</text>
              <text class="detail-value">{{ formatDate(detailData.manufacture_date) }}</text>
            </view>
            <view class="detail-field" v-if="detailData.service_life">
              <text class="detail-label">使用年限</text>
              <text class="detail-value">{{ detailData.service_life }}年</text>
            </view>
            <view class="detail-field" v-if="detailData.acceptance_date">
              <text class="detail-label">验收日期</text>
              <text class="detail-value">{{ formatDate(detailData.acceptance_date) }}</text>
            </view>
            <view class="detail-field" v-if="detailData.warranty_years">
              <text class="detail-label">保修年限</text>
              <text class="detail-value">{{ detailData.warranty_years }}年</text>
            </view>
            <view class="detail-field" v-if="detailData.purchase_date">
              <text class="detail-label">采购日期</text>
              <text class="detail-value">{{ formatDate(detailData.purchase_date) }}</text>
            </view>
            <view class="detail-field" v-if="detailData.purchase_amount">
              <text class="detail-label">采购金额</text>
              <text class="detail-value">{{ detailData.purchase_amount }}</text>
            </view>
            <view class="detail-field" v-if="detailData.supplier">
              <text class="detail-label">供应商</text>
              <text class="detail-value">{{ detailData.supplier }}</text>
            </view>
            <view class="detail-field" v-if="detailData.warranty_end">
              <text class="detail-label">保修截止</text>
              <text class="detail-value">{{ formatDate(detailData.warranty_end) }}</text>
            </view>
            <view class="detail-field" v-if="detailData.remark">
              <text class="detail-label">备注</text>
              <text class="detail-value">{{ detailData.remark }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command
const dbCollectionName = 'medical-device'
const dbSearchFields = ['code', 'name', 'short_name', 'brand', 'model', 'manufacturer', 'serial_no', 'service_life']

export default {
  data() {
    return {
      query: '',
      deptSearchId: '',
      deptOptions: [],
      where: 'deleted == 0',
      orderby: 'created_at desc',
      selectedIndexs: [],
      tableData: [],
      pageSize: 20,
      statusMap: {
        1: { text: '正常', type: 'success' },
        2: { text: '使用中', type: 'primary' },
        3: { text: '维修中', type: 'warning' },
        4: { text: '报废', type: 'error' },
        5: { text: '未投入', type: 'default' },
        6: { text: '其他', type: 'info' }
      },
      managementTypeMap: {
        1: { text: '一类', type: 'primary' },
        2: { text: '二类', type: 'success' },
        3: { text: '三类', type: 'warning' },
        4: { text: '非医疗器械', type: 'default' }
      },
      exportExcel: {
        filename: 'medical-device.xls',
        type: 'xls',
        fields: {
          '设备编号': 'code',
          '设备名称': 'name',
          '设备简称': 'short_name',
          '品牌': 'brand',
          '规格型号': 'model',
          '厂家': 'manufacturer',
          '使用部门': 'dept_id_text',
          '存放位置': 'location_id_text',
          '设备管理类型': 'management_type_text',
          '使用状态': 'status_text',
          '设备负责人': 'person_in_charge',
          '产品编号': 'serial_no',
          '注册证号/备案号': 'spec',
          '采购日期': 'purchase_date',
          '采购金额': 'purchase_amount',
          '供应商': 'supplier',
          '保修截止': 'warranty_end',
          '设备适用范围': 'applicable_scope',
          '生产日期': 'manufacture_date',
          '使用年限': 'service_life',
          '验收日期': 'acceptance_date',
          '保修年限': 'warranty_years',
          '备注': 'remark'
        }
      },
      exportExcelData: [],
      detailData: null
    }
  },
  onReady() {
    this.loadDeptOptions()
    this.$refs.udb.loadData()
  },
  methods: {
    async onqueryload(data) {
      this.selectedIndexs = []
      this.tableData = []
      if (data && data.length) {
        const deptIds = [...new Set(data.map(item => item.dept_id).filter(Boolean))]
        const locationIds = [...new Set(data.map(item => item.location_id).filter(Boolean))]

        const promises = []
        let deptMap = {}
        let locationMap = {}

        if (deptIds.length) {
          promises.push(
            db.collection('opendb-department').where({ _id: dbCmd.in(deptIds) }).get().then(res => {
              deptMap = Object.fromEntries((res.result.data || []).map(item => [item._id, item.name]))
            })
          )
        }
        if (locationIds.length) {
          promises.push(
            db.collection('medical-device-location').where({ _id: dbCmd.in(locationIds) }).get().then(res => {
              locationMap = Object.fromEntries((res.result.data || []).map(item => [item._id, item.name]))
            })
          )
        }

        await Promise.all(promises)

        this.tableData = data.map(item => ({
          ...item,
          dept_id_text: deptMap[item.dept_id] || '',
          location_id_text: locationMap[item.location_id] || '',
          manufacture_date: item.manufacture_date ? this.formatDate(item.manufacture_date) : '-',
          acceptance_date: item.acceptance_date ? this.formatDate(item.acceptance_date) : '-'
        }))

        this.exportExcelData = this.tableData.map(item => ({
          ...item,
          management_type_text: this.getManagementTypeText(item.management_type),
          status_text: this.getStatusText(item.status),
          purchase_date: item.purchase_date ? this.formatDate(item.purchase_date) : '',
          warranty_end: item.warranty_end ? this.formatDate(item.warranty_end) : '',
          manufacture_date: item.manufacture_date ? this.formatDate(item.manufacture_date) : '',
          acceptance_date: item.acceptance_date ? this.formatDate(item.acceptance_date) : ''
        }))
      }
    },
    loadData(clear = true) {
      this.$refs.udb.loadData({ clear })
    },
    getStatusText(status) {
      return this.statusMap[status]?.text || '未知'
    },
    getStatusType(status) {
      return this.statusMap[status]?.type || 'default'
    },
    getManagementTypeText(type) {
      return this.managementTypeMap[type]?.text || '未知'
    },
    getManagementTypeType(type) {
      return this.managementTypeMap[type]?.type || 'default'
    },
    formatDate(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    },
    onPageChanged(e) {
      this.selectedIndexs = []
      this.$refs.table.clearSelection()
      this.$refs.udb.loadData({ current: e.current })
    },
    changeSize(e) {
      this.pageSize = e.size
      this.$nextTick(() => this.loadData())
    },
    navigateTo(url, clear) {
      uni.navigateTo({
        url,
        events: {
          refreshData: () => this.loadData(clear)
        }
      })
    },
    selectionChange(e) {
      this.selectedIndexs = e.detail.index
    },
    selectedItems() {
      return this.selectedIndexs.map(i => this.tableData[i]._id)
    },
    async delTable() {
      const ids = this.selectedItems()
      const repairRes = await db.collection('medical-device-repair-request').where({
        device_id: dbCmd.in(ids),
        deleted: 0
      }).get()
      const repairDeviceIds = [...new Set(repairRes.result.data.map(r => r.device_id).filter(Boolean))]
      if (repairDeviceIds.length > 0) {
        const deviceRes = await db.collection('medical-device').where({ _id: dbCmd.in(repairDeviceIds) }).get()
        const names = deviceRes.result.data.map(d => d.name).join('、')
        uni.showModal({
          title: '无法删除',
          content: `设备「${names}」存在报修记录，请先删除报修记录后再删除设备`,
          showCancel: false
        })
        return
      }
      uni.showModal({
        title: '提示',
        content: `确定删除选中的 ${ids.length} 条记录吗？`,
        success: (res) => {
          if (res.confirm) {
            db.collection(dbCollectionName).where({
              _id: dbCmd.in(ids)
            }).update({
              deleted: 1,
              updated_at: Date.now()
            }).then(() => {
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.selectedIndexs = []
              this.loadData()
            })
          }
        }
      })
    },
    async loadDeptOptions() {
      const res = await db.collection('opendb-department').get()
      this.deptOptions = (res.result.data || []).map(item => ({
        value: item._id,
        text: item.name
      }))
    },
    getWhere() {
      const conditions = ['deleted == 0']
      const query = this.query.trim()
      if (query) {
        const queryRe = new RegExp(query, 'i')
        const searchOr = dbSearchFields.map(name => queryRe + '.test(' + name + ')').join(' || ')
        conditions.push(`(${searchOr})`)
      }
      if (this.deptSearchId) {
        conditions.push(`dept_id == "${this.deptSearchId}"`)
      }
      return conditions.join(' && ')
    },
    search() {
      this.where = this.getWhere()
      this.$nextTick(() => {
        this.loadData()
      })
    },
    confirmDelete(id) {
      uni.showModal({
        title: '提示',
        content: '确定删除该设备吗？',
        success: (res) => {
          if (res.confirm) {
            db.collection(dbCollectionName).doc(id).update({
              deleted: 1,
              updated_at: Date.now()
            }).then(() => {
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.loadData()
            })
          }
        }
      })
    },
    getFirstImage(image_url) {
      if (Array.isArray(image_url) && image_url.length) {
        return image_url[0]
      }
      return ''
    },
    previewImage(image_url, index) {
      if (Array.isArray(image_url) && image_url.length) {
        uni.previewImage({
          urls: image_url,
          current: index || 0
        })
      }
    },
    async showDetail(id) {
      uni.showLoading({ mask: true })
      try {
        const res = await db.collection(dbCollectionName).doc(id).get()
        const data = res.result.data[0]
        if (data) {
          if (data.image_url && typeof data.image_url === 'string') {
            data.image_url = data.image_url ? [data.image_url] : []
          }
          if (data.dept_id) {
            const deptRes = await db.collection('opendb-department').doc(data.dept_id).get()
            data.dept_id_text = deptRes.result.data[0]?.name || ''
          }
          if (data.location_id) {
            const locRes = await db.collection('medical-device-location').doc(data.location_id).get()
            data.location_id_text = locRes.result.data[0]?.name || ''
          }
          this.detailData = data
          this.$refs.detailPopup.open()
        }
      } catch (err) {
        uni.showModal({ content: err.message || '获取详情失败', showCancel: false })
      } finally {
        uni.hideLoading()
      }
    },
    closeDetail() {
      this.$refs.detailPopup.close()
    }
  }
}
</script>

<style lang="scss" scoped>
$primary: #6366f1;
$primary-light: #eef2ff;
$success: #10b981;
$success-light: #ecfdf5;
$danger: #ef4444;
$danger-light: #fef2f2;
$text: #1e293b;
$text-secondary: #64748b;
$border: #e2e8f0;
$bg-hover: #f8fafc;

.page-wrapper {
  padding: 20px;
  min-height: 100%;
  box-sizing: border-box;
}

.page-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid $border;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-dept {
  width: 150px;

  :deep(.uni-data-select-input) {
    height: 32px;
    border: 1.5px solid $border;
    border-radius: 8px;
    font-size: 13px;
  }
}

.uni-search {
  height: 32px;
  padding: 0 12px;
  border: 1.5px solid $border;
  border-radius: 8px;
  font-size: 13px;
  color: $text;
  outline: none;
  width: 220px;
  transition: border-color 0.15s ease;

  &:focus {
    border-color: $primary;
  }

  &::placeholder {
    color: #94a3b8;
  }
}

.btn-search {
  background: $primary-light;
  border: none;
  color: $primary;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover {
    background: darken($primary-light, 5%);
    transform: translateY(-1px);
  }
}

.breadcrumb {
  :deep(.uni-stat-breadcrumb) {
    font-size: 13px;
  }
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: $text;
  letter-spacing: -0.02em;
}

.page-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: $primary;
  border: none;
  color: #fff;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;

  &:hover {
    background: darken($primary, 8%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba($primary, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-icon {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.btn-import {
  background: #fff;
  border: 1.5px solid $border;
  color: $success;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover {
    border-color: $success;
    background: $success-light;
    transform: translateY(-1px);
  }
}

.btn-export {
  background: #fff;
  border: 1.5px solid $border;
  color: $primary;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover {
    border-color: $primary;
    background: $primary-light;
    transform: translateY(-1px);
  }
}

.btn-danger {
  background: #fff;
  border: 1.5px solid $border;
  color: $danger;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: $danger;
    background: $danger-light;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.page-body {
  padding: 0;
}

.cell-code {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  color: $text-secondary;
}

.device-name-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.5;

  .cell-name {
    font-weight: 500;
    color: $text;
  }

  .short-name {
    font-size: 12px;
    color: #94a3b8;
  }
}

.cell-empty {
  color: #cbd5e1;
}

.action-group {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.btn-action {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 2;
  transition: all 0.15s ease;
}

.btn-action-edit {
  background: $primary-light;
  border: none;
  color: $primary;

  &:hover {
    background: darken($primary-light, 5%);
    transform: translateY(-1px);
  }
}

.btn-action-delete {
  background: $danger-light;
  border: none;
  color: $danger;

  &:hover {
    background: darken($danger-light, 5%);
    transform: translateY(-1px);
  }
}

.pagination-box {
  display: flex;
  justify-content: center;
  padding: 16px 24px;
  border-top: 1px solid $border;
}

.photo-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.photo-thumb {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  cursor: pointer;
  object-fit: cover;
  border: 1px solid $border;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.1);
  }
}

.btn-action-view {
  background: $success-light;
  border: none;
  color: $success;

  &:hover {
    background: darken($success-light, 5%);
    transform: translateY(-1px);
  }
}

.detail-popup {
  width: 520px;
  max-height: 80vh;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid $border;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: $text;
}

.detail-body {
  padding: 16px 24px 24px;
  max-height: 60vh;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-field {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.detail-label {
  min-width: 80px;
  font-size: 13px;
  color: $text-secondary;
  flex-shrink: 0;
  line-height: 1.6;
}

.detail-value {
  font-size: 13px;
  color: $text;
  line-height: 1.6;
  word-break: break-all;
}

.detail-photos {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-photo {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  cursor: pointer;
  object-fit: cover;
  border: 1px solid $border;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.05);
  }
}
</style>
