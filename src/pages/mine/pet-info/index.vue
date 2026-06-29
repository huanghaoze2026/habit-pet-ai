<template>
  <view class="page-pet-info">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="nav-back-icon">←</text>
      </view>
      <text class="nav-title">任务管理</text>
      <view class="nav-right" />
    </view>

    <!-- 空态 -->
    <view v-if="!store.currentChildId" class="empty-state">
      <text class="empty-icon">📭</text>
      <text class="empty-text">请先添加宝贝</text>
    </view>

    <!-- 加载中 -->
    <view v-else-if="isLoading" class="loading-state">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 无记录 -->
    <view v-else-if="groups.length === 0" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无任务记录</text>
      <text class="empty-hint">完成打卡后会在这里显示哦~</text>
    </view>

    <!-- 按日期分组的历史记录 -->
    <scroll-view v-else scroll-y class="history-list">
      <view v-for="group in groups" :key="group.date" class="date-group">
        <!-- 日期标题 -->
        <view class="date-header" :class="{ 'date-header--today': group.isToday }">
          <view class="date-header-left">
            <text class="date-label">{{ group.label }}</text>
            <text v-if="group.isToday" class="today-badge">今天</text>
          </view>
          <view class="date-header-right">
            <text class="date-progress" :class="{ 'date-progress--done': group.allDone }">
              {{ group.completedTasks }}/{{ group.totalTasks }}
            </text>
            <text v-if="group.allDone" class="all-done-icon">✅</text>
          </view>
        </view>

        <!-- 该天的任务列表 -->
        <view class="day-tasks">
          <view
            v-for="task in group.tasks"
            :key="task.id"
            class="history-task-card"
            :class="{ 'history-task-card--done': task.checkedIn }"
          >
            <view class="history-task-left">
              <text class="history-task-icon">{{ task.icon || '📌' }}</text>
              <view class="history-task-info">
                <text class="history-task-name">{{ task.title }}</text>
                <text v-if="task.checkedIn && task.checkinAt" class="history-task-time">
                  {{ formatTime(task.checkinAt) }}
                </text>
              </view>
            </view>
            <view class="history-task-right">
              <text class="history-task-energy">⚡ {{ task.energy || 0 }}</text>
              <view v-if="task.checkedIn" class="history-task-check">
                <text>✅</text>
              </view>
              <view v-else class="history-task-miss">
                <text>⏭</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部提示 -->
      <view class="history-footer">
        <text class="history-footer-text">显示最近 {{ days }} 天</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '@/services/api'
import { useChildStore } from '@/stores/child'

const store = useChildStore()
const isLoading = ref(false)
const days = ref(7)  // P57: 默认7天

interface HistoryTask {
  id: string
  title: string
  icon: string
  energy: number
  rewardContent: string
  needPhoto: boolean
  repeatType: string
  checkedIn: boolean
  checkinAt: string | null
  checkinImage: string | null
  checkinNote: string | null
}

interface DateGroup {
  date: string
  label: string
  isToday: boolean
  totalTasks: number
  completedTasks: number
  allDone: boolean
  tasks: HistoryTask[]
}

const groups = reactive<DateGroup[]>([])

function goBack() {
  uni.navigateBack()
}

function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr)
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  } catch {
    return ''
  }
}

async function loadHistory() {
  const childId = store.currentChildId
  if (!childId) return

  isLoading.value = true
  try {
    const res = await api.get<{ groups: DateGroup[] }>(
      `/task/history?childId=${encodeURIComponent(childId)}&days=${days.value}`
    )
    const data = res.data || { groups: [] }
    groups.splice(0, groups.length, ...(data.groups || []))
  } catch (e) {
    console.error('[pet-info] 加载任务历史失败:', e)
    groups.splice(0, groups.length)
  } finally {
    isLoading.value = false
  }
}

onShow(() => {
  store.fetchChildList(true).then(() => {
    loadHistory()
  })
})
</script>

<style scoped>
.page-pet-info {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 28rpx;
  padding-top: calc(24rpx + env(safe-area-inset-top));
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  flex-shrink: 0;
}
.nav-back {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(91,62,150,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-back:active { background: rgba(91,62,150,0.2); }
.nav-back-icon {
  font-size: 32rpx;
  color: #5B3E96;
  font-weight: bold;
}
.nav-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.nav-right {
  width: 56rpx;
}

/* 空态 & 加载 */
.empty-state, .loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 60rpx;
}
.empty-icon, .loading-icon {
  font-size: 80rpx;
}
.empty-text {
  font-size: 28rpx;
  color: #666;
}
.empty-hint {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}
.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 历史列表 */
.history-list {
  flex: 1;
  padding: 16rpx 24rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

/* 日期分组 */
.date-group {
  margin-bottom: 28rpx;
}

/* 日期标题 */
.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 20rpx;
  margin-bottom: 12rpx;
  background: rgba(255,255,255,0.5);
  border-radius: 16rpx;
  backdrop-filter: blur(6px);
}
.date-header--today {
  background: rgba(91,62,150,0.08);
  border: 1rpx solid rgba(91,62,150,0.15);
}
.date-header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.date-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}
.today-badge {
  font-size: 20rpx;
  color: #fff;
  background: #5B3E96;
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
}
.date-header-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.date-progress {
  font-size: 24rpx;
  color: #999;
}
.date-progress--done {
  color: #4CAF50;
  font-weight: bold;
}
.all-done-icon {
  font-size: 24rpx;
}

/* 每日任务卡片 */
.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.history-task-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 14rpx;
  padding: 24rpx 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  transition: all 0.2s;
}
.history-task-card--done {
  background: rgba(76,175,80,0.04);
  border-left: 4rpx solid #4CAF50;
}
.history-task-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}
.history-task-icon {
  font-size: 36rpx;
}
.history-task-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}
.history-task-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-task-time {
  font-size: 22rpx;
  color: #999;
}
.history-task-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}
.history-task-energy {
  font-size: 22rpx;
  color: #666;
  background: #F5F0FF;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}
.history-task-check {
  font-size: 28rpx;
}
.history-task-miss {
  font-size: 22rpx;
  opacity: 0.3;
}

/* 底部 */
.history-footer {
  padding: 20rpx 0 40rpx;
  display: flex;
  justify-content: center;
}
.history-footer-text {
  font-size: 22rpx;
  color: #ccc;
}
</style>
