<template>
  <view class="bind-page">
    <!-- 头部 -->
    <view class="bind-header">
      <view class="header-icon">👨‍👩‍👧</view>
      <text class="header-title">家长绑定</text>
      <text class="header-desc">输入孩子的宠物ID，查看成长报告</text>
    </view>

    <!-- 已绑定状态 -->
    <view v-if="isBound" class="bound-section">
      <view class="bound-card">
        <view class="bound-icon">✅</view>
        <view class="bound-info">
          <text class="bound-label">已绑定孩子</text>
          <text class="bound-id">{{ boundChildId }}</text>
        </view>
      </view>
      <button class="action-btn primary" @tap="goToReport" hover-class="btn-hover">
        查看报告
      </button>
      <button class="action-btn secondary" @tap="handleUnbind" hover-class="btn-hover">
        更换绑定
      </button>
    </view>

    <!-- 未绑定状态：输入绑定 -->
    <view v-else class="input-section">
      <view class="input-card">
        <text class="input-label">宠物ID</text>
        <input
          v-model="childId"
          class="child-input"
          placeholder="请输入孩子的宠物ID"
          placeholder-style="color:#B8A8D0;"
          maxlength="50"
          :focus="true"
        />
        <text v-if="inputError" class="input-error">{{ inputError }}</text>
      </view>

      <button
        class="action-btn primary"
        :disabled="!canSubmit"
        :class="{ 'btn-disabled': !canSubmit }"
        @tap="handleBind"
        hover-class="btn-hover"
      >
        {{ isVerifying ? '验证中...' : '查看报告' }}
      </button>

      <view class="help-tip">
        <text class="help-icon">💡</text>
        <text class="help-text">
          宠物ID可以在孩子的「我的」页面中找到，让孩子告诉你吧～
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const STORAGE_KEY = 'parent_childId';

const childId = ref('');
const inputError = ref('');
const isVerifying = ref(false);
const boundChildId = ref('');
const isBound = ref(false);

// ============ 计算属性 ============
const canSubmit = computed(() => {
  return childId.value.trim().length > 0 && !isVerifying.value;
});

// ============ 生命周期 ============
onMounted(() => {
  const saved = loadBoundChildId();
  if (saved) {
    isBound.value = true;
    boundChildId.value = saved;
  }
});

// ============ 方法 ============

function loadBoundChildId(): string {
  try {
    return uni.getStorageSync(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveBoundChildId(id: string): void {
  uni.setStorageSync(STORAGE_KEY, id);
}

function clearBoundChildId(): void {
  uni.removeStorageSync(STORAGE_KEY);
}

/**
 * 绑定并跳转
 */
function handleBind(): void {
  const trimmed = childId.value.trim();

  // 校验
  if (!trimmed) {
    inputError.value = '请输入宠物ID';
    return;
  }
  if (trimmed.length < 3) {
    inputError.value = '宠物ID格式不正确，至少3个字符';
    return;
  }

  inputError.value = '';
  isVerifying.value = true;

  // 存储并跳转
  saveBoundChildId(trimmed);
  isBound.value = true;
  boundChildId.value = trimmed;

  // 短暂延迟后跳转
  setTimeout(() => {
    isVerifying.value = false;
    goToReport();
  }, 400);
}

/**
 * 跳转到报告页
 */
function goToReport(): void {
  uni.navigateTo({ url: '/pages/parent/report/index' });
}

/**
 * 更换绑定
 */
function handleUnbind(): void {
  uni.showModal({
    title: '更换绑定',
    content: '确定要更换绑定的孩子吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        clearBoundChildId();
        isBound.value = false;
        boundChildId.value = '';
        childId.value = '';
        inputError.value = '';
      }
    },
  });
}
</script>

<style lang="scss" scoped>
.bind-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #e8f5e9 0%, #f5f5f5 40%);
  padding: 48rpx 32rpx;
}

// ===== 头部 =====
.bind-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 60rpx 0 48rpx;
}

.header-icon {
  font-size: 80rpx;
}

.header-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}

.header-desc {
  font-size: 26rpx;
  color: #888;
  text-align: center;
  line-height: 1.6;
  padding: 0 40rpx;
}

// ===== 已绑定 =====
.bound-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 24rpx;
}

.bound-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.bound-icon {
  font-size: 56rpx;
}

.bound-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.bound-label {
  font-size: 26rpx;
  color: #333;
}

.bound-id {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  background: #f5f5f5;
  padding: 8rpx 24rpx;
  border-radius: 12rpx;
}

// ===== 输入区域 =====
.input-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 24rpx;
}

.input-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.input-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 20rpx;
  display: block;
}

.child-input {
  width: 100%;
  height: 88rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  color: #333;
  border: 2rpx solid transparent;
  transition: border-color 0.3s;

  &:focus {
    border-color: #4caf50;
  }
}

.input-error {
  font-size: 22rpx;
  color: #e57373;
  margin-top: 12rpx;
  display: block;
}

// ===== 按钮 =====
.action-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;

  &::after { border: none; }
}

.action-btn.primary {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  color: #ffffff;
  box-shadow: 0 6rpx 20rpx rgba(76, 175, 80, 0.25);
}

.action-btn.secondary {
  background: #ffffff;
  color: #4caf50;
  border: 2rpx solid #c8e6c9;
}

.btn-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.btn-hover {
  opacity: 0.85;
  transform: scale(0.98);
}

// ===== 帮助提示 =====
.help-tip {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  background: rgba(76, 175, 80, 0.06);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-top: 8rpx;
}

.help-icon {
  font-size: 32rpx;
  flex-shrink: 0;
  margin-top: 2rpx;
}

.help-text {
  font-size: 24rpx;
  color: #888;
  line-height: 1.6;
}
</style>
