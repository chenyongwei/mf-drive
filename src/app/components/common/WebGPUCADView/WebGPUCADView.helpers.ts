import { Entity } from '../../../lib/webgpu/EntityToVertices';
import { TextLabel } from '../../../lib/webgpu/TextRenderingManager';
import { BoundingBox, InspectionMarker, PartFillData } from './WebGPUCADView.types';

export const RULER_SIZE = { width: 15, height: 15 };

export const EMPTY_ARRAY = Object.freeze([]);

export const calculateEntitiesBoundingBox = (
  entities: Entity[],
  markers: InspectionMarker[],
  labels: TextLabel[],
  parts: PartFillData[],
): BoundingBox | null => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasContent = false;

  const updateBounds = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    hasContent = true;
  };

  for (const entity of entities) {
    if (!entity.geometry) continue;

    if (entity.type === 'LINE' && entity.geometry.start && entity.geometry.end) {
      updateBounds(entity.geometry.start.x, entity.geometry.start.y);
      updateBounds(entity.geometry.end.x, entity.geometry.end.y);
    } else if (entity.geometry.center) {
      const { x, y } = entity.geometry.center;
      const r = entity.geometry.radius || 0;
      updateBounds(x - r, y - r);
      updateBounds(x + r, y + r);
    } else if (entity.geometry.points) {
      for (const p of entity.geometry.points) {
        updateBounds(p.x, p.y);
      }
    } else if (entity.geometry.controlPoints) {
      for (const p of entity.geometry.controlPoints) {
        updateBounds(p.x, p.y);
      }
    }
  }

  for (const marker of markers) {
    updateBounds(marker.x, marker.y);
  }

  for (const label of labels) {
    updateBounds(label.x, label.y);
    updateBounds(label.x + 10, label.y + 10);
  }

  for (const part of parts) {
    for (const entity of part.entities) {
      if (!entity.geometry?.points) continue;
      for (const p of entity.geometry.points) {
        updateBounds(p.x, p.y);
      }
    }
  }

  if (!hasContent) return null;

  return { minX, minY, maxX, maxY };
};
