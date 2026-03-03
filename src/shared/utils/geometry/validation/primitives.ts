import type { ValidationResult } from './types';

export function validatePoint(point: any): ValidationResult {
  if (typeof point !== 'object' || point === null) {
    return { isValid: false, error: 'Point must be an object' };
  }

  if (typeof point.x !== 'number' || Number.isNaN(point.x)) {
    return { isValid: false, error: 'Point must have a valid x coordinate' };
  }

  if (typeof point.y !== 'number' || Number.isNaN(point.y)) {
    return { isValid: false, error: 'Point must have a valid y coordinate' };
  }

  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return { isValid: false, error: 'Point coordinates must be finite' };
  }

  return { isValid: true };
}

export function validatePoints(points: any[], minCount = 1): ValidationResult {
  if (!Array.isArray(points)) {
    return { isValid: false, error: 'Points must be an array' };
  }

  if (points.length < minCount) {
    return {
      isValid: false,
      error: `At least ${minCount} point${minCount > 1 ? 's are' : ' is'} required`,
    };
  }

  for (let index = 0; index < points.length; index += 1) {
    const result = validatePoint(points[index]);
    if (!result.isValid) {
      return {
        isValid: false,
        error: `Point at index ${index} is invalid: ${result.error}`,
      };
    }
  }

  return { isValid: true };
}

export function validateBBox(bbox: any): ValidationResult {
  if (typeof bbox !== 'object' || bbox === null) {
    return { isValid: false, error: 'Bounding box must be an object' };
  }

  const requiredProps = ['minX', 'minY', 'maxX', 'maxY'];
  for (const prop of requiredProps) {
    if (typeof bbox[prop] !== 'number' || Number.isNaN(bbox[prop])) {
      return { isValid: false, error: `Bounding box must have a valid ${prop} property` };
    }
  }

  if (
    !Number.isFinite(bbox.minX) ||
    !Number.isFinite(bbox.minY) ||
    !Number.isFinite(bbox.maxX) ||
    !Number.isFinite(bbox.maxY)
  ) {
    return { isValid: false, error: 'Bounding box coordinates must be finite' };
  }

  if (bbox.minX > bbox.maxX || bbox.minY > bbox.maxY) {
    return { isValid: false, error: 'Bounding box has invalid dimensions' };
  }

  return { isValid: true };
}
