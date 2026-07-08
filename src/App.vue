<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { captureInviterFromOptions, tryAcceptPendingInvite } from '@/utils/invite';

const userStore = useUserStore();

onLaunch((options: any) => {
  console.log('[App] onLaunch', options);
  // 尽早捕获分享人ID(兼容 分享链接 inviter 与 扫码 scene)，存本地存储
  captureInviterFromOptions(options);
  // 检查登录状态
  userStore.checkLoginStatus();
});

onShow((options: any) => {
  console.log('[App] onShow', options);
  captureInviterFromOptions(options);
  // 已登录时尝试处理待处理邀请(免弹窗直接建好友)
  if (userStore.userId) tryAcceptPendingInvite(userStore.userId);
});

onHide(() => {
  console.log('[App] onHide');
});
</script>

<style lang="scss">
/* 全局样式 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 28rpx;
  color: #333;
  background-color: #f5f5f5;
  box-sizing: border-box;
}

view,
text,
image {
  box-sizing: border-box;
}

/* 全局 CSS 变量 */
:root {
  --color-primary: #4caf50;
  --color-primary-dark: #388e3c;
  --color-primary-light: #c8e6c9;
  --color-accent: #5B3E96;
  --color-danger: #f44336;
  --color-text: #6C3BB8333;
  --color-text-secondary: #7B5EA7999;
  --color-bg: #f5f5f5;
  --color-white: #ffffff;
  --color-border: #e0e0e0;
  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 24rpx;
  --shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}
</style>
