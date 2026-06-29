<template>
  <view class="page-pet">
    <!-- P55: 全屏模式 — 标题浮在信号栏下方，背景覆盖全屏 -->
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

    <!-- 当前孩子宠物（无滑动切换） -->
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
          subtitle="请先选择一只宠物，开始和TA互动吧！"
          button-text="去选择宠物"
          @action="goSelectPet"
        />

        <!-- 宠物主页 / 聊天 / 电话 -->
        <template v-else-if="petsByChild[currentChild.id]">
          <!-- ========== 电话模式 ========== -->
          <view v-if="isOnCall" class="call-screen">
            <view v-if="callGreetingFallback" class="call-greeting-fallback">
              <text class="call-greeting-big">喂？听到吗？</text>
            </view>
            <view class="call-pet-area">
              <view class="call-pet-sprite">
                <image
                  v-if="callSpriteUrl"
                  :src="callSpriteUrl"
                  class="call-pet-img"
                  mode="aspectFit"
                  @error="onCallSpriteError"
                />
                <text v-else class="pet-sprite-emoji">{{ speciesEmoji(currentChild) }}</text>
              </view>
              <text class="call-pet-name">{{ currentPet.stageName || speciesLabel(currentChild) }}</text>
              <text class="call-status-text">{{ callStatusText }}</text>
              <view v-if="callState === 'listening'" class="call-waveform">
                <view class="call-wave-bar" v-for="i in 5" :key="i" :style="{ animationDelay: (i * 0.12) + 's' }" />
              </view>
            </view>
            <view class="call-talk-area">
              <view
                class="call-talk-btn"
                :class="{
                  'call-talk-btn--active': callRecording,
                  'call-talk-btn--disabled': callState === 'thinking' || callState === 'speaking'
                }"
                @touchstart.prevent="callState === 'listening' && startCallRecord()"
                @touchend.prevent="stopCallRecord"
                @touchcancel.prevent="cancelCallRecord"
              >
                <text class="call-talk-icon">{{ callTalkIcon }}</text>
                <text class="call-talk-label">{{ callTalkLabel }}</text>
              </view>
            </view>
            <view class="call-hangup-area">
              <view class="call-hangup-btn" @click="hangUp">
                <text class="call-hangup-icon">📞</text>
                <text class="call-hangup-text">挂断</text>
              </view>
            </view>
          </view>

          <!-- ========== 宠物主页 (P51 游戏级重构 + P54 交互重构) ========== -->
          <PetScene
            v-else-if="viewMode === 'home'"
            :mood="currentPet.mood"
            :species-id="currentPet.speciesId"
            @touchstart="onHomeTouchStart"
            @touchend="onHomeTouchEnd"
          >
            <!-- P51: 宠物主体区域 — 绝对定位，偏上留出地面空间 -->
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
                <!-- P50: 进化中文字提示（黑色半透明遮罩背景 + 粒子特效） -->
                <view class="evo-evolving-text">
                  <text class="evo-evolving-label">宠物进化中...</text>
                  <text class="evo-evolving-hint">正在蜕变，请稍候</text>
                </view>
              </view>
              <!-- 问候气泡 -->
              <view v-if="greetingText" :class="['greeting-bubble', { 'greeting-bubble--first': isFirstMeeting }]">
                <text>{{ greetingText }}</text>
              </view>

              <!-- P51: PetBubble 组件 — 从宠物头顶弹出 -->
              <PetBubble
                :text="petBubbleText"
                :visible="petBubbleVisible"
                @close="petBubbleVisible = false"
              />

              <!-- 宠物本体 -->
              <PetAnimator
                :species-id="currentPet.speciesId"
                :stage-key="currentPet.stageKey"
                :emotion-key="displayEmotionKey"
                :animation-state="animationState"
                :sprite-url="currentSpriteUrl"
                :sprite-sheet="currentSpriteSheet"
                :frame-count="currentFrameCount"
                :frames="currentAnimFrames"
                :fps="animFps"
                :loop="animLoop"
                :auto-play="animAutoPlay"
                :static-fallback="staticFallbackUrl"
              >
                <text class="pet-sprite-emoji">{{ speciesEmoji(currentChild) }}</text>
              </PetAnimator>
            </view>

            <!-- P55: 状态卡 → 右上角，稍大玻璃卡片 -->
            <view class="pet-status-top-right">
              <PetStatusCard
                :level="currentPet.level"
                :stage-name="currentPet.stageName || '幼体期'"
                :mood-emoji="moodEmoji"
                :mood-label="moodLabel"
                :exp-percent="expPercent"
              />
            </view>

            <!-- P57: 底部按钮栏 — 💬/📞/🍖 水平对齐 -->
            <view class="pet-bottom-bar">
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

            <!-- 🔧 P51: 临时调试按钮（折叠） -->
            <view class="debug-actions debug-actions--collapsed">
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
            <view class="top-bar">
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
                  </view>
                </template>
                <template v-else>
                  <view class="chat-bubble chat-bubble--user">
                    <text>{{ msg.content }}</text>
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
                  <text class="tts-loading-text">语音合成中…</text>
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
                <text class="recording-text">{{ willCancelRecord ? '松开取消' : '正在聆听…松开发送' }}</text>
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
import { onShow } from '@dcloudio/uni-app'
import { useChildStore } from '@/stores/child'
import { api } from '@/services/api'
import { copy } from '@/copy/onboarding'
import EmptyState from '@/components/empty-state/index.vue'
import PetAnimator from '@/components/pet-animator/index.vue'
import PetScene from '@/components/PetScene.vue'
import PetStatusCard from '@/components/PetStatusCard.vue'
import PetBubble from '@/components/pet-bubble/index.vue'

