<template>
  <view class="page-detail" v-if="child">
    <!-- 基本信息卡片 -->
    <view class="card">
      <view class="card-title">
        <text>基本信息</text>
        <view class="card-title-edit" @tap="goEdit">
          <text>编辑</text>
        </view>
      </view>
      <view class="info-row">
        <text class="label">头像</text>
        <image
          v-if="child.avatar"
          :src="child.avatar"
          class="avatar"
          mode="aspectFill"
        />
        <view v-else class="avatar-default">
          <text>{{ child.gender === 'male' ? '👦' : child.gender === 'female' ? '👧' : '👶' }}</text>
        </view>
      </view>
      <view class="info-row">
        <text class="label">昵称</text>
        <text class="value">{{ child.nickname }}</text>
      </view>
      <view class="info-row">
        <text class="label">年龄</text>
        <text class="value">{{ child.age ? child.age + '岁' : '未设置' }}</text>
      </view>
      <view class="info-row">
        <text class="label">性别</text>
        <text class="value">{{ child.gender === 'male' ? '男' : child.gender === 'female' ? '女' : '未设置' }}</text>
      </view>
      <view class="info-row">
        <text class="label">年级</text>
        <text class="value">{{ child.grade || '未设置' }}</text>
      </view>
    </view>

    <!-- 关联宠物卡片（可展开） -->
    <view class="card">
      <view class="card-title" @click="showPetExpanded = !showPetExpanded">
        <text>关联宠物</text>
        <text class="card-arrow">{{ showPetExpanded ? '▾' : '›' }}</text>
      </view>
      
      <!-- 收起状态：简要信息 -->
      <view v-if="!showPetExpanded && petInfo" class="info-row pet-row" @click="showPetExpanded = true">
        <view class="pet-left">
          <image v-if="petSpriteUrl && !petSpriteError" :src="petSpriteUrl" class="pet-avatar-img" mode="aspectFit" @error="petSpriteError = true" />
          <text v-else class="pet-icon">{{ petEmoji }}</text>
          <text class="value">{{ petInfo.petName || petInfo.speciesName || child.speciesName }}</text>
          <text class="pet-level">Lv.{{ petInfo.level || 1 }}</text>
        </view>
      </view>
      
      <!-- 展开状态：详细信息 -->
      <view v-if="showPetExpanded && petInfo" class="pet-detail-expanded">
        <view class="pet-detail-row">
          <text class="pet-detail-label">宠物名称</text>
          <view class="pet-detail-value-row">
            <text class="pet-detail-value">{{ petInfo.petName || petInfo.speciesName || child.speciesName || '-' }}</text>
            <text v-if="petDetail?.speciesId" class="view-stages-btn" @click="goViewStages">查看形态 ›</text>
          </view>
        </view>
        <view class="pet-detail-row">
          <text class="pet-detail-label">物种</text>
          <text class="pet-detail-value">{{ petInfo.speciesName || child.speciesName || '-' }}</text>
        </view>
        <view class="pet-detail-row">
          <text class="pet-detail-label">等级</text>
          <text class="pet-detail-value">Lv.{{ petInfo.level || 1 }}</text>
        </view>
        <view class="pet-detail-row">
          <text class="pet-detail-label">阶段</text>
          <text class="pet-detail-value">{{ petInfo.stage || 'baby' }}</text>
        </view>
        <view class="pet-detail-row">
          <text class="pet-detail-label">心情</text>
          <text class="pet-detail-value">{{ petInfo.mood ?? 50 }}%</text>
        </view>
        <view class="pet-detail-row">
          <text class="pet-detail-label">升级进度</text>
          <view class="upgrade-bar">
            <view class="upgrade-fill" :style="{ width: upgradePercent + '%' }"></view>
          </view>
          <text class="upgrade-text">{{ petInfo.exp || 0 }} / {{ petInfo.expToNext || 100 }}</text>
        </view>
        
        <!-- AI 使用统计（嵌套在宠物卡片内，仅当前宠物） -->
        <view class="ai-stats-divider"></view>
        <text class="ai-stats-title">AI 使用统计</text>
        <view class="ai-stats-grid">
          <view class="ai-stat-item">
            <text class="ai-stat-value">{{ formatTokens(aiStats?.totalTokens || 0) }}</text>
            <text class="ai-stat-label">Token</text>
          </view>
          <view class="ai-stat-item">
            <text class="ai-stat-value">{{ aiStats?.totalCalls || 0 }}</text>
            <text class="ai-stat-label">调用次数</text>
          </view>
        </view>
      </view>
      
      <!-- 无宠物状态 -->
      <view v-if="!petInfo" class="watch-unbind">
        <text class="unbind-text">未绑定宠物</text>
        <view class="bind-btn" @click="goSelectPet"><text>去选择</text></view>
      </view>
    </view>

    <!-- 手表绑定卡片 -->
    <view class="card">
      <view class="card-title">手表信息</view>
      <view v-if="child.watchBindStatus === 'bound'" class="info-row">
        <text class="label">⌚ 已绑定</text>
        <text class="value">{{ child.watchType || '未知型号' }}</text>
      </view>
      <view v-else class="watch-unbind">
        <text class="unbind-text">未绑定手表</text>
        <view class="bind-btn" @click="goBindWatch">
          <text>去绑定</text>
        </view>
      </view>
      <view v-if="child.watchDeviceId" class="info-row">
        <text class="label">设备ID</text>
        <text class="value device-id">{{ child.watchDeviceId }}</text>
      </view>
    </view>

    <!-- 任务管理 -->
    <view class="card">
      <view class="card-title">
        <text>任务管理</text>
        <view v-if="taskStatsComputed.totalTasks > 0" class="task-stats">
          <text class="task-stats-done">{{ taskStatsComputed.completedTasks }}</text>
          <text class="task-stats-div">/</text>
          <text class="task-stats-total">{{ taskStatsComputed.totalTasks }}</text>
          <text class="task-stats-rate">完成率 {{ taskStatsComputed.completionRate > 100 ? '100%+' : taskStatsComputed.completionRate + '%' }}</text>
        </view>
      </view>
      <view v-if="taskGroups.length === 0" class="task-empty">
        <text class="task-empty-text">暂无任务记录</text>
      </view>
      <view v-for="(group, gIdx) in taskGroups" :key="group.date" class="task-group">
        <!-- 日期标题栏（可点击收缩） -->
        <view
          class="task-group-header"
          :class="{ 'task-group-header--today': group.isToday }"
          @click="toggleGroup(gIdx)"
        >
          <view class="task-group-header-left">
            <text class="task-group-date">{{ group.label }}</text>
          </view>
          <view class="task-group-header-right">
            <text class="task-group-progress">{{ group.completedTasks }}/{{ group.totalTasks }}</text>
            <text v-if="group.allDone" class="task-group-all-done">✅</text>
            <text class="task-group-arrow" :class="{ 'task-group-arrow--open': group.expanded }">▾</text>
          </view>
        </view>

        <!-- 该日期下的任务列表 -->
        <view v-if="group.expanded" class="task-group-body">
          <view
            v-for="task in group.tasks"
            :key="task.id"
            class="task-card-item"
            :class="{ 'task-card-item--done': task.checkedIn }"
            @click="goTaskDetail(task)"
          >
            <view class="task-card-left">
              <text class="task-card-icon">{{ task.icon || '📌' }}</text>
              <view class="task-card-info">
                <text class="task-card-title">{{ task.title }}</text>
                <view class="task-card-sub">
                  <text v-if="task.rewardContent" class="task-card-reward">{{ task.rewardContent }}</text>
                  <text class="task-card-energy">⚡ {{ task.energy || 0 }} 能量</text>
                </view>
              </view>
            </view>
            <view class="task-card-right" @click.stop>
              <view v-if="task.checkedIn" class="task-card-checked">
                <text class="task-card-check-icon">✅</text>
              </view>
              <view v-else class="task-card-actions">
                <text class="task-card-unchecked-text">待完成</text>
                <view class="task-card-delete-btn" @click="confirmDeleteTask(task)">
                  <text>🗑️</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 删除宝贝按钮 -->
    <view class="danger-zone">
      <view class="delete-btn" @click="confirmDeleteChild">
        <text class="delete-btn-text">🗑️ 删除宝贝</text>
      </view>
      <text class="delete-hint">确定删除宝贝吗？所有任务、宠物和聊天记录都会被清空，不可恢复。</text>
    </view>

    <!-- 删除任务确认弹窗 -->
    <view v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <view class="modal-box" @click.stop>
        <text class="modal-title">删除任务</text>
        <text class="modal-content">确定删除「{{ deleteTarget?.title }}」吗？</text>
        <view v-if="deleteTarget?.repeatType && deleteTarget.repeatType !== 'once'" class="modal-checkbox" @click="deleteAllFuture = !deleteAllFuture">
          <text class="modal-checkbox-icon">{{ deleteAllFuture ? '☑' : '☐' }}</text>
          <text class="modal-checkbox-text">同时删除后续所有相同任务</text>
        </view>
        <view class="modal-buttons">
          <view class="modal-btn modal-btn-cancel" @click="showDeleteModal = false">
            <text>取消</text>
          </view>
          <view class="modal-btn modal-btn-confirm" @click="executeDeleteTask">
            <text>确认删除</text>
          </view>
        </view>
      </view>
    </view>
  </view>
  <view v-else class="loading">
    <text v-if="loadFailed" class="loading-retry" @click="retryLoad">加载失败，点击重试</text>
    <text v-else>加载中...</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { api } from '@/services/api'
