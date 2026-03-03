import type { BoundingBox } from './base';
import type { EntityGeometry, EntityType } from './dxf';
import type { ProcessType } from './parts';

// ==================== 通用图形文档类型 ====================

export type GraphicSourceFormat = "DXF" | "DWG" | "SVG" | "PRT" | "JSON" | "UNKNOWN";
export type GraphicUnit = "mm" | "cm" | "inch" | "mil";
export type GraphicUnitConfidence = "declared" | "derived" | "assumed";

export interface GraphicDocumentMeta {
  fileId: string;
  revisionId: string;
  canonicalVersion: string;
  sourceFormat: GraphicSourceFormat;
  unit: GraphicUnit;
  sourceUnit?: GraphicUnit | "unknown";
  unitConfidence?: GraphicUnitConfidence;
  coordinateSystem: "cartesian" | "polar";
  createdAt: string;
  updatedAt: string;
  adapter: string;
  bbox: BoundingBox;
}

export interface GraphicDocument {
  meta: GraphicDocumentMeta;
  entities: Record<string, GraphicEntity>;
  topology: GraphicTopology;
  indexes: GraphicIndexes;
  stats: GraphicStats;
  chunks?: GraphicChunk[];
}

export interface GraphicEntity {
  id: string;
  type: EntityType;
  geometry: EntityGeometry;
  style?: GraphicStyle;
  layerId?: string;
  partIds?: string[];
  attributes?: Record<string, unknown>;
  versionToken?: string;
  source?: {
    adapter: string;
    handle?: string;
  };
}

export interface GraphicStyle {
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  lineType?: "continuous" | "dashed" | "dotted";
  opacity?: number;
  fontFamily?: string;
  fontSize?: number;
  textAlignment?: "left" | "center" | "right";
  metadata?: Record<string, unknown>;
}

export interface GraphicTopology {
  layers: GraphicLayer[];
  contours: GraphicTopologyContour[];
  parts: GraphicTopologyPart[];
}

export interface GraphicLayer {
  id: string;
  name: string;
  color?: string;
  visible: boolean;
  locked: boolean;
  order: number;
  sourceName?: string;
}

export interface GraphicTopologyContour {
  id: string;
  entityIds: string[];
  holeEntityIds?: string[][];
  bbox: BoundingBox;
  isOuter: boolean;
  partId?: string;
  sourceEntityIds?: string[];
}

export interface GraphicTopologyPart {
  id: string;
  name: string;
  contourIds: string[];
  material?: string;
  processType?: ProcessType;
  metadata?: Record<string, unknown>;
  sourceEntityIds?: string[];
}

export interface GraphicChunk {
  id: string;
  bbox: BoundingBox;
  entityIds: string[];
  level: number;
}

export interface GraphicIndexes {
  entityToLayers: Record<string, string[]>;
  entityToParts: Record<string, string[]>;
  layerOrder: string[];
  spatialIndex?: {
    gridSize: number;
    maxEntitiesPerCell: number;
  };
}

export interface GraphicStats {
  entityCount: number;
  contourCount: number;
  partCount: number;
  lastOpSeq: number;
}

export type GraphicOperationType =
  | "ADD_ENTITY"
  | "UPDATE_GEOMETRY"
  | "UPDATE_STYLE"
  | "DELETE_ENTITY"
  | "MOVE_ENTITY"
  | "BATCH_TRANSFORM"
  | "UPDATE_TOPOLOGY"
  | "ATTACH_METADATA";

export interface GraphicOperation {
  opSeq: number;
  opId: string;
  type: GraphicOperationType;
  timestamp: string;
  clientUnit?: GraphicUnit;
  origin?: "API" | "SYSTEM" | "ADAPTER";
  author?: {
    id?: string;
    name?: string;
  };
  targetIds?: string[];
  payload?: Record<string, unknown>;
  patch?: {
    before?: Partial<GraphicEntity>;
    after?: Partial<GraphicEntity>;
  };
  dependencies?: string[];
  versionToken?: string;
}

export interface GraphicManifest {
  fileId: string;
  latestSnapshotId: string;
  latestSnapshotVersion: number;
  latestSnapshotOpSeq: number;
  lastOpSeq: number;
  unit: GraphicUnit;
  sourceUnit?: GraphicUnit | "unknown";
  canonicalFormatVersion: string;
  sourceFiles: GraphicSourceFile[];
  adapters: GraphicAdapterInfo[];
  chunks?: GraphicChunkManifestEntry[];
  compactedBefore?: number;
  lastCompactionAt?: string;
  nextCompactionThreshold?: number;
}

export interface GraphicSourceFile {
  format: GraphicSourceFormat;
  version: string;
  objectPath: string;
  uploadedAt: string;
}

export interface GraphicAdapterInfo {
  name: string;
  version: string;
  supportsOperations: boolean;
}

export interface GraphicChunkManifestEntry {
  id: string;
  objectPath: string;
  bbox: BoundingBox;
  level: number;
}

export interface GraphicOperationBatch {
  manifest: GraphicManifest;
  snapshot?: GraphicDocument;
  operations: GraphicOperation[];
}
