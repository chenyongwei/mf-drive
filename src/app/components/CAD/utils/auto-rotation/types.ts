import type {
  BoundingBox,
  Point,
} from '../../../../lib/webgpu/CollisionDetectionEngine';

export interface PartForRotation {
  id: string;
  position: Point;
  rotation: number;
  boundingBox: BoundingBox;
  contour?: Point[];
}

export interface AutoRotateResult {
  shouldRotate: boolean;
  suggestedAngle: number;
  rotationDelta?: number;
  matchedEdgeAngle?: number;
}

export interface EdgeSegment {
  start: Point;
  end: Point;
  length: number;
  angle: number;
}
