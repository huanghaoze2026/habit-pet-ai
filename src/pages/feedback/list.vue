<template>
  <view class="page">
    <view class="header">
      <view class="add-btn" @tap="goAdd">
        <text>+ 新增反馈</text>
      </view>
    </view>

    <view v-if="list.length === 0" class="empty">
      <text class="empty-text">暂无反馈记录</text>
      <text class="empty-hint">遇到问题或有好建议？告诉我们吧</text>
    </view>

    <view v-for="item in list" :key="item.id" class="card" @tap="goDetail(item.id)">
      <view class="card-top">
        <text class="card-title">{{ item.title }}</text>
        <text class="card-status" :class="item.replied ? 'replied' : 'pending'">
          {{ item.replied ? '已回复' : '待回复' }}
        </text>
      </view>
      <text class="card-content">{{ item.content.substring(0, 80) }}{{ item.content.length > 80 ? '...' : '' }}</text>
      <text class="card-time">{{ formatTime(item.createdAt) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

interface FeedbackItem {
  id: number
  title: string
  content: string
  createdAt: string
  replied: boolean
}

const list = ref<FeedbackItem[]>([])

onMounted(async () => {
  try {
    const res = await api.get<FeedbackItem[]>('/feedback/list')
    list.value = (res.data as any)?.data || res.data || []
  } catch {}
})

function goAdd() {
  uni.navigateTo({ url: '/pages/feedback/index' })
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/feedback/detail?id=${id}` })
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f5; padding: 30rpx; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0 30rpx; }
.title { font-size: 36rpx; font-weight: bold; color: #333; }
.add-btn { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; padding: 12rpx 24rpx; border-radius: 30rpx; font-size: 26rpx; }
.empty { text-align: center; padding: 100rpx 0; }
.empty-text { font-size: 30rpx; color: #999; display: block; }
.empty-hint { font-size: 24rpx; color: #bbb; margin-top: 12rpx; display: block; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.card-title { font-size: 30rpx; font-weight: 600; color: #333; flex: 1; }
.card-status { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 20rpx; }
.card-status.replied { background: #e8f5e9; color: #2e7d32; }
.card-status.pending { background: #fff3e0; color: #e65100; }
.card-content { font-size: 26rpx; color: #666; line-height: 1.6; display: block; margin-bottom: 12rpx; }
.card-time { font-size: 22rpx; color: #aaa; }
</style>
