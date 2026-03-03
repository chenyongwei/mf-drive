import type { Entity } from '../../lib/webgpu/EntityToVertices';
import { PART_EXPANSION } from '../../constants/layoutConstants';
import type { LoadedPart } from './PartViewerWebCAD.types';

type FillRenderPart = { id: string; entities: Entity[]; color: string };

function translateEntity(entity: Entity, offsetX: number, offsetY: number): Entity {
  const translated = { ...entity };
  switch (entity.type) {
    case 'LINE':
      if (entity.geometry?.start && entity.geometry?.end) {
        translated.geometry = {
          ...entity.geometry,
          start: { x: entity.geometry.start.x + offsetX, y: entity.geometry.start.y + offsetY },
          end: { x: entity.geometry.end.x + offsetX, y: entity.geometry.end.y + offsetY },
        };
      }
      break;

    case 'POLYLINE':
    case 'LWPOLYLINE':
      if (entity.geometry?.points) {
        translated.geometry = {
          ...entity.geometry,
          points: entity.geometry.points.map((point) => ({
            x: point.x + offsetX,
            y: point.y + offsetY,
          })),
        };
      }
      break;

    case 'CIRCLE':
    case 'ARC':
      if (entity.geometry?.center) {
        translated.geometry = {
          ...entity.geometry,
          center: { x: entity.geometry.center.x + offsetX, y: entity.geometry.center.y + offsetY },
        };
      }
      break;

    case 'SPLINE':
      if (entity.geometry?.controlPoints) {
        translated.geometry = {
          ...entity.geometry,
          controlPoints: entity.geometry.controlPoints.map((point) => ({
            x: point.x + offsetX,
            y: point.y + offsetY,
          })),
        };
      }
      if (entity.geometry?.points) {
        translated.geometry = {
          ...translated.geometry,
          points: entity.geometry.points.map((point) => ({
            x: point.x + offsetX,
            y: point.y + offsetY,
          })),
        };
      }
      break;

    case 'ELLIPSE':
      if (entity.geometry?.center) {
        translated.geometry = {
          ...entity.geometry,
          center: { x: entity.geometry.center.x + offsetX, y: entity.geometry.center.y + offsetY },
        };
      }
      break;

    case 'POINT':
      if (entity.geometry?.position) {
        translated.geometry = {
          ...entity.geometry,
          position: {
            x: entity.geometry.position.x + offsetX,
            y: entity.geometry.position.y + offsetY,
          },
        };
      }
      break;
  }
  return translated;
}

export function buildRenderData(parts: LoadedPart[]): {
  allEntities: Entity[];
  partsForFilling: FillRenderPart[];
} {
  const allEntities: Entity[] = [];
  const partsForFilling: FillRenderPart[] = [];

  parts.forEach((part) => {
    const { minX, minY, maxX, maxY } = part.geometry.boundingBox;
    const boxEntity: Entity = {
      id: `${part.partId}-bbox`,
      type: 'POLYLINE',
      geometry: {
        points: [
          { x: minX - PART_EXPANSION + part.offsetX, y: minY - PART_EXPANSION + part.offsetY },
          { x: maxX + PART_EXPANSION + part.offsetX, y: minY - PART_EXPANSION + part.offsetY },
          { x: maxX + PART_EXPANSION + part.offsetX, y: maxY + PART_EXPANSION + part.offsetY },
          { x: minX - PART_EXPANSION + part.offsetX, y: maxY + PART_EXPANSION + part.offsetY },
          { x: minX - PART_EXPANSION + part.offsetX, y: minY - PART_EXPANSION + part.offsetY },
        ],
        closed: true,
      },
      color: 7,
      linetype: 'dashed',
    };
    allEntities.push(boxEntity);

    if (part.isPartMode) {
      const outerEntities = part.entities.filter((entity) => !entity.isInnerContour);
      const translatedEntities = outerEntities.map((entity) =>
        translateEntity(entity, part.offsetX, part.offsetY),
      );
      partsForFilling.push({
        id: part.partId,
        entities: translatedEntities,
        color: String(part.channel),
      });

      part.entities.forEach((entity) => {
        if (!entity.isInnerContour) {
          return;
        }
        const translatedEntity = translateEntity(entity, part.offsetX, part.offsetY);
        allEntities.push({
          ...translatedEntity,
          linetype: 'dashed',
          color: 4,
        });
      });
      return;
    }

    part.entities.forEach((entity) => {
      const translatedEntity = translateEntity(entity, part.offsetX, part.offsetY);
      allEntities.push({
        ...translatedEntity,
        partId: part.partId,
      });
    });
  });

  return { allEntities, partsForFilling };
}
