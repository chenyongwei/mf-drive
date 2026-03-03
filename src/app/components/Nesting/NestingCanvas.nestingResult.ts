import { getPrtsPart } from '../../services/nestingApi';
import type { Entity } from '../../lib/webgpu/EntityToVertices';
import type { TextLabel } from '../../lib/webgpu/TextRenderingManager';
import type { LoadedPart, NestingPartsData } from './NestingCanvas.types';
import { convertGeometryWithTransform, PANTONE_COLORS, rotateAndTranslatePoints } from './NestingCanvas.transform';

export async function convertNestingResultParts(result: any): Promise<NestingPartsData> {
  const entities: Entity[] = [];
  const fillData: any[] = [];
  const textLabels: TextLabel[] = [];

  if (!result.parts) return { entities, fillData, textLabels };

  const partGeometryPromises = result.parts.map(async (placedPart: any, index: number) => {
    try {
      const geometry = await getPrtsPart(placedPart.partId);
      return { placedPart, geometry, index };
    } catch (error) {
      console.error(`[NestingCanvas] Failed to load geometry for part ${placedPart.partId}:`, error);
      return { placedPart, geometry: null, index };
    }
  });

  const partsWithGeometry = await Promise.all(partGeometryPromises);

  for (const { placedPart, geometry, index } of partsWithGeometry) {
    const color = PANTONE_COLORS[index % PANTONE_COLORS.length];
    const rotation = placedPart.rotation || 0;
    const position = placedPart.position || { x: 0, y: 0 };

    if (geometry && geometry.entities && geometry.entities.length > 0) {
      const partEntities = convertGeometryWithTransform(
        geometry.entities,
        position,
        rotation,
        placedPart.partId,
        color,
      );
      entities.push(...partEntities);

      const fillEntities = geometry.entities
        .filter((e: any) => !e.isInnerContour && e.type === 'lwpolyline' && e.polyflag === 1)
        .map((e: any) => ({
          id: `${placedPart.partId}-${e.id}-fill`,
          type: 'POLYLINE',
          geometry: { points: rotateAndTranslatePoints(e.points, rotation, position), closed: true },
        }));

      if (fillEntities.length > 0) {
        fillData.push({
          id: `${placedPart.partId}-fill`,
          entities: fillEntities,
          color,
        });
      }
    } else {
      const bbox = placedPart.bbox;
      fillData.push({
        id: `${placedPart.partId}-${index}-fill`,
        entities: [
          {
            id: `${placedPart.partId}-${index}-bbox`,
            type: 'POLYLINE',
            geometry: {
              points: [
                { x: bbox.minX, y: bbox.minY },
                { x: bbox.maxX, y: bbox.minY },
                { x: bbox.maxX, y: bbox.maxY },
                { x: bbox.minX, y: bbox.maxY },
                { x: bbox.minX, y: bbox.minY },
              ],
              closed: true,
            },
          },
        ],
        color,
      });
    }

    textLabels.push({
      x: position.x + 5,
      y: position.y + 15,
      text: placedPart.partName || placedPart.partId,
      height: 12,
      color: '#ffffff',
    });
  }

  return { entities, fillData, textLabels };
}

export function calculateTileLayout(parts: LoadedPart[]): {
  parts: LoadedPart[];
  globalBox: { minX: number; minY: number; maxX: number; maxY: number };
} {
  if (parts.length === 0) {
    return { parts: [], globalBox: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
  }

  const SPACING = 20;
  const START_X = 100;
  const START_Y = 100;

  let currentX = START_X;
  let currentY = START_Y;
  let maxHeightInRow = 0;
  let globalMinX = Infinity;
  let globalMinY = Infinity;
  let globalMaxX = -Infinity;
  let globalMaxY = -Infinity;

  const layoutParts = parts.map((part, index) => {
    const bbox = part.geometry.boundingBox;
    const width = bbox.maxX - bbox.minX;
    const height = bbox.maxY - bbox.minY;

    if (index > 0 && index % 10 === 0) {
      currentX = START_X;
      currentY += maxHeightInRow + SPACING;
      maxHeightInRow = 0;
    }

    part.offsetX = currentX - bbox.minX;
    part.offsetY = currentY - bbox.minY;

    globalMinX = Math.min(globalMinX, currentX);
    globalMinY = Math.min(globalMinY, currentY);
    globalMaxX = Math.max(globalMaxX, currentX + width);
    globalMaxY = Math.max(globalMaxY, currentY + height);

    currentX += width + SPACING;
    maxHeightInRow = Math.max(maxHeightInRow, height);

    return part;
  });

  return {
    parts: layoutParts,
    globalBox: {
      minX: globalMinX,
      minY: globalMinY,
      maxX: globalMaxX,
      maxY: globalMaxY,
    },
  };
}
