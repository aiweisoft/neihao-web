<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">新增保养计划</view>
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
              <uni-forms-item label="计划名称" required name="plan_name">
                <uni-easyinput v-model="formData.plan_name" placeholder="请输入计划名称" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="保养类型" required name="maintenance_type">
                <uni-data-select v-model="formData.maintenance_type" :localdata="typeOptions" placeholder="请选择保养类型" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="计划日期" required name="plan_date">
                <uni-datetime-picker v-model="formData.plan_date" return-type="timestamp" placeholder="请选择计划日期" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="周期类型" name="cycle_type">
                <uni-data-select v-model="formData.cycle_type" :localdata="cycleOptions" placeholder="请选择周期类型" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="周期值" name="cycle_value">
                <uni-easyinput v-model="formData.cycle_value" type="number" placeholder="请输入周期值" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="下次保养日期" name="next_date">
                <uni-datetime-picker v-model="formData.next_date" return-type="timestamp" placeholder="请选择下次保养日期" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="提前提醒(天)" name="remind_before_days">
                <uni-easyinput v-model="formData.remind_before_days" type="number" placeholder="请输入提前提醒天数" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="保养说明" name="description">
                <uni-easyinput v-model="formData.description" type="textarea" placeholder="请输入保养说明" trim="both" />
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
import { validator } from '../../js_sdk/validator/medical-device-maintenance.js';

const db = uniCloud.database();
const dbCollectionName = 'medical-device-maintenance';

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
      "plan_name": "",
      "maintenance_type": 1,
      "plan_date": null,
      "cycle_type": null,
      "cycle_value": null,
      "next_date": null,
      "remind_before_days": 7,
      "description": "",
      "status": 1,
      "completed_date": null,
      "remark": ""
    }
    return {
      formData,
      rules: { ...getValidator(Object.keys(formData)) },
      typeOptions: [
        { value: 1, text: '定期保养' },
        { value: 2, text: '校准' },
        { value: 3, text: '其他' }
      ],
      cycleOptions: [
        { value: 1, text: '天' },
        { value: 2, text: '周' },
        { value: 3, text: '月' },
        { value: 4, text: '年' }
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
