<template>
  <view class="pet-animator">
    <!-- P60: 静态兜底图 — 首帧瞬间显示，无白屏 -->
    <image
      v-if="currentMode === 'static' && (staticFallback || displayUrl)"
      :src="currentMode === 'static' ? (staticFallback || displayUrl) : ''"
      mode="aspectFit"
      class="pet-anim-img pet-anim-img--static"
    />
    
    <!-- P60: Sprite Sheet 模式 — 预加载完成后渐显 -->
    <view
      v-if="currentMode === 'sprite'"
      class="pet-anim-sprite-fade"
      :style="spriteStyle"
    />
    
    <!-- P51: 序列帧模式（降级） — 有帧数据时逐帧播放 -->
    <image
      v-if="currentMode === 'sprite' && !hasSprite && sequenceSrc"
      :src="sequenceSrc"
      mode="aspectFit"
      class="pet-anim-img"
      :class="{ 'pet-anim-img--frame': isSequencePlaying }"
      @error="handleSequenceError"
    />
    
    <!-- 静态单图模式（四级 fallback）— currentMode==='static' 且无 staticFallback 时显示 -->
    <image
      v-if="currentMode === 'static' && !staticFallback && displayUrl"
      :src="displayUrl"
      mode="aspectFit"
      class="pet-anim-img"
      @error="handleSpriteError"
    />
    
    <!-- 四级 fallback 全部失败后降级到 emoji 插槽 -->
    <slot v-if="!hasSprite && !sequenceSrc && !displayUrl && currentMode === 'static' && !staticFallback" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

/**
 * PetAnimator — 宠物动画驱动器（支持 Sprite Sheet / 序列帧 / 静态图三级模式）
 *
 * ═══ 职责 ═══
 * ✅ P58: Sprite Sheet CSS steps() 丝滑动画（优先）
 * ✅ P51: 序列帧播放（frames[] 按 fps 循环）
 * ✅ 图片加载 & 四级 fallback（缺失不空白）
 * ✅ CSS class 切换（根据 animationState）
 *
 * ❌ 不负责：请求接口、判断进化、判断任务完成
 *
 * ============ Props ============
 */
const props = defineProps<{
  /** 物种 ID，如 milk_tea_fox、fire_dragon_dog */
  speciesId: string
  /** 阶段 Key，如 egg、baby、juvenile */
  stageKey: string
  /** 情绪 Key，如 idle、happy、sad、eating、evolution */
  emotionKey: string
  /** 动画状态（驱动 CSS），默认 idle */
  animationState?: string
  /** P60: 静态兜底图 URL（在 Sprite Sheet 加载期间显示），通常为 baby_idle.png */
  staticFallback?: string
  /** 外部计算好的精灵图 URL（主路径），为空时自动根据 speciesId/stageKey/emotionKey 拼接 */
  spriteUrl?: string

  // ===== P58: Sprite Sheet 模式 =====
  /** Sprite Sheet 图片完整 URL，非空时启用 Sprite Sheet 模式 */
  spriteSheet?: string
  /** 总帧数，默认 8 */
  frameCount?: number
  /** 单帧宽度(px)，默认 1024 */
  frameWidth?: number
  /** 单帧高度(px)，默认 1024 */
  frameHeight?: number

  // ===== P51: 序列帧播放 =====
  /** 帧图片 URL 数组，非空时启用序列帧模式（降级） */
  frames?: string[]
  /** 每秒帧数，默认 4 */
  fps?: number
  /** 是否循环播放，默认 true */
  loop?: boolean
  /** 是否自动播放，默认 true */
  autoPlay?: boolean
}>()

const emit = defineEmits<{
  (e: 'frameChange', index: number): void
  (e: 'animationEnd'): void
}>()

/* ================================================================
 * P58: Sprite Sheet 模式 — CSS steps() 动画
 * ================================================================ */

