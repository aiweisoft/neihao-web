<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">编辑设备</view>
        </view>
      </view>
      <view class="page-body">
        <uni-forms ref="form" :model="formData" label-width="90px" label-align="right">
          <uni-forms-item label="设备编号" required name="code">
            <uni-easyinput v-model="formData.code" placeholder="请输入设备编号" trim="both" />
          </uni-forms-item>
          <uni-forms-item label="设备名称" required name="name">
            <uni-easyinput v-model="formData.name" placeholder="请输入设备名称" trim="both" />
          </uni-forms-item>
          <uni-forms-item label="设备简称" name="short_name">
            <uni-easyinput v-model="formData.short_name" placeholder="请输入设备简称" trim="both" />
          </uni-forms-item>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="品牌" required name="brand">
                <uni-easyinput v-model="formData.brand" placeholder="请输入品牌" trim="both" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="规格型号" required name="model">
                <uni-easyinput v-model="formData.model" placeholder="请输入规格型号" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="厂家" name="manufacturer">
                <uni-easyinput v-model="formData.manufacturer" placeholder="请输入厂家" trim="both" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="注册证号/备案号" name="spec">
                <uni-easyinput v-model="formData.spec" placeholder="请输入注册证号/备案号" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <uni-forms-item label="产品编号" name="serial_no">
            <uni-easyinput v-model="formData.serial_no" placeholder="请输入产品编号" trim="both" />
          </uni-forms-item>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="设备分类" required name="category_id">
                <uni-data-select v-model="formData.category_id" :localdata="categoryOptions" placeholder="请选择设备分类" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="使用部门" required name="dept_id">
                <uni-data-select v-model="formData.dept_id" :localdata="deptOptions" placeholder="请选择使用部门" />
              </uni-forms-item>
            </view>
          </view>
          <uni-forms-item label="存放位置" name="location_id">
            <uni-data-select v-model="formData.location_id" :localdata="locationOptions" placeholder="请选择存放位置" />
          </uni-forms-item>
          <uni-forms-item label="设备负责人" name="person_in_charge">
            <uni-easyinput v-model="formData.person_in_charge" placeholder="请输入设备负责人" trim="both" />
          </uni-forms-item>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="采购日期" name="purchase_date">
                <uni-datetime-picker type="date" return-type="timestamp" v-model="formData.purchase_date" placeholder="请选择采购日期" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="采购金额" name="purchase_amount">
                <uni-easyinput v-model="formData.purchase_amount" type="digit" placeholder="请输入采购金额" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="供应商" name="supplier">
                <uni-easyinput v-model="formData.supplier" placeholder="请输入供应商" trim="both" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="保修截止" name="warranty_end">
                <uni-datetime-picker type="date" return-type="timestamp" v-model="formData.warranty_end" placeholder="请选择保修截止日期" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="使用状态" name="status">
                <uni-data-select v-model="formData.status" :localdata="statusOptions" placeholder="请选择使用状态" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="设备管理类型" name="management_type">
                <uni-data-select v-model="formData.management_type" :localdata="managementTypeOptions" placeholder="请选择设备管理类型" />
              </uni-forms-item>
            </view>
          </view>
          <uni-forms-item label="设备适用范围" name="applicable_scope">
            <uni-easyinput v-model="formData.applicable_scope" placeholder="请输入设备适用范围" trim="both" />
          </uni-forms-item>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="生产日期" name="manufacture_date">
                <uni-datetime-picker type="date" return-type="timestamp" v-model="formData.manufacture_date" placeholder="请选择生产日期" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="使用年限" name="service_life">
                <uni-easyinput v-model="formData.service_life" type="digit" placeholder="请输入使用年限（年）" />
              </uni-forms-item>
            </view>
          </view>
          <uni-forms-item label="设备照片" name="image_url">
            <uni-file-picker v-model="formData.image_url" fileMediatype="image" mode="grid" :image-styles="imageStyles" />
          </uni-forms-item>
          <uni-forms-item label="备注" name="remark">
            <uni-easyinput type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </uni-forms-item>
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
import { validator } from '../../js_sdk/validator/medical-device.js';

