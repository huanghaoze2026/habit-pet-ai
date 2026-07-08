<template>
  <view class="edit-page">
    <!-- 加载态 -->
    <view v-if="isLoading" class="loading-state">
      <view class="loading-spinner" />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 表单 -->
    <template v-else>
      <view class="form-card">
        <!-- 头像 -->
        <view class="form-item">
          <text class="form-label">头像</text>
          <view class="avatar-upload-area">
            <view class="avatar-preview-big" @click="previewAvatar">
              <image
                v-if="avatarUrl"
                :src="avatarUrl"
                class="avatar-preview-img"
                mode="aspectFill"
              />
              <view v-else class="avatar-preview-default">
                <text>{{ defaultGenderEmoji }}</text>
              </view>
            </view>
            <view class="avatar-picker-btn" @click="chooseAvatar">
              <text>{{ avatarUrl && !isNewAvatar ? '更换头像' : '选择头像' }}</text>
            </view>
          </view>
        </view>

        <!-- 昵称 -->
        <view class="form-item">
          <text class="form-label">昵称 <text class="required">*</text></text>
          <input
            v-model="form.nickname"
            class="form-input"
            placeholder="请输入昵称"
            maxlength="20"
          />
        </view>

        <!-- 性别 -->
        <view class="form-item">
          <text class="form-label">性别</text>
          <view class="gender-picker">
            <view
              class="gender-option"
              :class="{ selected: form.gender === 'male' }"
              @tap="form.gender = 'male'"
            >
              <text class="gender-emoji">👦</text>
              <text class="gender-text">男孩</text>
            </view>
            <view
              class="gender-option"
              :class="{ selected: form.gender === 'female' }"
              @tap="form.gender = 'female'"
            >
              <text class="gender-emoji">👧</text>
              <text class="gender-text">女孩</text>
            </view>
          </view>
        </view>

        <!-- 年龄 -->
        <view class="form-item">
          <text class="form-label">年龄</text>
          <view class="age-picker">
            <input
              v-model="ageStr"
              class="form-input small"
              type="number"
              placeholder="0-18"
              maxlength="2"
            />
            <text class="age-unit">岁</text>
          </view>
        </view>

        <!-- 年级 -->
        <view class="form-item">
          <text class="form-label">年级</text>
          <picker
            :value="gradeIndex"
            :range="gradeOptions"
            @change="onGradeChange"
          >
            <view class="picker-box" :class="{ placeholder: !form.grade }">
              <text>{{ form.grade || '请选择年级' }}</text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 提交 -->
      <view class="submit-section">
        <button
          class="submit-btn"
          :disabled="!canSubmit || isSubmitting"
          :class="{ 'btn-disabled': !canSubmit || isSubmitting }"
          @tap="handleSubmit"
          hover-class="btn-hover"
        >
          {{ isSubmitting ? '保存中...' : '保存修改' }}
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { getChildDetail, updateChild, type UpdateChildParams } from '@/services/parent';
import { BASE_URL } from '@/services/api';

const isLoading = ref(true);
const isSubmitting = ref(false);

const form = reactive<UpdateChildParams>({
  nickname: undefined,
  gender: undefined,
  age: undefined,
  grade: undefined,
});

const ageStr = ref('');
const avatarUrl = ref(''); // 临时预览路径（本地或已有URL）
const uploadedAvatarUrl = ref(''); // 上传后的服务器 URL
const isNewAvatar = ref(false); // 是否选择了新头像

watch(ageStr, (val) => {
  const n = parseInt(val);
  form.age = isNaN(n) ? undefined : Math.min(18, Math.max(0, n));
});

const gradeOptions = [
  '幼儿园小班', '幼儿园中班', '幼儿园大班',
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '七年级(初一)', '八年级(初二)', '九年级(初三)',
];

const gradeIndex = computed(() => {
  if (!form.grade) return -1;
  return gradeOptions.indexOf(form.grade);
});

// 默认性别图标
const defaultGenderEmoji = computed(() => {
  if (form.gender === 'male') return '👦';
  if (form.gender === 'female') return '👧';
  return '👶';
});

const canSubmit = computed(() => {
  return (form.nickname?.trim()?.length ?? 0) > 0 && !isSubmitting.value;
});

function onGradeChange(e: { detail: { value: number } }): void {
  form.grade = gradeOptions[e.detail.value];
}

// 选择头像
function chooseAvatar(): void {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      avatarUrl.value = res.tempFilePaths[0];
      uploadedAvatarUrl.value = '';
      isNewAvatar.value = true;
    },
  });
}

