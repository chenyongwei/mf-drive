import { BoundingBox } from '../common/WebGPUCADView';
import { Entity } from '../../lib/webgpu/EntityToVertices';

export interface FileData {
  partId: string;
  originalFilename?: string;
  name?: string;
  fileType: 'DXF' | 'PRTS';
  baseName: string;
}

export interface PartData {
  partId: string;
  originalFilename?: string;
  geometry: {
    boundingBox: BoundingBox;
    area: number;
  };
  entities: Entity[];
}

export interface LoadedPart extends PartData {
  offsetX: number;
  offsetY: number;
  isPartMode: boolean;
  fileType: 'DXF' | 'PRTS';
  baseName: string;
  channel: string;
}

export interface CompareViewerWebCADProps {
  files: Array<FileData>;
}