import { useChildStore } from '@/stores/child'
import { API_ORIGIN } from '@/utils/env'

const store = useChildStore()

interface ChildDetail {
  childInfo: {
    id: string
    nickname: string
    avatar?: string
    age?: number
    gender?: string
    grade?: string
    watchType?: string
    watchBindStatus?: string
    watchDeviceId?: string
    petId?: string
    petSpeciesId?: string
    speciesName?: string
    petChangeCount: number
  }
  petStatus?: {
    petName?: string
    speciesId?: string
    speciesName?: string
    stage?: string
    level?: number
    exp?: number
    expToNext?: number
    mood?: number
    bondScore?: number
    relationshipLevel?: string
  }
  aiStats?: {
    totalTokens: number
    totalCalls: number
    totalCostUsd: number
  }
}

interface TaskGroupItem {
  date: string
  label: string
  isToday: boolean
  totalTasks: number
  completedTasks: number
  allDone: boolean
  expanded: boolean
  tasks: TaskDayItem[]
}

interface TaskDayItem {
  id: string
  title: string
  icon?: string
  energy?: number
  rewardContent?: string
  needPhoto?: boolean
  repeatType?: string
  checkedIn: boolean
  checkinAt?: string | null
  checkinImage?: string | null
  checkinNote?: string | null
}

