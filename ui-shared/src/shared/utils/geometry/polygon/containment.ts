import type { Point } from '../../../types';

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

export function isPointOnPolygonBoundary(
  point: Point,
  polygon: Point[],
  tolerance = 1e-6
): boolean {
  if (polygon.length < 2) {
    return false;
  }

  const n = polygon.length;

  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const p1 = polygon[i];
    const p2 = polygon[j];

    const cross =
      Math.abs((p2.x - p1.x) * (point.y - p1.y) - (p2.y - p1.y) * (point.x - p1.x)) <
      tolerance;

    if (cross) {
      const dot =
        ((point.x - p1.x) * (p2.x - p1.x) + (point.y - p1.y) * (p2.y - p1.y)) /
        ((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

      if (dot >= -tolerance && dot <= 1 + tolerance) {
        return true;
      }
    }
  }

  return false;
}

export function isConvexPolygon(points: Point[]): boolean {
  if (points.length < 3) {
    return false;
  }

  const n = points.length;
  let hasPositive = false;
  let hasNegative = false;

  for (let i = 0; i < n; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const cross = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);

    if (cross > 0) hasPositive = true;
    if (cross < 0) hasNegative = true;

    if (hasPositive && hasNegative) {
      return false;
    }
  }

  return true;
}
