import type { Entity } from '../../../webgpu/EntityToVertices';
import type { BoundingBox } from '../components/types/BoundingBox';

import { getEntityBBox } from '../../../utils/entityBBox';

export const calculateBoundingBox = (entities: Entity[]): BoundingBox | null => {
  if (entities.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  entities.forEach((entity) => {
    if (!entity.geometry) return;

    try {
      const bbox = getEntityBBox(entity);
      minX = Math.min(minX, bbox.minX);
      minY = Math.min(minY, bbox.minY);
      maxX = Math.max(maxX, bbox.maxX);
      maxY = Math.max(maxY, bbox.maxY);
    } catch {
      // Skip entities that cannot be processed.
    }
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
};
