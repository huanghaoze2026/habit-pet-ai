<template>
  <view class="page-index">
    <view class="splash">
      <image class="splash-logo" src="/static/logo-dragon.png" mode="aspectFit" />
      <text class="splash-title">养成系AI宠物</text>
      <text class="splash-subtitle">好习惯养宠</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { TOKEN_KEY } from '@/utils/constants'

// P59: 简化启动逻辑，避免 wxLogin() 阻塞导致白屏
onShow(() => {
  const token = uni.getStorageSync(TOKEN_KEY)
  
  if (token) {
    // 有缓存的 token，直接进入任务页（不等待 wxLogin 避免阻塞）
    uni.switchTab({ url: '/pages/task/task' })
  } else {
    // 无 token → 跳转登录页
    uni.redirectTo({ url: '/pages/login/login' })
  }
})
</script>

<style scoped>
.page-index {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #5B3E96 0%, #FF8E9E 100%);
}
.splash {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.splash-logo {
  width: 280rpx;
  height: 280rpx;
  margin-bottom: 24rpx;
}
.splash-title {
  font-size: 56rpx;
  color: #ffffff;
  font-weight: bold;
}
.splash-subtitle {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
}
</style>
