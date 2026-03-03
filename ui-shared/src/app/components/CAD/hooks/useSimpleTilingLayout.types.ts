import type { Entity } from '../../../webgpu/EntityToVertices';
import type { BoundingBox } from '../components/types/BoundingBox';

export interface FileData {
  id: string;
  name: string;
  type: 'DXF' | 'PRTS';
  partId?: string;
}

export interface FileLayout {
  fileId: string;
  offsetX: number;
  offsetY: number;
  boundingBox: BoundingBox;
}

export interface LayoutResult {
  entities: Entity[];
  contentBox: BoundingBox | null;
  fileLayouts: FileLayout[];
}

export interface LayoutProps {
  entitiesMap: Record<string, Entity[]>;
  files: FileData[];
  selectedFileId?: string | null;
  preferredAnchorFileId?: string | null;
  selectedEntityIds?: string[];
  hoveredEntityId?: string | null;
}
