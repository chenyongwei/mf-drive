export interface ImportedFile {
  id: string;
  name: string;
  status: 'uploading' | 'parsing' | 'ready' | 'error';
  parts: any[];
  bbox?: { minX: number; minY: number; maxX: number; maxY: number };
  inspectionResult?: {
    issues: Array<{
      id?: string;
      type: string;
      description: string;
      location: { position: { x: number; y: number } };
      severity: string;
    }>;
  };
}

export interface TiledLayout {
  fileId: string;
  position: { x: number; y: number };
  scale: number;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface FileEntities {
  fileId: string;
  entities: any[];
  loaded: boolean;
  loading: boolean;
}
