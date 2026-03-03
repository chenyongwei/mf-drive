import type { Entity } from '../../lib/webgpu/EntityToVertices';
import type { TextLabel } from '../../lib/webgpu/TextRenderingManager';

export interface PrtsPart {
  partId: string;
  originalFilename?: string;
  geometry: {
    boundingBox: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    };
    area: number;
  };
  entities: any[];
}

export interface LoadedPart {
  partId: string;
  originalFilename?: string;
  geometry: {
    boundingBox: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    };
    area: number;
  };
  entities: any[];
  offsetX: number;
  offsetY: number;
  color: string;
}

export type NestingPartsData = {
  entities: Entity[];
  fillData: any[];
  textLabels: TextLabel[];
};
