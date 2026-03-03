import type { BoundingBox, NestingPart, Plate, Point } from "../types/NestingTypes";

export type PlacementZone = "outer" | "inner";

export interface BoundingBoxTransform {
  rotation?: number;
  mirroredX?: boolean;
  mirroredY?: boolean;
}

interface RectBounds {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

const toRadians = (rotation?: number): number =>
  Number.isFinite(rotation) ? ((rotation as number) * Math.PI) / 180 : 0;

export const toWorldBoundingBox = (
  bbox: BoundingBox,
  position: Point,
  transform?: BoundingBoxTransform,
): BoundingBox => {
  const hasMirror = Boolean(transform?.mirroredX || transform?.mirroredY);
  const rotation = toRadians(transform?.rotation);
  if (!hasMirror && Math.abs(rotation) <= 1e-12) {
    return {
      minX: bbox.minX + position.x,
      minY: bbox.minY + position.y,
      maxX: bbox.maxX + position.x,
      maxY: bbox.maxY + position.y,
    };
  }

  const pivot = {
    x: (bbox.minX + bbox.maxX) / 2,
    y: (bbox.minY + bbox.maxY) / 2,
  };
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const corners = [
    { x: bbox.minX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.maxY },
  ];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  corners.forEach((corner) => {
    let dx = corner.x - pivot.x;
    let dy = corner.y - pivot.y;

    if (transform?.mirroredX) dx = -dx;
    if (transform?.mirroredY) dy = -dy;

    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;
    const worldX = pivot.x + rotatedX + position.x;
    const worldY = pivot.y + rotatedY + position.y;

    minX = Math.min(minX, worldX);
    minY = Math.min(minY, worldY);
    maxX = Math.max(maxX, worldX);
    maxY = Math.max(maxY, worldY);
  });

  return { minX, minY, maxX, maxY };
};

export const toWorldBoundingBoxFromPart = (
  part: Pick<NestingPart, "boundingBox" | "position" | "rotation" | "mirroredX" | "mirroredY">,
): BoundingBox =>
  toWorldBoundingBox(part.boundingBox, part.position, {
    rotation: part.rotation,
    mirroredX: part.mirroredX,
    mirroredY: part.mirroredY,
  });

export const toPlateZoneRect = (plate: Plate, zone: PlacementZone): RectBounds => {
  if (zone === "outer") {
    return {
      xMin: plate.position.x,
      yMin: plate.position.y,
      xMax: plate.position.x + plate.width,
      yMax: plate.position.y + plate.height,
    };
  }

  return {
    xMin: plate.position.x + plate.margin,
    yMin: plate.position.y + plate.margin,
    xMax: plate.position.x + plate.width - plate.margin,
    yMax: plate.position.y + plate.height - plate.margin,
  };
};

export const isValidRect = (rect: RectBounds, tolerance = 0): boolean =>
  rect.xMin <= rect.xMax + tolerance && rect.yMin <= rect.yMax + tolerance;

export const boundingBoxFitsRect = (
  bbox: BoundingBox,
  rect: RectBounds,
  tolerance = 0,
): boolean =>
  bbox.minX >= rect.xMin - tolerance &&
  bbox.maxX <= rect.xMax + tolerance &&
  bbox.minY >= rect.yMin - tolerance &&
  bbox.maxY <= rect.yMax + tolerance;

export const boundingBoxOverlapsRect = (
  bbox: BoundingBox,
  rect: RectBounds,
  tolerance = 0,
): boolean =>
  !(
    bbox.maxX < rect.xMin - tolerance ||
    bbox.minX > rect.xMax + tolerance ||
    bbox.maxY < rect.yMin - tolerance ||
    bbox.minY > rect.yMax + tolerance
  );

export const overlapArea = (bbox: BoundingBox, rect: RectBounds): number => {
  const dx = Math.min(bbox.maxX, rect.xMax) - Math.max(bbox.minX, rect.xMin);
  const dy = Math.min(bbox.maxY, rect.yMax) - Math.max(bbox.minY, rect.yMin);
  if (dx <= 0 || dy <= 0) {
    return 0;
  }
  return dx * dy;
};

export const boundingBoxesOverlap = (a: BoundingBox, b: BoundingBox): boolean =>
  !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);

export const clampAxis = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return value;
  }
  if (min <= max) {
    return Math.max(min, Math.min(max, value));
  }
  return (min + max) / 2;
};
