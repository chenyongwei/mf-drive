import type { BoundingBox, Point } from './base';

// ==================== 排样类型 ====================

export interface PrtsPartSummary {
  partId: string;
  originalFilename?: string;
  entityCount: number;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  area: number;
  width: number;
  height: number;
}

export interface NestingRequest {
  fileId?: string; // 可选，如果提供则使用文件中的所有零件
  partIds?: string[]; // 可选，指定要排样的零件
  material: {
    width: number; // 材料宽度 (mm)
    height: number; // 材料高度 (mm)
    thickness?: number; // 材料厚度 (mm)
    frame?: {
      // 板材图框定义
      x: number; // 图框X偏移 (mm), 默认0
      y: number; // 图框Y偏移 (mm), 默认0
      width: number; // 图框宽度 (mm), 默认等于材料宽度
      height: number; // 图框高度 (mm), 默认等于材料高度
    };
  };
  options: {
    rotationStep?: number; // 旋转角度步长 (度), 默认15
    spacing?: number; // 切割间距 (mm), 默认2
    nestingTime?: number; // 排样时间限制 (秒), 默认30
    algorithms?: NestingAlgorithm[]; // 排样算法, 默认['bottom-left']
    enableNesting?: boolean; // 是否启用内膜嵌套, 默认true
    maxNestingDepth?: number; // 最大嵌套深度, 默认3
  };
}

export type NestingAlgorithm = "bottom-left" | "genetic" | "guillotine";

export interface NestingResult {
  id: string; // 排样任务ID
  status: NestingStatus; // 状态
  progress?: number; // 进度 (0-100)
  currentUtilization?: number; // 当前利用率 (0-1)
  bestLayouts?: Layout[]; // 已找到的最佳布局
  selectedLayoutId?: string; // 选中的布局ID
  materialArea?: number; // 材料总面积
  partsArea?: number; // 零件总面积
  scrapArea?: number; // 余料面积
  nestingTime?: number; // 排样耗时 (秒)
  error?: string; // 错误信息
}

export type NestingStatus =
  | "queued"
  | "running"
  | "completed"
  | "stopped"
  | "error";

export interface Layout {
  id: string; // 布局ID
  utilization: number; // 利用率 (0-1)
  parts: PlacedPart[]; // 放置的零件
  material?: any; // 板材信息（用于DXF导出）
  scrapLines?: ScrapLine[]; // 余料线
  thumbnail?: string; // 缩略图URL
  createdAt: string; // 创建时间
}

export interface PlacedPart {
  partId: string; // 零件ID
  partName: string; // 零件名称
  position: Point; // 位置
  rotation: number; // 旋转角度 (度)
  bbox: BoundingBox; // 边界框 (after rotation and placement)
  nestedInHoleId?: string; // 嵌套在哪个零件的孔洞中 (可选)
  nestedInHolePartId?: string; // 嵌套在哪个零件ID (可选)
  // Note: Full geometry (contour, entities, contours) is NOT included in API response
  // Frontend can fetch geometry by partId when needed for rendering
}

export interface ScrapLine {
  id: string; // 余料线ID
  type: ScrapLineType; // 类型
  points: Point[]; // 顶点
  center?: Point; // 圆心 (仅圆形)
  radius?: number; // 半径 (仅圆形)
  area?: number; // 面积
  createdAt: string; // 创建时间
}

export type ScrapLineType =
  | "LINE"
  | "TRIANGLE"
  | "TRAPEZOID"
  | "CIRCLE"
  | "PART_OUTER";

export interface NestingProgress {
  nestingId: string; // 排样任务ID
  status: NestingStatus; // 状态
  progress: number; // 进度 (0-100)
  currentUtilization: number; // 当前利用率 (0-1)
  currentLayout?: Layout; // 当前布局
}

export interface NestingMaterial {
  width: number;
  height: number;
  thickness: number;
  description?: string;
  frame?: {
    // 图框定义
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 预定义的材料规格
export const MATERIAL_PRESETS: NestingMaterial[] = [
  { width: 2000, height: 1000, thickness: 5, description: "2000×1000×5mm" },
  { width: 2500, height: 1250, thickness: 6, description: "2500×1250×6mm" },
  { width: 3000, height: 1500, thickness: 8, description: "3000×1500×8mm" },
];
