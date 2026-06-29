/**
 * 多孩切换状态管理 Store
 *
 * 管理当前选中的孩子（childId），以及对应的孩子列表。
 * 通过 API GET /api/v1/parent/children 获取孩子列表。
 * 切换孩子时，页面会重新请求对应的数据。
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getChildren, type ChildListItem } from '@/services/parent';

// ============ 类型定义 ============

/** 孩子摘要（用于 switcher 组件） */
export interface ChildSummary {
  id: string;
  nickname: string;
  avatar?: string;
  gender?: string;
}

// ============ Store ============

export const useChildStore = defineStore('child', () => {
  // ---- 状态 ----
  const currentChildId = ref<string | null>(null);
  const currentIndex = ref(0);
  const childList = ref<ChildSummary[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);
  const loaded = ref(false);

  // ---- 计算属性 ----
  const currentChild = computed(() => childList.value[currentIndex.value] || null);

  const hasChildren = computed(() => childList.value.length > 0);

  // ---- 方法 ----

  /**
   * 从服务器获取孩子列表
   *
   * 调用 GET /api/v1/parent/children
   * 存入 childList，默认选中第一个
   */
  async function fetchChildList(force?: boolean): Promise<void> {
    if (!force && loaded.value) return;

    isLoading.value = true;
    isError.value = false;

    try {
      const children = await getChildren();
      childList.value = children.map((c: ChildListItem) => ({
        id: c.id,
        nickname: c.nickname,
        avatar: c.avatar,
        gender: c.gender,
      }));

      // 默认选中第一个
      if (childList.value.length > 0) {
        // 从本地缓存恢复上次选中的孩子
        const savedChildId = uni.getStorageSync('current_child_id');
        const savedIndex = childList.value.findIndex((c) => c.id === savedChildId);

        if (savedIndex >= 0) {
          currentIndex.value = savedIndex;
          currentChildId.value = childList.value[savedIndex].id;
        } else {
          currentIndex.value = 0;
          currentChildId.value = childList.value[0].id;
          saveCurrentChild();
        }
      } else {
        currentChildId.value = null;
        currentIndex.value = 0;
      }

      loaded.value = true;
    } catch (e) {
      console.error('[ChildStore] 获取孩子列表失败:', e);
      isError.value = true;
      // 降级：使用本地缓存
      loadFromCache();
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 切换到指定索引的孩子
   */
  function switchTo(index: number): void {
    if (index >= 0 && index < childList.value.length) {
      currentIndex.value = index;
      currentChildId.value = childList.value[index]?.id || null;
      saveCurrentChild();
    }
  }

  /**
   * 根据 childId 切换
   */
  function switchToChild(childId: string): void {
    const index = childList.value.findIndex((c) => c.id === childId);
    if (index >= 0) {
      currentIndex.value = index;
      currentChildId.value = childId;
      saveCurrentChild();
    }
  }

  /**
   * 保存当前选中的孩子到本地缓存
   */
  function saveCurrentChild(): void {
    try {
      uni.setStorageSync('current_child_id', currentChildId.value || '');
    } catch { /* ignore */ }
  }

  /**
   * 从本地缓存加载
   */
  function loadFromCache(): void {
    try {
      const cached = uni.getStorageSync('child_list_cache');
      if (cached) {
        const list = JSON.parse(cached) as ChildSummary[];
        if (list.length > 0) {
          childList.value = list;
          const savedChildId = uni.getStorageSync('current_child_id');
          const savedIndex = list.findIndex((c) => c.id === savedChildId);
          if (savedIndex >= 0) {
            currentIndex.value = savedIndex;
            currentChildId.value = list[savedIndex].id;
          } else {
            currentIndex.value = 0;
            currentChildId.value = list[0].id;
          }
        }
      }
    } catch { /* ignore */ }
  }

  /**
   * 重置（退出登录时）
   */
  function reset(): void {
    currentChildId.value = null;
    currentIndex.value = 0;
    childList.value = [];
    isLoading.value = false;
    isError.value = false;
    loaded.value = false;
    uni.removeStorageSync('current_child_id');
    uni.removeStorageSync('child_list_cache');
  }

  return {
    // 状态
    currentChildId,
    currentIndex,
    childList,
    isLoading,
    isError,
    loaded,
    // 计算属性
    currentChild,
    hasChildren,
    // 方法
    fetchChildList,
    switchTo,
    switchToChild,
    reset,
  };
});
