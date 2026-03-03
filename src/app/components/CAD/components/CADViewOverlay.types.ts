import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { ArrowMarkerDef, ToolpathArrowLod } from "../hooks/useCADViewToolpathArrows";
import type { PlacementBoundaryReason, PlacementBoundaryState } from "../hooks/usePartNesting.types";
import type { ToolpathOverlaySegment, Viewport } from "../types/CADCanvasTypes";
import type { NestingPart } from "../types/NestingTypes";
import type { AlignmentGuide } from "./AlignmentGuides";

export interface CADViewSnapState {
  snapped: boolean;
  snapPoint?: { x: number; y: number };
  targetPoint?: { x: number; y: number };
  snapType?: string;
}

export interface CADViewDragPreviewFlags {
  isValid: boolean;
  hasCollision: boolean;
  hasSpacingInterference: boolean;
  hasBoundaryInterference: boolean;
  hasMarginInterference: boolean;
  boundaryState: PlacementBoundaryState;
  boundaryReason: PlacementBoundaryReason;
  targetPlateId: string | null;
  isCopyPreview: boolean;
  copyRemainingCount: number;
}

export interface CADViewSceneProps {
  containerSize: { width: number; height: number };
  activeViewport: Viewport;
  theme: "dark" | "light";
  isNestingMode: boolean;
  alignmentGuides: AlignmentGuide[];
  draggingPartId: string | null;
  currentSnap: CADViewSnapState | null;
  effectiveParts: NestingPart[];
  partSpacing: number;
  dragPreviewFlags: CADViewDragPreviewFlags;
  lastValidDragPosition: { x: number; y: number } | null;
  toolpathOverlaySegments: ToolpathOverlaySegment[];
  arrowMarkerCut: ArrowMarkerDef;
  arrowMarkerAux: ArrowMarkerDef;
  arrowLod: ToolpathArrowLod;
  segmentArrowPointsById: Map<string, Array<{ x: number; y: number }>>;
  cutStrokeWidth: number;
  auxStrokeWidth: number;
  showDimensions: boolean;
  entitiesForDimensions: Entity[];
  textOverlayEntities: Entity[];
  selectedPartIds: string[];
  selectedEntityIds: Set<string>;
  hoveredEntityId: string | null;
}
