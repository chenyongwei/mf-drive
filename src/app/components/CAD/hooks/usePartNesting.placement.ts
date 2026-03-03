import type { CollisionDetectionEngine } from "../../../lib/webgpu/CollisionDetectionEngine";
import type { NestingPart, Plate, Point } from "../types/NestingTypes";
import {
  boundingBoxFitsRect,
  boundingBoxOverlapsRect,
  clampAxis,
  isValidRect,
  overlapArea,
  toPlateZoneRect,
  toWorldBoundingBox,
  type PlacementZone,
} from "./usePartNesting.placement.bounds";
import {
  type PlacementBoundaryReason,
  type PlacementBoundaryState,
} from "./usePartNesting.types";
import { resolveNearestValidPosition as resolveNearestValidPositionImpl } from "./usePartNesting.resolve";
import { checkSpacingInterferenceForPart } from "./usePartNesting.placement.spacing";

interface PlacementHelpersArgs {
  parts: NestingPart[];
  plates: Plate[];
  collisionEngine?: CollisionDetectionEngine | null;
  partSpacing: number;
  stickToEdge: boolean;
}

export interface PlacementBoundaryClassification {
  state: PlacementBoundaryState;
  reason: PlacementBoundaryReason;
  targetPlate: Plate | null;
}

export interface PlacementHelpers {
  classifyPlacementBoundary: (
    part: NestingPart,
    position: Point,
    tolerance?: number,
  ) => PlacementBoundaryClassification;
  clampPositionToPlateBounds: (
    part: NestingPart,
    position: Point,
    plate: Plate,
    zone: PlacementZone,
  ) => Point;
  findPlateForPart: (part: NestingPart, position: Point) => Plate | null;
  checkCollision: (
    partId: string,
    newPosition: Point,
    rotation: number,
    useSimplified: boolean,
  ) => boolean;
  checkFastCollision: (partId: string, newPosition: Point, rotation: number) => boolean;
  checkSpacingInterference: (
    partId: string,
    newPosition: Point,
    rotation: number,
  ) => boolean;
  checkMarginInterference: (
    part: NestingPart,
    position: Point,
    tolerance?: number,
  ) => boolean;
  isPlacementLegal: (
    partId: string,
    part: NestingPart,
    position: Point,
    rotation: number,
  ) => boolean;
  resolveNearestValidPosition: (
    partId: string,
    part: NestingPart,
    startPosition: Point,
    rotation: number,
  ) => Point | null;
}

