<template>
  <view class="page-settings">
    <!-- 使用原生导航栏，无需自定义 -->

    <!-- 家长审核密码 -->
    <view class="setting-card">
      <view class="setting-card-header">
        <text class="setting-card-title">🔒 家长审核密码</text>
      </view>

      <!-- 未设置密码 -->
      <view v-if="!hasPassword" class="setting-empty">
        <text class="setting-empty-text">尚未设置家长审核密码</text>
        <text class="setting-empty-hint">设置后可用于审核需要家长确认的任务</text>
        <button class="setting-btn" @click="showSetup = true">设置密码</button>
      </view>

      <!-- 已设置密码 -->
      <view v-else class="setting-info">
        <view class="setting-info-row">
          <text class="setting-info-label">密码状态</text>
          <text class="setting-info-value" style="color: #4CAF50;">已设置</text>
        </view>
        <view class="setting-info-row">
          <text class="setting-info-label">密保问题</text>
          <text class="setting-info-value">{{ securityQuestion }}</text>
        </view>
        <view class="setting-btns">
          <button class="setting-btn setting-btn--outline" @click="showChangePwd = true">修改密码</button>
          <button class="setting-btn setting-btn--outline" @click="showResetPwd = true">忘记密码</button>
        </view>
      </view>
    </view>

    <!-- 首次设置密码弹窗 -->
    <view v-if="showSetup" class="popup-overlay" @click="showSetup = false">
      <view class="popup-panel" @click.stop>
        <view class="popup-header">
          <text class="popup-title">设置家长审核密码</text>
          <view class="popup-close" @click="showSetup = false"><text>✕</text></view>
        </view>
        <scroll-view scroll-y class="popup-body">
          <view class="form">
            <view class="form-field">
              <text class="form-label">密码（6位数字）</text>
              <input class="form-input" v-model="setup.password" type="number" password maxlength="6" placeholder="请输入6位数字密码" />
            </view>
            <view class="form-field">
              <text class="form-label">确认密码</text>
              <input class="form-input" v-model="setup.confirmPassword" type="number" password maxlength="6" placeholder="请再次输入密码" />
            </view>
            <view class="form-field">
              <text class="form-label">密保问题</text>
              <picker mode="selector" :range="questions" @change="setup.question = questions[$event.detail.value]">
                <view class="field-picker">
                  <text :class="{ 'picker-placeholder': !setup.question }">{{ setup.question || '请选择密保问题' }}</text>
                  <text class="picker-arrow">›</text>
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="form-label">密保答案</text>
              <input class="form-input" v-model="setup.answer" placeholder="请输入密保答案" maxlength="30" />
            </view>
            <button class="form-btn" :disabled="!setupValid || setupLoading" :loading="setupLoading" @click="doSetup">确认设置</button>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 修改密码弹窗 -->
    <view v-if="showChangePwd" class="popup-overlay" @click="showChangePwd = false">
      <view class="popup-panel" @click.stop>
        <view class="popup-header">
          <text class="popup-title">修改密码</text>
          <view class="popup-close" @click="showChangePwd = false"><text>✕</text></view>
        </view>
        <scroll-view scroll-y class="popup-body">
          <view class="form">
            <view class="form-field">
              <text class="form-label">旧密码</text>
              <input class="form-input" v-model="changePwd.oldPassword" type="number" password maxlength="6" placeholder="请输入旧密码" />
            </view>
            <view class="form-field">
              <text class="form-label">新密码</text>
              <input class="form-input" v-model="changePwd.newPassword" type="number" password maxlength="6" placeholder="请输入新密码" />
            </view>
            <view class="form-field">
              <text class="form-label">确认新密码</text>
              <input class="form-input" v-model="changePwd.confirmPassword" type="number" password maxlength="6" placeholder="请再次输入新密码" />
            </view>
            <button class="form-btn" :disabled="!changePwdValid || changePwdLoading" :loading="changePwdLoading" @click="doChangePwd">确认修改</button>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 重置密码弹窗（通过密保） -->
    <view v-if="showResetPwd" class="popup-overlay" @click="showResetPwd = false">
      <view class="popup-panel" @click.stop>
        <view class="popup-header">
          <text class="popup-title">重置密码</text>
          <view class="popup-close" @click="showResetPwd = false"><text>✕</text></view>
        </view>
        <scroll-view scroll-y class="popup-body">
          <view class="form">
            <view class="form-field">
              <text class="form-label">密保问题：{{ securityQuestion }}</text>
              <input class="form-input" v-model="resetPwd.answer" placeholder="请输入密保答案" maxlength="30" />
            </view>
            <view class="form-field">
              <text class="form-label">新密码</text>
              <input class="form-input" v-model="resetPwd.newPassword" type="number" password maxlength="6" placeholder="请输入新密码" />
            </view>
            <view class="form-field">
              <text class="form-label">确认新密码</text>
              <input class="form-input" v-model="resetPwd.confirmPassword" type="number" password maxlength="6" placeholder="请再次输入新密码" />
            </view>
            <button class="form-btn" :disabled="!resetPwdValid || resetPwdLoading" :loading="resetPwdLoading" @click="doResetPwd">确认重置</button>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/services/api'

const questions = [
  '你的小学名称是什么？',
  '你最喜欢的宠物叫什么？',
  '你的出生城市是哪里？',
  '你妈妈的名字是什么？',
  '你最喜欢的颜色是什么？',
]

