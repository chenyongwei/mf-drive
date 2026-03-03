import type { Point } from '../../../types';

import type { Circle, LineSegment } from './types';

export function getLineCircleIntersection(
  line: LineSegment,
  circle: Circle
): Point[] {
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

  const intersections: Point[] = [];

  if (t1 >= 0 && t1 <= 1) {
    intersections.push({
      x: x1 + t1 * dx,
      y: y1 + t1 * dy,
    });
  }

  if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-10) {
    intersections.push({
      x: x1 + t2 * dx,
      y: y1 + t2 * dy,
    });
  }

  return intersections;
}

export function getCircleCircleIntersection(
  circle1: Circle,
  circle2: Circle
): Point[] {
  const x1 = circle1.center.x;
  const y1 = circle1.center.y;
  const r1 = circle1.radius;

  const x2 = circle2.center.x;
  const y2 = circle2.center.y;
  const r2 = circle2.radius;

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

  const x3 = x1 + a * (dx / d);
  const y3 = y1 + a * (dy / d);

  const intersections: Point[] = [
    {
      x: x3 + h * (dy / d),
      y: y3 - h * (dx / d),
    },
    {
      x: x3 - h * (dy / d),
      y: y3 + h * (dx / d),
    },
  ];

  if (hSquared < 1e-10) {
    return [intersections[0]];
  }

  return intersections;
}
