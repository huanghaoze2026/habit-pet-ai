/**
 * 虚拟支付服务
 * 微信小程序虚拟支付（道具直购）接口封装
 */

import { api } from './api';

interface CreateOrderParams {
  childData: Record<string, any>;
  wxCode: string;
  envVersion?: string;
}

interface CreateOrderResult {
  outTradeNo: string;
  signData: string;    // JSON string，直接传给 wx.requestVirtualPayment
  paySig: string;
  signature: string;
  orderId: string;
}

interface ConfirmOrderResult {
  success: boolean;
  child?: { id: string; nickname: string };
}

/**
 * 创建虚拟支付订单（后端生成签名）
 */
export async function createPaymentOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const res = await api.post<CreateOrderResult>('/xpay/create-order', params);
  return res.data;
}

/**
 * 确认支付完成
 */
export async function confirmPaymentOrder(outTradeNo: string): Promise<ConfirmOrderResult> {
  const res = await api.post<ConfirmOrderResult>('/xpay/confirm-order', { outTradeNo });
  return res.data;
}
