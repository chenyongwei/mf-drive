import axios from 'axios';
import type {
  NestingRequest,
  NestingResult,
  NestingProgress,
  PrtsPartSummary,
} from '@dxf-fix/shared';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000,
  withCredentials: true,
});

// ==================== Prts零件API ====================

/**
 * 获取所有prts零件列表
 */
export const getAllPrtsParts = async (): Promise<{
  parts: PrtsPartSummary[];
  total: number;
}> => {
  const response = await api.get('/prts/all');
  return response.data;
};

/**
 * 获取单个prts零件详情
 */
export const getPrtsPart = async (partId: string): Promise<any> => {
  const response = await api.get(`/prts/${partId}`);
  return response.data;
};

// ==================== 排样API ====================

/**
 * 启动排样
 */
export const startNesting = async (request: NestingRequest): Promise<NestingResult> => {
  const response = await api.post('/nest/start', request);
  return response.data;
};

/**
 * 获取排样进度
 */
export const getNestingProgress = async (
  nestingId: string
): Promise<NestingProgress> => {
  const response = await api.get(`/nest/status/${nestingId}`);
  return response.data;
};

/**
 * 停止排样
 */
export const stopNesting = async (nestingId: string): Promise<NestingResult> => {
  const response = await api.post(`/nest/stop/${nestingId}`);
  return response.data;
};

/**
 * 获取排样结果
 */
export const getNestingResult = async (nestingId: string): Promise<NestingResult> => {
  const response = await api.get(`/nest/result/${nestingId}`);
  return response.data;
};

// ==================== 辅助函数 ====================

/**
 * 生成随机板材尺寸
 */
export const generateRandomMaterial = (): {
  width: number;
  height: number;
} => {
  // 长度: 2米到10米之间 (2000-10000mm)
  const width = Math.floor(Math.random() * 8000) + 2000;
  // 宽度: 1米到4米之间 (1000-4000mm)
  const height = Math.floor(Math.random() * 3000) + 1000;

  return { width, height };
};

/**
 * 随机选择零件并生成数量
 */
export const selectRandomPartsWithQuantity = (
  allParts: PrtsPartSummary[],
  maxCount: number = 100
): Array<{
  part: PrtsPartSummary;
  quantity: number;
}> => {
  // 随机打乱
  const shuffled = [...allParts].sort(() => Math.random() - 0.5);
  // 最多选择maxCount种零件
  const selected = shuffled.slice(0, Math.min(allParts.length, maxCount));

  // 为每种零件生成随机数量 (1-10个)
  return selected.map((part) => ({
    part,
    quantity: Math.floor(Math.random() * 10) + 1,
  }));
};

export default api;
