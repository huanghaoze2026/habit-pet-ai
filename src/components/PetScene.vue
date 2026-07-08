<template>
  <!-- P50: 宠物场景系统 — 时间感知 + 心情联动 + 四层渲染 -->
  <view class="pet-scene" :class="[sceneTimeClass, sceneMoodClass, weatherClass]">
    <!-- Layer 1: 场景背景（P54 专属场景图优先，失败降级到 CSS 渐变） -->
    <view class="scene-bg-layer">
      <image
        v-if="sceneImageUrl && !sceneImageError"
        :src="sceneImageUrl"
        mode="aspectFill"
        class="scene-bg-img"
        @error="onSceneImageError"
      />
      <view class="scene-bg" :class="{ 'scene-bg--hidden': sceneImageUrl && !sceneImageError }" />
      <view class="scene-bg-gradient" :class="{ 'scene-bg-gradient--hidden': sceneImageUrl && !sceneImageError }" />
    </view>

    <!-- Layer 2: 粒子层 -->
    <view class="particle-layer">
      <view
        v-for="p in particles"
        :key="p.id"
        class="scene-particle"
        :class="p.type"
        :style="{ left: p.x + '%', animationDelay: p.delay + 's', animationDuration: p.duration + 's' }"
      />
    </view>

    <!-- Layer 3: 宠物展示区（P55: 注入 CSS 变量控制缩放） -->
    <view class="pet-layer" :style="{ '--pet-scale': props.petScale ?? 1.8 }">
      <slot />
    </view>

    <!-- Layer 4: UI 覆盖层 -->
    <view class="ui-layer">
      <slot name="ui" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { API_ORIGIN } from '@/utils/env'

/** P63: 简化时间感知 — 白天/夜晚两种场景 */
const currentHour = ref(new Date().getHours())
let hourTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  hourTimer = setInterval(() => {
    currentHour.value = new Date().getHours()
  }, 60000) // 每分钟更新
})

onUnmounted(() => {
  if (hourTimer) clearInterval(hourTimer)
})

const sceneTimeClass = computed(() => {
  const h = currentHour.value
  if (h >= 6 && h < 18) return 'scene--day'
  return 'scene--night'
})

/** P63: 当前时间 Key — day/night */
const sceneTimeKey = computed(() => {
  const h = currentHour.value
  if (h >= 6 && h < 18) return 'day'
  return 'night'
})

/** P54: 场景图片 URL（CDN 加载，不占小程序包体积） */
const SCENE_CDN = `${API_ORIGIN}/uploads/scenes`
const SCENE_V = '20260629180000' // P63: 火龙犬白天背景更新 + 场景简化

const sceneImageUrl = computed(() => {
  // P68 防御：props 可能尚未初始化
  const sid = props?.speciesId
  if (!sid) return ''
  // P60: 悲伤心情时使用专属全屏背景（scenes/{species}/sad.png）
  const m = props?.mood ?? 50
  if (m < 40) return `${SCENE_CDN}/${sid}/sad.png?v=${SCENE_V}`
  return `${SCENE_CDN}/${sid}/${sceneTimeKey.value}.png?v=${SCENE_V}`
})

/** P54: 场景图片加载失败 → 隐藏图片，显示 CSS 渐变 */
const sceneImageError = ref(false)

function onSceneImageError() {
  sceneImageError.value = true
}

// P63: 物种、时间或心情变化时重置加载状态
// P68 防御：使用可选链避免 props 未初始化时报错
watch([() => props?.speciesId, sceneTimeKey, () => props?.mood], () => {
  sceneImageError.value = false
})

const props = defineProps<{
  mood?: number
  /** P51: 天气系统接口预留 — sunny/cloudy/rain/snow，默认 sunny */
  weather?: 'sunny' | 'cloudy' | 'rain' | 'snow'
  /** P54: 物种 ID，用于加载专属场景图片 */
  speciesId?: string
  /** P55: 宠物缩放倍率，默认 1.8（宠物为第一视觉主体） */
  petScale?: number
}>()

const sceneMoodClass = computed(() => {
  const m = props?.mood ?? 50
  if (m >= 80) return 'scene--mood-happy'
  if (m >= 40) return 'scene--mood-normal'
  return 'scene--mood-sad'
})

/** P51: 天气系统接口预留 */
const weatherClass = computed(() => {
  const w = props.weather || 'sunny'
  return `scene--weather-${w}`
})

/** 氛围粒子 */
interface Particle {
  id: number; type: string; x: number; delay: number; duration: number
}
const particles = ref<Particle[]>([])

