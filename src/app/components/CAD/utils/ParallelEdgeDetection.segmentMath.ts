import { Point } from '../../../lib/webgpu/CollisionDetectionEngine';
import { EDGE_EPSILON } from './ParallelEdgeDetection.geometry';
import { Edge, ParallelEdgePair } from './ParallelEdgeDetection.types';

export function getEdgeDirection(edge: Edge): Point {
    const dx = edge.end.x - edge.start.x;
    const dy = edge.end.y - edge.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.001) return { x: 1, y: 0 };
    return { x: dx / length, y: dy / length };
}

export function areEdgesParallel(dir1: Point, dir2: Point, tolerance: number = 0.1): boolean {
    const dot = Math.abs(dir1.x * dir2.x + dir1.y * dir2.y);
    return dot > 1 - tolerance;
}

export function calculateEdgeDistance(edge1: Edge, edge2: Edge): number {
    const midpoint1 = {
        x: (edge1.start.x + edge1.end.x) / 2,
        y: (edge1.start.y + edge1.end.y) / 2,
    };

    const dir2 = getEdgeDirection(edge2);
    const normal = { x: -dir2.y, y: dir2.x };

    const toMid = {
        x: midpoint1.x - edge2.start.x,
        y: midpoint1.y - edge2.start.y,
    };

    return Math.abs(toMid.x * normal.x + toMid.y * normal.y);
}

export function getEdgeLength(edge: Edge): number {
    return Math.hypot(edge.end.x - edge.start.x, edge.end.y - edge.start.y);
}

function pointToSegmentDistance(point: Point, edge: Edge): number {
    const vx = edge.end.x - edge.start.x;
    const vy = edge.end.y - edge.start.y;
    const lengthSq = vx * vx + vy * vy;
    if (lengthSq <= EDGE_EPSILON * EDGE_EPSILON) {
        return Math.hypot(point.x - edge.start.x, point.y - edge.start.y);
    }
    const tRaw = ((point.x - edge.start.x) * vx + (point.y - edge.start.y) * vy) / lengthSq;
    const t = Math.max(0, Math.min(1, tRaw));
    const projection = {
        x: edge.start.x + vx * t,
        y: edge.start.y + vy * t,
    };
    return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function closestPointOnSegment(point: Point, edge: Edge): Point {
    const vx = edge.end.x - edge.start.x;
    const vy = edge.end.y - edge.start.y;
    const lengthSq = vx * vx + vy * vy;
    if (lengthSq <= EDGE_EPSILON * EDGE_EPSILON) {
        return { ...edge.start };
    }
    const tRaw = ((point.x - edge.start.x) * vx + (point.y - edge.start.y) * vy) / lengthSq;
    const t = Math.max(0, Math.min(1, tRaw));
    return {
        x: edge.start.x + vx * t,
        y: edge.start.y + vy * t,
    };
}

function orientation(a: Point, b: Point, c: Point): number {
    return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function onSegment(a: Point, b: Point, c: Point): boolean {
    return (
        Math.min(a.x, c.x) - EDGE_EPSILON <= b.x &&
        b.x <= Math.max(a.x, c.x) + EDGE_EPSILON &&
        Math.min(a.y, c.y) - EDGE_EPSILON <= b.y &&
        b.y <= Math.max(a.y, c.y) + EDGE_EPSILON
    );
}

function segmentsIntersect(edge1: Edge, edge2: Edge): boolean {
    const p1 = edge1.start;
    const q1 = edge1.end;
    const p2 = edge2.start;
    const q2 = edge2.end;

    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (Math.sign(o1) !== Math.sign(o2) && Math.sign(o3) !== Math.sign(o4)) {
        return true;
    }

    if (Math.abs(o1) <= EDGE_EPSILON && onSegment(p1, p2, q1)) return true;
    if (Math.abs(o2) <= EDGE_EPSILON && onSegment(p1, q2, q1)) return true;
    if (Math.abs(o3) <= EDGE_EPSILON && onSegment(p2, p1, q2)) return true;
    if (Math.abs(o4) <= EDGE_EPSILON && onSegment(p2, q1, q2)) return true;

    return false;
}

export function calculateSegmentDistance(edge1: Edge, edge2: Edge): number {
    if (segmentsIntersect(edge1, edge2)) {
        return 0;
    }
    return Math.min(
        pointToSegmentDistance(edge1.start, edge2),
        pointToSegmentDistance(edge1.end, edge2),
        pointToSegmentDistance(edge2.start, edge1),
        pointToSegmentDistance(edge2.end, edge1),
    );
}

function segmentIntersectionPoint(edge1: Edge, edge2: Edge): Point | null {
    const x1 = edge1.start.x;
    const y1 = edge1.start.y;
    const x2 = edge1.end.x;
    const y2 = edge1.end.y;
    const x3 = edge2.start.x;
    const y3 = edge2.start.y;
    const x4 = edge2.end.x;
    const y4 = edge2.end.y;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denominator) <= EDGE_EPSILON) {
        return null;
    }

    const determinant1 = x1 * y2 - y1 * x2;
    const determinant2 = x3 * y4 - y3 * x4;
    const px = (determinant1 * (x3 - x4) - (x1 - x2) * determinant2) / denominator;
    const py = (determinant1 * (y3 - y4) - (y1 - y2) * determinant2) / denominator;
    return { x: px, y: py };
}

