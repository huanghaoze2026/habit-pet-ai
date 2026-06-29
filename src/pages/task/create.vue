<template>
  <view class="page-create-task">
    <view class="form-card">
      <!-- 任务名称 + 选择模板 -->
      <view class="field-group">
        <text class="field-label">任务名称 <text class="required">*</text></text>
        <view class="name-row">
          <input
            class="field-input field-input--name"
            v-model="taskName"
            placeholder="例如：每天阅读20分钟"
            placeholder-style="color: #CCCCCC;"
            maxlength="16"
          />
          <view class="template-btn" @click="showTemplatePopup = true">
            <text class="template-btn-text">选择模板 ▼</text>
          </view>
        </view>
      </view>

      <!-- 任务类型 -->
      <view class="field-group">
        <text class="field-label">任务类型 <text class="required">*</text></text>
        <view class="type-grid">
          <view
            v-for="item in taskTypes"
            :key="item.value"
            class="type-card"
            :class="{ 'type-card--selected': taskType === item.value }"
            @click="selectType(item.value)"
          >
            <text class="type-label">{{ item.label }}</text>
            <text class="type-energy">⚡ {{ item.energy }}</text>
          </view>
        </view>
      </view>

      <!-- 任务描述 -->
      <view class="field-group">
        <text class="field-label">任务描述</text>
        <textarea
          class="field-textarea"
          v-model="description"
          placeholder="简单描述一下任务内容"
          placeholder-style="color: #CCCCCC;"
          maxlength="200"
        />
      </view>

      <!-- 奖励内容 -->
      <view class="field-group">
        <text class="field-label">奖励内容</text>
        <input
          class="field-input"
          v-model="rewardContent"
          placeholder="例如：多看10分钟动画片"
          placeholder-style="color: #CCCCCC;"
          maxlength="50"
        />
      </view>

      <!-- 提醒时间 -->
      <view class="field-group">
        <text class="field-label">提醒时间</text>
        <picker
          mode="time"
          :value="reminderTime"
          @change="onTimeChange"
          class="field-picker-wrap"
        >
          <view class="field-picker">
            <text :class="{ 'picker-placeholder': !reminderTime }">
              {{ reminderTime || '选择提醒时间' }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <!-- 重复类型 -->
      <view class="field-group">
        <text class="field-label">重复类型</text>
        <view class="type-grid repeat-grid">
          <view
            v-for="item in repeatTypes"
            :key="item.value"
            class="type-card repeat-card"
            :class="{ 'type-card--selected': repeatType === item.value }"
            @click="repeatType = item.value"
          >
            <text class="repeat-label">{{ item.label }}</text>
          </view>
        </view>
        <!-- 选择"重复"时显示星期复选框 -->
        <view v-if="repeatType === 'repeat'" class="weekday-picker">
          <text class="weekday-hint">选择重复的日期：</text>
          <view class="weekday-group">
            <view
              v-for="w in weekdays"
              :key="w.value"
              class="weekday-chip"
              :class="{ 'weekday-chip--active': repeatDays.includes(w.value) }"
              @click="toggleWeekday(w.value)"
            >
              <text>{{ w.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 需要拍照 -->
      <view class="field-group">
        <text class="field-label">需要拍照</text>
        <view class="photo-toggle-row">
          <text class="toggle-label">{{ needPhoto ? '需要拍照' : '不需要' }}</text>
          <switch
            :checked="needPhoto"
            @change="needPhoto = $event.detail.value"
            color="#5B3E96"
          />
        </view>
      </view>

      <!-- P59: 需要家长审核 -->
      <view class="field-group">
        <text class="field-label">需要家长审核</text>
        <view class="photo-toggle-row">
          <text class="toggle-label">{{ needParentReview ? '需要审核' : '不需要' }}</text>
          <switch
            :checked="needParentReview"
            @change="onParentReviewToggle"
            color="#5B3E96"
          />
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button
        class="submit-btn"
        :class="{ 'submit-btn--disabled': submitting || !taskName || !taskType }"
        :disabled="submitting || !taskName || !taskType"
        @click="handleSubmit"
      >
        {{ submitting ? '创建中...' : '创建任务' }}
      </button>
    </view>

    <!-- P38: 模板选择弹层 -->
    <view v-if="showTemplatePopup" class="popup-overlay" @click="showTemplatePopup = false">
      <view class="popup-panel" @click.stop>
        <view class="popup-header">
          <text class="popup-title">选择任务模板</text>
          <view class="popup-close" @click="showTemplatePopup = false">
            <text>✕</text>
          </view>
        </view>
        <scroll-view scroll-y class="popup-body">
          <view v-for="group in templateGroups" :key="group.category" class="template-group">
            <view class="template-group-header">
              <text class="template-group-icon">{{ group.icon }}</text>
              <text class="template-group-label">{{ group.label }}</text>
            </view>
            <view
              v-for="tpl in group.templates"
              :key="tpl.name"
              class="template-item"
              @click="selectTemplate(tpl)"
            >
              <text class="template-item-icon">{{ tpl.icon }}</text>
              <view class="template-item-info">
                <text class="template-item-name">{{ tpl.name }}</text>
                <text class="template-item-desc">{{ tpl.desc }}</text>
              </view>
              <view class="template-item-arrow">›</view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- P59: 家长审核密码首次设置弹层 -->
    <view v-if="showParentPwdPopup" class="popup-overlay" @click="showParentPwdPopup = false">
      <view class="popup-panel" @click.stop>
        <view class="popup-header">
          <text class="popup-title">设置家长审核密码</text>
          <view class="popup-close" @click="cancelParentPwd">
            <text>✕</text>
          </view>
        </view>
        <scroll-view scroll-y class="popup-body">
          <view class="pwd-setup-form">
            <text class="pwd-setup-desc">首次开启家长审核，请设置6位数字密码。后续可在「我的-设置-家长审核密码」中修改。</text>
            
            <view class="pwd-field">
              <text class="pwd-field-label">密码（6位数字）</text>
              <input
                class="pwd-field-input"
                v-model="parentPwd.password"
                type="number"
                password
                maxlength="6"
                placeholder="请输入6位数字密码"
              />
            </view>

            <view class="pwd-field">
              <text class="pwd-field-label">确认密码</text>
              <input
                class="pwd-field-input"
                v-model="parentPwd.confirmPassword"
                type="number"
                password
                maxlength="6"
                placeholder="请再次输入密码"
              />
            </view>

            <view class="pwd-field">
              <text class="pwd-field-label">密保问题</text>
              <picker
                mode="selector"
                :range="securityQuestions"
                @change="parentPwd.question = securityQuestions[$event.detail.value]"
              >
                <view class="field-picker">
                  <text :class="{ 'picker-placeholder': !parentPwd.question }">
                    {{ parentPwd.question || '请选择密保问题' }}
                  </text>
                  <text class="picker-arrow">›</text>
                </view>
              </picker>
            </view>

            <view class="pwd-field">
              <text class="pwd-field-label">密保答案</text>
              <input
                class="pwd-field-input"
                v-model="parentPwd.answer"
                placeholder="请输入密保答案"
                maxlength="30"
              />
            </view>

            <button
              class="pwd-submit-btn"
              :disabled="!isParentPwdValid"
              :loading="parentPwdLoading"
              @click="submitParentPwd"
            >
              确认设置
            </button>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/services/api'
import { useChildStore } from '@/stores/child'

interface TaskTypeOption {
  value: string
  label: string
  energy: number
  emoji: string
}

interface TemplateItem {
  name: string
  desc: string
  icon: string
  category: 'study' | 'life' | 'sport'
}

// P38: 模板数据（10条，前端常量）
const TEMPLATES: TemplateItem[] = [
  { name: '阅读20分钟', desc: '每天坚持阅读课外书', icon: '📖', category: 'study' },
  { name: '完成作业', desc: '认真完成当天学校布置的作业', icon: '✏️', category: 'study' },
  { name: '背单词10个', desc: '每天积累英语单词', icon: '🔤', category: 'study' },
  { name: '早睡（21:30前）', desc: '养成良好作息习惯', icon: '🌙', category: 'life' },
  { name: '整理书包', desc: '自己收拾第二天上学用品', icon: '🎒', category: 'life' },
  { name: '洗漱刷牙', desc: '早晚刷牙，保持个人卫生', icon: '🪥', category: 'life' },
  { name: '跳绳100个', desc: '锻炼身体协调性', icon: '🪢', category: 'sport' },
  { name: '跑步1公里', desc: '增强体质', icon: '🏃', category: 'sport' },
  { name: '仰卧起坐30个', desc: '锻炼核心力量', icon: '💪', category: 'sport' },
  { name: '开合跳50个', desc: '全身燃脂运动', icon: '🤸', category: 'sport' },
]

// 分组展示
const templateGroups = [
  {
    category: 'study',
    icon: '📚',
    label: '学习',
    templates: TEMPLATES.filter(t => t.category === 'study'),
  },
  {
    category: 'life',
    icon: '🏠',
    label: '生活',
    templates: TEMPLATES.filter(t => t.category === 'life'),
  },
  {
    category: 'sport',
    icon: '⚽',
    label: '运动',
    templates: TEMPLATES.filter(t => t.category === 'sport'),
  },
]

const taskTypes: TaskTypeOption[] = [
  { value: 'study', label: '学习', energy: 20, emoji: '' },
  { value: 'life', label: '生活', energy: 30, emoji: '' },
  { value: 'sport', label: '运动', energy: 40, emoji: '' },
]

// P38: 重复类型简化为两种
const repeatTypes = [
  { value: 'once', label: '单次' },
  { value: 'repeat', label: '重复' },
]

const weekdays = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
]

// P37: 表单默认值
const taskName = ref('')
const taskType = ref('life')
const description = ref('')
const rewardContent = ref('')
const repeatType = ref('repeat')
const repeatDays = ref<number[]>([1, 2, 3, 4, 5, 6, 7])
const needPhoto = ref(false)
const needParentReview = ref(false) // P59: 需要家长审核
const showParentPwdPopup = ref(false) // P59: 家长审核密码弹窗
const parentPwdLoading = ref(false)
const parentPwd = ref({ password: '', confirmPassword: '', question: '', answer: '' })

const securityQuestions = [
  '你的小学名称是什么？',
  '你最喜欢的宠物叫什么？',
  '你的出生城市是哪里？',
  '你妈妈的名字是什么？',
  '你最喜欢的颜色是什么？',
]

// P59: 密码验证
const isParentPwdValid = computed(() => {
  const p = parentPwd.value
  return p.password.length === 6
    && p.password === p.confirmPassword
    && p.question.trim() !== ''
    && p.answer.trim() !== ''
})
const reminderTime = ref('20:00')
const store = useChildStore()
const submitting = ref(false)
const showTemplatePopup = ref(false)

onLoad(async () => {
  if (!store.currentChildId) {
    await store.fetchChildList()
  }
})

const energyReward = computed(() => {
  const found = taskTypes.find((t) => t.value === taskType.value)
  return found ? found.energy : 0
})

const selectType = (value: string) => {
  taskType.value = value
}

const onTimeChange = (e: any) => {
  reminderTime.value = e.detail.value
}

// P38: 切换星期
const toggleWeekday = (day: number) => {
  const idx = repeatDays.value.indexOf(day)
  if (idx >= 0) {
    repeatDays.value = repeatDays.value.filter(d => d !== day)
  } else {
    repeatDays.value = [...repeatDays.value, day].sort()
  }
}

// P59: 切换家长审核开关
const onParentReviewToggle = async (e: any) => {
  const checked = e.detail.value
  if (checked) {
    // 检查是否已设置密码
    try {
      const res = await api.get<any>('/parent-review/config')
      if (res.code === 200 && res.data?.hasPassword) {
        // 已有密码，直接开启
        needParentReview.value = true
        return
      }
    } catch {}
    // 未设置密码，弹出设置弹窗
    parentPwd.value = { password: '', confirmPassword: '', question: '', answer: '' }
    showParentPwdPopup.value = true
  } else {
    needParentReview.value = false
  }
}

// P59: 取消设置家长密码
const cancelParentPwd = () => {
  showParentPwdPopup.value = false
  needParentReview.value = false
}

// P59: 提交家长审核密码设置
const submitParentPwd = async () => {
  if (!isParentPwdValid.value) return
  parentPwdLoading.value = true
  try {
    const res = await api.post('/parent-review/setup', {
      password: parentPwd.value.password,
      securityQuestion: parentPwd.value.question,
      securityAnswer: parentPwd.value.answer,
    })
    if (res.code === 200) {
      uni.showToast({ title: '密码设置成功', icon: 'success' })
      showParentPwdPopup.value = false
      needParentReview.value = true
    } else {
      uni.showToast({ title: (res as any).message || '设置失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '设置失败', icon: 'none' })
  } finally {
    parentPwdLoading.value = false
  }
}

// P38: 选中模板 → 自动填充名称/类型/重复
const selectTemplate = (tpl: TemplateItem) => {
  taskName.value = tpl.name
  taskType.value = tpl.category
  repeatType.value = 'repeat'
  repeatDays.value = [1, 2, 3, 4, 5]
  description.value = tpl.desc
  showTemplatePopup.value = false
}

const handleSubmit = async () => {
  if (!taskName.value.trim()) {
    uni.showToast({ title: '请输入任务名称', icon: 'none' })
    return
  }
  if (!taskType.value) {
    uni.showToast({ title: '请选择任务类型', icon: 'none' })
    return
  }

  if (!store.currentChildId) {
    uni.showToast({ title: '请先添加宝贝', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const res = await api.post('/task', {
      taskName: taskName.value.trim(),
      taskType: taskType.value,
      description: description.value.trim(),
      rewardContent: rewardContent.value.trim() || undefined,
      repeatType: repeatType.value,
      repeatDays: repeatType.value === 'repeat' ? repeatDays.value : undefined,
      energyReward: energyReward.value,
      reminderTime: reminderTime.value || undefined,
      needPhoto: needPhoto.value,
      needParentReview: needParentReview.value,
      childId: store.currentChildId,
    })
    if (res.code === 200 || res.data) {
      uni.showToast({ title: '创建成功', icon: 'success' })
      if (reminderTime.value) {
        wx.requestSubscribeMessage({
          tmplIds: ['Oo44I14czDDx6wbiiP_vS8GFRM2-5AtvxrF4MDtuAqU'],
          success: () => console.log('[Create] 订阅消息授权成功'),
          fail: (err: any) => console.log('[Create] 订阅消息授权失败:', err),
        })
      }
      setTimeout(() => uni.navigateBack(), 800)
    } else {
      uni.showToast({ title: (res as any).message || '创建失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '创建失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-create-task {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  padding-bottom: 60rpx;
}

.form-card {
  background: #ffffff;
  border-radius: 16rpx;
  margin: 24rpx;
  padding: 32rpx 28rpx;
}

.field-group {
  margin-bottom: 40rpx;
}

.field-group:last-child {
  margin-bottom: 0;
}

.field-label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.required {
  color: #333;
}

/* 任务名称行：输入框 + 模板按钮 */
.name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.field-input--name {
  flex: 1;
}

.field-input {
  width: 100%;
  height: 80rpx;
  font-size: 28rpx;
  color: #333333;
  background: #F8F8F8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
}

/* P38: 选择模板按钮 */
.template-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  padding: 0 24rpx;
  background: linear-gradient(135deg, #F5F3FF, #EBE0FF);
  border-radius: 12rpx;
  border: 2rpx solid #7B61FF;
  white-space: nowrap;
  flex-shrink: 0;
}
.template-btn:active { opacity: 0.8; }
.template-btn-text {
  font-size: 24rpx;
  color: #7B61FF;
  font-weight: 600;
}

.field-textarea {
  width: 100%;
  height: 120rpx;
  font-size: 28rpx;
  color: #333333;
  background: #F8F8F8;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
}

.type-grid {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
}

.type-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 28rpx 12rpx;
  background: #F8F8F8;
  border-radius: 16rpx;
  border: 3rpx solid transparent;
  transition: all 0.2s;
}

.type-card--selected {
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
  border-color: #333;
}

.type-label {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}

.type-energy {
  font-size: 22rpx;
  color: #333;
  background: #FFEBDD;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}

.repeat-grid .repeat-card { padding: 20rpx 8rpx; }
.repeat-label { font-size: 28rpx; color: #333; }

/* P38: 星期复选框 */
.weekday-picker { margin-top: 24rpx; }
.weekday-hint { font-size: 24rpx; color: #999; margin-bottom: 16rpx; display:block; }
.weekday-group { display:flex; flex-wrap:wrap; gap:8rpx; }
.weekday-chip {
  padding:10rpx 14rpx; border-radius:24rpx;
  background:#F5F0FF; border:2rpx solid transparent;
  font-size:22rpx; color:#666;
}
.weekday-chip--active {
  background:linear-gradient(135deg,#7B61FF,#9D4EDD);
  border-color:#7B61FF; color:#fff; font-weight:bold;
}

.field-picker-wrap {
  width: 100%;
}

.field-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  font-size: 28rpx;
  color: #333333;
  background: #F8F8F8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.picker-placeholder {
  color: #CCCCCC;
}

.picker-arrow {
  font-size: 36rpx;
  color: #CCCCCC;
}

.submit-section {
  padding: 32rpx 24rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #5B3E96;
  border-radius: 40rpx;
  font-size: 32rpx;
  color: #ffffff;
  font-weight: bold;
  border: none;
}

.submit-btn::after {
  border: none;
}

.submit-btn--disabled {
  background: #CCCCCC;
  color: #ffffff;
}

.photo-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
}
.toggle-label {
  font-size: 28rpx;
  color: #333;
}

/* P38: 模板选择弹层 */
.popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.popup-panel {
  width: 100%;
  max-height: 70vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  animation: popup-slide-up 0.25s ease-out;
}
@keyframes popup-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 20rpx;
  border-bottom: 2rpx solid #F0F0F0;
  flex-shrink: 0;
}
.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.popup-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #999;
}
.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 16rpx 32rpx 48rpx;
}
.template-group {
  margin-bottom: 32rpx;
}
.template-group-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 0 12rpx;
}
.template-group-icon {
  font-size: 36rpx;
}
.template-group-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}
.template-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 16rpx;
  border-radius: 12rpx;
  margin-bottom: 8rpx;
  background: #FAFAFA;
}
.template-item:active {
  background: #F0EBFF;
}
.template-item-icon {
  font-size: 40rpx;
}
.template-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.template-item-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}
.template-item-desc {
  font-size: 22rpx;
  color: #999;
}
.template-item-arrow {
  font-size: 32rpx;
  color: #CCC;
}

/* P59: 家长审核密码设置 */
.pwd-setup-form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.pwd-setup-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8rpx;
}
.pwd-field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.pwd-field-label {
  font-size: 26rpx;
  color: #333;
  font-weight: 600;
}
.pwd-field-input {
  width: 100%;
  height: 80rpx;
  font-size: 28rpx;
  color: #333;
  background: #F8F8F8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
}
.pwd-submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #5B3E96;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 44rpx;
  margin-top: 16rpx;
  border: none;
}
.pwd-submit-btn::after { border: none; }
.pwd-submit-btn[disabled] {
  background: #CCC;
}
</style>
