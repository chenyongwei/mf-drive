import type { Point } from '../../../types';

import type { Rotation, Scale, Shear, Translation } from './types';

export function translatePoint(point: Point, translation: Translation): Point {
  return {
    x: point.x + translation.dx,
    y: point.y + translation.dy,
  };
}

export function translatePoints(points: Point[], translation: Translation): Point[] {
  return points.map((point) => translatePoint(point, translation));
}

export function scalePoint(point: Point, scale: Scale, origin: Point = { x: 0, y: 0 }): Point {
  return {
    x: origin.x + (point.x - origin.x) * scale.sx,
    y: origin.y + (point.y - origin.y) * scale.sy,
  };
}

export function scalePoints(points: Point[], scale: Scale, origin: Point = { x: 0, y: 0 }): Point[] {
  return points.map((point) => scalePoint(point, scale, origin));
}

export function rotatePoint(point: Point, rotation: Rotation): Point {
  const origin = rotation.origin || { x: 0, y: 0 };
  const cos = Math.cos(rotation.angle);
  const sin = Math.sin(rotation.angle);

  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

export function rotatePoints(points: Point[], rotation: Rotation): Point[] {
  return points.map((point) => rotatePoint(point, rotation));
}

export function shearPoint(point: Point, shear: Shear): Point {
  const origin = shear.origin || { x: 0, y: 0 };
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  return {
    x: origin.x + dx + shear.kx * dy,
    y: origin.y + dy + shear.ky * dx,
  };
}

export function shearPoints(points: Point[], shear: Shear): Point[] {
  return points.map((point) => shearPoint(point, shear));
}
