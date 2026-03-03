import type { BoundingBox, GraphicDocument, GraphicEntity, GraphicUnit } from "../../../types";

import { applyScaleToGeometry } from "./geometry";
import { UnitConverter } from "./units";

export function convertDocumentUnits(
  document: GraphicDocument,
  targetUnit: GraphicUnit
): GraphicDocument {
  if (document.meta.unit === targetUnit) {
    return document;
  }

  const scale = UnitConverter.scaleFactor(document.meta.unit, targetUnit);
  const entities: Record<string, GraphicEntity> = {};
  for (const [key, entity] of Object.entries(document.entities)) {
    entities[key] = {
      ...entity,
      geometry: applyScaleToGeometry(entity.type, entity.geometry, scale),
    };
  }

  const convertBBox = (bbox: BoundingBox | undefined): BoundingBox | undefined => {
    if (!bbox) return bbox;
    return {
      minX: bbox.minX * scale,
      minY: bbox.minY * scale,
      maxX: bbox.maxX * scale,
      maxY: bbox.maxY * scale,
    };
  };

  const next: GraphicDocument = {
    ...document,
    meta: {
      ...document.meta,
      unit: targetUnit,
      bbox: convertBBox(document.meta.bbox) ?? document.meta.bbox,
    },
    entities,
    topology: {
      ...document.topology,
      layers: document.topology.layers.map((layer) => ({ ...layer })),
      contours: document.topology.contours.map((contour) => ({
        ...contour,
        bbox: convertBBox(contour.bbox) ?? contour.bbox,
      })),
      parts: document.topology.parts.map((part) => ({ ...part })),
    },
    indexes: {
      ...document.indexes,
      entityToLayers: { ...document.indexes.entityToLayers },
      entityToParts: { ...document.indexes.entityToParts },
      layerOrder: [...document.indexes.layerOrder],
      spatialIndex: document.indexes.spatialIndex
        ? { ...document.indexes.spatialIndex }
        : undefined,
    },
    stats: { ...document.stats },
    chunks: document.chunks
      ? document.chunks.map((chunk) => ({
          ...chunk,
          bbox: convertBBox(chunk.bbox) ?? chunk.bbox,
        }))
      : undefined,
  };

  return next;
}
