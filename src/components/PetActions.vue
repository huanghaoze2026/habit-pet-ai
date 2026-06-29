<template>
  <view class="pet-actions">
    <view
      class="action-circle"
      @click="$emit('pet')"
    >
      <text class="action-emoji">🤲</text>
      <text class="action-label">抚摸</text>
    </view>

    <view
      class="action-circle action-circle--feed"
      @click="$emit('feed')"
    >
      <text class="action-emoji">🍖</text>
      <text class="action-label">喂食</text>
    </view>

    <view
      class="action-circle action-circle--chat"
      @click="$emit('chat')"
    >
      <text class="action-emoji">💬</text>
      <text class="action-label">聊天</text>
    </view>

    <view
      class="action-circle action-circle--task"
      @click="$emit('task')"
    >
      <text class="action-emoji">🎒</text>
      <text class="action-label">任务</text>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * PetActions — 圆形互动按钮组
 * 🤲抚摸 / 🍖喂食 / 💬聊天 / 🎒任务
 */
defineEmits<{
  (e: 'pet'): void
  (e: 'feed'): void
  (e: 'chat'): void
  (e: 'task'): void
}>()
</script>

<style scoped>
.pet-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 28rpx;
  padding: 24rpx 20rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.action-circle {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.28),
    rgba(255, 255, 255, 0.06)
  );
  backdrop-filter: blur(12px);
  box-shadow:
    0 8rpx 28rpx rgba(0, 0, 0, 0.18),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.35),
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.08);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.action-circle:active {
  transform: scale(0.85);
  box-shadow:
    0 4rpx 14rpx rgba(0, 0, 0, 0.3),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.15);
}

.action-circle--feed {
  background: linear-gradient(
    135deg,
    rgba(255, 142, 158, 0.35),
    rgba(255, 179, 193, 0.12)
  );
}

.action-circle--chat {
  background: linear-gradient(
    135deg,
    rgba(91, 62, 150, 0.35),
    rgba(212, 197, 240, 0.15)
  );
}

.action-circle--task {
  background: linear-gradient(
    135deg,
    rgba(76, 175, 80, 0.3),
    rgba(139, 195, 74, 0.12)
  );
}

.action-emoji {
  font-size: 48rpx;
  line-height: 1;
  filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.2));
}

.action-label {
  font-size: 22rpx;
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.35);
  letter-spacing: 1rpx;
}
</style>
