import type { NestingPart, Point } from "../types/NestingTypes";
import { calculateBoundingBoxCenter, transformPoint } from "./useNestingSnapping.points";
import {
  SNAP_KEY_PRECISION,
  type SnapPoint,
} from "./useNestingSnapping.types";

export function distance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalizeVector(vector: Point): Point | null {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (!Number.isFinite(length) || length < 1e-6) {
    return null;
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

export function getPartWorldCenter(part: NestingPart): Point {
  const localCenter = calculateBoundingBoxCenter(part.boundingBox);
  return transformPoint(
    localCenter,
    part.position,
    part.rotation,
    part.mirroredX || false,
    part.mirroredY || false,
  );
}

export function spacingSnapDistance(rawDistance: number, partSpacing: number): number {
  if (!(partSpacing > 0)) {
    return rawDistance;
  }
  return Math.abs(rawDistance - partSpacing);
}

export function calculateSpacingOffset(
  draggedPart: NestingPart,
  draggedPoint: SnapPoint,
  targetPoint: SnapPoint,
  partSpacing: number,
): Point {
  if (!(partSpacing > 0)) {
    return { x: 0, y: 0 };
  }

  const edgeDirection = targetPoint.edgeDirection || draggedPoint.edgeDirection;
  if (edgeDirection && (draggedPoint.type === "edge" || targetPoint.type === "edge")) {
    const normal = { x: -edgeDirection.y, y: edgeDirection.x };
    const normalized = normalizeVector(normal);
    if (normalized) {
      const positiveOffset = {
        x: normalized.x * partSpacing,
        y: normalized.y * partSpacing,
      };
      const negativeOffset = {
        x: -positiveOffset.x,
        y: -positiveOffset.y,
      };
      const pointDelta = {
        x: draggedPoint.position.x - targetPoint.position.x,
        y: draggedPoint.position.y - targetPoint.position.y,
      };
      let baseDirection = normalizeVector(pointDelta);
      if (!baseDirection) {
        const draggedCenter = getPartWorldCenter(draggedPart);
        baseDirection = normalizeVector({
          x: draggedCenter.x - targetPoint.position.x,
          y: draggedCenter.y - targetPoint.position.y,
        });
      }
      if (baseDirection) {
        const positiveScore =
          positiveOffset.x * baseDirection.x + positiveOffset.y * baseDirection.y;
        const negativeScore =
          negativeOffset.x * baseDirection.x + negativeOffset.y * baseDirection.y;
        if (negativeScore > positiveScore) {
          return negativeOffset;
        }
      }
      return {
        x: positiveOffset.x,
        y: positiveOffset.y,
      };
    }
  }

  const pointDirection = normalizeVector({
    x: draggedPoint.position.x - targetPoint.position.x,
    y: draggedPoint.position.y - targetPoint.position.y,
  });
  if (pointDirection) {
    return {
      x: pointDirection.x * partSpacing,
      y: pointDirection.y * partSpacing,
    };
  }

  const draggedCenter = getPartWorldCenter(draggedPart);
  const pointCenterDirection = normalizeVector({
    x: draggedCenter.x - targetPoint.position.x,
    y: draggedCenter.y - targetPoint.position.y,
  });
  if (pointCenterDirection) {
    return {
      x: pointCenterDirection.x * partSpacing,
      y: pointCenterDirection.y * partSpacing,
    };
  }

  return { x: 0, y: 0 };
}

export function areEdgesParallel(
  dir1: Point,
  dir2: Point,
  tolerance: number = 0.1,
): boolean {
  const dot = Math.abs(dir1.x * dir2.x + dir1.y * dir2.y);
  return Math.abs(dot - 1) < tolerance;
}

export function isOuterContourSnapPoint(point: SnapPoint): boolean {
  if (point.type === "center") {
    return true;
  }
  return !Boolean(point.isInnerContour);
}

export function buildSnapKey(
  draggedPartId: string,
  draggedPoint: SnapPoint,
  targetPoint: SnapPoint,
  snapType: string,
): string {
  return [
    draggedPartId,
    draggedPoint.type,
    targetPoint.partId,
    targetPoint.type,
    snapType,
    Number(targetPoint.position.x).toFixed(SNAP_KEY_PRECISION),
    Number(targetPoint.position.y).toFixed(SNAP_KEY_PRECISION),
    targetPoint.isInnerContour ? "inner" : "outer",
  ].join("|");
}