const hasPassword = ref(false)
const securityQuestion = ref('')

// 首次设置
const showSetup = ref(false)
const setupLoading = ref(false)
const setup = reactive({ password: '', confirmPassword: '', question: '', answer: '' })
const setupValid = computed(() =>
  setup.password.length === 6 &&
  setup.password === setup.confirmPassword &&
  setup.question.trim() !== '' &&
  setup.answer.trim() !== ''
)

// 修改密码
const showChangePwd = ref(false)
const changePwdLoading = ref(false)
const changePwd = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const changePwdValid = computed(() =>
  changePwd.oldPassword.length === 6 &&
  changePwd.newPassword.length === 6 &&
  changePwd.newPassword === changePwd.confirmPassword
)

// 重置密码
const showResetPwd = ref(false)
const resetPwdLoading = ref(false)
const resetPwd = reactive({ answer: '', newPassword: '', confirmPassword: '' })
const resetPwdValid = computed(() =>
  resetPwd.answer.trim() !== '' &&
  resetPwd.newPassword.length === 6 &&
  resetPwd.newPassword === resetPwd.confirmPassword
)


onMounted(async () => {
  try {
    const res = await api.get<any>('/parent-review/config')
    if (res.code === 200) {
      hasPassword.value = res.data?.hasPassword || false
      securityQuestion.value = res.data?.securityQuestion || ''
    }
  } catch {}
})

async function doSetup() {
  if (setupLoading.value) return
  if (!setupValid.value) return
  setupLoading.value = true
  try {
    const res = await api.post('/parent-review/setup', {
      password: setup.password,
      securityQuestion: setup.question,
      securityAnswer: setup.answer,
    })
    if (res.code === 200) {
      uni.showToast({ title: '密码设置成功', icon: 'success' })
      hasPassword.value = true
      securityQuestion.value = setup.question
      showSetup.value = false
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '设置失败', icon: 'none' })
  } finally { setupLoading.value = false }
}

async function doChangePwd() {
  if (changePwdLoading.value) return
  if (!changePwdValid.value) return
  changePwdLoading.value = true
  try {
    const res = await api.put('/parent-review/password', {
      oldPassword: changePwd.oldPassword,
      newPassword: changePwd.newPassword,
    })
    if (res.code === 200) {
      uni.showToast({ title: '密码修改成功', icon: 'success' })
      showChangePwd.value = false
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '修改失败', icon: 'none' })
  } finally { changePwdLoading.value = false }
}

async function doResetPwd() {
  if (resetPwdLoading.value) return
  if (!resetPwdValid.value) return
  resetPwdLoading.value = true
  try {
    const res = await api.post('/parent-review/reset', {
      securityQuestion: securityQuestion.value,
      securityAnswer: resetPwd.answer,
      newPassword: resetPwd.newPassword,
    })
    if (res.code === 200) {
      uni.showToast({ title: '密码重置成功', icon: 'success' })
      showResetPwd.value = false
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '重置失败', icon: 'none' })
  } finally { resetPwdLoading.value = false }
}
</script>

<style scoped>
.page-settings {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
}


.setting-card {
  background: #fff;
  border-radius: 16rpx;
  margin: 24rpx;
  padding: 28rpx 24rpx;
}
.setting-card-header { margin-bottom: 20rpx; }
.setting-card-title { font-size: 32rpx; font-weight: bold; color: #333; }

.setting-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  gap: 12rpx;
}
.setting-empty-text { font-size: 28rpx; color: #666; }
.setting-empty-hint { font-size: 24rpx; color: #999; text-align: center; }

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.setting-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.setting-info-label { font-size: 28rpx; color: #666; }
.setting-info-value { font-size: 28rpx; color: #333; font-weight: 500; }
.setting-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}

.setting-btn {
  padding: 16rpx 32rpx;
  background: #5B3E96;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  border: none;
}
.setting-btn::after { border: none; }
.setting-btn--outline {
  flex: 1;
  background: #F5F0FF;
  color: #5B3E96;
  border: 2rpx solid #5B3E96;
}

/* 弹窗 */
.popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.popup-panel {
  width: 100%;
  max-height: 70vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
}
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 20rpx;
  border-bottom: 2rpx solid #F0F0F0;
  flex-shrink: 0;
}
.popup-title { font-size: 32rpx; font-weight: bold; color: #333; }
.popup-close { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; font-size: 32rpx; color: #999; }
.popup-body { flex: 1; overflow-y: auto; padding: 16rpx 32rpx 48rpx; }

.form { display: flex; flex-direction: column; gap: 24rpx; }
.form-field { display: flex; flex-direction: column; gap: 12rpx; }
.form-label { font-size: 26rpx; color: #333; font-weight: 600; }
.form-input {
  width: 100%;
  height: 80rpx;
  font-size: 28rpx;
  color: #333;
  background: #F8F8F8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
}
.form-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #5B3E96;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 44rpx;
  margin-top: 8rpx;
  border: none;
}
.form-btn::after { border: none; }
.form-btn[disabled] { background: #CCC; }

.field-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  font-size: 28rpx;
  color: #333;
  background: #F8F8F8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
}
.picker-placeholder { color: #CCC; }
.picker-arrow { font-size: 36rpx; color: #CCC; }
</style>
