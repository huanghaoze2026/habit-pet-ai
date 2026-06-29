<template>
  <view class="page-pricing">
    <view class="pricing-header">
      <text class="pricing-title">对话能量</text>
      <text class="pricing-subtitle">选择合适的方案，让宝贝和宠物畅快聊天</text>
    </view>

    <view class="pricing-list">
      <view
        v-for="plan in plans"
        :key="plan.id"
        class="pricing-card"
        :class="{ 'pricing-card--featured': plan.featured }"
      >
        <view v-if="plan.featured" class="pricing-badge">推荐</view>
        <text class="pricing-plan-name">{{ plan.name }}</text>
        <view class="pricing-price-row">
          <text class="pricing-currency">¥</text>
          <text class="pricing-price">{{ plan.price }}</text>
        </view>
        <text class="pricing-desc">{{ plan.desc }}</text>
        <view class="pricing-btn" :class="{ 'pricing-btn--featured': plan.featured }">
          <text>选择</text>
        </view>
      </view>
    </view>

    <view class="pricing-footer">
      <text class="pricing-footer-text">暂不实现付费，以上为展示效果</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const plans = ref([
  { id: 'day', name: '单日能量包', price: '1.00', desc: '当天无限对话（次日恢复限制）', featured: false },
  { id: 'week', name: '周能量卡', price: '6.00', desc: '7天无限对话', featured: false },
  { id: 'month', name: '月度会员', price: '18.00', desc: '30天无限对话 + 专属宠物表情', featured: true },
  { id: 'lifetime', name: '终身会员', price: '98', desc: '无限对话 + 稀有宠物解锁 + 成长报告', featured: false },
])
</script>

<style scoped>
.page-pricing {
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  padding: 40rpx 24rpx 60rpx;
}
.pricing-header {
  text-align: center;
  margin-bottom: 40rpx;
}
.pricing-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  display: block;
}
.pricing-subtitle {
  font-size: 26rpx;
  color: #999;
  margin-top: 12rpx;
  display: block;
}
.pricing-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  justify-content: center;
}
.pricing-card {
  width: calc(50% - 10rpx);
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.pricing-card--featured {
  border: 3rpx solid #7B61FF;
  background: linear-gradient(180deg, #FAF8FF, #fff);
}
.pricing-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #7B61FF, #9D4EDD);
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 20rpx;
  border-radius: 0 20rpx 0 16rpx;
}
.pricing-plan-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-top: 16rpx;
}
.pricing-price-row {
  display: flex;
  align-items: baseline;
  margin: 16rpx 0 8rpx;
}
.pricing-currency {
  font-size: 32rpx;
  color: #7B61FF;
  font-weight: bold;
}
.pricing-price {
  font-size: 56rpx;
  font-weight: bold;
  color: #7B61FF;
  line-height: 1;
}
.pricing-desc {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  line-height: 1.5;
  min-height: 72rpx;
}
.pricing-btn {
  margin-top: 20rpx;
  width: 100%;
  padding: 16rpx 0;
  text-align: center;
  background: #F5F0FF;
  border-radius: 32rpx;
  font-size: 28rpx;
  color: #7B61FF;
  font-weight: bold;
}
.pricing-btn--featured {
  background: linear-gradient(135deg, #7B61FF, #9D4EDD);
  color: #fff;
}
.pricing-footer {
  text-align: center;
  margin-top: 40rpx;
}
.pricing-footer-text {
  font-size: 24rpx;
  color: #CCC;
}
</style>
