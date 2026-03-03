import type { NestingPart, Plate, Point } from "../types/NestingTypes";

export type SnapType = "edge" | "corner" | "center";

export interface SnapPoint {
  type: SnapType;
  position: Point;
  partId: string;
  isInnerContour?: boolean;
  edgeDirection?: Point;
  edgeStart?: Point;
  edgeEnd?: Point;
}

export interface SnapResult {
  snapped: boolean;
  snapPosition: Point;
  snapPoint: SnapPoint | null;
  targetPoint: SnapPoint | null;
  snapType: string | null;
  alternatives?: SnapResult[];
}

export interface UseNestingSnappingOptions {
  enabled?: boolean;
  snapTolerance?: number;
  snapToEdges?: boolean;
  snapToCorners?: boolean;
  snapToCenters?: boolean;
  snapToSheets?: boolean;
  partSpacing?: number;
  allParts?: NestingPart[];
  plates?: Plate[];
}

export interface StickySnapState {
  draggedPartId: string;
  keyX?: string;
  keyY?: string;
  keyBoth?: string;
}

export interface SnapCandidate {
  result: SnapResult;
  score: number;
  key: string;
  axisMode: "x" | "y" | "both";
  deltaX: number;
  deltaY: number;
}

export interface SnapOption {
  result: SnapResult;
  score: number;
  axisCount: number;
  keyX?: string;
  keyY?: string;
  keyBoth?: string;
}

export interface CandidateBuckets {
  bestXCandidate: SnapCandidate | null;
  bestYCandidate: SnapCandidate | null;
  bestBothCandidate: SnapCandidate | null;
}

export const SNAP_RELEASE_EXTRA = 4;
export const SNAP_STICKY_BIAS = 0.7;
export const SNAP_KEY_PRECISION = 3;
