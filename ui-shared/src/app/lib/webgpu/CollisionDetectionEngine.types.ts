export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Polygon {
  points: Point[];
  boundingBox?: BoundingBox;
}

export interface Part {
  id: string;
  outerContour: Polygon;
  innerContours?: Polygon[];
  simplifiedContour?: Polygon;
  boundingBox: BoundingBox;
  position: Point;
  rotation: number;
  mirroredX?: boolean;
  mirroredY?: boolean;
}

export interface CollisionResult {
  hasCollision: boolean;
  collidingParts: string[];
  collisionDetails?: {
    [partId: string]: {
      type: 'rectangle' | 'polygon';
      precision: 'simplified' | 'precise';
    };
  };
}
