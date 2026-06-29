import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_INFO_KEY } from '@/utils/constants';

/** 用户信息接口 */
export interface UserInfo {
  userId: string;
  nickname: string;
  avatar: string | null;
  role: string;
  isNewUser?: boolean;
}

/** Token 信息接口 */
export interface TokenInfo {
  token: string;
  refreshToken?: string;
  expiresAt?: number;
}

export const useUserStore = defineStore('user', () => {
  // ============ 状态 ============
  const token = ref<string>('');
  const refreshToken = ref<string>('');
  const userInfo = ref<UserInfo | null>(null);
  const isLoggedIn = ref(false);
  const isNewUser = ref(false);

  // ============ 计算属性 ============
  const userId = computed(() => userInfo.value?.userId || '');
  const nickname = computed(() => userInfo.value?.nickname || '未登录');
  const avatar = computed(() => userInfo.value?.avatar || '/static/default-avatar.png');

  // ============ 方法 ============

  /**
   * 设置登录信息
   */
  function setLoginInfo(info: {
    token: string;
    refreshToken?: string;
    userId: string;
    nickname: string;
    avatar: string | null;
    role: string;
    isNewUser: boolean;
  }) {
    token.value = info.token;
    refreshToken.value = info.refreshToken || '';
    userInfo.value = {
      userId: info.userId,
      nickname: info.nickname,
      avatar: info.avatar,
      role: info.role,
      isNewUser: info.isNewUser,
    };
    isLoggedIn.value = true;
    isNewUser.value = info.isNewUser;

    // 持久化存储
    uni.setStorageSync(TOKEN_KEY, info.token);
    if (info.refreshToken) {
      uni.setStorageSync(REFRESH_TOKEN_KEY, info.refreshToken);
    }
    uni.setStorageSync(USER_INFO_KEY, JSON.stringify(userInfo.value));

    console.log('[UserStore] 登录成功:', info.nickname, info.isNewUser ? '(新用户)' : '');
  }

  /**
   * 更新用户信息
   */
  function updateUserInfo(partial: Partial<UserInfo>) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...partial };
      uni.setStorageSync(USER_INFO_KEY, JSON.stringify(userInfo.value));
    }
  }

  /**
   * 检查登录状态（App 启动时调用）
   */
  function checkLoginStatus(): boolean {
    try {
      const savedToken = uni.getStorageSync(TOKEN_KEY);
      const savedRefreshToken = uni.getStorageSync(REFRESH_TOKEN_KEY);
      const savedUserInfo = uni.getStorageSync(USER_INFO_KEY);

      if (savedToken && savedUserInfo) {
        token.value = savedToken;
        refreshToken.value = savedRefreshToken || '';
        userInfo.value = JSON.parse(savedUserInfo);
        isLoggedIn.value = true;
        console.log('[UserStore] 已恢复登录状态:', userInfo.value?.nickname);
        return true;
      }
    } catch (e) {
      console.error('[UserStore] 恢复登录状态失败:', e);
    }
    return false;
  }

  /**
   * 刷新 Token
   */
  async function doRefreshToken(): Promise<boolean> {
    if (!refreshToken.value) return false;

    try {
      const res = await uni.request({
        url: `${getApp().globalData?.apiBaseUrl || ''}/auth/refresh`,
        method: 'POST',
        data: { refreshToken: refreshToken.value },
      });

      const data = res.data as { code: number; data: { token: string; refreshToken?: string } };
      if (data.code === 200 && data.data?.token) {
        token.value = data.data.token;
        if (data.data.refreshToken) {
          refreshToken.value = data.data.refreshToken;
          uni.setStorageSync(REFRESH_TOKEN_KEY, data.data.refreshToken);
        }
        uni.setStorageSync(TOKEN_KEY, data.data.token);
        console.log('[UserStore] Token 刷新成功');
        return true;
      }
    } catch (e) {
      console.error('[UserStore] Token 刷新失败:', e);
    }

    // 刷新失败，清除登录状态
    logout();
    return false;
  }

  /**
   * 退出登录
   */
  function logout() {
    token.value = '';
    refreshToken.value = '';
    userInfo.value = null;
    isLoggedIn.value = false;
    isNewUser.value = false;

    uni.removeStorageSync(TOKEN_KEY);
    uni.removeStorageSync(REFRESH_TOKEN_KEY);
    uni.removeStorageSync(USER_INFO_KEY);

    uni.reLaunch({ url: '/pages/login/login' });
    console.log('[UserStore] 已退出登录');
  }

  /**
   * 获取认证头
   */
  function getAuthHeader(): { Authorization: string } | Record<string, never> {
    if (token.value) {
      return { Authorization: `Bearer ${token.value}` };
    }
    return {};
  }

  return {
    // 状态
    token,
    refreshToken,
    userInfo,
    isLoggedIn,
    isNewUser,
    // 计算属性
    userId,
    nickname,
    avatar,
    // 方法
    setLoginInfo,
    updateUserInfo,
    checkLoginStatus,
    doRefreshToken,
    logout,
    getAuthHeader,
  };
});
