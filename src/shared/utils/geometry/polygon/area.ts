import type { Point } from '../../../types';

import { distance } from '../distance';

export function polygonArea(points: Point[]): number {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area) / 2;
}

export function polygonAreaSigned(points: Point[]): number {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return area / 2;
}

export function polygonPerimeter(points: Point[]): number {
  if (points.length < 2) {
    return 0;
  }

  let perimeter = 0;
  const n = points.length;

  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    perimeter += distance(points[i], points[j]);
  }

  return perimeter;
}

export function polygonOrientation(points: Point[]): 'CW' | 'CCW' {
  const signedArea = polygonAreaSigned(points);
  return signedArea > 0 ? 'CCW' : 'CW';
}
