<template>
  <view class="page-wrapper">
    <view class="page-card">
      <view class="page-header">
        <view class="page-header-left">
          <uni-stat-breadcrumb class="breadcrumb" />
          <view class="page-title">新增分类</view>
        </view>
      </view>
      <view class="page-body">
        <uni-forms ref="form" :model="formData" label-width="90px" label-align="right">
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="分类编码" required name="code">
                <uni-easyinput v-model="formData.code" placeholder="请输入分类编码" trim="both" />
              </uni-forms-item>
            </view>
            <view class="form-col">
              <uni-forms-item label="分类名称" required name="name">
                <uni-easyinput v-model="formData.name" placeholder="请输入分类名称" trim="both" />
              </uni-forms-item>
            </view>
          </view>
          <view class="form-row">
            <view class="form-col">
              <uni-forms-item label="排序号" name="sort">
                <uni-easyinput v-model="formData.sort" type="number" placeholder="请输入排序号" />
              </uni-forms-item>
            </view>
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
import { validator } from '../../js_sdk/validator/medical-device-category.js';

const db = uniCloud.database();
const dbCollectionName = 'medical-device-category';

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
      "sort": null,
      "remark": ""
    }
    return {
      formData,
      rules: {
        ...getValidator(Object.keys(formData))
      }
    }
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
