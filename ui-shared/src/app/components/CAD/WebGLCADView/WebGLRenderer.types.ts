import type { Entity } from '../../../lib/webgpu/EntityToVertices';

export type ThemeMode = 'dark' | 'light';

export interface StaticBufferRecord {
  buffer: WebGLBuffer;
  vertexCount: number;
  signature: string;
  visible: boolean;
  entityCount: number;
}

export interface FillDrawCommand {
  outerStart: number;
  outerCount: number;
  holeStart: number;
  holeCount: number;
}

export interface StaticFileBufferPayload {
  fileId: string;
  vertexCount: number;
  entityCount: number;
  buffer: Float32Array;
  signature: string;
  dirty: boolean;
  visible: boolean;
}

export interface FillPartBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface FillPart {
  id: string;
  entities?: unknown[];
  color?: string;
  boundingBox?: FillPartBoundingBox;
  mirroredX?: boolean;
  mirroredY?: boolean;
  rotation?: number;
  position?: { x: number; y: number };
}

export interface RenderOptions {
  selectedEntityIds?: Set<string>;
  hoveredEntityId?: string | null;
  partsForFilling?: FillPart[];
  selectedPartIds?: string[];
  selectedPartId?: string | null;
  partDragPreview?: { partId: string; offset: { x: number; y: number } };
  invalidPartIds?: Set<string>;
}

export interface UpdateBuffersPayload {
  staticFileBuffers?: StaticFileBufferPayload[];
  dynamicEntities?: Entity[];
  previewEntities?: Entity[];
  allEntities?: Entity[];
}
