<template>
  <view class="page-detail">
    <!-- 任务详情卡片 -->
    <view class="detail-card" v-if="task">
      <view class="detail-row">
        <text class="detail-label">任务名称</text>
        <text class="detail-value detail-name">{{ task.name }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">任务类型</text>
        <text class="detail-value">{{ typeLabel }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">任务描述</text>
        <text class="detail-value detail-desc">{{ task.description || '暂无描述' }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">能量值</text>
        <text class="detail-value detail-energy">⚡ {{ task.energy || task.points || 0 }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">奖励内容</text>
        <text class="detail-value">{{ task.rewardContent || '未设置' }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">提醒时间</text>
        <text class="detail-value">{{ task.reminderTime || '未设置' }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">重复类型</text>
        <text class="detail-value">{{ repeatLabel }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">需要拍照</text>
        <text class="detail-value">{{ task.needPhoto ? '📷 需要拍照' : '不需要' }}</text>
      </view>

      <!-- 打卡状态区域 -->
      <view class="checkin-section" v-if="task.checkedIn">
        <view class="checkin-divider"></view>
        <view class="checkin-title">📋 打卡记录</view>
        <view class="detail-row">
          <text class="detail-label">完成时间</text>
          <text class="detail-value">{{ formatTime(task.checkinAt) }}</text>
        </view>
        <view v-if="task.needPhoto && task.checkinImage" class="checkin-photo-row">
          <text class="detail-label checkin-photo-label">打卡照片</text>
          <image
            :src="task.checkinImage"
            class="checkin-photo"
            mode="widthFix"
            @click="previewImage(task.checkinImage)"
          />
        </view>
        <view v-if="task.checkinNote" class="detail-row">
          <text class="detail-label">打卡备注</text>
          <text class="detail-value">{{ task.checkinNote }}</text>
        </view>
      </view>
    </view>

    <!-- 空态 -->
    <EmptyState
      v-if="!task && !loading"
      icon="📋"
      title="任务不存在"
      subtitle="该任务可能已被删除"
    />

    <!-- 底部固定完成按钮（未打卡时显示） -->
    <view class="bottom-bar" v-if="task && !task.checkedIn">
      <view class="complete-btn" :class="{ 'complete-btn--loading': submitting }" @click="handleComplete">
        <text v-if="!submitting">✅ 完成任务</text>
        <text v-else>提交中...</text>
      </view>
    </view>

    <!-- 底部已打卡提示 -->
    <view class="bottom-bar bottom-bar--done" v-if="task && task.checkedIn">
      <view class="done-badge">
        <text>✅ 已于 {{ formatTime(task.checkinAt) }} 完成</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/services/api'
import { useChildStore } from '@/stores/child'
import EmptyState from '@/components/empty-state/index.vue'

interface TaskDetail {
  id: string | number
  name: string
  title?: string
  description?: string
  category?: string
  icon?: string
  energy?: number
  points?: number
  rewardContent?: string
  repeatType?: string
  reminderTime?: string
  needPhoto?: boolean
  checkedIn?: boolean
  checkinAt?: string | null
  checkinImage?: string | null
  checkinNote?: string | null
}

const TYPE_MAP: Record<string, string> = { study: '📚 学习', life: '🏠 生活', sport: '⚽ 运动' }
const REPEAT_MAP: Record<string, string> = { daily: '📅 每天', weekday: '💼 工作日', monthly: '🗓️ 每月' }

const store = useChildStore()
const task = ref<TaskDetail | null>(null)
const loading = ref(true)
const submitting = ref(false)

const typeLabel = computed(() => TYPE_MAP[task.value?.category || ''] || (task.value?.category || task.value?.type || '未设置'))
const repeatLabel = computed(() => REPEAT_MAP[task.value?.repeatType || ''] || (task.value?.repeatType || '未设置'))

const formatTime = (isoStr: string | null | undefined) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onLoad((options: any) => {
  const id = options?.id
  if (id) {
    fetchDetail(id)
  } else {
    loading.value = false
    uni.showToast({ title: '缺少任务ID', icon: 'none' })
  }
})

const fetchDetail = async (id: string) => {
  try {
    loading.value = true
    const res = await api.get<any>(`/task/${id}`)
    // API 返回: { code:200, data:{ title, description, category, ... } }
    const raw = res?.data || res || {}
    console.log('[Detail] API response:', JSON.stringify(raw))
    task.value = {
      id: raw.id,
      name: raw.title || raw.name || '',
      title: raw.title || raw.name || '',
      description: raw.description || '',
      category: raw.category || '',
      icon: raw.icon || '',
      energy: raw.energy || 0,
      rewardContent: raw.rewardContent || '',
      repeatType: raw.repeatType || '',
      reminderTime: raw.reminderTime || '',
      needPhoto: raw.needPhoto || false,
      checkedIn: raw.checkedIn || false,
      checkinAt: raw.checkinAt || null,
      checkinImage: raw.checkinImage || null,
      checkinNote: raw.checkinNote || null,
    }
  } catch (e: any) {
    console.error('[Detail] fetch error:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const previewImage = (url: string) => {
  uni.previewImage({ current: url, urls: [url] })
}

const handleComplete = async () => {
  if (!task.value) return
  if (submitting.value) return
  try {
    if (task.value.needPhoto) {
      // 拍照 → 跳转打卡详情页确认提交
      const chooseRes = await uni.chooseImage({ count: 1 })
      const tempPath = chooseRes.tempFilePaths[0]
      // P59: 保存到本地持久路径
      const fs = uni.getFileSystemManager()
      const savedPath = `${wx.env.USER_DATA_PATH}/checkin_photo_${Date.now()}.jpg`
      try { await new Promise<void>((resolve, reject) => { fs.saveFile({ tempFilePath: tempPath, filePath: savedPath, success: () => resolve(), fail: reject }) }) } catch {}
      const params = [
        `taskId=${task.value.id}`,
        `childId=${store.currentChildId || ''}`,
        `photoPath=${encodeURIComponent(savedPath)}`,
        `taskName=${encodeURIComponent(task.value.name || '')}`,
        `energy=${task.value.energy || 0}`,
        `childName=${encodeURIComponent('')}`,
      ].join('&')
      uni.navigateTo({ url: `/pages/task/checkin?${params}` })
    } else {
      submitting.value = true
      await api.post('/checkin/submit', {
        taskId: task.value.id,
        childId: store.currentChildId,
      })
      // 通知任务列表刷新
      uni.$emit('task:refresh')
      uni.showToast({ title: '打卡成功！🎉', icon: 'success' })
      uni.navigateBack()
    }
  } catch (e: any) {
    if (e?.errMsg?.includes('cancel') || e?.errMsg?.includes('Cancel')) return
    console.error('[Detail] checkin error:', e)
    uni.showToast({ title: '打卡失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-detail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  padding-bottom: 160rpx;
}

.detail-card {
  background: #ffffff;
  border-radius: 16rpx;
  margin: 0 24rpx;
  padding: 32rpx 28rpx;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 26rpx;
  color: #333;
  width: 180rpx;
  flex-shrink: 0;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.detail-icon { font-size: 40rpx; }
.detail-name { font-size: 32rpx; font-weight: bold; }
.detail-desc { line-height: 40rpx; }
.detail-energy { color: #333; font-weight: bold; }

/* 打卡区域 */
.checkin-section {
  margin-top: 12rpx;
}
.checkin-divider {
  height: 1rpx;
  background: #F0F0F0;
  margin-bottom: 16rpx;
}
.checkin-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #4CAF50;
  padding-bottom: 16rpx;
}

.checkin-photo-row {
  display: flex;
  flex-direction: column;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}
.checkin-photo-label {
  margin-bottom: 16rpx;
}
.checkin-photo {
  width: 100%;
  border-radius: 12rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 28rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.bottom-bar--done {
  background: #F1F8E9;
}

.complete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  background: #4CAF50;
  border-radius: 40rpx;
  font-size: 32rpx;
  color: #ffffff;
  font-weight: bold;
}
.complete-btn--loading {
  background: #A5D6A7;
  pointer-events: none;
}

.done-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #4CAF50;
  font-weight: bold;
}
</style>
