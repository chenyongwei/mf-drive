import type { NestingPart, Point } from "../types/NestingTypes";
import { DRAG_RESOLVE_DIRECTIONS, SPACING_EPSILON } from "./usePartNesting.types";

interface ResolveArgs {
  partId: string;
  part: NestingPart;
  startPosition: Point;
  rotation: number;
  partSpacing: number;
  isPlacementLegal: (
    partId: string,
    part: NestingPart,
    position: Point,
    rotation: number,
  ) => boolean;
}

export function resolveNearestValidPosition({
  partId,
  part,
  startPosition,
  rotation,
  partSpacing,
  isPlacementLegal,
}: ResolveArgs): Point | null {
  if (isPlacementLegal(partId, part, startPosition, rotation)) {
    return startPosition;
  }

  const partWidth = Math.max(1, part.boundingBox.maxX - part.boundingBox.minX);
  const partHeight = Math.max(1, part.boundingBox.maxY - part.boundingBox.minY);
  const baseStep = Math.max(
    1,
    Math.min(
      16,
      Math.max(0, partSpacing) > SPACING_EPSILON ? Math.max(1, partSpacing / 2) : 2,
    ),
  );
  const maxDistance = Math.max(partWidth, partHeight) * 4 + Math.max(0, partSpacing) * 4 + 80;
  let bestCandidate: { position: Point; distance: number } | null = null;

  for (const rawDirection of DRAG_RESOLVE_DIRECTIONS) {
    const directionLength = Math.hypot(rawDirection.x, rawDirection.y);
    if (directionLength <= SPACING_EPSILON) continue;
    const direction = {
      x: rawDirection.x / directionLength,
      y: rawDirection.y / directionLength,
    };

    let lowDistance = 0;
    let highDistance = baseStep;
    let foundValid = false;

    while (highDistance <= maxDistance + SPACING_EPSILON) {
      const probePosition = {
        x: startPosition.x + direction.x * highDistance,
        y: startPosition.y + direction.y * highDistance,
      };
      if (isPlacementLegal(partId, part, probePosition, rotation)) {
        foundValid = true;
        break;
      }
      lowDistance = highDistance;
      highDistance += baseStep;
    }

    if (!foundValid) continue;

    for (let i = 0; i < 12; i += 1) {
      const midDistance = (lowDistance + highDistance) / 2;
      const probePosition = {
        x: startPosition.x + direction.x * midDistance,
        y: startPosition.y + direction.y * midDistance,
      };
      if (isPlacementLegal(partId, part, probePosition, rotation)) {
        highDistance = midDistance;
      } else {
        lowDistance = midDistance;
      }
    }

    const candidate = {
      x: startPosition.x + direction.x * highDistance,
      y: startPosition.y + direction.y * highDistance,
    };
    const candidateDistance = Math.hypot(
      candidate.x - startPosition.x,
      candidate.y - startPosition.y,
    );

    if (!bestCandidate || candidateDistance + SPACING_EPSILON < bestCandidate.distance) {
      bestCandidate = {
        position: candidate,
        distance: candidateDistance,
      };
    }
  }

  return bestCandidate?.position ?? null;
}
