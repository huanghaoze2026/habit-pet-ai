// 按当前运行小程序的 appid 决定后端域名，避免到处硬编码
// 生产: wx4d7b124abd2f9569 -> api.lanyunke.com；其余(含测试 wx33b9235184a825ea) -> stage-api.lanyunke.com
function resolveApiOrigin(): string {
  try {
    // @ts-ignore mp-weixin 运行时提供 wx
    const appId = (wx as any).getAccountInfoSync?.().miniProgram?.appId || ''
    return appId === 'wx4d7b124abd2f9569'
      ? 'https://api.lanyunke.com'
      : 'https://stage-api.lanyunke.com'
  } catch {
    return 'https://stage-api.lanyunke.com'
  }
}
export const API_ORIGIN = resolveApiOrigin()
export const API_BASE = `${API_ORIGIN}/api/v1`
// wss:// 版本(用于 WebSocket)
export const WS_ORIGIN = API_ORIGIN.replace(/^https:\/\//, 'wss://')
