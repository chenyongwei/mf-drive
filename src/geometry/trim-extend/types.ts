export const TRIM_EXTEND_EPS = 1e-6;
export const TWO_PI = Math.PI * 2;

export type TrimExtendErrorCode =
  | "BOUNDARY_REQUIRED"
  | "NO_INTERSECTION"
  | "UNSUPPORTED_TARGET"
  | "UNSUPPORTED_BOUNDARY"
  | "TARGET_NOT_FOUND";

export type TrimExtendCommand = "trim" | "extend";
export type BoundarySource = "auto" | "manual";
export type TrimExtendPoint = { x: number; y: number };

export type TrimExtendEntityLike = {
  id: string;
  fileId?: string | null;
  type: string;
  geometry: Record<string, unknown> | null | undefined;
};

export interface TrimRequest {
  entities: TrimExtendEntityLike[];
  targetEntityId: string;
  clickPoint: TrimExtendPoint;
  boundaryEntityId?: string;
  eps?: number;
}

export interface ExtendRequest {
  entities: TrimExtendEntityLike[];
  targetEntityId: string;
  clickPoint: TrimExtendPoint;
  boundaryEntityId?: string;
  eps?: number;
}

export interface BoundaryInferenceResult {
  boundaryEntityId: string;
  source: BoundarySource;
  intersections: TrimExtendPoint[];
  intersectionPoint: TrimExtendPoint;
}

export interface TrimExtendPlan {
  success: boolean;
  command: TrimExtendCommand;
  updatedEntity?: TrimExtendEntityLike;
  affectedEntityIds: string[];
  boundaryEntityId?: string;
  boundarySource?: BoundarySource;
  intersectionPoint?: TrimExtendPoint;
  errorCode?: TrimExtendErrorCode;
  message?: string;
}

export type LineGeometry = {
  start: TrimExtendPoint;
  end: TrimExtendPoint;
};

export type ArcGeometry = {
  center: TrimExtendPoint;
  radius: number;
  startAngle: number;
  endAngle: number;
  isCircle: boolean;
};

export type Segment2D = {
  start: TrimExtendPoint;
  end: TrimExtendPoint;
};

export type TargetGeometry =
  | { kind: "line"; line: LineGeometry }
  | { kind: "arc"; arc: ArcGeometry };

export type BoundaryGeometry =
  | { kind: "line"; line: LineGeometry }
  | { kind: "polyline"; segments: Segment2D[] }
  | { kind: "arc"; arc: ArcGeometry };

export type BoundaryCandidate = {
  entity: TrimExtendEntityLike;
  intersections: TrimExtendPoint[];
  intersectionPoint: TrimExtendPoint;
  score: number;
};

export type ExtendLineCandidate = {
  intersection: TrimExtendPoint;
  fromEndpoint: "start" | "end";
  extensionLength: number;
};

export type ExtendArcCandidate = {
  intersection: TrimExtendPoint;
  fromEndpoint: "start" | "end";
  nextStartAngle: number;
  nextEndAngle: number;
  extensionAngleDelta: number;
};
