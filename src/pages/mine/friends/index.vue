<template>
  <view class="page-friends">
    <view v-if="loading" class="loading-msg">加载中...</view>

    <view v-else-if="friends.length === 0" class="empty-state">
      <text class="empty-icon">🐾</text>
      <text class="empty-text">还没有好友</text>
      <text class="empty-hint">去宠物圈邀请好友吧</text>
    </view>

    <scroll-view v-else scroll-y class="friend-list">
      <view v-for="f in friends" :key="f.id" class="friend-item">
        <image v-if="f.avatar" :src="f.avatar" class="friend-avatar" mode="aspectFill" />
        <view v-else class="friend-avatar-em">👤</view>
        <text class="friend-name">{{ f.nickname || '未设置昵称' }}</text>
        <view class="friend-del" @click="confirmDelete(f)">
          <text>删除</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '@/services/api'

interface Friend { id: string; nickname: string; avatar: string | null }
const friends = ref<Friend[]>([])
const loading = ref(true)

onShow(async () => {
  loading.value = true
  try {
    const res = await api.get<any>('/friends')
    const data = res.data?.data || res.data || []
    friends.value = Array.isArray(data) ? data : data.list || []
  } catch { friends.value = [] }
  finally { loading.value = false }
})

function confirmDelete(f: Friend) {
  uni.showModal({
    title: '删除好友',
    content: `确定要删除「${f.nickname || '该好友'}」吗？删除后宠物圈将不再显示TA的宠物。`,
    success: async (r) => {
      if (!r.confirm) return
      try {
        await api.del(`/friends/${f.id}`)
        friends.value = friends.value.filter(x => x.id !== f.id)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch { uni.showToast({ title: '删除失败', icon: 'none' }) }
    }
  })
}
</script>

<style scoped>
.page-friends { display:flex; flex-direction:column; height:100vh; background:linear-gradient(180deg,#F5F0FF,#EBE0FF); }
.loading-msg { text-align:center; padding:100rpx; color:#999; }
.empty-state { display:flex; flex-direction:column; align-items:center; padding:120rpx 40rpx; }
.empty-icon { font-size:80rpx; margin-bottom:20rpx; }
.empty-text { font-size:28rpx; color:#333; margin-bottom:12rpx; }
.empty-hint { font-size:24rpx; color:#999; }
.friend-list { flex:1; padding:0 24rpx; }
.friend-item { display:flex; align-items:center; gap:20rpx; padding:28rpx 20rpx; background:#fff; border-radius:16rpx; margin-bottom:12rpx; }
.friend-avatar { width:80rpx; height:80rpx; border-radius:50%; }
.friend-avatar-em { width:80rpx; height:80rpx; border-radius:50%; background:#D4C5F0; display:flex; align-items:center; justify-content:center; font-size:40rpx; }
.friend-name { flex:1; font-size:30rpx; color:#333; font-weight:500; }
.friend-del { padding:12rpx 28rpx; background:#FFF0F0; border-radius:24rpx; font-size:24rpx; color:#E74C3C; }
.friend-del:active { background:#FFD0D0; }
</style>
