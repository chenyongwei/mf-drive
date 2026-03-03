import type { MutableRefObject } from "react";
import type { NestingPart, Point } from "../types/NestingTypes";
import type { DragPreview } from "./usePartNesting.types";
import type { SnapResult } from "./useNestingSnapping";
import type { DragValidationDeps } from "./usePartNesting.drag.validation-shared";

interface DragUpdateArgs extends DragValidationDeps {
  draggingPartId: string | null;
  parts: NestingPart[];
  penetrationMode: boolean;
  newPosition: Point;
  isPenetrationMode: boolean;
  snapping: {
    findSnap: (
      part: NestingPart,
      excludePartIds?: string[],
      targetPlateId?: string | null,
    ) => SnapResult;
  };
  checkFastCollision: (partId: string, newPosition: Point, rotation: number) => boolean;
  setCurrentSnap: (value: SnapResult | null) => void;
  setDragPreview: (value: DragPreview | null) => void;
  currentPositionRef: MutableRefObject<Point>;
  lastValidDragPositionRef: MutableRefObject<Point | null>;
}

export function performDragUpdate({
  draggingPartId,
  parts,
  penetrationMode,
  newPosition,
  isPenetrationMode,
  snapping,
  checkFastCollision,
  checkCollision,
  checkSpacingInterference,
  classifyPlacementBoundary,
  checkMarginInterference,
  setCurrentSnap,
  setDragPreview,
  currentPositionRef,
  lastValidDragPositionRef,
}: DragUpdateArgs): void {
  if (!draggingPartId) {
    return;
  }

  const part = parts.find((p) => p.id === draggingPartId);
  if (!part) {
    return;
  }

  let finalPosition = { ...newPosition };
  let snapResult: SnapResult | null = null;
  let isValid = true;
  let hasCollision = false;
  let hasSpacingInterference = false;
  let hasBoundaryInterference = false;
  let hasMarginInterference = false;
  let boundaryClassification = classifyPlacementBoundary(part, finalPosition, 0);

  const effectivePenetrationMode = isPenetrationMode || penetrationMode;

  if (!effectivePenetrationMode) {
    const tempPart = { ...part, position: newPosition };
    const snapCandidate = snapping.findSnap(
      tempPart,
      [draggingPartId],
      boundaryClassification.targetPlate?.id ?? null,
    );

    if (snapCandidate.snapped) {
      const candidates = [snapCandidate, ...(snapCandidate.alternatives ?? [])];
      let acceptedSnap: SnapResult | null = null;
      for (const candidate of candidates) {
        const snapBoundary = classifyPlacementBoundary(
          part,
          candidate.snapPosition,
          0,
        );
        const snapHasBoundaryInterference =
          snapBoundary.state === "inside_forbidden_band" ||
          snapBoundary.state === "cross_boundary";
        const snapHasCollision =
          checkCollision(
            draggingPartId,
            candidate.snapPosition,
            part.rotation,
            false,
          ) || snapHasBoundaryInterference;
        const snapHasSpacingInterference = checkSpacingInterference(
          draggingPartId,
          candidate.snapPosition,
          part.rotation,
        );
        const snapHasMarginInterference = checkMarginInterference(
          part,
          candidate.snapPosition,
          0,
        );
        const snapIsValid =
          !snapHasCollision &&
          !snapHasSpacingInterference &&
          !snapHasBoundaryInterference &&
          !snapHasMarginInterference;
        if (snapIsValid) {
          acceptedSnap = candidate;
          break;
        }
      }

      if (acceptedSnap) {
        snapResult = acceptedSnap;
        finalPosition = acceptedSnap.snapPosition;
        setCurrentSnap(acceptedSnap);
      } else {
        setCurrentSnap(null);
      }
    } else {
      setCurrentSnap(null);
    }

    boundaryClassification = classifyPlacementBoundary(part, finalPosition, 0);
    hasBoundaryInterference =
      boundaryClassification.state === "inside_forbidden_band" ||
      boundaryClassification.state === "cross_boundary";
    hasCollision =
      checkFastCollision(draggingPartId, finalPosition, part.rotation) ||
      hasBoundaryInterference;
    hasSpacingInterference = checkSpacingInterference(
      draggingPartId,
      finalPosition,
      part.rotation,
    );
    hasMarginInterference =
      hasBoundaryInterference || checkMarginInterference(part, finalPosition, 0);

    isValid =
      !hasCollision &&
      !hasBoundaryInterference &&
      !hasMarginInterference &&
      !hasSpacingInterference;
    if (isValid) {
      lastValidDragPositionRef.current = { ...finalPosition };
    }
  } else {
    setCurrentSnap(null);
    boundaryClassification = classifyPlacementBoundary(part, finalPosition, 0);
  }

  setDragPreview({
    partId: draggingPartId,
    position: finalPosition,
    isValid,
    hasCollision,
    hasSpacingInterference,
    hasBoundaryInterference,
    hasMarginInterference,
    boundaryState: boundaryClassification.state,
    boundaryReason: boundaryClassification.reason,
    targetPlateId: boundaryClassification.targetPlate?.id ?? null,
    snapResult,
  });

  currentPositionRef.current = finalPosition;
}