/** 内部 Sprite Sheet 状态（可由 playAction 更新） */
const internalSpriteSheet = ref(props.spriteSheet || '')
const internalFrameCount = ref(props.frameCount || 8)
const internalFps = ref(props.fps || 8)
const spritePaused = ref(false)

// P58: 预加载状态
const spriteLoaded = ref(false)
const spriteOpacity = ref(0)

/** P60: 当前渲染模式：'static'=显示静态图 'sprite'=显示序列帧 */
const currentMode = ref<'static' | 'sprite'>('static')
/** P60: Sprite Sheet 是否已预加载完成 */
const spriteReady = ref(false)

/** 是否有有效的 Sprite Sheet（预加载完成后才渲染） */
const hasSprite = computed(() => !!internalSpriteSheet.value && spriteReady.value && currentMode.value === 'sprite')

/** Sprite Sheet 容器内联样式 */
const spriteStyle = computed(() => {
  const sheet = internalSpriteSheet.value
  if (!sheet) return { display: 'none' }

  const count = internalFrameCount.value
  const fps = internalFps.value
  // P58: 循环帧数 = 总帧数 - 1，最后一帧不参与循环避免跳到起始帧的跳动
  const loopFrameCount = count - 1
  const duration = loopFrameCount / fps

  return {
    display: 'block',
    backgroundImage: `url(${sheet})`,
    backgroundSize: `${count * 100}% 100%`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '0 0',
    animationName: `sprite-slide-loop-${loopFrameCount}`,
    animationDuration: `${duration}s`,
    animationTimingFunction: `steps(${loopFrameCount})`,
    animationIterationCount: props.loop !== false ? 'infinite' : '1',
    animationPlayState: spritePaused.value ? 'paused' : 'running',
    animationFillMode: 'none',
    // P60: 预加载完成后渐显，消除首次闪烁
    opacity: spriteOpacity.value,
    transition: 'opacity 0.3s ease',
  }
})

/** 同步 props → 内部状态 */
watch(() => props.spriteSheet, (v) => {
  const newSheet = v || ''
  // P60: 同一张 Sprite Sheet 不需要重新预加载
  if (newSheet === internalSpriteSheet.value) {
    spritePaused.value = props.autoPlay === false
    return
  }
  internalSpriteSheet.value = newSheet
  if (newSheet) {
    spritePaused.value = props.autoPlay === false
    // P60: 先显示静态图，后台预加载
    currentMode.value = 'static'
    spriteReady.value = false
    spriteLoaded.value = false
    spriteOpacity.value = 0
    // uni.getImageInfo 是 uni-app 封装 API，在小程序中对应 wx.getImageInfo，会触发下载缓存
    uni.getImageInfo({
      src: newSheet,
      success: () => {
        spriteReady.value = true
        spriteLoaded.value = true
        // 切换到 sprite 模式 + 渐显
        currentMode.value = 'sprite'
        // 使用 nextTick 确保 DOM 更新后再设置 opacity，触发过渡
        spriteOpacity.value = 1
      },
      fail: () => {
        // 加载失败，保持静态模式，降级到 fallback
        spriteReady.value = false
        spriteLoaded.value = false
        currentMode.value = 'static'
      },
    })
  } else {
    spriteReady.value = false
    spriteLoaded.value = false
    spriteOpacity.value = 0
    currentMode.value = 'static'
  }
})
watch(() => props.frameCount, (v) => { if (v) internalFrameCount.value = v })
watch(() => props.fps, (v) => { if (v) internalFps.value = v })
watch(() => props.autoPlay, (v) => { spritePaused.value = v === false })

/* ================================================================
 * E：四级 Fallback 机制（静态模式）
 * ================================================================ */
const SPRITE_BASE = 'https://stage-api.lanyunke.com/uploads/sprites'
const SPRITE_V = 'v=20260621221500' // P50: 破微信图片缓存

/** 当前 fallback 层级（0-3） */
const fallbackLevel = ref(0)
/** 当前实际显示的图片 URL */
const displayUrl = ref('')

