<template>
  <view class="page-guide">
    <!-- 顶部栏 -->
    <view class="top-bar" :style="{ paddingTop: (statusBarH || 20) + 'px' }">
      <view class="top-row">
        <view class="back-btn" @click="goBack">
          <text>← 返回</text>
        </view>
        <text class="top-title">宠物进化说明</text>
        <view class="top-right">
          <text v-if="scale > 1" class="zoom-reset" @click="resetZoom">重置</text>
        </view>
      </view>
    </view>

    <!-- 缩放提示 -->
    <view v-if="showHint" class="zoom-hint">
      <text>👆 双指缩放查看详情 / 点击图片全屏预览</text>
    </view>

    <!-- 图片容器 -->
    <view class="img-wrap">
      <image
        :src="imgSrc"
        mode="widthFix"
        class="guide-img"
        :style="{ transform: `scale(${scale})`, transformOrigin: 'center top' }"
        @tap="previewImage"
        @error="onError"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const imgSrc = '/static/evolution-guide.png'
const statusBarH = ref(20)
const scale = ref(1)
const showHint = ref(true)
let lastDist = 0

try { statusBarH.value = uni.getSystemInfoSync().statusBarHeight || 20 } catch {}

const goBack = () => uni.navigateBack()

const previewImage = () => {
  uni.previewImage({
    urls: [imgSrc],
    current: imgSrc,
  })
}

const resetZoom = () => {
  scale.value = 1
}

const onError = () => {
  // 图片加载失败时使用备用方式
}

// 隐藏提示
onMounted(() => {
  setTimeout(() => { showHint.value = false }, 4000)
})

// 双指缩放：通过平台API不支持直接在uniapp中做pinch gesture
// 替代方案：点击图片使用wx.previewImage获得原生缩放体验
</script>

<style scoped>
.page-guide {
  min-height: 100vh;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 24rpx;
  height: 88rpx;
}

.back-btn {
  font-size: 28rpx;
  color: #A78BFA;
  padding: 8rpx 0;
}

.top-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #fff;
  letter-spacing: 2rpx;
}

.top-right {
  width: 80rpx;
  text-align: right;
}

.zoom-reset {
  font-size: 24rpx;
  color: #FF6B6B;
  padding: 8rpx 16rpx;
  background: rgba(255, 107, 107, 0.15);
  border-radius: 8rpx;
}

.zoom-hint {
  text-align: center;
  padding: 16rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.img-wrap {
  flex: 1;
  display: flex;
  justify-content: center;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.guide-img {
  width: 100%;
  transition: transform 0.3s ease;
}
</style>