const child = ref<ChildDetail['childInfo'] | null>(null)
const petDetail = ref<ChildDetail['petStatus'] | null>(null)
const aiStats = ref<ChildDetail['aiStats'] | null>(null)
const taskGroups = ref<TaskGroupItem[]>([])
const loadFailed = ref(false)

// 自定义删除弹窗
const showDeleteModal = ref(false)
const deleteTarget = ref<TaskDayItem | null>(null)
const deleteAllFuture = ref(false)
const showPetExpanded = ref(false)

// 宠物物种 → emoji 映射
const SPECIES_EMOJI: Record<string, string> = {
  cloud_beast: '☁️',
  milk_tea_fox: '🦊',
  moon_rabbit: '🐰',
  fire_dragon_dog: '🐉',
  thunder_tiger: '⚡',
  sword_eagle: '🦅',
  doctor_cat: '📚',
  code_cool: '💻',
  azure_dragon: '🐲',
  phoenix_bird: '🔥',
  baize: '🦄',
}

const petEmoji = computed(() => {
  const sid = petDetail.value?.speciesId || child.value?.petSpeciesId
  return sid ? SPECIES_EMOJI[sid] || '🐾' : '🐾'
})

// 当前宠物当前形态的精灵图（与 pet.vue 一致）
const SPRITE_BASE = `${API_ORIGIN}/uploads/sprites`
const petSpriteError = ref(false)
const petSpriteUrl = computed(() => {
  const sid = petDetail.value?.speciesId || (child.value as any)?.petSpeciesId
  const stage = petDetail.value?.stage || 'baby'
  return sid ? `${SPRITE_BASE}/${sid}/${stage}_idle.png?v=20260630161700` : ''
})

const upgradePercent = computed(() => {
  if (!petDetail.value) return 0
  const exp = petDetail.value.exp || 0
  const total = petDetail.value.expToNext || 100
  if (total <= 0) return 0
  return Math.min(100, Math.round((exp / total) * 100))
})

