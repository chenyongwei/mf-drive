import type { Point } from '../../../types';

import { arePointsCollinear } from '../angle';
import { pointsEqual } from '../distance';
import { polygonArea } from '../polygon';

import { validatePoints } from './primitives';
import { DEFAULT_TOLERANCE, type ValidationResult } from './types';

function doSegmentsIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
  tolerance: number
): boolean {
  const orientation = (p: Point, q: Point, r: Point): number => {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (Math.abs(val) < tolerance) return 0;
    return val > 0 ? 1 : 2;
  };

  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  return o1 !== o2 && o3 !== o4;
}

export function validatePolygon(
  points: Point[],
  tolerance = DEFAULT_TOLERANCE
): ValidationResult {
  const pointsResult = validatePoints(points, 3);
  if (!pointsResult.isValid) {
    return pointsResult;
  }

  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    if (pointsEqual(points[index], next, tolerance)) {
      return {
        isValid: false,
        error: `Duplicate consecutive points found at index ${index}`,
      };
    }
  }

  if (points.length >= 3) {
    const p1 = points[0];
    const p2 = points[1];
    const p3 = points[2];

    if (arePointsCollinear(p1, p2, p3, tolerance)) {
      let allCollinear = true;
      for (let index = 3; index < points.length; index += 1) {
        if (!arePointsCollinear(p1, p2, points[index], tolerance)) {
          allCollinear = false;
          break;
        }
      }

      if (allCollinear) {
        return {
          isValid: false,
          error: 'All polygon points are collinear (degenerate polygon)',
        };
      }
    }
  }

  const area = polygonArea(points);
  if (area < tolerance) {
    return {
      isValid: false,
      error: 'Polygon has zero area',
    };
  }

  const n = points.length;
  for (let i = 0; i < n; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];

    for (let j = i + 2; j < n; j += 1) {
      if (j === n - 1 && i === 0) continue;

      const p3 = points[j];
      const p4 = points[(j + 1) % n];

      if (doSegmentsIntersect(p1, p2, p3, p4, tolerance)) {
        return {
          isValid: false,
          error: 'Polygon has self-intersections',
        };
      }
    }
  }

  return { isValid: true };
}

export function validatePolygonClosed(
  points: Point[],
  tolerance = DEFAULT_TOLERANCE
): ValidationResult {
  const pointsResult = validatePoints(points, 3);
  if (!pointsResult.isValid) {
    return pointsResult;
  }

  const first = points[0];
  const last = points[points.length - 1];

  if (!pointsEqual(first, last, tolerance)) {
    return {
      isValid: false,
      error: 'Polygon is not closed (first and last points do not match)',
    };
  }

  return { isValid: true };
}

export function isValidWinding(
  points: Point[],
  tolerance = DEFAULT_TOLERANCE
): boolean {
  const result = validatePolygon(points, tolerance);
  return result.isValid;
}
