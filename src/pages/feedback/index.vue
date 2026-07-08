<template>
  <view class="page">
    <view class="header">
      <text class="title">意见反馈</text>
    </view>

    <view class="form">
      <input
        class="input"
        v-model="title"
        placeholder="简单描述你的问题或建议"
        maxlength="100"
      />
      <textarea
        class="textarea"
        v-model="content"
        placeholder="请详细描述你遇到的问题，或想提出的建议..."
        maxlength="1000"
      />
      <button class="submit-btn" :loading="loading" :disabled="loading" @tap="submit">
        提交反馈
      </button>
    </view>

    <view class="link" @tap="goList">
      <text>查看我的反馈记录 ›</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/services/api'

const title = ref('')
const content = ref('')
const loading = ref(false)

async function submit() {
  if (loading.value) return
  if (!title.value.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }
  if (!content.value.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await api.post('/feedback', { title: title.value.trim(), content: content.value.trim() })
    uni.showToast({ title: '感谢反馈！', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/feedback/list' }), 800)
  } catch (e: any) {
    uni.showToast({ title: e?.message || '提交失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goList() {
  uni.navigateTo({ url: '/pages/feedback/list' })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f5; padding: 30rpx; }
.header { text-align: center; padding: 40rpx 0; }
.title { font-size: 36rpx; font-weight: bold; color: #333; }
.form { background: #fff; border-radius: 16rpx; padding: 30rpx; }
.input { width: 100%; height: 80rpx; border: 1px solid #e0e0e0; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; margin-bottom: 20rpx; box-sizing: border-box; }
.textarea { width: 100%; height: 300rpx; border: 1px solid #e0e0e0; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; }
.submit-btn { width: 100%; height: 88rpx; line-height: 88rpx; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 32rpx; border-radius: 44rpx; margin-top: 30rpx; border: none; }
.link { text-align: center; padding: 30rpx; color: #667eea; font-size: 28rpx; }
</style>
