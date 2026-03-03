import type { Point } from '../../../types';

export interface Entity {
  id: string;
  type: string;
  geometry?: any;
}

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
  contours: import('../../../types').Contour[];
  numClosed: number;
  numOpen: number;
}
