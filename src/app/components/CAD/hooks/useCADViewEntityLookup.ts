import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import { getEntityBBox } from "../../../utils/entityBBox";
import { getDistanceToEntity } from "../utils/hitTest";
import { SpatialIndex } from "../utils/SpatialIndex";

interface UseCADViewEntityLookupOptions {
  entities: Entity[];
  zoom: number;
}

export function useCADViewEntityLookup({ entities, zoom }: UseCADViewEntityLookupOptions) {
  const spatialIndexRef = useRef(new SpatialIndex());
  const entitiesById = useMemo(() => new Map(entities.map((entity) => [entity.id, entity])), [entities]);

  useEffect(() => {
    spatialIndexRef.current.clear();
    entities.forEach((entity) => {
      try {
        const bbox = getEntityBBox(entity);
        spatialIndexRef.current.insert(entity.id, bbox.minX, bbox.minY, bbox.maxX, bbox.maxY);
      } catch {
        // Ignore malformed entity bounds during indexing.
      }
    });
  }, [entities]);

  const findEntityAtPosition = useCallback(
    (x: number, y: number) => {
      const ids = spatialIndexRef.current.query(x, y);
      let closestId: string | null = null;
      let minDistance = 5 / zoom;

      ids.forEach((id) => {
        const entity = entitiesById.get(id);
        if (!entity) {
          return;
        }

        const distance = getDistanceToEntity(x, y, entity);
        if (distance < minDistance) {
          minDistance = distance;
          closestId = id;
        }
      });

      return closestId;
    },
    [entitiesById, zoom],
  );

  return { findEntityAtPosition };
}
