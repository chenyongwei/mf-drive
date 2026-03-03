import type { NestingPart, Point } from "../types/NestingTypes";
import type { PlacementBoundaryClassification } from "./usePartNesting.placement";

export interface DragValidationDeps {
  checkCollision: (
    partId: string,
    newPosition: Point,
    rotation: number,
    useSimplified: boolean,
  ) => boolean;
  checkSpacingInterference: (
    partId: string,
    newPosition: Point,
    rotation: number,
  ) => boolean;
  classifyPlacementBoundary: (
    part: NestingPart,
    position: Point,
    tolerance?: number,
  ) => PlacementBoundaryClassification;
  checkMarginInterference: (
    part: NestingPart,
    position: Point,
    tolerance?: number,
  ) => boolean;
}
