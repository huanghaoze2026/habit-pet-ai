<template>
  <view class="page">
    <view class="card feedback-card">
      <text class="card-title">{{ detail.title }}</text>
      <text class="card-time">提交于 {{ formatTime(detail.createdAt) }}</text>
      <view class="divider" />
      <text class="card-content">{{ detail.content }}</text>
    </view>

    <!-- 管理回复 -->
    <view v-if="detail.replied" class="card reply-card">
      <view class="reply-header">
        <text class="reply-label">管理员回复</text>
        <text class="reply-time">{{ formatTime(detail.reply?.createdAt) }}</text>
      </view>
      <view class="divider" />
      <text class="reply-content">{{ detail.reply?.content }}</text>
    </view>

    <view v-else class="empty-reply">
      <text class="empty-icon">🕐</text>
      <text class="empty-text">管理员正在快马加鞭赶来...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import api from '@/services/api'

interface ReplyInfo { content: string; createdAt: string }
interface FeedbackDetail {
  id: number; title: string; content: string; createdAt: string
  replied: boolean; reply: ReplyInfo | null
}

const detail = ref<FeedbackDetail>({
  id: 0, title: '', content: '', createdAt: '', replied: false, reply: null
})

onLoad((options: any) => {
  const id = options?.id
  if (id) fetchDetail(Number(id))
})

async function fetchDetail(id: number) {
  try {
    const res = await api.get<FeedbackDetail>(`/feedback/${id}`)
    detail.value = (res.data as any)?.data || res.data || detail.value
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function formatTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f5; padding: 30rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 24rpx; }
.card-title { font-size: 34rpx; font-weight: bold; color: #333; display: block; margin-bottom: 8rpx; }
.card-time { font-size: 22rpx; color: #aaa; }
.card-content { font-size: 28rpx; color: #555; line-height: 1.8; display: block; }
.divider { height: 1px; background: #f0f0f0; margin: 20rpx 0; }
.reply-header { display: flex; justify-content: space-between; align-items: center; }
.reply-label { font-size: 28rpx; font-weight: 600; color: #667eea; }
.reply-time { font-size: 22rpx; color: #aaa; }
.reply-content { font-size: 28rpx; color: #444; line-height: 1.8; display: block; }
.empty-reply { text-align: center; padding: 80rpx 0; }
.empty-icon { font-size: 60rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; }
</style>
