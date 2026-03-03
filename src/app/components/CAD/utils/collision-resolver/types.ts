import type {
  BoundingBox,
  Point,
} from '../../../../lib/webgpu/CollisionDetectionEngine';

export interface ResolveResult {
  resolved: boolean;
  finalPosition: Point;
  nudgeDirection?: Point;
  nudgeDistance?: number;
}

export interface PartShape {
  id: string;
  position: Point;
  rotation: number;
  boundingBox: BoundingBox;
  outerContour?: { points: Point[] };
}

export const RESOLVE_EPSILON = 1e-4;
export const MAX_NUDGE_DISTANCE = 5000;
