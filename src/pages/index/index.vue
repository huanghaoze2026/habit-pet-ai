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

// 审核整改（案例3）：真·游客模式。
// 启动首屏不做任何自动登录、不弹授权、不跳登录页。
// 无论有没有 token，都以当前身份直接进入任务页浏览：
//   - 有 token：登录态浏览
//   - 无 token：游客态浏览（接口拿空态即可，页面不会被弹去登录）
// 登录改由用户在"我的"或任务操作时【主动触发】。
onShow(() => {
  uni.switchTab({ url: '/pages/task/task' })
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
