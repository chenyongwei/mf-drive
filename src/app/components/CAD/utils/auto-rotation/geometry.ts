import type { Point } from '../../../../lib/webgpu/CollisionDetectionEngine';
import { pointInPolygon } from '../../../../utils/geometryUtils';

import type { EdgeSegment, PartForRotation } from './types';

export function normalizeAngle(angle: number): number {
  let normalized = angle;
  while (normalized < 0) normalized += 360;
  while (normalized >= 360) normalized -= 360;
  return normalized;
}

export function getSmallestRotationDelta(current: number, target: number): number {
  let delta = target - current;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function transformPolygon(
  points: Point[],
  position: Point,
  rotationDegrees: number,
  pivot?: Point
): Point[] {
  const rotationRad = rotationDegrees * (Math.PI / 180);
  const px = pivot?.x || 0;
  const py = pivot?.y || 0;

  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);

  return points.map((point) => {
    const x = point.x - px;
    const y = point.y - py;

    const rotatedX = cos * x - sin * y;
    const rotatedY = sin * x + cos * y;

    return {
      x: rotatedX + px + position.x,
      y: rotatedY + py + position.y,
    };
  });
}

export function getPartPolygon(part: PartForRotation): Point[] {
  if (part.contour && part.contour.length >= 3) {
    const startX = part.boundingBox.minX;
    const startY = part.boundingBox.minY;
    const pivot = {
      x: startX + (part.boundingBox.maxX - startX) / 2,
      y: startY + (part.boundingBox.maxY - startY) / 2,
    };
    return transformPolygon(part.contour, part.position, part.rotation, pivot);
  }

  const { minX, minY, maxX, maxY } = part.boundingBox;
  const points = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
  const pivot = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
  return transformPolygon(points, part.position, part.rotation, pivot);
}

function getLineIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null {
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  const x3 = p3.x;
  const y3 = p3.y;
  const x4 = p4.x;
  const y4 = p4.y;

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1),
    };
  }

  return null;
}

export function getInsideSegments(polyA: Point[], polyB: Point[]): EdgeSegment[] {
  const segments: EdgeSegment[] = [];

  for (let i = 0; i < polyA.length; i += 1) {
    const p1 = polyA[i];
    const p2 = polyA[(i + 1) % polyA.length];

    const intersections: { t: number; point: Point }[] = [];
    intersections.push({ t: 0, point: p1 });
    intersections.push({ t: 1, point: p2 });

    for (let j = 0; j < polyB.length; j += 1) {
      const q1 = polyB[j];
      const q2 = polyB[(j + 1) % polyB.length];
      const hit = getLineIntersection(p1, p2, q1, q2);
      if (hit) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const t =
          Math.abs(dx) > Math.abs(dy)
            ? (hit.x - p1.x) / dx
            : (hit.y - p1.y) / dy;
        intersections.push({ t, point: hit });
      }
    }

    intersections.sort((a, b) => a.t - b.t);

    for (let k = 0; k < intersections.length - 1; k += 1) {
      const start = intersections[k];
      const end = intersections[k + 1];

      const dist = Math.sqrt(
        (end.point.x - start.point.x) ** 2 + (end.point.y - start.point.y) ** 2
      );
      if (dist < 0.001) continue;

      const midPoint = {
        x: (start.point.x + end.point.x) / 2,
        y: (start.point.y + end.point.y) / 2,
      };

      if (pointInPolygon(midPoint, polyB)) {
        const dx = end.point.x - start.point.x;
        const dy = end.point.y - start.point.y;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        segments.push({
          start: start.point,
          end: end.point,
          length: dist,
          angle: normalizeAngle(angle),
        });
      }
    }
  }

  return segments;
}
