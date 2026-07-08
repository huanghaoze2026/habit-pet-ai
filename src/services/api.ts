/**
 * API 请求封装 — 基于 uni.request
 * 域名按 appid 自动切换，见 utils/env.ts
 */

import { API_BASE } from '../utils/env'

const BASE_URL = API_BASE
const TOKEN_KEY = 'habitpet_token'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

interface ApiOptions {
  skipAuth?: boolean
}

const request = <T = any>(
  method: string,
  url: string,
  data?: any,
  opts?: ApiOptions,
): Promise<ApiResponse<T>> => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync(TOKEN_KEY) || ''
    const skipAuth = opts?.skipAuth === true

    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        const body = res.data as ApiResponse<T>
        if (body.code === 200 || body.code === 0) {
          resolve(body)
        } else {
          if (body.code === 401 && !skipAuth) {
            uni.removeStorageSync(TOKEN_KEY)
            uni.reLaunch({ url: '/pages/login/login' })
          }
          reject(body)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络开小差了~', icon: 'none' })
        reject(err)
      },
    })
  })
}

// 快捷方法
export const api = {
  get: <T = any>(url: string, data?: any, opts?: ApiOptions) =>
    request<T>('GET', url, data, opts),
  post: <T = any>(url: string, data?: any, opts?: ApiOptions) =>
    request<T>('POST', url, data, opts),
  put: <T = any>(url: string, data?: any, opts?: ApiOptions) =>
    request<T>('PUT', url, data, opts),
  del: <T = any>(url: string, data?: any, opts?: ApiOptions) =>
    request<T>('DELETE', url, data, opts),
  delete: <T = any>(url: string, data?: any, opts?: ApiOptions) =>
    request<T>('DELETE', url, data, opts),
  /** 上传文件（用于语音等 multipart 上传） */
  upload: <T = any>(url: string, filePath: string, formData?: Record<string, any>) =>
    new Promise<ApiResponse<T>>((resolve, reject) => {
      const token = uni.getStorageSync(TOKEN_KEY) || ''
      uni.uploadFile({
        url: `${BASE_URL}${url}`,
        filePath,
        name: 'audio',
        formData,
        header: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        success: (res) => {
          try {
            const body = JSON.parse(res.data) as ApiResponse<T>
            if (body.code === 200 || body.code === 0) {
              resolve(body)
            } else {
              reject(body)
            }
          } catch {
            reject({ code: -1, message: '解析失败', data: null as any })
          }
        },
        fail: (err) => {
          console.error('[upload] fail:', JSON.stringify(err))
          uni.showToast({ title: '上传失败，请重试', icon: 'none' })
          reject(err)
        },
      })
    }),
}

export { BASE_URL }
export default api
