import { getRotatedBoundingBox } from "../utils/BBoxUtils";
import { resolveCollisionMultiDirection, type PartShape } from "../utils/CollisionResolver";
import type { NestingPart } from "../types/NestingTypes";

interface RotateCommonArgs {
  partId: string;
  parts: NestingPart[];
  draggingPartId: string | null;
  partSpacing: number;
  checkCollision: (
    partId: string,
    newPosition: { x: number; y: number },
    rotation: number,
    useSimplified: boolean,
  ) => boolean;
  updateParts: (updatedParts: NestingPart[]) => void;
}

interface RotateByDeltaArgs extends RotateCommonArgs {
  angle: number;
}

export function rotatePartAction({
  partId,
  angle,
  parts,
  draggingPartId,
  partSpacing,
  checkCollision,
  updateParts,
}: RotateByDeltaArgs): void {
  const part = parts.find((p) => p.id === partId);
  if (!part) return;

  let newRotation = (part.rotation + angle) % 360;
  if (newRotation < 0) newRotation += 360;

  let currentBBox = part.boundingBox;
  if (part.simplifiedContour && part.simplifiedContour.length > 0) {
    currentBBox = getRotatedBoundingBox(part.simplifiedContour, newRotation);
  }

  const partShape: PartShape = {
    id: part.id,
    position: part.position,
    rotation: newRotation,
    boundingBox: currentBBox,
  };

  if (partId === draggingPartId) {
    updateParts(parts.map((p) => (p.id === partId ? { ...p, rotation: newRotation } : p)));
    return;
  }

  const otherShapes = parts
    .filter((p) => p.id !== partId)
    .map((p) => ({
      id: p.id,
      position: p.position,
      rotation: p.rotation,
      boundingBox: p.boundingBox,
    }));

  const hasCollision = checkCollision(partId, part.position, newRotation, false);
  if (!hasCollision) {
    updateParts(parts.map((p) => (p.id === partId ? { ...p, rotation: newRotation } : p)));
    return;
  }

  const resolved = resolveCollisionMultiDirection(
    partShape,
    part.position,
    otherShapes,
    partSpacing,
  );
  if (resolved.resolved) {
    updateParts(
      parts.map((p) =>
        p.id === partId
          ? {
              ...p,
              rotation: newRotation,
              position: resolved.finalPosition,
            }
          : p,
      ),
    );
  }
}

interface RotateFreeArgs extends RotateCommonArgs {
  angle: number;
  snapAngles?: number[];
}

export function rotatePartFreeAction({
  partId,
  angle,
  snapAngles = [0, 15, 30, 45, 90, 180],
  parts,
  draggingPartId,
  partSpacing,
  checkCollision,
  updateParts,
}: RotateFreeArgs): boolean {
  const part = parts.find((p) => p.id === partId);
  if (!part) return false;

  let normalizedAngle = angle % 360;
  if (normalizedAngle < 0) normalizedAngle += 360;

  let snappedAngle = normalizedAngle;
  for (const snapAngle of snapAngles) {
    const diff = Math.abs(normalizedAngle - snapAngle);
    if (diff < 5 || Math.abs(diff - 360) < 5) {
      snappedAngle = snapAngle;
      break;
    }
  }

  let currentBBox = part.boundingBox;
  if (part.simplifiedContour && part.simplifiedContour.length > 0) {
    currentBBox = getRotatedBoundingBox(part.simplifiedContour, snappedAngle);
  }

  if (partId === draggingPartId) {
    updateParts(parts.map((p) => (p.id === partId ? { ...p, rotation: snappedAngle } : p)));
    return true;
  }

  const partShape: PartShape = {
    id: part.id,
    position: part.position,
    rotation: snappedAngle,
    boundingBox: currentBBox,
  };
  const otherShapes = parts
    .filter((p) => p.id !== partId)
    .map((p) => ({
      id: p.id,
      position: p.position,
      rotation: p.rotation,
      boundingBox: p.boundingBox,
    }));

  const hasCollision = checkCollision(partId, part.position, snappedAngle, false);
  if (!hasCollision) {
    updateParts(parts.map((p) => (p.id === partId ? { ...p, rotation: snappedAngle } : p)));
    return true;
  }

  const resolved = resolveCollisionMultiDirection(
    partShape,
    part.position,
    otherShapes,
    partSpacing,
  );
  if (resolved.resolved) {
    updateParts(
      parts.map((p) =>
        p.id === partId
          ? {
              ...p,
              rotation: snappedAngle,
              position: resolved.finalPosition,
            }
          : p,
      ),
    );
    return true;
  }

  return false;
}

interface MirrorArgs {
  partId: string;
  direction: "horizontal" | "vertical";
  parts: NestingPart[];
  updateParts: (updatedParts: NestingPart[]) => void;
}

export function mirrorPartAction({
  partId,
  direction,
  parts,
  updateParts,
}: MirrorArgs): void {
  updateParts(
    parts.map((p) =>
      p.id === partId
        ? {
            ...p,
            mirroredX: direction === "horizontal" ? !p.mirroredX : p.mirroredX,
            mirroredY: direction === "vertical" ? !p.mirroredY : p.mirroredY,
          }
        : p,
    ),
  );
}
