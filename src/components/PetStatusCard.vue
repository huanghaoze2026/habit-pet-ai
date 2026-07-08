<template>
  <view class="status-card status-card--compact">
    <!-- 宝贝头像 + 名字（在宠物名称之上） -->
    <view class="status-child">
      <image
        v-if="childAvatar"
        class="status-child-avatar"
        :src="childAvatar"
        mode="aspectFill"
      />
      <view v-else class="status-child-avatar status-child-avatar--ph">
        <text>👶</text>
      </view>
      <text class="status-child-name">{{ childName || '宝贝' }}</text>
    </view>

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
  childAvatar?: string
  childName?: string
}>()
</script>

<style scoped>
.status-card {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  /* P71: 弱化毛玻璃 —— 轻模糊 + 低背景不透明度，呈"透明玻璃片"而非磨砂白块 */
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8rpx) saturate(115%);
  -webkit-backdrop-filter: blur(8rpx) saturate(115%);
  border-radius: 20rpx;
  padding: 18rpx 24rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.16), inset 0 1rpx 0 rgba(255, 255, 255, 0.22), inset 0 0 0 1rpx rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.22);
}

/* 宝贝头像 + 名字行（卡片顶部） */
.status-child {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.18);
}

.status-child-avatar {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.status-child-avatar--ph {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
  font-size: 22rpx;
}

.status-child-name {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 500;
  max-width: 180rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.3);
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
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.35);
}

.status-mood-mini {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.35);
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
