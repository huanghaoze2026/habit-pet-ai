import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(pinia);
  return { app, pinia };
}

// ============ 路由守卫 ============
// 未登录时所有页面拦截跳转登录

// 白名单：无需登录即可访问的页面
const whiteList: string[] = ['pages/login/login'];

// 路由拦截器
uni.addInterceptor('navigateTo', {
  invoke(args) {
    // 检查登录状态
    const token = uni.getStorageSync('habitpet_token');
    const targetPage = (args as { url: string }).url.split('?')[0];

    // 白名单页面放行
    if (whiteList.some((page) => targetPage.includes(page))) {
      return true;
    }

    // 未登录 → 跳转登录页
    if (!token) {
      uni.reLaunch({ url: '/pages/login/login' });
      return false;
    }

    return true;
  },
});

uni.addInterceptor('switchTab', {
  invoke(args) {
    const token = uni.getStorageSync('habitpet_token');
    const targetPage = (args as { url: string }).url.split('?')[0];

    if (whiteList.some((page) => targetPage.includes(page))) {
      return true;
    }

    if (!token) {
      uni.reLaunch({ url: '/pages/login/login' });
      return false;
    }

    return true;
  },
});

uni.addInterceptor('reLaunch', {
  invoke(args) {
    // reLaunch 本身用于全局跳转（如退出登录），不做拦截
    return true;
  },
});
