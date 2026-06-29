/**
 * 宠物状态管理 Store
 *
 * 管理宠物核心数据：等级、心情、亲密度、阶段等。
 * 通过 API GET /api/v1/pets/:id/status 同步服务端状态。
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

// ============ 类型定义 ============

/** 宠物阶段 */
export type PetStage = 'egg' | 'baby' | 'juvenile';

/** 进化状态 */
export type EvolveState = 'none' | 'ready' | 'animating' | 'done';

/** 宠物动画状态 */
export type PetAnimState = 'idle' | 'happy' | 'hungry';

/** 宠物状态（服务端返回） */
export interface PetStatus {
  petId: string;
  name: string;
  level: number;
  exp: number;
  expPercent: number;     // 0-1 当前等级经验进度
  mood: number;           // 0-100
  affection: number;      // 亲密度
  stage: PetStage;
  affectionToday: number; // 今日已互动次数
  maxAffectionDaily: number; // 每日最大互动次数
  lastFedAt: string | null;
  traits: string[];
}

/** 本地缓存结构 */
interface LocalPetCache {
  petStatus: PetStatus;
  cachedAt: number;
}

// ============ 阶段计算工具 ============

export function deriveStage(level: number): PetStage {
  if (level <= 0) return 'egg';
  if (level <= 5) return 'baby';
  return 'juvenile';
}

export function deriveStageName(stage: PetStage): string {
  // P57: 通用阶段名称 — 不绑定特定物种
  const map: Record<PetStage, string> = {
    egg: '蛋仔期',
    baby: '幼体期',
    juvenile: '成长期',
  };
  return map[stage];
}

export function deriveStageLabel(stage: PetStage): string {
  // P57: 通用阶段标签 — 不绑定特定物种
  const map: Record<PetStage, string> = {
    egg: '🥚 蛋仔期',
    baby: '🔥 幼体期',
    juvenile: '🐉 成长期',
  };
  return map[stage];
}

// ============ 默认状态 ============

function createDefaultStatus(): PetStatus {
  return {
    petId: '',
    name: '宠物',
    level: 0,
    exp: 0,
    expPercent: 0,
    mood: 50,
    affection: 0,
    stage: 'egg',
    affectionToday: 0,
    maxAffectionDaily: 20,
    lastFedAt: null,
    traits: [],
  };
}

// ============ Store ============

