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
              <uni-th align="center">品牌</uni-th>
              <uni-th align="center">规格型号</uni-th>
              <uni-th align="center">设备分类</uni-th>
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
              <uni-td align="center">{{ item.brand }}</uni-td>
              <uni-td align="center">{{ item.model }}</uni-td>
              <uni-td align="center">
                <uni-tag v-if="item.category_id_text" :text="item.category_id_text" type="primary" inverted size="small" />
                <text v-else class="cell-empty">-</text>
              </uni-td>
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
          '设备分类': 'category_id_text',
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
          '备注': 'remark'
        }
      },
      exportExcelData: []
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
        const categoryIds = [...new Set(data.map(item => item.category_id).filter(Boolean))]
        const deptIds = [...new Set(data.map(item => item.dept_id).filter(Boolean))]
        const locationIds = [...new Set(data.map(item => item.location_id).filter(Boolean))]

        const promises = []
        let categoryMap = {}
        let deptMap = {}
        let locationMap = {}

        if (categoryIds.length) {
          promises.push(
            db.collection('medical-device-category').where({ _id: dbCmd.in(categoryIds) }).get().then(res => {
              categoryMap = Object.fromEntries((res.result.data || []).map(item => [item._id, item.name]))
            })
          )
        }
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
          category_id_text: categoryMap[item.category_id] || '',
          dept_id_text: deptMap[item.dept_id] || '',
          location_id_text: locationMap[item.location_id] || '',
          manufacture_date: item.manufacture_date ? this.formatDate(item.manufacture_date) : '-'
        }))

        this.exportExcelData = this.tableData.map(item => ({
          ...item,
          management_type_text: this.getManagementTypeText(item.management_type),
          status_text: this.getStatusText(item.status),
          purchase_date: item.purchase_date ? this.formatDate(item.purchase_date) : '',
          warranty_end: item.warranty_end ? this.formatDate(item.warranty_end) : '',
          manufacture_date: item.manufacture_date ? this.formatDate(item.manufacture_date) : ''
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
    delTable() {
      const ids = this.selectedItems()
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
</style>
