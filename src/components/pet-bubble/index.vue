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
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  padding: 16rpx 28rpx;
  animation: bubblePop 0.4s ease-out forwards;
  position: relative;
  z-index: 25;
}

.bubble-emoji {
  font-size: 32rpx;
  line-height: 1;
}

.bubble-text {
  font-size: 26rpx;
  color: #fff;
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
