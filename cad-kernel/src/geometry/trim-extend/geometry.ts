import {
  TRIM_EXTEND_EPS,
  TWO_PI,
  type ArcGeometry,
  type BoundaryGeometry,
  type LineGeometry,
  type Segment2D,
  type TargetGeometry,
  type TrimExtendEntityLike,
  type TrimExtendPoint,
} from "./types";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function pointDistance(a: TrimExtendPoint, b: TrimExtendPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clonePoint(point: TrimExtendPoint): TrimExtendPoint {
  return { x: point.x, y: point.y };
}

export function parsePoint(value: unknown): TrimExtendPoint | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as { x?: unknown; y?: unknown };
  const x = Number(record.x);
  const y = Number(record.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return { x, y };
}

export function normalizeType(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

export function normalizeAngle(angle: number): number {
  let normalized = angle % TWO_PI;
  if (normalized < 0) {
    normalized += TWO_PI;
  }
  return normalized;
}

export function normalizeArcRange(
  startAngle: number,
  endAngle: number,
  eps: number,
): { startAngle: number; endAngle: number } {
  const start = normalizeAngle(startAngle);
  let end = Number.isFinite(endAngle) ? endAngle : start + TWO_PI;
  while (end <= start + eps) {
    end += TWO_PI;
  }
  return { startAngle: start, endAngle: end };
}

export function arcPoint(arc: ArcGeometry, angle: number): TrimExtendPoint {
  return {
    x: arc.center.x + arc.radius * Math.cos(angle),
    y: arc.center.y + arc.radius * Math.sin(angle),
  };
}

export function arcEndpoint(arc: ArcGeometry, endpoint: "start" | "end"): TrimExtendPoint {
  return arcPoint(arc, endpoint === "start" ? arc.startAngle : arc.endAngle);
}

export function pointClose(a: TrimExtendPoint, b: TrimExtendPoint, eps: number): boolean {
  return pointDistance(a, b) <= eps;
}

export function unwrapAngleNear(angle: number, reference: number): number {
  let unwrapped = angle;
  while (unwrapped - reference > Math.PI) {
    unwrapped -= TWO_PI;
  }
  while (reference - unwrapped > Math.PI) {
    unwrapped += TWO_PI;
  }
  return unwrapped;
}

export function normalizeAngleIntoArc(angle: number, arc: ArcGeometry): number {
  let value = unwrapAngleNear(angle, arc.startAngle);
  while (value < arc.startAngle) {
    value += TWO_PI;
  }
  while (value > arc.endAngle) {
    value -= TWO_PI;
  }
  if (value < arc.startAngle) {
    const deltaToStart = arc.startAngle - value;
    const deltaToEnd = Math.abs(value + TWO_PI - arc.endAngle);
    return deltaToStart <= deltaToEnd ? arc.startAngle : arc.endAngle;
  }
  if (value > arc.endAngle) {
    const deltaToEnd = value - arc.endAngle;
    const deltaToStart = Math.abs(value - TWO_PI - arc.startAngle);
    return deltaToEnd <= deltaToStart ? arc.endAngle : arc.startAngle;
  }
  return value;
}

export function isAngleOnArc(angle: number, arc: ArcGeometry, eps: number): boolean {
  if (arc.isCircle) {
    return true;
  }
  const normalized = normalizeAngle(angle);
  const candidates = [normalized, normalized + TWO_PI, normalized - TWO_PI];
  return candidates.some(
    (candidate) => candidate >= arc.startAngle - eps && candidate <= arc.endAngle + eps,
  );
}

export function parseLineGeometry(entity: TrimExtendEntityLike): LineGeometry | null {
  if (normalizeType(entity.type) !== "LINE") {
    return null;
  }
  const geometry = entity.geometry;
  if (!geometry || typeof geometry !== "object") {
    return null;
  }
  const record = geometry as Record<string, unknown>;
  const start = parsePoint(record.start);
  const end = parsePoint(record.end);
  if (!start || !end) {
    return null;
  }
  if (pointDistance(start, end) <= TRIM_EXTEND_EPS) {
    return null;
  }
  return { start, end };
}

export function parsePolylineSegments(entity: TrimExtendEntityLike, eps: number): Segment2D[] {
  const type = normalizeType(entity.type);
  if (type !== "POLYLINE" && type !== "LWPOLYLINE") {
    return [];
  }
  const geometry = entity.geometry;
  if (!geometry || typeof geometry !== "object") {
    return [];
  }
  const record = geometry as Record<string, unknown>;
  const rawPoints = Array.isArray(record.points) ? record.points : [];
  const points = rawPoints
    .map((point) => parsePoint(point))
    .filter((point): point is TrimExtendPoint => Boolean(point));
  if (points.length < 2) {
    return [];
  }

  const segments: Segment2D[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (pointDistance(start, end) > eps) {
      segments.push({ start, end });
    }
  }

  const closed = Boolean(record.closed);
  if (closed && points.length > 2) {
    const start = points[points.length - 1];
    const end = points[0];
    if (pointDistance(start, end) > eps) {
      segments.push({ start, end });
    }
  }

  return segments;
}

export function parseArcGeometry(entity: TrimExtendEntityLike, eps: number): ArcGeometry | null {
  const type = normalizeType(entity.type);
  if (type !== "ARC" && type !== "CIRCLE") {
    return null;
  }
  const geometry = entity.geometry;
  if (!geometry || typeof geometry !== "object") {
    return null;
  }
  const record = geometry as Record<string, unknown>;
  const center = parsePoint(record.center);
  const radius = Number(record.radius);
  if (!center || !Number.isFinite(radius) || radius <= eps) {
    return null;
  }

  if (type === "CIRCLE") {
    return {
      center,
      radius,
      startAngle: 0,
      endAngle: TWO_PI,
      isCircle: true,
    };
  }

  const startRaw = Number(record.startAngle);
  const endRaw = Number(record.endAngle);
  const startAngle = Number.isFinite(startRaw) ? startRaw : 0;
  const fallbackEnd = startAngle + Math.PI / 2;
  const endAngle = Number.isFinite(endRaw) ? endRaw : fallbackEnd;
  const range = normalizeArcRange(startAngle, endAngle, eps);
  return {
    center,
    radius,
    startAngle: range.startAngle,
    endAngle: range.endAngle,
    isCircle: false,
  };
}

export function parseTargetGeometry(entity: TrimExtendEntityLike, eps: number): TargetGeometry | null {
  const line = parseLineGeometry(entity);
  if (line) {
    return { kind: "line", line };
  }
  const arc = parseArcGeometry(entity, eps);
  if (arc && !arc.isCircle) {
    return { kind: "arc", arc };
  }
  return null;
}

export function parseBoundaryGeometry(
  entity: TrimExtendEntityLike,
  eps: number,
): BoundaryGeometry | null {
  const line = parseLineGeometry(entity);
  if (line) {
    return { kind: "line", line };
  }
  const segments = parsePolylineSegments(entity, eps);
  if (segments.length > 0) {
    return { kind: "polyline", segments };
  }
  const arc = parseArcGeometry(entity, eps);
  if (arc) {
    return { kind: "arc", arc };
  }
  return null;
}

export function isSameFile(entity: TrimExtendEntityLike, target: TrimExtendEntityLike): boolean {
  if (!target.fileId || !entity.fileId) {
    return true;
  }
  return String(entity.fileId) === String(target.fileId);
}
