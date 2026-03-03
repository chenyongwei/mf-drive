import type { Entity } from '../../lib/webgpu/EntityToVertices';
import type { BoundingBox } from '../../lib/webgpu/CollisionDetectionEngine';
import type { ChannelType } from '../../lib/webgpu/PartFillGenerator';

export interface PartData {
  partId: string;
  originalFilename?: string;
  geometry: {
    boundingBox: BoundingBox;
    area: number;
  };
  entities: Entity[];
}

export interface PartViewerWebCADProps {
  parts: Array<{ partId: string; originalFilename?: string }>;
}

export interface LoadedPart extends PartData {
  offsetX: number;
  offsetY: number;
  isPartMode: boolean;
  channel: ChannelType | string;
}

export interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
}
