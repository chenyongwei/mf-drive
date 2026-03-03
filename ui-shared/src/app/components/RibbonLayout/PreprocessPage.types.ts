import type { InspectionResult } from '@dxf-fix/shared/types/inspection';

export interface PreprocessPart {
  id: string;
  name: string;
  fileId: string;
  fileName: string;
  thumbnailUrl?: string;
  dimensions: { width: number; height: number };
  bbox: any;
}

export interface ImportedFile {
  id: string;
  name: string;
  thumbnailUrl?: string;
  parts: PreprocessPart[];
  status: 'uploading' | 'parsing' | 'ready' | 'error';
  progress?: number;
  bbox?: { minX: number; minY: number; maxX: number; maxY: number };
  inspectionResult?: InspectionResult;
  inspectionLoading?: boolean;
}

export interface TiledLayout {
  fileId: string;
  position: { x: number; y: number };
  scale: number;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
}
