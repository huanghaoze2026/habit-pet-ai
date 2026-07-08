<template>
  <view class="page-mine">
    <!-- 用户信息区（审核整改）：未登录显示“点击登录”，已登录显示昵称头像 -->
    <view class="user-card" @click="onUserAreaTap">
      <!-- 已登录且有真实头像 → 显示头像；未登录/无头像/加载失败 → 紫色圆形占位（首字/🐾） -->
      <image
        v-if="hasAvatar"
        class="user-avatar"
        :src="userStore.avatar"
        mode="aspectFill"
        @error="onAvatarError"
      />
      <view v-else class="user-avatar user-avatar--placeholder">
        <text class="user-avatar-emoji">{{ avatarPlaceholderText }}</text>
      </view>
      <view class="user-meta">
        <text class="user-nickname">{{ userStore.isLoggedIn ? userStore.nickname : '点击登录' }}</text>
        <text class="user-sub">{{ userStore.isLoggedIn ? '已登录' : '登录后可添加宝贝、创建任务' }}</text>
      </view>
      <text v-if="!userStore.isLoggedIn" class="user-login-arrow">›</text>
    </view>

    <!-- 我的宝贝卡片 -->
    <view class="card baby-card">
      <view class="card-title">我的宝贝</view>

      <!-- 有宝贝 -->
      <scroll-view v-if="store.childList.length" scroll-x class="baby-scroll" :show-scrollbar="false">
        <view class="baby-scroll-inner">
          <view
            v-for="child in store.childList"
            :key="child.id"
            class="baby-item"
            @click="goChildDetail(child.id)"
          >
            <view class="baby-avatar-wrap">
              <image
                v-if="child.avatar"
                :src="child.avatar"
                class="baby-avatar-img"
                mode="aspectFill"
              />
              <view v-else class="baby-avatar-default">
                <text>{{ child.gender === 'male' ? '👦' : child.gender === 'female' ? '👧' : '👶' }}</text>
              </view>
            </view>
            <text class="baby-name">{{ child.nickname }}</text>
          </view>

          <!-- 添加宝贝入口 -->
          <view class="baby-item baby-item--add" @click="goAddChild">
            <view class="baby-avatar-wrap baby-avatar-add">
              <text class="baby-add-icon">+</text>
            </view>
            <text class="baby-name baby-name--add">添加</text>
          </view>
        </view>
      </scroll-view>

      <!-- 无宝贝 -->
      <view v-else class="no-baby-section">
        <text class="no-baby-text">还没有添加宝贝</text>
        <view class="no-baby-btn" @click="goAddChild">
          <text>去添加宝贝</text>
          <text class="arrow">→</text>
        </view>
      </view>
    </view>

    <!-- 功能入口列表 -->
    <view class="menu-card">
      <view class="menu-item" @click="openGuide">
        <view class="menu-left">
          <text class="menu-text">养宠物玩法</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-divider" />
      <view class="menu-item" @click="goEvolutionGuide">
        <view class="menu-left">
          <text class="menu-text">宠物进化说明</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-divider" />
      <view class="menu-item" @click="goFriends">
        <view class="menu-left">
          <text class="menu-text">宠物圈好友</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-divider" />
      <!-- 审核整改：虚拟支付未接入官方能力，先隐藏购买入口，后续接入官方虚拟支付后放开
      <view class="menu-item" @click="goPricing">
        <view class="menu-left">
          <text class="menu-text">购买对话能量</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-divider" />
      -->
      <view class="menu-item" @click="goSettings">
        <view class="menu-left">
          <text class="menu-text">设置</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-divider" />
      <view class="menu-item" @click="handleMenu('feedback')">
        <view class="menu-left">
          <text class="menu-text">意见反馈</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-divider" />
      <view class="menu-item" @click="goTerms">
        <view class="menu-left">
          <text class="menu-text">用户协议</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-divider" />
      <view class="menu-item" @click="goPrivacy">
        <view class="menu-left">
          <text class="menu-text">隐私政策</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-divider" />
      <view class="menu-item" @click="handleMenu('about')">
        <view class="menu-left">
          <text class="menu-text">关于我们</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-divider" />
      <view class="menu-item menu-item--logout" v-if="userStore.isLoggedIn" @click="handleLogout">
        <view class="menu-left">
          <text class="menu-text logout-text">退出登录</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { useChildStore } from '@/stores/child'
import { useUserStore } from '@/stores/user'

const store = useChildStore()
const userStore = useUserStore()

// 头像加载失败兑底：<image> 报 error 时回退到占位
const avatarError = ref(false)
// 是否展示真实头像：已登录 + userInfo.avatar 有值 + 非默认占位图 + 未加载失败
// （userStore.avatar 计算属性空值时会回退为 /static/default-avatar.png，而该图为 1x1 透明占位，故需排除）
const hasAvatar = computed(() => {
  const a = userStore.userInfo?.avatar
  return userStore.isLoggedIn && !!a && a !== '/static/default-avatar.png' && !avatarError.value
})
// 占位文字：已登录取昵称首字，否则🐾
const avatarPlaceholderText = computed(() => {
  const n = userStore.nickname
  if (userStore.isLoggedIn && n && n !== '未登录') return n.charAt(0)
  return '🐾'
})
function onAvatarError() {
  avatarError.value = true
}

