export type ExplodePoint = {
  x: number;
  y: number;
};

export type ExplodeEntityType =
  | 'LINE'
  | 'POLYLINE'
  | 'LWPOLYLINE'
  | 'CIRCLE'
  | 'ARC';

export type ExplodeLineGeometry = {
  start: ExplodePoint;
  end: ExplodePoint;
};

export type ExplodePolylineGeometry = {
  points: ExplodePoint[];
  closed: boolean;
};

export type ExplodeCircleGeometry = {
  center: ExplodePoint;
  radius: number;
};

export type ExplodeArcGeometry = {
  center: ExplodePoint;
  radius: number;
  startAngle: number;
  endAngle: number;
};

export type ExplodeGeometry =
  | ExplodeLineGeometry
  | ExplodePolylineGeometry
  | ExplodeCircleGeometry
  | ExplodeArcGeometry;

export type ExplodeEntityLike = {
  id: string;
  type: string;
  geometry?: unknown;
};

export type ExplodeSegmentPlan =
  | {
      type: 'LINE';
      geometry: ExplodeLineGeometry;
    }
  | {
      type: 'ARC';
      geometry: ExplodeArcGeometry;
    };

export type ExplodePlan = {
  segments: ExplodeSegmentPlan[];
  animationPoints: ExplodePoint[];
};

export type ExplodePlanOptions = {
  tolerance?: number;
};

export type LineSegment2D = {
  start: ExplodePoint;
  end: ExplodePoint;
};

export type ArcGeometry2D = {
  center: ExplodePoint;
  radius: number;
  startAngle: number;
  endAngle: number;
  isCircle: boolean;
};
