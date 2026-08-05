<template>
  <view class="watch-page">
    <!-- 加载态 -->
    <view v-if="isLoading" class="loading-state">
      <view class="loading-spinner" />
    </view>

    <!-- 内容 -->
    <template v-else>
      <!-- 当前绑定状态 -->
      <view v-if="currentWatch" class="current-card">
        <text class="current-icon">⌚</text>
        <view class="current-info">
          <text class="current-label">当前手表</text>
          <text class="current-value">{{ watchTypeName }}</text>
          <text v-if="currentWatch.watchBindStatus === 'bound'" class="current-status bound">已绑定</text>
          <text v-else class="current-status pending">绑定中</text>
        </view>
      </view>

      <!-- 手表类型选择 -->
      <view class="form-card">
        <text class="section-title">选择手表类型</text>
        <view class="watch-list">
          <view
            v-for="w in watchTypes"
            :key="w.value"
            class="watch-option"
            :class="{ selected: selectedWatch === w.value }"
            @tap="selectedWatch = w.value"
          >
            <text class="watch-icon">{{ w.icon }}</text>
            <view class="watch-info">
              <text class="watch-name">{{ w.name }}</text>
              <text class="watch-desc">{{ w.desc }}</text>
            </view>
            <text v-if="selectedWatch === w.value" class="check-mark">✓</text>
          </view>
        </view>
      </view>

      <!-- 设备ID（选填） -->
      <view class="form-card">
        <text class="section-title">设备ID</text>
        <input
          v-model="deviceId"
          class="form-input"
          placeholder="请输入手表设备ID（选填）"
          placeholder-style="color:#B8A8D0;"
          maxlength="50"
        />
      </view>

      <!-- 绑定引导 -->
      <view class="guide-card">
        <text class="guide-title">💡 绑定指南</text>
        <view class="guide-steps">
          <text class="guide-step">1. 在孩子的手表上打开「设置」</text>
          <text class="guide-step">2. 找到「设备信息」查看设备ID</text>
          <text class="guide-step">3. 输入设备ID后点击「绑定」</text>
          <text class="guide-step">4. 手表端确认后即绑定成功</text>
        </view>
      </view>

      <!-- 执行绑定 -->
      <view class="submit-section">
        <button
          class="submit-btn"
          :disabled="!selectedWatch || isSubmitting"
          :class="{ 'btn-disabled': !selectedWatch || isSubmitting }"
          @tap="handleBind"
          hover-class="btn-hover"
        >
          {{ isSubmitting ? '绑定中...' : '确认绑定' }}
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getChildDetail, bindWatch } from '@/services/parent';

const isLoading = ref(true);
const isSubmitting = ref(false);
const selectedWatch = ref('');
const deviceId = ref('');

const currentWatch = ref<{ watchType?: string; watchBindStatus?: string } | null>(null);

const watchTypes = [
  { value: 'xiaotiancai', name: '小天才', desc: '小天才电话手表系列', icon: '⌚' },
  { value: 'huawei', name: '华为', desc: '华为儿童手表系列', icon: '⌚' },
  { value: 'mitu', name: '米兔', desc: '小米米兔儿童手表系列', icon: '⌚' },
];

const watchTypeName = computed(() => {
  const type = currentWatch.value?.watchType;
  const found = watchTypes.find(w => w.value === type);
  return found ? found.name : (type || '未知');
});

function getChildIdFromUrl(): string {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] as { options?: { id?: string } };
  return current.options?.id || '';
}

onMounted(async () => {
  const childId = getChildIdFromUrl();
  if (!childId) {
    uni.showToast({ title: '参数错误', icon: 'none' });
    uni.navigateBack();
    return;
  }
  try {
    const detail = await getChildDetail(childId);
    currentWatch.value = {
      watchType: detail.childInfo.watchType,
      watchBindStatus: detail.childInfo.watchBindStatus,
    };
  } catch (e) {
    console.error('[WatchPage] 加载失败:', e);
    uni.showToast({ title: '加载失败，请重试', icon: 'none' });
  }
  isLoading.value = false;
});

async function handleBind(): Promise<void> {
  if (!selectedWatch.value || isSubmitting.value) return;

  isSubmitting.value = true;
  const childId = getChildIdFromUrl();
  try {
    await bindWatch(childId, {
      watchType: selectedWatch.value,
      watchDeviceId: deviceId.value || undefined,
    });
    uni.showToast({ title: '绑定成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch (e: unknown) {
    console.error('[WatchPage] 绑定失败:', e);
    uni.showToast({ title: '绑定失败，请重试', icon: 'none' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.watch-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 300rpx;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid #e8e8e8;
  border-top-color: #4caf50;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

// ===== 当前绑定 =====
.current-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.current-icon {
  font-size: 64rpx;
}

.current-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
}

.current-label {
  font-size: 22rpx;
  color: #333;
}

.current-value {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.current-status {
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  align-self: flex-start;
}

.bound {
  color: #4caf50;
  background: #e8f5e9;
}

.pending {
  color: #333;
  background: #f0ebff;
}

// ===== 表单卡片 =====
.form-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

// ===== 手表类型 =====
.watch-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.watch-option {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.selected {
    background: #e8f5e9;
    border-color: #4caf50;
  }
}

.watch-icon {
  font-size: 40rpx;
}

.watch-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.watch-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.watch-desc {
  font-size: 22rpx;
  color: #333;
}

.check-mark {
  font-size: 32rpx;
  color: #4caf50;
  font-weight: 700;
}

// ===== 输入 =====
.form-input {
  width: 100%;
  height: 88rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;
}

// ===== 引导 =====
.guide-card {
  background: rgba(76, 175, 80, 0.06);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.guide-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
  display: block;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.guide-step {
  font-size: 24rpx;
  color: #333;
  line-height: 1.5;
}

// ===== 提交 =====
.submit-section {
  padding: 48rpx 0;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 6rpx 20rpx rgba(76, 175, 80, 0.25);
  &::after { border: none; }
}

.btn-disabled { opacity: 0.5; pointer-events: none; }
.btn-hover { opacity: 0.85; transform: scale(0.98); }
</style>
