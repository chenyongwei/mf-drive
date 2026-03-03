import type { BoundingBox, Point } from '../../../types';

export function bboxIntersect(bbox1: BoundingBox, bbox2: BoundingBox): boolean {
  return !(
    bbox1.maxX < bbox2.minX ||
    bbox1.minX > bbox2.maxX ||
    bbox1.maxY < bbox2.minY ||
    bbox1.minY > bbox2.maxY
  );
}

export function bboxContainsPoint(
  bbox: BoundingBox,
  point: Point,
  tolerance = 0
): boolean {
  return (
    point.x >= bbox.minX - tolerance &&
    point.x <= bbox.maxX + tolerance &&
    point.y >= bbox.minY - tolerance &&
    point.y <= bbox.maxY + tolerance
  );
}

export function bboxContainsBBox(
  outer: BoundingBox,
  inner: BoundingBox,
  tolerance = 0
): boolean {
  return (
    inner.minX >= outer.minX - tolerance &&
    inner.maxX <= outer.maxX + tolerance &&
    inner.minY >= outer.minY - tolerance &&
    inner.maxY <= outer.maxY + tolerance
  );
}

export function mergeBBox(bbox1: BoundingBox, bbox2: BoundingBox): BoundingBox {
  return {
    minX: Math.min(bbox1.minX, bbox2.minX),
    minY: Math.min(bbox1.minY, bbox2.minY),
    maxX: Math.max(bbox1.maxX, bbox2.maxX),
    maxY: Math.max(bbox1.maxY, bbox2.maxY),
  };
}

export function intersectBBox(
  bbox1: BoundingBox,
  bbox2: BoundingBox
): BoundingBox | null {
  if (!bboxIntersect(bbox1, bbox2)) {
    return null;
  }

  return {
    minX: Math.max(bbox1.minX, bbox2.minX),
    minY: Math.max(bbox1.minY, bbox2.minY),
    maxX: Math.min(bbox1.maxX, bbox2.maxX),
    maxY: Math.min(bbox1.maxY, bbox2.maxY),
  };
}

export function expandBBox(bbox: BoundingBox, amount: number): BoundingBox {
  return {
    minX: bbox.minX - amount,
    minY: bbox.minY - amount,
    maxX: bbox.maxX + amount,
    maxY: bbox.maxY + amount,
  };
}
