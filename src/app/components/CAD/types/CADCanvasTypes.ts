/**
 * CADCanvas Types
 */

import { Entity } from "../../../lib/webgpu/EntityToVertices";
import { NestingLayoutViewMode, NestingPart, Plate } from "./NestingTypes";
import { BoundingBox } from "./BoundingBox";
import { CADToolType } from "../CADToolPanel";

export interface EntityClickContext {
  entityId: string;
  worldPoint: { x: number; y: number };
  screenPoint: { x: number; y: number };
  modifiers: {
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
  };
}

export interface SelectionChangeContext {
  source: "click" | "box";
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export const PART_SOURCE_DRAG_MIME = "application/x-mf-part-source";

export interface PartDragSourcePayload {
  sourcePartId: string;
  fileId: string;
  name: string;
}

export interface RemainingPartSummaryItem {
  sourcePartId: string;
  fileId: string;
  name: string;
  total: number;
  placed: number;
  unplaced: number;
}

export type EntityDragStartHandler = (
  entityId: string,
  startScreenPos: ScreenPoint,
) => void;

export type EntityDragHandler = (
  entityId: string,
  currentScreenPos: ScreenPoint,
  delta: ScreenPoint,
) => void;

export type EntityDragEndHandler = (
  entityId: string,
  endScreenPos: ScreenPoint,
) => void;

export interface CADCanvasProps {
  entities?: Entity[];
  selectedFileId: string | null;
  selectedEntityIds?: string[];
  onEntityClick: (entityId: string, clickContext?: EntityClickContext) => void;
  onEntityHover: (entityId: string | null) => void;
  onViewportChange?: (viewport: {
    zoom: number;
    pan: { x: number; y: number };
  }) => void;
  onSelectionChange?: (
    selectedIds: Set<string>,
    context?: SelectionChangeContext,
  ) => void;
  contentBox: BoundingBox | null;
  isNestingMode: boolean;
  isEditMode: boolean;
  editToolsEnabled?: boolean;
  isScaleMode?: boolean;
  selectionBBox?: BoundingBox | null;
  onScale?: (sx: number, sy: number, origin: { x: number; y: number }) => void;
  hoveredEntityId?: string | null;
  partsForFilling?: NestingPart[];
  selectedPartIds?: string[];
  onPartSelectionChange?: (selectedPartIds: string[]) => void;
  layoutViewMode?: NestingLayoutViewMode;
  remainingPartSummary?: RemainingPartSummaryItem[];
  enableFillRendering?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onDelete?: () => void;
  onTrim?: () => void;
  onExtend?: () => void;
  onExplode?: () => void;
  hasEditableEntities?: boolean;
  explodeAnimationPoints?: { x: number; y: number }[];
  files?: { id: string; name: string }[];
  onEntityCreate?: (entity: Entity) => void;
  onStatsUpdate?: (stats: { rendererType: string; fps: number }) => void;
  backgroundColor?: string;
  theme?: "dark" | "light";
  onEntityDragStart?: EntityDragStartHandler;
  onEntityDrag?: EntityDragHandler;
  onEntityDragEnd?: EntityDragEndHandler;
  onEntityDragCancel?: (entityId: string) => void;
  draggedEntityInfo?: { id: string; offset: { x: number; y: number } } | null;
  plates?: Plate[];
  onPartsChange?: (parts: NestingPart[]) => void;
  collisionEngine?: any; // Avoiding circular dependency or complex type import for now, can be improved
  partSpacing?: number;
  showDistanceGuides?: boolean;
  distanceGuideMaxDistance?: number;
  snappingEnabled?: boolean;
  snapTolerance?: number;
  fineRotationStep?: number;
  onFineRotationStepChange?: (val: number) => void;
  onSnappingEnabledChange?: (enabled: boolean) => void;
  onSnapToleranceChange?: (val: number) => void;
  stickToEdge?: boolean;
  penetrationMode?: boolean;
  activeTool?: CADToolType;
  onToolSelect?: (tool: CADToolType) => void;
  showDimensions?: boolean;
  onToggleShowDimensions?: () => void;
  toolpathOverlaySegments?: ToolpathOverlaySegment[];
}

export interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
}

import { SnapPoint } from "../hooks/useSnapping";
export type { SnapPoint };

export interface ToolpathOverlaySegment {
  segmentId: string;
  kind: "CUT" | "RAPID" | "LEAD_IN" | "LEAD_OUT";
  partId?: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  contourId?: string;
  preserve?: boolean;
}
