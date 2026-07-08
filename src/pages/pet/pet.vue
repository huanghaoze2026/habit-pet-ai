<template>
  <view class="page-pet">
    <!-- P55: 全屏模式 - 标题浮在信号栏下方,背景覆盖全屏 -->
    <view class="pet-top-bar" :style="{ paddingTop: (statusBarH || 20) + 'px' }">
      <view class="pet-top-row">
        <view class="pet-back" @click="goBack"><text>←</text></view>
        <text class="pet-title">AI 宠物</text>
        <view class="pet-back" />
      </view>
    </view>
    <!-- 无孩子空态 -->
    <EmptyState
      v-if="!store.hasChildren"
      icon="🐾"
      :title="copy.pet.noChild.title"
      :subtitle="copy.pet.noChild.subtitle"
      :button-text="copy.pet.noChild.button"
      @action="goAddChild"
    />

    <!-- 当前孩子宠物(无滑动切换) -->
    <view
      v-else
      class="pet-view"
    >
      <template v-if="currentChild">
        <!-- 当前页无宠物空态 -->
        <EmptyState
          v-if="petsByChild[currentChild.id] === null"
          icon="🥚"
          title="还没有宠物哦"
          subtitle="请先选择一只宠物,开始和TA互动吧!"
          button-text="去选择宠物"
          @action="goSelectPet"
        />

        <!-- 宠物主页 / 聊天 / 电话 -->
        <template v-else-if="petsByChild[currentChild.id]">
          <!-- ========== 宠物主页 (P51 游戏级重构 + P54 交互重构) ========== -->
          <PetScene
            v-if="viewMode === 'home'"
            :mood="currentPet.mood"
            :species-id="currentPet.speciesId"
            @touchstart="onHomeTouchStart"
            @touchend="onHomeTouchEnd"
          >
            <!-- P51: 宠物主体区域 - 绝对定位,偏上留出地面空间 -->
            <!-- P54: 点击宠物触发抚摸交互 -->
            <!-- P57: 进化中增加特效容器 -->
            <view :class="['pet-layer-area', 'pet-layer-area--' + currentPet.stageKey, { 'pet-layer-area--evolving': animationState === 'evolution' }]" @tap="handlePetTap">
              <!-- P57: 进化特效粒子层 -->
              <view v-if="animationState === 'evolution'" class="evo-particle-layer">
                <view class="evo-particle" v-for="i in 12" :key="i"
                  :style="{ animationDelay: (i * 0.15) + 's', left: (10 + Math.random() * 80) + '%' }" />
                <!-- 进化光柱 -->
                <view class="evo-light-beam" />
                <!-- 脉冲光环 -->
                <view class="evo-pulse-ring" />
                <view class="evo-pulse-ring evo-pulse-ring--delay" />
                <!-- P50: 进化中文字提示(黑色半透明遮罩背景 + 粒子特效) -->
                <view class="evo-evolving-text">
                  <text class="evo-evolving-label">宠物进化中...</text>
                  <text class="evo-evolving-hint">正在蜕变,请稍候</text>
                </view>
              </view>
              <!-- 问候气泡 -->
              <view v-if="greetingText" :class="['greeting-bubble', { 'greeting-bubble--first': isFirstMeeting }]">
                <text>{{ greetingText }}</text>
              </view>

              <!-- P68: 通话状态指示(宠物上方) -->
              <view v-if="isOnCall" class="call-status-indicator">
                <text v-if="callStatus === 'connecting'" class="call-status-dot call-status-dot--connecting">● 正在接通...</text>
                <text v-else-if="callStatus === 'pet_speaking'" class="call-status-dot call-status-dot--speaking">● 宠物正在说...</text>
                <text v-else-if="callStatus === 'listening'" class="call-status-dot call-status-dot--listening">● 正在听...</text>
                <text v-else class="call-status-dot">● 通话中</text>
              </view>

              <!-- P51: PetBubble 组件 - 从宠物头顶弹出 -->
              <PetBubble
                :text="petBubbleText"
                :visible="petBubbleVisible"
                @close="petBubbleVisible = false"
              />

              <!-- 宠物本体 -->
              <PetAnimator
                :image-src="petDisplayImage"
                :alt-action="petAltAction"
              >
                <text class="pet-sprite-emoji">{{ speciesEmoji(currentChild) }}</text>
              </PetAnimator>
            </view>

            <!-- P55: 状态卡 → 右上角,稍大玻璃卡片 -->
            <view class="pet-status-top-right">
              <PetStatusCard
                :level="currentPet.level"
                :stage-name="currentPet.stageName || '幼体期'"
                :mood-emoji="moodEmoji"
                :mood-label="moodLabel"
                :exp-percent="expPercent"
                :child-avatar="currentChild?.avatar"
                :child-name="currentChild?.nickname"
              />
            </view>

            <!-- P57: 底部按钮栏 - 💬/📞/🍖 水平对齐 -->
            <!-- P68: 通话中底部控制栏 -->
            <view v-if="isOnCall" class="call-bottom-bar">
              <!-- PTT 模式下的大按住说话按钮(挂断按钮上方) -->
              <view
                v-if="!isFullDuplex"
                class="call-ptt-big-btn"
                :class="{ 'call-ptt-big-btn--active': pttRecording }"
                @touchstart.prevent="startPttRecord"
                @touchend.prevent="stopPttRecord"
                @touchcancel.prevent="cancelPttRecord"
              >
                <text class="call-ptt-big-icon">🎤</text>
                <text class="call-ptt-big-label">{{ pttRecording ? '松开发送' : '按住说话' }}</text>
              </view>

              <!-- 模式切换 + 挂断:水平排列 -->
              <view class="call-bottom-row">
                <view class="call-mode-switch" @click="toggleRealtimeMode">
                  <text class="call-mode-label">切换对话模式</text>
                  <text class="call-mode-hint">{{ isFullDuplex ? '当前:自由通话' : '当前:按住说话' }}</text>
                </view>

                <view class="call-hangup-btn" @click="hangUp">
                  <text class="call-hangup-icon">📞</text>
                  <text class="call-hangup-text">挂断</text>
                </view>
              </view>
            </view>
            <view v-else class="pet-bottom-bar">
              <view class="pet-side-btn pet-side-btn--chat" @tap.stop="enterChat">
                <text class="pet-side-icon">💬</text>
              </view>
              <view v-if="petEnergy > 0" class="pet-side-btn pet-side-btn--feed" @tap.stop="feedPet">
                <text class="pet-side-icon">🍖</text>
              </view>
              <view class="pet-side-btn pet-side-btn--call" @tap.stop="startPhoneCall">
                <text class="pet-side-icon">📞</text>
              </view>
            </view>


            <!-- 🔧 P51: 临时调试按钮(折叠) -->
            <view v-if="!isOnCall" class="debug-actions debug-actions--collapsed">
              <view class="debug-btn" @click="testBreathe">🫁 呼吸</view>
              <view class="debug-btn" @click="testHappy">🤚 抚摸</view>
              <view class="debug-btn" @click="testEating">🍖 喂食</view>
              <view class="debug-btn" @click="testSad">😢 低落</view>
              <view class="debug-btn" @click="testEvolution">🌈 进化</view>
            </view>
          </PetScene>

          <!-- ========== 聊天界面 ========== -->
          <view
            v-else
            class="pet-chat"
            @touchstart="onChatTouchStart"
            @touchend="onChatTouchEnd"
          >
            <view class="top-bar" :style="{ paddingTop: (statusBarH || 20) + 'px' }">
              <view class="back-btn" @click="backToHome">
                <text class="back-arrow">←</text>
              </view>
              <image
                v-if="currentChild.avatar"
                :src="currentChild.avatar"
                class="top-bar-avatar"
                mode="aspectFill"
              />
              <view v-else class="top-bar-avatar-default">
                <text>{{ currentChild.gender === 'male' ? '👦' : currentChild.gender === 'female' ? '👧' : '👶' }}</text>
              </view>
              <text class="top-bar-name">{{ currentChild.nickname }}</text>
              <view class="tts-toggle" @click="ttsEnabled = !ttsEnabled">
                <text>{{ ttsEnabled ? '🔊' : '🔇' }}</text>
              </view>
            </view>

            <scroll-view
              scroll-y
              class="chat-list"
              :scroll-into-view="scrollToMap[currentChild.id] || ''"
              :scroll-with-animation="true"
            >
              <view
                v-for="(msg, idx) in (chatCache[currentChild.id] || [])"
                :key="idx"
                :id="'msg-' + currentChild.id + '-' + idx"
                class="chat-msg-row"
                :class="(msg.role === 'user' || msg.role === 'user_call') ? 'chat-msg-row--user' : 'chat-msg-row--pet'"
              >
                <view v-if="msg.role === 'user_call' || msg.role === 'pet_call'" class="call-msg-tag">
                  <text class="call-msg-icon">📞</text>
                  <text class="call-msg-label">通话</text>
                </view>
                <template v-if="msg.role === 'pet' || msg.role === 'pet_call'">
                  <view class="chat-avatar chat-avatar--pet">
                    <image v-if="chatSpriteUrl" :src="chatSpriteUrl" class="chat-avatar-img" mode="aspectFill" @error="onChatSpriteError" />
                    <text v-else class="pet-sprite-emoji">{{ speciesEmoji(currentChild) }}</text>
                  </view>
                  <view class="chat-bubble-wrapper">
                    <view class="chat-bubble chat-bubble--pet">
                      <text>{{ msg.content }}</text>
                    </view>
                    <view class="chat-speaker-btn" @tap.stop="playTTS(msg.content)">
                      <text class="chat-speaker-icon">🔊</text>
                    </view>
                    <text v-if="msg.time" class="chat-time chat-time--pet">{{ formatChatTime(msg.time) }}</text>
                  </view>
                </template>
                <template v-else>
                  <view class="chat-bubble-wrapper chat-bubble-wrapper--user">
                    <view class="chat-bubble chat-bubble--user">
                      <text>{{ msg.content }}</text>
                    </view>
                    <text v-if="msg.time" class="chat-time chat-time--user">{{ formatChatTime(msg.time) }}</text>
                  </view>
                  <view v-if="msg.type === 'voice'" class="chat-voice-tag">
                    <text class="chat-voice-icon">🎤</text>
                  </view>
                  <view class="chat-avatar chat-avatar--user">
                    <image v-if="currentChild.avatar" :src="currentChild.avatar" class="chat-avatar-img" mode="aspectFill" />
                    <text v-else>{{ currentChild.gender === 'male' ? '👦' : currentChild.gender === 'female' ? '👧' : '👶' }}</text>
                  </view>
                </template>
              </view>

              <view v-if="thinkingMap[currentChild.id]" class="chat-msg-row chat-msg-row--pet">
                <view class="chat-avatar chat-avatar--pet">
                  <image v-if="chatSpriteUrl" :src="chatSpriteUrl" class="chat-avatar-img" mode="aspectFill" />
                  <text v-else class="pet-sprite-emoji">{{ speciesEmoji(currentChild) }}</text>
                </view>
                <view class="chat-bubble chat-bubble--pet chat-bubble--thinking">
                  <text class="thinking-dot">●</text>
                  <text class="thinking-dot">●</text>
                  <text class="thinking-dot">●</text>
                </view>
              </view>

              <view v-if="ttsLoadingMap[currentChild.id]" class="chat-msg-row chat-msg-row--pet">
                <view class="chat-avatar chat-avatar--pet">
                  <text>{{ speciesEmoji(currentChild) }}</text>
                </view>
                <view class="tts-loading-bubble">
                  <text class="tts-spin-icon">⏳</text>
                  <text class="tts-loading-text">语音合成中...</text>
                </view>
              </view>

              <view :id="'chat-bottom-' + currentChild.id" style="height: 10rpx" />
            </scroll-view>

            <view class="chat-input-bar">
              <view class="voice-hold-area">
                <view
                  v-if="showTextInput[currentChild.id]"
                  class="chat-input-wrap"
                  @click.stop
                >
                  <input
                    v-model="inputMap[currentChild.id]"
                    class="chat-input"
                    placeholder="说点什么..."
                    confirm-type="send"
                    :disabled="thinkingMap[currentChild.id]"
                    @confirm="sendText(currentChild.id)"
                    :focus="showTextInput[currentChild.id]"
                  />
                </view>
                <view
                  v-else
                  class="voice-hold-btn"
                  :class="{ 'voice-hold-btn--recording': recordingMap[currentChild.id] }"
                  @touchstart.prevent="startRecord(currentChild.id, $event)"
                  @touchmove.prevent="onRecordTouchMove($event, currentChild.id)"
                  @touchend.prevent="stopRecord(currentChild.id)"
                  @touchcancel.prevent="cancelRecord(currentChild.id)"
                >
                  <text>{{ recordingMap[currentChild.id] ? '松开发送' : '按住说话' }}</text>
                </view>
                <view class="input-toggle-btn" @click="toggleInput(currentChild.id)">
                  <text>{{ showTextInput[currentChild.id] ? '🎤' : '⌨️' }}</text>
                </view>
              </view>
            </view>

            <view v-if="recordingMap[currentChild.id]" class="recording-overlay">
              <view class="recording-box">
                <view class="recording-wave">
                  <view class="recording-bar" v-for="i in 5" :key="i" :style="{ animationDelay: (i * 0.15) + 's' }" />
                </view>
                <text class="recording-text">{{ willCancelRecord ? '松开取消' : '正在聆听...松开发送' }}</text>
                <text class="recording-cancel">↑ 上滑取消</text>
              </view>
            </view>
          </view>
        </template>

        <view v-else class="loading-state">
          <text>加载中...</text>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { onShow, onHide, onUnload } from '@dcloudio/uni-app'
