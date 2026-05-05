<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">编辑报修</view>
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
              <uni-forms-item label="报修日期" name="request_date">
                <uni-datetime-picker v-model="formData.request_date" return-type="timestamp" placeholder="请选择报修日期" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="报修人" name="requester">
                <uni-easyinput v-model="formData.requester" placeholder="请输入报修人" trim="both" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="联系电话" name="phone">
                <uni-easyinput v-model="formData.phone" placeholder="请输入联系电话" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="故障描述" required name="fault_description">
                <uni-easyinput v-model="formData.fault_description" type="textarea" placeholder="请输入故障描述" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="紧急程度" name="urgency">
                <uni-data-select v-model="formData.urgency" :localdata="urgencyOptions" placeholder="请选择紧急程度" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="处理状态" name="status">
                <uni-data-select v-model="formData.status" :localdata="statusOptions" placeholder="请选择处理状态" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="处理人" name="handler">
                <uni-easyinput v-model="formData.handler" placeholder="请输入处理人" trim="both" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="处理时间" name="handle_date">
                <uni-datetime-picker v-model="formData.handle_date" return-type="timestamp" placeholder="请选择处理时间" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="处理结果" name="handle_result">
                <uni-easyinput v-model="formData.handle_result" type="textarea" placeholder="请输入处理结果" trim="both" />
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
            <button class="btn-primary" @click="submit">更新</button>
            <button class="btn-cancel" @click="back">返回</button>
          </view>
        </uni-forms>
      </view>
    </view>
  </view>
</template>

<script>
import { validator } from '../../js_sdk/validator/medical-device-repair-request.js';

const db = uniCloud.database();
const dbCollectionName = 'medical-device-repair-request';

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
      "request_date": null,
      "requester": "",
      "phone": "",
      "fault_description": "",
      "urgency": 1,
      "status": 1,
      "handler": "",
      "handle_date": null,
      "handle_result": "",
      "remark": ""
    }
    return {
      formDataId: '',
      formData,
      rules: { ...getValidator(Object.keys(formData)) },
      urgencyOptions: [
        { value: 1, text: '一般' },
        { value: 2, text: '紧急' },
        { value: 3, text: '非常紧急' }
      ],
      statusOptions: [
        { value: 1, text: '待处理' },
        { value: 2, text: '处理中' },
        { value: 3, text: '已完成' },
        { value: 4, text: '已关闭' }
      ],
      deviceCandidates: [],
      deviceOptionMap: {},
      deviceText: ''
    }
  },
  onLoad(e) {
    this.loadDevices().then(() => {
      if (e.id) {
        this.formDataId = e.id
        this.getDetail(e.id)
      }
    })
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
      return db.collection(dbCollectionName).doc(this.formDataId).update({
        ...value,
        updated_at: Date.now()
      }).then((res) => {
        uni.showToast({ title: '修改成功' })
        this.getOpenerEventChannel().emit('refreshData')
        setTimeout(() => uni.navigateBack(), 500)
      }).catch((err) => {
        uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
      })
    },
    getDetail(id) {
      uni.showLoading({ mask: true })
      db.collection(dbCollectionName).doc(id).field("device_id,request_date,requester,phone,fault_description,urgency,status,handler,handle_date,handle_result,remark").get().then((res) => {
        const data = res.result.data[0]
        if (data) {
          this.formData = Object.assign(this.formData, data)
          const text = Object.keys(this.deviceOptionMap).find(k => this.deviceOptionMap[k] === data.device_id)
          if (text) this.deviceText = text
        }
      }).catch((err) => {
        uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
      }).finally(() => {
        uni.hideLoading()
      })
    },
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
.page-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04); overflow: hidden; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid $border; flex-wrap: wrap; gap: 12px; }
.page-header-left { display: flex; align-items: center; gap: 16px; }
.breadcrumb { :deep(.uni-stat-breadcrumb) { font-size: 13px; } }
.page-title { font-size: 18px; font-weight: 600; color: $text; letter-spacing: -0.02em; }
.page-body { padding: 24px; }
.form-row { display: flex; gap: 16px; }
.form-col { flex: 1; min-width: 0; }
.form-actions { display: flex; justify-content: center; gap: 16px; margin-top: 32px; padding-top: 24px; border-top: 1px solid $border; }
.btn-primary { background: $primary; border: none; color: #fff; padding: 8px 32px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.15s ease; &:hover { background: darken($primary, 8%); transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba($primary, 0.3); } &:active { transform: translateY(0); } }
.btn-cancel { background: #fff; border: 1.5px solid $border; color: $text-secondary; padding: 8px 32px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.15s ease; &:hover { border-color: $primary; color: $primary; background: $primary-light; transform: translateY(-1px); } }
</style>
