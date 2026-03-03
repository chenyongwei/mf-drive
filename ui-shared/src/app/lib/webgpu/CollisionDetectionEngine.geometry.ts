import { BoundingBox, Point } from './CollisionDetectionEngine.types';

const GEOMETRY_EPSILON = 1e-6;

export function calculateBoundingBox(points: Point[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    minX = Math.min(minX, points[i].x);
    minY = Math.min(minY, points[i].y);
    maxX = Math.max(maxX, points[i].x);
    maxY = Math.max(maxY, points[i].y);
  }

  return { minX, minY, maxX, maxY };
}

export function boundingBoxesIntersect(box1: BoundingBox, box2: BoundingBox): boolean {
  return !(
    box1.maxX < box2.minX ||
    box1.minX > box2.maxX ||
    box1.maxY < box2.minY ||
    box1.minY > box2.maxY
  );
}

export function simplifyPolygon(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPolygon(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPolygon(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) {
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }

  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);

  let closestX: number;
  let closestY: number;

  if (u < 0) {
    closestX = lineStart.x;
    closestY = lineStart.y;
  } else if (u > 1) {
    closestX = lineEnd.x;
    closestY = lineEnd.y;
  } else {
    closestX = lineStart.x + u * dx;
    closestY = lineStart.y + u * dy;
  }

  return Math.hypot(point.x - closestX, point.y - closestY);
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if ((yi > point.y) !== (yj > point.y) &&
      point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

function pointOnSegment(point: Point, start: Point, end: Point): boolean {
  const cross =
    (point.y - start.y) * (end.x - start.x) -
    (point.x - start.x) * (end.y - start.y);

  if (Math.abs(cross) > GEOMETRY_EPSILON) {
    return false;
  }

  const dot =
    (point.x - start.x) * (end.x - start.x) +
    (point.y - start.y) * (end.y - start.y);

  if (dot < -GEOMETRY_EPSILON) {
    return false;
  }

  const lenSq =
    (end.x - start.x) * (end.x - start.x) +
    (end.y - start.y) * (end.y - start.y);

  return dot <= lenSq + GEOMETRY_EPSILON;
}

function pointOnPolygonBoundary(point: Point, polygon: Point[]): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    if (pointOnSegment(point, a, b)) {
      return true;
    }
  }
  return false;
}

function pointInPolygonStrict(point: Point, polygon: Point[]): boolean {
  if (pointOnPolygonBoundary(point, polygon)) {
    return false;
  }
  return pointInPolygon(point, polygon);
}

function orientation(a: Point, b: Point, c: Point): 0 | 1 | 2 {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(value) <= GEOMETRY_EPSILON) return 0;
  return value > 0 ? 1 : 2;
}

function segmentsIntersect(p1: Point, q1: Point, p2: Point, q2: Point): boolean {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  if (o1 === 0 && pointOnSegment(p2, p1, q1)) return true;
  if (o2 === 0 && pointOnSegment(q2, p1, q1)) return true;
  if (o3 === 0 && pointOnSegment(p1, p2, q2)) return true;
  if (o4 === 0 && pointOnSegment(q1, p2, q2)) return true;

  return false;
}

function polygonEdgesIntersect(poly1: Point[], poly2: Point[]): boolean {
  for (let i = 0; i < poly1.length; i++) {
    const a1 = poly1[i];
    const a2 = poly1[(i + 1) % poly1.length];
    for (let j = 0; j < poly2.length; j++) {
      const b1 = poly2[j];
      const b2 = poly2[(j + 1) % poly2.length];
      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

export function isPolygonStrictlyInsidePolygon(inner: Point[], outer: Point[]): boolean {
  if (inner.length < 3 || outer.length < 3) return false;

  const allVerticesInside = inner.every((point) => pointInPolygonStrict(point, outer));
  if (!allVerticesInside) return false;

  if (polygonEdgesIntersect(inner, outer)) return false;

  return true;
}

export function polygonsIntersect(poly1: Point[], poly2: Point[]): boolean {
  const axes: Point[] = [];

  for (let i = 0; i < poly1.length; i++) {
    const p1 = poly1[i];
    const p2 = poly1[(i + 1) % poly1.length];
    const edge = { x: p1.x - p2.x, y: p1.y - p2.y };
    axes.push({ x: -edge.y, y: edge.x });
  }

  for (let i = 0; i < poly2.length; i++) {
    const p1 = poly2[i];
    const p2 = poly2[(i + 1) % poly2.length];
    const edge = { x: p1.x - p2.x, y: p1.y - p2.y };
    axes.push({ x: -edge.y, y: edge.x });
  }

  for (const axis of axes) {
    const proj1 = projectPolygon(poly1, axis);
    const proj2 = projectPolygon(poly2, axis);

    if (!projectionsOverlap(proj1, proj2)) {
      return false;
    }
  }

  return true;
}

function projectPolygon(polygon: Point[], axis: Point): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (const point of polygon) {
    const proj = point.x * axis.x + point.y * axis.y;
    min = Math.min(min, proj);
    max = Math.max(max, proj);
  }

  return { min, max };
}

function projectionsOverlap(
  proj1: { min: number; max: number },
  proj2: { min: number; max: number },
): boolean {
  return !(proj1.max < proj2.min || proj1.min > proj2.max);
}
