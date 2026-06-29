<template>
  <view class="page-checkin">
    <!-- 顶部返回 -->
    <view class="checkin-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <text class="header-title">确认打卡</text>
    </view>

    <!-- 任务信息卡片 -->
    <view class="info-card" v-if="task">
      <view class="info-row">
        <text class="info-label">任务</text>
        <text class="info-value">{{ task.name }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">宝贝</text>
        <text class="info-value">{{ childName }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">能量</text>
        <text class="info-value info-energy">⚡ {{ task.energy || 0 }}</text>
      </view>
    </view>

    <!-- 照片预览区域 -->
    <view class="photo-section" v-if="photoPath">
      <text class="section-label">打卡照片</text>
      <view class="photo-wrapper">
        <image
          :src="photoPath"
          class="photo-preview"
          mode="widthFix"
          @click="previewPhoto"
        />
      </view>
      <view class="photo-actions">
        <view class="photo-action-btn" @click="retakePhoto">
          <text>📷 重拍</text>
        </view>
      </view>
    </view>

    <!-- 未选择照片 -->
    <view class="photo-section" v-else>
      <view class="photo-placeholder" @click="retakePhoto">
        <text class="placeholder-icon">📷</text>
        <text class="placeholder-text">点击拍摄打卡照片</text>
      </view>
    </view>

    <!-- 备注 -->
    <view class="note-section">
      <text class="section-label">打卡备注（选填）</text>
      <textarea
        class="note-input"
        v-model="note"
        placeholder="写点什么..."
        placeholder-style="color: #CCCCCC;"
        maxlength="200"
        :auto-height="true"
      />
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <view
        class="submit-btn"
        :class="{ 'submit-btn--disabled': submitting || !photoPath }"
        @click="handleSubmit"
      >
        <text v-if="!submitting">✅ 确认打卡</text>
        <text v-else>提交中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api, BASE_URL } from '@/services/api'
import { useChildStore } from '@/stores/child'

const store = useChildStore()
const taskId = ref('')
const childId = ref('')
const childName = ref('')
const taskName = ref('')
const taskEnergy = ref(0)
const photoPath = ref('')
const note = ref('')
const submitting = ref(false)

const task = ref<{ name: string; energy: number } | null>(null)

onLoad((options: any) => {
  taskId.value = options?.taskId || ''
  childId.value = options?.childId || ''
  childName.value = decodeURIComponent(options?.childName || '')
  taskName.value = decodeURIComponent(options?.taskName || '')
  taskEnergy.value = Number(options?.energy || 0)
  photoPath.value = options?.photoPath ? decodeURIComponent(options.photoPath) : ''

  task.value = {
    name: taskName.value,
    energy: taskEnergy.value,
  }

  // 如果没有照片路径，自动打开相册
  if (!photoPath.value) {
    retakePhoto()
  }
})

const retakePhoto = async () => {
  try {
    const chooseRes = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
    })
    photoPath.value = chooseRes.tempFilePaths[0]
  } catch {
    // 用户取消
  }
}

const previewPhoto = () => {
  if (photoPath.value) {
    uni.previewImage({ current: photoPath.value, urls: [photoPath.value] })
  }
}

const goBack = () => uni.navigateBack()

const handleSubmit = async () => {
  if (!photoPath.value) {
    uni.showToast({ title: '请先拍摄照片', icon: 'none' })
    return
  }
  if (!taskId.value) {
    uni.showToast({ title: '任务信息丢失', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const token = uni.getStorageSync('habitpet_token') || ''
    const formData: Record<string, string> = {
      taskId: taskId.value,
      childId: childId.value || store.currentChildId || '',
    }
    if (note.value.trim()) {
      formData.note = note.value.trim()
    }

    // 上传照片 + 打卡（使用带照片上传的接口）
    await new Promise((resolve, reject) => {
      uni.uploadFile({
        url: `${BASE_URL}/checkin/submit-with-photo`,
        filePath: photoPath.value,
        name: 'image',
        formData,
        header: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 30000,
        success: (res) => {
          try {
            const body = JSON.parse(res.data)
            if (body.code === 200) {
              console.log('[Checkin] upload success:', body)
              resolve(body)
            } else {
              reject(new Error(body.message || '上传失败'))
            }
          } catch {
            reject(new Error('解析响应失败'))
          }
        },
        fail: reject,
      })
    })

    // 通知任务列表刷新
    uni.$emit('task:refresh')
    uni.showToast({ title: '打卡成功！🎉', icon: 'success' })
    // 切换回任务列表（tab 页）
    setTimeout(() => uni.redirectTo({ url: '/pages/task/task' }), 800)
  } catch (e: any) {
    console.error('[Checkin] submit error:', e)
    uni.showToast({ title: '打卡失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-checkin {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  padding-bottom: 60rpx;
}

.checkin-header {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
  gap: 16rpx;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.back-icon { font-size: 32rpx; color: #333; font-weight: bold; }
.back-text { font-size: 28rpx; color: #333; }
.header-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-left: 16rpx;
}

.info-card {
  background: #fff;
  border-radius: 16rpx;
  margin: 0 24rpx;
  padding: 28rpx;
}
.info-row {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #F5F5F5;
}
.info-row:last-child { border-bottom: none; }
.info-label {
  font-size: 26rpx;
  color: #333;
  width: 120rpx;
}
.info-value {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}
.info-energy { color: #333; font-weight: bold; }

.photo-section {
  margin: 24rpx;
}
.section-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.photo-wrapper {
  border-radius: 16rpx;
  overflow: hidden;
  background: #fff;
}
.photo-preview {
  width: 100%;
  display: block;
}
.photo-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16rpx;
}
.photo-action-btn {
  padding: 12rpx 32rpx;
  background: #F0F0F0;
  border-radius: 24rpx;
  font-size: 26rpx;
  color: #333;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300rpx;
  background: #fff;
  border-radius: 16rpx;
  border: 2rpx dashed #DDD;
}
.placeholder-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.placeholder-text { font-size: 26rpx; color: #333; }

.note-section {
  margin: 0 24rpx 24rpx;
}
.note-input {
  width: 100%;
  min-height: 120rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.submit-section {
  padding: 32rpx 24rpx;
}
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  background: #4CAF50;
  border-radius: 40rpx;
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}
.submit-btn--disabled {
  background: #CCC;
}
</style>