import { useChildStore } from '@/stores/child'
import { api } from '@/services/api'
import { copy } from '@/copy/onboarding'
import EmptyState from '@/components/empty-state/index.vue'
import PetAnimator from '@/components/pet-animator/index.vue'
import PetScene from '@/components/PetScene.vue'
import PetStatusCard from '@/components/PetStatusCard.vue'
import PetBubble from '@/components/pet-bubble/index.vue'
import { API_ORIGIN, API_BASE, WS_ORIGIN } from '@/utils/env'

const statusBarH = ref(20)
try { statusBarH.value = uni.getSystemInfoSync().statusBarHeight || 20 } catch {}
const goBack = () => uni.navigateBack()

/* ================================================================
 * G:统一 currentPet 对象 - P48 标准化数据结构
 * ================================================================ */
interface CurrentPet {
  id: string
  speciesId: string
  speciesName: string
  series: string
  stage: number
  stageKey: string
  stageLabel: string
  stageName: string
  level: number
  exp: number
  mood: number
  emotionKey: string
  spriteBaseUrl: string
}

function createDefaultPet(): CurrentPet {
  return {
    id: '', speciesId: '', speciesName: '', series: '',
    stage: 0, stageKey: 'egg', stageLabel: '', stageName: '蛋仔期',
    level: 1, exp: 0, mood: 80, emotionKey: 'idle', spriteBaseUrl: ''
  }
}

/** P57: stage 数值 → stageKey 字符串映射 */
function stageToKey(stage: number): string {
  const map: Record<number, string> = { 0: 'egg', 1: 'baby', 2: 'juvenile', 3: 'evolved', 4: 'ultimate' }
  return map[stage] || 'egg'
}

/** P57: stage 数值 → 阶段中文名 */
function stageToName(stage: number): string {
  const map: Record<number, string> = { 0: '蛋仔期', 1: '幼体期', 2: '成长期', 3: '进化期', 4: '究极期' }
  return map[stage] || '蛋仔期'
}

const currentPet = reactive<CurrentPet>(createDefaultPet())

/* ================================================================
 * P48:本地情绪覆盖 - 抚摸/喂食触发,4秒后自动恢复
 * ================================================================ */
const localEmotionOverride = ref<string | null>(null)
let emotionTimer: ReturnType<typeof setTimeout> | null = null

function setEmotionOverride(emotion: string, durationMs: number = 4000) {
  localEmotionOverride.value = emotion
  if (emotionTimer) clearTimeout(emotionTimer)
  emotionTimer = setTimeout(() => { localEmotionOverride.value = null }, durationMs)
}

/** 当前展示用的 emotionKey:优先本地覆盖,否则后端值 */
const displayEmotionKey = computed(() => {
  if (animationState.value === 'evolution') return 'evolution'
  return localEmotionOverride.value || currentPet.emotionKey || 'idle'
})

/* ================================================================
 * 常量映射
 * ================================================================ */
const SPRITE_BASE = `${API_ORIGIN}/uploads/sprites`
const SPRITE_V = 'v=20260630161700' // P50: 破微信图片缓存(更新于 2026-06-30 16:17)

/** P64: 宠物展示图片URL */
const petDisplayImage = computed(() => {
  const species = currentPet.speciesId
  const stage = currentPet.stageKey || 'egg'
  const emotion = currentPet.emotionKey || 'idle'
  if (!species) return ''
  return `${SPRITE_BASE}/${species}/${stage}_${emotion}.png?${SPRITE_V}`
})

/** P64: 简单动效类型 */
const petAltAction = ref('')

const SPECIES_EMOJI_MAP: Record<string, string> = {
  cloud_beast: '☁️', milk_tea_fox: '🦊', moon_rabbit: '🐰',
  fire_dragon_dog: '🐉', thunder_tiger: '⚡', sword_eagle: '🦅',
  doctor_cat: '📚', code_cool: '💻', azure_dragon: '🐲',
  phoenix_bird: '🔥', baize: '🦄', thunder_mecha_tiger: '⚡',
}
const SPECIES_LABEL_MAP: Record<string, string> = {
  cloud_beast: '云团兽', milk_tea_fox: '奶茶狐', moon_rabbit: '月兔',
  fire_dragon_dog: '小火龙犬', thunder_tiger: '雷虎机械兽', sword_eagle: '剑羽鹰',
  doctor_cat: '小博士猫', code_cool: '代码酷德', azure_dragon: '青龙幼灵',
  phoenix_bird: '凤凰鸟', baize: '白泽', thunder_mecha_tiger: '雷霆机甲虎',
}

function speciesEmoji(child: any): string {
  const sid = child?.petSpeciesId || petsByChild[child?.id]?.speciesId || currentPet.speciesId
  return (sid && SPECIES_EMOJI_MAP[sid]) || '🐾'
}
function speciesLabel(child: any): string {
  const sid = child?.petSpeciesId || petsByChild[child?.id]?.speciesId || currentPet.speciesId
  return (sid && SPECIES_LABEL_MAP[sid]) || '宠物'
}

/**
 * P54: 统一精灵图 URL 拼接 - 格式: speciesId/stageKey_emotionKey.png
 */
function getSpriteUrl(speciesId: string | undefined, stageKey: string, emotionKey: string): string {
  if (!speciesId) return ''
  const sk = stageKey || 'egg'
  const ek = emotionKey || 'idle'
  return `${SPRITE_BASE}/${speciesId}/${sk}_${ek}.png?${SPRITE_V}`
}

/* ================================================================
 * 互动限制
 * ================================================================ */
const PET_DAILY_LIMIT = 20
const FEED_COOLDOWN_MS = 4 * 60 * 60 * 1000 // 4小时

function getTodayKey() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function getDailyPetCount(): number {
  const key = `pet_daily_count_${currentPet.id}`
  const stored = uni.getStorageSync(key)
  if (!stored) return 0
  try {
    const data = JSON.parse(stored)
    if (data.date === getTodayKey()) return data.count
  } catch {}
  return 0
}

function incrementDailyPetCount() {
  const key = `pet_daily_count_${currentPet.id}`
  const count = getDailyPetCount() + 1
  uni.setStorageSync(key, JSON.stringify({ date: getTodayKey(), count }))
  return count
}

function getLastFeedTime(): number {
  const key = `pet_last_feed_time_${currentPet.id}`
  return uni.getStorageSync(key) || 0
}

function setLastFeedTime() {
  const key = `pet_last_feed_time_${currentPet.id}`
  uni.setStorageSync(key, Date.now())
}

function getFeedCooldownRemaining(): number {
  const last = getLastFeedTime()
  const elapsed = Date.now() - last
  const remaining = FEED_COOLDOWN_MS - elapsed
  return Math.max(0, remaining)
}

/* ================================================================
 * 状态
 * ================================================================ */
interface ChatMessage {
  role: 'user' | 'pet' | 'user_call' | 'pet_call'
  content: string
  type?: 'text' | 'voice'
  time?: string
}
interface PetInfo {
  id: string; name: string; stage: string; level: number; mood: number
  speciesId?: string; stageKey?: string; emotionKey?: string; stageName?: string
  [key: string]: any
}

const store = useChildStore()
const currentChild = computed(() => store.childList[store.currentIndex] || null)


// 聊天/电话头像精灵图
const chatSpriteUrl = computed(() => {
  const pet = currentPet
  if (!pet.speciesId) return ''
  return getSpriteUrl(pet.speciesId, pet.stageKey, 'idle')
})
function onChatSpriteError() {
  // chat 头像加载失败 → 自动回退 emoji(由 v-else 处理)
}

// 隔离状态
const chatCache = reactive<Record<string, ChatMessage[]>>({})
const petsByChild = reactive<Record<string, PetInfo | null | undefined>>({})
const thinkingMap = reactive<Record<string, boolean>>({})
const recordingMap = reactive<Record<string, boolean>>({})
const showTextInput = reactive<Record<string, boolean>>({})
const ttsLoadingMap = reactive<Record<string, boolean>>({})
const willCancelRecord = ref(false)
const recordStartY = ref(0)
const inputMap = reactive<Record<string, string>>({})
const ttsEnabled = ref(true)
const scrollToMap = reactive<Record<string, string>>({})
const recorderMap = reactive<Record<string, any>>({})
const viewMode = ref<'home' | 'chat'>('home')

const petEnergy = ref(75)
const greetingText = ref('')
const isFirstMeeting = ref(false)
/** P57: 标记刚完成进化,用于显示专属问候 */
let greetingTimer: ReturnType<typeof setTimeout> | null = null
const justEvolved = ref(false)

// P48: 动画状态(驱动 PetAnimator CSS)
const animationState = ref<'idle' | 'happy' | 'sad' | 'eating' | 'evolution'>('idle')
const petBubbleText = ref('')

/* P50: 心情/时间背景由 PetScene 接管 */

const moodEmoji = computed(() => {
  const m = currentPet.mood
  if (m >= 80) return '😄'
  if (m >= 60) return '🙂'
  if (m >= 40) return '😐'
  return '😢'
})

const moodText = computed(() => {
  const m = currentPet.mood
  if (m >= 80) return '今天很开心!😄'
  if (m >= 60) return '心情不错~'
  if (m >= 40) return '有点想你...'
  return '你能陪陪我吗...🥺'
})

/** P51: 成长能量百分比(0-100) */
const expPercent = computed(() => {
  // 如果 currentPet 有 expPercent 直接用,否则根据 level 估算
  const pet = currentPet as any
  if (typeof pet.expPercent === 'number') return Math.round(pet.expPercent * 100)
  // 估算:每级需要 100 经验,当前经验 % 100 即为进度
  return Math.min(100, Math.max(0, ((currentPet.exp || 0) % 100)))
})

/** P51: 心情标签 */
const moodLabel = computed(() => {
  const m = currentPet.mood
  if (m >= 80) return '超级开心'
  if (m >= 60) return '心情不错'
  if (m >= 40) return '有点低落'
  return '需要关怀'
})

/** P51: 气泡显示控制 */
const petBubbleVisible = ref(false)

/* ================================================================
 * onShow - 初始化 & 进化检测
 * ================================================================ */
onShow(() => {
  try {
    if (!playingAudio.value) {
      const a = uni.createInnerAudioContext({ useWebAudioImplement: true })
      a.obeyMuteSwitch = false
      playingAudio.value = a
    }
  } catch {}

  store.fetchChildList().then(() => {
    if (store.childList.length > 0) {
      const child = store.childList[store.currentIndex]
      if (child) {
        // P48: 检查是否刚完成进化(用 createdAt 新字段名)
        const evolveFlag = uni.getStorageSync('pet_just_evolved')
        if (evolveFlag) {
          try {
            const flag = JSON.parse(evolveFlag)
            const ts = flag.createdAt || flag.time || 0
            // P50: 校验 childId 匹配,防止第二个宝贝误触发进化动画
            if (flag.petId && flag.childId === child.id && (Date.now() - ts < 120000)) {
              // P50: 立即清除标记,防止重复触发
              uni.removeStorageSync('pet_just_evolved')

              // P50: 预填充临时 pet 对象,防止模板回退到"加载中..."
              petsByChild[child.id] = {
                id: flag.petId || '',
                speciesId: flag.speciesId || '',
                stageKey: flag.fromStageKey || 'egg',
              } as any

              // P50: 进化动画 - 用原始形态显示进化特效
              currentPet.speciesId = flag.speciesId || ''
              currentPet.stageKey = flag.fromStageKey || 'egg'
              currentPet.stage = flag.fromStage ?? 0
              currentPet.stageName = flag.fromStageName || '蛋仔期'
              currentPet.mood = 80
              localEmotionOverride.value = null
              animationState.value = 'evolution'
              petBubbleText.value = '完成任务,我进化了!'
              petBubbleVisible.value = true
              // P50: 10 秒后结束进化,重新拉取数据(显示新形态)
              setTimeout(() => {
                animationState.value = 'idle'
                petBubbleText.value = ''
                petBubbleVisible.value = false
                justEvolved.value = true
                petsByChild[child.id] = null
                loadPetAndHistory(child.id)
              }, 10000)
              return
            }
            uni.removeStorageSync('pet_just_evolved')
          } catch {}
        }
        loadPetAndHistory(child.id)
        setTimeout(() => scrollToBottom(child.id), 500)
      }
    }
  })
})

