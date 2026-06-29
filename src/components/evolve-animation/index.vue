<template>
  <view v-if="visible" class="evolve-overlay" @click.stop>
    <!-- 背景遮罩 -->
    <view class="evolve-backdrop" />

    <!-- 蛋→幼体动画（裂壳 + 火光） -->
    <view v-if="from === 'egg' && to === 'baby'" class="evolve-scene egg-evolve">
      <!-- 蛋壳 -->
      <view class="egg-shell" :class="{ 'egg-crack': stage >= 1 }">
        <view class="egg-body" />
        <view v-if="stage >= 1" class="crack-line crack-1" />
        <view v-if="stage >= 1" class="crack-line crack-2" />
        <view v-if="stage >= 2" class="crack-line crack-3" />
      </view>

      <!-- 火光迸发 -->
      <view v-if="stage >= 3" class="fire-burst">
        <view v-for="i in 8" :key="i" class="burst-particle" :style="getBurstStyle(i)" />
      </view>

      <!-- 幼体占位图 -->
      <view v-if="stage >= 4" class="evolve-result result-appear">
        <text class="result-emoji">🔥</text>
        <text class="result-name">{{ resultName || '新宠物' }}</text>
        <view class="result-glow" />
      </view>
    </view>

    <!-- 幼体→少年动画（火焰蜕变） -->
    <view v-if="from === 'baby' && to === 'juvenile'" class="evolve-scene baby-evolve">
      <!-- 原有幼体 -->
      <view class="pre-evolve-form" :class="{ 'form-fade': stage >= 1 }">
        <text class="form-emoji">🔥</text>
      </view>

      <!-- 火焰旋涡 -->
      <view v-if="stage >= 1" class="flame-vortex">
        <view v-for="i in 6" :key="i" class="vortex-ring" :style="getVortexStyle(i)" />
      </view>

      <!-- 新形态 -->
      <view v-if="stage >= 3" class="evolve-result result-appear">
        <text class="result-emoji big-emoji">🐉</text>
        <text class="result-name">{{ resultName || '新形态' }}</text>
        <view class="result-glow" />
      </view>
    </view>

    <!-- 进化完成提示 -->
    <view v-if="stage >= 5" class="evolve-complete">
      <text class="complete-text">{{ completeMessage }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

// ============ Props ============
interface Props {
  /** 当前阶段 */
  from?: string;
  /** 目标阶段 */
  to?: string;
  /** 是否可见 */
  visible?: boolean;
  /** 进化后物种名称 */
  resultName?: string;
  /** 进化完成回调 */
  onComplete?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  from: 'egg',
  to: 'baby',
  visible: false,
});

// ============ Emits ============
const emit = defineEmits<{
  (e: 'complete'): void;
}>();

// ============ 动画阶段 ============
const stage = ref(0);
const timers: ReturnType<typeof setTimeout>[] = [];

const completeMessage = '进化完成！🎉';

// ============ 动画序列 ============
watch(
  () => props.visible,
  (val) => {
    clearTimers();
    if (val) {
      stage.value = 0;
      runAnimationSequence();
    }
  },
);

// ============ 粒子样式 ============
function getBurstStyle(index: number): Record<string, string> {
  const angle = (index / 8) * 360;
  const radius = 60 + Math.random() * 40;
  const delay = (index * 0.05).toFixed(2);
  return {
    '--burst-angle': `${angle}deg`,
    '--burst-radius': `${radius}rpx`,
    '--burst-delay': `${delay}s`,
  };
}

function getVortexStyle(index: number): Record<string, string> {
  const delay = (index * 0.15).toFixed(2);
  const scale = (0.7 + index * 0.1).toFixed(1);
  return {
    animationDelay: `${delay}s`,
    '--ring-scale': scale,
  };
}

// ============ 动画序列控制 ============
function runAnimationSequence(): void {
  // 阶段0: 初始显示
  const t1 = setTimeout(() => { stage.value = 1; }, 400);   // 0.4s → 裂痕出现
  const t2 = setTimeout(() => { stage.value = 2; }, 800);   // 0.8s → 更多裂痕
  const t3 = setTimeout(() => { stage.value = 3; }, 1200);  // 1.2s → 火光迸发
  const t4 = setTimeout(() => { stage.value = 4; }, 1800);  // 1.8s → 新形态出现
  const t5 = setTimeout(() => { stage.value = 5; }, 2600);  // 2.6s → 完成提示
  const t6 = setTimeout(() => { handleComplete(); }, 3200); // 3.2s → 触发回调

  timers.push(t1, t2, t3, t4, t5, t6);
}

function handleComplete(): void {
  emit('complete');
  props.onComplete?.();
}

function clearTimers(): void {
  timers.forEach((t) => clearTimeout(t));
  timers.length = 0;
}

onUnmounted(() => {
  clearTimers();
});
</script>