/** 根据层级计算 fallback URL */
function getFallbackUrl(level: number): string {
  const species = props.speciesId || ''
  const stage = props.stageKey || 'egg'
  const emotion = props.emotionKey || 'idle'

  switch (level) {
    case 0:
      return props.spriteUrl || `${SPRITE_BASE}/${species}/${stage}_${emotion}.png?${SPRITE_V}`
    case 1:
      return `${SPRITE_BASE}/${species}/${stage}_idle.png?${SPRITE_V}`
    case 2:
      return `${SPRITE_BASE}/${species}/baby_idle.png?${SPRITE_V}`
    default:
      return ''
  }
}

function handleSpriteError() {
  if (fallbackLevel.value >= 3) {
    displayUrl.value = ''
    return
  }
  fallbackLevel.value++
  const url = getFallbackUrl(fallbackLevel.value)
  if (!url && fallbackLevel.value >= 3) {
    displayUrl.value = ''
  } else {
    displayUrl.value = url
  }
}

displayUrl.value = getFallbackUrl(0)

watch(
  () => [props.speciesId, props.stageKey, props.emotionKey],
  () => {
    fallbackLevel.value = 0
    displayUrl.value = getFallbackUrl(0)
  }
)

watch(
  () => props.spriteUrl,
  (newUrl) => {
    if (newUrl) {
      fallbackLevel.value = 0
      displayUrl.value = newUrl
    }
  }
)

/* ================================================================
 * P51: 序列帧播放器（降级模式）
 * ================================================================ */
const sequenceSrc = ref('')
const isSequencePlaying = ref(false)
const currentFrameIndex = ref(0)
let frameTimer: ReturnType<typeof setInterval> | null = null

/** 是否有有效的帧数据 */
const hasFrames = computed(() => {
  return props.frames && Array.isArray(props.frames) && props.frames.length > 0
})

/** 计算帧间隔(ms) */
const frameInterval = computed(() => {
  const fps = props.fps || 4
  return Math.max(33, 1000 / fps) // 最低 30fps 保护
})

/** 启动帧播放器 */
function startFramePlayback() {
  if (!hasFrames.value) return
  stopFramePlayback()

  const frames = props.frames!
  isSequencePlaying.value = true
  currentFrameIndex.value = 0
  sequenceSrc.value = frames[0]

  frameTimer = setInterval(() => {
    currentFrameIndex.value++
    if (currentFrameIndex.value >= frames.length) {
      if (props.loop !== false) {
        currentFrameIndex.value = 0
      } else {
        stopFramePlayback()
        emit('animationEnd')
        return
      }
    }
    sequenceSrc.value = frames[currentFrameIndex.value]
    emit('frameChange', currentFrameIndex.value)
  }, frameInterval.value)
}

/** 停止帧播放器 */
function stopFramePlayback() {
  if (frameTimer) {
    clearInterval(frameTimer)
    frameTimer = null
  }
  isSequencePlaying.value = false
}

/** 跳到指定帧 */
function gotoFrame(index: number) {
  if (!hasFrames.value) return
  const frames = props.frames!
  if (index >= 0 && index < frames.length) {
    currentFrameIndex.value = index
    sequenceSrc.value = frames[index]
  }
}

/** 序列帧加载失败 → 降级到静态 fallback */
function handleSequenceError() {
  stopFramePlayback()
  sequenceSrc.value = ''
}

// 监听 frames 变化 → 自动播放
watch(
  () => props.frames,
  (newFrames, oldFrames) => {
    // 帧数组变化(包含引用变化) → 重新播放
    if (newFrames !== oldFrames && newFrames && newFrames.length > 0) {
      if (props.autoPlay !== false) {
        startFramePlayback()
      } else {
        sequenceSrc.value = newFrames[0]
      }
    } else if (!newFrames || newFrames.length === 0) {
      stopFramePlayback()
      sequenceSrc.value = ''
    }
  },
  { immediate: true }
)

