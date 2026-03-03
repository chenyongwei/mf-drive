import type { Plate, NestingLayoutViewMode, NestingPart } from "../types/NestingTypes";

interface SelectionKeyState {
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

interface SelectionPointerEvent extends SelectionKeyState {
  stopPropagation: () => void;
}

export function getPlateParts(parts: NestingPart[], plateId: string): NestingPart[] {
  return parts.filter((part) => part.plateId === plateId);
}

function getOverlapArea(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number },
): number {
  const overlapX = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const overlapY = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
  return overlapX * overlapY;
}

function resolvePlateIdByOverlap(part: NestingPart, plates: Plate[]): string | null {
  if (!part.boundingBox) return null;
  const worldBox = {
    minX: part.boundingBox.minX + part.position.x,
    minY: part.boundingBox.minY + part.position.y,
    maxX: part.boundingBox.maxX + part.position.x,
    maxY: part.boundingBox.maxY + part.position.y,
  };
  let bestPlateId: string | null = null;
  let bestOverlap = 0;

  plates.forEach((plate) => {
    const plateBox = {
      minX: plate.position.x,
      minY: plate.position.y,
      maxX: plate.position.x + plate.width,
      maxY: plate.position.y + plate.height,
    };
    const overlap = getOverlapArea(worldBox, plateBox);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestPlateId = plate.id;
    }
  });

  return bestOverlap > 0 ? bestPlateId : null;
}

export function getPlatePartsWithFallback(parts: NestingPart[], plate: Plate, plates: Plate[]): NestingPart[] {
  return parts.filter((part) => {
    if (part.plateId) return part.plateId === plate.id;
    const resolved = resolvePlateIdByOverlap(part, plates);
    return resolved === plate.id;
  });
}

export function computeNextPlateSelection(
  keys: SelectionKeyState,
  plateId: string,
  selectedPlateIds: string[],
  plates: Plate[],
  layoutViewMode: NestingLayoutViewMode,
): string[] {
  if (layoutViewMode === "single") {
    return [plateId];
  }

  let nextSelection = [...selectedPlateIds];
  const isSelected = nextSelection.includes(plateId);

  if (keys.ctrlKey || keys.metaKey) {
    if (isSelected) {
      return nextSelection.filter((id) => id !== plateId);
    }
    return [...nextSelection, plateId];
  }

  if (keys.shiftKey) {
    if (nextSelection.length > 0) {
      const lastId = nextSelection[nextSelection.length - 1];
      const lastIndex = plates.findIndex((plate) => plate.id === lastId);
      const currentIndex = plates.findIndex((plate) => plate.id === plateId);
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = plates.slice(start, end + 1).map((plate) => plate.id);
        return Array.from(new Set([...nextSelection, ...rangeIds]));
      }
    }
    return [plateId];
  }

  return [plateId];
}

export function applyPlateSelectionFromEvent(
  event: SelectionPointerEvent,
  plateId: string,
  selectedPlateIds: string[],
  plates: Plate[],
  layoutViewMode: NestingLayoutViewMode,
): string[] {
  event.stopPropagation();
  return computeNextPlateSelection(
    {
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    },
    plateId,
    selectedPlateIds,
    plates,
    layoutViewMode,
  );
}