// P68-修复2: 页面隐藏时关闭通话连接
onHide(() => {
  if (isOnCall.value) {
    console.log('[P68] Page hide — closing call')
    hangUp()
  }
})

// P68-修复2: 页面卸载时清理
onUnload(() => {
  hangUp()
  stopMicrophone()
})

watch(() => store.currentChildId, (newChildId: string | null) => {
  if (newChildId) {
    loadPetAndHistory(newChildId)
  }
})

/* ================================================================
 * G:loadPetAndHistory - 填充 unified currentPet
 * ================================================================ */
const loadPetAndHistory = async (childId: string) => {
  inputMap[childId] = ''
  showTextInput[childId] = false

  try {
    const res = await api.get<PetInfo[]>('/pet/list', { childId })
    const pets = res.data || []
    const pet: PetInfo | null = (Array.isArray(pets) && pets.length > 0) ? pets[0] : null
    petsByChild[childId] = pet

    if (pet) {
      // P48: 填充 unified currentPet
      currentPet.id = pet.id || ''
      currentPet.speciesId = pet.speciesId || ''
      currentPet.speciesName = (pet as any).speciesName || ''
      currentPet.series = (pet as any).series || ''
      currentPet.stage = (pet as any).stage ?? 0
      currentPet.stageKey = pet.stageKey || stageToKey(currentPet.stage)
      currentPet.stageLabel = (pet as any).stageLabel || ''
      currentPet.stageName = pet.stageName || stageToName(currentPet.stage)
      currentPet.level = pet.level || 1
      currentPet.exp = (pet as any).exp || 0
      currentPet.mood = pet.mood || 50
      currentPet.emotionKey = pet.emotionKey || 'idle'
      currentPet.spriteBaseUrl = (pet as any).spriteBaseUrl || ''

    } else {
      Object.assign(currentPet, createDefaultPet())
    }

    await loadGreeting(childId)

    // P51: 进入主页后
    if (viewMode.value === 'home' && animationState.value === 'idle') {
      // P64: 已移除序列帧待机动画
    }

    // 加载对话历史
    if (pet) {
      try {
        const historyRes = await api.get<{ messages: { role: string; content: string; time: string }[] }>('/ai/history', { childId, limit: 100 })
        const msgs = (historyRes.data as any)?.messages || []
        const existingMsgs = chatCache[childId] || []
        if (msgs.length > 0) {
          const dbMsgs = msgs.map((m: any) => ({
            role: (m.role === 'assistant' ? 'pet' : m.role) as ChatMessage['role'],
            content: m.content,
            type: 'text' as const,
            time: m.time,
          }))
          const seen = new Set(existingMsgs.map(m => `${m.role}:${m.content}`))
          const newOnly = dbMsgs.filter(m => !seen.has(`${m.role}:${m.content}`))
          chatCache[childId] = [...newOnly, ...existingMsgs]
        } else if (existingMsgs.length === 0) {
          chatCache[childId] = [
            { role: 'pet', content: '嗷呜!你终于来啦,想和我聊点什么?😊' },
          ]
        }
        setTimeout(() => scrollToBottom(childId), 300)
      } catch {
        if (!chatCache[childId] || chatCache[childId].length === 0) {
          chatCache[childId] = [
            { role: 'pet', content: '嗷呜!你终于来啦,想和我聊点什么?😊' },
          ]
        }
      }
    }
  } catch {
    petsByChild[childId] = null
    Object.assign(currentPet, createDefaultPet())
  }
}

const loadGreeting = async (childId: string) => {
  // 清除之前的自动关闭定时器
  if (greetingTimer) { clearTimeout(greetingTimer); greetingTimer = null }
  try {
    const res = await api.get<{ greeting: string; mood: number; isFirstTime?: boolean }>('/pet/greeting', { childId })
    greetingText.value = res.data?.greeting || ''
    if (res.data?.mood !== undefined) currentPet.mood = res.data.mood
    if (res.data?.isFirstTime) isFirstMeeting.value = true
  } catch {
    greetingText.value = ''
  }
  // P57: 无后端问候时,按 stage 和进化状态补本地文案
  if (!greetingText.value) {
    if (justEvolved.value) {
      greetingText.value = Math.random() > 0.5 ? '主人!我出来啦!' : '我已经升级啦!'
      justEvolved.value = false
    } else if (currentPet.stageKey === 'egg') {
      greetingText.value = Math.random() > 0.5 ? '咚咚......我在蛋里等你哦' : '完成任务后,我就能破壳啦'
    } else {
      greetingText.value = '嗷呜!你终于来啦!'
    }
  }
  // P57: 问候气泡 8 秒后自动关闭
  if (greetingText.value) {
    greetingTimer = setTimeout(() => { greetingText.value = '' }, 8000)
  }
}

const enterChat = () => {
  const child = store.childList[store.currentIndex]
  if (child) loadPetAndHistory(child.id)
  viewMode.value = 'chat'
}
const backToHome = () => {
  // P64: 已移除序列帧动画
  viewMode.value = 'home'
}
const backToTaskList = () => { uni.redirectTo({ url: '/pages/task/task' }) }

// 右滑手势
const chatTouchStartX = ref(0)
const homeTouchStartX = ref(0)
const onChatTouchStart = (e: any) => { chatTouchStartX.value = e.touches[0]?.clientX || 0 }
const onChatTouchEnd = (e: any) => {
  const endX = e.changedTouches[0]?.clientX || 0
  if (endX - chatTouchStartX.value > 80 && viewMode.value === 'chat') backToHome()
}
const onHomeTouchStart = (e: any) => { homeTouchStartX.value = e.touches[0]?.clientX || 0 }
const onHomeTouchEnd = (e: any) => {
  const endX = e.changedTouches[0]?.clientX || 0
  const deltaX = endX - homeTouchStartX.value
  if (Math.abs(deltaX) > 80 && viewMode.value === 'home') backToTaskList()
}

/* ================================================================
 * P68: 全双工实时语音通话
 * ================================================================ */
const isOnCall = ref(false)
const isFullDuplex = ref(true)           // 是否全双工模式
const callStatus = ref<string>('idle')    // idle | connecting | connected | listening | pet_speaking | error
const callError = ref('')                 // 错误信息
const callPetText = ref('')               // 通话中宠物所说的文字

// WebSocket 相关
let wsConnection: any = null
let wsPingTimer: ReturnType<typeof setInterval> | null = null
let reconnectAttempts = 0
const MAX_RECONNECT = 3
// P71: PTT 模式主动关 WS 的意图标志——置真时 onClose 不触发自动重连(切"按住说话"/挂断时用)
let pttIntentionalClose = false
// P71: 缓存本次通话的 token/childId, 供切回"自由通话"时重建 WS 复用
let callToken = ''
let callChildId = ''

// PCM 音频缓冲队列 (fallback 文件式路径使用)
interface PcmQueueItem { data: ArrayBuffer; sampleRate: number }
const pcmBufferQueue: PcmQueueItem[] = []
let isPlayingPcm = false
let pcmPlayer: any = null

// P68-无缝播放: WebAudioContext 链式排程(消除 Gemini 碎包导致的沙沙/断续)
// 旧路径每个碎包都写临时 wav + 新建 InnerAudioContext 顺序播放 → 频繁建缓存 → 严重空隙。
// 改为 wx.createWebAudioContext() 用 AudioBufferSourceNode 按时间轴无缝拼接;
// 低版本基础库(无 createWebAudioContext) 自动回退到旧文件式路径。
const useWebAudio = typeof (wx as any).createWebAudioContext === 'function'
  || typeof (uni as any).createWebAudioContext === 'function'
let webAudioUnavailable = false                 // 运行期 WebAudio 创建/播放失败后置真, 后续直接走文件回退
let pcmLastPath: 'webaudio' | 'file' | '' = ''  // 仅用于诊断日志: 当前实际走的播放路径
let fallbackPrimeTimer: ReturnType<typeof setTimeout> | null = null  // 文件回退: 首段攒缓冲定时器
let webAudioCtx: any = null
let nextStartTime = 0
let activeSources: any[] = []
// P71-抖动缓冲(加大版): 首播提前量 + 最小预缓冲门槛, 宁可多一点起播延迟换连续不断字
// (受端侧碎包+调度限制无法做到绝对无缝, 目标是把"两字一顿"改善为基本连贯)
const PRIME_LEAD_SEC = 1.3        // 首段整体排到 currentTime + 该值处起播, 建立抖动缓冲(原 FIRST_PRIME 0.6)
const MIN_PREBUFFER_SEC = 0.8     // 最小预缓冲: 首包到达后先累积到该时长 PCM 再开始排程, 避免一到货就播频繁欠载
const PRIME_MAX_WAIT_MS = 1500    // 预缓冲最大等待兜底: 数据缓慢时最多等这么久也开播, 控制首字延迟上限
const REPRIME_SEC = 0.6           // 欠载重建缓冲(原 0.4): 排程落后 currentTime 时重新提前该值起播
let webAudioPrimed = false        // 预缓冲门槛已满足并已开始排程
let pendingWebAudioBufs: any[] = [] // 预缓冲累积但尚未排程的 AudioBuffer
let pendingWebAudioDur = 0        // 预缓冲累积时长(秒)
let webAudioPrimeTimer: ReturnType<typeof setTimeout> | null = null  // 预缓冲最大等待兜底定时器

// 🔍 诊断: 打印 WebAudio 探测结果, 便于真机确认走哪条路径
try {
  console.log('[P70][audio] detect useWebAudio=', useWebAudio,
    '| wx.createWebAudioContext=', typeof (wx as any).createWebAudioContext,
    '| uni.createWebAudioContext=', typeof (uni as any).createWebAudioContext)
} catch {}

function ensureWebAudioCtx(): any {
  if (!webAudioCtx) {
    if (typeof (wx as any).createWebAudioContext === 'function') {
      webAudioCtx = (wx as any).createWebAudioContext()
    } else if (typeof (uni as any).createWebAudioContext === 'function') {
      webAudioCtx = (uni as any).createWebAudioContext()
    } else {
      throw new Error('WebAudioContext unavailable')
    }
    nextStartTime = 0
    try {
      console.log('[P70][audio] createWebAudioContext ok, SDKVersion=',
        (wx as any).getSystemInfoSync ? (wx as any).getSystemInfoSync().SDKVersion : 'n/a')
    } catch {}
  }
  return webAudioCtx
}

// 按住说话模式
const pttRecording = ref(false)
let pttRecorder: any = null       // 兼容旧引用，不再单独 getRecorderManager()
let pttRecorderStartTime = 0

// P68-fix: RecorderManager 是全局单例，全双工(mic) 与 按住说话(ptt) 必须共用同一个实例。
// 之前两处各自 uni.getRecorderManager() 并各自注册回调，切 mic→ptt 时上一段录音可能
// 尚未释放就 start 新录音 → operateRecorder:fail，PTT 起不来、onStop 不触发、从不上传。
// 方案：单例惰性初始化，回调只注册一次，按 recorderMode 分发；上滑取消用 pttCancelled 跳过上传。
let recorderManager: any = null
let recorderMode: 'mic' | 'ptt' | null = null
let pttCancelled = false
// 半双工防回声护栏：宠物音频到达/播放期间(+拖尾)静音麦克风推流的截止时间戳
let petAudioGuardUntil = 0

// 相对时间格式化：今天->HH:mm；昨天->昨天 HH:mm；本周内->周X HH:mm；更早->M月D日 HH:mm
function formatChatTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes())
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000)
  if (diffDays <= 0) return hm
  if (diffDays === 1) return '昨天 ' + hm
  if (diffDays < 7) {
    return ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()] + ' ' + hm
  }
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hm
}

function stopAllTTS() {
  audioQueue.value = []
  queueIndex = 0
  queuePlaying = false
  if (queueAudio) {
    try { queueAudio.stop() } catch {}
    try { queueAudio.offEnded() } catch {}
    try { queueAudio.offError() } catch {}
  }
  if (playingAudio.value && playingAudio.value !== queueAudio) {
    try { playingAudio.value.stop() } catch {}
    try { playingAudio.value.destroy() } catch {}
  }
  playingAudio.value = null
}