export function closestPointsBetweenSegments(edge1: Edge, edge2: Edge): {
    sourcePoint: Point;
    targetPoint: Point;
    distance: number;
} {
    if (segmentsIntersect(edge1, edge2)) {
        const intersection = segmentIntersectionPoint(edge1, edge2)
            ?? closestPointOnSegment(edge1.start, edge2);
        return {
            sourcePoint: { ...intersection },
            targetPoint: { ...intersection },
            distance: 0,
        };
    }

    const candidates: Array<{ sourcePoint: Point; targetPoint: Point; distance: number }> = [];

    const sourceStartToTarget = closestPointOnSegment(edge1.start, edge2);
    candidates.push({
        sourcePoint: { ...edge1.start },
        targetPoint: sourceStartToTarget,
        distance: Math.hypot(edge1.start.x - sourceStartToTarget.x, edge1.start.y - sourceStartToTarget.y),
    });

    const sourceEndToTarget = closestPointOnSegment(edge1.end, edge2);
    candidates.push({
        sourcePoint: { ...edge1.end },
        targetPoint: sourceEndToTarget,
        distance: Math.hypot(edge1.end.x - sourceEndToTarget.x, edge1.end.y - sourceEndToTarget.y),
    });

    const targetStartToSource = closestPointOnSegment(edge2.start, edge1);
    candidates.push({
        sourcePoint: targetStartToSource,
        targetPoint: { ...edge2.start },
        distance: Math.hypot(edge2.start.x - targetStartToSource.x, edge2.start.y - targetStartToSource.y),
    });

    const targetEndToSource = closestPointOnSegment(edge2.end, edge1);
    candidates.push({
        sourcePoint: targetEndToSource,
        targetPoint: { ...edge2.end },
        distance: Math.hypot(edge2.end.x - targetEndToSource.x, edge2.end.y - targetEndToSource.y),
    });

    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0];
}

export function doEdgesOverlap(edge1: Edge, edge2: Edge): boolean {
    const dir = getEdgeDirection(edge1);

    const proj1Start = edge1.start.x * dir.x + edge1.start.y * dir.y;
    const proj1End = edge1.end.x * dir.x + edge1.end.y * dir.y;
    const proj2Start = edge2.start.x * dir.x + edge2.start.y * dir.y;
    const proj2End = edge2.end.x * dir.x + edge2.end.y * dir.y;

    const min1 = Math.min(proj1Start, proj1End);
    const max1 = Math.max(proj1Start, proj1End);
    const min2 = Math.min(proj2Start, proj2End);
    const max2 = Math.max(proj2Start, proj2End);

    return !(max1 < min2 || max2 < min1);
}

export function sortEdgePairs(results: ParallelEdgePair[]): ParallelEdgePair[] {
    results.sort((a, b) => {
        if (Math.abs(a.distance - b.distance) > EDGE_EPSILON) {
            return a.distance - b.distance;
        }
        const aInnerScore = Number(Boolean(a.edge1.isInnerContour)) + Number(Boolean(a.edge2.isInnerContour));
        const bInnerScore = Number(Boolean(b.edge1.isInnerContour)) + Number(Boolean(b.edge2.isInnerContour));
        if (aInnerScore !== bInnerScore) {
            return bInnerScore - aInnerScore;
        }
        const aLenScore = getEdgeLength(a.edge1) + getEdgeLength(a.edge2);
        const bLenScore = getEdgeLength(b.edge1) + getEdgeLength(b.edge2);
        return bLenScore - aLenScore;
    });
    return results;
}