<style lang="scss" scoped>
.evolve-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.evolve-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.evolve-scene {
  position: relative;
  width: 400rpx;
  height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

// ==========================================
// 蛋→幼体动画
// ==========================================

.egg-shell {
  position: relative;
  width: 200rpx;
  height: 240rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease;
}

.egg-body {
  width: 200rpx;
  height: 240rpx;
  background: radial-gradient(ellipse at 40% 35%, #fff9c4, #ffcc02, #ff8f00);
  border-radius: 50% 50% 45% 45%;
  box-shadow:
    inset 0 -10rpx 30rpx rgba(255, 111, 0, 0.3),
    0 8rpx 24rpx rgba(0, 0, 0, 0.2);
}

.egg-crack {
  animation: eggShake 0.6s ease-in-out;
}

@keyframes eggShake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  15% { transform: translateX(-6rpx) rotate(-3deg); }
  30% { transform: translateX(6rpx) rotate(3deg); }
  45% { transform: translateX(-4rpx) rotate(-2deg); }
  60% { transform: translateX(4rpx) rotate(2deg); }
  75% { transform: translateX(-2rpx) rotate(-1deg); }
}

// 裂缝
.crack-line {
  position: absolute;
  background: #3e2723;
  border-radius: 2rpx;
}

.crack-1 {
  top: 30%;
  left: 35%;
  width: 40rpx;
  height: 4rpx;
  transform: rotate(-25deg);
  animation: crackSpread1 0.3s ease-out forwards;
}

@keyframes crackSpread1 {
  from { width: 0; opacity: 0; }
  to { width: 60rpx; opacity: 1; }
}

.crack-2 {
  top: 50%;
  right: 30%;
  width: 4rpx;
  height: 50rpx;
  transform: rotate(10deg);
  animation: crackSpread2 0.3s ease-out 0.15s forwards;
}

@keyframes crackSpread2 {
  from { height: 0; opacity: 0; }
  to { height: 70rpx; opacity: 1; }
}

.crack-3 {
  bottom: 25%;
  left: 40%;
  width: 50rpx;
  height: 4rpx;
  transform: rotate(15deg);
  animation: crackSpread3 0.3s ease-out 0.1s forwards;
}

@keyframes crackSpread3 {
  from { width: 0; opacity: 0; }
  to { width: 80rpx; opacity: 1; }
}

// 火光迸发粒子
.fire-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.burst-particle {
  position: absolute;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: radial-gradient(circle, #ffb300, #ff6d00);
  box-shadow: 0 0 10rpx rgba(255, 109, 0, 0.6);
  animation: burstOut 0.8s ease-out forwards;
  animation-delay: var(--burst-delay, 0s);
}

@keyframes burstOut {
  0% {
    transform: translate(-50%, -50%) rotate(var(--burst-angle, 0deg)) translateY(0);
    opacity: 1;
    scale: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--burst-angle, 0deg)) translateY(calc(-1 * var(--burst-radius, 80rpx)));
    opacity: 0;
    scale: 1.5;
  }
}

// 结果淡入
.result-appear {
  animation: resultFadeIn 0.6s ease-out forwards;
}

@keyframes resultFadeIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.evolve-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  z-index: 2;
}

.result-emoji {
  font-size: 140rpx;
}

.result-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 20rpx rgba(255, 152, 0, 0.6);
}

.result-glow {
  position: absolute;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 152, 0, 0.3), transparent 60%);
  animation: glowPulse 2s ease-in-out infinite;
  z-index: -1;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(0.8); opacity: 0.4; }
  50% { transform: scale(1.1); opacity: 0.7; }
}

// ==========================================
// 幼体→少年动画
// ==========================================

.pre-evolve-form {
  transition: opacity 0.5s ease;
}

.form-emoji {
  font-size: 140rpx;
}

.form-fade {
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.5s ease;
}

.flame-vortex {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300rpx;
  height: 300rpx;
  pointer-events: none;
}

.vortex-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid rgba(255, 152, 0, 0.6);
  border-radius: 50%;
  animation: vortexSpin 1.5s ease-out forwards;
  animation-delay: attr(data-delay);
}

@keyframes vortexSpin {
  0% {
    transform: translate(-50%, -50%) scale(0.5) rotate(0deg);
    opacity: 0.8;
    border-color: rgba(255, 152, 0, 0.8);
  }
  100% {
    transform: translate(-50%, -50%) scale(var(--ring-scale, 2)) rotate(360deg);
    opacity: 0;
    border-color: rgba(255, 87, 34, 0.1);
  }
}

.big-emoji {
  font-size: 180rpx;
}

// ==========================================
// 完成提示
// ==========================================

.evolve-complete {
  position: relative;
  z-index: 2;
  margin-top: 40rpx;
  animation: completeBounce 0.5s ease-out;
}

@keyframes completeBounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.complete-text {
  font-size: 40rpx;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 0 20rpx rgba(255, 152, 0, 0.5);
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.9), rgba(255, 87, 34, 0.9));
  padding: 20rpx 48rpx;
  border-radius: 40rpx;
}
</style>
