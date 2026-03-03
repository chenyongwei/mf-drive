import type {
  ArcGeometry2D,
  ExplodeEntityLike,
  ExplodePoint,
  LineSegment2D,
} from './explode.types';
import {
  collectEntitySegments,
  extractArcGeometry,
  isPointOnArc,
  isPointOnSegment,
  lineParam,
  uniquePoints,
} from './explode.helpers';

export function findLineIntersection(
  lineA: LineSegment2D,
  lineB: LineSegment2D,
): ExplodePoint | null {
  const x1 = lineA.start.x;
  const y1 = lineA.start.y;
  const x2 = lineA.end.x;
  const y2 = lineA.end.y;
  const x3 = lineB.start.x;
  const y3 = lineB.start.y;
  const x4 = lineB.end.x;
  const y4 = lineB.end.y;

  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denominator) < 1e-10) {
    return null;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
  if (t < 0 || t > 1 || u < 0 || u > 1) {
    return null;
  }
  return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
}

export function findLineCircleIntersection(
  line: LineSegment2D,
  circle: ArcGeometry2D,
): ExplodePoint[] {
  const x1 = line.start.x;
  const y1 = line.start.y;
  const x2 = line.end.x;
  const y2 = line.end.y;
  const cx = circle.center.x;
  const cy = circle.center.y;
  const r = circle.radius;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return [];
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDiscriminant) / (2 * a);
  const t2 = (-b + sqrtDiscriminant) / (2 * a);
  const intersections: ExplodePoint[] = [];

  if (t1 >= 0 && t1 <= 1) {
    intersections.push({ x: x1 + t1 * dx, y: y1 + t1 * dy });
  }
  if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-10) {
    intersections.push({ x: x1 + t2 * dx, y: y1 + t2 * dy });
  }
  return intersections;
}

export function findCircleCircleIntersection(
  circleA: ArcGeometry2D,
  circleB: ArcGeometry2D,
): ExplodePoint[] {
  const x1 = circleA.center.x;
  const y1 = circleA.center.y;
  const r1 = circleA.radius;
  const x2 = circleB.center.x;
  const y2 = circleB.center.y;
  const r2 = circleB.radius;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
    return [];
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const hSquared = r1 * r1 - a * a;
  if (hSquared < 0) {
    return [];
  }
  const h = Math.sqrt(hSquared);
  const x3 = x1 + (a * dx) / d;
  const y3 = y1 + (a * dy) / d;

  return [
    { x: x3 + (h * dy) / d, y: y3 - (h * dx) / d },
    { x: x3 - (h * dy) / d, y: y3 + (h * dx) / d },
  ];
}

export function collectSegmentSplitPoints(
  targetSegment: LineSegment2D,
  sourceEntityId: string,
  fileEntities: ExplodeEntityLike[],
  tolerance: number,
): ExplodePoint[] {
  const splitPoints: ExplodePoint[] = [targetSegment.start, targetSegment.end];

  fileEntities.forEach((candidate) => {
    if (candidate.id === sourceEntityId) {
      return;
    }

    collectEntitySegments(candidate, tolerance).forEach((segment) => {
      const intersection = findLineIntersection(targetSegment, segment);
      if (intersection && isPointOnSegment(intersection, targetSegment, tolerance)) {
        splitPoints.push({ x: intersection.x, y: intersection.y });
      }
    });

    const arcCandidate = extractArcGeometry(candidate);
    if (!arcCandidate) {
      return;
    }
    findLineCircleIntersection(targetSegment, arcCandidate).forEach((intersection) => {
      const point = { x: intersection.x, y: intersection.y };
      if (isPointOnSegment(point, targetSegment, tolerance) && isPointOnArc(point, arcCandidate)) {
        splitPoints.push(point);
      }
    });
  });

  return uniquePoints(splitPoints, tolerance)
    .filter((point) => isPointOnSegment(point, targetSegment, tolerance))
    .sort((a, b) => lineParam(targetSegment, a) - lineParam(targetSegment, b));
}
