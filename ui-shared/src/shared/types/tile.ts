import type { BoundingBox } from './base';

// ==================== 分块类型 ====================

export interface Tile {
  id: string;
  zoomLevel: number;
  x: number;
  y: number;
  entities: string[];
  bbox: BoundingBox;
  minZoom: number;
}

export interface TileGrid {
  level: number;
  tileSize: number;
  tiles: Map<string, Tile>;
  entityToTiles: Map<string, string[]>;
}
