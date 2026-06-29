<template>
  <view class="pet-bubble" v-if="visible" :class="{ 'bubble-show': visible }">
    <text class="bubble-emoji">💭</text>
    <text class="bubble-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
import { watch } from 'vue'

/**
 * PetBubble — 宠物头顶气泡组件
 * visible 变为 true 时从宠物头顶弹出，4 秒后自动消失
 */

interface Props {
  text?: string
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  visible: false,
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.visible,
  (val) => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer)
      autoCloseTimer = null
    }
    if (val) {
      autoCloseTimer = setTimeout(() => {
        emit('close')
        autoCloseTimer = null
      }, 4000)
    }
  }
)
</script>

<style scoped>
.pet-bubble {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24rpx;
  padding: 16rpx 28rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.12), 0 2rpx 8rpx rgba(91, 62, 150, 0.08);
  animation: bubblePop 0.4s ease-out forwards;
  position: relative;
  pointer-events: none;
  z-index: 25;
}

.bubble-emoji {
  font-size: 32rpx;
  line-height: 1;
}

.bubble-text {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}

.bubble-show {
  animation: bubblePop 0.4s ease-out forwards;
}

@keyframes bubblePop {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.5);
  }
  50% {
    transform: translateY(-4px) scale(1.06);
  }
  100% {
    opacity: 1;
    transform: translateY(-8px) scale(1);
  }
}
</style>
