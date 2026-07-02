/**
 * 任务服务
 *
 * 包含任务列表查询、打卡提交等 API 方法。
 */

import api from './api';

// ============ 类型定义 ============

/** 任务项 */
export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  reward: number;
  completed: boolean;
  isToday?: boolean;
}

/** 任务列表响应 */
export interface TaskListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: TaskItem[];
  todayItems?: TaskItem[];
}

/** 打卡提交请求 */
export interface CheckinRequest {
  taskId: string;
  childId?: string;
}

/** 打卡提交响应 */
export interface CheckinResponse {
  success: boolean;
  energy: number;
  mood: number;
  streak: number;
  alreadyChecked?: boolean;
  message?: string;
}

// ============ API 方法 ============

/**
 * 获取任务列表
 *
 * @param category 任务分类过滤（可选）
 * @param page 页码
 * @param pageSize 每页数量
 * @param childId 孩子 ID（可选，多孩切换时使用）
 */
export async function getTaskList(
  category?: string,
  page: number = 1,
  pageSize: number = 20,
  childId?: string,
): Promise<TaskListResponse> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (childId) params.set('childId', childId);

  const res = await api.get<TaskListResponse>(`/task/list?${params.toString()}`);
  return res.data;
}

/**
 * 提交打卡
 *
 * @param taskId 任务 ID
 * @param childId 孩子 ID（可选，多孩切换时使用）
 */
export async function submitCheckin(taskId: string, childId?: string): Promise<CheckinResponse> {
  const body: Record<string, unknown> = { taskId };
  if (childId) body.childId = childId;
  const res = await api.post<CheckinResponse>('/checkin/submit', body);
  return res.data;
}

/**
 * P65: 获取任务完成率统计
 */
export async function getTaskStats(childId: string): Promise<{ totalTasks: number; completedTasks: number; completionRate: number }> {
  const res = await api.get<{ totalTasks: number; completedTasks: number; completionRate: number }>(`/task/stats?childId=${encodeURIComponent(childId)}`)
  return res.data
}
