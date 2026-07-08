/**
 * 微信登录服务
 */

import api, { ApiResponse } from './api';
import { API_BASE } from '../utils/env';

/** 微信登录响应 */
export interface WxLoginResponse {
  token: string;
  userId: string;
  role: string;
  nickname: string;
  avatar: string | null;
  isNewUser: boolean;
}

/**
 * 微信小程序登录
 *
 * 流程：
 * 1. 调用 wx.login() 获取临时 code
 * 2. 发送 code 到后端 POST /auth/wx-login
 * 3. 后端返回 JWT + 用户信息
 * 4. 前端存储 Token 并更新用户状态
 *
 * @returns 登录结果
 */
export async function wxLogin(): Promise<ApiResponse<WxLoginResponse>> {
  // 1. 获取微信登录 code
  const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: resolve,
      fail: reject,
    });
  });

  if (!loginRes.code) {
    throw new Error('获取微信登录 code 失败');
  }

  console.log('[Auth] wx.login 成功, code:', loginRes.code.substring(0, 8) + '...');

  // 2. 发送 code 到后端换取 JWT
  const res = await api.post<WxLoginResponse>('/auth/wx-login', {
    code: loginRes.code,
  }, { skipAuth: true });

  return res;
}

/**
 * 更新用户资料到后端
 *
 * P59: 支持上传本地头像文件（chooseAvatar 返回临时路径）
 */
export async function updateProfile(data: { nickname?: string; avatar?: string; phone?: string }) {
  // 如果 avatar 是本地临时路径，先上传
  if (data.avatar && (data.avatar.startsWith('wxfile://') || data.avatar.startsWith('http://tmp/'))) {
    try {
      const uploadedUrl = await uploadAvatar(data.avatar)
      data.avatar = uploadedUrl
    } catch {
      // 上传失败则跳过头像更新
      delete data.avatar
    }
  }
  const res = await api.put('/auth/update-profile', data)
  return res.data
}

/**
 * P59: 上传头像到服务器
 */
// 压缩本地图片（主要对 jpg 有效；失败退回原图，不阻断上传）
async function compressForUpload(src: string): Promise<string> {
  try {
    const r: any = await uni.compressImage({ src, quality: 70 })
    return r?.tempFilePath || src
  } catch {
    return src
  }
}

async function uploadAvatar(filePath: string): Promise<string> {
  const baseUrl = API_BASE
  const token = uni.getStorageSync('habitpet_token') || ''
  // 上传前先压缩，避免手机原图数 MB 上传缓慢
  const compressedPath = await compressForUpload(filePath)
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${baseUrl}/auth/upload-avatar`,
      filePath: compressedPath,
      name: 'avatar',
      header: { Authorization: `Bearer ${token}` },
      success: (res) => {
        try {
          const body = JSON.parse(res.data)
          if (body.url || body.data?.url) {
            resolve(body.url || body.data?.url)
          } else {
            reject(new Error('上传失败'))
          }
        } catch {
          reject(new Error('解析失败'))
        }
      },
      fail: reject,
    })
  })
}

/**
 * 获取微信用户信息（头像、昵称等）
 *
 * 微信小程序新版 API 需要通过 button 组件触发
 */
export function getWxUserInfo(): Promise<UniApp.GetUserInfoRes> {
  return new Promise((resolve, reject) => {
    uni.getUserInfo({
      provider: 'weixin',
      success: resolve,
      fail: reject,
    });
  });
}

/**
 * 获取微信用户头像（新版 API - 头像昵称填写组件）
 */
export function getWxAvatarUrl(): Promise<{ avatarUrl: string }> {
  return new Promise((resolve, reject) => {
    uni.getUserProfile({
      desc: '用于完善宠物主人的个人信息',
      success: (res) => {
        resolve({ avatarUrl: res.userInfo?.avatarUrl || '' });
      },
      fail: reject,
    });
  });
}
