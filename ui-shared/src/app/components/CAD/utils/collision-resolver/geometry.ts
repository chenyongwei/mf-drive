import type {
  BoundingBox,
  Point,
} from '../../../../lib/webgpu/CollisionDetectionEngine';

import {
  MAX_NUDGE_DISTANCE,
  RESOLVE_EPSILON,
  type PartShape,
  type ResolveResult,
} from './types';

export function calculateNudgeDirection(
  partBBox: BoundingBox,
  otherBBox: BoundingBox
): Point {
  const partCenterX = (partBBox.minX + partBBox.maxX) / 2;
  const partCenterY = (partBBox.minY + partBBox.maxY) / 2;
  const otherCenterX = (otherBBox.minX + otherBBox.maxX) / 2;
  const otherCenterY = (otherBBox.minY + otherBBox.maxY) / 2;

  const dx = partCenterX - otherCenterX;
  const dy = partCenterY - otherCenterY;

  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.001 || !Number.isFinite(length)) {
    return { x: 1, y: 0 };
  }

  return { x: dx / length, y: dy / length };
}

export function bboxOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
  return !(
    box1.maxX < box2.minX ||
    box1.minX > box2.maxX ||
    box1.maxY < box2.minY ||
    box1.minY > box2.maxY
  );
}

export function getWorldBBox(part: PartShape, position: Point): BoundingBox {
  return {
    minX: part.boundingBox.minX + position.x,
    minY: part.boundingBox.minY + position.y,
    maxX: part.boundingBox.maxX + position.x,
    maxY: part.boundingBox.maxY + position.y,
  };
}

export function getExpandedBBox(other: PartShape, spacing: number): BoundingBox {
  const otherBBox = getWorldBBox(other, other.position);
  const safeSpacing = Math.max(0, spacing);
  if (safeSpacing <= 0) {
    return otherBBox;
  }
  return {
    minX: otherBBox.minX - safeSpacing,
    minY: otherBBox.minY - safeSpacing,
    maxX: otherBBox.maxX + safeSpacing,
    maxY: otherBBox.maxY + safeSpacing,
  };
}

export function getRequiredSeparationDelta(
  movingBBox: BoundingBox,
  obstacleBBox: BoundingBox,
  direction: Point
): number | null {
  const candidates: number[] = [];

  if (direction.x > RESOLVE_EPSILON) {
    candidates.push(
      (obstacleBBox.maxX - movingBBox.minX) / direction.x + RESOLVE_EPSILON
    );
  } else if (direction.x < -RESOLVE_EPSILON) {
    candidates.push(
      (obstacleBBox.minX - movingBBox.maxX) / direction.x + RESOLVE_EPSILON
    );
  }

  if (direction.y > RESOLVE_EPSILON) {
    candidates.push(
      (obstacleBBox.maxY - movingBBox.minY) / direction.y + RESOLVE_EPSILON
    );
  } else if (direction.y < -RESOLVE_EPSILON) {
    candidates.push(
      (obstacleBBox.minY - movingBBox.maxY) / direction.y + RESOLVE_EPSILON
    );
  }

  const positive = candidates.filter(
    (value) => Number.isFinite(value) && value > RESOLVE_EPSILON
  );
  if (positive.length === 0) {
    return null;
  }
  return Math.min(...positive);
}

export function tryNudgeInDirection(
  part: PartShape,
  targetPosition: Point,
  otherParts: PartShape[],
  direction: Point,
  spacing: number,
  maxSteps: number = 50
): ResolveResult {
  const length = Math.hypot(direction.x, direction.y);
  if (!Number.isFinite(length) || length < RESOLVE_EPSILON) {
    return { resolved: false, finalPosition: targetPosition };
  }

  const normalizedDirection = {
    x: direction.x / length,
    y: direction.y / length,
  };
  let travelledDistance = 0;

  for (let step = 0; step < maxSteps; step += 1) {
    const testPosition = {
      x: targetPosition.x + normalizedDirection.x * travelledDistance,
      y: targetPosition.y + normalizedDirection.y * travelledDistance,
    };

    const testBBox = getWorldBBox(part, testPosition);
    const collidingExpandedBoxes: BoundingBox[] = [];

    for (const other of otherParts) {
      if (other.id === part.id) continue;
      const expandedOther = getExpandedBBox(other, spacing);
      if (bboxOverlap(testBBox, expandedOther)) {
        collidingExpandedBoxes.push(expandedOther);
      }
    }

    if (collidingExpandedBoxes.length === 0) {
      return {
        resolved: true,
        finalPosition: testPosition,
        nudgeDirection: normalizedDirection,
        nudgeDistance: travelledDistance,
      };
    }

    let delta = 0;
    for (const obstacleBBox of collidingExpandedBoxes) {
      const required = getRequiredSeparationDelta(
        testBBox,
        obstacleBBox,
        normalizedDirection
      );
      if (required && required > delta) {
        delta = required;
      }
    }

    if (!(delta > RESOLVE_EPSILON)) {
      break;
    }

    travelledDistance += delta;
    if (
      !Number.isFinite(travelledDistance) ||
      travelledDistance > MAX_NUDGE_DISTANCE
    ) {
      break;
    }
  }

  return { resolved: false, finalPosition: targetPosition };
}
