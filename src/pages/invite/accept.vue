<template>
  <view class="page-invite-accept">
    <view class="invite-card">
      <text class="invite-emoji">🐾</text>
      <text class="invite-title">正在处理邀请…</text>
      <text class="invite-subtitle">请稍候，正在为你确认好友邀请</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { captureInviterFromOptions, tryAcceptPendingInvite } from '@/utils/invite'

const userStore = useUserStore()

function goCircle(delay = 800) {
  setTimeout(() => uni.switchTab({ url: '/pages/pet-circle/index' }), delay)
}

onLoad((options: any) => {
  // 1) 尽早存储分享人ID(兼容 分享链接 inviter 与 扫码 scene)
  captureInviterFromOptions(options)

  // 2) 未登录 → reLaunch 到登录页（不必带参，inviter 已在存储里）
  const token = uni.getStorageSync('habitpet_token')
  if (!token) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }

  // 3) 已登录 → 免弹窗直接建立好友，随后回宠物圈
  tryAcceptPendingInvite(userStore.userInfo?.userId)
  goCircle(800)
})
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
}
</style>
