import type { BoundingBox, Point } from './base';
import type { DXFEntity } from './dxf';

// ==================== 零件与轮廓类型 ====================

export type ProcessType = "CUT" | "MARK" | "NONE";

export interface Contour {
  id: string;
  entities: string[];
  vertices: Point[];
  area: number;
  isClosed: boolean;
  isOuter: boolean;
  direction: "CW" | "CCW";
  holes: string[];
  bbox: BoundingBox;
  sourceEntityIds?: string[];
  graphicDocumentId?: string;
}

export interface Part {
  id: string;
  name: string;
  fileName?: string; // 文件名
  fileId: string;
  contours: Contour[];
  processType: ProcessType;
  bbox: BoundingBox;
  area: number;
  perimeter: number;
  thumbnail?: string; // 缩略图 URL
  entities?: DXFEntity[]; // 实体数据（用于前端生成缩略图）
  sourceEntityIds?: string[];
  graphicDocumentId?: string;
}