// 外部重置
watch(
  () => [props.autoPlay, props.loop],
  () => {
    if (hasFrames.value && props.autoPlay !== false) {
      startFramePlayback()
    }
  }
)

// 组件卸载清理
onUnmounted(() => {
  stopFramePlayback()
})

/* ================================================================
 * P58: 公开方法
 * ================================================================ */

/**
 * P60: 切换不同动作的 Sprite Sheet
 * — 切换动作时先显示静态图，预加载新 sprite，加载完成后渐显
 */
function playAction(sheetUrl: string, frameCount: number, fps: number) {
  if (sheetUrl !== internalSpriteSheet.value) {
    // 新 Sprite Sheet → 切回静态模式，预加载
    internalSpriteSheet.value = sheetUrl
    internalFrameCount.value = frameCount
    internalFps.value = fps
    spritePaused.value = false
    currentMode.value = 'static'
    spriteReady.value = false
    spriteLoaded.value = false
    spriteOpacity.value = 0
    
    uni.getImageInfo({
      src: sheetUrl,
      success: () => {
        spriteReady.value = true
        spriteLoaded.value = true
        currentMode.value = 'sprite'
        spriteOpacity.value = 1
      },
      fail: () => {
        spriteReady.value = false
        spriteLoaded.value = false
        currentMode.value = 'static'
      },
    })
  } else {
    // 同一个 Sprite Sheet → 直接 resume
    spritePaused.value = false
  }
}

/** 停止当前 Sprite Sheet 动画 */
function stop() {
  spritePaused.value = true
}

/** 恢复 Sprite Sheet 动画播放 */
function resume() {
  spritePaused.value = false
}

/* ================================================================
 * P60: CSS 动画已移除 — 宠物图片完全静止或只播放 Sprite Sheet
 * animClass 保留用于向后兼容，始终返回空字符串
 * ================================================================ */
const animClass = computed(() => '')

/** 暴露方法给父组件 */
defineExpose({
  // P58: 新增 Sprite Sheet 控制
  playAction,
  stop,
  resume,
  // P51: 序列帧控制（向后兼容）
  startFramePlayback,
  stopFramePlayback,
  gotoFrame,
})
</script>

<style scoped>
.pet-animator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pet-anim-img {
  width: 900rpx;
  height: 900rpx;
}

/* P60: 静态兜底图 — 完全静止，无任何动画 */
.pet-anim-img--static {
  animation: none !important;
  transform: none !important;
  filter: none !important;
}

/* P51: 序列帧播放中的图像 — 快速切换平滑 */
.pet-anim-img--frame {
  transition: opacity 0.05s ease;
}

/* ================================================================
 * P60: Sprite Sheet 渐变容器 — opacity 过渡消除闪烁
 * ================================================================ */
.pet-anim-sprite-fade {
  width: 900rpx;
  height: 900rpx;
  background-repeat: no-repeat;
  background-position: 0 0;
  will-change: background-position, opacity;
  transition: opacity 0.3s ease;
  opacity: 0;
}

/* ================================================================
 * P58: 预生成 Sprite Sheet 滑动关键帧 (1-20 帧)
 * 使用百分比 background-position，配合 background-size: N*100% 100%
 * 例：8帧 → background-size: 800% 100%, keyframes to -800%
 * steps(N) 将动画均分 N 步，每步精确对应一帧
 * ================================================================ */