const petInfo = computed(() => child.value?.petId ? petDetail.value || null : null)

// P65: 任务管理统计 — 优先使用统一接口数据
const taskStatsDirect = ref<{ totalTasks: number; completedTasks: number; completionRate: number } | null>(null)
const taskStatsComputed = computed(() => {
  if (taskStatsDirect.value) return taskStatsDirect.value
  // fallback: 从 taskGroups 汇总
  let total = 0, completed = 0
  for (const g of taskGroups.value) { total += g.totalTasks; completed += g.completedTasks }
  return { totalTasks: total, completedTasks: completed, completionRate: total > 0 ? Math.round(completed / total * 100) : 0 }
})

const currentChildId = ref('')

onLoad((options: any) => {
  const cid = options?.id
  if (cid) {
    currentChildId.value = cid
    fetchDetail(cid)
    fetchTaskHistory(cid)
    loadTaskStats(cid)
  }
})

onShow(() => {
  // 从任务详情等页面返回时刷新数据
  if (currentChildId.value) {
    fetchDetail(currentChildId.value);
    fetchTaskHistory(currentChildId.value);
    loadTaskStats(currentChildId.value);
  }
})

const loadTaskStats = async (childId: string) => {
  try {
    const res = await api.get<{ totalTasks: number; completedTasks: number; completionRate: number }>('/task/stats', { childId })
    taskStatsDirect.value = res.data
  } catch (e) {
    console.error('[Detail] task/stats error:', e)
    taskStatsDirect.value = null
  }
}

const fetchDetail = async (childId: string) => {
  loadFailed.value = false
  try {
    const res = await api.get<ChildDetail>(`/parent/children/${childId}`)
    child.value = res.data?.childInfo || null
    petDetail.value = res.data?.petStatus || null
    aiStats.value = (res.data as any)?.aiStats || null
  } catch (e) {
    console.error('[Detail] fetchDetail error:', e)
    loadFailed.value = true
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
  }
}

const retryLoad = () => {
  const cid = currentChildId.value
  if (!cid) return
  fetchDetail(cid)
  fetchTaskHistory(cid)
  loadTaskStats(cid)
}

const fetchTaskHistory = async (childId: string, reloadDays?: number) => {
  const queryDays = reloadDays || 7
  try {
    const res = await api.get<{ groups: TaskGroupItem[] }>('/task/history', { childId, days: queryDays })
    const groups = (res.data as any)?.groups || []
    taskGroups.value = groups.map((g: any) => ({
      ...g,
      expanded: g.isToday === true,
    }))
    console.log('[Detail] task/history loaded:', groups.length, 'days')
  } catch (e) {
    console.error('[Detail] task/history error:', e)
    taskGroups.value = []
  }
}

const toggleGroup = (idx: number) => {
  taskGroups.value[idx].expanded = !taskGroups.value[idx].expanded
}

const goPet = () => uni.navigateTo({ url: '/pages/pet/pet' })
// /pages/pet/select 页面不存在，改用提示（宠物选择功能暂未开放，入口在添加宝贝流程中）
const goSelectPet = () => uni.showToast({ title: '宠物选择功能开发中', icon: 'none' })
const goViewStages = () => {
  const speciesId = petDetail.value?.speciesId
  if (speciesId) uni.navigateTo({ url: '/pages/parent/children/pet-stages-preview?speciesId=' + speciesId })
}
const goTaskDetail = (task: { id: string }) => uni.navigateTo({ url: '/pages/task/detail?id=' + task.id })
const goBindWatch = () => {
  if (child.value?.id) uni.navigateTo({ url: `/pages/parent/children/watch?id=${child.value.id}` })
}

const goEdit = () => {
  if (child.value?.id) uni.navigateTo({ url: `/pages/parent/children/edit?id=${child.value.id}` })
}

const getRepeatLabel = (type?: string) => {
  const map: Record<string, string> = { daily: '每天重复', weekday: '工作日重复', monthly: '每月重复' }
  return map[type || ''] || '重复任务'
}

