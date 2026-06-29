<template>
  <view class="report-page">
    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading-state">
      <view class="loading-spinner" />
      <text class="loading-text">加载报告中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="isError" class="error-state">
      <text class="error-icon">😵</text>
      <text class="error-text">报告加载失败</text>
      <text class="error-detail">{{ errorMessage }}</text>
      <button class="retry-btn" @tap="fetchReport">重新加载</button>
    </view>

    <!-- 报告内容 -->
    <template v-else-if="reportData">
      <!-- 宠物状态卡片 -->
      <view class="pet-status-card">
        <view class="card-header">
          <text class="card-title">🐉 宠物状态</text>
        </view>
        <view class="pet-info-row">
          <view class="pet-avatar-area">
            <!-- 火焰情绪指示器 -->
            <view class="flame-mood" :class="'flame-' + flameIntensity">
              <view class="flame-core" />
              <view v-for="i in 4" :key="i" class="flame-layer" :style="getFlameStyle(i)" />
            </view>
            <text class="pet-emoji">{{ stageEmoji }}</text>
          </view>
          <view class="pet-details">
            <view class="detail-row">
              <text class="detail-label">名字</text>
              <text class="detail-value">{{ reportData.petName }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">阶段</text>
              <text class="detail-value stage-badge">{{ stageLabel }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">等级</text>
              <text class="detail-value">Lv.{{ reportData.level }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">心情</text>
              <view class="mood-display">
                <text class="mood-value">{{ reportData.mood }}</text>
                <text class="mood-unit">/100</text>
              </view>
            </view>
          </view>
        </view>
        <!-- 心情进度条 -->
        <view class="mood-bar-area">
          <view class="mood-bar">
            <view
              class="mood-fill"
              :class="'mood-' + moodLevel"
              :style="{ width: reportData.mood + '%' }"
            />
          </view>
        </view>
      </view>

      <!-- 今日打卡概览 -->
      <view class="report-card">
        <view class="card-header">
          <text class="card-title">📊 今日打卡概览</text>
        </view>
        <view class="overview-row">
          <!-- 环形进度 -->
          <view class="ring-progress-container">
            <svg class="ring-svg" viewBox="0 0 120 120">
              <circle class="ring-bg" cx="60" cy="60" r="50" fill="none" stroke="#f0f0f0" stroke-width="10" />
              <circle
                class="ring-fill"
                cx="60" cy="60" r="50"
                fill="none"
                stroke="#4caf50"
                stroke-width="10"
                stroke-linecap="round"
                :stroke-dasharray="ringCircumference"
                :stroke-dashoffset="ringOffset"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <view class="ring-center">
              <text class="ring-done">{{ reportData.todayCheckins }}</text>
              <text class="ring-total">/{{ reportData.totalTasks }}</text>
            </view>
          </view>
          <!-- 统计文字 -->
          <view class="overview-stats">
            <view class="stat-text">
              <text class="stat-label">已完成</text>
              <text class="stat-number">{{ reportData.todayCheckins }}/{{ reportData.totalTasks }}</text>
            </view>
            <view class="stat-text">
              <text class="stat-label">完成率</text>
              <text class="stat-number">{{ checkinRatePercent }}%</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 连续打卡天数 -->
      <view class="report-card streak-card">
        <view class="streak-content">
          <text class="streak-icon">🔥</text>
          <view class="streak-info">
            <text class="streak-number">{{ reportData.streakDays }}</text>
            <text class="streak-unit">天连续打卡</text>
          </view>
        </view>
        <view class="streak-message">
          <text>{{ streakMessage }}</text>
        </view>
      </view>

      <!-- 近7天打卡日历 -->
      <view class="report-card">
        <view class="card-header">
          <text class="card-title">📅 近7天打卡记录</text>
        </view>
        <view class="calendar-grid">
          <view
            v-for="day in calendarDays"
            :key="day.date"
            class="calendar-day"
            :class="{ 'day-today': day.isToday }"
          >
            <text class="day-label">{{ day.weekday }}</text>
            <text class="day-date">{{ day.dayNum }}</text>
            <text class="day-marker" :class="day.allDone ? 'marker-done' : 'marker-miss'">
              {{ day.allDone ? '✅' : '❌' }}
            </text>
            <view class="day-tasks">
              <text
                v-for="(task, ti) in day.tasks"
                :key="ti"
                class="day-task"
                :class="task.completed ? 'task-done' : 'task-miss'"
              >
                {{ task.completed ? '✓' : '✗' }} {{ task.taskName }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 返回按钮 -->
      <view class="back-section">
        <button class="back-btn" @tap="goBack" hover-class="btn-hover">
          ← 返回绑定页
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getReport, type ParentReportData, type ParentCheckinRecord } from '@/services/parent';

// ============ 状态 ============
const isLoading = ref(true);
const isError = ref(false);
const errorMessage = ref('');
const reportData = ref<ParentReportData | null>(null);

// ============ 常量 ============
const ringCircumference = 2 * Math.PI * 50; // r=50

// ============ 计算属性 ============

const checkinRatePercent = computed(() => {
  if (!reportData.value) return 0;
  return Math.round(reportData.value.checkinRate * 100);
});

const moodLevel = computed(() => {
  if (!reportData.value) return 'normal';
  const m = reportData.value.mood;
  if (m >= 90) return 'excellent';
  if (m >= 70) return 'good';
  if (m >= 50) return 'normal';
  if (m >= 30) return 'low';
  return 'critical';
});

const flameIntensity = computed(() => {
  if (!reportData.value) return 'medium';
  const m = reportData.value.mood;
  if (m >= 80) return 'high';
  if (m >= 40) return 'medium';
  return 'low';
});

const ringOffset = computed(() => {
  if (!reportData.value) return ringCircumference;
  const rate = reportData.value.totalTasks > 0
    ? reportData.value.todayCheckins / reportData.value.totalTasks
    : 0;
  return ringCircumference * (1 - Math.min(1, rate));
});

const stageEmoji = computed(() => {
  if (!reportData.value) return '🥚';
  const map: Record<string, string> = {
    egg: '🥚',
    baby: '🔥',
    growing: '🐉',
    evolved: '🐲',
    ultimate: '✨',
  };
  return map[reportData.value.petStage] || '🔥';
});

const stageLabel = computed(() => {
  if (!reportData.value) return '';
  const map: Record<string, string> = {
    egg: '🥚 蛋仔期',
    baby: '🔥 幼体期',
    growing: '🐉 成长期',
    evolved: '🐲 进化期',
    ultimate: '✨ 究极期',
  };
  return map[reportData.value.petStage] || reportData.value.petStage;
});

const streakMessage = computed(() => {
  const days = reportData.value?.streakDays || 0;
  if (days >= 30) return '太厉害了！坚持了一个月！🔥🔥🔥';
  if (days >= 14) return '坚持两周了，继续加油！🔥🔥';
  if (days >= 7) return '已经坚持一周，很棒！🔥';
  if (days >= 3) return '好的开始，继续保持！';
  return '刚刚起步，加油！';
});

/** 按日期分组打卡记录 */
const calendarDays = computed(() => {
  if (!reportData.value) return [];

  const checkins = reportData.value.recentCheckins || [];
  const byDate = new Map<string, ParentCheckinRecord[]>();

  for (const c of checkins) {
    const existing = byDate.get(c.date) || [];
    existing.push(c);
    byDate.set(c.date, existing);
  }

  const today = new Date().toISOString().split('T')[0];
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  const days: Array<{
    date: string;
    weekday: string;
    dayNum: string;
    allDone: boolean;
    isToday: boolean;
    tasks: ParentCheckinRecord[];
  }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const tasks = byDate.get(dateStr) || [];
    const allDone = tasks.length > 0 ? tasks.every((t) => t.completed) : false;

    days.push({
      date: dateStr,
      weekday: weekdays[d.getDay()],
      dayNum: String(d.getDate()),
      allDone: tasks.length > 0 && allDone,
      isToday: dateStr === today,
      tasks,
    });
  }

  return days;
});

// ============ 方法 ============

function getFlameStyle(index: number): Record<string, string> {
  const delay = (index * 0.3).toFixed(2);
  const scale = (0.6 + index * 0.15).toFixed(2);
  return {
    animationDelay: `${delay}s`,
    '--flame-scale': scale,
  };
}

async function fetchReport(): Promise<void> {
  isLoading.value = true;
  isError.value = false;
  errorMessage.value = '';

  const childId = getChildId();
  if (!childId) {
    isError.value = true;
    errorMessage.value = '未找到绑定的孩子ID';
    isLoading.value = false;
    return;
  }

  try {
    const data = await getReport(childId);
    reportData.value = data;
  } catch (e: unknown) {
    console.error('[ParentReport] 获取报告失败:', e);
    isError.value = true;
    const err = e as { message?: string };
    errorMessage.value = err.message || '网络异常，请稍后重试';
  } finally {
    isLoading.value = false;
  }
}

function getChildId(): string {
  try {
    return uni.getStorageSync('parent_childId') || '';
  } catch {
    return '';
  }
}

function goBack(): void {
  uni.navigateBack();
}

// ============ 生命周期 ============
onMounted(() => {
  fetchReport();
});
</script>

<style lang="scss" scoped>
.report-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #e8f5e9 0%, #f5f5f5 30%);
  padding: 24rpx;
}

// ===== 加载态 =====
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 300rpx;
  gap: 24rpx;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid #e8f5e9;
  border-top-color: #4caf50;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #333;
}