function generateParticles() {
  const list: Particle[] = []
  const types = ['ember', 'spark', 'firefly']
  for (let i = 0; i < 15; i++) {
    list.push({
      id: i,
      type: types[i % types.length],
      x: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 4 + Math.random() * 8,
    })
  }
  particles.value = list
}

onMounted(() => generateParticles())
</script>

<style scoped>
.pet-scene {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  /* P57: 布局基准 — pet 中心 55%, 平台 72% */
  --pet-center-y: 55%;
  --platform-y: 72%;
  --pet-area-h: 650rpx;
}

/* ========== Layer 1: 背景 ========== */
.scene-bg-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 0;
}
.scene-bg-img {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  object-fit: cover;
}
.scene-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1;
  background-size: cover;
  background-position: center;
  transition: background 2s ease-in-out;
}
.scene-bg--hidden {
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}
.scene-bg-gradient {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 2;
  transition: opacity 1.5s ease-in-out;
}
.scene-bg-gradient--hidden {
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

/* P63: 时间渐变 — 白天/夜晚（去除 sunset） */
.scene--day .scene-bg {
  background: linear-gradient(180deg, #87CEEB, #E0F0FF);
}
.scene--day .scene-bg-gradient {
  background: radial-gradient(ellipse at 50% 40%, rgba(135,206,235,0.3) 0%, transparent 70%);
}

.scene--night .scene-bg {
  background: linear-gradient(180deg, #1a0a2e, #2d1b4e);
}
.scene--night .scene-bg-gradient {
  background: radial-gradient(ellipse at 50% 20%, rgba(180,120,255,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 30% 80%, rgba(255,140,50,0.1) 0%, transparent 50%);
}

/* 心情叠加 */
.scene--mood-happy .scene-bg-gradient {
  filter: brightness(1.1) saturate(1.15);
}
.scene--mood-normal .scene-bg-gradient {
  filter: brightness(1.0) saturate(1.0);
}
.scene--mood-sad .scene-bg-gradient {
  filter: brightness(0.85) saturate(0.7);
}

/* ========== Layer 2: 粒子 ========== */
.particle-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

.scene-particle {
  position: absolute;
  bottom: -10rpx;
  border-radius: 50%;
  animation: particle-rise linear infinite;
  opacity: 0;
}

.scene-particle.ember {
  width: 8rpx;
  height: 8rpx;
  background: radial-gradient(circle, #FFB000, #FF6600);
  box-shadow: 0 0 8rpx rgba(255,150,0,0.6);
}

.scene-particle.spark {
  width: 4rpx;
  height: 4rpx;
  background: #FFD700;
  box-shadow: 0 0 6rpx rgba(255,215,0,0.8);
}

.scene-particle.firefly {
  width: 6rpx;
  height: 6rpx;
  background: radial-gradient(circle, #FFAA00, #FF4400);
  box-shadow: 0 0 12rpx rgba(255,150,0,0.5);
  animation: firefly-float linear infinite;
}

@keyframes particle-rise {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.7; }
  80% { opacity: 0.3; }
  100% { transform: translateY(-60vh) scale(0.3); opacity: 0; }
}

@keyframes firefly-float {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
  25% { transform: translate(15rpx, -20rpx) scale(1.2); opacity: 0.6; }
  50% { transform: translate(-10rpx, -40rpx) scale(0.8); opacity: 0.4; }
  75% { transform: translate(20rpx, -25rpx) scale(1.1); opacity: 0.5; }
}

/* 时间控制粒子密度 */
.scene--night .scene-particle { opacity: 0.8; }
.scene--mood-sad .scene-particle { animation-duration: 1.5; }
.scene--mood-happy .scene-particle { filter: brightness(1.3); }

/* ========== P51: 天气系统叠加层 ========== */
.scene--weather-sunny .scene-bg-gradient {
  filter: brightness(1.05) saturate(1.1);
}
.scene--weather-cloudy .scene-bg-gradient {
  filter: brightness(0.85) saturate(0.8);
}
.scene--weather-rain .scene-bg-gradient {
  filter: brightness(0.7) saturate(0.5) hue-rotate(-10deg);
}
.scene--weather-snow .scene-bg-gradient {
  filter: brightness(1.15) saturate(0.6) hue-rotate(180deg);
}

/* ========== Layer 3: 宠物层 ========== */
/* P57: 宠物居中于 55% 屏幕高度，上 25% 留给状态/气泡/天气，下 25% 留给交互按钮 */
.pet-layer {
  position: relative;
  z-index: 3;
  height: 100%;
  width: 100%;
  /* 子元素使用绝对定位，不依赖 flex */
}

/* ========== Layer 4: UI 覆盖层 ========== */
.ui-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 4;
  pointer-events: none;
}
</style>
