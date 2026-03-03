import type { Point } from '../../../types';

export function reflectPointAcrossLine(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): Point {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
  const b = (2 * dx * dy) / (dx * dx + dy * dy);

  const x2 = lineStart.x;
  const y2 = lineStart.y;

  return {
    x: a * (point.x - x2) + b * (point.y - y2) + x2,
    y: b * (point.x - x2) - a * (point.y - y2) + y2,
  };
}

export function reflectPointAcrossX(point: Point): Point {
  return {
    x: point.x,
    y: -point.y,
  };
}

export function reflectPointAcrossY(point: Point): Point {
  return {
    x: -point.x,
    y: point.y,
  };
}

export function reflectPointAcrossOrigin(point: Point): Point {
  return {
    x: -point.x,
    y: -point.y,
  };
}

export function reflectPointsAcrossLine(
  points: Point[],
  lineStart: Point,
  lineEnd: Point
): Point[] {
  return points.map((point) => reflectPointAcrossLine(point, lineStart, lineEnd));
}

export function reflectPointsAcrossX(points: Point[]): Point[] {
  return points.map((point) => reflectPointAcrossX(point));
}

export function reflectPointsAcrossY(points: Point[]): Point[] {
  return points.map((point) => reflectPointAcrossY(point));
}

export function reflectPointsAcrossOrigin(points: Point[]): Point[] {
  return points.map((point) => reflectPointAcrossOrigin(point));
}
