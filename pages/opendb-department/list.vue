<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">使用部门</view>
        </view>
        <view class="page-header-right">
          <button class="btn-primary" size="mini" @click="navigateTo('./add')">
            <text class="btn-icon">+</text>
            <text>新增</text>
          </button>
          <button class="btn-danger" size="mini" :disabled="!selectedIndexs.length" @click="delTable">
            <text>批量删除</text>
          </button>
        </view>
      </view>
      <view class="page-body">
        <unicloud-db ref="udb" collection="opendb-department" page-data="replace" :orderby="orderby"
          :getcount="true" :page-size="pageSize"
          v-slot:default="{ data, pagination, loading, error, options }" loadtime="manual" @load="onqueryload">
          <uni-table ref="table" :loading="loading" border stripe type="selection"
            :emptyText="error.message || '暂无数据'" @selection-change="selectionChange">
            <uni-tr>
              <uni-th align="center">部门名称</uni-th>
              <uni-th align="center">显示顺序</uni-th>
              <uni-th align="center">操作</uni-th>
            </uni-tr>
            <uni-tr v-for="(item, index) in data" :key="index">
              <uni-td align="center">
                <text class="cell-name">{{ item.name }}</text>
              </uni-td>
              <uni-td align="center">
                <text class="cell-sort">{{ item.sort || '-' }}</text>
              </uni-td>
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
const dbCollectionName = 'opendb-department'

export default {
  data() {
    return {
      orderby: 'sort asc',
      selectedIndexs: [],
      pageSize: 20
    }
  },
  onReady() {
    this.$refs.udb.loadData()
  },
  methods: {
    onqueryload() {
      this.selectedIndexs = []
    },
    loadData(clear = true) {
      this.$refs.udb.loadData({ clear })
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
      return this.selectedIndexs.map(i => this.$refs.udb.dataList[i]._id)
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
            }).remove().then(() => {
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.selectedIndexs = []
              this.loadData()
            })
          }
        }
      })
    },
    confirmDelete(id) {
      uni.showModal({
        title: '提示',
        content: '确定删除该部门吗？',
        success: (res) => {
          if (res.confirm) {
            db.collection(dbCollectionName).doc(id).remove().then(() => {
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

.cell-name {
  font-weight: 500;
  color: $text;
}

.cell-sort {
  color: $text-secondary;
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
