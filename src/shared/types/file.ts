import type { BoundingBox } from './base';
import type { DXFEntity } from './dxf';
import type { Part } from './parts';

// ==================== 文件状态类型 ====================

export type FileStatus = "uploading" | "parsing" | "ready" | "error";

export interface File {
  id: string;
  name: string;
  originalName: string;
  size: number;
  status: FileStatus;
  progress: number;
  uploadPath: string;
  storagePath: string;
  errorMessage?: string;
  entityCount?: number;
  partCount?: number;
  bbox?: BoundingBox;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  createdAt: string;
  entityCount?: number;
  partCount?: number;
  bbox?: BoundingBox;
  errorMessage?: string;
  entities?: DXFEntity[]; // 实体数据（用于生成缩略图）
  parts?: Part[]; // 零件列表（用于树形显示）
  expanded?: boolean; // 是否展开
}
