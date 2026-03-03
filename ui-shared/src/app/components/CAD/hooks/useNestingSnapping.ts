/**
 * Nesting Snapping Hook
 *
 * Provides smart snapping for manual part placement:
 * - Edge-to-edge snapping
 * - Corner-to-corner snapping
 * - Center-to-center alignment (horizontal/vertical)
 * - Configurable snap tolerance
 * - Spatial indexing for O(n) snap detection
 */

import { useCallback, useMemo, useRef } from "react";
import type { NestingPart } from "../types/NestingTypes";
import { SpatialIndex } from "../utils/SpatialIndex";
import { isOuterContourSnapPoint } from "./useNestingSnapping.math";
import { extractSnapPoints } from "./useNestingSnapping.points";
import { collectParallelEdgeCandidates } from "./useNestingSnapping.findSnap.parallel";
import {
  collectCenterAlignmentCandidates,
  collectPointSnapCandidates,
} from "./useNestingSnapping.findSnap.primary";
import { collectPlateCandidates } from "./useNestingSnapping.findSnap.plate";
import { resolveBestSnapOption } from "./useNestingSnapping.findSnap.resolve";
import {
  SNAP_RELEASE_EXTRA,
  SNAP_STICKY_BIAS,
  type CandidateBuckets,
  type SnapCandidate,
  type SnapResult,
  type UseNestingSnappingOptions,
} from "./useNestingSnapping.types";

export type {
  SnapPoint,
  SnapResult,
  SnapType,
  UseNestingSnappingOptions,
} from "./useNestingSnapping.types";
export { extractSnapPoints } from "./useNestingSnapping.points";

