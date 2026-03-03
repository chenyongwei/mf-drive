import type { Entity } from '../../lib/webgpu/EntityToVertices';
import { getRandomPantoneColor } from './PartViewerWebCAD.colors';
import type { LoadedPart, PartViewerWebCADProps } from './PartViewerWebCAD.types';

interface RawPartResponse {
  partId: string;
  geometry: LoadedPart['geometry'];
  entities?: Array<Record<string, unknown>>;
}

function convertEntities(data: RawPartResponse): Entity[] {
  return (data.entities ?? []).map((rawEntity) => {
    if (rawEntity.type !== 'lwpolyline') {
      return rawEntity as unknown as Entity;
    }
    const apiEntity = rawEntity as {
      id?: string | number;
      points?: Array<{ x: number; y: number }>;
      polyflag?: number;
      isInnerContour?: boolean;
    };
    return {
      id: `${data.partId}-entity-${String(apiEntity.id ?? '')}`,
      type: 'POLYLINE',
      geometry: {
        points: apiEntity.points ?? [],
        closed: apiEntity.polyflag === 1,
      },
      color: 3,
      isPart: true,
      isInnerContour: apiEntity.isInnerContour,
    };
  });
}

export async function loadParts(
  parts: PartViewerWebCADProps['parts'],
): Promise<LoadedPart[]> {
  return Promise.all(
    parts.map(async (partInfo) => {
      const response = await fetch(`/api/drawing/parts/${partInfo.partId}`);
      if (!response.ok) {
        throw new Error(`Failed to load part: ${partInfo.partId}`);
      }
      const data = (await response.json()) as RawPartResponse;
      return {
        ...data,
        entities: convertEntities(data),
        originalFilename: partInfo.originalFilename,
        offsetX: 0,
        offsetY: 0,
        isPartMode: true,
        channel: getRandomPantoneColor(data.partId),
      };
    }),
  );
}