@keyframes sprite-slide-1 { from { background-position: 0 0; } to { background-position: -100% 0; } }
@keyframes sprite-slide-2 { from { background-position: 0 0; } to { background-position: -200% 0; } }
@keyframes sprite-slide-3 { from { background-position: 0 0; } to { background-position: -300% 0; } }
@keyframes sprite-slide-4 { from { background-position: 0 0; } to { background-position: -400% 0; } }
@keyframes sprite-slide-5 { from { background-position: 0 0; } to { background-position: -500% 0; } }
@keyframes sprite-slide-6 { from { background-position: 0 0; } to { background-position: -600% 0; } }
@keyframes sprite-slide-7 { from { background-position: 0 0; } to { background-position: -700% 0; } }
@keyframes sprite-slide-8 { from { background-position: 0 0; } to { background-position: -800% 0; } }
@keyframes sprite-slide-9 { from { background-position: 0 0; } to { background-position: -900% 0; } }
@keyframes sprite-slide-10 { from { background-position: 0 0; } to { background-position: -1000% 0; } }
@keyframes sprite-slide-11 { from { background-position: 0 0; } to { background-position: -1100% 0; } }
@keyframes sprite-slide-12 { from { background-position: 0 0; } to { background-position: -1200% 0; } }
@keyframes sprite-slide-13 { from { background-position: 0 0; } to { background-position: -1300% 0; } }
@keyframes sprite-slide-14 { from { background-position: 0 0; } to { background-position: -1400% 0; } }
@keyframes sprite-slide-15 { from { background-position: 0 0; } to { background-position: -1500% 0; } }
@keyframes sprite-slide-16 { from { background-position: 0 0; } to { background-position: -1600% 0; } }
@keyframes sprite-slide-17 { from { background-position: 0 0; } to { background-position: -1700% 0; } }
@keyframes sprite-slide-18 { from { background-position: 0 0; } to { background-position: -1800% 0; } }
@keyframes sprite-slide-19 { from { background-position: 0 0; } to { background-position: -1900% 0; } }
@keyframes sprite-slide-20 { from { background-position: 0 0; } to { background-position: -2000% 0; } }

/* ================================================================
 * P58: 循环版 Sprite Sheet 关键帧（不含尾帧，避免循环跳帧）
 * loopFrameCount = count - 1，最后一帧不参与循环
 * ================================================================ */
@keyframes sprite-slide-loop-1 { from { background-position: 0 0; } to { background-position: -100% 0; } }
@keyframes sprite-slide-loop-2 { from { background-position: 0 0; } to { background-position: -200% 0; } }
@keyframes sprite-slide-loop-3 { from { background-position: 0 0; } to { background-position: -300% 0; } }
@keyframes sprite-slide-loop-4 { from { background-position: 0 0; } to { background-position: -400% 0; } }
@keyframes sprite-slide-loop-5 { from { background-position: 0 0; } to { background-position: -500% 0; } }
@keyframes sprite-slide-loop-6 { from { background-position: 0 0; } to { background-position: -600% 0; } }
@keyframes sprite-slide-loop-7 { from { background-position: 0 0; } to { background-position: -700% 0; } }
@keyframes sprite-slide-loop-8 { from { background-position: 0 0; } to { background-position: -800% 0; } }
@keyframes sprite-slide-loop-9 { from { background-position: 0 0; } to { background-position: -900% 0; } }
@keyframes sprite-slide-loop-10 { from { background-position: 0 0; } to { background-position: -1000% 0; } }
@keyframes sprite-slide-loop-11 { from { background-position: 0 0; } to { background-position: -1100% 0; } }
@keyframes sprite-slide-loop-12 { from { background-position: 0 0; } to { background-position: -1200% 0; } }
@keyframes sprite-slide-loop-13 { from { background-position: 0 0; } to { background-position: -1300% 0; } }
@keyframes sprite-slide-loop-14 { from { background-position: 0 0; } to { background-position: -1400% 0; } }
@keyframes sprite-slide-loop-15 { from { background-position: 0 0; } to { background-position: -1500% 0; } }
@keyframes sprite-slide-loop-16 { from { background-position: 0 0; } to { background-position: -1600% 0; } }
@keyframes sprite-slide-loop-17 { from { background-position: 0 0; } to { background-position: -1700% 0; } }
@keyframes sprite-slide-loop-18 { from { background-position: 0 0; } to { background-position: -1800% 0; } }
@keyframes sprite-slide-loop-19 { from { background-position: 0 0; } to { background-position: -1900% 0; } }
</style>
