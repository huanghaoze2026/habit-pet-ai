/**
 * 动画配置中心
 *
 * ⚠️ P48 重构：此文件旧配置已弃用。
 *
 * 新的图片路径由 speciesId + stageKey + emotionKey 动态拼接：
 *   https://api.lanyunke.com/uploads/sprites/{speciesId}/{stageKey}_{emotionKey}.png
 *
 * Fallback 逻辑已移至 PetAnimator 组件内部。
 *
 * --- 序列帧预留（后续使用）---
 *
 * interface SpriteSheetConfig {
 *   src: string;             // 序列帧图片路径
 *   frameWidth: number;      // 单帧宽度 (px)
 *   frameHeight: number;    // 单帧高度 (px)
 *   totalFrames: number;    // 总帧数
 *   columns: number;        // 每行列数
 *   rows: number;           // 总行数
 *   fps: number;            // 帧率
 *   scale?: number;         // 缩放倍数 (默认1)
 * }
 */

export type FallbackAnimType = 'breathe' | 'bounce' | 'sway' | 'glow_pulse' | 'wiggle' | 'shake'

// ⚠️ 旧配置（P48 前）— 保留以兼容未迁移代码，未来移除
// 新代码请使用 speciesId + stageKey + emotionKey 模式

/**
 * ⚠️ DEPRECATED: 阶段名称映射（P48 后用后端 speciesName/stageName 替代）
 * P57: 改为通用阶段名称，不再绑定特定物种
 */
export const STAGE_NAMES: Record<string, string> = {
  egg: '蛋仔期',
  baby: '幼体期',
  juvenile: '成长期',
}

/**
 * ⚠️ DEPRECATED: 阶段标签映射（P48 后用后端数据替代）
 * P57: 改为通用阶段标签
 */
export const STAGE_LABELS: Record<string, string> = {
  egg: '🥚 蛋仔期',
  baby: '🔥 幼体期',
  juvenile: '🐉 成长期',
}
