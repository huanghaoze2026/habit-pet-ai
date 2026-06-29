/**
 * 家长端服务
 */

import api from './api';

/** 打卡记录 */
export interface ParentCheckinRecord {
  date: string;
  taskName: string;
  completed: boolean;
}

/** 家长报告响应 */
export interface ParentReportData {
  petName: string;
  petStage: string;
  level: number;
  mood: number;
  todayCheckins: number;
  totalTasks: number;
  checkinRate: number;
  streakDays: number;
  recentCheckins: ParentCheckinRecord[];
}

// ==================== 宝贝管理 ====================

/** 宝贝列表项 */
export interface ChildListItem {
  id: string;
  nickname: string;
  avatar?: string;
  age?: number;
  gender?: string;
  petId?: string;
  petName?: string;
  petStage?: string;
  mood?: number;
  todayCompleted?: number;
}

/** 添加宝贝请求 */
export interface AddChildParams {
  nickname: string;
  gender?: string;
  age?: number;
  avatar?: string;
  grade?: string;
  petId?: string;
  speciesId?: string;
}

/** 编辑宝贝请求 */
export interface UpdateChildParams {
  nickname?: string;
  gender?: string;
  age?: number;
  avatar?: string;
  grade?: string;
}

/** 手表绑定请求 */
export interface WatchBindParams {
  watchType: string;
  watchDeviceId?: string;
}

/** 更换宠物请求 */
export interface ChangePetParams {
  newPetId: string;
}

/** 宝贝详情 */
export interface ChildDetailData {
  childInfo: {
    id: string;
    nickname: string;
    avatar?: string;
    age?: number;
    gender?: string;
    grade?: string;
    watchType?: string;
    watchBindStatus?: string;
    petId?: string;
    petChangeCount: number;
  };
  petStatus: {
    petName?: string;
    stage?: string;
    level?: number;
    exp?: number;
    expToNext?: number;
    mood?: number;
    bondScore?: number;
    relationshipLevel?: string;
  };
  taskSummary: {
    todayCompleted: number;
    todayTotal: number;
    weekCompletionRate: number;
    streakDays: number;
    recentCheckins: ParentCheckinRecord[];
  };
  interactionStats: {
    todayPetCount: number;
    todayChatCount: number;
    avgDailyOnlineMinutes: number;
  };
  aiStats?: {
    totalTokens: number;
    totalCalls: number;
    totalCostUsd: number;
  };
  moodTrend: Array<{ date: string; mood: number }>;
}

// ==================== API ====================

/**
 * 获取家长端打卡报告
 */
export function getReport(childId: string): Promise<ParentReportData> {
  return api
    .get<ParentReportData>(`/parent/report?childId=${encodeURIComponent(childId)}`)
    .then((res) => res.data);
}

/**
 * 获取当前家长绑定的所有宝贝列表
 */
export function getChildren(): Promise<ChildListItem[]> {
  return api.get<ChildListItem[]>('/parent/children').then((res) => res.data);
}

/**
 * 添加新宝贝
 */
export function addChild(data: AddChildParams): Promise<ChildListItem> {
  return api.post<ChildListItem>('/parent/children', data as unknown as Record<string, unknown>).then((res) => res.data);
}

/**
 * 获取宝贝完整详情
 */
export function getChildDetail(childId: string): Promise<ChildDetailData> {
  return api.get<ChildDetailData>(`/parent/children/${childId}`).then((res) => res.data);
}

/**
 * 编辑宝贝基本信息
 */
export function updateChild(childId: string, data: UpdateChildParams): Promise<ChildListItem> {
  return api.put<ChildListItem>(`/parent/children/${childId}`, data as unknown as Record<string, unknown>).then((res) => res.data);
}

/**
 * 绑定/更换手表
 */
export function bindWatch(childId: string, data: WatchBindParams): Promise<{ watchType: string; watchBindStatus: string; watchDeviceId?: string }> {
  return api.put<{ watchType: string; watchBindStatus: string; watchDeviceId?: string }>(`/parent/children/${childId}/watch`, data as unknown as Record<string, unknown>).then((res) => res.data);
}

/**
 * 更换宠物（最多2次）
 */
export function changePet(childId: string, data: ChangePetParams): Promise<{ petId: string; petChangeCount: number; remaining: number }> {
  return api.put<{ petId: string; petChangeCount: number; remaining: number }>(`/parent/children/${childId}/pet`, data as unknown as Record<string, unknown>).then((res) => res.data);
}
