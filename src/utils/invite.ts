import { api } from '@/services/api'

const KEY = 'pendingInviterId'
let handling = false

/** 保存待处理的分享人ID到本地存储 */
export function savePendingInviter(id?: string) {
  if (id && typeof id === 'string' && id.trim()) {
    uni.setStorageSync(KEY, id.trim())
  }
}

/** 从启动/页面 options 中提取分享人ID(兼容 分享链接 inviter 与 扫码 scene) */
export function captureInviterFromOptions(options: any) {
  if (!options) return
  const q = options.query || options
  let inv = q?.inviter || ''
  if (!inv && q?.scene) {
    try { inv = decodeURIComponent(q.scene) } catch { inv = q.scene }
  }
  if (!inv && options?.scene && typeof options.scene === 'string') {
    try { inv = decodeURIComponent(options.scene) } catch { inv = options.scene }
  }
  savePendingInviter(inv)
}

/** 登录后调用：若有待处理邀请且已登录，则免弹窗直接建立好友 */
export async function tryAcceptPendingInvite(selfUserId?: string) {
  const inviterId = uni.getStorageSync(KEY)
  const token = uni.getStorageSync('habitpet_token')
  if (!inviterId || !token || handling) return
  if (selfUserId && selfUserId === inviterId) { uni.removeStorageSync(KEY); return }
  handling = true
  uni.removeStorageSync(KEY) // 立即清除，防重复
  try {
    await api.post('/invite/accept', { inviterUserId: inviterId })
    uni.showToast({ title: '已添加好友', icon: 'success' })
  } catch (e: any) {
    const msg = (e && e.message) || ''
    // "已经是好友"等静默；其它错误轻提示
    if (msg && !/已经是好友|已.*好友/.test(msg)) uni.showToast({ title: msg || '添加好友失败', icon: 'none' })
  } finally {
    handling = false
  }
}
