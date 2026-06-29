<template>
  <view class="chat-page">
    <!-- 消息列表 -->
    <scroll-view
      ref="scrollRef"
      class="message-list"
      :scroll-y="true"
      :scroll-with-animation="true"
      :scroll-top="scrollTop"
      @scrolltoupper="handleScrollToUpper"
    >
      <!-- 加载更多 -->
      <view v-if="hasMoreHistory" class="load-more">
        <text v-if="!loadingHistory" class="load-more-text" @tap="loadMoreHistory">
          查看更早的消息
        </text>
        <text v-else class="load-more-text">加载中...</text>
      </view>

      <!-- 消息列表 -->
      <ChatBubble
        v-for="(msg, idx) in messages"
        :key="idx"
        :role="msg.role"
        :content="msg.content"
        :is-streaming="isStreaming && idx === messages.length - 1 && msg.role === 'pet'"
        :is-voice="msg.isVoice || false"
        :pet-avatar="'/static/pet-default.png'"
      />

      <!-- 空状态 -->
      <view v-if="messages.length === 0" class="empty-state">
        <text class="empty-icon">💬</text>
        <text class="empty-text">和你的宠物说点什么吧！</text>
        <text class="empty-hint">
          {{ petLevel === 0 ? '蛋仔还不能说话，但它在倾听...' : '聊聊你的心情、今天的事、或者随便什么' }}
        </text>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-spacer" />
    </scroll-view>

    <!-- 输入区域 -->
    <view class="input-area">
      <!-- 录音中状态 -->
      <view v-if="isRecording" class="recording-bar">
        <view class="recording-wave">
          <view v-for="i in 5" :key="i" class="wave-bar" :style="{ animationDelay: (i * 0.1) + 's' }" />
        </view>
        <text class="recording-text">正在听你说话… {{ recordingSeconds }}s</text>
      </view>

      <!-- 上传中状态 -->
      <view v-else-if="isUploadingVoice" class="recording-bar uploading">
        <view class="upload-spinner" />
        <text class="recording-text">宠物正在听…</text>
      </view>

      <!-- 正常输入 -->
      <template v-else>
        <view class="input-wrapper">
          <input
            v-model="inputText"
            class="chat-input"
            type="text"
            :placeholder="inputPlaceholder"
            :disabled="isSending"
            confirm-type="send"
            @confirm="handleSend"
            maxlength="500"
          />
        </view>
      </template>

      <!-- 麦克风按钮 -->
      <button
        class="mic-btn"
        :class="{ recording: isRecording, uploading: isUploadingVoice }"
        :disabled="isSending"
        @touchstart.prevent="startRecording"
        @touchend.prevent="stopRecording"
      >
        <text class="mic-icon">🎤</text>
      </button>

      <!-- 发送按钮（录音/上传中隐藏） -->
      <button
        v-if="!isRecording && !isUploadingVoice"
        class="send-btn"
        :class="{ active: inputText.trim().length > 0 && !isSending }"
        :disabled="inputText.trim().length === 0 || isSending"
        @tap="handleSend"
      >
        <text v-if="!isSending">发送</text>
        <view v-else class="send-loading">
          <view class="send-dot" />
        </view>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import {
  sendMessage, voiceChat, loadChatHistory, saveChatHistory, fetchChatHistory,
  getWelcomeMessage, type ChatMessage,
} from '@/services/ai';
import { usePetStore } from '@/stores/pet';
import { useChildStore } from '@/stores/child';
import ChatBubble from '@/components/chat-bubble/index.vue';

// ============ Store ============
const petStore = usePetStore();
const childStore = useChildStore();

// ============ 状态 ============
const messages = ref<ChatMessage[]>([]);
const inputText = ref('');
const isSending = ref(false);
const isStreaming = ref(false);
const scrollTop = ref(0);
const hasMoreHistory = ref(false);
const loadingHistory = ref(false);

// 语音录制状态
const isRecording = ref(false);
const isUploadingVoice = ref(false);
const recordingSeconds = ref(0);
let recordTimer: ReturnType<typeof setInterval> | null = null;
let recorderManager: UniApp.RecorderManager | null = null;

// 防抖
let sendTimer: ReturnType<typeof setTimeout> | null = null;

// ============ 计算属性 ============
const petLevel = computed(() => petStore.petLevel);

const inputPlaceholder = computed(() => {
  if (petLevel.value === 0) return '蛋仔在倾听你的心声...';
  return '和宠物聊聊天吧...';
});