const db = uniCloud.database();
const dbCollectionName = 'medical-device';

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
      "code": "",
      "name": "",
      "short_name": "",
      "manufacturer": "",
      "brand": "",
      "model": "",
      "spec": "",
      "serial_no": "",
      "category_id": "",
      "dept_id": "",
      "location_id": "",
      "person_in_charge": "",
      "management_type": 4,
      "applicable_scope": "",
      "manufacture_date": null,
      "service_life": null,
      "purchase_date": null,
      "purchase_amount": null,
      "supplier": "",
      "warranty_end": null,
      "status": 1,
      "image_url": [],
      "remark": ""
    }
    return {
      formDataId: '',
      formData,
      categoryOptions: [],
      deptOptions: [],
      locationOptions: [],
      statusOptions: [
        { value: 1, text: '正常' },
        { value: 2, text: '使用中' },
        { value: 3, text: '维修中' },
        { value: 4, text: '报废' },
        { value: 5, text: '未投入' },
        { value: 6, text: '其他' }
      ],
      managementTypeOptions: [
        { value: 1, text: '一类' },
        { value: 2, text: '二类' },
        { value: 3, text: '三类' },
        { value: 4, text: '非医疗器械' }
      ],
      imageStyles: {
        width: 100,
        height: 100,
        border: { color: '#eee', width: 1, style: 'solid', radius: '4px' }
      },
      rules: {
        ...getValidator(Object.keys(formData))
      }
    }
  },
  onLoad(e) {
    if (e.id) {
      this.formDataId = e.id
      this.getDetail(e.id)
    }
  },
  onReady() {
    this.$refs.form.setRules(this.rules)
    this.loadCategoryOptions()
    this.loadDeptOptions()
    this.loadLocationOptions()
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
      db.collection(dbCollectionName).doc(id).field("code,name,short_name,manufacturer,brand,model,spec,serial_no,category_id,dept_id,location_id,person_in_charge,management_type,applicable_scope,manufacture_date,service_life,purchase_date,purchase_amount,supplier,warranty_end,status,image_url,remark").get().then((res) => {
        const data = res.result.data[0]
        if (data) {
          this.formData = data
          if (this.formData.purchase_date) {
            this.formData.purchase_date = new Date(this.formData.purchase_date).getTime()
          }
          if (this.formData.warranty_end) {
            this.formData.warranty_end = new Date(this.formData.warranty_end).getTime()
          }
        }
      }).catch((err) => {
        uni.showModal({ content: err.message || '请求服务失败', showCancel: false })
      }).finally(() => {
        uni.hideLoading()
      })
    },
    back() {
      uni.navigateBack()
    },
    loadCategoryOptions() {
      db.collection('medical-device-category').where({ deleted: 0 }).get().then(res => {
        this.categoryOptions = res.result.data.map(item => ({ value: item._id, text: item.name }))
      })
    },
    loadDeptOptions() {
      db.collection('opendb-department').get().then(res => {
        this.deptOptions = res.result.data.map(item => ({ value: item._id, text: item.name }))
      })
    },
    loadLocationOptions() {
      db.collection('medical-device-location').where({ deleted: 0 }).get().then(res => {
        this.locationOptions = res.result.data.map(item => ({ value: item._id, text: item.name }))
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

.page-body {
  padding: 24px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-col {
  flex: 1;
  min-width: 0;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid $border;
}

.btn-primary {
  background: $primary;
  border: none;
  color: #fff;
  padding: 8px 32px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
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

.btn-cancel {
  background: #fff;
  border: 1.5px solid $border;
  color: $text-secondary;
  padding: 8px 32px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover {
    border-color: $primary;
    color: $primary;
    background: $primary-light;
    transform: translateY(-1px);
  }
}
</style>
