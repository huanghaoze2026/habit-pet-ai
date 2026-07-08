<template>
  <view class="page-task">
    <CustomNavbar title="好习惯养宠" :showInvite="false" />
    <view class="nav-spacer" />

    <!-- P36: 无宝贝时：使用指引 + 添加按钮 -->
    <view v-if="!store.childList.length" class="guide-wrap">
      <view class="guide-image-area">
        <image
          class="guide-image"
          src="/static/guide-flow.jpg"
          mode="widthFix"
        />
        <view class="guide-btn-float" @click="goAddChild">
          <text class="guide-btn-text">去添加宝贝</text>
        </view>
      </view>
    </view>

    <!-- 有宝贝时：swiper 左右滑动切换 -->
    <swiper
      v-else
      class="task-swiper"
      :current="store.currentIndex"
      :duration="300"
      @change="onSwiperChange"
    >
      <swiper-item v-for="(child, childIdx) in store.childList" :key="child.id">
        <view class="top-bar">
          <view class="top-bar-left" @click="nextChild">
            <text v-if="store.childList.length > 1" class="arrow-switch arrow-switch--left" @click.stop="prevChild">‹</text>
            <image v-if="child.avatar" :src="child.avatar" class="top-bar-avatar" mode="aspectFill" />
            <view v-else class="top-bar-avatar-default"><text>{{ child.gender === 'male' ? '👦' : child.gender === 'female' ? '👧' : '👶' }}</text></view>
            <text class="top-bar-name">{{ child.nickname }}</text>
            <text v-if="store.childList.length > 1" class="arrow-switch arrow-switch--right" @click.stop="nextChild">›</text>
          </view>
          <!-- 今日任务：绝对居中 -->
          <text v-if="childTasks[child.id] && childTasks[child.id].length > 0" class="top-bar-today">今日任务</text>
        </view>
        <!-- 有任务时：右上角浮动添加按钮 -->
        <view v-if="childTasks[child.id] && childTasks[child.id].length > 0" class="top-bar-add" @click="goCreateTask">
          <text class="top-bar-add-icon">＋</text>
        </view>

        <template v-if="childIdx === store.currentIndex || loadedIndices.has(childIdx)">
          <!-- 无任务：创建按钮居中 + 引导语 -->
          <view v-if="!childTasks[child.id] || childTasks[child.id].length === 0" class="empty-create-area">
            <text class="empty-guide-text">为宝贝添加任务，让 TA 促进宠物进化吧</text>
            <view class="create-btn" @click="goCreateTask">
              <text class="create-btn-icon">＋</text>
              <text class="create-btn-text">创建任务</text>
            </view>
          </view>

          <!-- 任务列表 -->
          <scroll-view v-if="childTasks[child.id] && childTasks[child.id].length > 0" scroll-y class="task-list">
            <view v-for="(task, taskIdx) in (childTasks[child.id] || [])" :key="task.id" class="task-card-wrapper" :class="{ 'task-card--completed': showTaskParticles && particleTaskId === task.id }">
              <view class="task-card">
                <view class="task-body" @click="goDetail(task)">
                  <text class="task-icon">{{ task.icon || '📌' }}</text>
                  <view class="task-info-col">
                    <text class="task-name">{{ task.name }}</text>
                    <text v-if="task.description" class="task-desc">{{ task.description }}</text>
                    <text v-if="task.rewardContent" class="task-reward">🎁 {{ task.rewardContent }}</text>
                  </view>
                </view>
                <view class="task-right">
                  <view v-if="task.doneToday" class="task-done-label">
                    <text class="task-done-check">✅</text>
                  </view>
                  <view v-else class="task-done-btn" :class="{ 'task-done-btn--busy': completing }" @click.stop="completeTask(task)">
                    <text class="task-done-text">完成</text>
                  </view>
                </view>
              </view>
              <!-- P54: 能量粒子 — 从任务卡飞出，飞向宠物头像 -->
              <view v-if="showTaskParticles && particleTaskId === task.id" class="task-particles">
                <view class="particle-fly" v-for="i in 8" :key="i"
                  :style="{ animationDelay: (i * 0.08) + 's', left: (30 + Math.random() * 40) + '%' }" />
              </view>
            </view>
          </scroll-view>


        </template>
      </swiper-item>
    </swiper>

    <!-- P23: 宠物悬浮圆形头像 — 底部正中，固定，始终可见 -->
    <view
      v-if="currentChildId"
      class="pet-float"
      :class="{ 'pet-float--glow': glowPetCard }"
      @click.stop="goPet"
    >
      <!-- 气泡提示 -->
      <view v-if="glowPetCard && bubbleText" class="pet-bubble">
        <text class="pet-bubble-text">{{ bubbleText }}</text>
      </view>
      <view class="pet-float-ring" :class="{ 'pet-float-ring--bounce': glowPetCard }">
        <image v-if="petSpriteUrl && !petSpriteError" :src="petSpriteUrl" class="pet-float-img" mode="aspectFit" @error="onPetSpriteError" />
        <text v-else class="pet-float-emoji">{{ petEmoji }}</text>
        <!-- 宠物名称在圆圈内部偏下方 -->
        <text class="pet-float-name">{{ petName || '我的宠物' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { api } from '@/services/api'
import { copy } from '@/copy/onboarding'
import { useChildStore } from '@/stores/child'
import { useUserStore } from '@/stores/user'
import EmptyState from '@/components/empty-state/index.vue'
import CustomNavbar from '@/components/custom-navbar/index.vue'
import { API_ORIGIN } from '@/utils/env'

interface Task {
  id: string | number; name: string; title?: string; icon?: string
  energy?: number; points?: number; needPhoto?: boolean; doneToday?: boolean
  description?: string; rewardContent?: string
}

const store = useChildStore()

// P61: 场景背景图
const speciesId = ref('')

const userStore = useUserStore()
const childTasks = reactive<Record<string, Task[]>>({})
const loadedIndices = ref(new Set<number>())

// P36: 自定义导航栏
const systemInfo = uni.getSystemInfoSync()

const glowPetCard = ref(false)
const petEmoji = ref('🐾')
const petName = ref('')
const bubbleText = ref('')
const petSpriteUrl = ref('')
const petSpriteError = ref(false)

// P65: 任务完成率统计
const taskStats = ref<{ totalTasks: number; completedTasks: number; completionRate: number } | null>(null)
const loadStats = async () => {
  const cid = store.currentChildId
  if (!cid) return
  try {
    const res = await api.get<{ totalTasks: number; completedTasks: number; completionRate: number }>('/task/stats', { childId: cid })
    taskStats.value = res.data
    console.log('[Task] Stats loaded:', res.data)
  } catch { taskStats.value = null }
}

// P54: 任务完成粒子动画
const showTaskParticles = ref(false)
const particleTaskId = ref<string | number | null>(null)
const completing = ref(false) // P65: 防重复点击
let glowTimer: ReturnType<typeof setTimeout> | null = null
let particleTimer: ReturnType<typeof setTimeout> | null = null

const SPRITE_CDN = `${API_ORIGIN}/uploads/sprites`
const SPRITE_VER = 'v=20260630161700' // P50: 破微信图片缓存（更新于 2026-06-30 16:17）

/**
 * P54: 统一精灵图 URL 拼接 — 格式: speciesId/stageKey_emotionKey.png
 */
function getPetSprite(speciesId: string, stageKey: string, emotionKey: string): string {
  if (!speciesId) return ''
  return `${SPRITE_CDN}/${speciesId}/${stageKey}_${emotionKey}.png?${SPRITE_VER}`
}

const SPECIES_EMOJI: Record<string, string> = {
  cloud_beast:'☁️',milk_tea_fox:'🦊',moon_rabbit:'🐰',fire_dragon_dog:'🐉',
  thunder_tiger:'⚡',thunder_mecha_tiger:'⚡',sword_eagle:'🦅',doctor_cat:'📚',code_cool:'💻',
  azure_dragon:'🐲',phoenix_bird:'🔥',baize:'🦄',
}

const currentChildId = computed(() => store.currentChildId)

// P23 fix: 监听当前宝贝切换，自动更新宠物头像
watch(() => store.currentChildId, (newId: string | null) => {
  if (newId) loadPetInfo(newId)
})

/**
 * H: 加载宠物悬浮头像 — 使用 speciesId + stageKey 标准化拼接
 * 禁止硬编码物种白名单
 * P55: 增加调试日志 + 健壮 speciesId 处理，防止头像映射错误
 */
async function loadPetInfo(childId: string) {
  try {
    const res = await api.get<any[]>('/pet/list', { childId })
    const pets = res.data || []
    if (Array.isArray(pets) && pets.length > 0) {
      const pet = pets[0]
      // P55: 优先使用后端返回的 speciesId，不做本地硬编码 fallback
      const sid = (pet.speciesId || '').trim()
      console.log('[task] loadPetInfo childId=%s speciesId=%s stageKey=%s stage=%s', childId, sid, pet.stageKey, pet.stage)
      speciesId.value = sid

      petName.value = pet.stageName || pet.name || ''
      petEmoji.value = SPECIES_EMOJI[sid] || '🐾'
      // P57: stageKey 优先从后端取，缺失时根据 stage 推导 (0→egg, 1→baby, ...)
      const petStage = typeof pet.stage === 'number' ? pet.stage : undefined
      const stageMap: Record<number, string> = { 0: 'egg', 1: 'baby', 2: 'juvenile', 3: 'evolved', 4: 'ultimate' }
      let stageKey = pet.stageKey || (petStage !== undefined ? (stageMap[petStage] || 'egg') : 'egg')
      // 只有 speciesId 有效时才拼接精灵图 URL
      if (sid) {
        petSpriteUrl.value = getPetSprite(sid, stageKey, 'idle')
        petSpriteError.value = false
      } else {
        // 无有效 speciesId → 清空精灵图，回退到 emoji
        petSpriteUrl.value = ''
        petSpriteError.value = true
      }
    } else {
      petName.value = ''
      petEmoji.value = '🐾'
      petSpriteUrl.value = ''
      petSpriteError.value = true
    }
  } catch {
    petName.value = ''; petEmoji.value = '🐾'; petSpriteUrl.value = ''; petSpriteError.value = true
  }
}

/**
 * H：打卡后自动尝试进化 — 适配新 evolvePet 响应格式
 * P49: 支持 stage 0→1 和 stage 1→2，使用后端鼓励语 + 本地兜底 + TTS
 */
async function tryAutoEvolve(childId: string, backendEncouragement?: string) {
  try {
    console.log('[tryAutoEvolve] 开始检查进化:', childId)
    const petRes = await api.get<any[]>('/pet/list', { childId })
    const pets = petRes.data || []
    console.log('[tryAutoEvolve] 宠物列表:', pets.length, JSON.stringify({stage: pets[0]?.stage, stageKey: pets[0]?.stageKey, growth: pets[0]?.growth}))
    if (!pets.length) return
    const pet = pets[0]

    // P49: 优先使用 growth.stage（PetGrowthState 真相数据源），兼容 stage 字符串/数字
    const currentStage = typeof pet.growth?.stage === 'number'
      ? pet.growth.stage
      : typeof pet.stage === 'number'
        ? pet.stage
        : ({ egg: 0, baby: 1, juvenile: 2, evolved: 3, ultimate: 4 }[pet.stage] ?? 0)
    console.log('[tryAutoEvolve] 解析后 currentStage:', currentStage)

    // P49: 超过成长期(2)则无需自动进化
    if (currentStage > 1) {
      console.log('[tryAutoEvolve] 已超过成长期，跳过. stage=', currentStage)
      return
    }

    console.log('[tryAutoEvolve] 调用进化 API:', pet.id)
    const evolveRes = await api.post<any>('/pet/' + pet.id + '/evolve')
    const data = evolveRes.data
    console.log('[tryAutoEvolve] 进化结果:', data)
    if (!data || !data.success) {
      console.log('[tryAutoEvolve] 进化失败:', data)
      return
    }

    uni.showToast({ title: '🎉 宠物已进化！', icon: 'none', duration: 2000 })

    // H: 写入 storage — P48 新格式，fromStageKey/toStageKey 从后端动态获取
    const toStageKey = data.toStageKey || 'baby'
    const fromStageKey = data.fromStageKey || 'egg'
    uni.setStorageSync('pet_just_evolved', JSON.stringify({
      petId: data.petId || pet.id,
      childId,  // P50: 绑定当前宝贝，防止串号
      speciesId: data.speciesId || pet.speciesId || '',
      fromStage: data.fromStage ?? currentStage,
      toStage: data.toStage ?? (currentStage + 1),
      fromStageKey,
      toStageKey,
      fromStageName: data.fromStageName || '',
      toStageName: data.toStageName || '',
      newSpriteUrl: data.newSpriteUrl || '',
      animation: 'evolution',
      createdAt: Date.now()
    }))

    // P49: 进化气泡 — 优先后端鼓励语，兜底本地进化语料库
    const localEvoPool = [
      '🎉 完成任务，我要进化了！快来看看吧！',
      '主人主人，我进化了！快点击我看看！',
      '✨ 进化之光降临！快来看看全新的我！',
      '我变强了！谢谢主人，快来看看我的新样子～',
    ]
    const evoMsg = backendEncouragement
      || data.message
      || localEvoPool[Math.floor(Math.random() * localEvoPool.length)]
    triggerPetGlow(evoMsg)
    // 不刷新头像 — 保持原始形态，点击头像进入宠物页才播放进化动画
  } catch (e: any) {
    const errMsg = e?.message || e?.data?.message || ''
    console.log('进化跳过:', errMsg)
    // 进化失败不弹 toast，静默处理
  }
}

function onPetSpriteError() {
  petSpriteError.value = true
}

function triggerPetGlow(encouragement?: string) {
  glowPetCard.value = true
  bubbleText.value = encouragement || ''
  if (glowTimer) clearTimeout(glowTimer)
  glowTimer = setTimeout(() => { glowPetCard.value = false; bubbleText.value = '' }, 8000)
  // 异步请求 TTS 播放（不阻塞气泡出现）
  if (encouragement) {
    api.post<{audioUrl:string}>('/ai/tts', { text: encouragement }).then(r => {
      const url = r.data?.audioUrl
      if (url) {
        const a = uni.createInnerAudioContext({ useWebAudioImplement: true })
        a.obeyMuteSwitch = false; a.src = url; a.play()
      }
    }).catch(()=>{})
  }
}

const goPet = () => uni.navigateTo({ url: '/pages/pet/pet' })

const onSwiperChange = (e: any) => {
  const i = e.detail.current
  store.switchTo(i); loadedIndices.value.add(i)
  const c = store.childList[i]
  if (c?.id && !childTasks[c.id]) fetchTasksForChild(c.id)
}

const nextChild = () => {
  if (store.currentIndex < store.childList.length - 1)
    store.switchTo(store.currentIndex + 1)
}

const prevChild = () => {
  if (store.currentIndex > 0) store.switchTo(store.currentIndex - 1)
}

const refreshCurrentChild = () => {
  if (store.childList.length > 0) {
    loadedIndices.value.add(store.currentIndex)
    const c = store.childList[store.currentIndex]
    if (c) { delete childTasks[c.id]; fetchTasksForChild(c.id) }
  }
}

onShow(() => {
  store.fetchChildList(true).then(() => {
    refreshCurrentChild()
    if (store.currentChildId) {
      loadPetInfo(store.currentChildId)
      loadStats()
    }
  })
})

const onShareAppMessage = () => {
  const uid = uni.getStorageSync('habitpet_user')
  const userId = uid ? JSON.parse(uid).userId : ''
  return { title:'邀你来好习惯养宠！', path:`/pages/invite/accept?inviter=${userId}`, imageUrl:'https://api.lanyunke.com/uploads/share/invite_card.png' }
}

uni.$on('task:refresh', () => refreshCurrentChild())
onUnload(() => { uni.$off('task:refresh') })

const fetchTasksForChild = async (childId: string) => {
  try {
    const res = await api.get<{items?:Task[]}>('/task/list', { childId })
    const data = (res.data as any)?.items || res.data || []
    childTasks[childId] = (Array.isArray(data) ? data : []).map((t: any) => ({ ...t, name: t.title || t.name }))
  } catch { childTasks[childId] = [] }
}

const goMine = () => uni.navigateTo({ url: '/pages/mine/mine' })
const handleInvite = () => {
  const uid = userStore.userId
  if (!uid) { uni.showToast({ title:'请先登录', icon:'none' }); return }
  uni.setClipboardData({ data:`pages/invite/accept?inviter=${uid}`, success:()=>uni.showToast({ title:'邀请链接已复制', icon:'none' }) })
}
const goAddChild = () => uni.navigateTo({ url: '/pages/parent/children/add' })
const goCreateTask = () => uni.navigateTo({ url: '/pages/task/create' })
const goDetail = (t: Task) => uni.navigateTo({ url: '/pages/task/detail?id=' + t.id })

const completeTask = async (task: Task) => {
  if (completing.value) return
  const childId = store.currentChildId
  if (!childId) return
  completing.value = true
  try {
    if (task.needPhoto) {
      const r = await uni.chooseImage({ count: 1 })
      const tempPath = r.tempFilePaths[0]
      // P59: 保存到本地持久路径，避免跨页导航后临时文件被微信清理
      const fs = uni.getFileSystemManager()
      const savedPath = `${wx.env.USER_DATA_PATH}/checkin_photo_${Date.now()}.jpg`
      try { await new Promise<void>((resolve, reject) => { fs.saveFile({ tempFilePath: tempPath, filePath: savedPath, success: () => resolve(), fail: reject }) }) } catch {}
      const child = store.childList[store.currentIndex]
      const p = [`taskId=${task.id}`,`childId=${childId}`,`photoPath=${encodeURIComponent(savedPath)}`,`taskName=${encodeURIComponent(task.name||task.title||'')}`,`energy=${task.energy||0}`,`childName=${encodeURIComponent(child?.nickname||'')}`].join('&')
      uni.navigateTo({ url: `/pages/task/checkin?${p}` })
    } else {
      const res = await api.post<{ encouragementText?: string; petExpGained?: number }>('/checkin/submit', { taskId: task.id, childId })
      const encouragement = (res.data as any)?.encouragementText || ''
      const expGained = (res.data as any)?.petExpGained || 0

      // P54: 粒子动画
      particleTaskId.value = task.id
      showTaskParticles.value = true
      if (particleTimer) clearTimeout(particleTimer)
      particleTimer = setTimeout(() => {
        showTaskParticles.value = false
        particleTaskId.value = null
        if (!glowPetCard.value) {
          const encouragements = [
            encouragement || '太棒啦！', '我变强了！', '谢谢主人～', '主人最好了！', '继续加油哦！'
          ]
          const randomEnc = encouragements[Math.floor(Math.random() * encouragements.length)]
          triggerPetGlow(randomEnc)
        }
      }, 600)

      // P57: 打卡后立即尝试进化 + 强制刷新宠物状态
      if (expGained > 0) {
        uni.showToast({ title: '获得经验 +' + expGained, icon: 'none', duration: 1000 })
        tryAutoEvolve(childId, encouragement)
      }
      // M: 无论是否进化，打卡后强制刷新宠物头像
      loadPetInfo(childId)

      if (childId) fetchTasksForChild(childId)
      loadStats()
    }
    completing.value = false
  } catch (e: any) {
    if (e?.errMsg?.includes('cancel')||e?.errMsg?.includes('Cancel')) { completing.value = false; return }
    uni.showToast({ title: '打卡失败，请重试', icon: 'none' })
    completing.value = false
  }
}
</script>

<style scoped>
.page-task { position:relative; display:flex; flex-direction:column; height:100vh; background:linear-gradient(180deg,#F5F0FF,#EBE0FF); }
.nav-spacer { height:calc(88rpx + var(--status-bar, 44px)); flex-shrink:0; position:relative; z-index:1; }

/* P36: 自定义导航栏 */

/* P36: 无宝贝指引页 */
.guide-wrap {
  flex:1; display:flex; flex-direction:column;
  overflow-y:auto;
}
.guide-image-area {
  flex:1; display:flex; align-items:flex-start; justify-content:center;
  position:relative;
}
.guide-image {
  width:100%;
}
.guide-btn-float {
  position:absolute;
  bottom:18%;
  left:50%;
  transform:translateX(-50%);
  display:flex; align-items:center; justify-content:center;
  width:60%; max-width:480rpx;
  background:linear-gradient(135deg,#7B61FF,#9D4EDD);
  border-radius:48rpx;
  padding:28rpx 0;
  box-shadow:0 8rpx 24rpx rgba(123,97,255,0.35);
  z-index:10;
}
.guide-btn-float:active { opacity:0.85; transform:translateX(-50%) scale(0.97); }
.guide-btn-text { font-size:32rpx; color:#fff; font-weight:bold; letter-spacing:2rpx; }
.task-swiper { flex:1; width:100%; height:0; position:relative; z-index:1; }
.task-swiper swiper-item, ::v-deep swiper-item { display:flex; flex-direction:column; position:relative; }
/* P61: 顶部栏半透明融入背景 */
/* P62: 宝贝切换栏增强半透明毛玻璃 */
.top-bar { display:flex; align-items:center; padding:20rpx; flex-shrink:0; position:relative; z-index:1; background:rgba(255,255,255,0.55); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-radius:24rpx; margin:12rpx 20rpx; }
.top-bar-left { display:flex; align-items:center; gap:12rpx; }
/* 今日任务：绝对定位居中，不受左侧名字长度影响 */
.top-bar-today { font-size:32rpx; font-weight:bold; color:#4A2D7A; position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap; z-index:1; text-shadow:0 1rpx 3rpx rgba(255,255,255,0.9); }
.top-bar-stats { font-size:22rpx; color:#8B5CF6; font-weight:600; margin-left:12rpx; }
.top-bar-avatar,.top-bar-avatar-default { width:62rpx; height:62rpx; border-radius:50%; background:#D4C5F0; display:flex; align-items:center; justify-content:center; font-size:32rpx; }
.top-bar-name { font-size:28rpx; font-weight:bold; color:#222; text-shadow:0 1rpx 2rpx rgba(255,255,255,0.8); }
/* 宝贝切换左右箭头 */
.arrow-switch { font-size:32rpx; color:#222; font-weight:bold; display:flex; align-items:center; padding:0 6rpx; text-shadow:0 1rpx 2rpx rgba(255,255,255,0.8); }
.arrow-switch--left { margin-right:4rpx; }
.arrow-switch--right { margin-left:4rpx; }
.arrow-switch:active { opacity:0.45; }
/* 右上角浮动添加按钮（浅芋紫色） */
/* P62: 新增按钮粉色调毛玻璃 */
.top-bar-add { position:absolute; top:20rpx; right:24rpx; width:56rpx; height:56rpx; border-radius:40rpx; background:rgba(255,142,158,0.75); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:10; box-shadow:0 4rpx 20rpx rgba(255,142,158,0.3); border:1px solid rgba(255,255,255,0.4); }
.top-bar-add-icon { font-size:32rpx; color:#fff; font-weight:bold; }

/* 无任务：创建按钮居中 */
.empty-create-area { display:flex; align-items:center; justify-content:center; flex:1; flex-direction:column; position:relative; z-index:1; }
.empty-guide-text { font-size:26rpx; color:#5B3E96; margin-bottom:24rpx; text-align:center; text-shadow:0 1rpx 2rpx rgba(255,255,255,0.9); }
/* P62: 创建按钮粉色调毛玻璃 */
.create-btn { display:flex; align-items:center; gap:16rpx; background:rgba(255,142,158,0.75); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border-radius:40rpx; padding:24rpx 56rpx; box-shadow:0 8rpx 24rpx rgba(255,142,158,0.3); border:1px solid rgba(255,255,255,0.4); color:#fff; font-weight:500; }
.create-btn-icon { font-size:44rpx; color:#fff; }
.create-btn-text { font-size:30rpx; color:#fff; font-weight:bold; }

/* 宠物名称 */
.pet-float-name { position:absolute; bottom:28rpx; left:50%; transform:translateX(-50%); font-size:22rpx; color:#333; font-weight:bold; text-align:center; white-space:nowrap; max-width:240rpx; overflow:hidden; text-overflow:ellipsis; text-shadow: -1rpx -1rpx 0 #fff, 1rpx -1rpx 0 #fff, -1rpx 1rpx 0 #fff, 1rpx 1rpx 0 #fff; z-index:2; }

/* P23+P36: 宠物悬浮圆形头像 — 屏幕约下 1/6 处，固定，始终可见，放大一倍 */
.pet-float { position:fixed; left:50%; bottom:calc(100rpx + env(safe-area-inset-bottom)); transform:translateX(-50%); z-index:200; display:flex; flex-direction:column; align-items:center; }
/* 气泡提示（在头像上方） */
.pet-bubble {
  background:#fff; border-radius:20rpx; padding:16rpx 28rpx;
  box-shadow:0 4rpx 16rpx rgba(0,0,0,0.08); margin-bottom:16rpx;
  max-width:480rpx; position:relative;
  animation:pet-bubble-in 0.3s ease-out;
}
.pet-bubble::after {
  content:''; position:absolute; bottom:-12rpx; left:50%; transform:translateX(-50%);
  width:0; height:0; border-left:14rpx solid transparent;
  border-right:14rpx solid transparent; border-top:14rpx solid #fff;
}
.pet-bubble-text { font-size:26rpx; color:#333; line-height:1.5; }
@keyframes pet-bubble-in { from{opacity:0;transform:translateY(10rpx)} to{opacity:1;transform:translateY(0)} }

/* P62: 宠物头像半透明毛玻璃圆环 */
.pet-float-ring {
  position:relative; overflow:hidden;
  width:320rpx; height:320rpx; border-radius:50%;
  background:rgba(255,255,255,0.55);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4rpx 20rpx rgba(0,0,0,0.10);
  transition:transform 0.3s, box-shadow 0.3s;
}
.pet-float-emoji { font-size:192rpx; line-height:1; }
.pet-float-img { width:240rpx; height:240rpx; border-radius:50%; opacity:0.9; }

/* 打卡后金光 + 放大特效（position:fixed 不变，不影响布局） */
.pet-float--glow .pet-float-ring {
  transform:scale(1.2);
  animation: pet-glow 0.5s ease-in-out 6;
}
@keyframes pet-glow {
  0%,100%{box-shadow:0 0 30rpx #FFD700, 0 8rpx 36rpx rgba(0,0,0,0.12)}
  50%{box-shadow:0 0 60rpx #FFD700, 0 0 100rpx rgba(255,215,0,0.5), 0 8rpx 36rpx rgba(0,0,0,0.12)}
}
.pet-float-ring--bounce {
  animation: pet-pop 0.4s ease-in-out;
}
@keyframes pet-pop {
  0%{transform:scale(1)} 40%{transform:scale(1.18)} 70%{transform:scale(0.95)} 100%{transform:scale(1)}
}

/* P54: 能量粒子从任务卡飞向宠物头像 */
.task-card-wrapper { position:relative; }
.task-card--completed .task-card {
  animation: card-complete-flash 0.5s ease-out;
}
@keyframes card-complete-flash {
  0% { box-shadow: 0 0 0 rgba(74,222,128,0); }
  40% { box-shadow: 0 0 40rpx rgba(74,222,128,0.6); }
  100% { box-shadow: 0 0 0 rgba(74,222,128,0); }
}

.task-particles {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 50;
  overflow: visible;
}
.particle-fly {
  position: absolute;
  top: 50%;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: radial-gradient(circle, #FFD700, #FF8C00);
  box-shadow: 0 0 16rpx rgba(255,215,0,0.8);
  animation: particle-fly-up 0.9s ease-in forwards;
}
@keyframes particle-fly-up {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  30% {
    opacity: 1;
    transform: translateY(-60rpx) scale(1.3);
  }
  100% {
    opacity: 0;
    transform: translateY(-400rpx) scale(0.2);
  }
}

/* P54: 宠物头像发光增强 */
.pet-float--glow .pet-float-ring {
  transform: scale(1.05);
  animation: pet-glow-enhanced 0.5s ease-in-out 3;
}
@keyframes pet-glow-enhanced {
  0%,100% {
    box-shadow: 0 0 30rpx #FFD700, 0 0 60rpx rgba(255,215,0,0.4), 0 8rpx 36rpx rgba(0,0,0,0.12);
  }
  50% {
    box-shadow: 0 0 80rpx #FFD700, 0 0 160rpx rgba(255,215,0,0.7), 0 0 200rpx rgba(255,215,0,0.3), 0 8rpx 36rpx rgba(0,0,0,0.12);
  }
}

.task-list { flex:1; padding-bottom:380rpx; position:relative; z-index:1; }
.task-card-wrapper { margin:20rpx 24rpx; }
/* P61: 果冻质感半透明毛玻璃卡片 */
/* P62: 任务卡片强化毛玻璃质感 */
.task-card { display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.55); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1px solid rgba(255,255,255,0.6); border-radius:24rpx; padding:32rpx 28rpx; overflow:hidden; box-shadow:0 4rpx 24rpx rgba(0,0,0,0.06); position:relative; z-index:1; }
.task-card:active { background:rgba(255,255,255,0.8); }
.task-body { display:flex; align-items:center; gap:16rpx; flex:1; }
.task-icon { font-size:40rpx; }
.task-info-col { display:flex; flex-direction:column; gap:6rpx; flex:1; min-width:0; }
.task-name { font-size:30rpx; color:#2D2D2D; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 1rpx 2rpx rgba(255,255,255,0.8); }
.task-desc { font-size:24rpx; color:#555; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.task-reward { font-size:23rpx; color:#E0912F; margin-top:4rpx; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.task-right { display:flex; align-items:center; }
.task-done-btn { margin-left:12rpx; padding:8rpx 20rpx; background:#4CAF50; border-radius:24rpx; }
.task-done-btn--busy { opacity:0.5; pointer-events:none; }
.task-done-text { font-size:24rpx; color:#fff; }
.task-done-label { margin-left:12rpx; padding:8rpx 20rpx; }
.task-done-check { font-size:28rpx; }
/* P62: 毛玻璃降级方案 — 不支持 backdrop-filter 时提高背景不透明度 */
@supports not (-webkit-backdrop-filter:blur(1px)){
  .task-card{background:rgba(255,255,255,0.8)}
  .top-bar{background:rgba(255,255,255,0.8)}
  .top-bar-add{background:rgba(255,142,158,0.9)}
  .create-btn{background:rgba(255,142,158,0.9)}
  .pet-float-ring{background:rgba(255,255,255,0.8)}
}


</style>
