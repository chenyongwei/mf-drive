import type { BoundingBox, Point } from '../index';

export type PlanePartType = 'REGULAR' | 'IRREGULAR' | 'UNKNOWN';

export interface ContourOptimization {
  gapsClosed: number;
  duplicatesRemoved: number;
  pointsSimplified: number;
  segmentsConnected: number;
  isRectangularized: boolean;
}

export interface ContourDetail {
  id: string;
  isClosed: boolean;
  isOuter: boolean;
  direction: 'CW' | 'CCW';
  points: Point[];
  length: number;
  area: number;
  shapeType: 'RECTANGLE' | 'POLYGON' | 'CIRCLE' | 'ARC' | 'UNKNOWN';
  isConvex: boolean;
  vertexCount: number;
  bbox: BoundingBox;
  entities: string[];
  optimization?: ContourOptimization;
}

export interface PlanePart {
  id: string;
  fileId: string;
  name: string;
  fileName?: string;
  partNumber: string;
  type: PlanePartType;
  shapeType: 'RECTANGLE' | 'POLYGON' | 'CIRCLE' | 'UNKNOWN';
  outerContour: ContourDetail;
  innerContours: ContourDetail[];
  width: number;
  height: number;
  area: number;
  perimeter: number;
  holeCount: number;
  material?: string;
  thickness?: number;
  bbox: BoundingBox;
  entities?: string[];
  confidence: number;
  createdAt: string;
}

export interface TextInfo {
  id: string;
  text: string;
  position: Point;
  height: number;
  layer: string;
  type: 'NAME' | 'MATERIAL' | 'THICKNESS' | 'DIMENSION' | 'OTHER';
  confidence: number;
}

export interface ParameterExtraction {
  partName?: string;
  material?: string;
  thickness?: number;
  fileName?: string;
  texts: TextInfo[];
}
