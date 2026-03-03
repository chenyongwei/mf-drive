/**
 * Type definitions for RibbonLayoutV2 component
 */

export interface Part {
  id: string;
  name: string;
  fileId: string;
  fileName: string; // 图纸文件名
  dimensions: { width: number; height: number };
  quantity: number;
  material?: string;
  thickness?: number;
  area?: number;
  status: 'nested' | 'pending';
  thumbnail?: string;
  thumbnailUrl?: string; // 零件缩略图URL
  fileThumbnailUrl?: string; // 图纸缩略图URL
  bbox?: any;
  position?: { x: number; y: number };
  rotation?: number;
  filePath?: string;
  importTime?: string;
}

export interface NestResult {
  id: string;
  name: string;
  utilization: number;
  sheetDimensions: { width: number; height: number };
  partsCount: number;
  totalPartsCount?: number;
  timestamp: string;
  status: 'draft' | 'confirmed' | 'exported';
  thumbnail?: string;
  isLocked?: boolean;
}

export interface MaterialGroup {
  id: string;
  material: string;
  thickness: number;
  partCount: number;
  totalQuantity: number;
  nestedCount: number;
  nestResultCount: number;
  hasUnsavedChanges: boolean;
  isNesting?: boolean;
  nestingProgress?: number;
  nestingUtilization?: number;
}

export type ViewMode = 'parts' | 'nesting' | 'multi' | 'empty';
export type SortBy = 'id' | 'name' | 'area' | 'time' | 'status';
export type DisplayMode = 'list' | 'thumbnail' | 'detail';
export type PageMode = 'normal' | 'preprocess';

export interface NestingSettings {
  sheetWidth: number;
  sheetHeight: number;
  partSpacing: number;
  margin: number;
}
