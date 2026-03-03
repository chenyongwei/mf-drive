import { resolveCollisionMultiDirection, type PartShape } from "../utils/CollisionResolver";
import type { Point } from "../types/NestingTypes";
import type { DragEndArgs } from "./usePartNesting.drag.end.types";
import {
  evaluateDragPosition,
  isBoundaryInterference,
} from "./usePartNesting.drag.end.validation";
import type { DragPreview } from "./usePartNesting.types";

function resetDragState(
  args: DragEndArgs,
  options?: { clearPreview?: boolean },
): void {
  const clearPreview = options?.clearPreview ?? true;
  args.setDraggingPartId(null);
  args.setDragStartPosition(null);
  args.setDragOffset({ x: 0, y: 0 });
  args.setCurrentSnap(null);
  if (clearPreview) {
    args.setDragPreview(null);
  }
  args.lastValidDragPositionRef.current = null;
}

export function handleDragEnd(args: DragEndArgs): void {
  const {
    draggingPartId,
    dragPreview,
    parts,
    partSpacing,
    checkCollision,
    checkSpacingInterference,
    classifyPlacementBoundary,
    clampPositionToPlateBounds,
    checkMarginInterference,
    resolveNearestValidPosition,
    findPlateForPart,
    stickToEdge,
    updateParts,
    lastValidDragPositionRef,
    originalPositionRef,
  } = args;

  if (!draggingPartId || !dragPreview) {
    resetDragState(args);
    return;
  }

  const part = parts.find((p) => p.id === draggingPartId);
  if (!part) {
    resetDragState(args);
    return;
  }

  let finalPosition = dragPreview.position;
  let boundary = classifyPlacementBoundary(part, finalPosition, 0.01);

  if (
    boundary.state === "inside_forbidden_band" &&
    !stickToEdge &&
    boundary.targetPlate
  ) {
    // Keep deterministic behavior: forbidden margin band always resolves inward first.
    finalPosition = clampPositionToPlateBounds(
      part,
      finalPosition,
      boundary.targetPlate,
      "inner",
    );
    boundary = classifyPlacementBoundary(part, finalPosition, 0.01);
  } else if (boundary.state === "cross_boundary" && boundary.targetPlate) {
    finalPosition = clampPositionToPlateBounds(
      part,
      finalPosition,
      boundary.targetPlate,
      stickToEdge ? "outer" : "inner",
    );
    boundary = classifyPlacementBoundary(part, finalPosition, 0.01);
  }

  let validation = evaluateDragPosition({
    draggingPartId,
    part,
    position: finalPosition,
    rotation: part.rotation,
    checkCollision,
    checkSpacingInterference,
    classifyPlacementBoundary,
    checkMarginInterference,
  });
  let fallbackPosition: Point | null = null;

  if (validation.invalid && lastValidDragPositionRef.current) {
    const candidateFallbackPosition = { ...lastValidDragPositionRef.current };
    const fallbackValidation = evaluateDragPosition({
      draggingPartId,
      part,
      position: candidateFallbackPosition,
      rotation: part.rotation,
      checkCollision,
      checkSpacingInterference,
      classifyPlacementBoundary,
      checkMarginInterference,
    });
    if (!fallbackValidation.invalid) {
      fallbackPosition = candidateFallbackPosition;
    }
  }

  if (validation.invalid) {
    const nearestResolvedPosition = resolveNearestValidPosition(
      draggingPartId,
      part,
      finalPosition,
      part.rotation,
    );
    if (nearestResolvedPosition) {
      const resolvedValidation = evaluateDragPosition({
        draggingPartId,
        part,
        position: nearestResolvedPosition,
        rotation: part.rotation,
        checkCollision,
        checkSpacingInterference,
        classifyPlacementBoundary,
        checkMarginInterference,
      });
      if (!resolvedValidation.invalid) {
        finalPosition = nearestResolvedPosition;
        boundary = resolvedValidation.boundary;
        validation = resolvedValidation;
      } else if (fallbackPosition) {
        finalPosition = fallbackPosition;
        validation = evaluateDragPosition({
          draggingPartId,
          part,
          position: finalPosition,
          rotation: part.rotation,
          checkCollision,
          checkSpacingInterference,
          classifyPlacementBoundary,
          checkMarginInterference,
        });
        boundary = validation.boundary;
      } else {
        resetDragState(args);
        return;
      }
    } else {
      const partShape: PartShape = {
        id: part.id,
        position: finalPosition,
        rotation: part.rotation,
        boundingBox: part.boundingBox,
      };

      const otherShapes: PartShape[] = parts
        .filter((p) => p.id !== draggingPartId)
        .map((p) => ({
          id: p.id,
          position: p.position,
          rotation: p.rotation,
          boundingBox: p.boundingBox,
        }));

      const resolveResult = resolveCollisionMultiDirection(
        partShape,
        finalPosition,
        otherShapes,
        partSpacing,
      );

      if (
        resolveResult.resolved &&
        Number.isFinite(resolveResult.finalPosition.x) &&
        Number.isFinite(resolveResult.finalPosition.y)
      ) {
        const resolvedPosition = resolveResult.finalPosition;
        const resolvedValidation = evaluateDragPosition({
          draggingPartId,
          part,
          position: resolvedPosition,
          rotation: part.rotation,
          checkCollision,
          checkSpacingInterference,
          classifyPlacementBoundary,
          checkMarginInterference,
        });

        if (!resolvedValidation.invalid) {
          finalPosition = resolvedPosition;
          boundary = resolvedValidation.boundary;
          validation = resolvedValidation;
        } else if (fallbackPosition) {
          finalPosition = fallbackPosition;
          validation = evaluateDragPosition({
            draggingPartId,
            part,
            position: finalPosition,
            rotation: part.rotation,
            checkCollision,
            checkSpacingInterference,
            classifyPlacementBoundary,
            checkMarginInterference,
          });
          boundary = validation.boundary;
        } else {
          resetDragState(args);
          return;
        }
      } else if (fallbackPosition) {
        finalPosition = fallbackPosition;
        validation = evaluateDragPosition({
          draggingPartId,
          part,
          position: finalPosition,
          rotation: part.rotation,
          checkCollision,
          checkSpacingInterference,
          classifyPlacementBoundary,
          checkMarginInterference,
        });
        boundary = validation.boundary;
      } else {
        resetDragState(args);
        return;
      }
    }
  }

  const finalBoundary = validation.boundary;
  if (isBoundaryInterference(finalBoundary.state)) {
    if (fallbackPosition) {
      const fallbackBoundary = classifyPlacementBoundary(part, fallbackPosition, 0.01);
      if (!isBoundaryInterference(fallbackBoundary.state)) {
        finalPosition = fallbackPosition;
      } else {
        resetDragState(args);
        return;
      }
    } else {
      resetDragState(args);
      return;
    }
  }

  if (!Number.isFinite(finalPosition.x) || !Number.isFinite(finalPosition.y)) {
    finalPosition = originalPositionRef.current;
  }

  const targetPlate = findPlateForPart(
    { ...part, position: finalPosition },
    finalPosition,
  );
  const nextPlacedPart: NestingPart = {
    ...part,
    position: finalPosition,
    plateId: targetPlate ? targetPlate.id : null,
    status: targetPlate ? "placed" : "unplaced",
  };
  const committedPreview: DragPreview = {
    ...dragPreview,
    position: finalPosition,
    isValid: true,
    hasCollision: false,
    hasSpacingInterference: false,
    hasBoundaryInterference: false,
    hasMarginInterference: false,
    boundaryState: targetPlate ? "inside_placeable" : "outside_plate",
    boundaryReason: targetPlate ? "none" : "outside_plate",
    targetPlateId: targetPlate ? targetPlate.id : null,
    snapResult: null,
  };

  updateParts(parts.map((p) => (p.id === draggingPartId ? nextPlacedPart : p)));
  args.setDragPreview(committedPreview);
  resetDragState(args, { clearPreview: false });
}
