import type { NestingPart, Point } from "../types/NestingTypes";
import type { PlacementBoundaryClassification } from "./usePartNesting.placement";
import type { DragValidationDeps } from "./usePartNesting.drag.validation-shared";

interface EvaluateDragPositionArgs extends DragValidationDeps {
  draggingPartId: string;
  part: NestingPart;
  position: Point;
  rotation: number;
  tolerance?: number;
}

interface DragPositionValidation {
  boundary: PlacementBoundaryClassification;
  hasCollision: boolean;
  hasSpacingInterference: boolean;
  hasBoundaryInterference: boolean;
  hasMarginInterference: boolean;
  invalid: boolean;
}

export function isBoundaryInterference(
  state: PlacementBoundaryClassification["state"],
): boolean {
  return state === "inside_forbidden_band" || state === "cross_boundary";
}

export function evaluateDragPosition({
  draggingPartId,
  part,
  position,
  rotation,
  checkCollision,
  checkSpacingInterference,
  classifyPlacementBoundary,
  checkMarginInterference,
  tolerance = 0.01,
}: EvaluateDragPositionArgs): DragPositionValidation {
  const boundary = classifyPlacementBoundary(part, position, tolerance);
  const hasCollision = checkCollision(draggingPartId, position, rotation, false);
  const hasSpacingInterference = checkSpacingInterference(
    draggingPartId,
    position,
    rotation,
  );
  const hasBoundaryInterference = isBoundaryInterference(boundary.state);
  const hasMarginInterference =
    hasBoundaryInterference ||
    checkMarginInterference(part, position, tolerance);

  return {
    boundary,
    hasCollision,
    hasSpacingInterference,
    hasBoundaryInterference,
    hasMarginInterference,
    invalid:
      hasCollision ||
      hasSpacingInterference ||
      hasBoundaryInterference ||
      hasMarginInterference,
  };
}
