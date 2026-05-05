<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">报警提醒 <text v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</text></view>
        </view>
        <view class="page-header-right">
          <button class="btn-primary" size="mini" @click="navigateTo('./add')">
            <text class="btn-icon">+</text>
            <text>新增</text>
          </button>
          <button class="btn-read-all" size="mini" :disabled="!unreadCount" @click="markAllRead">全部标记已读</button>
          <button class="btn-danger" size="mini" :disabled="!selectedIndexs.length" @click="delTable">批量删除</button>
        </view>
      </view>
      <view class="page-body">
        <unicloud-db ref="udb" collection="medical-device-alert" :where="where" page-data="replace" :orderby="orderby"
          :getcount="true" :page-size="pageSize"
          v-slot:default="{ data, pagination, loading, error, options }" loadtime="manual" @load="onqueryload">
          <uni-table ref="table" :loading="loading" border stripe type="selection"
            :emptyText="error.message || '暂无数据'" @selection-change="selectionChange">
            <uni-tr>
              <uni-th align="center">设备名称</uni-th>
              <uni-th align="center">提醒类型</uni-th>
              <uni-th align="center">提醒标题</uni-th>
              <uni-th align="center">提醒日期</uni-th>
              <uni-th align="center">已读</uni-th>
              <uni-th align="center">操作</uni-th>
            </uni-tr>
            <uni-tr v-for="(item, index) in tableData" :key="index">
              <uni-td align="center">{{ item.device_id_text || '-' }}</uni-td>
              <uni-td align="center">{{ item.alert_type_text || '-' }}</uni-td>
              <uni-td align="center" class="td-ellipsis" :title="item.title">{{ item.title || '-' }}</uni-td>
              <uni-td align="center">{{ item.alert_date_text || '-' }}</uni-td>
              <uni-td align="center">
                <uni-tag :type="item.is_read ? 'success' : 'warning'" :text="item.is_read ? '已读' : '未读'" size="small" />
              </uni-td>
              <uni-td align="center">
                <view class="action-group">
                  <button v-if="!item.is_read" @click="markAsRead(item._id)" class="btn-action btn-action-read" size="mini">标记已读</button>
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
const dbCollectionName = 'medical-device-alert'

