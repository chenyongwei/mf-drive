import type { ProcessType } from './parts';

// ==================== 规则配置类型 ====================

export interface LayerMapping {
  layerName: string;
  processType: ProcessType;
  enabled: boolean;
}

export interface OptimizationRules {
  tolerance: number;
  autoMergeLines: boolean;
  removeDuplicates: boolean;
  autoCloseContours: boolean;
  closeGapThreshold: number;
  layerMappings: LayerMapping[];
}
