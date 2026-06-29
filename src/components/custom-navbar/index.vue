<template>
  <view class="cnb" :style="{ paddingTop: statusBarH + 'px' }">
    <view class="cnb-row">
      <view class="cnb-left">
        <button v-if="showInvite" class="cnb-invite" open-type="share" @click="$emit('invite')">邀请</button>
      </view>
      <text class="cnb-title">{{ title }}</text>
      <view class="cnb-right" />
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{ title: string; showInvite?: boolean }>()
defineEmits(['invite'])

const statusBarH = ref(20)
try { statusBarH.value = uni.getSystemInfoSync().statusBarHeight || 20 } catch {}

import { ref } from 'vue'
</script>

<style scoped>
.cnb{background:rgba(255,255,255,0.5);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.3);flex-shrink:0;position:fixed;top:0;left:0;right:0;z-index:100}
.cnb-row{display:flex;align-items:center;justify-content:space-between;height:88rpx;padding:0 16rpx}
.cnb-left{width:120rpx;display:flex;align-items:center}
.cnb-invite{font-size:28rpx;color:#fff;background:#5B3E96;padding:8rpx 24rpx;border-radius:24rpx;font-weight:500;border:none;line-height:1.4;margin:0}
.cnb-invite::after{border:none}
.cnb-invite:active{opacity:.8}
.cnb-title{font-size:17px;font-weight:bold;color:#333}
.cnb-right{width:120rpx}
/* P62: 毛玻璃降级 — 不支持 backdrop-filter 时提高不透明度 */
@supports not (-webkit-backdrop-filter:blur(1px)){.cnb{background:rgba(255,255,255,0.85)}}
</style>
