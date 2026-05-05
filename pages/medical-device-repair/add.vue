<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">新增维修记录</view>
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
              <uni-forms-item label="维修日期" required name="repair_date">
                <uni-datetime-picker v-model="formData.repair_date" return-type="timestamp" placeholder="请选择维修日期" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="维修结果" name="result">
                <uni-data-select v-model="formData.result" :localdata="resultOptions" placeholder="请选择维修结果" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="故障原因" name="fault_reason">
                <uni-easyinput v-model="formData.fault_reason" placeholder="请输入故障原因" trim="both" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="维修方式" name="repair_method">
                <uni-easyinput v-model="formData.repair_method" placeholder="请输入维修方式" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="维修人员" name="repair_person">
                <uni-easyinput v-model="formData.repair_person" placeholder="请输入维修人员" trim="both" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="维修公司" name="repair_company">
                <uni-easyinput v-model="formData.repair_company" placeholder="请输入维修公司" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="维修费用" name="cost">
                <uni-easyinput v-model="formData.cost" type="number" placeholder="请输入维修费用" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="备注" name="remark">
                <uni-easyinput v-model="formData.remark" placeholder="请输入备注" trim="both" />
              </uni-forms-item>
            </view>
          </view>
        </uni-forms>
        <view class="form-actions">
          <button class="btn-primary" @click="submit">提交</button>
          <button class="btn-cancel" @click="back">返回</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { validator } from '../../js_sdk/validator/medical-device-repair.js';

const db = uniCloud.database();
const dbCollectionName = 'medical-device-repair';

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
      "repair_date": null,
      "fault_reason": "",
      "repair_method": "",
      "cost": null,
      "repair_company": "",
      "repair_person": "",
      "result": 1,
      "remark": ""
    }
    return {
      formData,
      rules: { ...getValidator(Object.keys(formData)) },
      resultOptions: [
        { value: 1, text: '已修复' },
        { value: 2, text: '部分修复' },
        { value: 3, text: '无法修复' }
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
    async loadDevices() {
      const res = await db.collection('medical-device').where({ deleted: 0, status: db.command.neq(3) }).get()
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
        device_id: this.formData.device_id,
        deleted: 0
      }).then((res) => {
        uni.showToast({ title: '新增成功' })
        this.getOpenerEventChannel().emit('refreshData')
        setTimeout(() => uni.navigateBack(), 500)
      }).catch((err) => {
        uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
      })
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
$text: #1e293b;
$text-secondary: #64748b;
$border: #e2e8f0;

.page-wrapper { padding: 20px; min-height: 100%; box-sizing: border-box; }
.page-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04); }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid $border; flex-wrap: wrap; gap: 12px; }
.page-header-left { display: flex; align-items: center; gap: 16px; }
.breadcrumb { :deep(.uni-stat-breadcrumb) { font-size: 13px; } }
.page-title { font-size: 18px; font-weight: 600; color: $text; letter-spacing: -0.02em; }
.page-body { padding: 24px; }
.form-row { display: flex; gap: 16px; }
.form-col { flex: 1; min-width: 0; }
.form-actions { display: flex; justify-content: center; gap: 16px; margin-top: 24px; padding-top: 20px; border-top: 1px solid $border; }
.btn-primary { background: $primary; border: none; color: #fff; padding: 8px 32px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.15s ease; &:hover { background: darken($primary, 8%); transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba($primary, 0.3); } &:active { transform: translateY(0); } }
.btn-cancel { background: #fff; border: 1.5px solid $border; color: $text-secondary; padding: 8px 32px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.15s ease; &:hover { border-color: $primary; color: $primary; background: $primary-light; transform: translateY(-1px); } }
</style>
