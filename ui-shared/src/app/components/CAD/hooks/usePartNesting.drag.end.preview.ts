import type { Point } from "../types/NestingTypes";
import type { DragPreview } from "./usePartNesting.types";

export function buildDragEndPreview(
  draggingPartId: string | null,
  pendingPosition: Point | null,
  dragPreview: DragPreview | null,
): DragPreview | null {
  if (!draggingPartId || !pendingPosition) {
    return dragPreview;
  }

  if (dragPreview) {
    return { ...dragPreview, position: { ...pendingPosition } };
  }

  return {
    partId: draggingPartId,
    position: { ...pendingPosition },
    isValid: true,
    hasCollision: false,
    hasSpacingInterference: false,
    hasBoundaryInterference: false,
    hasMarginInterference: false,
    boundaryState: "outside_plate" as const,
    boundaryReason: "none" as const,
    targetPlateId: null,
    snapResult: null,
  };
}
