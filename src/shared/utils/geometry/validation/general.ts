import { validateBBox, validatePoint, validatePoints } from './primitives';
import { validatePolygon } from './polygon';
import { validateCircle, validateLineSegment } from './shapes';
import { DEFAULT_TOLERANCE, type ValidationResult } from './types';

export function validateGeometry(
  type: 'point' | 'line' | 'circle' | 'polygon' | 'bbox',
  data: any,
  tolerance = DEFAULT_TOLERANCE
): ValidationResult {
  switch (type) {
    case 'point':
      return validatePoint(data);
    case 'line':
      if (!data || typeof data !== 'object') {
        return { isValid: false, error: 'Line data must be an object' };
      }
      return validateLineSegment(data.start, data.end, tolerance);
    case 'circle':
      if (!data || typeof data !== 'object') {
        return { isValid: false, error: 'Circle data must be an object' };
      }
      return validateCircle(data.center, data.radius);
    case 'polygon':
      if (!Array.isArray(data)) {
        return { isValid: false, error: 'Polygon data must be an array of points' };
      }
      return validatePolygon(data, tolerance);
    case 'bbox':
      return validateBBox(data);
    default:
      return { isValid: false, error: `Unknown geometry type: ${type}` };
  }
}

export function isValidGeometry(geometry: any, tolerance = DEFAULT_TOLERANCE): boolean {
  if (!geometry) return false;

  if (Array.isArray(geometry)) {
    return validatePoints(geometry, 1).isValid;
  }

  if (geometry.minX !== undefined && geometry.minY !== undefined) {
    return validateBBox(geometry).isValid;
  }

  if (geometry.center !== undefined && geometry.radius !== undefined) {
    return validateCircle(geometry.center, geometry.radius).isValid;
  }

  if (geometry.start !== undefined && geometry.end !== undefined) {
    return validateLineSegment(geometry.start, geometry.end, tolerance).isValid;
  }

  if (geometry.x !== undefined && geometry.y !== undefined) {
    return validatePoint(geometry).isValid;
  }

  return false;
}
