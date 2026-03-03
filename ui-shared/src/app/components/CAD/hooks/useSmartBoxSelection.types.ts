import type { RefObject } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { Viewport } from "../../../components/common/WebGPUCADView/WebGPUCADView";
import type {
  EntityDragEndHandler,
  EntityDragHandler,
  EntityDragStartHandler,
  EntityClickContext,
  SelectionChangeContext,
} from "../types/CADCanvasTypes";

export const TWO_PI = Math.PI * 2;
export const ARC_SEGMENTS_PER_TURN = 96;

export const BOX_SELECTABLE_TYPES = new Set([
  "LINE",
  "CIRCLE",
  "ARC",
  "POLYLINE",
  "LWPOLYLINE",
  "SPLINE",
  "ELLIPSE",
  "TEXT",
  "MTEXT",
  "SOLID",
  "TRACE",
]);

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface ScreenBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface SelectionResult {
  isSelecting: boolean;
  currentRect: Rect | null;
  selectionMode: "window" | "crossing" | null;
  selectedEntityIds: Set<string>;
  selectionCount: number;
}

export interface DragState {
  isDragging: boolean;
  startPos: Point2D;
  currentPos: Point2D;
  initialSelection: Set<string>;
  mouseDownEntityId: string | null;
  mouseDownTime: number;
  isEntityDragging: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  mouseDownScreenPos: Point2D | null;
  mouseDownWorldPos: Point2D | null;
}

export interface UseSmartBoxSelectionProps {
  entities: Entity[];
  viewport: Viewport;
  onSelectionChange: (
    selectedIds: Set<string>,
    context?: SelectionChangeContext,
  ) => void;
  selectedEntityIds?: string[];
  onEntityDragStart?: EntityDragStartHandler;
  onEntityDrag?: EntityDragHandler;
  onEntityDragEnd?: EntityDragEndHandler;
  onEntityDragCancel?: (entityId: string) => void;
  onEntityClick?: (entityId: string, clickContext?: EntityClickContext) => void;
  findEntityAtPosition?: (x: number, y: number) => string | null;
  containerRef?: RefObject<HTMLDivElement>;
}
