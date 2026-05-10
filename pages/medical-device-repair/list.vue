<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">设备维修</view>
        </view>
        <view class="page-header-right"></view>
      </view>
      <view class="page-body">
        <unicloud-db ref="udb" collection="medical-device-repair-request" :where="where" page-data="replace" :orderby="orderby"
          :getcount="true" :page-size="pageSize"
          v-slot:default="{ data, pagination, loading, error, options }" loadtime="manual" @load="onqueryload">
          <uni-table ref="table" :loading="loading" border stripe
            :emptyText="error.message || '暂无数据'">
            <uni-tr>
              <uni-th align="center">设备名称</uni-th>
              <uni-th align="center">报修人</uni-th>
              <uni-th align="center">报修日期</uni-th>
              <uni-th align="center">紧急程度</uni-th>
              <uni-th align="center">故障描述</uni-th>
              <uni-th align="center">处理状态</uni-th>
              <uni-th align="center">操作</uni-th>
            </uni-tr>
            <uni-tr v-for="(item, index) in tableData" :key="index">
              <uni-td align="center">{{ item.device_id_text || '-' }}</uni-td>
              <uni-td align="center">{{ item.requester || '-' }}</uni-td>
              <uni-td align="center">{{ item.request_date_text || '-' }}</uni-td>
              <uni-td align="center">
                <uni-tag :type="urgencyTag(item.urgency)" :text="urgencyText(item.urgency)" size="small" />
              </uni-td>
              <uni-td align="center" class="td-ellipsis" :title="item.fault_description">{{ item.fault_description || '-' }}</uni-td>
              <uni-td align="center">
                <uni-tag :type="statusTag(item.status)" :text="statusText(item.status)" size="small" />
              </uni-td>
              <uni-td align="center">
                <view class="action-group">
                  <button v-if="item.status === 1 || item.status === 2" @click="goRepair(item)" class="btn-action btn-action-repair" size="mini">去维修</button>
                  <button v-if="item.status !== 1" @click="goEdit(item)" class="btn-action btn-action-edit" size="mini">编辑</button>
                  <button v-if="item.status !== 1" @click="confirmDelete(item)" class="btn-action btn-action-delete" size="mini">删除</button>
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

export default {
  data() {
    return {
      where: { deleted: 0 },
      orderby: 'request_date desc',
      pageSize: 20,
      tableData: []
    }
  },
  onReady() {
    this.$refs.udb.loadData()
  },
  methods: {
    async onqueryload(data) {
      const deviceIds = [...new Set(data.map(i => i.device_id).filter(Boolean))]
      const deviceMap = {}
      if (deviceIds.length) {
        const deviceRes = await db.collection('medical-device').where({ _id: dbCmd.in(deviceIds) }).get()
        deviceRes.result.data.forEach(d => { deviceMap[d._id] = d.name })
      }
      this.tableData = data.map(item => ({
        ...item,
        device_id_text: deviceMap[item.device_id] || '-',
        request_date_text: item.request_date ? new Date(item.request_date).toLocaleDateString('zh-CN') : '-'
      }))
    },
    loadData(clear = true) {
      this.$refs.udb.loadData({ clear })
    },
    onPageChanged(e) {
      this.$refs.udb.loadData({ current: e.current })
    },
    changeSize(e) {
      this.pageSize = e.size
      this.$nextTick(() => this.loadData())
    },
    goRepair(item) {
      uni.navigateTo({
        url: './add?device_id=' + item.device_id + '&fault_description=' + encodeURIComponent(item.fault_description) + '&repair_request_id=' + item._id,
        events: {
          refreshData: () => this.loadData()
        }
      })
    },
    async goEdit(item) {
      const res = await db.collection('medical-device-repair').where({
        repair_request_id: item._id,
        deleted: 0
      }).get()
      const record = res.result.data[0]
      if (!record) {
        uni.showToast({ title: '暂无维修记录', icon: 'none' })
        return
      }
      uni.navigateTo({
        url: './edit?id=' + record._id,
        events: {
          refreshData: () => this.loadData()
        }
      })
    },
    urgencyText(val) {
      return { 1: '一般', 2: '紧急', 3: '非常紧急' }[val] || '-'
    },
    urgencyTag(val) {
      return { 1: 'info', 2: 'warning', 3: 'error' }[val] || 'default'
    },
    statusText(val) {
      return { 1: '待处理', 2: '处理中', 3: '已完成', 4: '已关闭' }[val] || '-'
    },
    statusTag(val) {
      return { 1: 'warning', 2: 'primary', 3: 'success', 4: 'info' }[val] || 'default'
    },
    confirmDelete(item) {
      uni.showModal({
        title: '提示',
        content: '确定删除该报修单的维修记录吗？删除后报修单将恢复为待处理状态',
        success: async (res) => {
          if (res.confirm) {
            try {
              await db.collection('medical-device-repair').where({
                repair_request_id: item._id,
                deleted: 0
              }).update({ deleted: 1, updated_at: Date.now() })
              await db.collection('medical-device-repair-request').doc(item._id).update({
                status: 1,
                updated_at: Date.now()
              })
              if (item.device_id) {
                await db.collection('medical-device').doc(item.device_id).update({
                  status: 3,
                  updated_at: Date.now()
                })
              }
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.loadData()
            } catch (err) {
              uni.showModal({ content: err.message || '操作失败', showCancel: false })
            }
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
.page-title { font-size: 18px; font-weight: 600; color: $text; letter-spacing: -0.02em; }
.page-header-right { display: flex; align-items: center; gap: 8px; }
.page-body { padding: 0; }
.action-group { display: flex; gap: 6px; justify-content: center; }
.btn-action { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; line-height: 2; transition: all 0.15s ease; }
.btn-action-repair { background: #ecfdf5; border: none; color: #10b981; &:hover { background: darken(#ecfdf5, 5%); transform: translateY(-1px); } }
.btn-action-edit { background: #eef2ff; border: none; color: $primary; &:hover { background: darken(#eef2ff, 5%); transform: translateY(-1px); } }
.btn-action-delete { background: $danger-light; border: none; color: $danger; &:hover { background: darken($danger-light, 5%); transform: translateY(-1px); } }
.pagination-box { display: flex; justify-content: center; padding: 16px 24px; border-top: 1px solid $border; }
.td-ellipsis { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
