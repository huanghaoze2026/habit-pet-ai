<template>
  <view class="login-page">
    <view class="login-header">
      <view class="logo-area">
        <image class="logo-img" src="/static/logo-new.png" mode="aspectFit" />
        <text class="app-name">好习惯养宠</text>
        <text class="app-slogan">让孩子主动完成任务的AI伙伴</text>
      </view>
    </view>

    <!-- 步骤1:微信登录(用户主动进入登录页后点击触发) -->
    <view v-if="!showProfileSetup" class="login-body">
      <button class="wx-login-btn" :loading="isLoading" :disabled="isLoading" @tap="handleWxLogin">
        <image class="wx-icon" src="/static/wechat-icon.png" mode="aspectFit" />
        <text>微信一键登录</text>
      </button>
      <!-- 协议勾选:按钮下方,默认不勾选;点方框或"我已阅读并同意"文字切换,点《》链接看全文不切换 -->
      <view class="agreement-check">
        <view class="agreement-checkbox" :class="{ 'agreement-checkbox--on': agreed }" @tap.stop="toggleAgree">
          <text v-if="agreed" class="agreement-checkbox-tick">✓</text>
        </view>
        <view class="agreement-check-text">
          <text @tap.stop="toggleAgree">我已阅读并同意</text>
          <text class="link" @tap.stop="showAgreement('privacy')">《隐私政策》</text>
          <text>和</text>
          <text class="link" @tap.stop="showAgreement('terms')">《用户协议》</text>
        </view>
      </view>
      <!-- 游客入口:符合规范"取消/拒绝登录",无需登录即可先体验(清态进任务页) -->
      <view class="guest-entry" @tap="enterAsGuest">暂不设置,直接进入</view>
      <view v-if="errorMsg" class="error-tip"><text>{{ errorMsg }}</text></view>
    </view>

    <!-- 步骤2:完善资料(登录成功后,作为本次登录动作的一部分,非启动强制弹窗) -->
    <view v-else class="profile-body">
      <text class="profile-title">完善资料</text>

      <!-- 头像(可选) -->
      <view class="profile-avatar-section">
        <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image v-if="profileForm.avatarUrl" :src="profileForm.avatarUrl" class="avatar-preview" mode="aspectFill" />
          <view v-else class="avatar-placeholder"><text class="avatar-placeholder-icon">📷</text><text class="avatar-placeholder-text">选择头像</text></view>
        </button>
      </view>

      <!-- 昵称(微信自动填写) -->
      <view class="profile-nickname-section">
        <text class="profile-label">昵称</text>
        <input class="profile-nickname-input" type="nickname" v-model="profileForm.nickname" placeholder="点击输入,微信会自动填写昵称" maxlength="20" @blur="onNicknameBlur" />
        <text class="profile-nickname-hint">👆 点击输入框,键盘顶部会显示"使用微信昵称"</text>
      </view>

      <!-- 手机号授权(可选,拒绝也能继续) -->
      <button class="phone-btn" :class="{ 'phone-btn--bound': phoneBound }" open-type="getPhoneNumber" @getphonenumber="onGetPhone">
        <text>{{ phoneBound ? '✓ 手机号已授权' : '授权手机号(可选)' }}</text>
      </button>

      <button class="profile-submit-btn" :loading="profileSubmitting" :disabled="profileSubmitting" @tap="submitProfile">
        <text v-if="profileSubmitting">保存中...</text>
        <text v-else>进入应用</text>
      </button>
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
// 关键:默认 false -- 登录页只有在用户【主动点击微信登录】成功后才展示"完善资料"区,
// 不会在 App 启动 / 页面 onLoad 时自动弹出。
const showProfileSetup = ref(false)
const profileSubmitting = ref(false)
const phoneBound = ref(false)
// 协议勾选框状态（默认不勾选，需用户主动勾选同意后才能登录）
const agreed = ref(false)

onLoad((options: any) => {
  // 仅处理带参回跳(邀请),不做任何自动登录 / 自动弹窗
  if (options?.redirect === 'invite') {
    savePendingInviter(options?.inviter || '')
  }
})

const profileForm = reactive({ avatarUrl: '', nickname: '' })

async function goAfterLogin() {
  // 存储式邀请:若有待处理邀请,登录后自动建好友并进宠物圈
  const pending = uni.getStorageSync('pendingInviterId')
  if (pending) {
    try { await tryAcceptPendingInvite(userStore.userId) } catch (e) { console.warn('[Login] 处理邀请失败(忽略):', e) }
    uni.switchTab({ url: '/pages/pet-circle/index' })
    return
  }
  // 无邀请:回到任务页(游客/登录态共用的首页)
  uni.switchTab({ url: '/pages/task/task' })
}

