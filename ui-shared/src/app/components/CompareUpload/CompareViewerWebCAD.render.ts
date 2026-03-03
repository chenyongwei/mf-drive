import { Entity } from '../../lib/webgpu/EntityToVertices';
import { TextLabel } from '../../lib/webgpu/TextRenderingManager';
import { PART_EXPANSION } from '../../constants/layoutConstants';
import { LoadedPart } from './CompareViewerWebCAD.types';

const translateEntity = (entity: Entity, offsetX: number, offsetY: number): Entity => {
  const translated = { ...entity };

  switch (entity.type) {
    case 'LINE':
      if (entity.geometry?.start && entity.geometry?.end) {
        translated.geometry = {
          ...entity.geometry,
          start: {
            x: entity.geometry.start.x + offsetX,
            y: entity.geometry.start.y + offsetY,
          },
          end: {
            x: entity.geometry.end.x + offsetX,
            y: entity.geometry.end.y + offsetY,
          },
        };
      }
      break;

    case 'POLYLINE':
    case 'LWPOLYLINE':
      if (entity.geometry?.points) {
        translated.geometry = {
          ...entity.geometry,
          points: entity.geometry.points.map((p: any) => ({
            x: p.x + offsetX,
            y: p.y + offsetY,
          })),
        };
      }
      break;

    case 'CIRCLE':
    case 'ARC':
      if (entity.geometry?.center) {
        translated.geometry = {
          ...entity.geometry,
          center: {
            x: entity.geometry.center.x + offsetX,
            y: entity.geometry.center.y + offsetY,
          },
        };
      }
      break;
  }

  return translated;
};

export const buildRenderData = (loadedParts: LoadedPart[]) => {
  const allEntities: Entity[] = [];
  const partsForFilling: Array<{ id: string; entities: Entity[]; color: string }> = [];
  const textLabels: TextLabel[] = [];

  loadedParts.forEach((part) => {
    const expansion = PART_EXPANSION;
    const isDXF = part.fileType === 'DXF';
    const boxColor = isDXF ? 4 : 3;

    const { minX, minY, maxX, maxY } = part.geometry.boundingBox;
    const boxEntity: Entity = {
      id: `${part.partId}-bbox`,
      type: 'POLYLINE',
      geometry: {
        points: [
          { x: minX - expansion + part.offsetX, y: minY - expansion + part.offsetY },
          { x: maxX + expansion + part.offsetX, y: minY - expansion + part.offsetY },
          { x: maxX + expansion + part.offsetX, y: maxY + expansion + part.offsetY },
          { x: minX - expansion + part.offsetX, y: maxY + expansion + part.offsetY },
          { x: minX - expansion + part.offsetX, y: minY - expansion + part.offsetY },
        ],
        closed: true,
      },
      color: boxColor,
      linetype: 'dashed',
    };
    allEntities.push(boxEntity);

    const textHeight = 10;
    textLabels.push({
      x: minX - expansion + 10 + part.offsetX,
      y: minY - expansion + 10 + part.offsetY + textHeight,
      text: part.originalFilename || part.partId,
      height: textHeight,
      color: '#FFFFFF',
    });

    if (part.isPartMode) {
      const outerEntities = part.entities.filter(entity => !entity.isInnerContour);
      const translatedEntities = outerEntities.map(entity =>
        translateEntity(entity, part.offsetX, part.offsetY),
      );

      partsForFilling.push({
        id: part.partId,
        entities: translatedEntities,
        color: part.channel,
      });

      part.entities.forEach((entity) => {
        if (!entity.isInnerContour) return;
        const translatedEntity = translateEntity(entity, part.offsetX, part.offsetY);
        allEntities.push({
          ...translatedEntity,
          linetype: 'dashed',
          color: 4,
        });
      });
    } else {
      part.entities.forEach((entity) => {
        const translatedEntity = translateEntity(entity, part.offsetX, part.offsetY);
        allEntities.push({
          ...translatedEntity,
          partId: part.partId,
        });
      });
    }
  });

  return { allEntities, partsForFilling, textLabels };
};
