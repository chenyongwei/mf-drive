import type { BoundingBox, Point } from '../../../types';

export function bboxWidth(bbox: BoundingBox): number {
  return bbox.maxX - bbox.minX;
}

export function bboxHeight(bbox: BoundingBox): number {
  return bbox.maxY - bbox.minY;
}

export function bboxArea(bbox: BoundingBox): number {
  return (bbox.maxX - bbox.minX) * (bbox.maxY - bbox.minY);
}

export function bboxCenter(bbox: BoundingBox): Point {
  return {
    x: (bbox.minX + bbox.maxX) / 2,
    y: (bbox.minY + bbox.maxY) / 2,
  };
}