onShow(() => {
  // 游客态（审核整改）：未登录不拉取用户信息与宝贝列表，保持“点击登录”态。
  // 退出后 userStore 已清空、child store 已 reset，不重新拉取就不会残留旧用户/宝贝信息。
  if (userStore.isLoggedIn) {
    avatarError.value = false // 重置失败态，使登录后新头像能重试加载
    store.fetchChildList()
  }
})

const goAddChild = () => {
  // 游客模式（审核整改）：未登录先主动去登录
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '登录后使用', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 600)
    return
  }
  uni.navigateTo({ url: '/pages/parent/children/add' })
}

// 未登录时点击顶部用户区 → 主动进入登录页
const onUserAreaTap = () => {
  if (!userStore.isLoggedIn) uni.navigateTo({ url: '/pages/login/login' })
}

const openGuide = () => {
  uni.navigateTo({ url: '/pages/mine/about/index' })
}

const goEvolutionGuide = () => {
  uni.navigateTo({ url: '/pages/mine/evolution-guide/index' })
}

const goSettings = () => {
  uni.navigateTo({ url: '/pages/mine/settings/index' })
}

const goPricing = () => {
  uni.navigateTo({ url: '/pages/mine/pricing/index' })
}

const goFriends = () => {
  uni.navigateTo({ url: '/pages/mine/friends/index' })
}

const goTerms = () => {
  uni.navigateTo({ url: '/pages/terms/terms' })
}

const goPrivacy = () => {
  uni.navigateTo({ url: '/pages/privacy/privacy' })
}

const goChildDetail = (childId: string) => {
  uni.navigateTo({ url: `/pages/parent/children/detail?id=${childId}` })
}

const handleMenu = (key: string) => {
  if (key === 'feedback') {
    uni.navigateTo({ url: '/pages/feedback/list' })
    return
  }
  if (key === 'about') {
    // 临时打开揽云客官网
    uni.navigateTo({ url: `/pages/webview/index?url=${encodeURIComponent('https://lanyunke.com/#about')}` })
    return
  }
  const toasts: Record<string, string> = {
    member: '购买对话能量',
  }
  uni.showToast({ title: toasts[key] || '开发中', icon: 'none' })
}

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    },
  })
}
</script>

<style scoped>
.page-mine {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  padding-bottom: 40rpx;
}

/* 用户信息区 */
.user-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  margin: 24rpx 24rpx 0;
  padding: 32rpx 24rpx;
}
.user-card:active {
  background: #F5F5F5;
}
.user-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #EBE0FF;
  flex-shrink: 0;
}
.user-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-avatar-emoji {
  font-size: 48rpx;
  line-height: 1;
  color: #5B3E96;
}
.user-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}
.user-nickname {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-sub {
  font-size: 24rpx;
  color: #999;
}
.user-login-arrow {
  font-size: 40rpx;
  color: #CCC;
}

/* 我的宝贝卡片 */
.card {
  background: #fff;
  border-radius: 16rpx;
  margin: 24rpx 24rpx;
  padding: 28rpx 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

/* 宝贝横向滚动 */
.baby-scroll {
  width: 100%;
  white-space: nowrap;
}

.baby-scroll-inner {
  display: inline-flex;
  gap: 28rpx;
}

.baby-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.baby-avatar-wrap {
  width: 106rpx;
  height: 106rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid transparent;
  transition: border-color 0.2s;
}

.baby-item:active .baby-avatar-wrap {
  border-color: #333;
}

.baby-avatar-img {
  width: 100%;
  height: 100%;
}

.baby-avatar-default {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #D4C5F0;
  font-size: 48rpx;
}

.baby-name {
  font-size: 24rpx;
  color: #333;
  max-width: 120rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

/* 添加按钮 */
.baby-avatar-add {
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  border: 3rpx dashed #5B3E96;
  width: 106rpx;
  height: 106rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.baby-add-icon {
  font-size: 48rpx;
  color: #333;
  font-weight: 300;
  line-height: 1;
}

.baby-name--add {
  color: #333;
}

/* 无宝贝 */
.no-baby-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
}

.no-baby-text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 24rpx;
}

.no-baby-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 40rpx;
  background: #5B3E96;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.arrow {
  font-size: 26rpx;
}

/* 功能菜单 */
.menu-card {
  background: #fff;
  border-radius: 16rpx;
  margin: 0 24rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 24rpx;
}

.menu-item:active {
  background: #F5F5F5;
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-text {
  font-size: 34rpx;
  color: #333;
}

.menu-arrow {
  font-size: 36rpx;
  color: #CCC;
}

.menu-divider {
  height: 1rpx;
  background: #F0F0F0;
  margin: 0 24rpx;
}

.logout-text {
  color: #F44336;
}
</style>
