// Editing types for CAD manipulation

export type EditMode = 'view' | 'edit' | 'preview';

export type EditTool = 'select' | 'delete' | 'trim' | 'extend' | 'close' | 'recognize';

export interface EditState {
  mode: EditMode;
  tool: EditTool;
  selectedEntityIds: Set<string>;
  hoverEntityId: string | null;
  editHistory: EditOperation[];
  historyIndex: number;
  parts: Map<string, Part>; // fileId -> Parts for that file
  selectedPartIds: Set<string>;
}

export interface EditOperation {
  id: string;
  type: 'delete' | 'modify' | 'trim' | 'extend' | 'create' | 'recognize' | 'explode';
  timestamp: number;
  entityId?: string;
  entityIds?: string[]; // For multi-entity operations
  previousState: any;
  newState: any;
  description: string;
}

export interface Entity {
  id: string;
  type: string;
  geometry?: any;
  color?: number;
  strokeColor?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  partId?: string; // Reference to the part this entity belongs to
}

// Point interface
export interface Point {
  x: number;
  y: number;
  z?: number;
}

// Bounding box
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Contour (closed loop of entities)
export interface Contour {
  id: string;
  isClosed: boolean;
  vertices: Point[];
  entityIds: string[];
  bbox: BoundingBox;
  area: number;
  parentId?: string; // For nested contours
  children?: string[]; // Child contour IDs
}

// Part (recognized closed shape)
export interface Part {
  id: string;
  fileId: string;
  name: string;
  contour: Contour;
  entityIds: string[];
  bbox: BoundingBox;
  area: number;
  color: string; // Semi-transparent color for rendering
  thumbnailUrl?: string;
  createdAt: number;
  isSelected?: boolean;
}

// Trim operation data
export interface TrimOperation {
  entityId: string;
  boundaryEntityId: string;
  trimPoint: Point;
  previousGeometry: any;
  newGeometry: any;
}

// Extend operation data
export interface ExtendOperation {
  entityId: string;
  targetEntityId: string;
  extensionPoint: Point;
  previousGeometry: any;
  newGeometry: any;
}