// ===== 错误态 =====
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 250rpx;
  gap: 16rpx;
}

.error-icon {
  font-size: 100rpx;
}

.error-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.error-detail {
  font-size: 24rpx;
  color: #333;
  margin-bottom: 24rpx;
}

.retry-btn {
  padding: 16rpx 60rpx;
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  border-radius: 40rpx;
  border: none;

  &::after { border: none; }
}

// ===== 卡片通用 =====
.report-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
}

// ===== 宠物状态卡片 =====
.pet-status-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.pet-info-row {
  display: flex;
  align-items: center;
  gap: 28rpx;
  margin-bottom: 24rpx;
}

.pet-avatar-area {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pet-emoji {
  font-size: 80rpx;
  z-index: 2;
  position: relative;
}

// 火焰情绪动画
.flame-mood {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100rpx;
  height: 60rpx;
  z-index: 1;
}

.flame-core {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24rpx;
  height: 24rpx;
  background: radial-gradient(circle, #5B3E96, #6D28D9);
  border-radius: 50%;
  z-index: 2;
}

.flame-layer {
  position: absolute;
  bottom: 8rpx;
  left: 50%;
  width: 20rpx;
  height: 20rpx;
  background: radial-gradient(circle, rgba(255, 152, 0, 0.8), rgba(255, 87, 34, 0.4));
  border-radius: 50%;
  transform-origin: center bottom;
  animation: flameRise 1.5s ease-in-out infinite;
  animation-delay: var(--flame-delay, 0s);
}

@keyframes flameRise {
  0%, 100% {
    opacity: 0.3;
    transform: translateX(-50%) translateY(0) scale(0.6);
  }
  40% {
    opacity: 0.8;
    transform: translateX(-50%) translateY(-16rpx) scale(var(--flame-scale, 1));
  }
  70% {
    opacity: 0.5;
    transform: translateX(-50%) translateY(-8rpx) scale(0.8);
  }
}

// 高强度火焰
.flame-high .flame-core {
  background: radial-gradient(circle, #ff6d00, #ff3d00);
  box-shadow: 0 0 20rpx rgba(255, 61, 0, 0.5);
}

.flame-high .flame-layer {
  background: radial-gradient(circle, rgba(255, 109, 0, 0.9), rgba(255, 61, 0, 0.5));
}

// 低强度火焰
.flame-low .flame-core {
  background: radial-gradient(circle, #ffab7a, #ff8a65);
}

.flame-low .flame-layer {
  background: radial-gradient(circle, rgba(255, 171, 122, 0.6), rgba(255, 138, 101, 0.3));
}

.pet-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.detail-label {
  font-size: 24rpx;
  color: #333;
  width: 64rpx;
  flex-shrink: 0;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.stage-badge {
  background: linear-gradient(135deg, #5B3E96, #D4C5F0);
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
  font-weight: 600;
}

.mood-display {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.mood-value {
  font-size: 36rpx;
  font-weight: 800;
  color: #333;
}

.mood-unit {
  font-size: 22rpx;
  color: #B8A8D0;
}

.mood-bar-area {
  margin-top: 8rpx;
}

.mood-bar {
  width: 100%;
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
}

.mood-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.6s ease;
}

.mood-excellent { background: linear-gradient(90deg, #ff6d00, #ffab00); }
.mood-good { background: linear-gradient(90deg, #5B3E96, #D4C5F0); }
.mood-normal { background: linear-gradient(90deg, #D4C5F0, #ffcc80); }
.mood-low { background: linear-gradient(90deg, #ff8a65, #ffab91); }
.mood-critical { background: linear-gradient(90deg, #ef5350, #e57373); }

// ===== 环形进度 =====
.overview-row {
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.ring-progress-container {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  flex-shrink: 0;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

.ring-fill {
  transition: stroke-dashoffset 0.8s ease;
}

.ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: baseline;
  gap: 2rpx;
}

.ring-done {
  font-size: 36rpx;
  font-weight: 800;
  color: #4caf50;
}

.ring-total {
  font-size: 22rpx;
  color: #333;
}

.overview-stats {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.stat-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.stat-label {
  font-size: 22rpx;
  color: #333;
}

.stat-number {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

// ===== 连续打卡 =====
.streak-card {
  background: linear-gradient(135deg, #f0ebff, #e9d5ff);
  border: 2rpx solid #ffcc80;
}

.streak-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  margin-bottom: 12rpx;
}

.streak-icon {
  font-size: 56rpx;
  animation: flamePulse 1.5s ease-in-out infinite;
}

@keyframes flamePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.streak-info {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.streak-number {
  font-size: 56rpx;
  font-weight: 900;
  color: #e65100;
  line-height: 1;
}

.streak-unit {
  font-size: 28rpx;
  color: #e65100;
  font-weight: 500;
}

.streak-message {
  text-align: center;
  font-size: 24rpx;
  color: #bf360c;
}

// ===== 日历 =====
.calendar-grid {
  display: flex;
  gap: 8rpx;
  overflow-x: auto;
  padding-bottom: 8rpx;
}

.calendar-day {
  flex-shrink: 0;
  width: 140rpx;
  padding: 16rpx 12rpx;
  background: #fafafa;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  border: 2rpx solid transparent;
}

.day-today {
  border-color: #4caf50;
  background: #f1f8e9;
}

.day-label {
  font-size: 20rpx;
  color: #333;
}

.day-date {
  font-size: 28rpx;
  font-weight: 700;
  color: #333;
}

.day-marker {
  font-size: 28rpx;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  margin-top: 4rpx;
}

.day-task {
  font-size: 18rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120rpx;
}

.task-done { color: #4caf50; }
.task-miss { color: #e0e0e0; }

// ===== 返回 =====
.back-section {
  padding: 24rpx 0 48rpx;
}

.back-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: #ffffff;
  color: #4caf50;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 44rpx;
  border: 2rpx solid #c8e6c9;

  &::after { border: none; }
}

.btn-hover {
  opacity: 0.85;
}
</style>
