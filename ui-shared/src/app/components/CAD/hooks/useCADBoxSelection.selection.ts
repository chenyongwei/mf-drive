import type { Entity } from '../../../lib/webgpu/EntityToVertices';

import type { Point, SelectionMode, SelectionRect } from './useCADBoxSelection.types';

export const calculateSelectionRect = (p1: Point, p2: Point): SelectionRect => {
  return {
    minX: Math.min(p1.x, p2.x),
    minY: Math.min(p1.y, p2.y),
    maxX: Math.max(p1.x, p2.x),
    maxY: Math.max(p1.y, p2.y),
  };
};

function getEntityBoundingBox(entity: Entity): SelectionRect | null {
  if (!entity.geometry) return null;

  switch (entity.type) {
    case 'LINE':
      if (entity.geometry.start && entity.geometry.end) {
        return {
          minX: Math.min(entity.geometry.start.x, entity.geometry.end.x),
          minY: Math.min(entity.geometry.start.y, entity.geometry.end.y),
          maxX: Math.max(entity.geometry.start.x, entity.geometry.end.x),
          maxY: Math.max(entity.geometry.start.y, entity.geometry.end.y),
        };
      }
      break;
    case 'CIRCLE':
    case 'ARC':
      if (entity.geometry.center && typeof entity.geometry.radius === 'number') {
        const r = entity.geometry.radius;
        return {
          minX: entity.geometry.center.x - r,
          minY: entity.geometry.center.y - r,
          maxX: entity.geometry.center.x + r,
          maxY: entity.geometry.center.y + r,
        };
      }
      break;
    case 'POLYLINE':
    case 'LWPOLYLINE':
    case 'SPLINE':
      if (entity.geometry.points && Array.isArray(entity.geometry.points)) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        entity.geometry.points.forEach((p: any) => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
        return { minX, minY, maxX, maxY };
      }
      break;
  }

  return null;
}

function isEntityCompletelyInside(entity: Entity, rect: SelectionRect): boolean {
  const bbox = getEntityBoundingBox(entity);
  if (!bbox) return false;

  return (
    bbox.minX >= rect.minX &&
    bbox.minY >= rect.minY &&
    bbox.maxX <= rect.maxX &&
    bbox.maxY <= rect.maxY
  );
}

function isEntityIntersecting(entity: Entity, rect: SelectionRect): boolean {
  const bbox = getEntityBoundingBox(entity);
  if (!bbox) return false;

  return !(
    bbox.maxX < rect.minX ||
    bbox.minX > rect.maxX ||
    bbox.maxY < rect.minY ||
    bbox.minY > rect.maxY
  );
}

export const getSelectedEntities = (
  entities: Entity[],
  rect: SelectionRect,
  mode: SelectionMode
): Set<string> => {
  const selected = new Set<string>();

  for (const entity of entities) {
    if (mode === 'window') {
      if (isEntityCompletelyInside(entity, rect)) {
        selected.add(entity.id);
      }
    } else if (isEntityIntersecting(entity, rect)) {
      selected.add(entity.id);
    }
  }

  return selected;
};