export const usePetStore = defineStore('pet', () => {
  // ---- 状态 ----
  const petStatus = ref<PetStatus>(createDefaultStatus());
  const isLoading = ref(false);
  const isError = ref(false);
  const errorMessage = ref('');
  const isAnimatingHappy = ref(false); // 跨页面开心标记
  const lastCheckinEnergy = ref(0);    // 最近一次打卡获得的能量
  const evolveState = ref<EvolveState>('none'); // 进化状态

  // ---- 计算属性 ----
  const petId = computed(() => petStatus.value.petId);
  const petName = computed(() => petStatus.value.name);
  const petLevel = computed(() => petStatus.value.level);
  const petMood = computed(() => petStatus.value.mood);
  const petAffection = computed(() => petStatus.value.affection);
  const petStage = computed(() => petStatus.value.stage);
  const stageName = computed(() => deriveStageName(petStage.value));
  const stageLabel = computed(() => deriveStageLabel(petStage.value));
  const affectionToday = computed(() => petStatus.value.affectionToday);
  const maxAffectionDaily = computed(() => petStatus.value.maxAffectionDaily);
  const canInteract = computed(() => petStatus.value.affectionToday < petStatus.value.maxAffectionDaily);

  /** 心情文字描述 */
  const moodLabel = computed(() => {
    const m = petMood.value;
    if (m >= 90) return '超级开心 🔥🔥';
    if (m >= 70) return '心情不错 😊';
    if (m >= 50) return '还行 🙂';
    if (m >= 30) return '有点低落 😔';
    return '需要关怀 💔';
  });

  /** 根据心情推导宠物动画状态 */
  const animState = computed<PetAnimState>(() => {
    if (isAnimatingHappy.value) return 'happy';
    const m = petMood.value;
    if (m < 30) return 'hungry';
    return 'idle';
  });

  // ---- 方法 ----

  /**
   * 从服务端获取宠物状态
   * @param pidOrChildId 宠物ID或孩子ID（优先使用 childId 查询）
   */
  async function fetchPetStatus(pidOrChildId?: string): Promise<void> {
    isLoading.value = true;
    isError.value = false;
    errorMessage.value = '';

    try {
      // 如果传入了 childId，使用 childId 查询宠物状态
      if (pidOrChildId) {
        // 尝试通过 GET /api/v1/pet/status?childId=xxx 获取
        const res = await api.get<PetStatus>(`/pet/status?childId=${encodeURIComponent(pidOrChildId)}`);
        if (res.code === 200 && res.data) {
          petStatus.value = {
            ...petStatus.value,
            ...res.data,
          };
          saveToCache();
          return;
        }
      }

      const targetId = pidOrChildId || petStatus.value.petId;
      if (!targetId) {
        // 没有 petId，尝试从缓存加载
        loadFromCache();
        return;
      }

      const res = await api.get<PetStatus>(`/pets/${targetId}/status`);
      if (res.code === 200 && res.data) {
        petStatus.value = {
          ...petStatus.value,
          ...res.data,
        };
        saveToCache();
      } else {
        // 服务端未返回有效数据，使用缓存
        loadFromCache();
      }
    } catch (e) {
      console.error('[PetStore] 获取宠物状态失败:', e);
      isError.value = true;
      errorMessage.value = '获取宠物状态失败，使用本地数据';
      // 优雅降级：使用本地缓存
      loadFromCache();
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 从本地缓存加载
   */
  function loadFromCache(): void {
    try {
      const cached = uni.getStorageSync('pet_store_cache');
      if (cached) {
        const data: LocalPetCache = JSON.parse(cached);
        // 缓存有效期 30 分钟
        if (Date.now() - data.cachedAt < 30 * 60 * 1000) {
          petStatus.value = { ...petStatus.value, ...data.petStatus };
          return;
        }
      }
    } catch { /* ignore */ }

    // 无有效缓存，使用默认值 + 旧的本地数据兼容
    const savedState = uni.getStorageSync('pet_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        petStatus.value = {
          ...petStatus.value,
          affection: state.affection || 0,
          mood: state.mood || 50,
          level: state.level || 0,
          stage: deriveStage(state.level || 0),
          petId: 'local-fallback',
          name: '宠物',
        };
      } catch { /* ignore */ }
    }

    // 读取今日互动次数
    const today = new Date().toISOString().split('T')[0];
    const savedDate = uni.getStorageSync('pet_interaction_date');
    if (savedDate === today) {
      petStatus.value.affectionToday = uni.getStorageSync('pet_interaction_count') || 0;
    } else {
      petStatus.value.affectionToday = 0;
      uni.setStorageSync('pet_interaction_date', today);
      uni.setStorageSync('pet_interaction_count', 0);
    }
  }

  /**
   * 保存到本地缓存
   */
  function saveToCache(): void {
    try {
      const cache: LocalPetCache = {
        petStatus: { ...petStatus.value },
        cachedAt: Date.now(),
      };
      uni.setStorageSync('pet_store_cache', JSON.stringify(cache));
    } catch { /* ignore */ }
  }

  /**
   * 更新本地宠物状态（乐观更新）
   */
  function updateLocalStatus(partial: Partial<PetStatus>): void {
    petStatus.value = { ...petStatus.value, ...partial };
    if (partial.level !== undefined) {
      petStatus.value.stage = deriveStage(partial.level);
    }
    saveToCache();
  }

  /**
   * 设置开心动画标记（跨页面通知）
   */
  function triggerHappyAnim(durationMs: number = 2000): void {
    isAnimatingHappy.value = true;
    setTimeout(() => {
      isAnimatingHappy.value = false;
    }, durationMs);
  }

  /**
   * 检查是否可以进化
   * MVP: 蛋→幼体(level≥5)，幼体→少年(level≥10)
   */
  function checkEvolve(): void {
    if (evolveState.value !== 'none') return;

    const stage = petStatus.value.stage;
    const level = petStatus.value.level;

    if (stage === 'egg' && level >= 5) {
      evolveState.value = 'ready';
    } else if (stage === 'baby' && level >= 10) {
      evolveState.value = 'ready';
    }
  }

  /**
   * 调用后端进化 API
   */
  async function evolve(): Promise<{ newStage: string; message: string } | null> {
    const pid = petStatus.value.petId;
    if (!pid) return null;

    try {
      const res = await api.post<{
        petId: string;
        newStage: string;
        animate: boolean;
        message: string;
      }>(`/pets/${pid}/evolve`);

      if (res.code === 200 && res.data) {
        return {
          newStage: res.data.newStage,
          message: res.data.message,
        };
      }
      return null;
    } catch (e) {
      console.error('[PetStore] 进化失败:', e);
      return null;
    }
  }

  /**
   * 进化完成后更新状态
   */
  function completeEvolve(newStage: string): void {
    petStatus.value.stage = newStage as PetStage;
    evolveState.value = 'done';
    saveToCache();

    // 3秒后重置进化状态
    setTimeout(() => {
      evolveState.value = 'none';
      checkEvolve(); // 再次检查是否还有进化条件
    }, 3000);
  }

  /**
   * 重置进化状态
   */
  function resetEvolveState(): void {
    evolveState.value = 'none';
  }
  function setLastCheckinEnergy(energy: number): void {
    lastCheckinEnergy.value = energy;
    // 3秒后清零
    setTimeout(() => {
      lastCheckinEnergy.value = 0;
    }, 3000);
  }

  /**
   * 重置（退出登录时）
   */
  function reset(): void {
    petStatus.value = createDefaultStatus();
    isLoading.value = false;
    isError.value = false;
    errorMessage.value = '';
    isAnimatingHappy.value = false;
    lastCheckinEnergy.value = 0;
    uni.removeStorageSync('pet_store_cache');
  }

  return {
    // 状态
    petStatus,
    isLoading,
    isError,
    errorMessage,
    isAnimatingHappy,
    lastCheckinEnergy,
    evolveState,
    // 计算属性
    petId,
    petName,
    petLevel,
    petMood,
    petAffection,
    petStage,
    stageName,
    stageLabel,
    affectionToday,
    maxAffectionDaily,
    canInteract,
    moodLabel,
    animState,
    // 方法
    fetchPetStatus,
    loadFromCache,
    updateLocalStatus,
    triggerHappyAnim,
    setLastCheckinEnergy,
    checkEvolve,
    evolve,
    completeEvolve,
    resetEvolveState,
    reset,
  };
});
