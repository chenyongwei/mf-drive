import type { Entity } from '../../../../lib/webgpu/EntityToVertices';

import {
  buildEllipseApproximation,
  distanceToPolyline,
  distanceToSegment,
  distanceToTextEntity,
  isAngleWithinArc,
  normalizeType,
  TWO_PI,
} from './helpers';

export function isPointInEntity(
  worldX: number,
  worldY: number,
  entity: Entity,
  threshold: number = 5
): boolean {
  return getDistanceToEntity(worldX, worldY, entity) < threshold;
}

export function getDistanceToEntity(
  worldX: number,
  worldY: number,
  entity: Entity
): number {
  const geo = entity.geometry;
  if (!geo) return Infinity;

  const type = normalizeType(entity);

  switch (type) {
    case 'LINE': {
      if (!geo.start || !geo.end) return Infinity;
      return distanceToSegment(worldX, worldY, geo.start, geo.end);
    }
    case 'CIRCLE': {
      if (!geo.center || typeof geo.radius !== 'number') return Infinity;
      const centerDist = Math.sqrt(
        Math.pow(worldX - geo.center.x, 2) + Math.pow(worldY - geo.center.y, 2)
      );
      return Math.abs(centerDist - geo.radius);
    }
    case 'ARC': {
      if (!geo.center || typeof geo.radius !== 'number') return Infinity;

      const centerDist = Math.sqrt(
        Math.pow(worldX - geo.center.x, 2) + Math.pow(worldY - geo.center.y, 2)
      );
      const distToCircle = Math.abs(centerDist - geo.radius);

      const startAngle = geo.startAngle ?? 0;
      const endAngle = geo.endAngle ?? TWO_PI;

      let deltaAngle = endAngle - startAngle;
      if (deltaAngle <= 0) {
        deltaAngle += TWO_PI;
      }
      if (Math.abs(deltaAngle - TWO_PI) < 0.001) {
        return distToCircle;
      }

      const angle = Math.atan2(worldY - geo.center.y, worldX - geo.center.x);
      const inAngle = isAngleWithinArc(angle, startAngle, endAngle);

      if (inAngle) return distToCircle;

      const startX = geo.center.x + geo.radius * Math.cos(startAngle);
      const startY = geo.center.y + geo.radius * Math.sin(startAngle);
      const endX = geo.center.x + geo.radius * Math.cos(endAngle);
      const endY = geo.center.y + geo.radius * Math.sin(endAngle);

      return Math.min(
        Math.hypot(worldX - startX, worldY - startY),
        Math.hypot(worldX - endX, worldY - endY)
      );
    }
    case 'LWPOLYLINE':
    case 'POLYLINE': {
      const points = geo.points;
      if (!points || points.length < 2) return Infinity;
      const closed = !!(geo.closed || geo.isClosed);
      return distanceToPolyline(worldX, worldY, points, closed);
    }
    case 'SPLINE': {
      const splinePoints = geo.controlPoints || geo.points;
      if (!splinePoints || splinePoints.length < 2) return Infinity;
      const closed = !!(geo.closed || geo.isClosed);
      return distanceToPolyline(worldX, worldY, splinePoints, closed);
    }
    case 'ELLIPSE': {
      const approximation = buildEllipseApproximation(geo);
      if (!approximation || approximation.points.length < 2) return Infinity;
      return distanceToPolyline(
        worldX,
        worldY,
        approximation.points,
        approximation.isClosed
      );
    }
    case 'TEXT':
    case 'MTEXT':
      return distanceToTextEntity(worldX, worldY, entity);
    default:
      return Infinity;
  }
}
