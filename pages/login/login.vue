<template>
  <view class="login-page">
    <view class="login-bg">
      <view class="bg-grid"></view>
      <view class="bg-shape bg-shape-1"></view>
      <view class="bg-shape bg-shape-2"></view>
      <view class="bg-shape bg-shape-3"></view>
    </view>
    <view class="login-container">
      <view class="login-card">
        <view class="card-accent"></view>
        <view class="login-header">
          <view class="login-logo-wrap">
            <view class="logo-ring"></view>
            <image class="login-logo" src="/static/logo.svg" mode="widthFix"></image>
          </view>
          <text class="login-title">内号医疗设备管理系统</text>
          <text class="login-subtitle">内部设备全生命周期管理平台</text>
        </view>
        <view class="login-form">
          <view class="input-group" :class="{ 'input-filled': username }">
            <view class="input-icon">
              <text class="admin-icons-user"></text>
            </view>
            <view class="input-body">
              <text class="input-label">账号</text>
              <input class="login-input" :focus="focusUsername" @blur="focusUsername = false"
                v-model="username" @input="onInput" placeholder="" />
            </view>
          </view>
          <view class="input-group" :class="{ 'input-filled': password }">
            <view class="input-icon">
              <text class="admin-icons-safety"></text>
            </view>
            <view class="input-body">
              <text class="input-label">密码</text>
              <input class="login-input" :focus="focusPassword" @blur="focusPassword = false"
                :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="" />
            </view>
            <view class="input-toggle" @click="showPassword = !showPassword">
              <text class="admin-icons-activity"></text>
            </view>
          </view>
          <uni-captcha v-if="needCaptcha" focus ref="captcha" scene="login-by-pwd" v-model="captcha" />
          <uni-id-pages-agreements scope="login" ref="agreements"></uni-id-pages-agreements>
          <view class="login-options">
            <label class="remember-me" @click="remember = !remember">
              <view class="checkbox" :class="{ checked: remember }">
                <text v-if="remember" class="checkmark">✓</text>
              </view>
              <text class="remember-text">记住我</text>
            </label>
          </view>
          <button class="login-btn" :class="{ loading: isLogging }" :disabled="isLogging" @click="pwdLogin">
            <text class="btn-text" v-if="!isLogging">登 录</text>
            <text class="btn-loading" v-else>
              <text class="spinner"></text>
              <text>登录中...</text>
            </text>
          </button>
        </view>
        <view class="login-footer">
          <view v-if="!config.isAdmin" class="footer-left">
            <text class="link-text">忘记了？</text>
            <text class="link" @click="toRetrievePwd">找回密码</text>
          </view>
          <view class="footer-right">
            <text v-if="!existAdmin" class="link" @click="toRegister">
              {{config.isAdmin ? '注册管理员' : '注册账号'}}
            </text>
          </view>
        </view>
      </view>
      <view class="login-footer-bar">
        <text class="copyright">© 内号医疗设备管理系统 2026</text>
      </view>
    </view>
  </view>
</template>

<script>
import mixin from '@/uni_modules/uni-id-pages/common/login-page.mixin.js';
const uniIdCo = uniCloud.importObject("uni-id-co", {
  errorOptions: { type: 'toast' }
})

export default {
  mixins: [mixin],
  data() {
    return {
      password: "",
      username: "",
      captcha: "",
      needCaptcha: false,
      focusUsername: false,
      focusPassword: false,
      showPassword: false,
      remember: false,
      isLogging: false,
      existAdmin: true
    }
  },
  onShow() {
    document.onkeydown = event => {
      let e = event || window.event;
      if (e && e.keyCode == 13) {
        this.pwdLogin()
      }
    };
  },
  async onLoad() {
    try {
      const db = uniCloud.database();
      let countRes = await db.collection("uni-id-users").where({role:"admin"}).count();
      let count = countRes.result.total;
      this.existAdmin = count > 0;
    } catch(err) {
      this.existAdmin = false;
    }
  },
  methods: {
    onInput() {
      // placeholder trigger for reactivity
    },
    toRetrievePwd() {
      let url = '/uni_modules/uni-id-pages/pages/retrieve/retrieve'
      if (/^1\d{10}$/.test(this.username)) {
        url += `?phoneNumber=${this.username}`
      }
      uni.navigateTo({ url })
    },
    pwdLogin() {
      if (!this.password.length) {
        this.focusPassword = true
        return uni.showToast({ title: '请输入密码', icon: 'none', duration: 3000 });
      }
      if (!this.username.length) {
        this.focusUsername = true
        return uni.showToast({ title: '请输入账号', icon: 'none', duration: 3000 });
      }
      if (this.needCaptcha && this.captcha.length != 4) {
        this.$refs.captcha.getImageCaptcha()
        return uni.showToast({ title: '请输入验证码', icon: 'none', duration: 3000 });
      }
      if (this.needAgreements && !this.agree) {
        return this.$refs.agreements.popup(this.pwdLogin)
      }
      this.isLogging = true
      let data = { password: this.password, captcha: this.captcha }
      if (/^1\d{10}$/.test(this.username)) {
        data.mobile = this.username
      } else if (/@/.test(this.username)) {
        data.email = this.username
      } else {
        data.username = this.username
      }
      uniIdCo.login(data).then(e => {
        this.loginSuccess(e)
      }).catch(e => {
        if (e.errCode == 'uni-id-captcha-required') {
          this.needCaptcha = true
        } else if (this.needCaptcha) {
          this.$refs.captcha.getImageCaptcha()
        }
      }).finally(() => {
        this.isLogging = false
      })
    },
    toRegister() {
      uni.navigateTo({
        url: this.config.isAdmin
          ? '/uni_modules/uni-id-pages/pages/register/register-admin'
          : '/uni_modules/uni-id-pages/pages/register/register',
        fail(e) { console.error(e) }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
$primary: #6366f1;
$primary-dark: #4f46e5;
$primary-light: #818cf8;
$bg-dark: #0f0c29;
$bg-mid: #1a1a4e;
$bg-light: #24243e;
$text-dark: #1a1a2e;
$text-muted: #999;
$input-bg: #f5f7fa;
$card-radius: 16px;

/* ====== Page Container ====== */
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $bg-dark 0%, $bg-mid 30%, $bg-light 70%, #302b63 100%);
  overflow: hidden;
}

/* ====== Background ====== */
.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}

.bg-shape-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, $primary, #8b5cf6);
  top: -200px;
  right: -100px;
  opacity: 0.12;
  animation: float1 10s ease-in-out infinite;
}

.bg-shape-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  bottom: -150px;
  left: -150px;
  opacity: 0.1;
  animation: float2 12s ease-in-out infinite;
}

.bg-shape-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #a78bfa, $primary);
  top: 40%;
  left: 55%;
  opacity: 0.08;
  animation: float3 8s ease-in-out infinite;
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-40px, 30px) scale(1.05); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -30px) scale(1.05); }
}
@keyframes float3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-20px, 20px) scale(1.08); }
}