// 微信一键登录（点击按钮 → 检查协议 → 用 tap 手势直调 getUserProfile 自动填头像昵称 → wxLogin 换 token）
async function handleWxLogin() {
  if (isLoading.value) return
  // #1 协议未勾选：拦截
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并勾选同意《隐私政策》和《用户协议》', icon: 'none' })
    return
  }
  isLoading.value = true; errorMsg.value = ''

  // #2 必须在 tap 手势同步链中【第一步】调用 getUserProfile，前面不能 await 任何异步操作，
  //    否则微信会报 "getUserProfile:fail can only be invoked by user TAP gesture"
  //    兼容说明：新基础库下 getUserProfile 可能返回匿名（灰头像/"微信用户"），照填即可
  try {
    await new Promise<void>((resolve) => {
      uni.getUserProfile({
        desc: '用于完善宠物主人资料',
        success: (res: any) => {
          const info = res?.userInfo || {}
          if (info.avatarUrl) profileForm.avatarUrl = info.avatarUrl
          if (info.nickName) profileForm.nickname = info.nickName
          resolve()
        },
        fail: (err: any) => {
          console.log('[Login] getUserProfile 未成功，降级手动填写:', err)
          resolve() // 拒绝也静默继续，不阻断登录
        },
      })
    })
  } catch {
    // 防御：极少数情况 Promise reject，静默继续
  }

  // #3 微信登录换 token
  try {
    const res = await wxLogin()
    if (res.code === 200 && res.data) {
      const { token, userId, nickname, avatar, role, isNewUser } = res.data
      userStore.setLoginInfo({ token, userId, nickname: nickname || '', avatar: avatar || '', role, isNewUser })
      // getUserProfile 取得的值优先（用户授权选择）；仅当 profileForm 仍为空时才用后端数据回填
      if (!profileForm.nickname && nickname) profileForm.nickname = nickname
      if (!profileForm.avatarUrl && avatar) profileForm.avatarUrl = avatar
      // 登录成功后展示"完善资料"区（昵称/头像已自动填入，可直接进入或修改）
      showProfileSetup.value = true
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

// 协议勾选切换（仅由方框 / "我已阅读并同意"纯文字触发，与《》链接分离）
function toggleAgree() {
  agreed.value = !agreed.value
}

// 游客入口：显式清空登录态（token/用户/宝贝/宠物）后 reLaunch 到任务页，
// 确保离开登录页。采用 store.clearSession()（只清态不跳转）+ 自行 reLaunch，
// 避免与 logout 内部 switchTab 重复/竞争导航。
function enterAsGuest() {
  try { userStore.clearSession() } catch (e) { console.warn('[Login] 清游客态异常(忽略):', e) }
  // reLaunch 比 switchTab 更强制：清空页面栈并进入任务页 tab，确保离开登录页
  uni.reLaunch({
    url: '/pages/task/task',
    fail: (e) => {
      console.error('[Login] reLaunch 任务页失败，回退 switchTab', e)
      uni.switchTab({ url: '/pages/task/task' })
    }
  })
}

function onChooseAvatar(e: any) {
  const { avatarUrl } = e.detail
  if (avatarUrl) profileForm.avatarUrl = avatarUrl
}

function onNicknameBlur(e: any) {
  const v = e.detail?.value || profileForm.nickname
  if (v && v.trim() && v !== '微信用户') profileForm.nickname = v.trim()
}

// 手机号授权(可选):拿 e.detail.code → /auth/bind-phone。
// 用户点"拒绝"或失败 → 静默跳过,不影响登录、不报错、可继续。
async function onGetPhone(e: any) {
  const code = e?.detail?.code
  if (!code) {
    // 用户拒绝授权 / 未拿到 code -- 静默跳过
    console.log('[Login] 用户未授权手机号,跳过')
    return
  }
  try {
    await api.post('/auth/bind-phone', { code })
    phoneBound.value = true
    uni.showToast({ title: '手机号已授权', icon: 'none' })
  } catch (err) {
    // 绑定失败静默处理,不打断登录流程
    console.warn('[Login] 绑定手机号失败(忽略):', err)
  }
}

// 完成:保存昵称/头像(有则存),然后进入应用。
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
    uni.showToast({ title: '保存失败,请重试', icon: 'none' })
  } finally {
    profileSubmitting.value = false
  }
}

function showAgreement(type: string) {
  uni.navigateTo({
    url: type === 'privacy' ? '/pages/privacy/privacy' : '/pages/terms/terms',
    fail: (e) => {
      console.error('[Login] 打开协议失败', e)
      uni.showToast({ title: '打开失败，请重试', icon: 'none' })
    }
  })
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
.agreement-check { display:flex; align-items:flex-start; margin-top:32rpx; width:100%; padding:4rpx 0; }
.agreement-checkbox { flex:0 0 auto; width:38rpx; height:38rpx; margin-right:14rpx; border:2rpx solid #B7A6DC; border-radius:8rpx; background:#fff; display:flex; align-items:center; justify-content:center; box-sizing:border-box; }
.agreement-checkbox--on { background:#5B3E96; border-color:#5B3E96; }
.agreement-checkbox-tick { color:#fff; font-size:26rpx; line-height:1; }
.agreement-check-text { flex:1; font-size:28rpx; color:#666; line-height:1.5; }
.agreement-check-text .link { color:#5B3E96; }
.guest-entry { margin-top:40rpx; font-size:28rpx; color:#999; text-decoration:underline; }
.error-tip { margin-top:24rpx; padding:16rpx 32rpx; background:rgba(255,59,48,0.1); border-radius:12rpx; font-size:24rpx; color:#FF3B30; text-align:center; }
.login-footer { position:absolute; bottom:60rpx; }
.version { font-size:22rpx; color:#CCC; }

/* 完善资料区(登录成功后内联展示,非启动弹窗) */
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
</style>
