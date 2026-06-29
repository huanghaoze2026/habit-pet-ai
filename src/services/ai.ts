/**
 * AI 聊天服务
 *
 * 调用 POST /api/v1/ai/chat，携带 pet_level 参数。
 * 后端根据 pet_level 从 V2 Prompt 文档中选择对应阶段 Prompt 注入 AI。
 *
 * Prompt 选择逻辑（后端实现，前端只传递参数）：
 * - petLevel=0（Lv0 蛋仔期）：不走 AI，前端本地意图分类 + 预设回复
 * - petLevel=1-5（Lv1-5 幼体初期）：注入幼体初期 Prompt（热血笨蛋风格）
 * - petLevel=6-10（Lv6-10 幼体中后期）：注入幼体中后期 Prompt（少年感伙伴风格）
 */

import api from './api';
import { usePetStore } from '@/stores/pet';
import { useChildStore } from '@/stores/child';
// @ts-ignore - JSON import for UniApp
import intentMap from '@/utils/intent-map.json';
import { API_BASE_URL, TOKEN_KEY } from '@/utils/constants';

// ============ 类型定义 ============

/** 聊天请求 */
export interface ChatRequest {
  message: string;
  petLevel: number;
  history?: ChatMessage[];
}

/** 聊天响应 */
export interface ChatResponse {
  reply: string;
  emotion?: string;
  fireIntensity?: number;
  animationHint?: string;
  stage?: string;
}

/** 语音对话响应 */
export interface VoiceChatResponse {
  text: string;
  recognizedText: string;
}

/** 对话消息 */
export interface ChatMessage {
  role: 'user' | 'pet';
  content: string;
  timestamp: number;
  /** 是否为语音输入 */
  isVoice?: boolean;
}

// ============ 常量 ============

const CHAT_HISTORY_KEY = 'habitpet_chat_history';
const MAX_HISTORY_LENGTH = 20;

// ============ Lv0（蛋仔期）意图分类 + 预设回复 ============

/** 意图映射表类型 */
interface IntentCategory {
  name: string;
  priority: number;
  keywords: string[];
}

interface IntentMap {
  categories: Record<string, IntentCategory>;
}

/** Lv0 预设回复 fallback（writer 交付前使用，之后从 pet-texts.json 的 eggReplies 读取） */
const EGG_FALLBACKS: Record<string, string[]> = {
  greeting: [
    '咚！蛋壳晃了一下！有人在叫我！',
    '呼……火焰闪了闪。你、你好呀！',
    '（蛋壳发光）我是火龙蛋！你是谁？',
    '咚咚、咚咚！听到你了！',
    '咦？有声音！蛋壳里的火焰跳了一下！',
  ],
  mood: [
    '暖洋洋的…火焰在轻轻跳，这就是开心吧？',
    '蛋壳有点凉……火焰缩成一小团。',
    '火焰纹路在一闪一闪的～',
    '蛋壳温温的……像被太阳晒过。',
    '火焰在跳！像在跳舞一样！',
  ],
  emotion: [
    '呼……蛋壳贴着你，暖一暖。等我出来陪你。',
    '咚咚……别难过，我在这儿呢。',
    '火焰变小了……摸摸蛋壳好不好？',
    '蛋壳轻轻靠着你……我在听。',
    '等、等我破壳，换我抱着你！',
  ],
  curiosity: [
    '火焰还不够亮…打卡就能让我长大！',
    '等你完成任务，我就能攒到破壳的力量！',
    '快了快了！蛋壳已经有裂缝了……再来几次打卡？',
    '我也不知道什么时候…但是你坚持打卡，我就会变强！',
    '打卡就像给火焰加柴！多加几次我就出来啦！',
  ],
  other: [
    '（蛋壳发出咕噜声）……我在翻跟头！',
    '火焰纹路一闪一闪的，像在打暗号！',
    '咚、咚咚……蛋壳里在开音乐会！',
    '（蛋壳微微摇晃）好想快点见到你呀。',
    '呼噜……火焰缩成一小团打了个盹。',
  ],
};

/** 同会话去重：记录每个分类上次选取的回复索引 */
const lastReplyIndex: Map<string, number> = new Map();

/**
 * 根据用户消息匹配意图分类
 * 优先级：greeting > emotion > mood > curiosity > other
 *
 * @param message 用户消息
 * @returns 分类 key，匹配不到返回 "other"
 */
function classifyIntent(message: string): string {
  const map = intentMap as IntentMap;
  const lowerMsg = message.toLowerCase();

  // 按优先级排序：priority 越小越优先
  const sorted = Object.entries(map.categories).sort(
    ([, a], [, b]) => a.priority - b.priority,
  );

  for (const [key, cat] of sorted) {
    for (const kw of cat.keywords) {
      if (lowerMsg.includes(kw.toLowerCase())) {
        return key;
      }
    }
  }

  return 'other';
}

/**
 * 从指定分类选取回复（带去重）
 * - 同分类有 2 条以上回复时，避开上次索引
 * - 只有 1 条回复时可以重复
 */
