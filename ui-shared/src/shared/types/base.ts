// ==================== 基础类型 ====================

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
