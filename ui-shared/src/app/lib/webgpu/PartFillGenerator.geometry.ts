import type { Point } from './PartFillGenerator.types';

export { calculatePolygonArea } from '../../utils/geometryUtils';

export function reverseWindingOrder(points: Point[]): Point[] {
  return [...points].reverse();
}

export function ensureCounterClockwise(points: Point[]): Point[] {
  let sum = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += (points[j].x - points[i].x) * (points[j].y + points[i].y);
  }

  if (sum > 0) {
    return reverseWindingOrder(points);
  }

  return points;
}
