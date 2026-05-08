<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">设备导入</view>
        </view>
      </view>

      <view class="page-body">
        <view class="import-section">
          <view class="section-title">导入说明</view>
          <view class="section-body">
            <view class="tip-list">
              <text class="tip-item">1. 支持 .xlsx / .xls 格式的 Excel 文件</text>
              <text class="tip-item">2. 第一行必须为列头，列头名称需与模板一致</text>
              <text class="tip-item">3. 设备分类、使用部门、存放位置将按名称自动匹配</text>
              <text class="tip-item">4. 已存在的设备编号不会重复导入</text>
            </view>
            <button class="btn-template" size="mini" @click="downloadTemplate">
              <text class="btn-icon">↓</text>
              <text>下载导入模板</text>
            </button>
          </view>
        </view>

        <view class="import-section">
          <view class="section-title">上传文件</view>
          <view class="section-body">
            <view class="upload-area">
              <uni-file-picker
                ref="filePicker"
                file-mediatype="all"
                :file-extname="['xlsx', 'xls']"
                :auto-upload="false"
                :limit="1"
                :title="'选择Excel文件'"
                @select="onFileSelect"
              />
              <view v-if="selectedFile" class="file-info">
                <text class="file-name">{{ selectedFile.name }}</text>
                <text class="file-size">{{ formatFileSize(selectedFile.size) }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="import-section" v-if="parseResult">
          <view class="section-title">解析结果</view>
          <view class="section-body">
            <view class="result-summary">
              <view class="result-stat result-stat-total">
                <text class="stat-value">{{ parseResult.total }}</text>
                <text class="stat-label">总记录</text>
              </view>
              <view class="result-stat result-stat-valid">
                <text class="stat-value">{{ parseResult.validCount }}</text>
                <text class="stat-label">有效</text>
              </view>
              <view class="result-stat result-stat-error" :class="{ 'has-error': parseResult.errorCount > 0 }">
                <text class="stat-value">{{ parseResult.errorCount }}</text>
                <text class="stat-label">错误</text>
              </view>
            </view>

            <scroll-view v-if="parseResult.validRecords.length" class="preview-table-wrapper" scroll-x>
              <table class="preview-table">
                <thead>
                  <tr>
                    <th class="row-num">#</th>
                    <th v-for="(h, i) in parseResult.headers" :key="i">{{ h }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(record, idx) in parseResult.validRecords.slice(0, 50)" :key="idx">
                    <td class="row-num">{{ idx + 1 }}</td>
                    <td v-for="(h, ci) in parseResult.headers" :key="ci">{{ getFieldValue(record, h) }}</td>
                  </tr>
                </tbody>
              </table>
            </scroll-view>
            <text v-if="parseResult.validRecords.length > 50" class="preview-tip">
              仅显示前 50 条记录，共 {{ parseResult.validRecords.length }} 条
            </text>

            <view v-if="parseResult.errors.length" class="error-list">
              <view class="error-title">错误详情（{{ parseResult.errors.length }} 条）</view>
              <view class="error-items">
                <view v-for="(err, idx) in parseResult.errors" :key="idx" class="error-item">
                  <text class="error-row">第 {{ err.row }} 行</text>
                  <text class="error-code" v-if="err.code">[{{ err.code }}]</text>
                  <text class="error-msg">{{ err.message }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="page-footer">
        <button class="btn-cancel" size="mini" @click="goBack">返回</button>
        <button
          class="btn-import"
          size="mini"
          :disabled="!canImport"
          :loading="importing"
          @click="confirmImport"
        >
          {{ importing ? '导入中...' : '确认导入' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
const HEADER_LABEL_MAP = {
  '设备编号': 'code',
  '设备名称': 'name',
  '设备简称': 'short_name',
  '品牌': 'brand',
  '规格型号': 'model',
  '注册证号': 'spec',
  '产品编号': 'serial_no',
  '厂家': 'manufacturer',
  '设备分类': 'category_name',
  '使用部门': 'dept_name',
  '存放位置': 'location_name',
  '采购日期': 'purchase_date',
  '采购金额': 'purchase_amount',
  '供应商': 'supplier',
  '保修截止': 'warranty_end',
  '使用状态': 'status_text',
  '设备负责人': 'person_in_charge',
  '管理类型': 'management_type_text',
  '适用范围': 'applicable_scope',
  '生产日期': 'manufacture_date',
  '使用年限': 'service_life',
  '验收日期': 'acceptance_date',
  '保修年限': 'warranty_years',
  '备注': 'remark'
}

export default {
  data() {
    return {
      selectedFile: null,
      parseResult: null,
      importing: false,
      importCo: null
    }
  },
  computed: {
    canImport() {
      return this.parseResult && this.parseResult.validCount > 0 && !this.importing
    }
  },
  onLoad() {
    this.importCo = uniCloud.importObject('medical-device-import-co')
  },
  methods: {
    onFileSelect(e) {
      const files = e.tempFiles || []
      if (!files.length) return
      this.selectedFile = files[0]
      this.parseResult = null

      if (files[0].file) {
        this.readFileAndParse(files[0].file)
      } else if (files[0].path) {
        this.fetchFileAndParse(files[0].path)
      }
    },
    readFileAndParse(file) {
      uni.showLoading({ title: '正在解析...' })
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        await this.doParse(base64)
      }
      reader.onerror = () => {
        uni.hideLoading()
        uni.showToast({ title: '文件读取失败', icon: 'none' })
      }
      reader.readAsDataURL(file)
    },
    async fetchFileAndParse(path) {
      uni.showLoading({ title: '正在解析...' })
      try {
        const response = await fetch(path)
        const blob = await response.blob()
        const reader = new FileReader()
        reader.onload = async (ev) => {
          const base64 = ev.target.result.split(',')[1]
          await this.doParse(base64)
        }
        reader.onerror = () => {
          uni.hideLoading()
          uni.showToast({ title: '文件读取失败', icon: 'none' })
        }
        reader.readAsDataURL(blob)
      } catch (e) {
        uni.hideLoading()
        uni.showModal({ content: '文件读取失败: ' + e.message, showCancel: false })
      }
    },
    async doParse(base64) {
      try {
        const res = await this.importCo.parseExcel({ fileData: base64 })

        uni.hideLoading()

        if (res.code !== 0) {
          uni.showModal({ content: res.message || '解析失败', showCancel: false })
          return
        }

        this.parseResult = res.data

        if (res.data.errorCount > 0 && res.data.validCount === 0) {
          uni.showToast({ title: '所有记录均有错误，请检查文件', icon: 'none' })
        }
      } catch (e) {
        uni.hideLoading()
        uni.showModal({ content: e.message || '解析失败', showCancel: false })
      }
    },
    async confirmImport() {
      if (!this.canImport) return

      const res = await uni.showModal({
        title: '确认导入',
        content: '确定导入 ' + this.parseResult.validCount + ' 条设备记录吗？',
        showCancel: true
      })

      if (!res.confirm) return

      this.importing = true
      uni.showLoading({ title: '正在导入...' })

      try {
        const result = await this.importCo.confirmImport({
          records: this.parseResult.validRecords
        })

        uni.hideLoading()
        this.importing = false

        if (result.code === 0) {
          uni.showToast({ title: '导入成功 ' + result.data.insertedCount + ' 条', icon: 'success' })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 800)
        } else {
          uni.showModal({ content: result.message || '导入失败', showCancel: false })
        }
      } catch (e) {
        uni.hideLoading()
        this.importing = false
        uni.showModal({ content: e.message || '导入失败', showCancel: false })
      }
    },
    getFieldValue(record, headerLabel) {
      const field = HEADER_LABEL_MAP[headerLabel]
      if (!field) return ''
      const val = record[field]
      if (val === null || val === undefined) return '-'
      if (field === 'purchase_date' || field === 'warranty_end' || field === 'manufacture_date' || field === 'acceptance_date') {
        if (typeof val === 'number') {
          return this.formatDate(val)
        }
      }
      return String(val)
    },
    formatDate(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return y + '-' + m + '-' + d
    },
    formatFileSize(bytes) {
      if (!bytes) return ''
      if (bytes < 1024) return bytes + 'B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
      return (bytes / 1024 / 1024).toFixed(1) + 'MB'
    },
    downloadTemplate() {
      const headers = Object.keys(HEADER_LABEL_MAP)
      let csv = '\uFEFF' + headers.join(',') + '\n'
      csv += ['DEV-001', '示例设备A', '设备A', '示例品牌', 'XH-100', '国械注准20250001', 'SN-001', '示例厂家',
        '请填写分类名称', '请填写部门名称', '请填写位置名称', '', '10000', '示例供应商', '', '正常',
        '张三', '一类', '适用范围示例', '', '5', '', '', '', ''
      ].join(',') + '\n'

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '医疗设备导入模板.csv'
      a.click()
      URL.revokeObjectURL(url)
    },
    goBack() {
      uni.navigateBack()
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
$warning: #f59e0b;
$warning-light: #fffbeb;
$text: #1e293b;
$text-secondary: #64748b;
$text-muted: #94a3b8;
$border: #e2e8f0;
$bg: #f8fafc;

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

.page-body {
  padding: 0;
}

.import-section {
  border-bottom: 1px solid $border;

  &:last-of-type {
    border-bottom: none;
  }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: $text;
  padding: 16px 24px 0;
}

.section-body {
  padding: 12px 24px 20px;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.tip-item {
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.6;
}

.btn-template {
  background: $primary-light;
  border: none;
  color: $primary;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;

  &:hover {
    background: darken($primary-light, 5%);
    transform: translateY(-1px);
  }
}

.btn-icon {
  font-size: 14px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: $bg;
  border-radius: 8px;
}

.file-name {
  font-size: 13px;
  color: $text;
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: $text-muted;
}

.result-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.result-stat {
  flex: 1;
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background: $bg;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: $text;
  line-height: 1.2;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: $text-secondary;
  margin-top: 4px;
}

.result-stat-total .stat-value {
  color: $primary;
}

.result-stat-valid .stat-value {
  color: $success;
}

.result-stat-error .stat-value {
  color: $text-secondary;
}

.result-stat-error.has-error .stat-value {
  color: $danger;
}

.preview-table-wrapper {
  overflow-x: auto;
  margin-bottom: 12px;
  border: 1px solid $border;
  border-radius: 8px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: max-content;

  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid $border;
    white-space: nowrap;
    color: $text;
  }

  th {
    background: $bg;
    font-weight: 600;
    color: $text-secondary;
    font-size: 12px;
    position: sticky;
    top: 0;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: $bg;
  }

  .row-num {
    width: 40px;
    text-align: center;
    color: $text-muted;
    font-size: 12px;
  }
}

.preview-tip {
  display: block;
  font-size: 12px;
  color: $text-muted;
  text-align: center;
  margin-top: -4px;
  margin-bottom: 12px;
}

.error-list {
  background: $danger-light;
  border-radius: 8px;
  padding: 12px 16px;
}

.error-title {
  font-size: 13px;
  font-weight: 600;
  color: $danger;
  margin-bottom: 8px;
}

.error-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.error-row {
  color: $danger;
  font-weight: 600;
  white-space: nowrap;
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 12px;
}

.error-code {
  color: $text-secondary;
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 12px;
}

.error-msg {
  color: $text;
}

.page-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid $border;
}

.btn-cancel {
  background: #fff;
  border: 1.5px solid $border;
  color: $text-secondary;
  padding: 6px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover {
    border-color: $text-muted;
    background: $bg;
  }
}

.btn-import {
  background: $primary;
  border: none;
  color: #fff;
  padding: 6px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: darken($primary, 8%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba($primary, 0.3);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
