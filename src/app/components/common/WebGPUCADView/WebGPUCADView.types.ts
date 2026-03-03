import { Entity } from '../../../lib/webgpu/EntityToVertices';
import { TextLabel } from '../../../lib/webgpu/TextRenderingManager';
import { InspectionLevel } from '@dxf-fix/shared/types/inspection';
import { ZoomControlsPosition } from './WebGPUZoomControls';
import { FPSDisplayPosition } from './WebGPUFPSDisplay';

export interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface InspectionMarker {
  id: string;
  x: number;
  y: number;
  level: InspectionLevel;
  selected: boolean;
  hovered: boolean;
}

export interface PartFillData {
  id: string;
  entities: Entity[];
  color: string;
}

export interface WebGPUCADViewProps {
  width: number;
  height: number;
  entities: Entity[];
  partsForFilling?: PartFillData[];
  enableFillRendering?: boolean;
  inspectionMarkers?: InspectionMarker[];
  textLabels?: TextLabel[];
  explodingEntityIds?: string[];
  files?: { id: string; name: string }[];
  collabInfo?: string;
  selectedEntityIds?: Set<string>;
  hoveredEntityId?: string | null;
  onEntityClick?: (id: string) => void;
  onEntityHover?: (id: string | null) => void;
  onMarkerClick?: (id: string) => void;
  onMarkerHover?: (id: string | null) => void;
  autoFitOnMount?: boolean;
  contentBox?: BoundingBox;
  showRuler?: boolean;
  showZoomControls?: boolean;
  showFPS?: boolean;
  backgroundColor?: string;
  zoomControlsPosition?: ZoomControlsPosition;
  fpsPosition?: FPSDisplayPosition;
  showFitToView?: boolean;
  children?: React.ReactNode;
  fps?: number;
  fillVertexCount?: number;
  disablePan?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  showUndoRedo?: boolean;
}

export interface WebGPUCADViewRef {
  fitToView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getViewport: () => Viewport;
  setViewport: (viewport: Viewport) => void;
}
