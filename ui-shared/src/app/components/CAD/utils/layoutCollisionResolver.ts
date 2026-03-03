import { BoundingBox } from "../types/BoundingBox";
import {
  EXPANSION,
  FILE_FRAME_CLEARANCE_MM,
} from "../../../constants/layoutConstants";

export interface CollisionLayout {
  fileId: string;
  offsetX: number;
  offsetY: number;
  boundingBox: BoundingBox;
}

interface CollisionResolverOptions {
  anchorFileId?: string | null;
  framePaddingMm?: number;
  clearanceMm?: number;
}

function getFrameBoundsWorld(
  layout: CollisionLayout,
  framePaddingMm: number,
): BoundingBox {
  return {
    minX: layout.boundingBox.minX + layout.offsetX - framePaddingMm,
    minY: layout.boundingBox.minY + layout.offsetY - framePaddingMm,
    maxX: layout.boundingBox.maxX + layout.offsetX + framePaddingMm,
    maxY: layout.boundingBox.maxY + layout.offsetY + framePaddingMm,
  };
}

function isFrameConflict(
  a: BoundingBox,
  b: BoundingBox,
  clearanceMm: number,
): boolean {
  return !(
    a.maxX + clearanceMm <= b.minX ||
    b.maxX + clearanceMm <= a.minX ||
    a.maxY + clearanceMm <= b.minY ||
    b.maxY + clearanceMm <= a.minY
  );
}

function findConflict(
  currentBounds: BoundingBox,
  placed: Array<{ bounds: BoundingBox }>,
  clearanceMm: number,
): BoundingBox | null {
  for (const item of placed) {
    if (isFrameConflict(currentBounds, item.bounds, clearanceMm)) {
      return item.bounds;
    }
  }
  return null;
}

export function resolveCollisionFreeLayouts(
  layouts: CollisionLayout[],
  options: CollisionResolverOptions = {},
): CollisionLayout[] {
  if (layouts.length <= 1) {
    return layouts.map((layout) => ({ ...layout }));
  }

  const framePaddingMm = options.framePaddingMm ?? EXPANSION;
  const clearanceMm = options.clearanceMm ?? FILE_FRAME_CLEARANCE_MM;
  const copied = layouts.map((layout) => ({ ...layout }));
  const byId = new Map(copied.map((layout) => [layout.fileId, layout]));
  const anchor =
    (options.anchorFileId ? byId.get(options.anchorFileId) : null) ?? copied[0];

  const ordered = [
    anchor,
    ...copied.filter((layout) => layout.fileId !== anchor.fileId),
  ];

  const placed: Array<{ fileId: string; bounds: BoundingBox }> = [];

  for (const layout of ordered) {
    let offsetX = layout.offsetX;
    let offsetY = layout.offsetY;
    let bounds = getFrameBoundsWorld(
      { ...layout, offsetX, offsetY },
      framePaddingMm,
    );

    if (layout.fileId !== anchor.fileId) {
      for (let attempt = 0; attempt < 256; attempt += 1) {
        const blocker = findConflict(bounds, placed, clearanceMm);
        if (!blocker) {
          break;
        }

        const moveRightBy = blocker.maxX + clearanceMm - bounds.minX;
        const moveDownBy = blocker.maxY + clearanceMm - bounds.minY;

        if (moveRightBy <= 0 && moveDownBy <= 0) {
          break;
        }

        if (moveRightBy <= moveDownBy) {
          offsetX += Math.max(moveRightBy, 0);
        } else {
          offsetY += Math.max(moveDownBy, 0);
        }

        bounds = getFrameBoundsWorld(
          { ...layout, offsetX, offsetY },
          framePaddingMm,
        );
      }
    }

    layout.offsetX = offsetX;
    layout.offsetY = offsetY;
    placed.push({
      fileId: layout.fileId,
      bounds,
    });
  }

  return copied;
}

export function hasAnyLayoutCollision(
  layouts: CollisionLayout[],
  options: CollisionResolverOptions = {},
): boolean {
  const framePaddingMm = options.framePaddingMm ?? EXPANSION;
  const clearanceMm = options.clearanceMm ?? FILE_FRAME_CLEARANCE_MM;

  for (let i = 0; i < layouts.length; i += 1) {
    const first = getFrameBoundsWorld(layouts[i], framePaddingMm);
    for (let j = i + 1; j < layouts.length; j += 1) {
      const second = getFrameBoundsWorld(layouts[j], framePaddingMm);
      if (isFrameConflict(first, second, clearanceMm)) {
        return true;
      }
    }
  }
  return false;
}

