<template>
  <view
    class="task-card"
    :class="{
      'is-completed': task.completed,
      'is-checking': isChecking,
    }"
    @tap="handleCardTap"
  >
    <!-- 任务图标 -->
    <view class="task-icon">
      <text class="task-emoji">{{ task.icon || defaultIcon }}</text>
      <!-- 已完成勾 -->
      <view v-if="task.completed" class="completed-mark">
        <text>✔</text>
      </view>
    </view>

    <!-- 任务信息 -->
    <view class="task-info">
      <text class="task-title">{{ task.title }}</text>
      <text class="task-desc">{{ task.description }}</text>
    </view>

    <!-- 打卡按钮 / 已完成 -->
    <view class="task-action">
      <button
        v-if="!task.completed"
        class="checkin-btn"
        :class="{ 'is-loading': isChecking }"
        :disabled="isChecking"
        @tap.stop="handleCheckin"
      >
        <text v-if="!isChecking" class="btn-text">+{{ task.reward }}</text>
        <view v-else class="btn-loading">
          <view class="loading-dot" />
        </view>
      </button>
      <view v-else class="completed-btn">
        <text class="check-icon">✔</text>
        <text class="done-text">已完成</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// ============ Props ============
export interface TaskItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  reward: number;
  completed: boolean;
  category?: string;
}

interface Props {
  task: TaskItem;
}

const props = defineProps<Props>();

// ============ Emits ============
const emit = defineEmits<{
  (e: 'checkin', taskId: string): void;
  (e: 'tap', task: TaskItem): void;
}>();

// ============ 状态 ============
const isChecking = ref(false);

// ============ 计算属性 ============
const defaultIcon = computed(() => {
  const cat = props.task.category;
  if (cat === 'health' || cat === '运动') return '⚽';
  if (cat === 'study' || cat === '学习') return '📚';
  if (cat === 'daily' || cat === '日常') return '✅';
  if (cat === 'reading' || cat === '阅读') return '📖';
  return '⭐';
});

// ============ 方法 ============
function handleCheckin() {
  if (isChecking.value || props.task.completed) return;
  isChecking.value = true;
  emit('checkin', props.task.id);
}

function handleCardTap() {
  emit('tap', props.task);
}

/** 外部重置 loading 态 */
function resetLoading() {
  isChecking.value = false;
}

defineExpose({ resetLoading });
</script>

<style lang="scss" scoped>
.task-card {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  gap: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  &:active {
    background: #fafafa;
    transform: scale(0.99);
  }

  &.is-completed {
    opacity: 0.7;
    background: #f9f9f9;
  }

  &.is-checking {
    opacity: 0.8;
  }
}

// ===== 任务图标 =====
.task-icon {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.task-emoji {
  font-size: 44rpx;
}

.completed-mark {
  position: absolute;
  bottom: -4rpx;
  right: -4rpx;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #4caf50;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
}

// ===== 任务信息 =====
.task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  overflow: hidden;
  min-width: 0;
}

.task-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  .is-completed & {
    text-decoration: line-through;
    color: #333;
  }
}

.task-desc {
  font-size: 24rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ===== 打卡按钮 =====
.task-action {
  flex-shrink: 0;
}

.checkin-btn {
  min-width: 100rpx;
  height: 68rpx;
  padding: 0 24rpx;
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  border-radius: 34rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.25);

  &::after {
    border: none;
  }

  &:active {
    opacity: 0.85;
    transform: scale(0.96);
  }

  &.is-loading {
    background: #c8e6c9;
    box-shadow: none;
  }
}

.btn-text {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
}

.loading-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #4caf50;
  animation: dotPulse 0.8s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.1); }
}

// ===== 已完成按钮 =====
.completed-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 0 20rpx;
  height: 68rpx;
  background: #e8f5e9;
  border-radius: 34rpx;
}

.check-icon {
  font-size: 24rpx;
  color: #4caf50;
  font-weight: 700;
}

.done-text {
  font-size: 24rpx;
  color: #4caf50;
  font-weight: 500;
}
</style>
