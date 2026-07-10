import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(pinia);
  return { app, pinia };
}

// ============ 路由守卫（已移除）============
// 审核整改·游客模式：不再做全局强制登录拦截。
// 打开小程序默认游客可浏览（任务/宠物圈/我的），
// 需要账号的操作由各页面 ensureLoginThen 按需主动跳登录页。
// 之前遗留的 navigateTo/switchTab 拦截器会在无 token 时把游客 reLaunch 到登录页，
// 导致「打开即登录页」、审核被拒，故整体删除。
