import type { ArcGeometry, Segment2D, TrimExtendPoint } from "./types";
import { pointClose } from "./geometry";

export function dedupePoints(points: TrimExtendPoint[], eps: number): TrimExtendPoint[] {
  const unique: TrimExtendPoint[] = [];
  points.forEach((point) => {
    if (!unique.some((candidate) => pointClose(candidate, point, eps))) {
      unique.push(point);
    }
  });
  return unique;
}

export function lineLineIntersectionRaw(
  first: Segment2D,
  second: Segment2D,
  eps: number,
): { point: TrimExtendPoint; t: number; u: number } | null {
  const x1 = first.start.x;
  const y1 = first.start.y;
  const x2 = first.end.x;
  const y2 = first.end.y;
  const x3 = second.start.x;
  const y3 = second.start.y;
  const x4 = second.end.x;
  const y4 = second.end.y;

  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denominator) <= eps) {
    return null;
  }
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denominator;

  return {
    point: {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    },
    t,
    u,
  };
}

export function lineSegmentIntersection(
  first: Segment2D,
  second: Segment2D,
  eps: number,
): TrimExtendPoint | null {
  const raw = lineLineIntersectionRaw(first, second, eps);
  if (!raw) {
    return null;
  }
  if (raw.t < -eps || raw.t > 1 + eps || raw.u < -eps || raw.u > 1 + eps) {
    return null;
  }
  return raw.point;
}

export function raySegmentIntersection(
  origin: TrimExtendPoint,
  direction: TrimExtendPoint,
  segment: Segment2D,
  eps: number,
): { point: TrimExtendPoint; distance: number } | null {
  const raySegment: Segment2D = {
    start: origin,
    end: {
      x: origin.x + direction.x,
      y: origin.y + direction.y,
    },
  };
  const raw = lineLineIntersectionRaw(raySegment, segment, eps);
  if (!raw) {
    return null;
  }
  if (raw.t < eps || raw.u < -eps || raw.u > 1 + eps) {
    return null;
  }
  return {
    point: raw.point,
    distance: raw.t,
  };
}

export function lineCircleIntersections(
  line: Segment2D,
  circle: ArcGeometry,
  eps: number,
): Array<{ point: TrimExtendPoint; t: number }> {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const fx = line.start.x - circle.center.x;
  const fy = line.start.y - circle.center.y;

  const a = dx * dx + dy * dy;
  if (a <= eps) {
    return [];
  }
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - circle.radius * circle.radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < -eps) {
    return [];
  }
  const normalizedDiscriminant = Math.max(0, discriminant);
  const sqrtDiscriminant = Math.sqrt(normalizedDiscriminant);
  const tValues = dedupeNumbers(
    [(-b - sqrtDiscriminant) / (2 * a), (-b + sqrtDiscriminant) / (2 * a)],
    eps,
  );

  return tValues.map((t) => ({
    t,
    point: {
      x: line.start.x + dx * t,
      y: line.start.y + dy * t,
    },
  }));
}

export function rayCircleIntersections(
  origin: TrimExtendPoint,
  direction: TrimExtendPoint,
  circle: ArcGeometry,
  eps: number,
): Array<{ point: TrimExtendPoint; distance: number }> {
  const ray: Segment2D = {
    start: origin,
    end: {
      x: origin.x + direction.x,
      y: origin.y + direction.y,
    },
  };
  return lineCircleIntersections(ray, circle, eps)
    .filter((candidate) => candidate.t >= eps)
    .map((candidate) => ({ point: candidate.point, distance: candidate.t }));
}

export function circleCircleIntersections(
  first: ArcGeometry,
  second: ArcGeometry,
  eps: number,
): TrimExtendPoint[] {
  const dx = second.center.x - first.center.x;
  const dy = second.center.y - first.center.y;
  const d = Math.hypot(dx, dy);
  if (d <= eps) {
    return [];
  }
  if (d > first.radius + second.radius + eps) {
    return [];
  }
  if (d < Math.abs(first.radius - second.radius) - eps) {
    return [];
  }

  const a = (first.radius * first.radius - second.radius * second.radius + d * d) / (2 * d);
  const squaredH = first.radius * first.radius - a * a;
  if (squaredH < -eps) {
    return [];
  }
  const h = Math.sqrt(Math.max(0, squaredH));
  const x2 = first.center.x + (a * dx) / d;
  const y2 = first.center.y + (a * dy) / d;

  const rx = -(dy * h) / d;
  const ry = (dx * h) / d;

  return dedupePoints(
    [
      { x: x2 + rx, y: y2 + ry },
      { x: x2 - rx, y: y2 - ry },
    ],
    eps,
  );
}

export function dedupeNumbers(values: number[], eps: number): number[] {
  const deduped: number[] = [];
  values.forEach((value) => {
    if (!Number.isFinite(value)) {
      return;
    }
    if (!deduped.some((candidate) => Math.abs(candidate - value) <= eps)) {
      deduped.push(value);
    }
  });
  return deduped;
}
