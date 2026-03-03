/**
 * Angle Calculation and Conversion Utilities
 *
 * Provides functions for calculating angles between points and lines,
 * as well as angle unit conversions.
 *
 * @module geometry/angle
 */

import type { Point } from '../../types';

/**
 * Calculate angle formed by three points (middle point as vertex)
 *
 * @param p1 - First point
 * @param vertex - Vertex point (middle point)
 * @param p3 - Third point
 * @returns Angle in radians [0, π]
 *
 * @example
 * ```ts
 * import { angleBetweenPoints } from '@dxf-fix/shared/utils/geometry';
 *
 * const p1 = { x: 1, y: 0 };
 * const vertex = { x: 0, y: 0 };
 * const p3 = { x: 0, y: 1 };
 * angleBetweenPoints(p1, vertex, p3); // Math.PI / 2 (90 degrees)
 * ```
 */
export function angleBetweenPoints(p1: Point, vertex: Point, p3: Point): number {
  const v1 = {
    x: p1.x - vertex.x,
    y: p1.y - vertex.y,
  };
  const v2 = {
    x: p3.x - vertex.x,
    y: p3.y - vertex.y,
  };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (len1 === 0 || len2 === 0) {
    return 0;
  }

  const cosAngle = Math.max(-1, Math.min(1, dot / (len1 * len2)));
  return Math.acos(cosAngle);
}

/**
 * Calculate angle between two line segments
 *
 * @param line1Start - First line segment start point
 * @param line1End - First line segment end point
 * @param line2Start - Second line segment start point
 * @param line2End - Second line segment end point
 * @returns Angle in radians [0, π]
 *
 * @example
 * ```ts
 * import { angleBetweenLineSegments } from '@dxf-fix/shared/utils/geometry';
 *
 * const angle = angleBetweenLineSegments(
 *   { x: 0, y: 0 }, { x: 1, y: 0 },  // Horizontal line
 *   { x: 0, y: 0 }, { x: 0, y: 1 }   // Vertical line
 * );
 * angle; // Math.PI / 2 (90 degrees)
 * ```
 */
export function angleBetweenLineSegments(
  line1Start: Point,
  line1End: Point,
  line2Start: Point,
  line2End: Point
): number {
  const v1 = {
    x: line1End.x - line1Start.x,
    y: line1End.y - line1Start.y,
  };
  const v2 = {
    x: line2End.x - line2Start.x,
    y: line2End.y - line2Start.y,
  };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (len1 === 0 || len2 === 0) {
    return 0;
  }

  const cosAngle = Math.max(-1, Math.min(1, dot / (len1 * len2)));
  return Math.acos(cosAngle);
}

/**
 * Calculate the direction angle of a line segment
 *
 * @param start - Line segment start point
 * @param end - Line segment end point
 * @returns Angle in radians [0, 2π) measured from positive x-axis
 *
 * @example
 * ```ts
 * import { lineDirection } from '@dxf-fix/shared/utils/geometry';
 *
 * lineDirection({ x: 0, y: 0 }, { x: 1, y: 0 }); // 0
 * lineDirection({ x: 0, y: 0 }, { x: 0, y: 1 }); // Math.PI / 2
 * lineDirection({ x: 0, y: 0 }, { x: -1, y: 0 }); // Math.PI
 * ```
 */
export function lineDirection(start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.atan2(dy, dx);
}

/**
 * Convert radians to degrees
 *
 * @param radians - Angle in radians
 * @returns Angle in degrees
 *
 * @example
 * ```ts
 * import { radToDeg } from '@dxf-fix/shared/utils/geometry';
 *
 * radToDeg(Math.PI); // 180
 * radToDeg(Math.PI / 2); // 90
 * ```
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Convert degrees to radians
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 *
 * @example
 * ```ts
 * import { degToRad } from '@dxf-fix/shared/utils/geometry';
 *
 * degToRad(180); // Math.PI
 * degToRad(90); // Math.PI / 2
 * ```
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Normalize angle to [0, 2π) range
 *
 * @param angle - Angle in radians
 * @returns Normalized angle in radians [0, 2π)
 *
 * @example
 * ```ts
 * import { normalizeAngle } from '@dxf-fix/shared/utils/geometry';
 *
 * normalizeAngle(0); // 0
 * normalizeAngle(-Math.PI); // Math.PI
 * normalizeAngle(3 * Math.PI); // Math.PI
 * normalizeAngle(2 * Math.PI); // 0
 * ```
 */
export function normalizeAngle(angle: number): number {
  while (angle < 0) {
    angle += 2 * Math.PI;
  }
  while (angle >= 2 * Math.PI) {
    angle -= 2 * Math.PI;
  }
  return angle;
}

/**
 * Normalize angle to (-π, π] range
 *
 * @param angle - Angle in radians
 * @returns Normalized angle in radians (-π, π]
 *
 * @example
 * ```ts
 * import { normalizeAngleSigned } from '@dxf-fix/shared/utils/geometry';
 *
 * normalizeAngleSigned(0); // 0
 * normalizeAngleSigned(-Math.PI); // -Math.PI
 * normalizeAngleSigned(3 * Math.PI); // -Math.PI
 * normalizeAngleSigned(2 * Math.PI); // 0
 * ```
 */
export function normalizeAngleSigned(angle: number): number {
  while (angle <= -Math.PI) {
    angle += 2 * Math.PI;
  }
  while (angle > Math.PI) {
    angle -= 2 * Math.PI;
  }
  return angle;
}

/**
 * Calculate the smallest signed angle between two angles
 *
 * @param from - Starting angle in radians
 * @param to - Ending angle in radians
 * @returns Signed angle in radians (-π, π]
 *
 * @example
 * ```ts
 * import { angleDifference } from '@dxf-fix/shared/utils/geometry';
 *
 * angleDifference(0, Math.PI / 2); // Math.PI / 2
 * angleDifference(Math.PI / 2, 0); // -Math.PI / 2
 * angleDifference(0, 3 * Math.PI / 2); // -Math.PI / 2
 * ```
 */
export function angleDifference(from: number, to: number): number {
  let diff = to - from;
  while (diff <= -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  return diff;
}

/**
 * Rotate a point around an origin by a given angle
 *
 * @param point - Point to rotate
 * @param origin - Origin of rotation
 * @param angle - Rotation angle in radians (counterclockwise)
 * @returns Rotated point
 *
 * @example
 * ```ts
 * import { rotatePoint } from '@dxf-fix/shared/utils/geometry';
 *
 * const point = { x: 1, y: 0 };
 * const origin = { x: 0, y: 0 };
 * rotatePoint(point, origin, Math.PI / 2); // { x: 0, y: 1 }
 * ```
 */
export function rotatePoint(point: Point, origin: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

/**
 * Check if three points are collinear
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @param p3 - Third point
 * @param tolerance - Tolerance for collinearity check (default: 1e-6)
 * @returns True if points are collinear
 *
 * @example
 * ```ts
 * import { arePointsCollinear } from '@dxf-fix/shared/utils/geometry';
 *
 * arePointsCollinear(
 *   { x: 0, y: 0 },
 *   { x: 1, y: 1 },
 *   { x: 2, y: 2 }
 * ); // true
 * ```
 */
export function arePointsCollinear(
  p1: Point,
  p2: Point,
  p3: Point,
  tolerance = 1e-6
): boolean {
  const area = Math.abs(
    (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x)
  );
  return area < tolerance;
}
