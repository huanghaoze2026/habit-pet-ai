/**
 * 应用常量配置
 */

import { API_BASE } from './env';

/** API 基础地址（按 appid 自动切换，见 utils/env.ts） */
export const API_BASE_URL = API_BASE;

/** 本地调试用（小程序开发工具中启用） */
// export const API_BASE_URL = 'http://localhost:3101/api/v1';

/** Token 存储键名 */
export const TOKEN_KEY = 'habitpet_token';

/** Refresh Token 存储键名 */
export const REFRESH_TOKEN_KEY = 'habitpet_refresh_token';

/** 用户信息存储键名 */
export const USER_INFO_KEY = 'habitpet_user_info';

/** 请求超时时间（ms） */
export const REQUEST_TIMEOUT = 15000;

/** 每日最大互动次数 */
export const MAX_DAILY_INTERACTIONS = 20;
