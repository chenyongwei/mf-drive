import type { Contour, Entity, Point } from '../../../types/editing';

export interface GraphNode {
  point: Point;
  entityIds: string[];
  connections: Map<string, Point>;
}

export interface EntityGraph {
  nodes: Map<string, GraphNode>;
  entities: Map<string, Entity>;
}

export interface ContourDetectionResult {
  contours: Contour[];
  numClosed: number;
  numOpen: number;
}

export const POINT_TOLERANCE = 0.01;
