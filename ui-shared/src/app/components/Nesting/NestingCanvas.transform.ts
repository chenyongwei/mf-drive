import type { Entity } from '../../lib/webgpu/EntityToVertices';
import type { TextLabel } from '../../lib/webgpu/TextRenderingManager';
import type { LoadedPart } from './NestingCanvas.types';

export const PANTONE_COLORS = [
  '#FFD700', '#FFC125', '#FFD100', '#F8F32B', '#FFD347', '#F9D23C', '#FFDE59',
  '#FFC947', '#FFB347', '#FFA500', '#FF8C00', '#FF7F50', '#FF6347', '#FF4500',
  '#FF5733', '#FF6F61', '#E67E22', '#F39C12', '#F1C40F', '#FFA07A', '#FF0000',
  '#DC143C', '#B22222', '#FF6B6B', '#C0392B', '#E74C3C', '#FF5252', '#D32F2F',
  '#B71C1C', '#BE3455', '#FFC0CB', '#FFB6C1', '#FF69B4', '#FF1493', '#DB7093',
  '#C71585', '#F7CAC9', '#E8ADAA', '#D98194', '#E8B4BC', '#9370DB', '#8A2BE2',
  '#6A5ACD', '#5F4B8B', '#6667AB', '#7695FF', '#9D00FF', '#8B008B', '#9932CC',
  '#7B68EE', '#0000FF', '#00008B', '#1E90FF', '#00BFFF', '#4169E1', '#6495ED',
  '#0F4C81', '#4682B4', '#5F9EA0', '#87CEEB', '#4ecdc4', '#00CED1', '#40E0D0',
  '#008B8B', '#20B2AA', '#66CDAA', '#48D1CC', '#7FFFD4', '#00FF00', '#32CD32',
  '#90EE90', '#00FA9A', '#3CB371', '#228B22', '#88B04B', '#006400', '#2E8B57',
  '#8FBC8F',
];

export const getRandomPantoneColor = (partId: string): string => {
  if (!partId) return PANTONE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < partId.length; i++) {
    hash = partId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PANTONE_COLORS.length;
  return PANTONE_COLORS[index];
};

export function convertToWebGPUEntities(part: LoadedPart): Entity[] {
  const entities: Entity[] = [];

  part.entities.forEach((entity: any) => {
    if (entity.isInnerContour) return;

    const baseEntity: Entity = {
      id: `${part.partId}-${entity.id}`,
      type: entity.type.toUpperCase(),
      color: 3,
      isSelected: false,
      isPart: true,
      partColor: part.color,
    };

    switch (entity.type) {
      case 'lwpolyline':
        if (entity.points) {
          const translatedPoints = entity.points.map((p: any) => ({ x: p.x + part.offsetX, y: p.y + part.offsetY }));
          entities.push({ ...baseEntity, geometry: { points: translatedPoints, closed: entity.polyflag === 1 } });
        }
        break;
      case 'line':
        if (entity.start && entity.end) {
          entities.push({
            ...baseEntity,
            geometry: {
              start: { x: entity.start.x + part.offsetX, y: entity.start.y + part.offsetY },
              end: { x: entity.end.x + part.offsetX, y: entity.end.y + part.offsetY },
            },
          });
        }
        break;
      case 'circle':
        if (entity.center && entity.radius !== undefined) {
          entities.push({
            ...baseEntity,
            geometry: { center: { x: entity.center.x + part.offsetX, y: entity.center.y + part.offsetY }, radius: entity.radius },
          });
        }
        break;
      case 'arc':
        if (entity.center && entity.radius !== undefined) {
          entities.push({
            ...baseEntity,
            geometry: {
              center: { x: entity.center.x + part.offsetX, y: entity.center.y + part.offsetY },
              radius: entity.radius,
              startAngle: entity.startAngle || 0,
              endAngle: entity.endAngle || Math.PI * 2,
            },
          });
        }
        break;
      default:
        break;
    }
  });

  return entities;
}

export function convertToFillData(part: LoadedPart): { id: string; entities: Entity[]; color: string } {
  const entities: Entity[] = [];

  part.entities.forEach((entity: any) => {
    if (!entity.isInnerContour && entity.type === 'lwpolyline' && entity.polyflag === 1) {
      const translatedPoints = entity.points.map((p: any) => ({ x: p.x + part.offsetX, y: p.y + part.offsetY }));
      entities.push({
        id: `${part.partId}-${entity.id}-fill`,
        type: 'POLYLINE',
        geometry: { points: translatedPoints, closed: true },
      });
    }
  });

  return { id: part.partId, entities, color: part.color };
}

export function generateTextLabels(parts: LoadedPart[]): TextLabel[] {
  return parts.map((part) => {
    const bbox = part.geometry.boundingBox;
    return {
      x: bbox.minX + part.offsetX,
      y: bbox.minY + part.offsetY - 15,
      text: part.originalFilename || part.partId,
      height: 14,
      color: '#ffffff',
    };
  });
}

export function generateMaterialEntities(material: { width: number; height: number }): Entity[] {
  return [
    {
      id: 'material-boundary',
      type: 'POLYLINE',
      color: 7,
      geometry: {
        points: [
          { x: 0, y: 0 },
          { x: material.width, y: 0 },
          { x: material.width, y: material.height },
          { x: 0, y: material.height },
          { x: 0, y: 0 },
        ],
        closed: true,
      },
      linetype: 'dashed',
    },
  ];
}

export function rotateAndTranslatePoints(
  points: any[],
  rotation: number,
  position: { x: number; y: number },
): { x: number; y: number }[] {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return points.map((p: any) => ({
    x: p.x * cos - p.y * sin + position.x,
    y: p.x * sin + p.y * cos + position.y,
  }));
}

export function convertGeometryWithTransform(
  entities: any[],
  position: { x: number; y: number },
  rotation: number,
  partId: string,
  color: string,
): Entity[] {
  const result: Entity[] = [];
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const transformPoint = (p: any) => ({ x: p.x * cos - p.y * sin + position.x, y: p.x * sin + p.y * cos + position.y });

  entities.forEach((entity: any) => {
    if (entity.isInnerContour) return;

    const baseEntity: Entity = {
      id: `${partId}-${entity.id}`,
      type: entity.type.toUpperCase(),
      color: 3,
      isSelected: false,
      isPart: true,
      partColor: color,
    };

    switch (entity.type) {
      case 'lwpolyline':
        if (entity.points) {
          result.push({ ...baseEntity, geometry: { points: entity.points.map(transformPoint), closed: entity.polyflag === 1 } });
        }
        break;
      case 'line':
        if (entity.start && entity.end) {
          result.push({ ...baseEntity, geometry: { start: transformPoint(entity.start), end: transformPoint(entity.end) } });
        }
        break;
      case 'circle':
        if (entity.center && entity.radius !== undefined) {
          result.push({ ...baseEntity, geometry: { center: transformPoint(entity.center), radius: entity.radius } });
        }
        break;
      case 'arc':
        if (entity.center && entity.radius !== undefined) {
          result.push({
            ...baseEntity,
            geometry: {
              center: transformPoint(entity.center),
              radius: entity.radius,
              startAngle: (entity.startAngle || 0) + rotation,
              endAngle: (entity.endAngle || Math.PI * 2) + rotation,
            },
          });
        }
        break;
      default:
        break;
    }
  });

  return result;
}
