<template>
  <view class="add-page">
    <!-- 表单区域 -->
    <view class="form-card">
      <!-- 头像上传 -->
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
            <text>{{ avatarUrl ? '更换头像' : '选择头像' }}</text>
          </view>
        </view>
      </view>

      <!-- 昵称 -->
      <view class="form-item">
        <text class="form-label">昵称 <text class="required">*</text></text>
        <input
          v-model="form.nickname"
          class="form-input"
          placeholder="请输入孩子的昵称"
          placeholder-style="color:#B8A8D0;"
          maxlength="20"
        />
      </view>

      <!-- 性别 -->
      <view class="form-item">
        <text class="form-label">性别</text>
        <view class="gender-picker">
          <view
            class="gender-btn"
            :class="{ active: form.gender === 'male' }"
            @tap="form.gender = 'male'"
          >
            <text>♂ 男孩</text>
          </view>
          <view
            class="gender-btn"
            :class="{ active: form.gender === 'female' }"
            @tap="form.gender = 'female'"
          >
            <text>♀ 女孩</text>
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
            placeholder-style="color:#B8A8D0;"
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
            <text>{{ form.grade || '请选择年级（选填）' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 宠物选择 -->
    <view class="form-card">
      <view class="card-header">
        <text class="card-title">🐉 选择宠物</text>
        <text class="card-hint">（共{{ speciesList.length }}种可选）</text>
      </view>
      <picker
        :value="speciesIndex"
        :range="speciesNames"
        @change="onSpeciesChange"
      >
        <view class="picker-box" :class="{ placeholder: !form.speciesId }">
          <view class="species-main-row">
            <text>{{ selectedSpecies?.name || '请选择宠物（选填）' }}</text>
            <text v-if="selectedSpecies" class="species-desc">{{ selectedSpecies.desc }}</text>
          </view>
          <text v-if="selectedSpecies?.comingSoon" class="species-coming-tag">待上线</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
      <view v-if="form.speciesId" class="species-view-row">
        <view class="species-view-btn" @tap="goStagesPreview">
          <text>👁 查看形态</text>
        </view>
      </view>
    </view>

    <!-- 手表绑定（选填） -->
    <view class="form-card">
      <view class="card-header">
        <text class="card-title">⌚ 手表绑定</text>
        <text class="card-hint">（选填，可后续绑定）</text>
      </view>
      <view class="watch-skip" @tap="skipWatch">
        <text class="watch-skip-text">暂不绑定 →</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button
        class="submit-btn"
        :disabled="!canSubmit || isSubmitting"
        :class="{ 'btn-disabled': !canSubmit || isSubmitting }"
        @tap="handleSubmit"
        hover-class="btn-hover"
      >
        {{ submitBtnText }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { addChild, type AddChildParams } from '@/services/parent';
import { createPaymentOrder, confirmPaymentOrder } from '@/services/payment';
import { useChildStore } from '@/stores/child';
import { useUserStore } from '@/stores/user';
import { api, BASE_URL } from '@/services/api';

const store = useChildStore();
const userStore = useUserStore();
const isSubmitting = ref(false);

// 需要登录才能使用的页面（审核整改·游客模式）：未登录直接回登录页，
// 避免游客态下请求 401 导致“选择宠物”下拉数据为空。
onShow(() => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(() => uni.reLaunch({ url: '/pages/login/login' }), 600);
  }
});

// 宠物物种列表
interface PetSpecies { id: string; name: string; desc: string; category: string; comingSoon?: boolean }
const speciesList = ref<PetSpecies[]>([])
const speciesNames = computed(() => speciesList.value.map(s => s.comingSoon ? s.name + '（待上线）' : s.name))
const speciesIndex = ref(-1)
const selectedSpecies = computed(() => speciesIndex.value >= 0 ? speciesList.value[speciesIndex.value] : null)

// 宠物物种加载：失败时 console.error 记录 + 自动重试（最多 2 次），
// 避免接口异常（后端重启/网络抖动）时下拉框无内容；无需额外 UI 提示。
const speciesLoading = ref(false)
let speciesRetryCount = 0
const MAX_SPECIES_RETRY = 2

async function loadSpecies() {
  if (speciesLoading.value) return
  speciesLoading.value = true
  try {
    const r = await api.get<{ species: PetSpecies[] }>('/parent/pet-species')
    speciesList.value = r.data?.species || []
    speciesRetryCount = 0
    if (speciesList.value.length === 0) {
      console.warn('[AddChild] pet-species 接口返回空列表')
    }
  } catch (e) {
    console.error('[AddChild] 加载宠物物种列表失败:', e)
    // 瞬时故障自动重试（最多 2 次，间隔 1.5s）
    if (speciesRetryCount < MAX_SPECIES_RETRY) {
      speciesRetryCount++
      setTimeout(() => {
        if (!speciesList.value.length) loadSpecies()
      }, 1500)
    }
  } finally {
    speciesLoading.value = false
  }
}

loadSpecies()

function goStagesPreview() {
  const name = encodeURIComponent(selectedSpecies.value?.name || '')
  uni.navigateTo({ url: `/pages/parent/children/pet-stages-preview?speciesId=${form.speciesId}&speciesName=${name}` })
}

function onSpeciesChange(e: { detail: { value: number } }) {
  speciesIndex.value = e.detail.value
  form.speciesId = speciesList.value[e.detail.value]?.id || undefined
}

const avatarUrl = ref('');
const uploadedAvatarUrl = ref('');

const form = reactive<AddChildParams>({
  nickname: '',
  gender: undefined,
  age: undefined,
  avatar: undefined,
  grade: undefined,
  petId: undefined,
});

const ageStr = ref('');

// 默认性别图标
const defaultGenderEmoji = computed(() => {
  if (form.gender === 'male') return '👦';
  if (form.gender === 'female') return '👧';
  return '👶';
});

watch(ageStr, (val) => {
  const n = parseInt(val);
  form.age = isNaN(n) ? undefined : Math.min(18, Math.max(0, n));
});

const gradeOptions = [
  '幼儿园小班',
  '幼儿园中班',
  '幼儿园大班',
  '一年级',
  '二年级',
  '三年级',
  '四年级',
  '五年级',
  '六年级',
  '七年级(初一)',
  '八年级(初二)',
  '九年级(初三)',
];

const gradeIndex = computed(() => {
  if (!form.grade) return -1;
  return gradeOptions.indexOf(form.grade);
});

function onGradeChange(e: { detail: { value: number } }): void {
  form.grade = gradeOptions[e.detail.value];
}

const canSubmit = computed(() => {
  return form.nickname.trim().length > 0 && !isSubmitting.value;
});

/** 提交按钮文案：第1个免费，第2个起需支付 */
const submitBtnText = computed(() => {
  if (isSubmitting.value) return '添加中...';
  if (store.childList.length === 0) return '确认添加';
  return '确认支付并添加';
});

function skipWatch(): void {
  // 手表绑定在添加时可跳过
}

// 选择头像
function chooseAvatar(): void {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      avatarUrl.value = res.tempFilePaths[0];
      uploadedAvatarUrl.value = ''; // 重置，需要重新上传
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

// 压缩本地图片（主要对 jpg 有效；失败退回原图，不阻断上传）
async function compressForUpload(src: string): Promise<string> {
  try {
    const r: any = await uni.compressImage({ src, quality: 70 });
    return r?.tempFilePath || src;
  } catch {
    return src;
  }
}

// 上传头像到服务器
async function uploadAvatar(): Promise<string> {
  if (!avatarUrl.value) {
    return '';
  }
  if (uploadedAvatarUrl.value) {
    return uploadedAvatarUrl.value;
  }

  // 上传前先压缩，避免手机原图数 MB 上传缓慢
  const filePath = await compressForUpload(avatarUrl.value);
  const token = uni.getStorageSync('habitpet_token') || '';
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${BASE_URL}/parent/upload-avatar`,
      filePath,
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

/** 构建宝贝创建参数（avatar 由调用方先上传后注入） */
function buildChildParams(avatarPath?: string): AddChildParams {
  const params: AddChildParams = {
    nickname: form.nickname.trim(),
  };
  if (form.gender) params.gender = form.gender;
  if (form.age !== undefined) params.age = form.age;
  if (form.grade) params.grade = form.grade;
  if (form.petId) params.petId = form.petId;
  if (form.speciesId) (params as any).speciesId = form.speciesId;
  if (avatarPath) params.avatar = avatarPath;
  return params;
}

/**
 * 提交前上传头像（若已选择）。失败不阻断创建，仅记录日志；
 * 避免「选择头像后提交却丢失头像」的静默问题。
 */
async function uploadAvatarIfAny(): Promise<string> {
  if (!avatarUrl.value) return '';
  try {
    return await uploadAvatar();
  } catch (e) {
    console.error('[AddChild] 头像上传失败（继续创建，不带头像）:', e);
    uni.showToast({ title: '头像上传失败，将不带头像保存', icon: 'none' });
    return '';
  }
}

/** 第2+个宝贝（已有1个以上）：走虚拟支付流程 */
async function handlePaidSubmit(): Promise<void> {
  uni.showLoading({ title: '拉起支付...', mask: true });

  try {
    // 1. 获取 wx.login code
    const loginRes = await new Promise<{ code: string }>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: (res) => resolve(res as unknown as { code: string }),
        fail: (err) => reject(err),
      });
    });

    const avatarPath = await uploadAvatarIfAny();
    const childData = buildChildParams(avatarPath) as Record<string, any>;
    const wxCode = loginRes.code;

    // 2. 获取小程序运行版本(develop=开发版/开发者工具, trial=体验版, release=正式版)
    let envVersion = 'release';
    try {
      // @ts-ignore
      const acc = wx.getAccountInfoSync();
      envVersion = acc?.miniProgram?.envVersion || 'release';
    } catch (e) {
      console.warn('[Payment] 获取 envVersion 失败，默认 release:', e);
    }

    // 3. 创建支付订单（后端生成签名）
    uni.hideLoading();
    uni.showLoading({ title: '生成订单中...', mask: true });
    const orderResult = await createPaymentOrder({ childData, wxCode, envVersion });
    uni.hideLoading();

    // 3. 拉起微信虚拟支付
    // 能力检测：低版本基础库不支持
    // @ts-ignore
    if (!wx.canIUse || !wx.canIUse('requestVirtualPayment')) {
      uni.hideLoading();
      uni.showToast({ title: '当前微信版本过低，请升级后再试', icon: 'none' });
      isSubmitting.value = false;
      return;
    }
    const payResult = await new Promise<{ errCode: number }>((resolve, reject) => {
      // @ts-ignore wx.requestVirtualPayment 是微信小程序 API
      wx.requestVirtualPayment({
        signData: orderResult.signData,
        mode: 'short_series_goods',
        paySig: orderResult.paySig,
        signature: orderResult.signature,
        success: (res: any) => resolve(res),
        fail: (err: any) => reject(err),
      });
    });

    // 支付成功
    uni.showLoading({ title: '支付成功，创建宝贝...', mask: true });
    const confirmResult = await confirmPaymentOrder(orderResult.outTradeNo);

    if (!confirmResult.success) {
      throw new Error('确认订单失败');
    }

    // 刷新全局 childStore
    store.loaded = false;
    await store.fetchChildList();
    if (confirmResult.child?.id) {
      store.switchToChild(confirmResult.child.id);
    }

    uni.hideLoading();
    uni.showToast({ title: '添加成功', icon: 'success', duration: 1500 });
    setTimeout(() => {
      isSubmitting.value = false;
      uni.reLaunch({ url: '/pages/task/task' });
    }, 1000);
  } catch (e: any) {
    uni.hideLoading();
    isSubmitting.value = false;

    // 处理支付错误码
    if (e.errCode !== undefined || e.errMsg) {
      const errCode = e.errCode || (e as any).errCode;
      const errMsg = e.errMsg || (e as any).errMsg;
      console.error('[Payment] 失败: errCode=', errCode, 'errMsg=', errMsg, '完整=', JSON.stringify(e));
      switch (errCode) {
        case -1:
          uni.showToast({ title: '支付失败，请重试', icon: 'none' });
          break;
        case -2:
          uni.showToast({ title: '已取消支付', icon: 'none' });
          break;
        case -4:
          uni.showToast({ title: '支付被拦截，请联系客服', icon: 'none' });
          break;
        case -15005:
        case -15006:
          console.error('[Payment] 签名错误:', e);
          uni.showToast({ title: '支付系统异常，请联系客服', icon: 'none' });
          break;
        default:
          uni.showToast({ title: '支付失败，请重试', icon: 'none' });
      }
    } else {
      console.error('[AddChild] 支付/创建失败:', e);
      uni.showToast({ title: '添加失败，请重试', icon: 'none' });
    }
  }
}

async function handleSubmit(): Promise<void> {
  if (!canSubmit.value || isSubmitting.value) return;

  const childCount = store.childList.length;

  // 第2+个宝贝（已有1个以上）：走虚拟支付流程
  if (childCount >= 1) {
    isSubmitting.value = true;
    await handlePaidSubmit();
    return;
  }

  // 仅第1个宝贝免费创建
  isSubmitting.value = true;
  uni.showLoading({ title: '保存中...', mask: true });
  try {
    const avatarPath = await uploadAvatarIfAny();
    const params = buildChildParams(avatarPath);

    const newChild = await addChild(params);
    // 刷新全局 childStore
    store.loaded = false;
    await store.fetchChildList();
    // 切换到刚创建的宝贝
    if (newChild?.id) {
      store.switchToChild(newChild.id);
    }
    uni.hideLoading();
    uni.showToast({ title: '添加成功', icon: 'success', duration: 1500 });
    setTimeout(() => {
      isSubmitting.value = false;
      // 跳转到任务页，自动定位到新宝贝
      uni.reLaunch({ url: '/pages/task/task' });
    }, 1000);
  } catch (e: unknown) {
    console.error('[AddChild] 添加失败:', e);
    uni.hideLoading();
    isSubmitting.value = false;
    uni.showToast({ title: '添加失败，请重试', icon: 'none' });
  }
}
</script>

<style lang="scss" scoped>
.add-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

// ===== 表单卡片 =====
.form-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
}

.card-hint {
  font-size: 22rpx;
  color: #333;
}

.form-item {
  padding: 16rpx 0;

  &:not(:last-child) {
    border-bottom: 1rpx solid #f5f5f5;
  }
}

.form-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.required {
  color: #e57373;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;

  &.small {
    width: 120rpx;
    text-align: center;
  }
}

// ===== 头像上传 =====
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

// ===== 性别选择器 =====
.gender-picker {
  display: flex;
  gap: 20rpx;
}

.gender-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  font-size: 28rpx;
  color: #333;
  transition: all 0.2s;

  &.active {
    background: #e8f5e9;
    border-color: #4caf50;
    color: #4caf50;
    font-weight: 600;
  }
}

// ===== 年龄 =====
.age-picker {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.age-unit {
  font-size: 28rpx;
  color: #333;
}

// ===== 年级选择 =====
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

  &.placeholder {
    color: #B8A8D0;
  }
}

.picker-arrow {
  font-size: 36rpx;
  color: #B8A8D0;
}

.species-main-row {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
  overflow: hidden;
}

.species-desc {
  font-size: 22rpx;
  color: #7B5EA7;
  margin-top: 2rpx;
}

.species-coming-tag {
  font-size: 20rpx;
  color: #FF8E9E;
  background: rgba(255, 142, 158, 0.1);
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  margin-right: 8rpx;
  white-space: nowrap;
}

.species-view-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16rpx;
}

.species-view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14rpx 32rpx;
  background: linear-gradient(135deg, #7B5EA7, #5B3E96);
  border-radius: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(91, 62, 150, 0.25);
}

.species-view-btn text {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 600;
}

// ===== 跳过选项 =====
.pet-skip,
.watch-skip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
  color: #333;
  font-size: 26rpx;
}

.watch-skip-text {
  color: #4caf50;
  font-size: 28rpx;
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

.btn-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.btn-hover {
  opacity: 0.85;
  transform: scale(0.98);
}
</style>
