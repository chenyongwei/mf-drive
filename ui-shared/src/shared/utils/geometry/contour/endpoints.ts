import type { Point } from '../../../types';

import type { Entity } from './types';

export function getEntityEndpoints(
  entity: Entity
): { start: Point | null; end: Point | null } {
  if (entity.type === 'LINE' && entity.geometry?.start && entity.geometry?.end) {
    return {
      start: entity.geometry.start,
      end: entity.geometry.end,
    };
  }

  if (entity.type === 'POLYLINE' || entity.type === 'LWPOLYLINE') {
    const points = entity.geometry?.points;
    if (points && Array.isArray(points) && points.length >= 2) {
      return {
        start: points[0],
        end: points[points.length - 1],
      };
    }
  }

  if (entity.type === 'SPLINE') {
    const controlPoints = entity.geometry?.controlPoints || entity.geometry?.points;
    if (controlPoints && Array.isArray(controlPoints) && controlPoints.length >= 2) {
      return {
        start: controlPoints[0],
        end: controlPoints[controlPoints.length - 1],
      };
    }
  }

  return { start: null, end: null };
}
