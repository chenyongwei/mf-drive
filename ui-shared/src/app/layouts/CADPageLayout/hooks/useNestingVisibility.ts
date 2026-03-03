import { useMemo } from "react";
import type {
  NestingLayoutViewMode,
  Plate,
  NestingPart,
} from "../../../components/CAD/types/NestingTypes";
import type { BoundingBox } from "../../../components/CAD/types/BoundingBox";

interface UseNestingVisibilityOptions {
  isNestingMode: boolean;
  layoutViewMode: NestingLayoutViewMode;
  layoutContentBox: BoundingBox | null;
  plates: Plate[];
  selectedPlateIds: string[];
  nestingParts: NestingPart[];
  onRequestFitView: () => void;
}

interface UseNestingVisibilityResult {
  visiblePlates: Plate[];
  visibleParts: NestingPart[];
  visibleContentBox: BoundingBox;
}

export function useNestingVisibility({
  isNestingMode,
  layoutViewMode,
  layoutContentBox,
  plates,
  selectedPlateIds,
  nestingParts,
  onRequestFitView: _onRequestFitView,
}: UseNestingVisibilityOptions): UseNestingVisibilityResult {
  const fallbackContentBox = layoutContentBox ?? { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };

  const visiblePlates = useMemo(() => {
    if (!isNestingMode) return [];
    if (layoutViewMode === "multi") {
      return plates;
    }
    const selectedId = selectedPlateIds[0];
    if (!selectedId) return [];
    return plates.filter((plate) => plate.id === selectedId);
  }, [isNestingMode, layoutViewMode, plates, selectedPlateIds]);

  const visibleParts = useMemo(() => {
    if (!isNestingMode) return nestingParts;
    if (layoutViewMode === "multi") return nestingParts;
    const selectedIds = new Set(visiblePlates.map((plate) => plate.id));
    return nestingParts.filter((part) => {
      if (part.status === "unplaced") return true;
      if (!part.plateId) return true;
      return selectedIds.has(part.plateId);
    });
  }, [isNestingMode, layoutViewMode, nestingParts, visiblePlates]);

  const visibleContentBox = useMemo(() => {
    if (!isNestingMode) {
      return fallbackContentBox;
    }

    if (visiblePlates.length === 0) {
      return fallbackContentBox;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    visiblePlates.forEach((plate) => {
      minX = Math.min(minX, plate.position.x);
      minY = Math.min(minY, plate.position.y);
      maxX = Math.max(maxX, plate.position.x + plate.width);
      maxY = Math.max(maxY, plate.position.y + plate.height);
    });
    return { minX, minY, maxX, maxY };
  }, [isNestingMode, fallbackContentBox, visiblePlates]);

  return {
    visiblePlates,
    visibleParts,
    visibleContentBox,
  };
}
