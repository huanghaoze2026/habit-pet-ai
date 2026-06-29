<template>
  <view class="mood-indicator" :class="`mood-${moodLevel}`">
    <!-- 火焰粒子效果 -->
    <view class="flame-particles">
      <view
        v-for="i in particleCount"
        :key="i"
        class="flame-particle"
        :style="getParticleStyle(i)"
      />
    </view>

    <!-- 火焰进度条 -->
    <view class="mood-bar-container">
      <view class="mood-bar-bg">
        <view
          class="mood-bar-fill"
          :class="`fill-${moodLevel}`"
          :style="{ width: fillPercent + '%' }"
        />
      </view>

      <!-- 心情图标 -->
      <view class="mood-emoji">
        <text>{{ moodEmoji }}</text>
      </view>
    </view>

    <!-- 心情数值 + 标签 -->
    <view class="mood-info">
      <text class="mood-value">{{ value }}</text>
      <text class="mood-label">{{ label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// ============ Props ============
interface Props {
  /** 心情值 0-100 */
  value?: number;
  /** 心情标签（不传则自动计算） */
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: 50,
  label: '',
});

// ============ 计算属性 ============

/** 心情等级 */
const moodLevel = computed(() => {
  const v = props.value;
  if (v >= 90) return 'excellent';
  if (v >= 70) return 'good';
  if (v >= 50) return 'normal';
  if (v >= 30) return 'low';
  return 'critical';
});

/** 填充百分比 */
const fillPercent = computed(() => {
  return Math.max(5, Math.min(100, props.value));
});

/** 心情 emoji */
const moodEmoji = computed(() => {
  const v = props.value;
  if (v >= 90) return '🤩';
  if (v >= 70) return '😊';
  if (v >= 50) return '🙂';
  if (v >= 30) return '😔';
  return '😢';
});

/** 心情标签 */
const displayLabel = computed(() => {
  if (props.label) return props.label;
  const v = props.value;
  if (v >= 90) return '超级开心';
  if (v >= 70) return '心情不错';
  if (v >= 50) return '还行';
  if (v >= 30) return '有点低落';
  return '需要关怀';
});

/** 火焰粒子数量（心情越高越多） */
const particleCount = computed(() => {
  const v = props.value;
  if (v >= 90) return 6;
  if (v >= 70) return 4;
  if (v >= 50) return 3;
  if (v >= 30) return 2;
  return 1;
});

/** 粒子样式 */
function getParticleStyle(index: number) {
  const v = props.value;
  const intensity = Math.max(0.3, v / 100);
  const delay = (index * 0.3).toFixed(2);
  const drift = ((index % 3) - 1) * 15;
  return {
    '--particle-delay': `${delay}s`,
    '--particle-drift': `${drift}rpx`,
    '--particle-opacity': intensity.toFixed(2),
    '--particle-scale': (0.4 + intensity * 0.6).toFixed(2),
  };
}
</script>

<style lang="scss" scoped>
.mood-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  position: relative;
  padding: 16rpx 0;
}

// ===== 火焰粒子 =====
.flame-particles {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200rpx;
  height: 40rpx;
  pointer-events: none;
  overflow: visible;
}

.flame-particle {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: radial-gradient(circle, #5B3E96, #6D28D9);
  opacity: 0;
  animation: particleRise 2s ease-out infinite;
  animation-delay: var(--particle-delay, 0s);
  transform-origin: center center;
}

@keyframes particleRise {
  0% {
    opacity: 0;
    transform: translateX(var(--particle-drift, 0)) translateY(0) scale(0.5);
  }
  20% {
    opacity: calc(var(--particle-opacity, 0.6) * 0.8);
  }
  60% {
    opacity: calc(var(--particle-opacity, 0.6) * 0.5);
  }
  100% {
    opacity: 0;
    transform: translateX(var(--particle-drift, 0)) translateY(-40rpx) scale(var(--particle-scale, 1));
  }
}

// ===== 进度条容器 =====
.mood-bar-container {
  display: flex;
  align-items: center;
  gap: 12rpx;
  width: 100%;
}

.mood-bar-bg {
  flex: 1;
  height: 16rpx;
  background: #e8e8e8;
  border-radius: 8rpx;
  overflow: hidden;
  box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.06);
}

.mood-bar-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
    animation: shimmer 2s ease-in-out infinite;
  }
}

// 填充颜色
.fill-excellent {
  background: linear-gradient(90deg, #ff6d00, #ffab00, #ffd740);
}
.fill-good {
  background: linear-gradient(90deg, #5B3E96, #D4C5F0);
}
.fill-normal {
  background: linear-gradient(90deg, #D4C5F0, #ffcc80);
}
.fill-low {
  background: linear-gradient(90deg, #ff8a65, #ffab91);
}
.fill-critical {
  background: linear-gradient(90deg, #ef5350, #e57373);
}

@keyframes shimmer {
  0%, 100% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
}

// ===== 心情图标 =====
.mood-emoji {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  transition: transform 0.3s ease;
}

// ===== 数值 =====
.mood-info {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.mood-value {
  font-size: 40rpx;
  font-weight: 800;
  color: #333;
  transition: color 0.3s ease;
}

.mood-label {
  font-size: 22rpx;
  color: #333;
}

// 不同心情等级的数值颜色
.mood-excellent .mood-value {
  color: #ff6d00;
}
.mood-good .mood-value {
  color: #333;
}
.mood-normal .mood-value {
  color: #D4C5F0;
}
.mood-low .mood-value {
  color: #ff8a65;
}
.mood-critical .mood-value {
  color: #ef5350;
}
</style>
