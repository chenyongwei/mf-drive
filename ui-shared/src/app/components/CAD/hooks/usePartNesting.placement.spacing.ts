import type { BoundingBox, NestingPart, Point } from "../types/NestingTypes";
import {
  findClosestContourConnection,
  type PartForEdgeDetection,
} from "../utils/ParallelEdgeDetection";
import { boundingBoxesOverlap, toWorldBoundingBox } from "./usePartNesting.placement.bounds";
import { SPACING_EPSILON } from "./usePartNesting.types";

interface CheckSpacingInterferenceArgs {
  parts: NestingPart[];
  partSpacing: number;
  partId: string;
  newPosition: Point;
  rotation: number;
}

function toPartEdgeView(
  part: NestingPart,
  position: Point,
  rotation: number,
): PartForEdgeDetection {
  return {
    id: part.id,
    position,
    rotation,
    boundingBox: part.boundingBox,
    mirroredX: part.mirroredX,
    mirroredY: part.mirroredY,
    entities: part.entities,
  };
}

export function checkSpacingInterferenceForPart({
  parts,
  partSpacing,
  partId,
  newPosition,
  rotation,
}: CheckSpacingInterferenceArgs): boolean {
  const requiredSpacing = Math.max(0, partSpacing);
  if (requiredSpacing <= SPACING_EPSILON) {
    return false;
  }

  const part = parts.find((candidate) => candidate.id === partId);
  if (!part) {
    return false;
  }

  const movingPartView = toPartEdgeView(part, newPosition, rotation);
  const movingBBox = toWorldBoundingBox(part.boundingBox, newPosition, {
    rotation,
    mirroredX: part.mirroredX,
    mirroredY: part.mirroredY,
  });

  for (const other of parts) {
    if (other.id === partId) continue;

    const otherPartView = toPartEdgeView(other, other.position, other.rotation);
    const otherWorldBBox = toWorldBoundingBox(other.boundingBox, other.position, {
      rotation: other.rotation,
      mirroredX: other.mirroredX,
      mirroredY: other.mirroredY,
    });
    const expandedOtherBBox: BoundingBox = {
      minX: otherWorldBBox.minX - requiredSpacing,
      minY: otherWorldBBox.minY - requiredSpacing,
      maxX: otherWorldBBox.maxX + requiredSpacing,
      maxY: otherWorldBBox.maxY + requiredSpacing,
    };

    if (!boundingBoxesOverlap(movingBBox, expandedOtherBBox)) {
      continue;
    }

    const closestConnection = findClosestContourConnection(
      movingPartView,
      otherPartView,
      requiredSpacing + SPACING_EPSILON,
    );
    if (!closestConnection) {
      continue;
    }
    if (closestConnection.distance + SPACING_EPSILON < requiredSpacing) {
      return true;
    }
  }

  return false;
}