const formatTokens = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const confirmDeleteTask = (task: TaskDayItem) => {
  // 已完成的任务无需删除
  if (task.checkedIn) {
    uni.showToast({ title: '无需删除已完成的任务', icon: 'none' });
    return;
  }
  // 统一使用自定义弹窗，重复类型才显示"同时删除后续所有"勾选框
  deleteTarget.value = task;
  deleteAllFuture.value = false;
  showDeleteModal.value = true;
};

const executeDeleteTask = async () => {
  if (!deleteTarget.value) return
  const task = deleteTarget.value
  showDeleteModal.value = false
  try {
    const url = deleteAllFuture.value
      ? `/task/${task.id}?deleteFuture=true`
      : `/task/${task.id}`
    await api.del(url)
    uni.showToast({ title: '已删除', icon: 'success' })
    fetchTaskHistory(currentChildId.value)
  } catch (e) {
    console.error('[Detail] 删除任务失败:', e)
    uni.showToast({ title: '删除失败', icon: 'none' })
  }
  deleteTarget.value = null
  deleteAllFuture.value = false
}

const confirmDeleteChild = () => {
  const cid = child.value?.id
  if (!cid) return
  uni.showModal({
    title: '确认删除',
    content: `确定删除宝贝「${child.value?.nickname}」吗？所有任务、宠物和聊天记录都会被清空，不可恢复。`,
    confirmText: '删除',
    confirmColor: '#FF4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.del(`/parent/children/${cid}`)
          uni.showToast({ title: '已删除', icon: 'success' })
          // 重置 store 强制下次重新加载
          store.loaded = false
          await store.fetchChildList()
          setTimeout(() => {
            // 如果还有孩子，回到首页；否则回到任务页
            if (store.childList.length > 0) {
              uni.reLaunch({ url: '/pages/task/task' })
            } else {
              uni.navigateBack()
            }
          }, 800)
        } catch (e) { console.error('[Detail] 删除宝贝失败:', e); uni.showToast({ title: '删除失败', icon: 'none' }) }
      }
    },
  })
}
</script>

<style scoped>
.page-detail {
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  padding: 24rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title-edit {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
  padding: 12rpx 24rpx;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  border-radius: 24rpx;
}

/* 任务管理卡片右上角统计 */
.task-stats {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}
.task-stats-done {
  font-size: 26rpx;
  font-weight: bold;
  color: #4CAF50;
}
.task-stats-div {
  font-size: 20rpx;
  color: #CCC;
  margin: 0 2rpx;
}
.task-stats-total {
  font-size: 22rpx;
  color: #999;
}
.task-stats-rate {
  font-size: 20rpx;
  color: #5B3E96;
  font-weight: bold;
  margin-left: 8rpx;
  background: rgba(91,62,150,0.08);
  padding: 2rpx 10rpx;
  border-radius: 12rpx;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
}

.info-row:not(:last-child) {
  border-bottom: 1rpx solid #F8F8F8;
}

.label {
  font-size: 28rpx;
  color: #333;
}

.value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
}