// ============ 生命周期 ============
onMounted(async () => {
  // 确保宠物数据已加载
  if (!petStore.petId) {
    await petStore.loadFromCache();
  }

  // 确保 child 数据已加载
  if (!childStore.currentChildId) {
    await childStore.fetchChildList();
  }

  // 初始化录音管理器
  initRecorder();

  // 从后端加载历史消息（按 childId 隔离）
  const history = await fetchChatHistory(childStore.currentChildId);
  if (history.length > 0) {
    messages.value = history;
    hasMoreHistory.value = history.length >= 30;
    // 同步到本地
    saveChatHistory(messages.value);
    scrollToBottom(100);
  } else {
    // 本地 fallback
    const localHistory = loadChatHistory();
    if (localHistory.length > 0) {
      messages.value = localHistory;
      scrollToBottom(100);
    } else {
      // 首次打开：显示欢迎语
      const welcome = getWelcomeMessage(petLevel.value);
      messages.value = [{
        role: 'pet',
        content: welcome,
        timestamp: Date.now(),
      }];
      saveChatHistory(messages.value);
    }
  }
});

onBeforeUnmount(() => {
  if (recordTimer) clearInterval(recordTimer);
  if (recorderManager) {
    try { recorderManager.stop(); } catch { /* ignore */ }
  }
});

// ============ 方法 ============

/**
 * 发送消息
 */
async function handleSend() {
  const text = inputText.value.trim();
  if (!text || isSending.value) return;

  // 防抖（实际上 confirm 事件已经天然防抖，但加一层保护）
  if (sendTimer) clearTimeout(sendTimer);

  sendTimer = setTimeout(async () => {
    await doSend(text);
  }, 150);
}

async function doSend(text: string) {
  isSending.value = true;
  const userMsg: ChatMessage = {
    role: 'user',
    content: text,
    timestamp: Date.now(),
  };

  // 添加用户消息
  messages.value.push(userMsg);
  inputText.value = '';
  scrollToBottom();

  // 先添加一个空的宠物消息占位
  const petMsgIndex = messages.value.length;
  const petMsg: ChatMessage = {
    role: 'pet',
    content: '...',
    timestamp: Date.now(),
  };
  messages.value.push(petMsg);
  isStreaming.value = true;
  scrollToBottom();

  try {
    const res = await sendMessage(text);

    // 替换占位消息
    messages.value[petMsgIndex] = {
      role: 'pet',
      content: res.reply,
      timestamp: Date.now(),
    };
  } catch {
    // 聊天失败兜底
    messages.value[petMsgIndex] = {
      role: 'pet',
      content: getFallbackReply(petLevel.value),
      timestamp: Date.now(),
    };
  } finally {
    isStreaming.value = false;
    isSending.value = false;
    saveChatHistory(messages.value);
    scrollToBottom();
  }
}

/**
 * 加载更多历史消息
 */
async function loadMoreHistory() {
  loadingHistory.value = true;
  // 本地缓存只存最近20条，所以"更早"只是标记
  hasMoreHistory.value = false;
  loadingHistory.value = false;
  uni.showToast({ title: '没有更早的消息了', icon: 'none', duration: 1500 });
}

/**
 * 滚动到底部
 */
function scrollToBottom(delay: number = 50) {
  nextTick(() => {
    setTimeout(() => {
      // 滚动到底部
      scrollTop.value = 99999;
    }, delay);
  });
}

/**
 * 滚动到顶部回调
 */
function handleScrollToUpper() {
  if (hasMoreHistory.value && !loadingHistory.value) {
    loadMoreHistory();
  }
}

// ============ 语音录制 ============

/**
 * 初始化录音管理器
 */
function initRecorder() {
  recorderManager = uni.getRecorderManager();

  recorderManager.onStart(() => {
    isRecording.value = true;
    recordingSeconds.value = 0;
    recordTimer = setInterval(() => {
      recordingSeconds.value++;
      // 最长 60 秒自动停止
      if (recordingSeconds.value >= 60) {
        stopRecording();
      }
    }, 1000);
  });

  recorderManager.onStop((res) => {
    isRecording.value = false;
    if (recordTimer) {
      clearInterval(recordTimer);
      recordTimer = null;
    }
    // 录音时长小于 1 秒视为误触
    if (res.duration < 1000) {
      uni.showToast({ title: '说话时间太短了哦～', icon: 'none', duration: 1500 });
      return;
    }
    handleVoiceUpload(res.tempFilePath);
  });

  recorderManager.onError((err) => {
    isRecording.value = false;
    if (recordTimer) {
      clearInterval(recordTimer);
      recordTimer = null;
    }
    console.error('Recorder error:', err);
    uni.showToast({ title: '麦克风出错了，再试试吧～', icon: 'none', duration: 1500 });
  });
}

/**
 * 开始录音（先停止当前语音播放）
 */
function startRecording() {
  if (isSending.value || isRecording.value) return;
  // 停止当前正在播放的语音
  uni.stopVoice();
  const audioCtx = uni.createInnerAudioContext();
  try { audioCtx.stop(); } catch { /* ignore */ }
  audioCtx.destroy();
  recorderManager?.start({
    format: 'mp3',
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 48000,
  });
}

/**
 * 停止录音
 */
function stopRecording() {
  recorderManager?.stop();
}

/**
 * 处理语音上传
 */
