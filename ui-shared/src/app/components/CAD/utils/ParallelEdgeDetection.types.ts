import { BoundingBox, Point } from '../../../lib/webgpu/CollisionDetectionEngine';
import { Entity } from '../../../lib/webgpu/EntityToVertices';

export interface Edge {
    start: Point;
    end: Point;
    partId: string;
    isInnerContour?: boolean;
}

export interface ParallelEdgePair {
    edge1: Edge;
    edge2: Edge;
    distance: number;
    direction: Point;
}

export interface FindEdgePairsOptions {
    limit?: number;
}

export interface ClosestContourConnection {
    sourceEdge: Edge;
    targetEdge: Edge;
    sourcePoint: Point;
    targetPoint: Point;
    distance: number;
    targetPartId: string;
    contourMode: TargetContourMode;
}

export interface PartForEdgeDetection {
    id: string;
    position: Point;
    rotation: number;
    boundingBox: BoundingBox;
    mirroredX?: boolean;
    mirroredY?: boolean;
    entities?: Entity[];
}

export type TargetContourMode = 'inner' | 'outer';
