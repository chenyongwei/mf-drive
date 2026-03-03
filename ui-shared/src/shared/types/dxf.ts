import type { Point } from './base';

// ==================== DXF实体类型 ====================

export type EntityType =
  | "LINE"
  | "ARC"
  | "POLYLINE"
  | "CIRCLE"
  | "SPLINE"
  | "ELLIPSE"
  | "TEXT"
  | "MTEXT"
  | "DIMENSION"
  | "SOLID";

export interface DXFEntity {
  id: string;
  type: EntityType;
  layer: string;
  color: number;
  handle: string;
  geometry: EntityGeometry;
}

export type EntityGeometry =
  | LineGeometry
  | ArcGeometry
  | CircleGeometry
  | PolylineGeometry
  | SplineGeometry
  | EllipseGeometry
  | TextGeometry
  | MTextGeometry
  | DimensionGeometry
  | SolidGeometry;

export interface LineGeometry {
  start: Point;
  end: Point;
}

export interface ArcGeometry {
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface CircleGeometry {
  center: Point;
  radius: number;
}

export interface PolylineGeometry {
  points: Point[];
  closed: boolean;
}

export interface SplineGeometry {
  controlPoints: Point[];
  degree: number;
  closed: boolean;
}

export interface EllipseGeometry {
  center: Point;
  majorAxis: Point;
  minorAxisRatio: number;
  startAngle: number;
  endAngle: number;
}

export interface TextGeometry {
  position: Point;
  height: number;
  text: string;
  rotation: number;
  style: string;
}

export interface MTextGeometry {
  position: Point;
  height: number;
  width: number;
  text: string;
  rotation: number;
  style: string;
  attachmentPoint: number;
}

export interface DimensionGeometry {
  type: string;
  position: Point;
  text: string;
  textPosition: Point;
  points: Point[];
}

export interface SolidGeometry {
  points: Point[];
}
