import type { CollisionDetectionEngine } from "../../../lib/webgpu/CollisionDetectionEngine";
import type { Plate, Point, NestingPart } from "../types/NestingTypes";
import type { SnapResult } from "./useNestingSnapping";

export type PlacementBoundaryState =
  | "inside_placeable"
  | "inside_forbidden_band"
  | "cross_boundary"
  | "outside_plate";

export type PlacementBoundaryReason =
  | "none"
  | "inside_forbidden_band"
  | "cross_boundary"
  | "outside_plate";

export interface UsePartNestingOptions {
  parts: NestingPart[];
  snappingParts?: NestingPart[];
  plates: Plate[];
  onPartsChange?: (parts: NestingPart[]) => void;
  collisionEngine?: CollisionDetectionEngine | null;
  partSpacing?: number;
  snappingEnabled?: boolean;
  snapTolerance?: number;
  selectedPartIds?: string[];
  zoom: number;
  stickToEdge?: boolean;
  penetrationMode?: boolean;
}

export interface DragPreview {
  partId: string;
  position: Point;
  isValid: boolean;
  hasCollision: boolean;
  hasSpacingInterference: boolean;
  hasBoundaryInterference: boolean;
  hasMarginInterference: boolean;
  boundaryState: PlacementBoundaryState;
  boundaryReason: PlacementBoundaryReason;
  targetPlateId: string | null;
  snapResult: SnapResult | null;
  sourcePartId?: string | null;
  remainingCount?: number;
  isCopyPreview?: boolean;
}

export const DRAG_RESOLVE_DIRECTIONS: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: -1 },
];

export const SPACING_EPSILON = 1e-4;