export function createPlacementHelpers({
  parts,
  plates,
  collisionEngine,
  partSpacing,
  stickToEdge,
}: PlacementHelpersArgs): PlacementHelpers {
  const toPartTransform = (part: NestingPart) => ({
    rotation: part.rotation,
    mirroredX: part.mirroredX,
    mirroredY: part.mirroredY,
  });

  const classifyPlacementBoundary = (
    part: NestingPart,
    position: Point,
    tolerance = 0,
  ): PlacementBoundaryClassification => {
    const worldBBox = toWorldBoundingBox(
      part.boundingBox,
      position,
      toPartTransform(part),
    );
    let bestState: PlacementBoundaryState | null = null;
    let bestPlate: Plate | null = null;
    let bestPriority = -1;
    let bestOverlap = -1;

    for (const plate of plates) {
      const outerRect = toPlateZoneRect(plate, "outer");
      if (!boundingBoxOverlapsRect(worldBBox, outerRect, tolerance)) {
        continue;
      }

      const fullyInsideOuter = boundingBoxFitsRect(worldBBox, outerRect, tolerance);
      let state: PlacementBoundaryState;

      if (fullyInsideOuter) {
        if (stickToEdge) {
          state = "inside_placeable";
        } else {
          const innerRect = toPlateZoneRect(plate, "inner");
          const insideInner =
            isValidRect(innerRect, tolerance) &&
            boundingBoxFitsRect(worldBBox, innerRect, tolerance);
          state = insideInner ? "inside_placeable" : "inside_forbidden_band";
        }
      } else {
        state = "cross_boundary";
      }

      const priority =
        state === "inside_placeable"
          ? 3
          : state === "inside_forbidden_band"
            ? 2
            : 1;
      const plateOverlap = overlapArea(worldBBox, outerRect);

      if (
        priority > bestPriority ||
        (priority === bestPriority && plateOverlap > bestOverlap)
      ) {
        bestPriority = priority;
        bestOverlap = plateOverlap;
        bestState = state;
        bestPlate = plate;
      }
    }

    if (!bestState) {
      return {
        state: "outside_plate",
        reason: "outside_plate",
        targetPlate: null,
      };
    }

    const reason: PlacementBoundaryReason =
      bestState === "inside_placeable" ? "none" : bestState;
    return {
      state: bestState,
      reason,
      targetPlate: bestPlate,
    };
  };

  const clampPositionToPlateBounds = (
    part: NestingPart,
    position: Point,
    plate: Plate,
    zone: PlacementZone,
  ): Point => {
    const targetRect = toPlateZoneRect(plate, zone);
    if (!isValidRect(targetRect)) {
      return position;
    }

    const transformedLocalBBox = toWorldBoundingBox(
      part.boundingBox,
      { x: 0, y: 0 },
      toPartTransform(part),
    );
    const minX = targetRect.xMin - transformedLocalBBox.minX;
    const maxX = targetRect.xMax - transformedLocalBBox.maxX;
    const minY = targetRect.yMin - transformedLocalBBox.minY;
    const maxY = targetRect.yMax - transformedLocalBBox.maxY;

    return {
      x: clampAxis(position.x, minX, maxX),
      y: clampAxis(position.y, minY, maxY),
    };
  };

  const findPlateForPart = (part: NestingPart, position: Point): Plate | null => {
    const boundary = classifyPlacementBoundary(part, position, 0.01);
    if (boundary.state !== "inside_placeable") {
      return null;
    }
    return boundary.targetPlate;
  };

  const checkCollision = (
    partId: string,
    newPosition: Point,
    rotation: number,
    useSimplified: boolean,
  ): boolean => {
    if (!collisionEngine) return false;

    try {
      const result = collisionEngine.checkPolygonCollision(
        partId,
        newPosition,
        (rotation * Math.PI) / 180,
        !useSimplified,
        [partId],
      );
      return result.hasCollision;
    } catch (error) {
      console.error("[usePartNesting] Collision check failed:", error);
      return false;
    }
  };

  const checkFastCollision = (
    partId: string,
    newPosition: Point,
    rotation: number,
  ): boolean => {
    if (!collisionEngine) return false;

    try {
      const rectResult = collisionEngine.checkRectangleCollision(partId, newPosition, [partId]);
      if (!rectResult.hasCollision) return false;

      const result = collisionEngine.checkPolygonCollision(
        partId,
        newPosition,
        (rotation * Math.PI) / 180,
        false,
        [partId],
      );
      return result.hasCollision;
    } catch (error) {
      console.error("[usePartNesting] Fast collision check failed:", error);
      return false;
    }
  };

  const checkSpacingInterference = (
    partId: string,
    newPosition: Point,
    rotation: number,
  ): boolean =>
    checkSpacingInterferenceForPart({
      parts,
      partSpacing,
      partId,
      newPosition,
      rotation,
    });

  const checkMarginInterference = (
    part: NestingPart,
    position: Point,
    tolerance: number = 0,
  ): boolean => {
    const boundary = classifyPlacementBoundary(part, position, tolerance);
    return (
      boundary.state === "inside_forbidden_band" ||
      boundary.state === "cross_boundary"
    );
  };

  const isPlacementLegal = (
    partId: string,
    part: NestingPart,
    position: Point,
    rotation: number,
  ): boolean => {
    if (checkCollision(partId, position, rotation, false)) return false;
    if (checkSpacingInterference(partId, position, rotation)) return false;
    return !checkMarginInterference(part, position, 0.01);
  };

  const resolveNearestValidPosition = (
    partId: string,
    part: NestingPart,
    startPosition: Point,
    rotation: number,
  ): Point | null =>
    resolveNearestValidPositionImpl({
      partId,
      part,
      startPosition,
      rotation,
      partSpacing,
      isPlacementLegal,
    });

  return {
    classifyPlacementBoundary,
    clampPositionToPlateBounds,
    findPlateForPart,
    checkCollision,
    checkFastCollision,
    checkSpacingInterference,
    checkMarginInterference,
    isPlacementLegal,
    resolveNearestValidPosition,
  };
}
