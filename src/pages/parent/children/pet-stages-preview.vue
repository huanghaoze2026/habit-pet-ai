<template>
  <view class="preview-page">
    <!-- 顶部标题栏（自定义导航） -->
    <view class="top-bar">
      <view class="top-left" @tap="goBack">
        <text class="back-arrow">‹</text>
        <text class="back-text">返回</text>
      </view>
      <text class="top-title">{{ speciesName || '宠物形态预览' }}</text>
      <view class="top-right" />
    </view>

    <!-- 形态图片滚动区 -->
    <scroll-view class="stage-scroll" scroll-y :style="{ height: scrollHeight + 'px' }">
      <view class="stage-list">
        <view v-for="stage in stages" :key="stage.key" class="stage-item">
          <view class="stage-card">
            <image
              :src="getImageUrl(stage.key)"
              class="stage-image"
              mode="widthFix"
              :show-menu-by-longpress="true"
            />
            <view class="stage-label-row">
              <view class="stage-dot" />
              <text class="stage-label">{{ stage.label }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>


  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

interface StageItem {
  key: string
  label: string
}

const speciesId = ref('')
const speciesName = ref('')
const scrollHeight = ref(0)

const stages: StageItem[] = [
  { key: 'egg', label: '🥚 蛋仔期' },
  { key: 'baby', label: '👶 幼体期' },
  { key: 'juvenile', label: '🌱 成长期' },
  { key: 'evolved', label: '⚡ 进化期' },
  { key: 'ultimate', label: '👑 究极期' },
]

onLoad((options: any) => {
  speciesId.value = options?.speciesId || ''
  speciesName.value = decodeURIComponent(options?.speciesName || '')
})

onMounted(() => {
  const systemInfo = uni.getWindowInfo?.() || uni.getSystemInfoSync()
  // 顶部栏约 88rpx + 状态栏
  const topBarH = (systemInfo.statusBarHeight || 20) + 44
  scrollHeight.value = (systemInfo.windowHeight || 667) - topBarH
})

function getImageUrl(stageKey: string): string {
  return `https://stage-api.lanyunke.com/uploads/sprites/${speciesId.value}/${stageKey}_idle.png`
}

function goBack(): void {
  uni.navigateBack()
}


</script>

<style lang="scss" scoped>
.preview-page {
  min-height: 100vh;
  background: #f5f0ff;
  display: flex;
  flex-direction: column;
}

// ===== 顶部导航栏 =====
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: env(safe-area-inset-top);
  height: calc(env(safe-area-inset-top) + 88rpx);
  background: linear-gradient(180deg, #EBE0FF, #f5f0ff);
  padding-left: 24rpx;
  padding-right: 24rpx;
  box-sizing: border-box;
  flex-shrink: 0;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 4rpx;
  min-width: 120rpx;
  padding: 8rpx 0;
}

.back-arrow {
  font-size: 48rpx;
  color: #5B3E96;
  line-height: 1;
  margin-top: -4rpx;
}

.back-text {
  font-size: 28rpx;
  color: #5B3E96;
  font-weight: 500;
}

.top-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-right {
  min-width: 120rpx;
}

// ===== 滚动区 =====
.stage-scroll {
  flex: 1;
  padding: 0 32rpx;
}

.stage-list {
  padding: 24rpx 0 32rpx;
}

// ===== 单张形态卡片 =====
.stage-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.stage-card {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(91, 62, 150, 0.08);
}

.stage-image {
  width: 100%;
  display: block;
  background: #faf8ff;
}

.stage-label-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20rpx 0;
}

.stage-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #7B5EA7, #5B3E96);
}

.stage-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #5B3E96;
}


</style>
