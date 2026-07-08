<template>
  <view class="login-page">
    <view class="login-header">
      <view class="logo-area">
        <image class="logo-img" src="/static/logo-new.png" mode="aspectFit" />
        <text class="app-name">好习惯养宠</text>
        <text class="app-slogan">让孩子主动完成任务的AI伙伴</text>
      </view>
    </view>

    <!-- 步骤1：微信登录（用户主动进入登录页后点击触发） -->
    <view v-if="!showProfileSetup" class="login-body">
      <button class="wx-login-btn" :loading="isLoading" :disabled="isLoading" @tap="handleWxLogin">
        <image class="wx-icon" src="/static/wechat-icon.png" mode="aspectFit" />
        <text>微信一键登录</text>
      </button>
      <view class="agreement-text">
        <text>登录即表示同意</text>
        <text class="link" @tap.stop="showAgreement('privacy')">《隐私政策》</text>
        <text>和</text>
        <text class="link" @tap.stop="showAgreement('terms')">《用户协议》</text>
      </view>
      <view v-if="errorMsg" class="error-tip"><text>{{ errorMsg }}</text></view>
    </view>

    <!-- 步骤2：完善资料（登录成功后，作为本次登录动作的一部分，非启动强制弹窗） -->
    <view v-else class="profile-body">
      <text class="profile-title">完善资料</text>

      <!-- 头像（可选） -->
      <view class="profile-avatar-section">
        <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image v-if="profileForm.avatarUrl" :src="profileForm.avatarUrl" class="avatar-preview" mode="aspectFill" />
          <view v-else class="avatar-placeholder"><text class="avatar-placeholder-icon">📷</text><text class="avatar-placeholder-text">选择头像</text></view>
        </button>
      </view>

      <!-- 昵称（微信自动填写） -->
      <view class="profile-nickname-section">
        <text class="profile-label">昵称</text>
        <input class="profile-nickname-input" type="nickname" v-model="profileForm.nickname" placeholder="点击输入，微信会自动填写昵称" maxlength="20" @blur="onNicknameBlur" />
        <text class="profile-nickname-hint">👆 点击输入框，键盘顶部会显示“使用微信昵称”</text>
      </view>

      <!-- 手机号授权（可选，拒绝也能继续） -->
      <button class="phone-btn" :class="{ 'phone-btn--bound': phoneBound }" open-type="getPhoneNumber" @getphonenumber="onGetPhone">
        <text>{{ phoneBound ? '✓ 手机号已授权' : '授权手机号（可选）' }}</text>
      </button>

      <button class="profile-submit-btn" :loading="profileSubmitting" :disabled="profileSubmitting" @tap="submitProfile">
        <text v-if="profileSubmitting">保存中...</text>
        <text v-else>进入应用</text>
      </button>
      <text class="profile-skip" @tap="skipProfile">暂不设置，直接进入</text>
    </view>

    <!-- 首次登录：自定义授权弹窗（用户手势触发 getUserProfile，不用 uni.showModal —— 其回调不算用户手势，会导致 getUserProfile 失败） -->
    <view v-if="showAuthModal" class="auth-mask">
      <view class="auth-modal">
        <text class="auth-modal-title">快速完善资料</text>
        <text class="auth-modal-desc">获取你的微信头像和昵称，快速完善宠物主人资料？</text>
        <view class="auth-modal-btns">
          <button class="auth-btn auth-btn--cancel" @tap="cancelAuthFill">取消</button>
          <!-- 「允许」必须是真实按钮的 @tap，才构成用户手势，getUserProfile 才可调用 -->
          <button class="auth-btn auth-btn--allow" @tap="autoFillProfile">允许</button>
        </view>
      </view>
    </view>

    <view class="login-footer"><text class="version">v1.0.1</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { wxLogin, updateProfile } from '@/services/auth'
import { api } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { tryAcceptPendingInvite, savePendingInviter } from '@/utils/invite'

const userStore = useUserStore()
const isLoading = ref(false)
const errorMsg = ref('')
// 关键：默认 false —— 登录页只有在用户【主动点击微信登录】成功后才展示“完善资料”区，
// 不会在 App 启动 / 页面 onLoad 时自动弹出。
const showProfileSetup = ref(false)
const profileSubmitting = ref(false)
const phoneBound = ref(false)
// 首次登录授权弹窗：仅新用户第一次完善资料时出现一次
const showAuthModal = ref(false)

onLoad((options: any) => {
  // 仅处理带参回跳（邀请），不做任何自动登录 / 自动弹窗
  if (options?.redirect === 'invite') {
    savePendingInviter(options?.inviter || '')
  }
})

const profileForm = reactive({ avatarUrl: '', nickname: '' })

async function goAfterLogin() {
  // 存储式邀请：若有待处理邀请，登录后自动建好友并进宠物圈
  const pending = uni.getStorageSync('pendingInviterId')
  if (pending) {
    try { await tryAcceptPendingInvite(userStore.userId) } catch (e) { console.warn('[Login] 处理邀请失败(忽略):', e) }
    uni.switchTab({ url: '/pages/pet-circle/index' })
    return
  }
  // 无邀请：回到任务页（游客/登录态共用的首页）
  uni.switchTab({ url: '/pages/task/task' })
}