.avatar-default {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #D4C5F0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

/* 宠物 */
.pet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pet-row:active {
  background: #F8F8F8;
  margin: 0 -24rpx;
  padding-left: 24rpx;
  padding-right: 24rpx;
  border-radius: 8rpx;
}

.pet-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pet-icon {
  font-size: 40rpx;
}

.pet-avatar-img {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(123, 94, 167, 0.08);
}

.pet-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pet-level {
  font-size: 24rpx;
  color: #333;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}

.card-arrow {
  font-size: 32rpx;
  color: #CCC;
}

/* 宠物展开详情 */
.pet-detail-expanded { padding-top: 12rpx; }
.pet-detail-row { display:flex; justify-content:space-between; align-items:center; padding:12rpx 0; border-bottom:1rpx solid #F5F5F5; }
.pet-detail-label { font-size:26rpx; color:#333; }
.pet-detail-value-row { display:flex; align-items:center; gap:16rpx; }
.pet-detail-value { font-size:26rpx; color:#333; font-weight:500; }
.view-stages-btn { font-size:24rpx; color:#ffffff; font-weight:600; padding:8rpx 20rpx; background:linear-gradient(135deg,#7B5EA7,#5B3E96); border-radius:24rpx; box-shadow:0 2rpx 8rpx rgba(91,62,150,0.25); }
.upgrade-bar { width:200rpx; height:12rpx; background:#F0F0F0; border-radius:6rpx; overflow:hidden; }
.upgrade-fill { height:100%; background:linear-gradient(90deg,#5B3E96,#D4C5F0); border-radius:6rpx; }
.upgrade-text { font-size:22rpx; color:#333; margin-left:12rpx; }
.ai-stats-divider { height:1rpx; background:#F0F0F0; margin:16rpx 0; }
.ai-stats-title { font-size:26rpx; color:#333; margin-bottom:12rpx; display:block; }
.ai-stats-grid { display:flex; gap:16rpx; }
.ai-stat-item { flex:1; text-align:center; background:#F9F9F9; border-radius:12rpx; padding:16rpx 0; }
.ai-stat-value { font-size:28rpx; font-weight:bold; color:#333; display:block; }
.ai-stat-label { font-size:22rpx; color:#333; }

/* 手表 */
.watch-unbind {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
}

.unbind-text {
  font-size: 28rpx;
  color: #333;
}

.bind-btn {
  padding: 12rpx 28rpx;
  background: #5B3E96;
  border-radius: 32rpx;
}

.bind-btn text {
  font-size: 26rpx;
  color: #fff;
  font-weight: bold;
}

.device-id {
  font-size: 22rpx;
  color: #333;
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 加载 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #333;
  font-size: 28rpx;
}

/* 删除区域 */
/* 任务管理 */
.task-empty { padding:24rpx 0; text-align:center; }
.task-empty-text { font-size:26rpx; color:#CCC; }

/* 日期分组 */
.task-group {
  margin-bottom: 12rpx;
}

.task-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 12rpx;
  background: #FAFAFA;
  border-radius: 12rpx;
}

.task-group-header--today {
  background: #FFF8E1;
}

.task-group-header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.task-group-date {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.task-group-header-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.task-group-progress {
  font-size: 24rpx;
  color: #333;
}

.task-group-all-done {
  font-size: 24rpx;
}

.task-group-arrow {
  font-size: 24rpx;
  color: #333;
  transition: transform 0.2s;
}

.task-group-arrow--open {
  transform: rotate(180deg);
}

/* 任务列表 Body */
.task-group-body {
  padding: 8rpx 0;
}

/* 任务卡片 */
.task-card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 12rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.task-card-item:last-child {
  border-bottom: none;
}

.task-card-item--done {
  background: #F9FFF9;
  border-radius: 8rpx;
}

.task-card-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  overflow: hidden;
}

.task-card-icon {
  font-size: 38rpx;
  flex-shrink: 0;
}

.task-card-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
  overflow: hidden;
}

.task-card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-card-reward {
  font-size: 24rpx;
  color: #333;
  margin-right: 16rpx;
}

.task-card-energy {
  font-size: 22rpx;
  color: #333;
}

.task-card-sub {
  display: flex;
  align-items: center;
}

.task-card-right {
  flex-shrink: 0;
  margin-left: 16rpx;
}

.task-card-checked {
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-card-check-icon {
  font-size: 32rpx;
}

.task-card-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.task-card-unchecked-text {
  font-size: 22rpx;
  color: #333;
  font-weight: 500;
  padding: 6rpx 12rpx;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  border-radius: 20rpx;
}

.task-card-delete-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFF0F0;
  border-radius: 50%;
  font-size: 24rpx;
}

.danger-zone {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.delete-btn {
  padding: 20rpx 60rpx;
  border: 2rpx solid #FF4444;
  border-radius: 40rpx;
}

.delete-btn-text {
  font-size: 28rpx;
  color: #FF4444;
}

.delete-hint {
  font-size: 22rpx;
  color: #CCC;
  text-align: center;
  max-width: 500rpx;
}

/* 自定义删除确认弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-box {
  width: 560rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx 36rpx 28rpx;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 16rpx;
}

.modal-content {
  font-size: 28rpx;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 28rpx;
  line-height: 1.6;
}

.modal-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0;
  margin-bottom: 24rpx;
}

.modal-checkbox-icon {
  font-size: 36rpx;
  color: #333;
  margin-right: 12rpx;
}

.modal-checkbox-text {
  font-size: 26rpx;
  color: #333;
}

.modal-buttons {
  display: flex;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: 500;
}

.modal-btn-cancel {
  background: #F5F5F5;
  color: #333;
}

.modal-btn-confirm {
  background: #FF4444;
  color: #fff;
}
</style>
