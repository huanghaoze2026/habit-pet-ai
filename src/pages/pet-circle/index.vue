<template>
  <view class="page-pet-circle">
    <CustomNavbar title="家族宠物圈" :showInvite="true" @invite="handleInvite" />
    <view class="nav-spacer" />

    <scroll-view scroll-y class="wf-scroll">
      <view v-if="loading" class="msg">加载中...</view>
      <view v-else-if="cards.length===0" class="msg">暂无宠物圈动态</view>
      <view v-else class="wf-grid">
        <view class="wf-col">
          <PetCircleCard v-for="c in leftCards" :key="c.id" :card="c" :height="c.h" :max-stats="maxStats" @bar-tap="onBarTap" @pet-tap="onPetTap" />
        </view>
        <view class="wf-col">
          <PetCircleCard v-for="c in rightCards" :key="c.id" :card="c" :height="c.h" :max-stats="maxStats" @bar-tap="onBarTap" @pet-tap="onPetTap" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { api } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { USER_INFO_KEY } from '@/utils/constants'
import { tryAcceptPendingInvite } from '@/utils/invite'
import CustomNavbar from '@/components/custom-navbar/index.vue'
import PetCircleCard from '@/components/pet-circle-card/index.vue'

const userStore = useUserStore()
const cards = ref<any[]>([])
const leftCards = ref<any[]>([])
const rightCards = ref<any[]>([])
const loading = ref(false)

const maxStats = computed(() => { let m=1; for(const c of cards.value)m=Math.max(m,c.taskCompleted||0,c.petCount||0,c.feedCount||0,c.chatCount||0); return m })

function distribute(arr:any[]){ const L:any[]=[],R:any[]=[]; let lh=0,rh=0,hi=0; arr.forEach(c=>{const h=hi%2===0?920:760;hi++;c.h=h;if(lh<=rh){L.push(c);lh+=h}else{R.push(c);rh+=h}}); leftCards.value=L; rightCards.value=R }

async function load(){ if(loading.value)return; loading.value=true
  try{ const res=await api.get<any>('/pet-circle/cards'); const raw=Array.isArray(res.data)?res.data:(res.data?.cards||res.data?.list||[]); console.log('[pet-circle] stage samples:', raw.slice(0,3).map((c:any)=>c.stageKey+'/'+c.petImage)); const mine=raw.filter((c:any)=>c.isOwner); const others=raw.filter((c:any)=>!c.isOwner).sort(()=>Math.random()-0.5); cards.value=[...mine,...others].map((c:any)=>({...c,id:c.childId||c.id||`c${Math.random()}`,childNickname:c.childName||c.childNickname||'',taskCompleted:c.stats?.taskCompleted??c.taskCompleted??0,petCount:c.stats?.petCount??c.petCount??0,feedCount:c.stats?.feedCount??c.feedCount??0,chatCount:c.stats?.chatCount??c.chatCount??0})); distribute(cards.value);
    // P65: 异步加载每个宝贝的任务完成数
    for(const card of cards.value){ if(card.childId){ api.get<any>('/task/stats',{childId:card.childId}).then(s=>{ card.taskCompleted=s.data?.completedTasks??card.taskCompleted }).catch(()=>{}) } } }catch{}finally{loading.value=false} }

function handleInvite(){/* open-type=share */ }
function onBarTap(k:string){/* handled in card */ }

// 宠物打招呼：拿 TTS 音频并播放
let greetAudio:any = null
let greetBusy = false
async function onPetTap(payload:{ text:string }){
  const text = payload?.text
  if(!text || greetBusy) return
  greetBusy = true
  try{
    const r = await api.post<{ audioUrl:string }>('/ai/tts', { text })
    const url = r.data?.audioUrl
    if(url){
      try{ greetAudio && greetAudio.destroy() }catch{}
      greetAudio = uni.createInnerAudioContext({ useWebAudioImplement:true })
      greetAudio.obeyMuteSwitch = false
      greetAudio.src = url
      greetAudio.play()
    }
  }catch(e){ /* 静默失败，不打扰用户 */ }
  finally{ greetBusy = false }
}

// 获取当前用户ID，store 为空时从本地存储兜底
function resolveUserId(): string {
  let uid = userStore.userId
  if (!uid) {
    try {
      const raw = uni.getStorageSync(USER_INFO_KEY)
      if (raw) uid = (JSON.parse(raw) || {}).userId || ''
    } catch {}
  }
  return uid
}

// 用 uni-app 钩子注册分享，确保 CustomNavbar「邀请」和空态「邀请好友」分享卡片带上 inviter
onShareAppMessage(() => {
  const uid = resolveUserId()
  return {
    title: '邀请你加入我的宠物圈',
    path: `/pages/invite/accept?inviter=${uid}`,
    imageUrl: '/static/share-cover.jpg',
  }
})

onShow(()=>{
  // 兑底：已登录直接点分享链接进入的情况，处理待处理邀请
  tryAcceptPendingInvite(userStore.userId)
  load()
})
</script>

<style scoped>
.page-pet-circle{display:flex;flex-direction:column;height:100vh;background:linear-gradient(180deg,#F5F0FF,#EBE0FF)}
.nav-spacer{height:calc(88rpx + 44px);flex-shrink:0}
.wf-scroll{flex:1;padding:0}
.wf-grid{display:flex;gap:8rpx;width:100%}
.wf-col{flex:1;min-width:0;display:flex;flex-direction:column;gap:8rpx}
.msg{text-align:center;padding:60rpx;color:#999;font-size:26rpx}
</style>