export default {
  data() {
    return {
      where: { deleted: 0 },
      orderby: 'alert_date desc',
      selectedIndexs: [],
      pageSize: 20,
      tableData: [],
      unreadCount: 0
    }
  },
  onReady() {
    this.$refs.udb.loadData()
    this.loadUnreadCount()
  },
  methods: {
    async onqueryload(data) {
      this.selectedIndexs = []
      const deviceIds = [...new Set(data.map(i => i.device_id).filter(Boolean))]
      const deviceMap = {}
      if (deviceIds.length) {
        const deviceRes = await db.collection('medical-device').where({ _id: dbCmd.in(deviceIds) }).get()
        deviceRes.result.data.forEach(d => { deviceMap[d._id] = d.name })
      }
      this.tableData = data.map(item => ({
        ...item,
        device_id_text: deviceMap[item.device_id] || '-',
        alert_type_text: { 1: '保养到期', 2: '校验到期', 3: '维修提醒', 4: '其他' }[item.alert_type] || '-',
        alert_date_text: item.alert_date ? new Date(item.alert_date).toLocaleDateString('zh-CN') : '-'
      }))
    },
    loadData(clear = true) { this.$refs.udb.loadData({ clear }) },
    onPageChanged(e) {
      this.selectedIndexs = []
      this.$refs.table.clearSelection()
      this.$refs.udb.loadData({ current: e.current })
    },
    changeSize(e) { this.pageSize = e.size; this.$nextTick(() => this.loadData()) },
    navigateTo(url, clear) {
      uni.navigateTo({ url, events: { refreshData: () => this.loadData(clear) } })
    },
    selectionChange(e) { this.selectedIndexs = e.detail.index },
    selectedItems() { return this.selectedIndexs.map(i => this.$refs.udb.dataList[i]._id) },
    delTable() {
      const ids = this.selectedItems()
      uni.showModal({
        title: '提示',
        content: `确定删除选中的 ${ids.length} 条记录吗？`,
        success: (res) => {
          if (res.confirm) {
            db.collection(dbCollectionName).where({ _id: dbCmd.in(ids) }).update({ deleted: 1, updated_at: Date.now() }).then(() => {
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.selectedIndexs = []
              this.loadData()
            })
          }
        }
      })
    },
    async loadUnreadCount() {
      try {
        const res = await db.collection(dbCollectionName).where({ deleted: 0, is_read: 0 }).count()
        this.unreadCount = res.result.total || 0
      } catch (e) {}
    },
    markAllRead() {
      uni.showModal({
        title: '提示',
        content: `确定将所有 ${this.unreadCount} 条未读提醒标记为已读吗？`,
        success: (res) => {
          if (res.confirm) {
            db.collection(dbCollectionName).where({ deleted: 0, is_read: 0 }).update({ is_read: 1, read_date: Date.now(), updated_at: Date.now() }).then(() => {
              uni.showToast({ title: '全部标记为已读', icon: 'success' })
              this.unreadCount = 0
              this.loadData()
            }).catch((err) => {
              uni.showModal({ content: err.message || '操作失败', showCancel: false })
            })
          }
        }
      })
    },
    markAsRead(id) {
      db.collection(dbCollectionName).doc(id).update({ is_read: 1, read_date: Date.now(), updated_at: Date.now() }).then(() => {
        uni.showToast({ title: '已标记为已读', icon: 'success' })
        this.unreadCount = Math.max(0, this.unreadCount - 1)
        this.loadData()
      }).catch((err) => {
        uni.showModal({ content: err.message || '操作失败', showCancel: false })
      })
    },
    confirmDelete(id) {
      uni.showModal({
        title: '提示',
        content: '确定删除该提醒吗？',
        success: (res) => {
          if (res.confirm) {
            db.collection(dbCollectionName).doc(id).update({ deleted: 1, updated_at: Date.now() }).then(() => {
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
$danger: #ef4444;
$danger-light: #fef2f2;
$text: #1e293b;
$border: #e2e8f0;

.page-wrapper { padding: 20px; min-height: 100%; box-sizing: border-box; }
.page-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04); overflow: hidden; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid $border; flex-wrap: wrap; gap: 12px; }
.page-header-left { display: flex; align-items: center; gap: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: $text; letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px; }
.unread-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; background: #ef4444; color: #fff; border-radius: 10px; font-size: 11px; font-weight: 600; line-height: 1; }
.page-header-right { display: flex; align-items: center; gap: 8px; }
.btn-primary { background: $primary; border: none; color: #fff; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s ease; &:hover { background: darken($primary, 8%); transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba($primary, 0.3); } }
.btn-icon { font-size: 16px; font-weight: 700; line-height: 1; }
.btn-read-all { background: #fff; border: 1.5px solid $border; color: #ca8a04; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; transition: all 0.15s ease; &:hover:not(:disabled) { border-color: #ca8a04; background: #fefce8; transform: translateY(-1px); } &:disabled { opacity: 0.4; cursor: not-allowed; } }
.btn-danger { background: #fff; border: 1.5px solid $border; color: $danger; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; transition: all 0.15s ease; &:hover:not(:disabled) { border-color: $danger; background: $danger-light; transform: translateY(-1px); } &:disabled { opacity: 0.4; cursor: not-allowed; } }
.page-body { padding: 0; }
.action-group { display: flex; gap: 6px; justify-content: center; }
.btn-action { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; line-height: 2; transition: all 0.15s ease; }
.btn-action-read { background: #fefce8; border: none; color: #ca8a04; &:hover { background: darken(#fefce8, 5%); transform: translateY(-1px); } }
.btn-action-edit { background: #eef2ff; border: none; color: $primary; &:hover { background: darken(#eef2ff, 5%); transform: translateY(-1px); } }
.btn-action-delete { background: $danger-light; border: none; color: $danger; &:hover { background: darken($danger-light, 5%); transform: translateY(-1px); } }
.pagination-box { display: flex; justify-content: center; padding: 16px 24px; border-top: 1px solid $border; }
.td-ellipsis { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
