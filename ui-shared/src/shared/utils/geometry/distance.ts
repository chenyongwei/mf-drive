/**
 * Distance and Point Calculation Utilities
 *
 * Provides functions for calculating distances between points,
 * midpoints, and comparing points with tolerance.
 *
 * @module geometry/distance
 */

import type { Point } from '../../types';

/**
 * Default tolerance for floating point comparisons
 */
const DEFAULT_TOLERANCE = 1e-6;

/**
 * Calculate Euclidean distance between two points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance between the points
 *
 * @example
 * ```ts
 * import { distance } from '@dxf-fix/shared/utils/geometry';
 *
 * const p1 = { x: 0, y: 0 };
 * const p2 = { x: 3, y: 4 };
 * distance(p1, p2); // 5
 * ```
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate squared distance between two points
 * More efficient than distance() when only comparing distances
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Squared distance between the points
 *
 * @example
 * ```ts
 * import { distanceSquared } from '@dxf-fix/shared/utils/geometry';
 *
 * const p1 = { x: 0, y: 0 };
 * const p2 = { x: 3, y: 4 };
 * distanceSquared(p1, p2); // 25
 * ```
 */
export function distanceSquared(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

/**
 * Calculate distance from a point to a line segment
 *
 * @param point - Point to check
 * @param lineStart - Line segment start point
 * @param lineEnd - Line segment end point
 * @returns Perpendicular distance from point to line segment
 *
 * @example
 * ```ts
 * import { pointToLineSegmentDistance } from '@dxf-fix/shared/utils/geometry';
 *
 * const point = { x: 2, y: 2 };
 * const start = { x: 0, y: 0 };
 * const end = { x: 10, y: 0 };
 * pointToLineSegmentDistance(point, start, end); // 2
 * ```
 */
export function pointToLineSegmentDistance(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number;
  let yy: number;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find the closest point on a line segment to a given point
 *
 * @param line - Line segment defined by start and end points
 * @param point - Point to find closest point for
 * @returns Closest point on the line segment
 *
 * @example
 * ```ts
 * import { closestPointOnLine } from '@dxf-fix/shared/utils/geometry';
 *
 * const line = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
 * const point = { x: 5, y: 3 };
 * closestPointOnLine(line, point); // { x: 5, y: 0 }
 * ```
 */
export function closestPointOnLine(
  line: { start: Point; end: Point },
  point: Point
): Point {
  const { start, end } = line;
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return start;
  }

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);

  // Clamp t to [0, 1] to get point on segment
  const clampedT = Math.max(0, Math.min(1, t));

  return {
    x: start.x + clampedT * dx,
    y: start.y + clampedT * dy,
  };
}

/**
 * Calculate midpoint between two points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Midpoint between the two points
 *
 * @example
 * ```ts
 * import { midpoint } from '@dxf-fix/shared/utils/geometry';
 *
 * const p1 = { x: 0, y: 0 };
 * const p2 = { x: 10, y: 10 };
 * midpoint(p1, p2); // { x: 5, y: 5 }
 * ```
 */
export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Check if two points are approximately equal within tolerance
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @param tolerance - Maximum allowed difference (default: 1e-6)
 * @returns True if points are equal within tolerance
 *
 * @example
 * ```ts
 * import { pointsEqual } from '@dxf-fix/shared/utils/geometry';
 *
 * const p1 = { x: 1, y: 2 };
 * const p2 = { x: 1.0000001, y: 2 };
 * pointsEqual(p1, p2); // true
 *
 * const p3 = { x: 1.001, y: 2 };
 * pointsEqual(p1, p3); // false
 * pointsEqual(p1, p3, 0.01); // true
 * ```
 */
export function pointsEqual(p1: Point, p2: Point, tolerance = DEFAULT_TOLERANCE): boolean {
  return (
    Math.abs(p1.x - p2.x) < tolerance &&
    Math.abs(p1.y - p2.y) < tolerance
  );
}

/**
 * Generate a unique key for a point (useful for Maps/Sets)
 *
 * @param point - Point to generate key for
 * @param precision - Number of decimal places (default: 4)
 * @returns String key for the point
 *
 * @example
 * ```ts
 * import { pointKey } from '@dxf-fix/shared/utils/geometry';
 *
 * const point = { x: 1.23456, y: 7.89012 };
 * pointKey(point); // "1.2346,7.8901"
 * pointKey(point, 2); // "1.23,7.89"
 * ```
 */
export function pointKey(point: Point, precision = 4): string {
  return `${point.x.toFixed(precision)},${point.y.toFixed(precision)}`;
}
