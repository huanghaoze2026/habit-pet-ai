<template>
  <view class="login-page">
    <view class="login-header">
      <view class="logo-area">
        <image class="logo-img" src="/static/logo-new.png" mode="aspectFit" />
        <text class="app-name">打卡养AI宠物</text>
        <text class="app-slogan">让孩子主动完成任务的AI伙伴</text>
      </view>
    </view>

    <view class="login-body">
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
    <view class="login-footer"><text class="version">v1.0.1</text></view>

    <!-- 资料填写弹窗 -->
    <view v-if="showProfileSetup" class="popup-mask" @tap="preventClose">
      <view class="popup-content" @tap.stop>
        <view class="popup-header"><text class="popup-title">完善个人资料</text></view>
        <view class="popup-body">
          <view class="profile-avatar-section">
            <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
              <image v-if="profileForm.avatarUrl" :src="profileForm.avatarUrl" class="avatar-preview" mode="aspectFill" />
              <view v-else class="avatar-placeholder"><text class="avatar-placeholder-icon">📷</text><text class="avatar-placeholder-text">点击设置头像</text></view>
            </button>
          </view>
          <view class="profile-nickname-section">
            <text class="profile-label">昵称</text>
            <input class="profile-nickname-input" type="nickname" v-model="profileForm.nickname" placeholder="点击输入昵称（微信将自动填入）" maxlength="20" @blur="onNicknameBlur" @focus="onNicknameFocus" />
            <text v-if="!profileForm.nickname" class="profile-nickname-hint">👆 点击输入框，键盘顶部会显示"使用微信昵称"</text>
          </view>
          <button class="profile-submit-btn" :class="{'profile-submit-btn--auto':autoCountdown>0}" :disabled="!canSubmit" :loading="profileSubmitting" @tap="submitProfile">
            <text v-if="profileSubmitting">保存中...</text>
            <text v-else-if="autoCountdown>0">✅ 将在 {{ autoCountdown }}s 后自动完成</text>
            <text v-else>完成</text>
          </button>
          <text class="profile-skip" @tap="skipProfile">暂不设置，以后再说</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { wxLogin, updateProfile } from '@/services/auth'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isLoading = ref(false)
const errorMsg = ref('')
const showProfileSetup = ref(false)
const profileSubmitting = ref(false)
const autoCountdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

// P54: 邀请回调
const redirectAction = ref('')
const redirectInviter = ref('')

onLoad((options: any) => {
  if (options?.redirect === 'invite') {
    redirectAction.value = 'invite'
    redirectInviter.value = options?.inviter || ''
  }
})

const profileForm = reactive({ avatarUrl: '', nickname: '' })
const canSubmit = computed(() => !!profileForm.avatarUrl && !!profileForm.nickname)

watch(
  () => [profileForm.avatarUrl, profileForm.nickname] as const,
  ([avatar, nickname]) => {
    if (avatar && nickname && autoCountdown.value === 0) {
      autoCountdown.value = 2
      countdownTimer = setInterval(() => {
        autoCountdown.value--
        if (autoCountdown.value <= 0) { clearInterval(countdownTimer!); countdownTimer = null; submitProfile() }
      }, 1000)
    }
  }
)

onUnmounted(() => { if (countdownTimer) clearInterval(countdownTimer) })

function goAfterLogin() {
  if (redirectAction.value === 'invite' && redirectInviter.value) {
    uni.redirectTo({ url: `/pages/invite/accept?inviter=${redirectInviter.value}` })
    return
  }
  uni.switchTab({ url: '/pages/task/task' })
}

async function handleWxLogin() {
  if (isLoading.value) return
  isLoading.value = true; errorMsg.value = ''
  try {
    const res = await wxLogin()
    if (res.code === 200 && res.data) {
      const { token, userId, nickname, avatar, role, isNewUser } = res.data
      userStore.setLoginInfo({ token, userId, nickname: nickname || '', avatar: avatar || '', role, isNewUser })
      if (isNewUser) { showProfileSetup.value = true; isLoading.value = false; return }
      goAfterLogin()
    } else { errorMsg.value = res.message || '登录失败，请重试' }
  } catch (e: unknown) {
    const msg = (e as any)?.message || (e as any)?.errMsg || '网络异常，请检查网络后重试'
    errorMsg.value = msg
  }
  finally { isLoading.value = false }
}

function onChooseAvatar(e: any) { const { avatarUrl } = e.detail; if (avatarUrl) profileForm.avatarUrl = avatarUrl }
function onNicknameFocus() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; autoCountdown.value = 0 } }
function onNicknameBlur(e: any) { const v = e.detail?.value || profileForm.nickname; if (v && v.trim() && v !== '微信用户') profileForm.nickname = v.trim() }

async function submitProfile() {
  if (!canSubmit.value || profileSubmitting.value) return
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  autoCountdown.value = 0; profileSubmitting.value = true
  try {
    await updateProfile({ nickname: profileForm.nickname, avatar: profileForm.avatarUrl })
    if (userStore.userInfo) userStore.updateUserInfo({ nickname: profileForm.nickname, avatar: profileForm.avatarUrl })
    showProfileSetup.value = false
    goAfterLogin()
  } catch { uni.showToast({ title: '保存失败，请重试', icon: 'none' }) }
  finally { profileSubmitting.value = false }
}

function skipProfile() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null } showProfileSetup.value = false; goAfterLogin() }
function preventClose() {}
function showAgreement(type: string) { uni.navigateTo({ url: type === 'privacy' ? '/pages/privacy/privacy' : '/pages/terms/terms' }) }
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
.popup-mask { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:999; display:flex; align-items:center; justify-content:center; padding:40rpx; }
.popup-content { width:100%; max-width:560rpx; background:#fff; border-radius:24rpx; padding:48rpx 36rpx 36rpx; display:flex; flex-direction:column; align-items:center; }
.popup-header { margin-bottom:36rpx; }
.popup-title { font-size:34rpx; font-weight:bold; color:#333; }
.popup-body { width:100%; display:flex; flex-direction:column; align-items:center; gap:32rpx; }
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
.profile-submit-btn { width:100%; height:88rpx; line-height:88rpx; background:#5B3E96; color:#fff; font-size:32rpx; font-weight:bold; border-radius:44rpx; border:none; transition:all 0.3s; }
.profile-submit-btn::after { border:none; }
.profile-submit-btn[disabled] { background:#CCC; }
.profile-submit-btn--auto { background:#4CAF50; }
.profile-skip { font-size:24rpx; color:#999; text-decoration:underline; }
</style>
