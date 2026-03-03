import type { Plate } from "../../../components/CAD/types/NestingTypes";

export interface FocusBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface FocusViewport {
  zoom: number;
  pan: { x: number; y: number };
}

export interface FocusContainerSize {
  width: number;
  height: number;
}

export type FocusStrategy = "pan" | "fit";

export function getPlateBoundingBox(plate: Plate): FocusBoundingBox {
  return {
    minX: plate.position.x,
    minY: plate.position.y,
    maxX: plate.position.x + plate.width,
    maxY: plate.position.y + plate.height,
  };
}

export function getPlatesBoundingBox(plates: Plate[]): FocusBoundingBox | null {
  if (plates.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  plates.forEach((plate) => {
    const box = getPlateBoundingBox(plate);
    minX = Math.min(minX, box.minX);
    minY = Math.min(minY, box.minY);
    maxX = Math.max(maxX, box.maxX);
    maxY = Math.max(maxY, box.maxY);
  });

  return { minX, minY, maxX, maxY };
}

export function mergeFocusBoundingBoxes(
  boxes: FocusBoundingBox[],
): FocusBoundingBox | null {
  if (boxes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  boxes.forEach((box) => {
    minX = Math.min(minX, box.minX);
    minY = Math.min(minY, box.minY);
    maxX = Math.max(maxX, box.maxX);
    maxY = Math.max(maxY, box.maxY);
  });

  return { minX, minY, maxX, maxY };
}

export function isBoundingBoxFullyVisible(
  box: FocusBoundingBox,
  viewport: FocusViewport,
  containerSize: FocusContainerSize,
): boolean {
  const left = box.minX * viewport.zoom + viewport.pan.x;
  const top = box.minY * viewport.zoom + viewport.pan.y;
  const right = box.maxX * viewport.zoom + viewport.pan.x;
  const bottom = box.maxY * viewport.zoom + viewport.pan.y;

  return left >= 0 && top >= 0 && right <= containerSize.width && bottom <= containerSize.height;
}

export function computePanToCenterBoundingBox(
  box: FocusBoundingBox,
  viewport: FocusViewport,
  containerSize: FocusContainerSize,
): { x: number; y: number } {
  const worldCenterX = (box.minX + box.maxX) / 2;
  const worldCenterY = (box.minY + box.maxY) / 2;

  return {
    x: containerSize.width / 2 - worldCenterX * viewport.zoom,
    y: containerSize.height / 2 - worldCenterY * viewport.zoom,
  };
}

export function resolveFocusStrategy(
  box: FocusBoundingBox,
  viewport: FocusViewport,
  containerSize: FocusContainerSize,
): FocusStrategy {
  return isBoundingBoxFullyVisible(box, viewport, containerSize) ? "pan" : "fit";
}
