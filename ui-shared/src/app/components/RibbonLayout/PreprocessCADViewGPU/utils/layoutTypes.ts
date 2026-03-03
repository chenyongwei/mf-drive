export interface LayoutBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface TiledLayout {
  fileId: string;
  position: { x: number; y: number };
  scale: number;
  bbox: LayoutBBox;
}

export interface ImportedFile {
  id: string;
  bbox?: LayoutBBox;
}
