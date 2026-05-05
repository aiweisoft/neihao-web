<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">新增报警提醒</view>
        </view>
      </view>
      <view class="page-body">
        <uni-forms ref="form" :model="formData" label-width="100px" label-align="right">
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="关联设备" required name="device_id">
                <uni-combox v-model="deviceText" :candidates="deviceCandidates" placeholder="请搜索选择设备" @input="onDeviceInput" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="提醒类型" required name="alert_type">
                <uni-data-select v-model="formData.alert_type" :localdata="typeOptions" placeholder="请选择提醒类型" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="提醒标题" required name="title">
                <uni-easyinput v-model="formData.title" placeholder="请输入提醒标题" trim="both" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="提醒日期" name="alert_date">
                <uni-datetime-picker v-model="formData.alert_date" return-type="timestamp" placeholder="请选择提醒日期" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="提醒内容" name="description">
                <uni-easyinput v-model="formData.description" type="textarea" placeholder="请输入提醒内容" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="关联类型" name="related_type">
                <uni-data-select v-model="formData.related_type" :localdata="relatedOptions" placeholder="请选择关联类型" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="关联记录ID" name="related_id">
                <uni-easyinput v-model="formData.related_id" placeholder="请输入关联记录ID" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="备注" name="remark">
                <uni-easyinput v-model="formData.remark" placeholder="请输入备注" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-actions">
            <button class="btn-primary" @click="submit">提交</button>
            <button class="btn-cancel" @click="back">返回</button>
          </view>
        </uni-forms>
      </view>
    </view>
  </view>
</template>

<script>
import { validator } from '../../js_sdk/validator/medical-device-alert.js';

const db = uniCloud.database();
const dbCollectionName = 'medical-device-alert';

function getValidator(fields) {
  let result = {}
  for (let key in validator) {
    if (fields.includes(key)) {
      result[key] = validator[key]
    }
  }
  return result
}

export default {
  data() {
    let formData = {
      "device_id": "",
      "alert_type": 1,
      "title": "",
      "description": "",
      "alert_date": null,
      "is_read": 0,
      "read_date": null,
      "related_id": "",
      "related_type": "",
      "remark": ""
    }
    return {
      formData,
      rules: { ...getValidator(Object.keys(formData)) },
      typeOptions: [
        { value: 1, text: '保养到期' },
        { value: 2, text: '校验到期' },
        { value: 3, text: '维修提醒' },
        { value: 4, text: '其他' }
      ],
      relatedOptions: [
        { value: 'maintenance', text: '保养' },
        { value: 'repair', text: '维修' }
      ],
      deviceCandidates: [],
      deviceOptionMap: {},
      deviceText: ''
    }
  },
  onLoad() {
    this.loadDevices()
  },
  onReady() {
    this.$refs.form.setRules(this.rules)
  },
  methods: {
    submit() {
      uni.showLoading({ mask: true })
      this.$refs.form.validate().then((res) => {
        return this.submitForm(res)
      }).catch(() => {
      }).finally(() => {
        uni.hideLoading()
      })
    },
    submitForm(value) {
      return db.collection(dbCollectionName).add({
        ...value,
        deleted: 0
      }).then((res) => {
        uni.showToast({ title: '新增成功' })
        this.getOpenerEventChannel().emit('refreshData')
        setTimeout(() => uni.navigateBack(), 500)
      }).catch((err) => {
        uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
      })
    },
    async loadDevices() {
      const res = await db.collection('medical-device').where({ deleted: 0 }).get()
      const map = {}
      const candidates = res.result.data.map(d => {
        const text = d.name + ' (' + d.code + ')'
        map[text] = d._id
        return text
      })
      this.deviceOptionMap = map
      this.deviceCandidates = candidates
    },
    onDeviceInput(val) {
      this.formData.device_id = this.deviceOptionMap[val] || ''
    },
    back() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
$primary: #6366f1;
$primary-light: #eef2ff;
$text-secondary: #64748b;
$border: #e2e8f0;

.page-wrapper { padding: 20px; min-height: 100%; box-sizing: border-box; }
.page-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04); overflow: hidden; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid $border; flex-wrap: wrap; gap: 12px; }
.page-header-left { display: flex; align-items: center; gap: 16px; }
.breadcrumb { :deep(.uni-stat-breadcrumb) { font-size: 13px; } }
.page-title { font-size: 18px; font-weight: 600; color: #1e293b; letter-spacing: -0.02em; }
.page-body { padding: 24px; }
.form-row { display: flex; gap: 16px; }
.form-col { flex: 1; min-width: 0; }
.form-actions { display: flex; justify-content: center; gap: 16px; margin-top: 32px; padding-top: 24px; border-top: 1px solid $border; }
.btn-primary { background: #6366f1; border: none; color: #fff; padding: 8px 32px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.15s ease; &:hover { background: darken(#6366f1, 8%); transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(#6366f1, 0.3); } &:active { transform: translateY(0); } }
.btn-cancel { background: #fff; border: 1.5px solid $border; color: $text-secondary; padding: 8px 32px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.15s ease; &:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; transform: translateY(-1px); } }
</style>
