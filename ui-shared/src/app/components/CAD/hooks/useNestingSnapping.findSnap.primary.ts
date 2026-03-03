import type { NestingPart } from "../types/NestingTypes";
import {
  resolveTargetContourMode,
  type PartForEdgeDetection,
} from "../utils/ParallelEdgeDetection";
import {
  areEdgesParallel,
  buildSnapKey,
  calculateSpacingOffset,
  distance,
  spacingSnapDistance,
} from "./useNestingSnapping.math";
import { SNAP_RELEASE_EXTRA, type SnapPoint, type SnapResult } from "./useNestingSnapping.types";

export type ConsiderCandidate = (
  result: SnapResult,
  distanceMetric: number,
  key: string,
  priorityBias?: number,
  axisHint?: "x" | "y" | "both",
) => void;

interface PointCandidateArgs {
  draggedPart: NestingPart;
  draggedSnapPoints: SnapPoint[];
  excludePartIds: string[];
  partsById: Map<string, NestingPart>;
  snapPointsMap: Map<string, SnapPoint[]>;
  nearbyPointQuery: (x: number, y: number) => string[];
  snapToEdges: boolean;
  snapToCorners: boolean;
  snapToCenters: boolean;
  partSpacing: number;
  contourModeCache: Map<string, "inner" | "outer">;
  considerCandidate: ConsiderCandidate;
}

export function collectPointSnapCandidates({
  draggedPart,
  draggedSnapPoints,
  excludePartIds,
  partsById,
  snapPointsMap,
  nearbyPointQuery,
  snapToEdges,
  snapToCorners,
  snapToCenters,
  partSpacing,
  contourModeCache,
  considerCandidate,
}: PointCandidateArgs): void {
  for (const draggedPoint of draggedSnapPoints) {
    if (draggedPoint.type === "edge" && !snapToEdges) continue;
    if (draggedPoint.type === "corner" && !snapToCorners) continue;
    if (draggedPoint.type === "center" && !snapToCenters) continue;

    const nearbyPointIds = nearbyPointQuery(
      draggedPoint.position.x,
      draggedPoint.position.y,
    );

    for (const pointId of nearbyPointIds) {
      const [partId, indexStr] = pointId.split("_");
      const index = Number.parseInt(indexStr, 10);
      if (Number.isNaN(index)) continue;
      if (partId === draggedPart.id || excludePartIds.includes(partId)) continue;

      const partPoints = snapPointsMap.get(partId);
      if (!partPoints || !partPoints[index]) continue;

      const targetPoint = partPoints[index];
      const targetPart = partsById.get(partId);
      if (targetPart) {
        const contourMode =
          contourModeCache.get(partId) ??
          resolveTargetContourMode(
            draggedPart as unknown as PartForEdgeDetection,
            targetPart as unknown as PartForEdgeDetection,
          );
        contourModeCache.set(partId, contourMode);

        if (contourMode === "inner" && !Boolean(targetPoint.isInnerContour)) continue;
        if (contourMode === "outer" && Boolean(targetPoint.isInnerContour)) continue;
      }

      if (targetPoint.type === "edge" && !snapToEdges) continue;
      if (targetPoint.type === "corner" && !snapToCorners) continue;
      if (targetPoint.type === "center" && !snapToCenters) continue;

      const rawDistance = distance(draggedPoint.position, targetPoint.position);
      const dist = spacingSnapDistance(rawDistance, partSpacing);

      let snapType = "";
      if (draggedPoint.type === "corner" && targetPoint.type === "corner") {
        snapType = "vertex-to-vertex";
      } else if (draggedPoint.type === "center" && targetPoint.type === "center") {
        snapType = "center-to-center";
      } else if (draggedPoint.type === "edge" && targetPoint.type === "edge") {
        if (draggedPoint.edgeDirection && targetPoint.edgeDirection) {
          snapType = areEdgesParallel(draggedPoint.edgeDirection, targetPoint.edgeDirection)
            ? "edge-to-edge-parallel"
            : "edge-to-edge";
        } else {
          snapType = "edge-to-edge";
        }
      } else if (draggedPoint.type === "edge" || targetPoint.type === "edge") {
        snapType = "point-to-edge";
      } else {
        snapType = "point-to-point";
      }

      const spacingOffset = calculateSpacingOffset(
        draggedPart,
        draggedPoint,
        targetPoint,
        partSpacing,
      );

      const snapPosition = {
        x:
          draggedPart.position.x +
          (targetPoint.position.x - draggedPoint.position.x + spacingOffset.x),
        y:
          draggedPart.position.y +
          (targetPoint.position.y - draggedPoint.position.y + spacingOffset.y),
      };

      const result: SnapResult = {
        snapped: true,
        snapPosition,
        snapPoint: draggedPoint,
        targetPoint,
        snapType,
      };
      const key = buildSnapKey(draggedPart.id, draggedPoint, targetPoint, snapType);
      const priorityBias = snapType === "vertex-to-vertex" ? 0.35 : 0;
      considerCandidate(result, dist, key, priorityBias);
    }
  }
}

