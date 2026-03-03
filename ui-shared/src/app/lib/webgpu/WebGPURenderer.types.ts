import type React from "react";
import type { InspectionLevel } from "@dxf-fix/shared/types/inspection";
import type { Entity } from "./EntityToVertices";
import type { TextLabel } from "./TextRenderingManager";

export interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
}

export interface InspectionMarker {
  id: string;
  x: number;
  y: number;
  level: InspectionLevel;
  selected: boolean;
  hovered: boolean;
}

export interface WebGPURendererProps {
  width: number;
  height: number;
  viewport: Viewport;
  entities: Entity[];
  selectedEntityIds?: Set<string>;
  hoveredEntityId?: string | null;
  inspectionMarkers?: InspectionMarker[];
  textLabels?: TextLabel[];
  onMarkerClick?: (markerId: string) => void;
  onMarkerHover?: (markerId: string | null) => void;
  explodingEntityIds?: string[];
  files?: { id: string; name: string }[];
  collabInfo?: string;
  onEntityClick?: (entityId: string) => void;
  onEntityHover?: (entityId: string | null) => void;
  onWheel?: (e: WheelEvent) => void;
  onDragEnd?: (pan: { x: number; y: number }) => void;
  disablePan?: boolean;
  backgroundColor?: string;
  partsForFilling?: Array<{
    id: string;
    entities: Entity[];
    color: string;
    position?: { x: number; y: number };
    rotation?: number;
  }>;
  enableFillRendering?: boolean;
  onFPSUpdate?: (fps: number) => void;
}

export interface WebGPURendererRef {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}
