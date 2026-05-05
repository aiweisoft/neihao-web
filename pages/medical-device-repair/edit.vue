<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">编辑维修记录</view>
        </view>
      </view>
      <view class="page-body">
        <uni-forms ref="form" :model="formData" label-width="100px" label-align="right">
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="关联报修" required name="repair_request_id">
                <uni-combox v-model="repairRequestText" :candidates="repairRequestCandidates" placeholder="请选择关联报修单" @input="onRepairRequestInput" />
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
              <uni-forms-item v-if="formData.device_id" label="关联设备">
                <view class="device-display">{{ deviceDisplay }}</view>
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
              <uni-forms-item label="维修费用" name="cost">
                <uni-easyinput v-model="formData.cost" type="number" placeholder="请输入维修费用" />
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
              <uni-forms-item label="维修人员" name="repair_person">
                <uni-easyinput v-model="formData.repair_person" placeholder="请输入维修人员" trim="both" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="维修结果" name="result">
                <uni-data-select v-model="formData.result" :localdata="resultOptions" placeholder="请选择维修结果" />
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
import { validator } from '../../js_sdk/validator/medical-device-repair.js';

const db = uniCloud.database();
const dbCmd = db.command
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
      "fault_description": "",
      "fault_reason": "",
      "repair_method": "",
      "cost": null,
      "repair_company": "",
      "repair_person": "",
      "result": 1,
      "repair_request_id": "",
      "remark": ""
    }
    return {
      formDataId: '',
      formData,
      rules: { ...getValidator(Object.keys(formData)) },
      resultOptions: [
        { value: 1, text: '已修复' },
        { value: 2, text: '部分修复' },
        { value: 3, text: '无法修复' }
      ],
      deviceDisplay: '',
      repairRequestCandidates: [],
      repairRequestMap: {},
      repairRequestText: ''
    }
  },
  onLoad(e) {
    this.loadRepairRequests().then(() => {
      if (e.id) {
        this.formDataId = e.id
        this.getDetail(e.id)
      }
    })
  },
  mounted() {
    this.$nextTick(() => {
      this.setFormRules()
    })
  },
  onReady() {
    this.setFormRules()
  },
  methods: {
    setFormRules() {
      if (this.$refs && this.$refs.form) {
        this.$refs.form.setRules(this.rules)
      }
    },
    submit() {
      if (!this.$refs.form) return
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
        let promises = []
        if (value.result === 1) {
          promises.push(
            db.collection('medical-device').doc(value.device_id).field('previous_status').get().then(deviceRes => {
              const prevStatus = deviceRes.result.data[0]?.previous_status || 2
              return db.collection('medical-device').doc(value.device_id).update({
                status: prevStatus,
                previous_status: null,
                updated_at: Date.now()
              })
            })
          )
        }
        if (value.repair_request_id) {
          promises.push(db.collection('medical-device-repair-request').doc(value.repair_request_id).update({
            status: value.result === 1 ? 3 : 2,
            updated_at: Date.now()
          }))
        }
        return Promise.all(promises)
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
      db.collection(dbCollectionName).doc(id).field("device_id,repair_date,fault_description,fault_reason,repair_method,cost,repair_company,repair_person,result,repair_request_id,remark").get().then((res) => {
        const data = res.result.data[0]
        if (data) {
          this.formData = Object.assign(this.formData, data)
          this.formData.cost = data.cost || null
          let matched = false
          for (let key in this.repairRequestMap) {
            if (this.repairRequestMap[key]._id === data.repair_request_id) {
              this.repairRequestText = key
              this.deviceDisplay = this.repairRequestMap[key].device_name || '未知设备'
              matched = true
              break
            }
          }
          if (!matched && data.repair_request_id) {
            this.loadSingleRepairRequest(data.repair_request_id)
          }
          if (!matched) {
            this.loadDeviceDisplay(data.device_id)
          }
          this.$nextTick(() => {
            this.setFormRules()
          })
        }
      }).catch((err) => {
        uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
      }).finally(() => {
        uni.hideLoading()
      })
    },
    async loadSingleRepairRequest(requestId) {
      try {
        const reqRes = await db.collection('medical-device-repair-request').doc(requestId).get()
        const req = reqRes.result.data[0]
        if (req) {
          let deviceName = '未知设备'
          if (req.device_id) {
            const deviceRes = await db.collection('medical-device').doc(req.device_id).field('name,code').get()
            const device = deviceRes.result.data[0]
            deviceName = device ? (device.name + ' (' + device.code + ')') : '未知设备'
          }
          const text = (req.requester || '未知') + ' - ' + (req.fault_description || '').slice(0, 20)
          this.repairRequestMap[text] = {
            _id: req._id,
            device_id: req.device_id,
            fault_description: req.fault_description,
            device_name: deviceName
          }
          this.repairRequestCandidates.push(text)
          this.repairRequestText = text
          this.deviceDisplay = deviceName
        }
      } catch (e) {}
    },
    async loadDeviceDisplay(deviceId) {
      if (!deviceId) return
      try {
        const deviceRes = await db.collection('medical-device').doc(deviceId).field('name,code').get()
        const device = deviceRes.result.data[0]
        if (device) {
          this.deviceDisplay = device.name + ' (' + device.code + ')'
        }
      } catch (e) {}
    },
    async loadRepairRequests() {
      const res = await db.collection('medical-device-repair-request').where({ deleted: 0, status: dbCmd.in([1, 2]) }).get()
      const deviceIds = [...new Set(res.result.data.map(d => d.device_id).filter(Boolean))]
      let deviceNameMap = {}
      if (deviceIds.length) {
        const deviceRes = await db.collection('medical-device').where({ _id: dbCmd.in(deviceIds) }).get()
        deviceRes.result.data.forEach(d => { deviceNameMap[d._id] = d.name + ' (' + d.code + ')' })
      }
      const map = {}
      const candidates = res.result.data.map(d => {
        const text = (d.requester || '未知') + ' - ' + (d.fault_description || '').slice(0, 20)
        map[text] = {
          _id: d._id,
          device_id: d.device_id,
          fault_description: d.fault_description,
          device_name: deviceNameMap[d.device_id] || '未知设备'
        }
        return text
      })
      this.repairRequestMap = map
      this.repairRequestCandidates = candidates
    },
    onRepairRequestInput(val) {
      const data = this.repairRequestMap[val]
      if (data) {
        this.formData.repair_request_id = data._id
        this.formData.device_id = data.device_id
        this.formData.fault_description = data.fault_description
        this.deviceDisplay = data.device_name || '未知设备'
      } else {
        this.formData.repair_request_id = ''
        this.formData.device_id = ''
        this.formData.fault_description = this.formData.fault_description || ''
        this.deviceDisplay = ''
      }
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
$danger: #ef4444;
$danger-light: #fef2f2;
$text: #1e293b;
$text-secondary: #64748b;
$border: #e2e8f0;
$bg-hover: #f8fafc;

.page-wrapper { padding: 20px; min-height: 100%; box-sizing: border-box; }
.page-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04); }
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
.device-display { padding: 8px 12px; background: $bg-hover; border-radius: 6px; font-size: 14px; color: $text; border: 1px solid $border; min-height: 22px; line-height: 22px; }
</style>