// 微信一键登录：uni.login 拿 code → /auth/wx-login → 存登录态
async function handleWxLogin() {
  if (isLoading.value) return
  isLoading.value = true; errorMsg.value = ''
  try {
    const res = await wxLogin()
    if (res.code === 200 && res.data) {
      const { token, userId, nickname, avatar, role, isNewUser } = res.data
      userStore.setLoginInfo({ token, userId, nickname: nickname || '', avatar: avatar || '', role, isNewUser })
      // 预填后端已有的昵称 / 头像（老用户直接复用，无需重复填写）
      profileForm.nickname = nickname || ''
      profileForm.avatarUrl = avatar || ''
      // 登录成功后展示“完善资料”区（作为登录动作的一部分）
      showProfileSetup.value = true
      // 仅【第一次登录的新用户】、且后端尚无头像/昵称时，弹一次自定义授权弹窗，
      // 引导用户手势触发 getUserProfile 自动填入头像/昵称；老用户/已设置过的不弹。
      if (isNewUser && !profileForm.avatarUrl && !profileForm.nickname) {
        showAuthModal.value = true
      }
    } else {
      errorMsg.value = res.message || '登录失败，请重试'
    }
  } catch (e: unknown) {
    const msg = (e as any)?.message || (e as any)?.errMsg || '网络异常，请检查网络后重试'
    errorMsg.value = msg
  } finally {
    isLoading.value = false
  }
}

// 「允许」：真实按钮手势触发 getUserProfile —— 成功则自动填入头像/昵称；
// 失败/拒绝则静默降级（保留手动 chooseAvatar + 昵称输入）。无论结果，关闭弹窗并展示完善资料区。
// ⚠️ 平台限制：新基础库下 getUserProfile 可能返回匿名（灰色头像 / “微信用户”），此为微信限制，遇匿名也照填，用户可再手动改。
function autoFillProfile() {
  uni.getUserProfile({
    desc: '用于完善宠物主人资料',
    success: (res: any) => {
      const info = res?.userInfo || {}
      if (info.avatarUrl) profileForm.avatarUrl = info.avatarUrl
      if (info.nickName) profileForm.nickname = info.nickName
    },
    fail: (err: any) => {
      // 用户拒绝 / 接口失败 —— 静默降级为手动填写
      console.log('[Login] getUserProfile 未成功，降级手动填写:', err)
    },
    complete: () => {
      // 无论成功与否都关闭授权弹窗，露出完善资料区
      showAuthModal.value = false
    },
  })
}

// 「取消」：不获取，直接关闭弹窗，展示完善资料区（用户手动设置）
function cancelAuthFill() {
  showAuthModal.value = false
}

function onChooseAvatar(e: any) {
  const { avatarUrl } = e.detail
  if (avatarUrl) profileForm.avatarUrl = avatarUrl
}

function onNicknameBlur(e: any) {
  const v = e.detail?.value || profileForm.nickname
  if (v && v.trim() && v !== '微信用户') profileForm.nickname = v.trim()
}

// 手机号授权（可选）：拿 e.detail.code → /auth/bind-phone。
// 用户点“拒绝”或失败 → 静默跳过，不影响登录、不报错、可继续。
async function onGetPhone(e: any) {
  const code = e?.detail?.code
  if (!code) {
    // 用户拒绝授权 / 未拿到 code —— 静默跳过
    console.log('[Login] 用户未授权手机号，跳过')
    return
  }
  try {
    await api.post('/auth/bind-phone', { code })
    phoneBound.value = true
    uni.showToast({ title: '手机号已授权', icon: 'none' })
  } catch (err) {
    // 绑定失败静默处理，不打断登录流程
    console.warn('[Login] 绑定手机号失败(忽略):', err)
  }
}

// 完成：保存昵称/头像（有则存），然后进入应用；允许“暂不设置”直接进入。
async function submitProfile() {
  if (profileSubmitting.value) return
  profileSubmitting.value = true
  try {
    const payload: { nickname?: string; avatar?: string } = {}
    if (profileForm.nickname && profileForm.nickname.trim()) payload.nickname = profileForm.nickname.trim()
    if (profileForm.avatarUrl) payload.avatar = profileForm.avatarUrl
    if (payload.nickname || payload.avatar) {
      await updateProfile(payload)
      if (userStore.userInfo) {
        userStore.updateUserInfo({
          nickname: payload.nickname ?? userStore.userInfo.nickname,
          avatar: payload.avatar ?? userStore.userInfo.avatar,
        })
      }
    }
    await goAfterLogin()
  } catch {
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  } finally {
    profileSubmitting.value = false
  }
}

function skipProfile() { goAfterLogin() }
function showAgreement(type: string) {
  uni.navigateTo({ url: type === 'privacy' ? '/pages/privacy/privacy' : '/pages/terms/terms' })
}
</script>

