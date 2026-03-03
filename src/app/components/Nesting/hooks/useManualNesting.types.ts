import type { RefObject } from 'react';

import type {
  BoundingBox,
  Point,
} from '../../../lib/webgpu/CollisionDetectionEngine';
import type { Entity } from '../../../lib/webgpu/EntityToVertices';
import type { ChannelType } from '../../../lib/webgpu/PartFillGenerator';

export interface Material {
  width: number;
  height: number;
  innerContours?: Array<{ points: Point[] }>;
}

export interface NestedPart {
  id: string;
  partId: string;
  entities: Entity[];
  channel: ChannelType;
  position: Point;
  rotation: number;
  boundingBox: BoundingBox;
  outerContour: { points: Point[] };
  innerContours?: { points: Point[] }[];
}

export interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
}

export interface DragPosition {
  partId: string;
  position: Point;
}

export interface UseManualNestingProps {
  material: Material;
  parts: NestedPart[];
  viewport: Viewport;
  onPartsChange?: (parts: NestedPart[]) => void;
  onUtilizationChange?: (utilization: number) => void;
  containerRef: RefObject<HTMLDivElement>;
}