interface CenterCandidateArgs {
  draggedPart: NestingPart;
  draggedSnapPoints: SnapPoint[];
  allDraggedSnapPoints: SnapPoint[];
  excludePartIds: string[];
  partsById: Map<string, NestingPart>;
  snapPointsMap: Map<string, SnapPoint[]>;
  contourModeCache: Map<string, "inner" | "outer">;
  snapTolerance: number;
  considerCandidate: ConsiderCandidate;
}

export function collectCenterAlignmentCandidates({
  draggedPart,
  draggedSnapPoints,
  allDraggedSnapPoints,
  excludePartIds,
  partsById,
  snapPointsMap,
  contourModeCache,
  snapTolerance,
  considerCandidate,
}: CenterCandidateArgs): void {
  const draggedCenter =
    draggedSnapPoints.find((p) => p.type === "center") ??
    allDraggedSnapPoints.find((p) => p.type === "center");
  if (!draggedCenter) return;

  for (const [partId, targetPart] of partsById.entries()) {
    if (partId === draggedPart.id || excludePartIds.includes(partId)) {
      continue;
    }

    const partPoints = snapPointsMap.get(partId);
    if (!partPoints) continue;
    const targetPoint = partPoints.find((point) => point.type === "center");
    if (!targetPoint || targetPoint.type !== "center") continue;

    const contourMode =
      contourModeCache.get(partId) ??
      resolveTargetContourMode(
        draggedPart as unknown as PartForEdgeDetection,
        targetPart as unknown as PartForEdgeDetection,
      );
    contourModeCache.set(partId, contourMode);

    if (
      Math.abs(draggedCenter.position.y - targetPoint.position.y) <=
      snapTolerance + SNAP_RELEASE_EXTRA
    ) {
      const dist = Math.abs(draggedCenter.position.y - targetPoint.position.y);
      const result: SnapResult = {
        snapped: true,
        snapPosition: {
          x: draggedPart.position.x,
          y: draggedPart.position.y + (targetPoint.position.y - draggedCenter.position.y),
        },
        snapPoint: draggedCenter,
        targetPoint,
        snapType: "horizontal-center",
      };
      const key = buildSnapKey(draggedPart.id, draggedCenter, targetPoint, "horizontal-center");
      considerCandidate(result, dist, key, 0.05, "y");
    }

    if (
      Math.abs(draggedCenter.position.x - targetPoint.position.x) <=
      snapTolerance + SNAP_RELEASE_EXTRA
    ) {
      const dist = Math.abs(draggedCenter.position.x - targetPoint.position.x);
      const result: SnapResult = {
        snapped: true,
        snapPosition: {
          x: draggedPart.position.x + (targetPoint.position.x - draggedCenter.position.x),
          y: draggedPart.position.y,
        },
        snapPoint: draggedCenter,
        targetPoint,
        snapType: "vertical-center",
      };
      const key = buildSnapKey(draggedPart.id, draggedCenter, targetPoint, "vertical-center");
      considerCandidate(result, dist, key, 0.05, "x");
    }
  }
}