const statusBarH = ref(20)
try { statusBarH.value = uni.getSystemInfoSync().statusBarHeight || 20 } catch {}
const goBack = () => uni.navigateBack()

/* ================================================================
 * G：统一 currentPet 对象 — P48 标准化数据结构
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
 * P48：本地情绪覆盖 — 抚摸/喂食触发，4秒后自动恢复
 * ================================================================ */
const localEmotionOverride = ref<string | null>(null)
let emotionTimer: ReturnType<typeof setTimeout> | null = null

function setEmotionOverride(emotion: string, durationMs: number = 4000) {
  localEmotionOverride.value = emotion
  if (emotionTimer) clearTimeout(emotionTimer)
  emotionTimer = setTimeout(() => { localEmotionOverride.value = null }, durationMs)
}

/** 当前展示用的 emotionKey：优先本地覆盖，否则后端值 */
const displayEmotionKey = computed(() => {
  if (animationState.value === 'evolution') return 'evolution'
  return localEmotionOverride.value || currentPet.emotionKey || 'idle'
})

/* ================================================================
 * 常量映射
 * ================================================================ */
const SPRITE_BASE = 'https://stage-api.lanyunke.com/uploads/sprites'
const SPRITE_V = 'v=20260621221500' // P50: 破微信图片缓存（更新于 2026-06-21 22:15）

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
 * P54: 统一精灵图 URL 拼接 — 格式: speciesId/stageKey_emotionKey.png
 */
function getSpriteUrl(speciesId: string | undefined, stageKey: string, emotionKey: string): string {
  if (!speciesId) return ''
  const sk = stageKey || 'egg'
  const ek = emotionKey || 'idle'
  return `${SPRITE_BASE}/${speciesId}/${sk}_${ek}.png?${SPRITE_V}`
}

/* ================================================================
 * 状态
 * ================================================================ */
interface ChatMessage {
  role: 'user' | 'pet' | 'user_call' | 'pet_call'
  content: string
  type?: 'text' | 'voice'
}
interface PetInfo {
  id: string; name: string; stage: string; level: number; mood: number
  speciesId?: string; stageKey?: string; emotionKey?: string; stageName?: string
  [key: string]: any
}

const store = useChildStore()
const currentChild = computed(() => store.childList[store.currentIndex] || null)

// 精灵图 URL 计算（P48 标准化 + P57 进化中显示进化精灵图）
const currentSpriteUrl = computed(() => {
  const pet = currentPet
  if (!pet.speciesId) return ''
  // P57: 进化动画中 → 显示 evolution 图（egg_evolution 或 baby_evolution）
  const emo = animationState.value === 'evolution' ? 'evolution' : displayEmotionKey.value
  return getSpriteUrl(pet.speciesId, pet.stageKey, emo)
})

// 聊天/电话头像精灵图（简化版，不含情绪覆盖）
const chatSpriteUrl = computed(() => {
  const pet = currentPet
  if (!pet.speciesId) return ''
  return getSpriteUrl(pet.speciesId, pet.stageKey, 'idle')
})
const callSpriteUrl = ref('')
const callSpriteError = ref(false)

function onChatSpriteError() {
  // chat 头像加载失败 → 自动回退 emoji（由 v-else 处理）
}
function onCallSpriteError() {
  callSpriteError.value = true
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
/** P57: 标记刚完成进化，用于显示专属问候 */
let greetingTimer: ReturnType<typeof setTimeout> | null = null
const justEvolved = ref(false)

// P48: 动画状态（驱动 PetAnimator CSS）
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
  if (m >= 80) return '今天很开心！😄'
  if (m >= 60) return '心情不错～'
  if (m >= 40) return '有点想你…'
  return '你能陪陪我吗…🥺'
})

