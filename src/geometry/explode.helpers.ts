import type {
  ArcGeometry2D,
  ExplodeEntityLike,
  ExplodeEntityType,
  ExplodePoint,
  LineSegment2D,
} from './explode.types';

export function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function toFiniteNumber(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}

function toPoint(value: unknown): ExplodePoint | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }
  const x = toFiniteNumber(record.x);
  const y = toFiniteNumber(record.y);
  if (x === null || y === null) {
    return null;
  }
  return { x, y };
}

export function toPointArray(value: unknown): ExplodePoint[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((point) => toPoint(point))
    .filter((point): point is ExplodePoint => Boolean(point));
}

export function normalizeType(value: unknown): ExplodeEntityType | null {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (
    normalized === 'LINE' ||
    normalized === 'POLYLINE' ||
    normalized === 'LWPOLYLINE' ||
    normalized === 'CIRCLE' ||
    normalized === 'ARC'
  ) {
    return normalized;
  }
  return null;
}

export function normalizeAngle(angle: number): number {
  let normalized = angle % (Math.PI * 2);
  if (normalized < 0) {
    normalized += Math.PI * 2;
  }
  return normalized;
}

export function distanceBetweenPoints(a: ExplodePoint, b: ExplodePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointsClose(a: ExplodePoint, b: ExplodePoint, tolerance: number): boolean {
  return distanceBetweenPoints(a, b) <= tolerance;
}

export function isPointOnSegment(
  point: ExplodePoint,
  segment: LineSegment2D,
  tolerance: number,
): boolean {
  const { start, end } = segment;
  const cross = (point.y - start.y) * (end.x - start.x) - (point.x - start.x) * (end.y - start.y);
  if (Math.abs(cross) > tolerance) {
    return false;
  }
  const dot = (point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y);
  if (dot < -tolerance) {
    return false;
  }
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  return dot <= lengthSquared + tolerance;
}

export function uniquePoints(points: ExplodePoint[], tolerance: number): ExplodePoint[] {
  const deduped: ExplodePoint[] = [];
  points.forEach((point) => {
    if (!deduped.some((candidate) => pointsClose(candidate, point, tolerance))) {
      deduped.push(point);
    }
  });
  return deduped;
}

export function uniqueNumbers(values: number[], tolerance = 1e-6): number[] {
  const deduped: number[] = [];
  values.forEach((value) => {
    if (!deduped.some((candidate) => Math.abs(candidate - value) <= tolerance)) {
      deduped.push(value);
    }
  });
  return deduped;
}

export function lineParam(segment: LineSegment2D, point: ExplodePoint): number {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const denominator = dx * dx + dy * dy;
  if (denominator <= 1e-9) {
    return 0;
  }
  return ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) / denominator;
}

export function extractLineSegment(
  entity: ExplodeEntityLike,
  tolerance: number,
): LineSegment2D | null {
  const geometry = toRecord(entity.geometry);
  const start = toPoint(geometry?.start);
  const end = toPoint(geometry?.end);
  if (!start || !end || pointsClose(start, end, tolerance)) {
    return null;
  }
  return { start, end };
}

export function extractArcGeometry(entity: ExplodeEntityLike): ArcGeometry2D | null {
  const type = normalizeType(entity.type);
  const geometry = toRecord(entity.geometry);
  const center = toPoint(geometry?.center);
  const radius = toFiniteNumber(geometry?.radius);
  if (!type || !center || radius === null || radius <= 0) {
    return null;
  }

  if (type === 'CIRCLE') {
    return { center, radius, startAngle: 0, endAngle: Math.PI * 2, isCircle: true };
  }
  if (type !== 'ARC') {
    return null;
  }

  const startAngle = toFiniteNumber(geometry?.startAngle) ?? 0;
  let endAngle = toFiniteNumber(geometry?.endAngle) ?? Math.PI * 2;
  if (endAngle <= startAngle) {
    endAngle += Math.PI * 2;
  }
  return { center, radius, startAngle, endAngle, isCircle: false };
}

function isAngleWithinArc(angle: number, arc: ArcGeometry2D): boolean {
  if (arc.isCircle) {
    return true;
  }
  const normalizedAngle = normalizeAngle(angle);
  const normalizedStart = normalizeAngle(arc.startAngle);
  let normalizedEnd = arc.endAngle;
  while (normalizedEnd <= normalizedStart) {
    normalizedEnd += Math.PI * 2;
  }

  let probe = normalizedAngle;
  while (probe < normalizedStart) {
    probe += Math.PI * 2;
  }
  return probe <= normalizedEnd + 1e-6;
}

export function isPointOnArc(point: ExplodePoint, arc: ArcGeometry2D): boolean {
  const angle = Math.atan2(point.y - arc.center.y, point.x - arc.center.x);
  return isAngleWithinArc(angle, arc);
}

export function collectEntitySegments(
  entity: ExplodeEntityLike,
  tolerance: number,
): LineSegment2D[] {
  const type = normalizeType(entity.type);
  if (!type) {
    return [];
  }

  if (type === 'LINE') {
    const line = extractLineSegment(entity, tolerance);
    return line ? [line] : [];
  }
  if (type !== 'POLYLINE' && type !== 'LWPOLYLINE') {
    return [];
  }

  const geometry = toRecord(entity.geometry);
  const points = toPointArray(geometry?.points);
  if (points.length < 2) {
    return [];
  }

  const segments: LineSegment2D[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (!pointsClose(start, end, tolerance)) {
      segments.push({ start, end });
    }
  }

  if (
    Boolean(geometry?.closed) &&
    points.length > 2 &&
    !pointsClose(points[0], points[points.length - 1], tolerance)
  ) {
    segments.push({ start: points[points.length - 1], end: points[0] });
  }

  return segments;
}
