<template>
  <view class="page-invite-accept">
    <view class="invite-card">
      <text class="invite-emoji">🐾</text>
      <text class="invite-title">{{ inviterName ? inviterName + ' ' : '' }}邀请你查看TA的宠物圈</text>
      <text class="invite-subtitle">同意后即可查看对方宠物圈的动态</text>

      <view class="invite-actions">
        <view class="accept-btn" @click="handleAccept">
          <text class="accept-btn-text">同意</text>
        </view>
        <view class="decline-btn" @click="handleDecline">
          <text class="decline-btn-text">暂不加入</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/services/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const inviterId = ref('')
const inviterName = ref('')

onLoad((options: any) => {
  inviterId.value = options.inviter || ''
  inviterName.value = options.name || ''

  if (!inviterId.value) {
    uni.showToast({ title: '邀请链接无效', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/pet-circle/index' }), 1500)
    return
  }

  // P54: 未登录 → 跳转登录页（带回调参数）
  const token = uni.getStorageSync('habitpet_token')
  if (!token) {
    uni.redirectTo({ url: `/pages/login/login?redirect=invite&inviter=${inviterId.value}` })
    return
  }

  // P54: 自己扫自己的码 → 直接进宠物圈
  if (userStore.userInfo?.userId === inviterId.value) {
    uni.showToast({ title: '这是你自己的邀请码', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/pet-circle/index' }), 1000)
    return
  }
})

async function handleAccept() {
  if (!inviterId.value) return

  uni.showLoading({ title: '处理中...' })
  try {
    await api.post('/invite/accept', { inviterUserId: inviterId.value })
    uni.hideLoading()
    uni.showToast({ title: '已添加好友', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/pet-circle/index' })
    }, 1200)
  } catch (err: any) {
    uni.hideLoading()
    uni.showToast({
      title: err.message || '添加失败，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
}

function handleDecline() {
  uni.navigateBack()
}
</script>

<style scoped>
.page-invite-accept {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  padding: 40rpx;
}

.invite-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  width: 100%;
  max-width: 600rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.invite-emoji {
  font-size: 100rpx;
  margin-bottom: 32rpx;
}

.invite-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 16rpx;
  line-height: 44rpx;
}

.invite-subtitle {
  font-size: 26rpx;
  color: #999;
  text-align: center;
  margin-bottom: 48rpx;
}

.invite-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  width: 100%;
}

.accept-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx;
  background: linear-gradient(135deg, #5B3E96, #7C5CBF);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(91, 62, 150, 0.3);
}

.accept-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.accept-btn-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.decline-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx;
  border-radius: 16rpx;
}

.decline-btn-text {
  font-size: 28rpx;
  color: #999;
}
</style>