function stopAllAudio() {
  // WebAudio 分支: 停止所有排程中的 source(打断/stop_audio 都会调用)
  if (activeSources.length) {
    for (const s of activeSources) {
      try { s.stop() } catch {}
    }
    activeSources = []
  }
  // 打断后重新从 ctx.currentTime 排程; 不在此处 close() ctx(同一通话继续复用)
  nextStartTime = 0
  resetWebAudioPrimeState()   // P71: 打断后清空预缓冲, 下段重新攒够门槛再播

  // 停止所有 InnerAudioContext 实例
  if (playingAudio.value) {
    try { playingAudio.value.stop() } catch {}
    try { playingAudio.value.destroy() } catch {}
  }
  // 停止 PCM 播放器 (fallback 文件式路径)
  if (pcmPlayer) {
    try { pcmPlayer.stop() } catch {}
    try { pcmPlayer.destroy() } catch {}
    pcmPlayer = null
  }
  // 清理文件回退的首段攒缓定时器
  if (fallbackPrimeTimer) { clearTimeout(fallbackPrimeTimer); fallbackPrimeTimer = null }
  pcmBufferQueue.length = 0
  isPlayingPcm = false
  pcmLastPath = ''
}

// ========== WebSocket 连接 ==========
function connectWebSocket(token: string, childId: string) {
  if (wsConnection) {
    try { wsConnection.close() } catch {}
  }

  const wsUrl = `${WS_ORIGIN}/api/v1/ai/realtime-call?token=${encodeURIComponent(token)}&childId=${encodeURIComponent(childId)}`

  // 🔍 诊断日志
  console.log('[P68] Connecting WebSocket:', wsUrl.replace(token, 'TOKEN_HIDDEN'))
  callError.value = ''

  wsConnection = uni.connectSocket({
    url: wsUrl,
    header: {
      'content-type': 'application/json'
    },
    success: () => {
      console.log('[P68] uni.connectSocket success')
    },
    fail: (err: any) => {
      console.error('[P68] uni.connectSocket fail:', JSON.stringify(err))
      handleWsError('连接失败: ' + (err.errMsg || '未知错误'))
    }
  })

  wsConnection.onOpen(() => {
    console.log('[P68] WebSocket onOpen')
    reconnectAttempts = 0
    callStatus.value = 'connected'
    startWsPing()
    if (isFullDuplex.value) {
      startMicrophone()
    }
  })

  wsConnection.onMessage((res: any) => {
    if (res.data instanceof ArrayBuffer) {
      handlePcmAudio(res.data)
      return
    }
    let data: any
    try { data = JSON.parse(res.data) } catch { return }

    switch (data.type) {
      case 'call_connected':
        callPetText.value = data.text || data.message || '喂?听到你啦!'
        callStatus.value = 'pet_speaking'
        if (data.audio) handleBase64Pcm(data.audio)
        break
      case 'pet_speaking':
        callPetText.value = data.text || ''
        callStatus.value = 'pet_speaking'
        break
      case 'pet_silent':
        callStatus.value = 'listening'
        break
      case 'listening':
        callStatus.value = 'listening'
        break
      case 'stop_audio':
        stopAllTTS()
        stopAllAudio()
        pcmBufferQueue.length = 0
        isPlayingPcm = false
        break
      case 'audio_data':
      case 'audio_response':
        callStatus.value = 'pet_speaking'
        // 兼容 mimeType 和 mime_type 两种字段名
        const mt = data.mimeType || data.mime_type || 'audio/pcm'
        handleBase64Pcm(data.data, mt)
        break
      case 'error':
        callError.value = data.message || '通话异常'
        break
      case 'fallback_mode':
        isFullDuplex.value = false
        uni.showToast({ title: '已切换到按住说话模式', icon: 'none' })
        break
      case 'call_ended':
        break
    }
  })

  wsConnection.onClose((res: any) => {
    console.log('[P68] WebSocket onClose, code:', res?.code, 'reason:', res?.reason)
    stopWsPing()

    // P71: 切 PTT / 挂断等主动关闭 → 不自动重连
    if (pttIntentionalClose) {
      console.log('[P71] intentional close (ptt/hangup), skip reconnect')
      pttIntentionalClose = false
      return
    }

    // 如果还在通话状态且不是主动挂断，尝试重连
    if (isOnCall.value && reconnectAttempts < MAX_RECONNECT && res?.code !== 1000) {
      reconnectAttempts++
      console.log('[P68] Reconnecting... attempt', reconnectAttempts)
      // 获取 token
      const token = uni.getStorageSync('habitpet_token') || uni.getStorageSync('token')
      const childId = currentChild?.value?.id || ''
      setTimeout(() => {
        if (isOnCall.value) connectWebSocket(token, childId)
      }, 1000)
    }
  })

  wsConnection.onError((err: any) => {
    console.error('[P68] WebSocket onError:', JSON.stringify(err))
    handleWsError('WebSocket 连接错误')
  })
}

// ========== 麦克风管理 ==========
let micRecorder: any = null      // 兼容旧引用

// P68-fix: 惰性初始化全局单例 RecorderManager，回调只注册一次，按 recorderMode 分发
function getRecorder() {
  if (recorderManager) return recorderManager
  recorderManager = uni.getRecorderManager()

  // 帧回调：仅全双工(mic) 模式推流给后端
  recorderManager.onFrameRecorded((res: any) => {
    if (recorderMode !== 'mic') return
    // 半双工防回声：宠物正在说话(含播放拖尾)时不推流麦克风，
    // 否则外放的宠物声被麦克风采集→回传 Gemini→被当成用户说话→回声反馈环，
    // 表现为多轮后宠物开始回应自己的话、对话错乱/卡住。
    if (!wsConnection) return
    if (callStatus.value === 'pet_speaking' || Date.now() < petAudioGuardUntil) return
    callStatus.value = 'listening'
    wsConnection.send({
      data: res.frameBuffer,
      success: () => {},
      fail: () => handleWsError('发送音频失败')
    })
  })

  recorderManager.onStart(() => {})

  // 停止回调：仅 PTT 模式处理（取消判定 + 时长校验 + 上传）；mic 模式无需处理
  recorderManager.onStop(async (res: any) => {
    if (recorderMode !== 'ptt') return

    // 上滑取消：不上传
    if (pttCancelled) {
      pttCancelled = false
      pttRecording.value = false
      return
    }

    const duration = Date.now() - pttRecorderStartTime
    if (duration < 800) {
      pttRecording.value = false
      uni.showToast({ title: '说话太短了', icon: 'none' })
      return
    }

    pttRecording.value = false
    callStatus.value = 'pet_speaking'

    try {
      const childId = currentChild?.value?.id || ''
      await sendVoiceToHttp(res.tempFilePath, childId)
    } catch (e: any) {
      console.error('[P68] PTT voice chat error:', e)
      callStatus.value = 'listening'
      uni.showToast({ title: '语音识别失败,请重试', icon: 'none' })
    }
  })

  // 出错回调：按模式分发
  recorderManager.onError(() => {
    if (recorderMode === 'ptt') {
      pttRecording.value = false
      uni.showToast({ title: '录音失败', icon: 'none' })
    } else {
      handleWsError('麦克风错误')
    }
  })

  return recorderManager
}

function startMicrophone() {
  recorderMode = 'mic'
  const rec = getRecorder()
  micRecorder = rec   // 兼容旧引用
  rec.start({
    duration: 60000,
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 48000,
    format: 'pcm',
    frameSize: 10
  })
}

function stopMicrophone() {
  if (recorderManager) {
    try { recorderManager.stop() } catch {}
  }
  recorderMode = null
  // 保持单例：不置空 recorderManager
}

// ========== PCM 音频播放 ==========
// P71: 统一登记正在播放的 source, 结束后从 activeSources 移除(供打断/挂断时 stop)
function trackActiveSource(source: any) {
  activeSources.push(source)
  source.onended = () => {
    const idx = activeSources.indexOf(source)
    if (idx >= 0) activeSources.splice(idx, 1)
  }
}

// P71: 重置 WebAudio 预缓冲/排程状态(打断、开播、挂断时调用)
function resetWebAudioPrimeState() {
  webAudioPrimed = false
  pendingWebAudioBufs = []
  pendingWebAudioDur = 0
  if (webAudioPrimeTimer) { clearTimeout(webAudioPrimeTimer); webAudioPrimeTimer = null }
}

// P71: 预缓冲攒够后, 把累积碎包整体排程——首段从 currentTime + PRIME_LEAD_SEC 起播建立抖动缓冲
function flushWebAudioPrime(ctx: any) {
  if (webAudioPrimeTimer) { clearTimeout(webAudioPrimeTimer); webAudioPrimeTimer = null }
  webAudioPrimed = true
  const primedDur = pendingWebAudioDur
  const bufs = pendingWebAudioBufs
  pendingWebAudioBufs = []
  pendingWebAudioDur = 0
  nextStartTime = ctx.currentTime + PRIME_LEAD_SEC
  for (const b of bufs) {
    const source = ctx.createBufferSource()
    source.buffer = b
    source.connect(ctx.destination)
    source.start(nextStartTime)
    nextStartTime += b.duration
    trackActiveSource(source)
  }
  try { console.log('[P71][audio] webaudio primed: prebuffered=', primedDur.toFixed(2), 's, lead=', PRIME_LEAD_SEC, 's') } catch {}
}

// P71: primed 之后的连续排程——衔接 nextStartTime(无缝); 欠载则重建 REPRIME 缓冲(nextStartTime 只增不回退)
function scheduleWebAudioBuffer(ctx: any, buffer: any) {
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  const ctxNow = ctx.currentTime
  let startAt: number
  if (nextStartTime <= ctxNow + 0.02) {
    // 欠载: 排程已被播放追上/落后 → 重新提前 REPRIME_SEC 起播, 重建缓冲
    startAt = ctxNow + REPRIME_SEC
    try { console.log('[P71][audio] underrun -> reprime', REPRIME_SEC, 's') } catch {}
  } else {
    startAt = nextStartTime
  }
  source.start(startAt)
  nextStartTime = startAt + buffer.duration
  trackActiveSource(source)
}

function handlePcmAudio(pcmData: ArrayBuffer, sampleRate: number = 24000) {
  // 半双工防回声：只要有宠物音频到达/播放，其后 700ms 内静音麦克风推流(覆盖抖动缓冲+尾包)
  petAudioGuardUntil = Date.now() + 700
  // 无 WebAudio(低版本基础库) 或运行期失败: 走文件式回退(合并缓冲, 见 scheduleFallbackPlayback)
  if (!useWebAudio || webAudioUnavailable) {
    if (pcmLastPath !== 'file') { console.log('[P70][audio] path=file-fallback(merged buffer)'); pcmLastPath = 'file' }
    pcmBufferQueue.push({ data: pcmData, sampleRate })
    scheduleFallbackPlayback()
    return
  }

  // P71-加大抖动缓冲: 预缓冲门槛 + 首播提前量, 换连续不断字
  // WebAudioContext 链式排程: Int16 PCM → Float32 → AudioBuffer
  try {
    const ctx = ensureWebAudioCtx()
    if (pcmLastPath !== 'webaudio') {
      console.log('[P71][audio] path=webaudio(seamless), PRIME_LEAD=', PRIME_LEAD_SEC, 'MIN_PREBUF=', MIN_PREBUFFER_SEC, 'REPRIME=', REPRIME_SEC)
      pcmLastPath = 'webaudio'
    }

    // 字节数应为偶数; 奇数做防护截断
    const usableBytes = pcmData.byteLength - (pcmData.byteLength % 2)
    if (usableBytes <= 0) return
    const i16 = new Int16Array(pcmData.slice(0, usableBytes))
    const f32 = new Float32Array(i16.length)
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768

    const buffer = ctx.createBuffer(1, f32.length, sampleRate)
    if (typeof buffer.getChannelData === 'function') {
      buffer.getChannelData(0).set(f32)
    } else if (typeof buffer.copyToChannel === 'function') {
      buffer.copyToChannel(f32, 0)
    }

    // 预缓冲阶段(尚未 primed): 先把碎包 AudioBuffer 攒起来,
    // 累积到 MIN_PREBUFFER_SEC(或 PRIME_MAX_WAIT_MS 超时兜底)再一次性排程,
    // 避免一到货就播导致频繁欠载断续。
    if (!webAudioPrimed) {
      pendingWebAudioBufs.push(buffer)
      pendingWebAudioDur += buffer.duration
      if (pendingWebAudioDur >= MIN_PREBUFFER_SEC) {
        flushWebAudioPrime(ctx)
      } else if (!webAudioPrimeTimer) {
        webAudioPrimeTimer = setTimeout(() => {
          webAudioPrimeTimer = null
          if (!webAudioPrimed && pendingWebAudioBufs.length) {
            try { flushWebAudioPrime(ensureWebAudioCtx()) } catch {}
          }
        }, PRIME_MAX_WAIT_MS)
      }
      return
    }

    // 已 primed: 连续段直接衔接 nextStartTime(无缝); 欠载则重建 REPRIME 缓冲。
    scheduleWebAudioBuffer(ctx, buffer)
  } catch (e) {
    // WebAudio 异常 → 标记不可用, 兜底走文件式路径(后续直接走回退, 不再逐包重试)
    webAudioUnavailable = true
    try { console.warn('[P70][audio] WebAudio failed, fallback to file path:', (e as any) && (e as any).message) } catch {}
    pcmLastPath = 'file'
    pcmBufferQueue.push({ data: pcmData, sampleRate })
    scheduleFallbackPlayback()
  }
}

