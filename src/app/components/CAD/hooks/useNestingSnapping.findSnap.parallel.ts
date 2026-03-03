import type { NestingPart } from "../types/NestingTypes";
import {
  findParallelEdges,
  type PartForEdgeDetection,
} from "../utils/ParallelEdgeDetection";
import {
  buildSnapKey,
  getPartWorldCenter,
  normalizeVector,
} from "./useNestingSnapping.math";
import { SNAP_RELEASE_EXTRA, type SnapPoint, type SnapResult } from "./useNestingSnapping.types";
import type { ConsiderCandidate } from "./useNestingSnapping.findSnap.primary";

interface ParallelEdgeArgs {
  draggedPart: NestingPart;
  excludePartIds: string[];
  partsById: Map<string, NestingPart>;
  snapTolerance: number;
  partSpacing: number;
  considerCandidate: ConsiderCandidate;
}

export function collectParallelEdgeCandidates({
  draggedPart,
  excludePartIds,
  partsById,
  snapTolerance,
  partSpacing,
  considerCandidate,
}: ParallelEdgeArgs): void {
  const draggedPartView = draggedPart as unknown as PartForEdgeDetection;
  const candidateTargets = Array.from(partsById.values()).filter(
    (part) => part.id !== draggedPart.id && !excludePartIds.includes(part.id),
  ) as unknown as PartForEdgeDetection[];

  const parallelPairs = findParallelEdges(
    draggedPartView,
    candidateTargets,
    snapTolerance + Math.max(0, partSpacing) + SNAP_RELEASE_EXTRA,
    { limit: 16 },
  );

  const draggedCenter = getPartWorldCenter(draggedPart);
  for (const pair of parallelPairs) {
    if (pair.edge2.partId === draggedPart.id || excludePartIds.includes(pair.edge2.partId)) {
      continue;
    }

    const targetPart = partsById.get(pair.edge2.partId);
    if (!targetPart) continue;

    const requiredGap = Math.max(0, partSpacing);
    const gapDelta = requiredGap - pair.distance;
    const distanceMetric = Math.abs(gapDelta);
    if (distanceMetric > snapTolerance + SNAP_RELEASE_EXTRA) continue;

    const edgeDx = pair.edge2.end.x - pair.edge2.start.x;
    const edgeDy = pair.edge2.end.y - pair.edge2.start.y;
    const edgeLen = Math.hypot(edgeDx, edgeDy);
    if (edgeLen <= 1e-6) continue;

    const baseNormal = { x: -edgeDy / edgeLen, y: edgeDx / edgeLen };
    const targetCenter = getPartWorldCenter(targetPart);
    const radialDirection = normalizeVector({
      x: draggedCenter.x - targetCenter.x,
      y: draggedCenter.y - targetCenter.y,
    });
    const orientedNormal =
      radialDirection && baseNormal.x * radialDirection.x + baseNormal.y * radialDirection.y < 0
        ? { x: -baseNormal.x, y: -baseNormal.y }
        : baseNormal;

    const snapPosition = {
      x: draggedPart.position.x + orientedNormal.x * gapDelta,
      y: draggedPart.position.y + orientedNormal.y * gapDelta,
    };

    const sourceMidpoint = {
      x: (pair.edge1.start.x + pair.edge1.end.x) / 2,
      y: (pair.edge1.start.y + pair.edge1.end.y) / 2,
    };
    const targetMidpoint = {
      x: (pair.edge2.start.x + pair.edge2.end.x) / 2,
      y: (pair.edge2.start.y + pair.edge2.end.y) / 2,
    };
    const snapPoint: SnapPoint = {
      type: "edge",
      partId: draggedPart.id,
      position: sourceMidpoint,
      edgeDirection: { x: edgeDx / edgeLen, y: edgeDy / edgeLen },
      edgeStart: pair.edge1.start,
      edgeEnd: pair.edge1.end,
      isInnerContour: Boolean(pair.edge1.isInnerContour),
    };
    const targetPoint: SnapPoint = {
      type: "edge",
      partId: pair.edge2.partId,
      position: targetMidpoint,
      edgeDirection: { x: edgeDx / edgeLen, y: edgeDy / edgeLen },
      edgeStart: pair.edge2.start,
      edgeEnd: pair.edge2.end,
      isInnerContour: Boolean(pair.edge2.isInnerContour),
    };

    const result: SnapResult = {
      snapped: true,
      snapPosition,
      snapPoint,
      targetPoint,
      snapType: requiredGap > 0 ? "edge-gap-spacing" : "edge-gap-contact",
    };
    const key = buildSnapKey(
      draggedPart.id,
      snapPoint,
      targetPoint,
      result.snapType || "edge-gap",
    );
    considerCandidate(result, distanceMetric, key, 0.45);
  }
}