<style scoped>
.login-page { display:flex; flex-direction:column; min-height:100vh; background:linear-gradient(180deg,#F5F0FF,#EBE0FF,#D4C5F0); align-items:center; justify-content:center; padding:60rpx 40rpx; box-sizing:border-box; }
.login-header { text-align:center; margin-bottom:80rpx; }
.logo-area { display:flex; flex-direction:column; align-items:center; gap:16rpx; }
.logo-img { width:160rpx; height:160rpx; border-radius:40rpx; box-shadow:0 8rpx 32rpx rgba(91,62,150,0.2); }
.app-name { font-size:40rpx; font-weight:bold; color:#333; margin-top:8rpx; }
.app-slogan { font-size:26rpx; color:#666; }
.login-body { display:flex; flex-direction:column; align-items:center; width:100%; max-width:500rpx; }
.wx-login-btn { display:flex; align-items:center; justify-content:center; gap:16rpx; width:100%; height:96rpx; background:#07C160; border-radius:48rpx; font-size:32rpx; color:#fff; font-weight:bold; border:none; box-shadow:0 8rpx 24rpx rgba(7,193,96,0.3); }
.wx-login-btn::after { border:none; }
.wx-login-btn[disabled] { background:#95ECB9; }
.wx-icon { width:40rpx; height:40rpx; }
.agreement-text { margin-top:32rpx; font-size:22rpx; color:#999; text-align:center; }
.agreement-text .link { color:#5B3E96; }
.error-tip { margin-top:24rpx; padding:16rpx 32rpx; background:rgba(255,59,48,0.1); border-radius:12rpx; font-size:24rpx; color:#FF3B30; text-align:center; }
.login-footer { position:absolute; bottom:60rpx; }
.version { font-size:22rpx; color:#CCC; }

/* 完善资料区（登录成功后内联展示，非启动弹窗） */
.profile-body { width:100%; max-width:560rpx; background:#fff; border-radius:24rpx; padding:48rpx 36rpx 36rpx; display:flex; flex-direction:column; align-items:center; gap:32rpx; box-shadow:0 8rpx 32rpx rgba(91,62,150,0.12); }
.profile-title { font-size:34rpx; font-weight:bold; color:#333; }
.profile-avatar-section { display:flex; justify-content:center; }
.avatar-btn { width:160rpx; height:160rpx; border-radius:50%; overflow:hidden; padding:0; margin:0; border:4rpx dashed #D4C5F0; background:#F8F8F8; display:flex; align-items:center; justify-content:center; }
.avatar-btn::after { border:none; }
.avatar-preview { width:160rpx; height:160rpx; border-radius:50%; }
.avatar-placeholder { display:flex; flex-direction:column; align-items:center; gap:8rpx; }
.avatar-placeholder-icon { font-size:48rpx; }
.avatar-placeholder-text { font-size:22rpx; color:#999; }
.profile-nickname-section { width:100%; display:flex; flex-direction:column; gap:8rpx; }
.profile-label { font-size:26rpx; color:#333; font-weight:600; }
.profile-nickname-input { width:100%; height:80rpx; border:2rpx solid #E0E0E0; border-radius:12rpx; padding:0 24rpx; font-size:28rpx; color:#333; box-sizing:border-box; }
.profile-nickname-input:focus { border-color:#5B3E96; }
.profile-nickname-hint { font-size:22rpx; color:#5B3E96; padding-left:4rpx; }
.phone-btn { width:100%; height:80rpx; line-height:80rpx; background:#F5F0FF; color:#5B3E96; font-size:28rpx; font-weight:600; border-radius:44rpx; border:2rpx solid #D4C5F0; }
.phone-btn::after { border:none; }
.phone-btn--bound { background:#E8F5E9; color:#2E7D32; border-color:#A5D6A7; }
.profile-submit-btn { width:100%; height:88rpx; line-height:88rpx; background:#5B3E96; color:#fff; font-size:32rpx; font-weight:bold; border-radius:44rpx; border:none; }
.profile-submit-btn::after { border:none; }
.profile-submit-btn[disabled] { background:#CCC; }
.profile-skip { font-size:24rpx; color:#999; text-decoration:underline; }

/* 首次登录自定义授权弹窗（覆盖层，非 uni.showModal） */
.auth-mask { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:999; padding:0 60rpx; box-sizing:border-box; }
.auth-modal { width:100%; max-width:560rpx; background:#fff; border-radius:24rpx; padding:48rpx 40rpx 32rpx; display:flex; flex-direction:column; align-items:center; gap:20rpx; box-shadow:0 12rpx 40rpx rgba(0,0,0,0.2); }
.auth-modal-title { font-size:34rpx; font-weight:bold; color:#333; }
.auth-modal-desc { font-size:28rpx; color:#666; text-align:center; line-height:1.5; }
.auth-modal-btns { display:flex; width:100%; gap:24rpx; margin-top:12rpx; }
.auth-btn { flex:1; height:84rpx; line-height:84rpx; font-size:30rpx; font-weight:600; border-radius:44rpx; border:none; }
.auth-btn::after { border:none; }
.auth-btn--cancel { background:#F2F2F2; color:#666; }
.auth-btn--allow { background:#5B3E96; color:#fff; }
</style>