function handleBase64Pcm(base64Data: string, mimeType: string = 'audio/pcm') {
  try {
    // 从 mimeType 中提取采样率
    let sampleRate = 24000
    if (mimeType.includes('16000')) sampleRate = 16000

    const binaryStr = (uni as any).base64ToArrayBuffer
      ? (uni as any).base64ToArrayBuffer(base64Data)
      : base64ToArrayBuffer(base64Data)
    handlePcmAudio(binaryStr, sampleRate)
  } catch {
    // 解码失败忽略
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryStr = atob ? atob(base64) : decodeBase64(base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes.buffer
}

function decodeBase64(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let output = ''
  let i = 0
  input = input.replace(/[^A-Za-z0-9+/=]/g, '')
  while (i < input.length) {
    const e1 = chars.indexOf(input.charAt(i++))
    const e2 = chars.indexOf(input.charAt(i++))
    const e3 = chars.indexOf(input.charAt(i++))
    const e4 = chars.indexOf(input.charAt(i++))
    output += String.fromCharCode((e1 << 2) | (e2 >> 4))
    if (e3 !== 64) output += String.fromCharCode(((e2 & 15) << 4) | (e3 >> 2))
    if (e4 !== 64) output += String.fromCharCode(((e3 & 3) << 6) | e4)
  }
  return output
}

// ===== 文件式回退: 合并缓冲播放(替代逐块 WAV+InnerAudioContext, 消除逐字断续) =====
// 思路: 把队列里已到达的多个 PCM 碎包拼接成较大一段再转一个 WAV 播放,
// 显著减少 InnerAudioContext 建实例次数与段间空隙。首段先攒够最小缓冲再开播,
// 连续段在上一段 onEnded 时把期间攒下的碎包全部合并续播(无需再等 prime)。
const FALLBACK_MIN_PRIME_SEC = 1.2   // P71: 首段先攒够 ~1.2s 再开播, 进一步减少段间空隙(原 0.4); 续段在 onEnded 时 drain 全部队列
const FALLBACK_PRIME_WAIT_MS = 400   // 但最多等 400ms, 控制首字延迟(原 200)

// 估算当前队列已缓存 PCM 的时长(16-bit mono)
function queuedPcmDurationSec(): number {
  let bytes = 0
  let sr = 24000
  for (const it of pcmBufferQueue) { bytes += it.data.byteLength; sr = it.sampleRate || sr }
  return sr > 0 ? bytes / 2 / sr : 0
}

// 合并队首连续、同采样率的碎包为一段较大 PCM(遇到采样率变化则切断, 保证顺序不丢包)
function drainMergedPcm(): { data: ArrayBuffer; sampleRate: number } | null {
  if (pcmBufferQueue.length === 0) return null
  const sampleRate = pcmBufferQueue[0].sampleRate || 24000
  let total = 0
  const parts: ArrayBuffer[] = []
  while (pcmBufferQueue.length > 0 && (pcmBufferQueue[0].sampleRate || 24000) === sampleRate) {
    const it = pcmBufferQueue.shift()!
    parts.push(it.data)
    total += it.data.byteLength
  }
  const merged = new Uint8Array(total)
  let off = 0
  for (const p of parts) { merged.set(new Uint8Array(p), off); off += p.byteLength }
  return { data: merged.buffer, sampleRate }
}

// 入队后调度回退播放: 正在播则由 onEnded 续播; 空闲则(攒够/超时后)开播
function scheduleFallbackPlayback() {
  if (isPlayingPcm) return
  if (fallbackPrimeTimer) return
  if (pcmBufferQueue.length === 0) return
  if (queuedPcmDurationSec() >= FALLBACK_MIN_PRIME_SEC) {
    startMergedPcmPlayback()
  } else {
    fallbackPrimeTimer = setTimeout(() => {
      fallbackPrimeTimer = null
      if (!isPlayingPcm) startMergedPcmPlayback()
    }, FALLBACK_PRIME_WAIT_MS)
  }
}

function startMergedPcmPlayback() {
  if (fallbackPrimeTimer) { clearTimeout(fallbackPrimeTimer); fallbackPrimeTimer = null }
  const seg = drainMergedPcm()
  if (!seg) { isPlayingPcm = false; return }
  isPlayingPcm = true

  // PCM 16bit mono → WAV 后播放(采样率从 mimeType 推断)
  const wavBuffer = pcmToWav(seg.data, seg.sampleRate, 1, 16)
  const fs = uni.getFileSystemManager()
  const filePath = `${wx.env.USER_DATA_PATH}/pcm_${Date.now()}.wav`

  fs.writeFile({
    filePath,
    data: wavBuffer,
    success: () => {
      const audio = uni.createInnerAudioContext({ useWebAudioImplement: true })
      pcmPlayer = audio
      audio.obeyMuteSwitch = false
      audio.src = filePath
      audio.autoplay = true
      const onDone = () => {
        try { audio.destroy() } catch {}
        try { fs.unlinkSync(filePath) } catch {}
        if (pcmPlayer === audio) pcmPlayer = null
        isPlayingPcm = false
        // 播放期间攒下的碎包: 无缝续播(不再等 prime); 队空则停下等新包
        if (pcmBufferQueue.length > 0) startMergedPcmPlayback()
      }
      audio.onEnded(onDone)
      audio.onError(onDone)
    },
    fail: () => {
      isPlayingPcm = false
      if (pcmBufferQueue.length > 0) startMergedPcmPlayback()
    }
  })
}

// 兼容旧调用名
function playNextPcm() { scheduleFallbackPlayback() }

// PCM → WAV 转换
function pcmToWav(pcmData: ArrayBuffer, sampleRate: number, numChannels: number, bitsPerSample: number): ArrayBuffer {
  const dataLength = pcmData.byteLength
  const headerLength = 44
  const totalLength = headerLength + dataLength
  const buffer = new ArrayBuffer(totalLength)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, totalLength - 8, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true)
  view.setUint16(32, numChannels * bitsPerSample / 8, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  new Uint8Array(buffer, headerLength).set(new Uint8Array(pcmData))
  return buffer
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

// ========== 通话生命周期 ==========
function startPhoneCall() {
  console.log('[P68] startPhoneCall called')
  if (isOnCall.value) {
    console.log('[P68] Already on call, ignoring')
    return
  }

  stopAllTTS()
  stopAllAudio()

  isOnCall.value = true
  isFullDuplex.value = true
  callStatus.value = 'connecting'
  callError.value = ''
  callPetText.value = ''
  pcmBufferQueue.length = 0
  isPlayingPcm = false

  // 重置 WebAudio 无缝播放状态: 若已存在先 close 重建, 保证每通电话干净排程
  if (webAudioCtx) {
    try { webAudioCtx.close() } catch {}
    webAudioCtx = null
  }
  nextStartTime = 0
  activeSources = []
  webAudioUnavailable = false   // 每通电话重新尝试 WebAudio 路径
  resetWebAudioPrimeState()     // P71: 清空上一通遗留的预缓冲状态
  pttIntentionalClose = false   // P71: 复位意图关闭标志

  // P68 fix: 使用正确的 token 键名
  const token = uni.getStorageSync('habitpet_token') || uni.getStorageSync('token')
  const childId = currentChild?.value?.id || ''
  // P71: 缓存 token/childId, 供切回全双工时重建 WS 复用
  callToken = token
  callChildId = childId
  
  console.log('[P68] Token exists:', !!token, 'ChildId:', childId, 'Token:', token?.substring(0, 20))

  if (!token) {
    callError.value = '未登录,请先登录'
    callStatus.value = 'error'
    return
  }

  connectWebSocket(token, childId)
}

function hangUp() {
  // P68-修复2 / P71: 主动关闭 WebSocket, 标记意图关闭防止 onClose 自动重连
  if (wsConnection) {
    pttIntentionalClose = true
    try { wsConnection.send({ data: JSON.stringify({ type: 'hangup' }) }) } catch {}
    try { wsConnection.close({ code: 1000, reason: 'User hang up' }) } catch {}
    wsConnection = null
  }
  
  // 关闭麦克风
  stopMicrophone()
  
  // 取消重连
  reconnectAttempts = MAX_RECONNECT + 1
  stopWsPing()
  
  // 停止音频
  stopAllTTS()
  stopAllAudio()
  pcmBufferQueue.length = 0
  isPlayingPcm = false

  // 关闭 WebAudio 上下文 (通话结束彻底释放)
  if (webAudioCtx) {
    try { webAudioCtx.close() } catch {}
    webAudioCtx = null
  }
  nextStartTime = 0
  activeSources = []
  resetWebAudioPrimeState()   // P71: 清空预缓冲状态
  callToken = ''
  callChildId = ''
  
  // 重置状态
  isOnCall.value = false
  isFullDuplex.value = true
  callStatus.value = 'idle'
  callError.value = ''
  callPetText.value = ''
  
  // 清理 PCM 临时文件
  try {
    const fs = uni.getFileSystemManager()
    fs.readdir({
      dirPath: wx.env.USER_DATA_PATH,
      success: (res: any) => {
        (res.files || []).forEach((f: any) => {
          const name = f.filePath || f
          if (name.includes('pcm_') || name.endsWith('.wav')) {
            try { fs.unlinkSync(name) } catch {}
          }
        })
      }
    })
  } catch {}
}

// ========== 全双工/按住说切换 ==========
function toggleRealtimeMode() {
  if (isFullDuplex.value) {
    // 自由通话(全双工) → 按住说话(PTT): 关闭 Gemini live 的 WS, PTT 期间完全走后端 DeepSeek(HTTP)
    isFullDuplex.value = false
    stopMicrophone()
    if (wsConnection) {
      pttIntentionalClose = true      // 阻止 onClose 自动重连
      try { wsConnection.close({ code: 1000, reason: 'switch to ptt' }) } catch {}
      wsConnection = null
    }
    stopWsPing()
    // PTT 语音走 sendVoiceToHttp(HTTP/DeepSeek), 不依赖 WS
    callStatus.value = 'connected'
    console.log('[P71] switched to PTT: WS closed, PTT uses DeepSeek HTTP')
  } else {
    // 按住说话(PTT) → 自由通话(全双工): 重新建立 WS(onOpen 会在全双工下自动开麦)
    isFullDuplex.value = true
    if (!wsConnection) {
      reconnectAttempts = 0
      pttIntentionalClose = false
      let token = callToken
      let childId = callChildId
      if (!token) {
        token = uni.getStorageSync('habitpet_token') || uni.getStorageSync('token')
        childId = currentChild?.value?.id || ''
        callToken = token
        callChildId = childId
      }
      if (!token) {
        callError.value = '未登录,无法恢复通话'
        callStatus.value = 'error'
        return
      }
      callStatus.value = 'connecting'
      console.log('[P71] switched to full-duplex: reconnect WS')
      connectWebSocket(token, childId)   // onOpen 中 isFullDuplex=true 会自动 startMicrophone()
    } else {
      // 异常兜底: WS 仍在, 直接开麦并通知后端
      startMicrophone()
      wsConnection.send({ data: JSON.stringify({ type: 'mode_switch', mode: 'full_duplex' }) })
    }
  }
}

// ========== 按住说话模式录音(使用 HTTP voice-chat API)==========
// P68-fix: 复用全局单例，回调在 getRecorder() 里统一注册；这里只负责切模式 + start
function startPttRecord() {
  // 若上一段是全双工麦克风录音，先停掉，避免单例仍在录音导致 start 失败
  if (recorderMode === 'mic') {
    stopMicrophone()
  }

  pttCancelled = false
  pttRecording.value = true
  recorderMode = 'ptt'
  pttRecorderStartTime = Date.now()

  const rec = getRecorder()
  pttRecorder = rec   // 兼容旧引用

  // 规避单例竞态：短延时保护，确保上一次 stop 已释放后再 start mp3
  setTimeout(() => {
    // 用户可能已在延时窗口内松手/取消
    if (recorderMode !== 'ptt' || !pttRecording.value) return
    try {
      rec.start({
        format: 'mp3',
        duration: 60000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000
      })
    } catch {
      pttRecording.value = false
      uni.showToast({ title: '录音启动失败', icon: 'none' })
    }
  }, 150)
}

async function sendVoiceToHttp(filePath: string, childId: string) {
  const API_BASE_URL = API_BASE
  const token = uni.getStorageSync('habitpet_token') || uni.getStorageSync('token')

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/ai/voice-chat-groq`,
      filePath: filePath,
      name: 'audio',
      formData: { childId: childId || '' },
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res: any) => {
        try {
          const data = JSON.parse(res.data)
          // data = { text: "AI回复", transcribedText: "用户说了什么", segments: [{text, audioUrl}] }

          callPetText.value = data.text || ''

          // 播放 TTS 音频(edge-tts 生成的 MP3)
          if (data.segments && data.segments.length > 0) {
            playPttSegments(data.segments)
          } else if (data.audioUrl) {
            playAudioUrl(data.audioUrl, () => {
              callStatus.value = 'listening'
            })
          } else {
            callStatus.value = 'listening'
          }

          resolve(data)
        } catch (e) {
          reject(new Error('解析语音回复失败'))
        }
      },
      fail: (err: any) => {
        reject(err)
      }
    })
  })
}

function stopPttRecord() {
  if (recorderMode !== 'ptt') return
  // 松手即结束按钮态；若仍在 150ms 延时窗口内(尚未真正 start)，stop 为空操作、onStop 不触发，避免孤立录音
  pttRecording.value = false
  if (recorderManager) {
    try { recorderManager.stop() } catch {}   // 触发 getRecorder().onStop 分发上传
  }
  // 保持单例：不置空 recorderManager
}

function cancelPttRecord() {
  if (recorderMode !== 'ptt') return
  pttCancelled = true               // onStop 分发里据此跳过上传
  pttRecording.value = false
  if (recorderManager) {
    try { recorderManager.stop() } catch {}
  }
  // 保持单例：不置空 recorderManager
}

// 播放单个音频 URL
function playAudioUrl(url: string, onEnd?: () => void) {
  const audio = uni.createInnerAudioContext()
  audio.src = url
  audio.autoplay = true
  audio.onEnded(() => {
    audio.destroy()
    onEnd?.()
  })
  audio.onError(() => {
    audio.destroy()
    onEnd?.()
  })
}

// 播放流式分段 TTS
function playPttSegments(segments: Array<{text: string, audioUrl: string}>) {
  let idx = 0
  const playNext = () => {
    if (idx >= segments.length) {
      callStatus.value = 'listening'
      return
    }
    const seg = segments[idx++]
    callPetText.value = seg.text
    const audio = uni.createInnerAudioContext()
    audio.src = seg.audioUrl
    audio.autoplay = true
    audio.onEnded(() => {
      audio.destroy()
      playNext()
    })
    audio.onError(() => {
      audio.destroy()
      playNext()
    })
  }
  playNext()
}

// ========== 辅助 ==========
function handleWsError(msg: string) {
  callError.value = msg
  callStatus.value = 'error'
  setTimeout(() => {
    if (callStatus.value === 'error') {
      isFullDuplex.value = false
      callStatus.value = 'connected'
      callError.value = ''
      uni.showToast({ title: '已切换到按住说话模式', icon: 'none' })
    }
  }, 3000)
}

function startWsPing() {
  stopWsPing()
  wsPingTimer = setInterval(() => {
    if (wsConnection) {
      wsConnection.send({ data: JSON.stringify({ type: 'ping' }) })
    }
  }, 15000)
}

function stopWsPing() {
  if (wsPingTimer) {
    clearInterval(wsPingTimer)
    wsPingTimer = null
  }
}

/* ================================================================
 * P48: 宠物互动 - 使用 localEmotionOverride
 * ================================================================ */
/* ================================================================
 * P64: 已移除所有序列帧/Sprite Sheet 动画 - 回归静态图 + 气泡交互
 * ================================================================ */

/** P64: 点击宠物触发抚摸 - 仅显示气泡 */
function handlePetTap() {
  if (viewMode.value !== 'home') return
  if (animationState.value === 'evolution') return

  // 每日抚摸限制
  const count = getDailyPetCount()
  if (count >= PET_DAILY_LIMIT) {
    uni.showToast({ title: '今天抚摸够了,明天再来吧', icon: 'none', duration: 2000 })
    return
  }

  const bubbles = ['好舒服呀~', '嗷呜!再摸摸!', '尾巴都要摇掉啦!', '嘿嘿,主人最好啦!', '再摸一下嘛~']
  petBubbleText.value = bubbles[Math.floor(Math.random() * bubbles.length)]
  petBubbleVisible.value = true
  petAltAction.value = 'bounce'
  currentPet.mood = Math.min(100, currentPet.mood + 3)

  api.post('/pet-circle/log/interaction', { childId: currentChild.value?.id, petId: currentPet?.id, interactionType: 'pet' }).catch(() => {})
  incrementDailyPetCount()

  setTimeout(() => {
    petBubbleText.value = ''
    petBubbleVisible.value = false
    petAltAction.value = ''
  }, 3000)
}

/** P64: 喂食 - 仅显示气泡 */
const feedPet = () => {
  // 喂食冷却检查
  const remaining = getFeedCooldownRemaining()
  if (remaining > 0) {
    const hours = Math.ceil(remaining / (60 * 60 * 1000))
    uni.showToast({ title: `今天吃饱了,${hours}个小时后,再来喂我吧`, icon: 'none', duration: 2000 })
    return
  }

  const bubbles = ['吃饱啦!好满足~', '嗷呜,谢谢主人!', '嗝~太好吃啦!', '主人最好了!']
  petBubbleText.value = bubbles[Math.floor(Math.random() * bubbles.length)]
  petBubbleVisible.value = true
  petAltAction.value = 'bounce'
  petEnergy.value = Math.min(100, petEnergy.value + 10)

  api.post('/pet-circle/log/interaction', { childId: currentChild.value?.id, petId: currentPet?.id, interactionType: 'feed' }).catch(() => {})
  setLastFeedTime()

  setTimeout(() => {
    petBubbleText.value = ''
    petBubbleVisible.value = false
    petAltAction.value = ''
  }, 3000)
}

// 🔧 临时测试函数 - P64: 回归纯气泡
const testBreathe = () => {
  animationState.value = 'idle'
  localEmotionOverride.value = null
  petBubbleText.value = ''
  petBubbleVisible.value = false
  currentPet.mood = 50
}
const testHappy = () => {
  petBubbleText.value = '好舒服呀~🤚✨'
  petBubbleVisible.value = true
  petAltAction.value = 'bounce'
  currentPet.mood = 85
  setTimeout(() => { petBubbleText.value = ''; petBubbleVisible.value = false; petAltAction.value = '' }, 3000)
}
const testEating = () => {
  petBubbleText.value = '吃饱啦!😋'
  petBubbleVisible.value = true
  petAltAction.value = 'bounce'
  petEnergy.value = 90
  setTimeout(() => {
    petBubbleText.value = ''
    petBubbleVisible.value = false
    petAltAction.value = ''
  }, 3000)
}
const testSad = () => {
  currentPet.mood = 30
  currentPet.emotionKey = 'sad'
  localEmotionOverride.value = 'sad'
  petBubbleText.value = '你能陪陪我吗...😢'
  petBubbleVisible.value = true
}
const evolving = ref(false)
const testEvolution = async () => {
  const child = currentChild.value
  if (!child) return
  const pet = petsByChild[child.id]
  if (!pet?.id) return
  if (evolving.value) return

  evolving.value = true
  animationState.value = 'evolution'
  petBubbleText.value = '进化中...🌈'
  petBubbleVisible.value = true

  try {
    const evolveRes = await api.post<any>('/pet/' + pet.id + '/evolve')
    if (evolveRes.data) {
      await loadPetAndHistory(child.id)
      animationState.value = 'idle'
      localEmotionOverride.value = null
      petBubbleText.value = '进化完成!🌟'
      petBubbleVisible.value = true
      setTimeout(() => { petBubbleText.value = ''; petBubbleVisible.value = false }, 2000)
    }
  } catch (e: any) {
    animationState.value = 'idle'
    petBubbleText.value = e?.message || '进化失败'
    petBubbleVisible.value = true
    setTimeout(() => { petBubbleText.value = ''; petBubbleVisible.value = false }, 2000)
  } finally {
    evolving.value = false
  }
}

/* ================================================================
 * TTS & 音频播放队列
 * ================================================================ */
const playingAudio = ref<any>(null)
const audioQueue = ref<string[]>([])
let queuePlaying = false
let queueAudio: any = null
let queueIndex = 0

function playNextInQueue() {
  if (queueIndex >= audioQueue.value.length) {
    queuePlaying = false
    audioQueue.value = []
    queueIndex = 0
    return
  }
  queuePlaying = true
  const url = audioQueue.value[queueIndex]!
  queueIndex++
  if (!queueAudio) {
    queueAudio = uni.createInnerAudioContext({ useWebAudioImplement: true })
    queueAudio.obeyMuteSwitch = false
  }
  queueAudio.offEnded()
  queueAudio.offError()
  queueAudio.onEnded(() => { playNextInQueue() })
  queueAudio.onError(() => { console.warn('[TTS] segment failed, skip'); playNextInQueue() })
  playingAudio.value = queueAudio
  queueAudio.src = url
  queueAudio.play()
}

function playStreamSegments(segments: Array<{ text: string; audioUrl: string }>) {
  if (!segments || segments.length === 0) return
  if (queueAudio) { try { queueAudio.stop() } catch {} }
  if (playingAudio.value === queueAudio) { /* already stopped */ }
  else if (playingAudio.value) { try { playingAudio.value.stop() } catch {} }
  audioQueue.value = segments.map(s => s.audioUrl)
  queueIndex = 0
  queuePlaying = false
  playNextInQueue()
}

const playTTS = (text: string, segments?: Array<{ text: string; audioUrl: string }>) => {
  if (segments && segments.length > 0) { playStreamSegments(segments); return }
  if (!text || text.trim().length === 0) return
  const childId = store.currentChildId
  if (childId) ttsLoadingMap[childId] = true
  api.post<{ audioUrl: string }>('/ai/tts', { text }).then((ttsRes) => {
    const url = ttsRes.data?.audioUrl || (ttsRes as any).audioUrl || ''
    if (!url) { if (childId) ttsLoadingMap[childId] = false; return }
    if (!playingAudio.value) {
      playingAudio.value = uni.createInnerAudioContext({ useWebAudioImplement: true })
      playingAudio.value.obeyMuteSwitch = false
    }
    const audio = playingAudio.value
    try { audio.stop() } catch {}
    audio.src = url
    audio.onPlay(() => { if (childId) ttsLoadingMap[childId] = false })
    audio.onError((err: any) => { if (childId) ttsLoadingMap[childId] = false; console.error('[TTS] err:', err) })
    audio.play()
  }).catch((e: any) => { if (childId) ttsLoadingMap[childId] = false; console.error('[TTS] fail:', e) })
}

/* ================================================================
 * 聊天
 * ================================================================ */
const scrollToBottom = async (childId: string) => {
  await nextTick()
  scrollToMap[childId] = 'chat-bottom-' + childId
}

const sendText = async (childId: string) => {
  const text = (inputMap[childId] || '').trim()
  if (!text || thinkingMap[childId] || !childId) return
  inputMap[childId] = ''
  if (!chatCache[childId]) chatCache[childId] = []
  chatCache[childId] = [...chatCache[childId], { role: 'user', content: text, type: 'text', time: new Date().toISOString() }]
  await scrollToBottom(childId)
  if (!playingAudio.value) {
    playingAudio.value = uni.createInnerAudioContext({ useWebAudioImplement: true })
    playingAudio.value.obeyMuteSwitch = false
  }
  thinkingMap[childId] = true
  try {
    const res = await api.post<{ reply: string; sessionId: string }>('/ai/chat', { message: text, childId })
    const reply = res.data?.reply || '嗷呜~我听到了!'
    chatCache[childId] = [...chatCache[childId], { role: 'pet', content: reply, time: new Date().toISOString() }]
    if (ttsEnabled.value && reply.length > 0) {
      playTTS(reply, (res.data as any)?.audioSegments)
    }
  } catch (e: any) {
    chatCache[childId] = [...chatCache[childId], { role: 'pet', content: '嗷呜...AI助手暂时休息中,请稍后再试试?😅', time: new Date().toISOString() }]
  } finally {
    thinkingMap[childId] = false
    await scrollToBottom(childId)
  }
}

const onRecordTouchMove = (e: any, childId: string) => {
  if (!recordingMap[childId]) return
  willCancelRecord.value = (recordStartY.value - e.touches[0].clientY) > 50
}

const toggleInput = (childId: string) => { showTextInput[childId] = !showTextInput[childId] }

const startRecord = (childId: string, e?: any) => {
  if (thinkingMap[childId]) { uni.showToast({ title: '等我先说完哦~', icon: 'none' }); return }
  stopAllTTS()
  willCancelRecord.value = false
  if (e?.touches?.[0]) recordStartY.value = e.touches[0].clientY
  let recorder = recorderMap[childId]
  if (!recorder) {
    recorder = uni.getRecorderManager()
    recorderMap[childId] = recorder
    recorder.onStop((res: any) => {
      recordingMap[childId] = false
      if (willCancelRecord.value) { willCancelRecord.value = false; return }
      if (res.tempFilePath && res.duration >= 1000) sendVoice(childId, res.tempFilePath)
      else if (res.duration < 1000) uni.showToast({ title: '说话时间太短了哦~', icon: 'none', duration: 1500 })
    })
    recorder.onError((err: any) => {
      recordingMap[childId] = false
      if (willCancelRecord.value) { willCancelRecord.value = false; return }
      uni.showToast({ title: '录音失败,请重试', icon: 'none' })
    })
  }
  recorder.start({ format: 'mp3', duration: 60000 })
  recordingMap[childId] = true
}

const stopRecord = (childId: string) => { if (recordingMap[childId]) recorderMap[childId]?.stop() }
const cancelRecord = (childId: string) => { recordingMap[childId] = false; recorderMap[childId]?.stop() }

const sendVoice = async (childId: string, filePath: string) => {
  if (!childId) return
  if (!chatCache[childId]) chatCache[childId] = []
  chatCache[childId] = [...chatCache[childId], { role: 'user', content: '🎤 识别中...', type: 'voice', time: new Date().toISOString() }]
  await scrollToBottom(childId)
  thinkingMap[childId] = true
  try {
    const res = await api.upload<{ text: string; transcribedText: string; segments: Array<{text:string;audioUrl:string}>; latencyMs: number }>('/ai/voice-chat-groq', filePath, { childId })
    const result = res.data
    const petReply = result?.text || '嗷呜...没听清楚,可以再说一遍吗?'
    const userText = result?.transcribedText || ''
    if (ttsEnabled.value && petReply.length > 0) playTTS(petReply, result?.segments)
    const msgs = chatCache[childId]
    if (userText && msgs.length > 0 && msgs[msgs.length - 1].role === 'user') {
      msgs[msgs.length - 1] = { role: 'user', content: userText, type: 'voice', time: new Date().toISOString() }
      chatCache[childId] = [...msgs]
    }
    chatCache[childId] = [...chatCache[childId], { role: 'pet', content: petReply, time: new Date().toISOString() }]
  } catch (e: any) {
    console.error('[Voice] upload error:', e)
    const errMsg = e?.errMsg || e?.message || ''
    chatCache[childId] = [...chatCache[childId], { role: 'pet', content: errMsg.includes('timeout') ? '网络超时,请重试' : '语音识别出了点问题,请再试一次吧~', time: new Date().toISOString() }]
  } finally {
    thinkingMap[childId] = false
    await scrollToBottom(childId)
  }
}

const goAddChild = () => uni.navigateTo({ url: '/pages/parent/children/add' })
const goSelectPet = () => uni.showToast({ title: '宠物选择功能开发中', icon: 'none' })
</script>

<!-- 样式保持完全不变 -->
<style scoped>
.page-pet { display:flex; flex-direction:column; height:100vh; background:transparent; }
.pet-top-bar { background:transparent; flex-shrink:0; z-index:50; position:absolute; top:0; left:0; right:0; }
.pet-top-row { display:flex; align-items:center; justify-content:space-between; height:44px; padding:0 16px; }
.pet-back { font-size:15px; color:#fff; width:60px; text-shadow:0 1px 2px rgba(0,0,0,.5); }
.pet-title { font-size:17px; font-weight:bold; color:#fff; text-shadow:0 1px 2px rgba(0,0,0,.5); }
.pet-swiper { flex:1; width:100%; height:100vh; }
.pet-view { flex:1; width:100%; height:100vh; }
.top-bar { display:flex; align-items:center; gap:16rpx; padding:16rpx 28rpx; background:rgba(255,255,255,0.5); backdrop-filter:blur(12px); }
.top-bar-avatar { width:62rpx; height:62rpx; border-radius:50%; }
.top-bar-avatar-default { width:62rpx; height:62rpx; border-radius:50%; background:rgba(212,197,240,0.4); display:flex; align-items:center; justify-content:center; font-size:32rpx; }
.top-bar-name { font-size:28rpx; font-weight:bold; color:#5B3E96; flex:1; }
.tts-toggle { width:52rpx; height:52rpx; border-radius:50%; background:#D4C5F0; display:flex; align-items:center; justify-content:center; font-size:28rpx; }
.loading-state { display:flex; align-items:center; justify-content:center; height:100%; color:#333; font-size:28rpx; }
.chat-list { flex:1; padding:20rpx 24rpx 0; box-sizing:border-box; overflow-y:auto; }
.chat-msg-row { display:flex; align-items:flex-start; margin-bottom:24rpx; gap:12rpx; flex-wrap:wrap; }
.call-msg-tag { width:100%; display:flex; align-items:center; justify-content:center; gap:4rpx; margin-bottom:8rpx; }
.call-msg-icon { font-size:22rpx; }
.call-msg-label { font-size:20rpx; color:#999; }
.chat-msg-row--user { justify-content:flex-end; }
.chat-avatar { width:72rpx; height:72rpx; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:40rpx; flex-shrink:0; overflow:hidden; }
.chat-avatar--pet { background:transparent; }
.chat-avatar--user { background:#D4C5F0; }
.chat-avatar-img { width:100%; height:100%; }
.chat-bubble { max-width:65%; padding:20rpx 24rpx; border-radius:24rpx; font-size:28rpx; line-height:40rpx; word-break:break-all; }
.chat-bubble--pet { background:#ffffff; color:#333; border-top-left-radius:6rpx; box-shadow:0 2rpx 8rpx rgba(0,0,0,0.06); }
.chat-bubble-wrapper { display:flex; flex-direction:column; gap:4rpx; }
.chat-bubble-wrapper--user { display:flex; flex-direction:column; align-items:flex-end; gap:4rpx; }
.chat-time { font-size:20rpx; color:#b0b0b0; margin-top:6rpx; }
.chat-time--pet { text-align:left; padding-left:6rpx; }
.chat-time--user { text-align:right; padding-right:6rpx; }
.chat-speaker-btn { align-self:flex-start; padding:4rpx 12rpx; margin-left:12rpx; }
.chat-speaker-icon { font-size:24rpx; opacity:0.5; }
.chat-bubble--user { background:#95EC69; color:#000000; border-top-right-radius:6rpx; }
.chat-bubble--thinking { padding:16rpx 32rpx; display:flex; gap:8rpx; }
.thinking-dot { font-size:16rpx; color:#333; animation:thinking-bounce 1.4s infinite; }
.thinking-dot:nth-child(2) { animation-delay:0.2s; }
.thinking-dot:nth-child(3) { animation-delay:0.4s; }
@keyframes thinking-bounce { 0%,60%,100% { transform:translateY(0); opacity:0.4; } 30% { transform:translateY(-10rpx); opacity:1; } }
.tts-loading-bubble { display:flex; align-items:center; gap:8rpx; padding:14rpx 20rpx; background:rgba(255,255,255,0.7); border-radius:18rpx; border-top-left-radius:4rpx; }
.tts-spin-icon { font-size:24rpx; animation:tts-spin 1.2s linear infinite; display:inline-block; }
.tts-loading-text { font-size:22rpx; color:#888; }
@keyframes tts-spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
.chat-voice-tag { background:rgba(124,58,237,0.35); border-radius:50%; width:44rpx; height:44rpx; display:flex; align-items:center; justify-content:center; flex-shrink:0; align-self:center; }
.chat-voice-icon { font-size:20rpx; }
.chat-input-bar { display:flex; align-items:center; padding:16rpx 20rpx; padding-bottom:calc(16rpx + env(safe-area-inset-bottom)); background:rgba(255,255,255,0.25); backdrop-filter:blur(16px); border-top:1rpx solid rgba(212,197,240,0.3); flex-shrink:0; }
.voice-hold-area { display:flex; align-items:center; gap:12rpx; flex:1; }
.voice-hold-btn { flex:1; height:80rpx; display:flex; align-items:center; justify-content:center; background:#F5F5F5; border-radius:40rpx; font-size:28rpx; color:#333; transition:all 0.2s; }
.voice-hold-btn--recording { background:#FF4444; color:#fff; transform:scale(0.98); }
.input-toggle-btn { width:72rpx; height:72rpx; border-radius:50%; background:#F5F5F5; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:32rpx; }
.chat-input-wrap { flex:1; background:#F5F5F5; border-radius:40rpx; padding:0 24rpx; height:80rpx; display:flex; align-items:center; }
.chat-input { flex:1; font-size:28rpx; color:#333; }
.recording-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:999; }
.recording-box { background:#ffffff; border-radius:24rpx; padding:60rpx 80rpx; display:flex; flex-direction:column; align-items:center; gap:24rpx; }
.recording-wave { display:flex; align-items:flex-end; gap:8rpx; height:80rpx; }
.recording-bar { width:8rpx; height:20rpx; background:#5B3E96; border-radius:4rpx; animation:wave 0.6s infinite alternate; }
@keyframes wave { from { height:20rpx; } to { height:80rpx; } }
.recording-text { font-size:28rpx; color:#333; font-weight:bold; }
.recording-cancel { font-size:24rpx; color:#333; }

/* 宠物主页 */
.pet-home { display:flex; flex-direction:column; height:100vh; width:100vw; }
.pet-stats-bar { display:flex; align-items:center; gap:24rpx; padding:20rpx 48rpx; margin:16rpx 0; }
.pet-stat-item { flex:1; display:flex; align-items:center; gap:12rpx; background:rgba(255,255,255,0.85); border-radius:20rpx; padding:16rpx 20rpx; backdrop-filter:blur(10rpx); }
.pet-stat-icon { font-size:36rpx; }
.pet-stat-info { flex:1; display:flex; flex-direction:column; gap:6rpx; }
.pet-stat-label { font-size:22rpx; color:#333; }
.pet-stat-track { width:100%; height:10rpx; background:#F0F0F0; border-radius:5rpx; overflow:hidden; }
.pet-stat-fill { height:100%; background:linear-gradient(90deg,#5B3E96,#D4C5F0); border-radius:5rpx; transition:width 0.5s; }
.pet-stat-fill--energy { background:linear-gradient(90deg,#4CAF50,#8BC34A); }
.pet-stat-value { font-size:20rpx; color:#333; }
.pet-stat-divider { width:2rpx; height:48rpx; background:rgba(0,0,0,0.08); }
.pet-display { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24rpx; padding:40rpx; }

/* P63: 宠物主体区域 - 下移 300rpx,宠物"站"在背景平台上 */
.pet-layer-area {
  position: absolute;
  top: calc(55% - 205rpx);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 650rpx;
  width: 100%;
  z-index: 5;
}

/* 统一所有阶段宠物图片尺寸为 560rpx */
.pet-layer-area :deep(.pet-anim-img),
.pet-layer-area :deep(.pet-anim-sprite) {
  width: 560rpx !important;
  height: 560rpx !important;
  transform: scale(1.0);
  filter: drop-shadow(0 12rpx 24rpx rgba(0,0,0,0.3)) drop-shadow(0 0 20rpx rgba(255,255,255,0.15));
}

/* P55: 状态卡 - 右上角,稍大 */
/* P63: 宠物名称上移 200rpx */
/* P64: 状态卡整体下移 200rpx (74rpx -> 274rpx),水平位置不变 */
/* P70: 状态卡再上移 100rpx (274rpx -> 174rpx),水平位置不变 */
.pet-status-top-right {
  position: absolute;
  top: 174rpx;
  right: 24rpx;
  z-index: 10;
  max-width: 340rpx;
}

/* P50: 底部按钮 - 大尺寸圆形按钮 */
.pet-bottom-bar {
  position: absolute;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 60rpx;
  z-index: 10;
}

.pet-side-btn {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12rpx);
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.25), inset 0 2rpx 0 rgba(255,255,255,0.4);
  transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
}
.pet-side-btn:active { transform: scale(0.9); }
.pet-side-btn--chat {
  background: radial-gradient(circle at 30% 30%, rgba(130,100,210,0.7), rgba(91,62,150,0.85));
}
.pet-side-btn--call {
  background: radial-gradient(circle at 30% 30%, rgba(130,120,255,0.7), rgba(99,102,241,0.85));
}
.pet-side-btn--feed {
  background: radial-gradient(circle at 30% 30%, rgba(255,160,180,0.7), rgba(255,110,140,0.85));
}
.pet-side-icon { font-size: 68rpx; line-height: 1; }
.pet-sprite-emoji { font-size:200rpx; line-height:1; }
.call-pet-img { width:500rpx; height:500rpx; }
.pet-name { font-size:36rpx; font-weight:bold; color:#FFD700; margin-top:8rpx; text-shadow: 0 0 10px rgba(255,229,92,0.6), 0 2px 4px rgba(0,0,0,0.5); }
.pet-stage-name { font-size:26rpx; color:#fff; background:rgba(255,142,158,0.5); padding:6rpx 24rpx; border-radius:24rpx; }
.pet-status-bar { display:flex; justify-content:space-between; align-items:center; gap:16rpx; padding:20rpx 28rpx; }
.pet-display-name { font-size:28rpx; font-weight:bold; color:#333; flex:1; }
.mood-badge, .level-badge { display:flex; align-items:center; gap:6rpx; background:#FF8E9E; border-radius:20rpx; padding:8rpx 20rpx; font-size:24rpx; }
.mood-emoji { font-size:28rpx; color:#fff; }
.mood-value { color:#fff; font-weight:bold; }
.level-label { color:#fff; font-weight:bold; }
.action-bar { display:flex; justify-content:center; gap:40rpx; padding:40rpx 0 60rpx; }
.action-btn { display:flex; flex-direction:column; align-items:center; gap:8rpx; width:160rpx; height:160rpx; border-radius:50%; background:#fff; box-shadow:0 4rpx 20rpx rgba(0,0,0,0.08); justify-content:center; transition:transform 0.15s; }
.action-btn:active { transform:scale(0.95); }
.action-btn--primary { background:linear-gradient(135deg,#FF8E9E,#FFB3C1); color:#fff; box-shadow:0 8rpx 24rpx rgba(255,142,158,0.3); transform:scale(1.1); }
.action-btn-icon { font-size:44rpx; color:#FF8E9E; }
.action-btn-text { font-size:24rpx; color:#333; }
.action-btn--primary .action-btn-text { color:#fff; }
.pet-chat { display:flex; flex-direction:column; height:100vh; width:100vw; background:linear-gradient(180deg,#EDE4F5,#D5C8F0); }
.back-btn { width:56rpx; height:56rpx; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.back-arrow { font-size:36rpx; color:#5B3E96; font-weight:bold; }

/* P68: 通话底部控制栏 - 垂直排列,PTT在上,挂断/切换在下 */
.call-bottom-bar {
  position: absolute;
  bottom: 60rpx;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
  padding: 20rpx 40rpx;
  z-index: 10;
}

/* 模式切换 + 挂断:水平排列 */
.call-bottom-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 30rpx;
}

/* 切换对话模式 - 毛玻璃效果 */
.call-mode-switch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.25);
}
.call-mode-switch .call-mode-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}
.call-mode-switch .call-mode-hint {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.6);
}

/* 挂断按钮 - 毛玻璃效果 */
.call-hangup-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  width: 140rpx;
  height: 70rpx;
  background: rgba(255, 59, 48, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 35rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}
.call-hangup-btn .call-hangup-icon {
  font-size: 30rpx;
  transform: rotate(135deg);
}
.call-hangup-btn .call-hangup-text {
  color: #fff;
  font-size: 24rpx;
  font-weight: 500;
}

/* PTT 大按钮 - 正常流式布局,毛玻璃效果 */
.call-ptt-big-btn {
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}
.call-ptt-big-btn .call-ptt-big-icon { font-size: 56rpx; }
.call-ptt-big-btn .call-ptt-big-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 26rpx;
  font-weight: 500;
}
.call-ptt-big-btn--active {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 30rpx rgba(255, 255, 255, 0.15);
  animation: ptPulse 1s ease-in-out infinite;
}
.call-ptt-big-btn--active .call-ptt-big-label { color: #fff; }

@keyframes ptPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    opacity: 0.9;
  }
  50% {
    box-shadow: 0 0 30rpx 8rpx rgba(255, 255, 255, 0.15);
    opacity: 1;
  }
}

/* 通话状态指示器(宠物上方) */
.call-status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10rpx;
}
.call-status-indicator .call-status-dot {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
  background: rgba(0,0,0,0.3);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}
.call-status-indicator .call-status-dot--connecting { color: #FFD700; }
.call-status-indicator .call-status-dot--speaking { color: #87CEEB; }
.call-status-indicator .call-status-dot--listening { color: #90EE90; }

/* 问候气泡(保留,与通话无关) */
.greeting-bubble {
  position: absolute;
  top: -80rpx;
  left: 50%;
  transform: translateX(-50%);
  max-width: 75%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  padding: 20rpx 28rpx;
  z-index: 30;
  pointer-events: none;
  white-space: normal;
  word-break: break-all;
}
.greeting-bubble text {
  font-size: 30rpx;
  color: #fff;
  line-height: 44rpx;
  font-weight: 500;
}

/* P50: 3D 游戏按钮 - 玻璃质感 + 弹性反馈 */
.game-btn {
  border-radius: 24rpx;
  background: linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06));
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.18), inset 0 1rpx 0 rgba(255,255,255,0.3);
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.game-btn:active {
  transform: scale(0.93);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.25), inset 0 1rpx 0 rgba(255,255,255,0.15);
}

/* 主页大按钮 */
.home-main-actions { display:flex; justify-content:center; gap:48rpx; padding:20rpx 0 60rpx; }
.home-main-btn { width:200rpx; height:200rpx; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12rpx; transition:transform 0.15s cubic-bezier(0.34,1.56,0.64,1); background:linear-gradient(135deg,rgba(255,255,255,0.25),rgba(255,255,255,0.06)); box-shadow:0 8rpx 30rpx rgba(0,0,0,0.2),inset 0 1rpx 0 rgba(255,255,255,0.35); }
.home-main-btn:active { transform:scale(0.9); box-shadow:0 4rpx 16rpx rgba(0,0,0,0.3),inset 0 1rpx 0 rgba(255,255,255,0.18); }
.home-main-btn--call { background:linear-gradient(135deg,rgba(99,102,241,0.5),rgba(129,140,248,0.3)); box-shadow:0 8rpx 30rpx rgba(99,102,241,0.35),inset 0 1rpx 0 rgba(255,255,255,0.3); }
.home-main-btn--chat { background:linear-gradient(135deg,rgba(91,62,150,0.5),rgba(212,197,240,0.35)); box-shadow:0 8rpx 30rpx rgba(91,62,150,0.25),inset 0 1rpx 0 rgba(255,255,255,0.3); }
.home-main-icon { font-size:64rpx; }
.home-main-text { font-size:28rpx; color:#fff; font-weight:bold; }

/* 迷你操作按钮 */
.home-mini-actions { position:absolute; top:32rpx; right:28rpx; display:flex; gap:16rpx; z-index:10; }
.mini-action-btn { width:72rpx; height:72rpx; border-radius:50%; background:linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.08)); box-shadow:0 4rpx 16rpx rgba(0,0,0,0.15),inset 0 1rpx 0 rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; transition:transform 0.15s cubic-bezier(0.34,1.56,0.64,1); }
.mini-action-btn:active { transform:scale(0.85); box-shadow:0 2rpx 8rpx rgba(0,0,0,0.25),inset 0 1rpx 0 rgba(255,255,255,0.12); }
.mini-action-icon { font-size:36rpx; }

/* Debug 按钮 */
.debug-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:12rpx; padding:16rpx 24rpx; }
.debug-btn { padding:12rpx 28rpx; border-radius:40rpx; font-size:24rpx; background:linear-gradient(135deg,rgba(255,255,255,0.2),rgba(255,255,255,0.05)); box-shadow:0 4rpx 12rpx rgba(0,0,0,0.12),inset 0 1rpx 0 rgba(255,255,255,0.2); color:rgba(255,255,255,0.85); transition:transform 0.12s cubic-bezier(0.34,1.56,0.64,1); }
.debug-btn:active { transform:scale(0.9); background:rgba(255,255,255,0.35); }
/* P51: 默认折叠调试按钮 */
.debug-actions--collapsed {
  opacity: 0.25;
  transform: scale(0.65);
  transform-origin: center bottom;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  pointer-events: auto;
}
.pet-bubble { background:rgba(255,255,255,0.9); border-radius:20rpx; padding:14rpx 28rpx; font-size:26rpx; color:#333; animation:bubble-pop 0.4s ease-out; box-shadow:0 4rpx 16rpx rgba(0,0,0,0.08); }
@keyframes bubble-pop { 0% { transform:scale(0.3); opacity:0; } 100% { transform:scale(1); opacity:1; } }

/* P50: 心情背景由 PetScene 组件接管 */

/* 问候语 + 心情文字 */
/* P50: 问候气泡 - 绝对定位悬浮在宠物上方,不挤压宠物 */

.greeting-bubble--first {
  animation: greetingFadeIn 0.8s ease-out both;
  border: 2rpx solid rgba(255,142,158,0.5);
}
@keyframes greetingFadeIn { 0% { opacity:0; transform:translateY(20rpx) scale(0.95); } 100% { opacity:1; transform:translateY(0) scale(1); } }
.pet-mood-text { font-size:26rpx; color:rgba(255,255,255,0.75); margin-top:4rpx; }

/* ================================================================
 * P57: 进化特效 - 激光柱 + 脉冲光环 + 火花粒子
 * ================================================================ */
.pet-layer-area--evolving {
  /* 进化动画区域整体增强 */
}

/* 粒子层容器 - 覆盖宠物区域 */
.evo-particle-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
  overflow: visible;
}

/* 火花粒子 - 从中心向外飞散 */
.evo-particle {
  position: absolute;
  bottom: 40%;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: radial-gradient(circle, #fff9c4, #ffb300, #ff6d00);
  box-shadow: 0 0 12rpx rgba(255, 180, 0, 0.8), 0 0 30rpx rgba(255, 200, 50, 0.5);
  animation: evo-particle-fly 2.5s ease-out infinite;
}

@keyframes evo-particle-fly {
  0% {
    opacity: 1;
    transform: translateY(0) translateX(0) scale(0.6);
  }
  30% {
    opacity: 1;
    transform: translateY(-80rpx) translateX(15rpx) scale(1.3);
  }
  70% {
    opacity: 0.6;
    transform: translateY(-200rpx) translateX(-20rpx) scale(0.8);
  }
  100% {
    opacity: 0;
    transform: translateY(-350rpx) translateX(10rpx) scale(0.2);
  }
}

/* 进化光柱 - 从宠物中心直冲上方 */
.evo-light-beam {
  position: absolute;
  top: -120rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 500rpx;
  background: linear-gradient(
    to top,
    rgba(255, 215, 0, 0.9),
    rgba(255, 255, 200, 0.6) 30%,
    rgba(255, 215, 0, 0.2) 60%,
    transparent 100%
  );
  border-radius: 40rpx;
  filter: blur(10rpx);
  animation: evo-beam-pulse 0.6s ease-in-out infinite alternate;
  z-index: -1;
}

@keyframes evo-beam-pulse {
  0% {
    opacity: 0.5;
    transform: translateX(-50%) scaleX(0.8);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) scaleX(1.3);
  }
}

/* 脉冲光环 - 从宠物中心向外扩散 */
.evo-pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255, 215, 0, 0.6);
  transform: translate(-50%, -50%);
  animation: evo-ring-expand 1.2s ease-out infinite;
  box-shadow: 0 0 30rpx rgba(255, 200, 0, 0.4), inset 0 0 30rpx rgba(255, 200, 0, 0.2);
}

.evo-pulse-ring--delay {
  animation-delay: 0.6s;
}

@keyframes evo-ring-expand {
  0% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(0.6);
    border-width: 8rpx;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2.5);
    border-width: 2rpx;
  }
}

/* P50: 进化中文字提示 - 轻量级悬浮,绝对定位在宠物上方,透明背景 */
.evo-evolving-text {
  position: absolute;
  top: -120rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  z-index: 10;
  padding: 16rpx 40rpx;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 16rpx;
  white-space: nowrap;
  animation: evo-text-pulse 1.5s ease-in-out infinite;
  pointer-events: none;
}
.evo-evolving-label {
  font-size: 32rpx;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 16rpx rgba(255,200,0,0.7), 0 0 32rpx rgba(255,150,0,0.4);
}
.evo-evolving-hint {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
}
@keyframes evo-text-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* 进化中的宠物图片/Sprite额外增强 - 覆盖默认 drop-shadow */
.pet-layer-area--evolving :deep(.pet-anim-img),
.pet-layer-area--evolving :deep(.pet-anim-sprite) {
  filter: drop-shadow(0 0 30rpx rgba(255, 215, 0, 0.9)) drop-shadow(0 0 60rpx rgba(255, 255, 255, 0.6)) drop-shadow(0 8rpx 24rpx rgba(0,0,0,0.3)) !important;
}
</style>
