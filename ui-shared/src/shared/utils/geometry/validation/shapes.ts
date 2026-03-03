import type { BoundingBox, Point } from '../../../types';

import { pointsEqual } from '../distance';

import { validateBBox, validatePoint } from './primitives';
import { DEFAULT_TOLERANCE, type ValidationResult } from './types';

export function validateLineSegment(
  start: Point,
  end: Point,
  tolerance = DEFAULT_TOLERANCE
): ValidationResult {
  const startResult = validatePoint(start);
  if (!startResult.isValid) {
    return { isValid: false, error: `Invalid start point: ${startResult.error}` };
  }

  const endResult = validatePoint(end);
  if (!endResult.isValid) {
    return { isValid: false, error: `Invalid end point: ${endResult.error}` };
  }

  if (pointsEqual(start, end, tolerance)) {
    return {
      isValid: false,
      error: 'Line segment has zero length',
    };
  }

  return { isValid: true };
}

export function validateCircle(center: Point, radius: number): ValidationResult {
  const centerResult = validatePoint(center);
  if (!centerResult.isValid) {
    return { isValid: false, error: `Invalid center point: ${centerResult.error}` };
  }

  if (typeof radius !== 'number' || Number.isNaN(radius)) {
    return { isValid: false, error: 'Circle radius must be a number' };
  }

  if (radius <= 0) {
    return { isValid: false, error: 'Circle radius must be positive' };
  }

  if (!Number.isFinite(radius)) {
    return { isValid: false, error: 'Circle radius must be finite' };
  }

  return { isValid: true };
}

export function validatePointInBBox(
  point: Point,
  bbox: BoundingBox,
  inclusive = true
): ValidationResult {
  const pointResult = validatePoint(point);
  if (!pointResult.isValid) {
    return pointResult;
  }

  const bboxResult = validateBBox(bbox);
  if (!bboxResult.isValid) {
    return { isValid: false, error: `Invalid bounding box: ${bboxResult.error}` };
  }

  const xValid = inclusive
    ? point.x >= bbox.minX && point.x <= bbox.maxX
    : point.x > bbox.minX && point.x < bbox.maxX;

  const yValid = inclusive
    ? point.y >= bbox.minY && point.y <= bbox.maxY
    : point.y > bbox.minY && point.y < bbox.maxY;

  if (!xValid || !yValid) {
    return {
      isValid: false,
      error: 'Point is outside bounding box',
    };
  }

  return { isValid: true };
}
