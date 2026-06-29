<template>
  <view class="pcc-card" :style="{height:height+'rpx'}">
    <image v-if="card.sceneImage" :src="card.sceneImage" class="pcc-bg" mode="aspectFill" @error="bgErr=true" />
    <view v-if="!card.sceneImage || bgErr" class="pcc-bg-fb" />
    <image v-if="card.petImage" :src="card.petImage" class="pcc-pet" mode="aspectFit" />

    <view class="pcc-tl">
      <image v-if="card.childAvatar" :src="card.childAvatar" class="pcc-av" mode="aspectFill" />
      <text v-else class="pcc-av-em">👶</text>
      <text class="pcc-nm">{{ card.childName || card.childNickname || '宝贝' }}</text>
    </view>

    <view class="pcc-tr">
      <text class="pcc-pn">{{ card.petName || '宠物' }}</text>
      <text class="pcc-lv">{{ stageName }}</text>
      <view class="pcc-xp"><view class="pcc-xp-f" :style="{width:(card.expPercent||0)*100+'%'}" /></view>
    </view>

    <text v-if="card.moodStatus" class="pcc-mood">😊 {{ card.moodStatus }}</text>

    <view class="pcc-bars">
      <view class="bar" @click.stop="tap('task')">
        <view class="bar-f bar-task" :style="{height:barH(card.taskCompleted)}" />
        <text class="bar-n">{{ card.taskCompleted||0 }}</text>
        <view v-if="sel==='task'" class="bar-tip">完成任务</view>
      </view>
      <view class="bar" @click.stop="tap('pet')">
        <view class="bar-f bar-pet" :style="{height:barH(card.petCount)}" />
        <text class="bar-n">{{ card.petCount||0 }}</text>
        <view v-if="sel==='pet'" class="bar-tip">抚摸</view>
      </view>
      <view class="bar" @click.stop="tap('feed')">
        <view class="bar-f bar-feed" :style="{height:barH(card.feedCount)}" />
        <text class="bar-n">{{ card.feedCount||0 }}</text>
        <view v-if="sel==='feed'" class="bar-tip">喂食</view>
      </view>
      <view class="bar" @click.stop="tap('chat')">
        <view class="bar-f bar-chat" :style="{height:barH(card.chatCount)}" />
        <text class="bar-n">{{ card.chatCount||0 }}</text>
        <view v-if="sel==='chat'" class="bar-tip">对话</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const STAGE_NAMES: Record<string, string> = {
  egg: '蛋仔期',
  baby: '幼体期',
  juvenile: '成长期',
  evolved: '进化体',
  ultimate: '完全体',
}

const props = defineProps<{ card: Record<string,any>; height: number; maxStats: number }>()
const emit = defineEmits(['barTap'])

const stageName = computed(() => STAGE_NAMES[props.card.stageKey] || '蛋仔期')

const sel = ref('')
const bgErr = ref(false)
let tt:ReturnType<typeof setTimeout>|null=null

function tap(k:string){
  if(tt)clearTimeout(tt)
  sel.value=k; emit('barTap', k)
  tt=setTimeout(()=>sel.value='',2000)
}
function barH(v:number){ return Math.max(8,(v/(props.maxStats||1))*70)+'rpx' }
</script>

<style scoped>
.pcc-card{position:relative;border-radius:16rpx;overflow:hidden;box-shadow:0 2rpx 12rpx rgba(0,0,0,.08)}
.pcc-bg{position:absolute;top:0;left:0;width:100%;height:100%;z-index:0}
.pcc-bg-fb{position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;background:linear-gradient(180deg,#D4C5F0,#A8D8EA,#87CEEB)}
.pcc-pet{position:absolute;top:25%;left:10%;width:80%;height:55%;z-index:1}
.pcc-tl{position:absolute;top:10rpx;left:10rpx;z-index:2;display:flex;align-items:center;gap:8rpx;background:rgba(0,0,0,.4);backdrop-filter:blur(6rpx);border-radius:8rpx;padding:4rpx 12rpx;color:#fff}
.pcc-av{width:40rpx;height:40rpx;border-radius:50%}
.pcc-av-em{width:40rpx;height:40rpx;border-radius:50%;background:rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:24rpx}
.pcc-nm{font-size:22rpx;font-weight:500}
.pcc-tr{position:absolute;top:10rpx;right:10rpx;z-index:2;display:flex;flex-direction:column;align-items:flex-end;gap:2rpx;background:rgba(0,0,0,.4);backdrop-filter:blur(6rpx);border-radius:8rpx;padding:6rpx 12rpx;color:#fff}
.pcc-pn{font-size:20rpx;font-weight:bold}
.pcc-lv{font-size:16rpx;color:#FFD700}
.pcc-xp{width:80rpx;height:5rpx;background:rgba(255,255,255,.3);border-radius:3rpx;margin-top:2rpx;overflow:hidden}
.pcc-xp-f{height:100%;background:#FFD700;border-radius:3rpx}
.pcc-mood{position:absolute;top:82%;left:50%;transform:translateX(-50%);z-index:2;font-size:22rpx;color:#fff;background:rgba(0,0,0,.3);padding:4rpx 16rpx;border-radius:20rpx}
.pcc-bars{position:absolute;bottom:0;left:0;right:0;z-index:2;display:flex;justify-content:space-around;align-items:flex-end;padding:8rpx 4rpx 14rpx;height:25%;box-sizing:border-box;background:transparent}
.bar{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;width:60rpx;height:100%;gap:6rpx}
.bar-f{width:48rpx;border-radius:6rpx 6rpx 0 0;min-height:8rpx}
.bar-task{border:3rpx solid #A78BFA;background:rgba(167,139,250,.3)!important}
.bar-pet{border:3rpx solid #FFB347;background:rgba(255,179,71,.3)!important}
.bar-feed{border:3rpx solid #81C784;background:rgba(129,199,132,.3)!important}
.bar-chat{border:3rpx solid #64B5F6;background:rgba(100,181,246,.3)!important}
.bar-n{font-size:20rpx;color:#fff;font-weight:600;text-shadow:0 1rpx 3rpx rgba(0,0,0,.5)}
.bar-tip{position:absolute;bottom:calc(100% + 8rpx);left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;font-size:16rpx;padding:4rpx 12rpx;border-radius:6rpx;white-space:nowrap;z-index:10}
</style>