function pickReply(category: string): string {
  const replies = EGG_FALLBACKS[category] || EGG_FALLBACKS.other;
  const lastIdx = lastReplyIndex.get(category);

  let index: number;
  if (replies.length <= 1) {
    index = 0;
  } else {
    do {
      index = Math.floor(Math.random() * replies.length);
    } while (index === lastIdx);
  }

  lastReplyIndex.set(category, index);
  return replies[index];
}

/**
 * 重置去重状态（切换宠物/退出聊天时调用）
 */
export function resetReplyDedup(): void {
  lastReplyIndex.clear();
}

// ============ 从后端加载对话历史 ============

/**
 * 从后端 API 加载对话历史（按 childId 隔离）
 */
async function getHistoryFromBackend(childId: string | null, limit: number = 30): Promise<ChatMessage[]> {
  if (!childId) return loadChatHistory();
  try {
    const res = await api.get<{ messages: Array<{ role: string; content: string; time: string }> }>(
      `/ai/history?childId=${encodeURIComponent(childId)}&limit=${limit}`
    );
    const data = (res as any).data || res;
    const msgs = data?.messages || [];
    return msgs.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'pet',
      content: m.content,
      timestamp: new Date(m.time).getTime(),
    }));
  } catch {
    // fallback to local
    return loadChatHistory();
  }
}

/**
 * 从后端加载对话历史（导出供 chat.vue 使用）
 */
export async function fetchChatHistory(childId: string | null): Promise<ChatMessage[]> {
  if (!childId) return loadChatHistory();
  try {
    const res = await api.get<{ messages: Array<{ role: string; content: string; time: string }> }>(
      `/ai/history?childId=${encodeURIComponent(childId)}&limit=30`
    );
    const data = (res as any).data || res;
    const msgs = data?.messages || [];
    return msgs.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'pet',
      content: m.content,
      timestamp: new Date(m.time).getTime(),
    }));
  } catch {
    return loadChatHistory();
  }
}

/**
 * 加载本地对话历史
 */
export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = uni.getStorageSync(CHAT_HISTORY_KEY);
    if (raw) {
      const history: ChatMessage[] = JSON.parse(raw);
      return Array.isArray(history) ? history.slice(-MAX_HISTORY_LENGTH) : [];
    }
  } catch { /* ignore */ }
  return [];
}

/**
 * 保存对话历史
 */
export function saveChatHistory(messages: ChatMessage[]): void {
  try {
    const toSave = messages.slice(-MAX_HISTORY_LENGTH);
    uni.setStorageSync(CHAT_HISTORY_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

/**
 * 清除对话历史
 */
export function clearChatHistory(): void {
  uni.removeStorageSync(CHAT_HISTORY_KEY);
}

// ============ API ============

/**
 * 语音对话：上传音频，获取识别文字 + AI 回复
 *
 * @param audioPath 录音临时文件路径
 * @param petLevel 宠物等级
 * @returns { text: AI回复, recognizedText: 识别文字 }
 */
export async function voiceChat(
  audioPath: string,
  petLevel: number,
): Promise<VoiceChatResponse> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/ai/voice-chat`,
      filePath: audioPath,
      name: 'audio',
      formData: { petLevel: petLevel.toString() },
      header: {
        Authorization: `Bearer ${uni.getStorageSync(TOKEN_KEY)}`,
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data) as VoiceChatResponse;
          resolve(data);
        } catch {
          reject(new Error('Failed to parse voice chat response'));
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * 发送消息给 AI 宠物
 *
 * @param text 用户消息文本
 * @returns AI 回复
 */
export async function sendMessage(text: string): Promise<ChatResponse> {
  const petStore = usePetStore();
  const childStore = useChildStore();
  const petLevel = petStore.petLevel;

  // Lv0 蛋仔期：不走 AI，意图分类 → 预设回复 → 去重
  if (petLevel === 0) {
    const category = classifyIntent(text);
    const reply = pickReply(category);
    return {
      reply,
      emotion: 'warm',
      fireIntensity: 0.5,
      stage: 'egg',
    };
  }

  // Lv1+：走 AI API（携带 childId 用于多孩隔离）
  const history = getHistoryFromBackend(childStore.currentChildId, 10);
  // 只取最近10条作为上下文
  const recentHistory = history.slice(-10);

  const res = await api.post<ChatResponse>('/ai/chat', {
    message: text,
    petLevel,
    history: recentHistory,
    childId: childStore.currentChildId,
  });

  return res.data;
}

// ============ 宠物欢迎语 ============

/**
 * 获取欢迎语（进入聊天页面时显示）
 * 根据 pet_level 返回不同阶段的欢迎语
 */
export function getWelcomeMessage(petLevel: number): string {
  if (petLevel === 0) {
    return '这是一颗散发着微微暖光的宠物蛋。它还不能说话，但你能感受到它在回应你……继续坚持打卡，它很快就能破壳和你见面了！🔥🥚';
  }
  if (petLevel >= 1 && petLevel <= 5) {
    return '嗷！主人你来啦！我刚刚在练习新技能——虽然还不熟练，我在努力！今天有什么冒险等着我们？🔥';
  }
  // Lv6+
  return '嗷呜～你来了！我正在晒太阳呢，今天状态不错。想和我聊点什么？';
}