/** P51: 成长能量百分比（0-100） */
const expPercent = computed(() => {
  // 如果 currentPet 有 expPercent 直接用，否则根据 level 估算
  const pet = currentPet as any
  if (typeof pet.expPercent === 'number') return Math.round(pet.expPercent * 100)
  // 估算：每级需要 100 经验，当前经验 % 100 即为进度
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
 * onShow — 初始化 & 进化检测
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
        // P48: 检查是否刚完成进化（用 createdAt 新字段名）
        const evolveFlag = uni.getStorageSync('pet_just_evolved')
        if (evolveFlag) {
          try {
            const flag = JSON.parse(evolveFlag)
            const ts = flag.createdAt || flag.time || 0
            // P50: 校验 childId 匹配，防止第二个宝贝误触发进化动画
            if (flag.petId && flag.childId === child.id && (Date.now() - ts < 120000)) {
              // P50: 立即清除标记，防止重复触发
              uni.removeStorageSync('pet_just_evolved')

              // P50: 预填充临时 pet 对象，防止模板回退到"加载中…"
              petsByChild[child.id] = {
                id: flag.petId || '',
                speciesId: flag.speciesId || '',
                stageKey: flag.fromStageKey || 'egg',
              } as any

              // P50: 进化动画 — 用原始形态显示进化特效
              currentPet.speciesId = flag.speciesId || ''
              currentPet.stageKey = flag.fromStageKey || 'egg'
              currentPet.stage = flag.fromStage ?? 0
              currentPet.stageName = flag.fromStageName || '蛋仔期'
              currentPet.mood = 80
              localEmotionOverride.value = null
              animationState.value = 'evolution'
              petBubbleText.value = '完成任务，我进化了！'
              petBubbleVisible.value = true
              // P50: 10 秒后结束进化，重新拉取数据（显示新形态）
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

watch(() => store.currentChildId, (newChildId: string | null) => {
  if (newChildId) {
    loadPetAndHistory(newChildId)
  }
})

/* ================================================================
 * G：loadPetAndHistory — 填充 unified currentPet
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

      // 同步电话精灵图
      callSpriteUrl.value = getSpriteUrl(currentPet.speciesId, currentPet.stageKey, 'idle')
      callSpriteError.value = false
    } else {
      Object.assign(currentPet, createDefaultPet())
      callSpriteUrl.value = ''
    }

    await loadGreeting(childId)

    // P51: 进入主页后启动待机随机动画
    if (viewMode.value === 'home' && animationState.value === 'idle') {
      nextTick(() => startIdleAnimations())
    }

    // 加载对话历史
    if (pet) {
      try {
        const historyRes = await api.get<{ messages: { role: string; content: string; time: string }[] }>('/ai/history', { childId, limit: 30 })
        const msgs = (historyRes.data as any)?.messages || []
        const existingMsgs = chatCache[childId] || []
        if (msgs.length > 0) {
          const dbMsgs = msgs.map((m: any) => ({
            role: (m.role === 'assistant' ? 'pet' : m.role) as ChatMessage['role'],
            content: m.content,
            type: 'text' as const,
          }))
          const seen = new Set(existingMsgs.map(m => `${m.role}:${m.content}`))
          const newOnly = dbMsgs.filter(m => !seen.has(`${m.role}:${m.content}`))
          chatCache[childId] = [...newOnly, ...existingMsgs]
        } else if (existingMsgs.length === 0) {
          chatCache[childId] = [
            { role: 'pet', content: '嗷呜！你终于来啦，想和我聊点什么？😊' },
          ]
        }
        setTimeout(() => scrollToBottom(childId), 300)
      } catch {
        if (!chatCache[childId] || chatCache[childId].length === 0) {
          chatCache[childId] = [
            { role: 'pet', content: '嗷呜！你终于来啦，想和我聊点什么？😊' },
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
  // P57: 无后端问候时，按 stage 和进化状态补本地文案
  if (!greetingText.value) {
    if (justEvolved.value) {
      greetingText.value = Math.random() > 0.5 ? '主人！我出来啦！' : '我已经升级啦！'
      justEvolved.value = false
    } else if (currentPet.stageKey === 'egg') {
      greetingText.value = Math.random() > 0.5 ? '咚咚……我在蛋里等你哦' : '完成任务后，我就能破壳啦'
    } else {
      greetingText.value = '嗷呜！你终于来啦！'
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
  viewMode.value = 'home'
  // P51: 返回主页后启动待机动画
  nextTick(() => {
    if (animationState.value === 'idle') startIdleAnimations()
  })
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
 * P20: 电话模式
 * ================================================================ */
const isOnCall = ref(false)
const callState = ref<'listening' | 'thinking' | 'speaking'>('listening')
const callChildId = ref('')
const callBubbleText = ref('')
const callGreetingFallback = ref(false)

const callStatusText = computed(() => {
  if (callBubbleText.value) return callBubbleText.value
  if (callState.value === 'listening') return '🎤 正在听…'
  if (callState.value === 'thinking') return '💭 正在思考…'
  return '🔊 宠物正在说…'
})
/** P60: 静态兜底图 URL — 始终用 baby_idle，加载最快 */
const staticFallbackUrl = computed(() => {
  const species = currentPet.speciesId
  if (!species) return ''
  return `${SPRITE_BASE}/${species}/baby_idle.png?${SPRITE_V}`
})

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

const startPhoneCall = () => {
  const child = store.childList[store.currentIndex]
  if (!child) return
  callChildId.value = child.id
  isOnCall.value = true
  callState.value = 'speaking'
  callGreetingFallback.value = false
  callSpriteError.value = false

  if (!playingAudio.value) {
    playingAudio.value = uni.createInnerAudioContext({ useWebAudioImplement: true })
    playingAudio.value.obeyMuteSwitch = false
  }

  const greetings = [
    `喂？${child.nickname || '主人'}，你终于来啦！`,
    `你来啦${child.nickname || '主人'}！我一直在等你呢！`,
    `喂？${child.nickname || '主人'}，是你吗？好想你呀！`,
  ]
  const greeting = greetings[Math.floor(Math.random() * greetings.length)]
  callBubbleText.value = greeting

  api.post<{ audioUrl: string }>('/ai/tts', { text: greeting }).then(r => {
    const url = r.data?.audioUrl || ''
    if (url && playingAudio.value) {
      stopAllTTS()
      playingAudio.value = uni.createInnerAudioContext({ useWebAudioImplement: true })
      playingAudio.value.obeyMuteSwitch = false
      playingAudio.value.src = url
      playingAudio.value.onEnded(() => {
        callState.value = 'listening'
        callGreetingFallback.value = false
      })
      playingAudio.value.onError(() => {
        callGreetingFallback.value = true
        setTimeout(() => { callGreetingFallback.value = false; callState.value = 'listening' }, 2000)
      })
      playingAudio.value.play()
    } else {
      callGreetingFallback.value = true
      setTimeout(() => { callGreetingFallback.value = false; callState.value = 'listening' }, 2000)
    }
  }).catch(() => {
    callGreetingFallback.value = true
    setTimeout(() => { callGreetingFallback.value = false; callState.value = 'listening' }, 2000)
  })
}

const callTalkLabel = computed(() => {
  if (callRecording.value) return '松开发送'
  if (callState.value === 'thinking' || callState.value === 'speaking') return '等宠物说完…'
  return '按住说话'
})
const callTalkIcon = computed(() => {
  if (callRecording.value) return '🎤'
  if (callState.value === 'thinking' || callState.value === 'speaking') return '🔇'
  return '🎙️'
})

const callRecording = ref(false)
const callRecorder = ref<any>(null)

function startCallRecord() {
  if (!isOnCall.value || callState.value !== 'listening') return
  stopAllTTS()
  callRecording.value = true
  const recorder = uni.getRecorderManager()
  callRecorder.value = recorder
  recorder.onStop((res: any) => {
    callRecording.value = false
    if (res.tempFilePath && res.duration >= 800 && isOnCall.value) {
      processCallVoice(callChildId.value, res.tempFilePath)
    } else if (res.duration < 800 && isOnCall.value) {
      uni.showToast({ title: '说话时间太短了哦~', icon: 'none', duration: 1500 })
    }
  })
  recorder.onError(() => {
    callRecording.value = false
    if (!isOnCall.value) return
    uni.showToast({ title: '录音失败，请重试', icon: 'none' })
  })
  recorder.start({ format: 'mp3', duration: 60000 })
}

function stopCallRecord() {
  if (!callRecording.value) return
  try { callRecorder.value?.stop() } catch {}
}

function cancelCallRecord() {
  callRecording.value = false
  try { callRecorder.value?.stop() } catch {}
}

async function processCallVoice(childId: string, filePath: string) {
  if (!isOnCall.value || callChildId.value !== childId) return
  callState.value = 'thinking'
  callBubbleText.value = '💭 正在思考…'
  try {
    const res = await api.upload<{ text: string; transcribedText: string; segments: Array<{text:string;audioUrl:string}>; latencyMs: number }>('/ai/voice-chat-groq', filePath, { childId })
    const result = res.data
    const reply = result?.text || '嗯…信号不太好，你再说一遍？'
    const userText = result?.transcribedText || ''
    const segments = result?.segments || []
    callState.value = 'speaking'
    if (segments.length > 0) {
      playStreamSegments(segments)
    } else {
      playStreamTTSForReply(reply)
    }
    if (!chatCache[childId]) chatCache[childId] = []
    chatCache[childId] = [...chatCache[childId], { role: 'user_call', content: userText || '🎤 语音' }]
    chatCache[childId] = [...chatCache[childId], { role: 'pet_call', content: reply }]
    callBubbleText.value = reply
    const checkDone = setInterval(() => {
      if (!queuePlaying && audioQueue.value.length === 0) {
        clearInterval(checkDone)
        callState.value = 'listening'
      }
    }, 200)
  } catch {
    const fallbackText = '主人，信号不太好，我们待会儿再聊吧'
    callBubbleText.value = fallbackText
    callState.value = 'speaking'
    if (!chatCache[childId]) chatCache[childId] = []
    chatCache[childId] = [...chatCache[childId], { role: 'pet_call', content: fallbackText }]
    api.post<{ audioUrl: string }>('/ai/tts', { text: fallbackText }).then(r => {
      const url = r.data?.audioUrl || ''
      if (url) {
        stopAllTTS()
        const a = uni.createInnerAudioContext({ useWebAudioImplement: true })
        a.obeyMuteSwitch = false; a.src = url
        a.onEnded(() => { callState.value = 'listening' })
        a.onError(() => { callState.value = 'listening' })
        a.play()
      } else { callState.value = 'listening' }
    }).catch(() => { callState.value = 'listening' })
  }
}

function playStreamTTSForReply(text: string) {
  if (!text) { callState.value = 'listening'; return }
  stopAllTTS()
  api.post<{ segments: Array<{ text: string; audioUrl: string }> }>('/ai/tts-stream', { text }).then(ttsRes => {
    const segs = ttsRes.data?.segments || []
    if (segs.length === 0) {
      api.post<{ audioUrl: string }>('/ai/tts', { text }).then(r => {
        const url = r.data?.audioUrl || ''
        if (url) {
          stopAllTTS()
          const a = uni.createInnerAudioContext({ useWebAudioImplement: true })
          a.obeyMuteSwitch = false; a.src = url
          a.onEnded(() => { callState.value = 'listening' })
          a.onError(() => { callState.value = 'listening' })
          a.play()
        } else { callState.value = 'listening' }
      }).catch(() => { callState.value = 'listening' })
      return
    }
    audioQueue.value = segs.map(s => s.audioUrl)
    queuePlaying = false
    playNextInQueue()
    const checkDone = setInterval(() => {
      if (!queuePlaying && audioQueue.value.length === 0) {
        clearInterval(checkDone)
        callState.value = 'listening'
      }
    }, 200)
  }).catch(() => { callState.value = 'listening' })
}

const hangUp = () => {
  isOnCall.value = false
  callGreetingFallback.value = false
  stopAllTTS()
  callRecording.value = false
  try { callRecorder.value?.stop() } catch {}
  if (recorderMap[callChildId.value]) {
    try { recorderMap[callChildId.value].stop() } catch {}
  }
  recordingMap[callChildId.value] = false
  if (callChildId.value) {
    api.post('/ai/chat', { message: '通话已结束。', childId: callChildId.value }).catch(() => {})
  }
}

/* ================================================================
 * P48: 宠物互动 — 使用 localEmotionOverride
 * ================================================================ */
/** P54: 摸头气泡文案池 */
const petTapBubbles = [
  '嘿嘿，主人摸摸我啦！',
  '我最喜欢主人了！',
  '再摸一下嘛～',
  '好舒服呀！',
]

/* ================================================================
 * P51: 动作帧系统 — 序列帧播放 + 待机随机动画
 * ================================================================ */
const ACT_BASE = 'https://stage-api.lanyunke.com/uploads/sprites'

/** 构建动作帧 URL 数组 */
function buildActionFrames(species: string, stage: string, action: string): string[] {
  const config = ACTION_FRAME_COUNTS[action]
  if (!config) return []
  const { count, isStatic } = config

  if (isStatic) {
    return [`${ACT_BASE}/${species}/act/${species}_${stage}_${action}.png?${SPRITE_V}`]
  }

  const frames: string[] = []
  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(2, '0')
    frames.push(`${ACT_BASE}/${species}/act/${species}_${stage}_${action}_${num}.png?${SPRITE_V}`)
  }
  return frames
}

/* ================================================================
 * P58: 动作精灵图配置 — Sprite Sheet 优先，帧序列降级
 * ================================================================ */
const ACTION_SPRITES: Record<string, { sheet: string; frames: number; fps: number; framesLegacy?: string[] }> = {
  idle: {
    sheet: '',
    frames: 10,
    fps: 8
  },
  petting: {
    sheet: '',
    frames: 6,
    fps: 6
  },
  eating: {
    sheet: '',
    frames: 10,
    fps: 7
  },
  tailwag: {
    sheet: '',
    frames: 4,
    fps: 4
  },
  headshake: {
    sheet: '',
    frames: 4,
    fps: 4
  },
  blink: {
    sheet: '',
    frames: 1,
    fps: 1
  },
  happy: {
    sheet: '',
    frames: 1,
    fps: 1
  },
  evolution: {
    sheet: '',
    frames: 1,
    fps: 1
  },
}

/** 动作帧数量配置（旧，降级用） */
const ACTION_FRAME_COUNTS: Record<string, { count: number; isStatic?: boolean }> = {
  idle: { count: 10 },
  tailwag: { count: 4 },
  headshake: { count: 4 },
  blink: { count: 1, isStatic: true },  // blink 用 CSS 模拟
  petting: { count: 6 },
  happy: { count: 1, isStatic: true },
  eating: { count: 10 },
  evolution: { count: 1, isStatic: true },
}

const currentAnimFrames = ref<string[]>([])
const currentSpriteSheet = ref('')
const currentFrameCount = ref(8)
const animFps = ref(4)
const animLoop = ref(true)
const animAutoPlay = ref(true)

/** P58: 设置当前播放动作 — Sprite Sheet 优先，帧序列降级 */
function setAnimAction(action: string) {
  const species = currentPet.speciesId
  const stage = currentPet.stageKey || 'baby'
  if (!species) {
    currentAnimFrames.value = []
    currentSpriteSheet.value = ''
    return
  }

  // P60: blink 不再依赖 CSS，改用静态帧（清理 spriteSheet 短暂显示静态图模拟眨眼）
  if (action === 'blink') {
    const frames = buildActionFrames(species, stage, 'blink')
    currentSpriteSheet.value = ''
    currentAnimFrames.value = frames
    animFps.value = 1
    animLoop.value = false
    animAutoPlay.value = false
    return
  }

  const config = ACTION_SPRITES[action]
  if (!config) {
    currentAnimFrames.value = []
    currentSpriteSheet.value = ''
    return
  }

  // P58: Sprite Sheet 优先
  if (config.sheet) {
    currentSpriteSheet.value = config.sheet
    currentFrameCount.value = config.frames
    animFps.value = config.fps
    animLoop.value = true
    animAutoPlay.value = true
    currentAnimFrames.value = []
    return
  }

  // 降级：尝试帧模式
  currentSpriteSheet.value = ''
  if (config.framesLegacy && config.framesLegacy.length > 0) {
    currentAnimFrames.value = config.framesLegacy
    animFps.value = config.fps
    animLoop.value = true
    animAutoPlay.value = true
    return
  }

  // 降级：构建帧 URL 数组
  const frames = buildActionFrames(species, stage, action)
  if (frames.length === 0) {
    currentAnimFrames.value = []
    return
  }

  currentAnimFrames.value = frames
  animFps.value = config.fps
  animLoop.value = true
  animAutoPlay.value = true
}

// ===== P51: 待机随机动画系统 =====
let idleTimer: ReturnType<typeof setInterval> | null = null
let idleBlinkTimer: ReturnType<typeof setTimeout> | null = null
let idleTailwagTimer: ReturnType<typeof setTimeout> | null = null

/** P60: 播放单次眨眼 — 使用 Sprite Sheet 动作替代 CSS 动画 */
function triggerBlink() {
  if (animationState.value !== 'idle' || viewMode.value !== 'home') return
  // P60: 不使用 CSS 眨眼动画，改用简要的 Sprite Sheet 动作
  setAnimAction('blink')
  animationState.value = 'blink'
  setTimeout(() => {
    setAnimAction('idle')
    animationState.value = 'idle'
  }, 200)
  scheduleNextBlink()
}

function scheduleNextBlink() {
  if (idleBlinkTimer) clearTimeout(idleBlinkTimer)
  const delay = 3000 + Math.random() * 2000  // 3-5秒
  idleBlinkTimer = setTimeout(() => {
    triggerBlink()
  }, delay)
}

/** 播放甩尾巴 */
function triggerTailwag() {
  if (animationState.value !== 'idle' || viewMode.value !== 'home') return
  animationState.value = 'tailwag'
  setAnimAction('tailwag')
  setTimeout(() => {
    animationState.value = 'idle'
    scheduleNextTailwag()
  }, 1200)
}

function scheduleNextTailwag() {
  if (idleTailwagTimer) clearTimeout(idleTailwagTimer)
  const delay = 5000 + Math.random() * 3000  // 5-8秒
  idleTailwagTimer = setTimeout(() => {
    triggerTailwag()
  }, delay)
}

/** 启动待机序列帧 + 随机动画（眨眼+摇尾巴） */
function startIdleAnimations() {
  stopIdleAnimations()
  setAnimAction('idle')
  scheduleNextBlink()
  scheduleNextTailwag()
}

/** 停止待机随机动画 */
function stopIdleAnimations() {
  if (idleBlinkTimer) { clearTimeout(idleBlinkTimer); idleBlinkTimer = null }
  if (idleTailwagTimer) { clearTimeout(idleTailwagTimer); idleTailwagTimer = null }
  if (idleTimer) { clearInterval(idleTimer); idleTimer = null }
}

/** 恢复 idle 状态时重新开始待机序列帧 */
watch(animationState, (newVal, oldVal) => {
  if (newVal === 'idle' && oldVal !== 'idle') {
    setAnimAction('idle')
    startIdleAnimations()
  }
  if (newVal !== 'idle') {
    stopIdleAnimations()
  }
})

/** P54: 点击宠物触发抚摸 — 播放 petting 序列帧 */
function handlePetTap() {
  if (viewMode.value !== 'home') return
  if (animationState.value === 'evolution') return

  stopIdleAnimations()
  // P60: 不设置 animationState 驱动 CSS 动画，仅切换 Sprite Sheet 动作
  setAnimAction('petting')
  setEmotionOverride('happy', 4000)

  const bubble = petTapBubbles[Math.floor(Math.random() * petTapBubbles.length)]
  petBubbleText.value = bubble
  petBubbleVisible.value = true
  currentPet.mood = Math.min(100, currentPet.mood + 3)

  api.post('/pet-circle/log/interaction', { childId: currentChild.value?.id, petId: currentPet?.id, interactionType: 'pet' }).catch(() => {})

  setTimeout(() => {
    petBubbleText.value = ''
    petBubbleVisible.value = false
    startIdleAnimations()
  }, 4000)
}

const petPet = () => {
  // P60: 不设置 animationState 驱动 CSS 动画
  setEmotionOverride('happy', 4000)
  petBubbleText.value = '好舒服呀～🤚✨'
  petBubbleVisible.value = true
  currentPet.mood = Math.min(100, currentPet.mood + 5)

  api.post('/pet-circle/log/interaction', { childId: currentChild.value?.id, petId: currentPet?.id, interactionType: 'pet' }).catch(() => {})

  setTimeout(() => {
    petBubbleText.value = ''
    petBubbleVisible.value = false
  }, 4000)
}

const feedPet = () => {
  stopIdleAnimations()
  // P60: 不设置 animationState 驱动 CSS 动画，仅切换 Sprite Sheet 动作
  setAnimAction('eating')
  setEmotionOverride('eating', 4000)
  petBubbleText.value = '吃饱啦！😋'
  petBubbleVisible.value = true
  petEnergy.value = Math.min(100, petEnergy.value + 10)

  api.post('/pet-circle/log/interaction', { childId: currentChild.value?.id, petId: currentPet?.id, interactionType: 'feed' }).catch(() => {})

  setTimeout(() => {
    petBubbleText.value = ''
    petBubbleVisible.value = false
    startIdleAnimations()
  }, 4000)
}

// 🔧 临时测试函数
const testBreathe = () => {
  animationState.value = 'idle'
  localEmotionOverride.value = null
  petBubbleText.value = ''
  petBubbleVisible.value = false
  currentPet.mood = 50
}
const testHappy = () => {
  // P60: 不设置 animationState 驱动 CSS 动画
  setEmotionOverride('happy', 4000)
  petBubbleText.value = '好舒服呀～🤚✨'
  petBubbleVisible.value = true
  currentPet.mood = 85
  setTimeout(() => { petBubbleText.value = ''; petBubbleVisible.value = false }, 4000)
}
const testEating = () => {
  stopIdleAnimations()
  // P60: 不设置 animationState 驱动 CSS 动画，仅切换 Sprite Sheet 动作
  setAnimAction('eating')
  setEmotionOverride('eating', 4000)
  petBubbleText.value = '吃饱啦！😋'
  petBubbleVisible.value = true
  petEnergy.value = 90
  setTimeout(() => {
    petBubbleText.value = ''
    petBubbleVisible.value = false
    startIdleAnimations()
  }, 4000)
}
const testSad = () => {
  currentPet.mood = 30
  currentPet.emotionKey = 'sad'
  localEmotionOverride.value = 'sad'
  petBubbleText.value = '你能陪陪我吗…😢'
  petBubbleVisible.value = true
}
const testEvolution = async () => {
  const child = currentChild.value
  if (!child) return
  const pet = petsByChild[child.id]
  if (!pet?.id) return

  animationState.value = 'evolution'
  petBubbleText.value = '进化中…🌈'
  petBubbleVisible.value = true

  try {
    const evolveRes = await api.post<any>('/pet/' + pet.id + '/evolve')
    if (evolveRes.data) {
      await loadPetAndHistory(child.id)
      animationState.value = 'idle'
      localEmotionOverride.value = null
      petBubbleText.value = '进化完成！🌟'
      petBubbleVisible.value = true
      setTimeout(() => { petBubbleText.value = ''; petBubbleVisible.value = false }, 2000)
    }
  } catch (e: any) {
    animationState.value = 'idle'
    petBubbleText.value = e?.message || '进化失败'
    petBubbleVisible.value = true
    setTimeout(() => { petBubbleText.value = ''; petBubbleVisible.value = false }, 2000)
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
  chatCache[childId] = [...chatCache[childId], { role: 'user', content: text, type: 'text' }]
  await scrollToBottom(childId)
  if (!playingAudio.value) {
    playingAudio.value = uni.createInnerAudioContext({ useWebAudioImplement: true })
    playingAudio.value.obeyMuteSwitch = false
  }
  thinkingMap[childId] = true
  try {
    const res = await api.post<{ reply: string; sessionId: string }>('/ai/chat', { message: text, childId })
    const reply = res.data?.reply || '嗷呜～我听到了！'
    chatCache[childId] = [...chatCache[childId], { role: 'pet', content: reply }]
    if (ttsEnabled.value && reply.length > 0) {
      playTTS(reply, (res.data as any)?.audioSegments)
    }
  } catch (e: any) {
    chatCache[childId] = [...chatCache[childId], { role: 'pet', content: '嗷呜…AI助手暂时休息中，请稍后再试试？😅' }]
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
      uni.showToast({ title: '录音失败，请重试', icon: 'none' })
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
  chatCache[childId] = [...chatCache[childId], { role: 'user', content: '🎤 识别中…', type: 'voice' }]
  await scrollToBottom(childId)
  thinkingMap[childId] = true
  try {
    const res = await api.upload<{ text: string; transcribedText: string; segments: Array<{text:string;audioUrl:string}>; latencyMs: number }>('/ai/voice-chat-groq', filePath, { childId })
    const result = res.data
    const petReply = result?.text || '嗷呜…没听清楚，可以再说一遍吗？'
    const userText = result?.transcribedText || ''
    if (ttsEnabled.value && petReply.length > 0) playTTS(petReply, result?.segments)
    const msgs = chatCache[childId]
    if (userText && msgs.length > 0 && msgs[msgs.length - 1].role === 'user') {
      msgs[msgs.length - 1] = { role: 'user', content: userText, type: 'voice' }
      chatCache[childId] = [...msgs]
    }
    chatCache[childId] = [...chatCache[childId], { role: 'pet', content: petReply }]
  } catch (e: any) {
    console.error('[Voice] upload error:', e)
    const errMsg = e?.errMsg || e?.message || ''
    chatCache[childId] = [...chatCache[childId], { role: 'pet', content: errMsg.includes('timeout') ? '网络超时，请重试' : '语音识别出了点问题，请再试一次吧~' }]
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

/* P50: 宠物主体区域 — 中心点上移 100rpx */
.pet-layer-area {
  position: absolute;
  top: calc(55% - 425rpx);
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

/* P57: 宠物缩放 — 蛋仔 600rpx / 幼体 840rpx（放大2倍） */
.pet-layer-area :deep(.pet-anim-img),
.pet-layer-area :deep(.pet-anim-sprite) {
  transform: scale(1.0);
  filter: drop-shadow(0 12rpx 24rpx rgba(0,0,0,0.3)) drop-shadow(0 0 20rpx rgba(255,255,255,0.15));
}
/* P57: 蛋仔期尺寸 */
.pet-layer-area--egg :deep(.pet-anim-img),
.pet-layer-area--egg :deep(.pet-anim-sprite) {
  width: 600rpx !important;
  height: 600rpx !important;
  transform: scale(1.0);
}
.pet-layer-area--baby :deep(.pet-anim-img),
.pet-layer-area--baby :deep(.pet-anim-sprite) {
  width: 840rpx !important;
  height: 840rpx !important;
}

/* P55: 状态卡 — 右上角，稍大 */
.pet-status-top-right {
  position: absolute;
  top: 274rpx;
  right: 24rpx;
  z-index: 10;
  max-width: 340rpx;
}

/* P50: 底部按钮 — 大尺寸圆形按钮 */
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

/* 电话模式 */
.call-screen { display:flex; flex-direction:column; height:100%; background:linear-gradient(180deg,#1a1a2e,#16213e,#0f3460); align-items:center; justify-content:center; }
.call-pet-area { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:32rpx; }
.call-pet-sprite { font-size:260rpx; line-height:1; }
.call-pet-name { font-size:48rpx; font-weight:bold; color:#fff; }
.call-status-text { font-size:28rpx; color:rgba(255,255,255,0.7); }
.call-waveform { display:flex; align-items:flex-end; gap:8rpx; height:40rpx; margin-top:8rpx; }
.call-wave-bar { width:8rpx; background:rgba(255,255,255,0.6); border-radius:4rpx; animation:call-wave 0.6s ease-in-out infinite; }
.call-wave-bar:nth-child(1) { height:16rpx; }
.call-wave-bar:nth-child(2) { height:28rpx; }
.call-wave-bar:nth-child(3) { height:40rpx; }
.call-wave-bar:nth-child(4) { height:28rpx; }
.call-wave-bar:nth-child(5) { height:16rpx; }
@keyframes call-wave { 0%,100% { transform:scaleY(1); } 50% { transform:scaleY(0.3); } }
.call-hangup-area { padding:40rpx 0 80rpx; display:flex; justify-content:center; }
.call-talk-area { display:flex; justify-content:center; padding:20rpx 0; }
.call-talk-btn { width:280rpx; height:280rpx; border-radius:50%; background:linear-gradient(135deg,#6366F1,#818CF8); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12rpx; box-shadow:0 8rpx 30rpx rgba(99,102,241,0.4); transition:transform 0.1s; }
.call-talk-btn:active { transform:scale(0.93); }
.call-talk-btn--active { background:linear-gradient(135deg,#FF4444,#FF6B6B); box-shadow:0 8rpx 30rpx rgba(255,68,68,0.4); animation:call-pulse 1.2s ease-in-out infinite; }
.call-talk-btn--disabled { background:#ccc; box-shadow:none; pointer-events:none; }
@keyframes call-pulse { 0%,100% { box-shadow:0 8rpx 30rpx rgba(255,68,68,0.4); } 50% { box-shadow:0 8rpx 50rpx rgba(255,68,68,0.7); } }
.call-talk-icon { font-size:64rpx; }
.call-talk-label { font-size:28rpx; color:#fff; font-weight:bold; }
.call-hangup-btn { width:140rpx; height:140rpx; border-radius:50%; background:#FF4444; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:0 8rpx 30rpx rgba(255,68,68,0.4); }
.call-hangup-btn:active { transform:scale(0.92); }
.call-hangup-icon { font-size:52rpx; }
.call-hangup-text { font-size:22rpx; color:#fff; margin-top:4rpx; }
.call-greeting-fallback { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:20; }
.call-greeting-big { font-size:56rpx; color:#fff; font-weight:bold; text-align:center; text-shadow:0 4rpx 20rpx rgba(0,0,0,0.5); }

/* P50: 3D 游戏按钮 — 玻璃质感 + 弹性反馈 */
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
/* P50: 问候气泡 — 绝对定位悬浮在宠物上方，不挤压宠物 */
.greeting-bubble {
  position: absolute;
  top: -80rpx;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background: rgba(255,255,255,0.95);
  border-radius: 20rpx;
  padding: 20rpx 28rpx;
  font-size: 28rpx;
  color: #333;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  z-index: 20;
  pointer-events: none;
}
.greeting-bubble::after {
  content: '';
  position: absolute;
  bottom: -16rpx;
  left: 50%;
  transform: translateX(-50%);
  border: 10rpx solid transparent;
  border-top-color: rgba(255,255,255,0.95);
}
.greeting-bubble--first {
  animation: greetingFadeIn 0.8s ease-out both;
  border: 2rpx solid rgba(255,142,158,0.5);
}
@keyframes greetingFadeIn { 0% { opacity:0; transform:translateY(20rpx) scale(0.95); } 100% { opacity:1; transform:translateY(0) scale(1); } }
.pet-mood-text { font-size:26rpx; color:rgba(255,255,255,0.75); margin-top:4rpx; }

/* ================================================================
 * P57: 进化特效 — 激光柱 + 脉冲光环 + 火花粒子
 * ================================================================ */
.pet-layer-area--evolving {
  /* 进化动画区域整体增强 */
}

/* 粒子层容器 — 覆盖宠物区域 */
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

/* 火花粒子 — 从中心向外飞散 */
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

/* 进化光柱 — 从宠物中心直冲上方 */
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

/* 脉冲光环 — 从宠物中心向外扩散 */
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

/* P50: 进化中文字提示 — 轻量级悬浮，绝对定位在宠物上方，透明背景 */
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

/* 进化中的宠物图片/Sprite额外增强 — 覆盖默认 drop-shadow */
.pet-layer-area--evolving :deep(.pet-anim-img),
.pet-layer-area--evolving :deep(.pet-anim-sprite) {
  filter: drop-shadow(0 0 30rpx rgba(255, 215, 0, 0.9)) drop-shadow(0 0 60rpx rgba(255, 255, 255, 0.6)) drop-shadow(0 8rpx 24rpx rgba(0,0,0,0.3)) !important;
}
</style>