async function handleVoiceUpload(tempFilePath: string) {
  isUploadingVoice.value = true;

  try {
    const res = await voiceChat(tempFilePath, petLevel.value);

    // 识别文字为空 → 兜底
    if (!res.recognizedText) {
      // 添加宠物兜底消息
      messages.value.push({
        role: 'pet',
        content: res.text || '嗷呜…没听清楚，可以再说一遍吗？',
        timestamp: Date.now(),
      });
      saveChatHistory(messages.value);
      scrollToBottom();
      return;
    }

    // 添加用户消息（语音标识）
    messages.value.push({
      role: 'user',
      content: res.recognizedText,
      timestamp: Date.now(),
      isVoice: true,
    });

    // 添加 AI 回复
    messages.value.push({
      role: 'pet',
      content: res.text || '嗷呜～我听到了！',
      timestamp: Date.now(),
    });

    saveChatHistory(messages.value);
    scrollToBottom();
  } catch {
    uni.showToast({ title: '没听清楚，可以再说一遍吗？', icon: 'none', duration: 1500 });
  } finally {
    isUploadingVoice.value = false;
  }
}

/**
 * 兜底回复
 */
function getFallbackReply(level: number): string {
  if (level === 0) {
    const replies = [
      '……（蛋壳温暖地发光）',
      '蛋壳上的火焰纹路闪烁了一下',
      '咚……里面好像有动静',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
  if (level <= 5) {
    const replies = [
      '嗷呜！我听到了！虽然没太懂但是感觉很厉害！',
      '主人主人你说什么？我光顾着看你了！',
      '嗯嗯嗯！我完全同意！……虽然我刚走神了嘿嘿。',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
  const replies = [
    '嗷呜～这个想法不错！我们要不要一起试试？',
    '有意思！继续说，我在听着呢～',
    '嘿嘿，和你聊天真开心。我们聊到哪了？',
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}
</script>

<style lang="scss" scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

// ===== 消息列表 =====
.message-list {
  flex: 1;
  padding: 24rpx 28rpx;
  overflow-y: auto;
}

.load-more {
  text-align: center;
  padding: 24rpx 0;
}

.load-more-text {
  font-size: 24rpx;
  color: #333;
  text-decoration: underline;
}

// ===== 空状态 =====
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 250rpx;
  gap: 16rpx;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.empty-hint {
  font-size: 24rpx;
  color: #333;
  text-align: center;
  max-width: 400rpx;
}

// ===== 底部占位 =====
.bottom-spacer {
  height: 20rpx;
}

// ===== 输入区域 =====
.input-area {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #e8e8e8;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.input-wrapper {
  flex: 1;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 0 28rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
}

.chat-input {
  width: 100%;
  height: 100%;
  font-size: 28rpx;
  color: #333;
}

.send-btn {
  width: 120rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: #e0e0e0;
  color: #333;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: all 0.2s ease;

  &::after { border: none; }

  &.active {
    background: linear-gradient(135deg, #FF8E9E, #FFB3C1);
    color: #ffffff;
    box-shadow: 0 4rpx 12rpx rgba(255, 126, 185, 0.25);
  }
}

.send-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #FF8E9E;
  animation: dotPulse 0.8s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.1); }
}

// ===== 麦克风按钮 =====
.mic-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #f0f0f0;
  border: 2rpx solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &::after { border: none; }

  &.recording {
    background: #ff4444;
    border-color: #ff4444;
    animation: micPulse 0.8s ease-in-out infinite;
    box-shadow: 0 0 20rpx rgba(255, 68, 68, 0.4);

    .mic-icon {
      color: #ffffff;
    }
  }

  &.uploading {
    background: #FF8E9E;
    border-color: #FF8E9E;
    opacity: 0.7;
  }

  &:active {
    transform: scale(0.95);
  }
}

.mic-icon {
  font-size: 36rpx;
  line-height: 1;
}

@keyframes micPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 16rpx rgba(255, 68, 68, 0);
  }
}

// ===== 录音状态栏 =====
.recording-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 28rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #f5f0ff, #ede9fe);
  border-radius: 40rpx;
  border: 2rpx solid #ddd6fe;

  &.uploading {
    background: linear-gradient(135deg, #f0ebff, #f0ebff);
    border-color: #e9d5ff;
  }
}

.recording-wave {
  display: flex;
  align-items: center;
  gap: 4rpx;
  height: 40rpx;
}

.wave-bar {
  width: 6rpx;
  height: 20rpx;
  background: #ff4444;
  border-radius: 3rpx;
  animation: waveAnim 0.6s ease-in-out infinite;
}

@keyframes waveAnim {
  0%, 100% { height: 12rpx; }
  50% { height: 36rpx; }
}

.recording-text {
  font-size: 26rpx;
  color: #7c3aed;
  font-weight: 500;

  .uploading & {
    color: #cc8800;
  }
}

.upload-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid #e9d5ff;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
