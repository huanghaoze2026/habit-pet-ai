<template>
  <view
    class="child-switcher"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <view
      class="switcher-left"
      :class="{ disabled: currentIndex <= 0 }"
      @tap="switchPrev"
      v-if="children.length > 1"
    >
      <text class="arrow-icon">◀</text>
    </view>
    <view class="switcher-center">
      <text class="child-name">{{ currentChild?.nickname || '未选择' }}</text>
      <text class="child-index" v-if="children.length > 1">{{ currentIndex + 1 }}/{{ children.length }}</text>
    </view>
    <view
      class="switcher-right"
      :class="{ disabled: currentIndex >= children.length - 1 }"
      @tap="switchNext"
      v-if="children.length > 1"
    >
      <text class="arrow-icon">▶</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface ChildItem {
  id: string;
  nickname: string;
  avatar?: string;
}

const props = withDefaults(
  defineProps<{
    children: ChildItem[];
    currentIndex: number;
  }>(),
  {
    children: () => [],
    currentIndex: 0,
  },
);

const emit = defineEmits<{
  switch: [childId: string, index: number];
}>();

const currentChild = computed(() => props.children[props.currentIndex] || null);

let touchStartX = 0;
let touchStartY = 0;

function onTouchStart(e: any) {
  const touch = e.touches?.[0];
  if (touch) {
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }
}

function onTouchEnd(e: any) {
  const touch = e.changedTouches?.[0];
  if (!touch) return;
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  // 只处理水平滑动（水平位移大于垂直位移）
  if (Math.abs(deltaX) < Math.abs(deltaY)) return;
  // 滑动阈值 50px
  if (Math.abs(deltaX) < 50) return;

  if (deltaX > 0) {
    switchPrev();
  } else {
    switchNext();
  }
}

function switchPrev() {
  if (props.currentIndex > 0) {
    const newIndex = props.currentIndex - 1;
    emitSwitch(newIndex);
  }
}

function switchNext() {
  if (props.currentIndex < props.children.length - 1) {
    const newIndex = props.currentIndex + 1;
    emitSwitch(newIndex);
  }
}

function emitSwitch(index: number) {
  const child = props.children[index];
  if (child) {
    emit('switch', child.id, index);
  }
}
</script>

<style lang="scss" scoped>
.child-switcher {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  padding: 0 24rpx;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12rpx);
  -webkit-backdrop-filter: blur(12rpx);
}

.switcher-left,
.switcher-right {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 56rpx;
  border-radius: 12rpx;
  transition: all 0.15s ease;

  &:active {
    background: rgba(255, 255, 255, 0.15);
  }

  &.disabled {
    opacity: 0.3;
    pointer-events: none;
  }
}

.arrow-icon {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 600;
}

.switcher-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
  flex: 1;
}

.child-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.2;
}

.child-index {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1;
}
</style>