export const useNestingSnapping = (options: UseNestingSnappingOptions) => {
  const {
    enabled = true,
    snapTolerance = 15,
    snapToEdges = true,
    snapToCorners = true,
    snapToCenters = true,
    snapToSheets = true,
    partSpacing = 0,
    allParts = [],
    plates = [],
  } = options;

  const partsById = useMemo(
    () => new Map(allParts.map((part) => [part.id, part])),
    [allParts],
  );

  const snapPointIndexRef = useRef<SpatialIndex | null>(null);
  const snapPointsMapRef = useRef<Map<string, ReturnType<typeof extractSnapPoints>>>(
    new Map(),
  );
  const stickySnapRef = useRef<StickySnapState | null>(null);

  useMemo(() => {
    if (!enabled) {
      snapPointIndexRef.current = null;
      snapPointsMapRef.current.clear();
      stickySnapRef.current = null;
      return;
    }

    const queryRange = snapTolerance + Math.max(0, partSpacing);
    const index = new SpatialIndex(queryRange * 2);
    const snapPointsMap = new Map<string, ReturnType<typeof extractSnapPoints>>();

    for (const part of allParts) {
      const partPoints = extractSnapPoints(part);
      snapPointsMap.set(part.id, partPoints);

      for (let i = 0; i < partPoints.length; i += 1) {
        const point = partPoints[i];
        const pointId = `${part.id}_${i}`;
        index.insert(
          pointId,
          point.position.x - queryRange,
          point.position.y - queryRange,
          point.position.x + queryRange,
          point.position.y + queryRange,
        );
      }
    }

    snapPointIndexRef.current = index;
    snapPointsMapRef.current = snapPointsMap;
  }, [allParts, snapTolerance, partSpacing, enabled]);

  const findSnap = useCallback(
    (
      draggedPart: NestingPart,
      excludePartIds: string[] = [],
      targetPlateId?: string | null,
    ): SnapResult => {
      const spatialIndex = snapPointIndexRef.current;
      if (!enabled || !spatialIndex) {
        stickySnapRef.current = null;
        return {
          snapped: false,
          snapPosition: draggedPart.position,
          snapPoint: null,
          targetPoint: null,
          snapType: null,
        };
      }

      const allDraggedSnapPoints = extractSnapPoints(draggedPart);
      const outerDraggedSnapPoints = allDraggedSnapPoints.filter(isOuterContourSnapPoint);
      const draggedSnapPoints =
        outerDraggedSnapPoints.length > 0 ? outerDraggedSnapPoints : allDraggedSnapPoints;

      const contourModeCache = new Map<string, "inner" | "outer">();
      const activeSticky =
        stickySnapRef.current?.draggedPartId === draggedPart.id
          ? stickySnapRef.current
          : null;

      const buckets: CandidateBuckets = {
        bestXCandidate: null,
        bestYCandidate: null,
        bestBothCandidate: null,
      };
      const shouldScopeByPlate = targetPlateId !== undefined;
      const normalizedTargetPlateId = targetPlateId ?? null;
      const effectiveExcludePartIds = new Set(excludePartIds);
      if (shouldScopeByPlate) {
        for (const [partId, part] of partsById.entries()) {
          if (partId === draggedPart.id) continue;
          const candidatePlateId = part.plateId ?? null;
          if (candidatePlateId !== normalizedTargetPlateId) {
            effectiveExcludePartIds.add(partId);
          }
        }
      }
      const scopedExcludePartIds = Array.from(effectiveExcludePartIds);

      const considerCandidate = (
        result: SnapResult,
        distanceMetric: number,
        key: string,
        priorityBias: number = 0,
        axisHint?: "x" | "y" | "both",
      ) => {
        if (!Number.isFinite(distanceMetric)) {
          return;
        }

        const deltaX = result.snapPosition.x - draggedPart.position.x;
        const deltaY = result.snapPosition.y - draggedPart.position.y;
        const hasXDelta = Math.abs(deltaX) > 1e-6;
        const hasYDelta = Math.abs(deltaY) > 1e-6;
        const axisMode: "x" | "y" | "both" =
          axisHint ??
          (hasXDelta && hasYDelta ? "both" : hasXDelta ? "x" : hasYDelta ? "y" : "both");

        const stickyMatch =
          axisMode === "x"
            ? activeSticky?.keyX === key
            : axisMode === "y"
              ? activeSticky?.keyY === key
              : activeSticky?.keyBoth === key ||
                (activeSticky?.keyX === key && activeSticky?.keyY === key);
        const isCenterSnap = (result.snapType ?? "").includes("center");
        const stickyRelease = stickyMatch
          ? isCenterSnap
            ? Math.max(1, SNAP_RELEASE_EXTRA * 0.35)
            : SNAP_RELEASE_EXTRA
          : 0;
        const stickyBias = stickyMatch
          ? isCenterSnap
            ? SNAP_STICKY_BIAS * 0.35
            : SNAP_STICKY_BIAS
          : 0;
        const allowedDistance = snapTolerance + stickyRelease;
        if (distanceMetric > allowedDistance) {
          return;
        }

        const score = Math.max(0, distanceMetric - stickyBias - priorityBias);
        const candidate: SnapCandidate = {
          result,
          score,
          key,
          axisMode,
          deltaX,
          deltaY,
        };

        if (axisMode === "x") {
          if (!buckets.bestXCandidate || score < buckets.bestXCandidate.score) {
            buckets.bestXCandidate = candidate;
          }
          return;
        }

        if (axisMode === "y") {
          if (!buckets.bestYCandidate || score < buckets.bestYCandidate.score) {
            buckets.bestYCandidate = candidate;
          }
          return;
        }

        if (!buckets.bestBothCandidate || score < buckets.bestBothCandidate.score) {
          buckets.bestBothCandidate = candidate;
        }
      };

      collectPointSnapCandidates({
        draggedPart,
        draggedSnapPoints,
        excludePartIds: scopedExcludePartIds,
        partsById,
        snapPointsMap: snapPointsMapRef.current,
        nearbyPointQuery: (x, y) => spatialIndex.query(x, y),
        snapToEdges,
        snapToCorners,
        snapToCenters,
        partSpacing,
        contourModeCache,
        considerCandidate,
      });

      if (snapToCenters) {
        collectCenterAlignmentCandidates({
          draggedPart,
          draggedSnapPoints,
          allDraggedSnapPoints,
          excludePartIds: scopedExcludePartIds,
          partsById,
          snapPointsMap: snapPointsMapRef.current,
          contourModeCache,
          snapTolerance,
          considerCandidate,
        });
      }

      if (snapToEdges) {
        collectParallelEdgeCandidates({
          draggedPart,
          excludePartIds: scopedExcludePartIds,
          partsById,
          snapTolerance,
          partSpacing,
          considerCandidate,
        });
      }

      const scopedPlates =
        !shouldScopeByPlate
          ? plates
          : normalizedTargetPlateId === null
            ? []
            : plates.filter((plate) => plate.id === normalizedTargetPlateId);

      if (snapToSheets && scopedPlates.length > 0) {
        collectPlateCandidates({
          draggedPart,
          draggedSnapPoints,
          plates: scopedPlates,
          considerCandidate,
        });
      }

      const resolved = resolveBestSnapOption({
        draggedPartId: draggedPart.id,
        draggedPartPosition: draggedPart.position,
        buckets,
      });
      stickySnapRef.current = resolved.sticky;
      return resolved.result;
    },
    [
      enabled,
      snapTolerance,
      snapToEdges,
      snapToCorners,
      snapToCenters,
      snapToSheets,
      plates,
      partSpacing,
      partsById,
    ],
  );

  return {
    findSnap,
    snapTolerance,
    enabled,
  };
};
