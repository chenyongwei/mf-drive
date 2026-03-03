import { getEntityBBox } from './entity';

export function calculateBoundingBox(
  entities: any[]
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (!entities || entities.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const entity of entities) {
    if (!entity.geometry) continue;

    try {
      const bbox = getEntityBBox(entity);
      minX = Math.min(minX, bbox.minX);
      minY = Math.min(minY, bbox.minY);
      maxX = Math.max(maxX, bbox.maxX);
      maxY = Math.max(maxY, bbox.maxY);
    } catch {
      // Skip entities that cannot be processed.
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}
