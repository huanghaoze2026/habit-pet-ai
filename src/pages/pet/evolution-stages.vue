<template>
  <view class="evo-page">
    <view class="evo-header" :style="{ paddingTop: (statusBarH || 20) + 'px' }">
      <view class="evo-back" @click="goBack"><text>←</text></view>
      <text class="evo-title">宠物进化形态</text>
      <view class="evo-back" />
    </view>
    <scroll-view scroll-y class="evo-scroll">
      <view v-for="species in speciesList" :key="species.id" class="evo-card">
        <view class="evo-species-name">{{ species.name }}</view>
        <view class="evo-path">
          <view v-for="(stage, idx) in species.stages" :key="idx" class="evo-stage">
            <view class="evo-stage-emoji">{{ stage.emoji }}</view>
            <text class="evo-stage-name">{{ stage.name }}</text>
            <view v-if="idx < species.stages.length - 1" class="evo-arrow">→</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const statusBarH = ref(20)
try { statusBarH.value = uni.getSystemInfoSync().statusBarHeight || 20 } catch {}

const goBack = () => uni.navigateBack();

interface StageInfo { emoji: string; name: string }
interface SpeciesInfo { id: string; name: string; stages: StageInfo[] }

const speciesList = ref<SpeciesInfo[]>([
  {
    id: 'fire_dragon_dog', name: '火龙犬',
    stages: [
      { emoji: '🥚', name: '火龙蛋' },
      { emoji: '🔥', name: '小火狗' },
      { emoji: '🐉', name: '火犬' },
      { emoji: '🐲', name: '烈焰龙犬' },
      { emoji: '👑', name: '赤焰龙王' },
    ],
  },
  {
    id: 'thunder_mecha_tiger', name: '雷击虎',
    stages: [
      { emoji: '🥚', name: '雷虎机械蛋' },
      { emoji: '⚡', name: '小机械虎' },
      { emoji: '🔧', name: '雷虎机' },
      { emoji: '⚡', name: '电磁虎机' },
      { emoji: '👑', name: '雷暴虎机神' },
    ],
  },
  {
    id: 'doctor_cat', name: '小博士猫',
    stages: [
      { emoji: '🥚', name: '博士猫蛋' },
      { emoji: '📚', name: '小博士猫' },
      { emoji: '🔬', name: '眼镜博士猫' },
      { emoji: '🎓', name: '智慧导师猫' },
      { emoji: '👑', name: '星辰教授猫' },
    ],
  },
  {
    id: 'cloud_beast', name: '云团兽',
    stages: [
      { emoji: '🥚', name: '云团兽蛋' },
      { emoji: '☁️', name: '小云团兽' },
      { emoji: '🌟', name: '云团兽' },
      { emoji: '✨', name: '星光云兽' },
      { emoji: '👑', name: '梦境守护兽' },
    ],
  },
  {
    id: 'moon_rabbit', name: '玉兔',
    stages: [
      { emoji: '🥚', name: '月兔蛋' },
      { emoji: '🐰', name: '小月兔' },
      { emoji: '🌙', name: '玉兔' },
      { emoji: '✨', name: '星月灵兔' },
      { emoji: '👑', name: '月神兔' },
    ],
  },
  {
    id: 'milk_tea_fox', name: '奶茶狐',
    stages: [
      { emoji: '🥚', name: '奶茶狐蛋' },
      { emoji: '🦊', name: '小奶茶狐' },
      { emoji: '🌟', name: '奶茶狐' },
      { emoji: '✨', name: '焦糖灵狐' },
      { emoji: '👑', name: '九尾学霸狐' },
    ],
  },
  {
    id: 'code_cool', name: '代码酷德（待上线）',
    stages: [
      { emoji: '🥚', name: '酷德蛋' },
      { emoji: '💻', name: '小酷德' },
      { emoji: '⌨️', name: '代码团' },
      { emoji: '🤖', name: 'AI史莱姆' },
      { emoji: '👑', name: '超脑智能体' },
    ],
  },
  {
    id: 'fish_penguin', name: '摸鱼企鹅（待上线）',
    stages: [
      { emoji: '🥚', name: '企鹅蛋' },
      { emoji: '🐧', name: '小企鹅' },
      { emoji: '🎣', name: '摸鱼企鹅' },
      { emoji: '🛋️', name: '躺平企鹅' },
      { emoji: '👑', name: '终极摸鱼王' },
    ],
  },
  {
    id: 'azure_dragon', name: '神兽-青龙灵兽（待上线）',
    stages: [
      { emoji: '🥚', name: '青龙蛋' },
      { emoji: '🐉', name: '小龙' },
      { emoji: '🌊', name: '幼灵' },
      { emoji: '☁️', name: '苍青龙' },
      { emoji: '👑', name: '星穹青龙' },
    ],
  },
  {
    id: 'phoenix_bird', name: '神兽-凤凰鸟（待上线）',
    stages: [
      { emoji: '🥚', name: '凤凰蛋' },
      { emoji: '🐦', name: '小凤凰鸟' },
      { emoji: '🔥', name: '火羽鸟' },
      { emoji: '✨', name: '不死凤凰' },
      { emoji: '👑', name: '神焰天凰' },
    ],
  },
  {
    id: 'baize', name: '神兽-白泽（待上线）',
    stages: [
      { emoji: '🥚', name: '白泽蛋' },
      { emoji: '🐑', name: '小白兽' },
      { emoji: '📖', name: '白泽幼兽' },
      { emoji: '✨', name: '灵泽圣兽' },
      { emoji: '👑', name: '天机白泽' },
    ],
  },
]);
</script>

<style scoped>
.evo-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.evo-header {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.evo-back {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #333;
}

.evo-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
}

.evo-scroll {
  flex: 1;
  padding: 24rpx;
}

.evo-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.evo-species-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.evo-path {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.evo-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  min-width: 100rpx;
}

.evo-stage-emoji {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #F5F0FF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.evo-stage-name {
  font-size: 20rpx;
  color: #666;
  text-align: center;
  white-space: nowrap;
}

.evo-arrow {
  font-size: 28rpx;
  color: #5B3E96;
  margin: 0 8rpx;
  padding-bottom: 20rpx;
}
</style>
