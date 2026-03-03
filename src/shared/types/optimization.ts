import type { Point } from './base';

// ==================== 优化预览类型 ====================

export interface OptimizationPreview {
  duplicates: DuplicateInfo[];
  merges: MergeInfo[];
  closures: ClosureInfo[];
  summary: PreviewSummary;
}

export interface DuplicateInfo {
  groupId: string;
  entityIds: string[];
  keepEntityId: string;
  line: {
    start: Point;
    end: Point;
  };
}

export interface MergeInfo {
  groupId: string;
  entityIds: string[];
  mergeTo: string;
  connectionPoints: Point[];
  mergedPolyline: Point[];
}

export interface ClosureInfo {
  entityIds: string[];
  closeLine: {
    start: Point;
    end: Point;
  };
  gapDistance: number;
}

export interface PreviewSummary {
  duplicatesCount: number;
  mergesCount: number;
  closuresCount: number;
  estimatedReduction: number;
}