/* ====== Card Container ====== */
.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 20px;
}

.login-card {
  width: 400px;
  max-width: 100%;
  background: #fff;
  border-radius: $card-radius;
  overflow: hidden;
  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  animation: cardIn 0.6s ease-out;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.card-accent {
  height: 4px;
  background: linear-gradient(90deg, $primary, #8b5cf6, #ec4899, $primary);
  background-size: 300% 100%;
  animation: accentSlide 4s linear infinite;
}

@keyframes accentSlide {
  0% { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}

/* ====== Header ====== */
.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 40px 0;
}

.login-logo-wrap {
  position: relative;
  width: 76px;
  height: 76px;
  margin-bottom: 18px;
}

.logo-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid rgba($primary, 0.15);
  animation: ringPulse 3s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.5; }
}

.login-logo {
  width: 100%;
  height: 100%;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: $text-dark;
  letter-spacing: 1px;
}

.login-subtitle {
  font-size: 13px;
  color: $text-muted;
  margin-top: 6px;
  letter-spacing: 0.5px;
}

/* ====== Form ====== */
.login-form {
  padding: 28px 40px 0;
}

.input-group {
  display: flex;
  align-items: center;
  height: 52px;
  background: $input-bg;
  border-radius: 10px;
  padding: 0 14px;
  margin-bottom: 14px;
  border: 1.5px solid transparent;
  transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;

  &:focus-within {
    border-color: $primary;
    background: #fff;
    box-shadow: 0 0 0 4px rgba($primary, 0.08);
  }
}

.input-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;

  [class*="admin-icons-"] {
    font-size: 18px;
    color: #bbb;
    transition: color 0.25s;
  }
}

.input-group:focus-within .input-icon [class*="admin-icons-"] {
  color: $primary;
}

.input-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  position: relative;
}

.input-label {
  position: absolute;
  font-size: 14px;
  color: #bbb;
  pointer-events: none;
  transition: all 0.25s;
  top: 50%;
  transform: translateY(-50%);
}

.input-group:focus-within .input-label,
.input-filled .input-label {
  top: 8px;
  transform: translateY(0);
  font-size: 11px;
  color: $primary;
}

.login-input {
  flex: 1;
  font-size: 14px;
  color: #333;
  background: transparent;
  border: none;
  outline: none;
  height: 100%;
  padding-top: 8px;
}

.input-toggle {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  .admin-icons-activity {
    font-size: 16px;
    color: #ccc;
    transition: color 0.2s;
  }

  &:hover .admin-icons-activity {
    color: $primary;
  }
}

/* ====== Options ====== */
.login-options {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #d0d5dd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &.checked {
    background: $primary;
    border-color: $primary;
  }
}

.checkmark {
  font-size: 11px;
  color: #fff;
  font-weight: 700;
}

.remember-text {
  font-size: 13px;
  color: #888;
}

/* ====== Button ====== */
.login-btn {
  position: relative;
  height: 48px;
  line-height: 48px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, $primary, $primary-dark);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 4px;
  margin-top: 14px;
  width: 100%;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba($primary, 0.4);

    &::before {
      transform: translateX(100%);
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &.loading {
    opacity: 0.85;
    cursor: not-allowed;
  }
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-loading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ====== Footer ====== */
.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 40px 32px;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.link {
  font-size: 13px;
  color: $primary;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: $primary-dark;
  }
}

.link-text {
  font-size: 13px;
  color: #999;
}

.login-footer-bar {
  margin-top: 28px;
}

.copyright {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.5px;
}

/* ====== Responsive ====== */
@media screen and (max-width: 480px) {
  .login-card {
    border-radius: 12px;
  }

  .login-header {
    padding: 24px 24px 0;
  }

  .login-form {
    padding: 24px 24px 0;
  }

  .login-footer {
    padding: 14px 24px 24px;
  }

  .login-title {
    font-size: 19px;
  }

  .login-logo-wrap {
    width: 60px;
    height: 60px;
  }
}
</style>