// 预览头像
function previewAvatar(): void {
  if (avatarUrl.value) {
    uni.previewImage({
      urls: [avatarUrl.value],
      current: avatarUrl.value,
    });
  }
}

// 上传头像到服务器
function uploadAvatar(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!avatarUrl.value || !isNewAvatar.value) {
      return resolve('');
    }
    if (uploadedAvatarUrl.value) {
      return resolve(uploadedAvatarUrl.value);
    }

    const token = uni.getStorageSync('habitpet_token') || '';
    uni.uploadFile({
      url: `${BASE_URL}/parent/upload-avatar`,
      filePath: avatarUrl.value,
      name: 'avatar',
      header: { Authorization: `Bearer ${token}` },
      success: (res) => {
        try {
          const body = JSON.parse(res.data);
          if (body.code === 200) {
            uploadedAvatarUrl.value = body.data?.url || '';
            resolve(uploadedAvatarUrl.value);
          } else {
            reject(new Error(body.message || '上传失败'));
          }
        } catch {
          reject(new Error('解析上传结果失败'));
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
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
    form.nickname = detail.childInfo.nickname;
    form.gender = detail.childInfo.gender || undefined;
    form.age = detail.childInfo.age ?? undefined;
    form.grade = detail.childInfo.grade || undefined;
    if (form.age !== undefined) {
      ageStr.value = String(form.age);
    }
    // 加载已有头像
    if (detail.childInfo.avatar) {
      avatarUrl.value = detail.childInfo.avatar;
    }
  } catch (e) {
    console.error('[EditPage] 加载失败:', e);
  }
  isLoading.value = false;
});

function getChildIdFromUrl(): string {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] as { options?: { id?: string } };
  return current.options?.id || '';
}

async function handleSubmit(): Promise<void> {
  if (!canSubmit.value || isSubmitting.value) return;
  isSubmitting.value = true;

  const childId = getChildIdFromUrl();
  try {
    // 如果有新头像先上传
    let avatarPath = '';
    if (avatarUrl.value && isNewAvatar.value) {
      try {
        avatarPath = await uploadAvatar();
      } catch (e) {
        console.error('[EditPage] 头像上传失败:', e);
        uni.showToast({ title: '头像上传失败，请重试', icon: 'none' });
        isSubmitting.value = false;
        return;
      }
    }

    // 只发送有修改的字段
    const data: UpdateChildParams = {};
    if (form.nickname) data.nickname = form.nickname.trim();
    if (form.gender) data.gender = form.gender;
    if (form.age !== undefined) data.age = form.age;
    if (form.grade) data.grade = form.grade;
    if (avatarPath) data.avatar = avatarPath;

    await updateChild(childId, data);
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch (e: unknown) {
    console.error('[EditPage] 保存失败:', e);
    uni.showToast({ title: '保存失败', icon: 'none' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.edit-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

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

@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 28rpx; color: #333; }

.form-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

/* 头像上传 */
.avatar-upload-area {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 8rpx 0;
}

.avatar-preview-big {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid #f0f0f0;
  flex-shrink: 0;
}

.avatar-preview-img {
  width: 100%;
  height: 100%;
}

.avatar-preview-default {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #D4C5F0;
  font-size: 80rpx;
}

.avatar-picker-btn {
  padding: 16rpx 28rpx;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  border-radius: 32rpx;
  border: 2rpx solid #5B3E96;
}

.avatar-picker-btn text {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.form-item {
  padding: 16rpx 0;
  &:not(:last-child) { border-bottom: 1rpx solid #f5f5f5; }
}

.form-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.required { color: #e57373; }

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;
  &.small { width: 120rpx; text-align: center; }
}

.gender-picker { display: flex; gap: 20rpx; }

.gender-option {
  flex: 1;
  height: 96rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  gap: 4rpx;
  transition: all 0.2s;
  &.selected { background: #e8f5e9; border-color: #4caf50; }
}

.gender-emoji { font-size: 36rpx; }
.gender-text { font-size: 24rpx; color: #333; }

.age-picker { display: flex; align-items: center; gap: 12rpx; }
.age-unit { font-size: 28rpx; color: #333; }

.picker-box {
  width: 100%;
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 30rpx;
  color: #333;
  &.placeholder { color: #B8A8D0; }
}

.picker-arrow { font-size: 36rpx; color: #B8A8D0; }

.submit-section { padding: 48rpx 0; }

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
