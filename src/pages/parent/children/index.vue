<template>
  <view class="children-page">
    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading-state">
      <view class="loading-spinner" />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空态引导 -->
    <view v-else-if="children.length === 0" class="empty-state">
      <text class="empty-icon">👨‍👩‍👧</text>
      <text class="empty-title">还没有添加宝贝</text>
      <text class="empty-desc">添加孩子的信息，随时关注TA的成长</text>
      <button class="add-first-btn" @tap="goAdd" hover-class="btn-hover">
        + 添加第一个宝贝
      </button>
    </view>

    <!-- 宝贝列表 -->
    <template v-else>
      <!-- 顶部摘要 -->
      <view class="summary-bar">
        <text class="summary-text">共 {{ children.length }} 个宝贝</text>
      </view>

      <!-- 宝贝卡片列表 -->
      <view
        v-for="child in children"
        :key="child.id"
        class="child-card"
        @tap="goDetail(child.id)"
      >
        <view class="card-left">
          <view class="child-avatar">
            <image
              v-if="child.avatar"
              :src="child.avatar"
              class="avatar-img"
              mode="aspectFill"
            />
            <text v-else class="avatar-placeholder">{{ child.gender === 'female' ? '👧' : '👦' }}</text>
          </view>
          <view class="child-info">
            <text class="child-name">{{ child.nickname }}</text>
            <view class="child-tags">
              <text v-if="child.gender" class="tag">{{ child.gender === 'female' ? '女孩' : '男孩' }}</text>
              <text v-if="child.age" class="tag">{{ child.age }}岁</text>
              <text v-if="child.mood !== undefined" class="tag mood-tag" :class="moodClass(child.mood)">
                {{ moodEmoji(child.mood) }} {{ child.mood }}
              </text>
            </view>
          </view>
        </view>
        <view class="card-right">
          <view v-if="child.petStage" class="pet-badge">
            <text class="pet-name">{{ child.petName || '宠物' }}</text>
            <text class="pet-stage">{{ stageLabel(child.petStage) }}</text>
          </view>
          <view v-if="child.todayCompleted !== undefined" class="today-badge">
            <text class="today-label">今日打卡</text>
            <text class="today-count">{{ child.todayCompleted }}</text>
          </view>
        </view>
        <text class="card-arrow">›</text>
      </view>

      <!-- 添加按钮 -->
      <view class="add-section">
        <button class="add-btn" @tap="goAdd" hover-class="btn-hover">
          + 添加宝贝
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getChildren, type ChildListItem } from '@/services/parent';

const isLoading = ref(true);
const children = ref<ChildListItem[]>([]);

onMounted(() => {
  fetchChildren();
});

async function fetchChildren(): Promise<void> {
  isLoading.value = true;
  try {
    children.value = await getChildren();
  } catch (e) {
    console.error('[ChildrenPage] 获取列表失败:', e);
    uni.showToast({ title: '加载失败，请重试', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
}

function moodClass(mood: number): string {
  if (mood >= 70) return 'mood-good';
  if (mood >= 40) return 'mood-normal';
  return 'mood-low';
}

function moodEmoji(mood: number): string {
  if (mood >= 70) return '😊';
  if (mood >= 40) return '😐';
  return '😟';
}

function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    egg: '蛋仔期',
    baby: '幼体期',
    growing: '成长期',
    evolved: '进化期',
    ultimate: '究极期',
  };
  return map[stage] || stage;
}

function goAdd(): void {
  uni.navigateTo({ url: '/pages/parent/children/add' });
}

function goDetail(id: string): void {
  uni.navigateTo({ url: `/pages/parent/children/detail?id=${id}` });
}
</script>

<style lang="scss" scoped>
.children-page {
  min-height: 100vh;
  background: #f5f5f5;
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
  border: 6rpx solid #e8e8e8;
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

// ===== 空态 =====
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  gap: 16rpx;
}

.empty-icon {
  font-size: 120rpx;
}

.empty-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.empty-desc {
  font-size: 26rpx;
  color: #333;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 32rpx;
}

.add-first-btn {
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 44rpx;
  border: none;
  box-shadow: 0 4rpx 16rpx rgba(76, 175, 80, 0.25);

  &::after { border: none; }
}

.btn-hover {
  opacity: 0.85;
}

// ===== 摘要栏 =====
.summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
  padding: 0 8rpx;
}

.summary-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

// ===== 宝贝卡片 =====
.child-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  position: relative;

  &:active {
    background: #fafafa;
  }
}

.card-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.child-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  font-size: 48rpx;
}

.child-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.child-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.child-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  color: #333;
}

.mood-tag {
  background: #f0ebff;
  color: #e65100;
}

.mood-good {
  background: #e8f5e9;
  color: #2e7d32;
}

.mood-low {
  background: #ffebee;
  color: #c62828;
}

.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  margin-right: 30rpx;
}

.pet-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2rpx;
}

.pet-name {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.pet-stage {
  font-size: 20rpx;
  color: #333;
}

.today-badge {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.today-label {
  font-size: 20rpx;
  color: #333;
}

.today-count {
  font-size: 24rpx;
  font-weight: 700;
  color: #4caf50;
}

.card-arrow {
  position: absolute;
  right: 28rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40rpx;
  color: #B8A8D0;
  font-weight: 300;
}

// ===== 添加按钮区域 =====
.add-section {
  padding: 32rpx 0 48rpx;
}

.add-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  background: #ffffff;
  color: #4caf50;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: 2rpx dashed #c8e6c9;

  &::after { border: none; }
}
</style>
