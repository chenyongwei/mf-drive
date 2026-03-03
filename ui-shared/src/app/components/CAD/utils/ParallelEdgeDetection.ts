/**
 * Parallel Edge Detection Utility
 *
 * Detects parallel edges between parts for visual feedback
 * during manual nesting operations.
 */

import {
    EDGE_EPSILON,
    getPartEdges,
    resolveTargetContourMode,
} from './ParallelEdgeDetection.geometry';
import {
    areEdgesParallel,
    calculateEdgeDistance,
    calculateSegmentDistance,
    closestPointsBetweenSegments,
    doEdgesOverlap,
    getEdgeDirection,
    getEdgeLength,
    sortEdgePairs,
} from './ParallelEdgeDetection.segmentMath';
import {
    ClosestContourConnection,
    Edge,
    FindEdgePairsOptions,
    ParallelEdgePair,
    PartForEdgeDetection,
} from './ParallelEdgeDetection.types';

export type {
    ClosestContourConnection,
    Edge,
    FindEdgePairsOptions,
    ParallelEdgePair,
    PartForEdgeDetection,
    TargetContourMode,
} from './ParallelEdgeDetection.types';

export {
    getPartEdges,
    resolveTargetContourMode,
} from './ParallelEdgeDetection.geometry';

function getDraggedOuterEdges(part: PartForEdgeDetection): Edge[] {
    const allEdges = getPartEdges(part);
    const outerEdges = allEdges.filter((edge) => !Boolean(edge.isInnerContour));
    return outerEdges.length > 0 ? outerEdges : allEdges;
}

function getTargetContourEdges(
    draggedPart: PartForEdgeDetection,
    targetPart: PartForEdgeDetection,
): Edge[] {
    const contourMode = resolveTargetContourMode(draggedPart, targetPart);
    const targetEdgesAll = getPartEdges(targetPart);
    const filteredTargetEdges = targetEdgesAll.filter((edge) =>
        contourMode === 'inner'
            ? Boolean(edge.isInnerContour)
            : !Boolean(edge.isInnerContour),
    );
    return filteredTargetEdges.length > 0 ? filteredTargetEdges : targetEdgesAll;
}

export function findParallelEdges(
    draggedPart: PartForEdgeDetection,
    otherParts: PartForEdgeDetection[],
    maxDistance: number = 20,
    options: FindEdgePairsOptions = {},
): ParallelEdgePair[] {
    const results: ParallelEdgePair[] = [];
    const draggedEdges = getDraggedOuterEdges(draggedPart);
    const { limit = 2 } = options;

    for (const other of otherParts) {
        if (other.id === draggedPart.id) continue;

        const otherEdges = getTargetContourEdges(draggedPart, other);

        for (const edge1 of draggedEdges) {
            const dir1 = getEdgeDirection(edge1);

            for (const edge2 of otherEdges) {
                const dir2 = getEdgeDirection(edge2);

                if (areEdgesParallel(dir1, dir2)) {
                    const distance = calculateEdgeDistance(edge1, edge2);

                    if (distance <= maxDistance && doEdgesOverlap(edge1, edge2)) {
                        results.push({
                            edge1,
                            edge2,
                            distance,
                            direction: dir1,
                        });
                    }
                }
            }
        }
    }

    sortEdgePairs(results);
    return results.slice(0, Math.max(1, limit));
}

export function findClosestContourEdges(
    draggedPart: PartForEdgeDetection,
    otherParts: PartForEdgeDetection[],
    maxDistance: number = 20,
    options: FindEdgePairsOptions = {},
): ParallelEdgePair[] {
    const results: ParallelEdgePair[] = [];
    const draggedEdges = getDraggedOuterEdges(draggedPart);
    const { limit = 2 } = options;

    for (const other of otherParts) {
        if (other.id === draggedPart.id) continue;

        const otherEdges = getTargetContourEdges(draggedPart, other);

        for (const edge1 of draggedEdges) {
            const dir1 = getEdgeDirection(edge1);
            for (const edge2 of otherEdges) {
                const distance = calculateSegmentDistance(edge1, edge2);
                if (distance > maxDistance) {
                    continue;
                }
                results.push({
                    edge1,
                    edge2,
                    distance,
                    direction: dir1,
                });
            }
        }
    }

    sortEdgePairs(results);
    return results.slice(0, Math.max(1, limit));
}

export function findClosestContourConnection(
    draggedPart: PartForEdgeDetection,
    targetPart: PartForEdgeDetection,
    maxDistance: number = Number.POSITIVE_INFINITY,
): ClosestContourConnection | null {
    const draggedEdges = getDraggedOuterEdges(draggedPart);
    const targetEdges = getTargetContourEdges(draggedPart, targetPart);
    const contourMode = resolveTargetContourMode(draggedPart, targetPart);

    if (draggedEdges.length === 0 || targetEdges.length === 0) {
        return null;
    }

    let bestConnection: ClosestContourConnection | null = null;

    for (const sourceEdge of draggedEdges) {
        for (const targetEdge of targetEdges) {
            const closest = closestPointsBetweenSegments(sourceEdge, targetEdge);
            if (closest.distance > maxDistance + EDGE_EPSILON) {
                continue;
            }

            if (
                !bestConnection ||
                closest.distance + EDGE_EPSILON < bestConnection.distance ||
                (
                    Math.abs(closest.distance - bestConnection.distance) <= EDGE_EPSILON &&
                    getEdgeLength(sourceEdge) + getEdgeLength(targetEdge) >
                        getEdgeLength(bestConnection.sourceEdge) + getEdgeLength(bestConnection.targetEdge)
                )
            ) {
                bestConnection = {
                    sourceEdge,
                    targetEdge,
                    sourcePoint: closest.sourcePoint,
                    targetPoint: closest.targetPoint,
                    distance: closest.distance,
                    targetPartId: targetPart.id,
                    contourMode,
                };
            }
        }
    }

    return bestConnection;
}

export function arePartsSnug(
    part1: PartForEdgeDetection,
    part2: PartForEdgeDetection,
    tolerance: number = 5,
): boolean {
    const parallelEdges = findParallelEdges(part1, [part2], tolerance * 2);
    return parallelEdges.some((pair) => pair.distance <= tolerance);
}
