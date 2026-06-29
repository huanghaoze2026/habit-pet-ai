<template>
  <view class="chat-bubble-wrapper" :class="[`role-${role}`, { 'is-streaming': isStreaming }]">
    <!-- 宠物头像（宠物消息时显示） -->
    <view v-if="role === 'pet'" class="avatar-col">
      <image class="pet-avatar" :src="petAvatar" mode="aspectFill" />
    </view>

    <!-- 气泡内容 -->
    <view class="bubble-col">
      <view class="bubble-body">
        <!-- 流式输出光标 -->
        <text v-if="isStreaming && role === 'pet'" class="stream-cursor">|</text>
        <text class="bubble-text">
            <text v-if="isVoice && role === 'user'" class="voice-icon">🎤 </text>{{ content }}
          </text>
      </view>
    </view>

    <!-- 用户头像（用户消息时显示） -->
    <view v-if="role === 'user'" class="avatar-col">
      <image class="user-avatar" :src="userAvatar" mode="aspectFill" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';

// ============ Props ============
interface Props {
  /** 消息角色 */
  role: 'user' | 'pet';
  /** 消息内容 */
  content: string;
  /** 是否流式输出中 */
  isStreaming?: boolean;
  /** 宠物头像 */
  petAvatar?: string;
  /** 是否为语音输入 */
  isVoice?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  role: 'user',
  content: '',
  isStreaming: false,
  petAvatar: '/static/pet-default.png',
  isVoice: false,
});

// ============ 用户头像 ============
const userStore = useUserStore();
const userAvatar = computed(() => userStore.avatar || '/static/default-avatar.png');
</script>

<style lang="scss" scoped>
.chat-bubble-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 8rpx 0;

  &.role-user {
    justify-content: flex-end;

    .bubble-body {
      background: #e8e8e8;
      color: #333;
      border-radius: 24rpx 4rpx 24rpx 24rpx;
    }
  }

  &.role-pet {
    justify-content: flex-start;

    .bubble-body {
      background: linear-gradient(135deg, #5B3E96, #D4C5F0);
      color: #ffffff;
      border-radius: 4rpx 24rpx 24rpx 24rpx;
    }
  }

  &.is-streaming {
    .bubble-body {
      opacity: 0.9;
    }
  }
}

// ===== 头像列 =====
.avatar-col {
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
}

.pet-avatar,
.user-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #f0f0f0;

  .role-pet & {
    border: 2rpx solid #5B3E96;
  }

  .role-user & {
    border: 2rpx solid #ddd;
  }
}

// ===== 气泡 =====
.bubble-col {
  max-width: 500rpx;
  min-width: 60rpx;
}

.bubble-body {
  padding: 20rpx 28rpx;
  word-break: break-word;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.bubble-text {
  font-size: 28rpx;
  line-height: 1.6;
  white-space: pre-wrap;
}

// ===== 流式输出光标 =====
.stream-cursor {
  display: inline-block;
  color: #ffffff;
  font-size: 28rpx;
  animation: blink 0.8s step-end infinite;
  margin-left: 2rpx;
}

// ===== 语音图标 =====
.voice-icon {
  font-size: 24rpx;
  opacity: 0.7;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
