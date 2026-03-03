import { useMemo } from "react";
import type { Viewport } from "../types/CADCanvasTypes";
import type { NestingPart } from "../types/NestingTypes";

interface ViewBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface UseCADViewVisibilityOptions {
  parts: NestingPart[];
  viewport: Viewport;
  containerSize: {
    width: number;
    height: number;
  };
}

function filterVisibleParts(parts: NestingPart[], bounds: ViewBounds | null) {
  if (!bounds) {
    return parts;
  }

  return parts.filter((part) => {
    const minX = part.position.x + part.boundingBox.minX;
    const minY = part.position.y + part.boundingBox.minY;
    const maxX = part.position.x + part.boundingBox.maxX;
    const maxY = part.position.y + part.boundingBox.maxY;
    return !(
      maxX < bounds.minX ||
      minX > bounds.maxX ||
      maxY < bounds.minY ||
      minY > bounds.maxY
    );
  });
}

export function useCADViewVisibility({
  parts,
  viewport,
  containerSize,
}: UseCADViewVisibilityOptions) {
  const viewportBounds = useMemo<ViewBounds | null>(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return null;
    }

    const { zoom, pan } = viewport;
    return {
      minX: (-pan.x) / zoom,
      maxX: (containerSize.width - pan.x) / zoom,
      minY: (-pan.y) / zoom,
      maxY: (containerSize.height - pan.y) / zoom,
    };
  }, [viewport, containerSize]);

  return useMemo(() => filterVisibleParts(parts, viewportBounds), [parts, viewportBounds]);
}
