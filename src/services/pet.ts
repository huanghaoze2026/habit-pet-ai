/**
 * 宠物服务
 */

import api from './api';

/** 宠物互动响应 */
export interface PetInteractionResponse {
  affection: number;
  mood: number;
  level: number;
}

/**
 * 抚摸宠物
 *
 * @param petId 宠物 ID
 * @returns 亲密度、心情、等级
 */
export async function petPet(petId: string): Promise<PetInteractionResponse> {
  const res = await api.post<PetInteractionResponse>(`/pets/${petId}/pet`);
  return res.data;
}

/**
 * 获取宠物信息
 */
export async function getPetInfo(petId: string): Promise<unknown> {
  const res = await api.get(`/pets/${petId}`);
  return res.data;
}

/**
 * 获取宠物列表
 */
export async function getPetList(): Promise<unknown> {
  const res = await api.get('/pets');
  return res.data;
}
