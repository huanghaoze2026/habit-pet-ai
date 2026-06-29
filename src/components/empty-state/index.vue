<template>
  <view class="empty-state">
    <text class="empty-icon">{{ icon }}</text>
    <text class="empty-title">{{ title }}</text>
    <text v-if="subtitle" class="empty-subtitle">{{ subtitle }}</text>
    <view v-if="buttonText" class="empty-btn" @click="onAction">
      <text class="empty-btn-text">{{ buttonText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  subtitle?: string
  buttonText?: string
}>()

const emit = defineEmits<{
  action: []
}>()

const onAction = () => {
  emit('action')
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 80rpx 60rpx;
  box-sizing: border-box;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.empty-title {
  font-size: 32rpx;
  color: #333333;
  font-weight: bold;
  margin-bottom: 16rpx;
  text-align: center;
}

.empty-subtitle {
  font-size: 28rpx;
  color: #333999;
  text-align: center;
  line-height: 40rpx;
  margin-bottom: 48rpx;
}

.empty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 360rpx;
  height: 80rpx;
  background: #5B3E96;
  border-radius: 40rpx;
}

.empty-btn-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: bold;
}
</style>
