import type { Point } from '../../../../lib/webgpu/CollisionDetectionEngine';

import {
  bboxOverlap,
  calculateNudgeDirection,
  getExpandedBBox,
  getWorldBBox,
  tryNudgeInDirection,
} from './geometry';
import { RESOLVE_EPSILON, type PartShape, type ResolveResult } from './types';

export function resolveCollision(
  part: PartShape,
  targetPosition: Point,
  otherParts: PartShape[],
  spacing: number = 0,
  maxIterations: number = 20
): ResolveResult {
  const partBBox = getWorldBBox(part, targetPosition);

  const collidingParts = otherParts.filter((other) => {
    if (other.id === part.id) return false;
    const expandedOther = getExpandedBBox(other, spacing);
    return bboxOverlap(partBBox, expandedOther);
  });

  if (collidingParts.length === 0) {
    return { resolved: true, finalPosition: targetPosition };
  }

  let totalDx = 0;
  let totalDy = 0;
  for (const other of collidingParts) {
    const otherBBox = getWorldBBox(other, other.position);
    const dir = calculateNudgeDirection(partBBox, otherBBox);
    totalDx += dir.x;
    totalDy += dir.y;
  }

  const totalLength = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
  if (totalLength < RESOLVE_EPSILON) {
    return { resolved: false, finalPosition: targetPosition };
  }

  const nudgeDir = { x: totalDx / totalLength, y: totalDy / totalLength };
  return tryNudgeInDirection(
    part,
    targetPosition,
    otherParts,
    nudgeDir,
    spacing,
    Math.max(8, maxIterations * 2)
  );
}

export function resolveCollisionMultiDirection(
  part: PartShape,
  targetPosition: Point,
  otherParts: PartShape[],
  spacing: number = 0
): ResolveResult {
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
  ];

  const sqrt2 = Math.sqrt(2);
  for (let i = 4; i < 8; i += 1) {
    directions[i].x /= sqrt2;
    directions[i].y /= sqrt2;
  }

  let bestResult: ResolveResult | null = null;
  let bestDistance = Infinity;

  for (const dir of directions) {
    const result = tryNudgeInDirection(part, targetPosition, otherParts, dir, spacing);
    if (result.resolved && result.nudgeDistance !== undefined) {
      if (result.nudgeDistance < bestDistance) {
        bestDistance = result.nudgeDistance;
        bestResult = result;
      }
    }
  }

  if (bestResult) {
    return bestResult;
  }

  return resolveCollision(part, targetPosition, otherParts, spacing);
}
