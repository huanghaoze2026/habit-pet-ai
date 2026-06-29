<template>
  <view class="status-card status-card--compact">
    <!-- 主标题行 -->
    <view class="status-main">
      <text class="status-level">Lv.{{ level }}</text>
      <text class="status-stage">{{ stageName }}</text>
    </view>

    <!-- 成长能量条（仅在有进化进度时显示，不展示 % 数字） -->
    <view v-if="expPercent > 0" class="status-grow">
      <view class="grow-bar">
        <view class="grow-fill" :style="{ width: expPercent + '%' }" />
      </view>
    </view>

    <!-- 心情小标 -->
    <view class="status-mood-mini">
      <text>{{ moodEmoji }} {{ moodLabel }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * PetStatusCard — 游戏化状态卡
 * 显示等级、阶段、心情、成长能量条
 */
defineProps<{
  level: number
  stageName: string
  moodEmoji: string
  moodLabel: string
  energy?: number
  expPercent: number
}>()
</script>

<style scoped>
.status-card {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  background: rgba(255, 255, 255, 0.13);
  backdrop-filter: blur(20px);
  border-radius: 20rpx;
  padding: 18rpx 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.12), inset 0 1rpx 0 rgba(255, 255, 255, 0.25);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.status-main {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.status-level {
  font-size: 30rpx;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.35);
}

.status-stage {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.status-mood-mini {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.75);
}

.status-grow {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.grow-bar {
  flex: 1;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6rpx;
  overflow: hidden;
  box-shadow: inset 0 1rpx 3rpx rgba(0, 0, 0, 0.2);
}

.grow-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FF8C00, #FF69B4);
  border-radius: 6rpx;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 10rpx rgba(255, 215, 0, 0.4);
}


</style>
