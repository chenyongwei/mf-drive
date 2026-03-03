import React from "react";
import { act, renderHook } from "@testing-library/react";
import { usePartNesting } from "../usePartNesting";
import type { NestingPart, Plate } from "../../types/NestingTypes";

const plate: Plate = {
  id: "plate-1",
  name: "P1",
  width: 200,
  height: 200,
  margin: 0,
  position: { x: 0, y: 0 },
};

function createPart(overrides: Partial<NestingPart>): NestingPart {
  return {
    id: "part",
    sourcePartId: "part",
    entities: [],
    boundingBox: { minX: 0, minY: 0, maxX: 20, maxY: 20 },
    status: "unplaced",
    plateId: null,
    position: { x: 20, y: 20 },
    rotation: 0,
    mirroredX: false,
    mirroredY: false,
    ...overrides,
  };
}

function isPlaced(part: NestingPart): boolean {
  return part.status === "placed" && Boolean(part.plateId);
}

function renderPartNestingHook(initialParts: NestingPart[]) {
  return renderHook(() => {
    const [parts, setParts] = React.useState<NestingPart[]>(initialParts);
    const nesting = usePartNesting({
      parts,
      snappingParts: parts,
      onPartsChange: setParts,
      plates: [plate],
      zoom: 1,
      partSpacing: 0,
      snappingEnabled: false,
      snapTolerance: 0,
      stickToEdge: false,
      penetrationMode: false,
      selectedPartIds: [],
    });
    return { parts, nesting };
  });
}

describe("usePartNesting sticky placement", () => {
  test("dropFromList places one part and keeps sticky until source runs out", () => {
    const { result } = renderPartNestingHook([
      createPart({ id: "part-a", sourcePartId: "part-a" }),
      createPart({ id: "part-a__copy-2", sourcePartId: "part-a" }),
      createPart({ id: "part-a__copy-3", sourcePartId: "part-a" }),
    ]);

    act(() => {
      const placed = result.current.nesting.dropFromList(
        "part-a",
        { x: 40, y: 40 },
        { x: 40, y: 40 },
      );
      expect(placed).toBe(true);
    });

    expect(result.current.parts.filter(isPlaced)).toHaveLength(1);
    expect(result.current.nesting.isStickyPlacementActive).toBe(true);
    expect(result.current.nesting.stickySourcePartId).toBe("part-a");
    expect(result.current.nesting.stickyRemainingCount).toBe(2);
    expect(result.current.nesting.dragPreview?.isCopyPreview).toBe(true);
    expect(result.current.nesting.dragPreview?.remainingCount).toBe(2);

    act(() => {
      const placed = result.current.nesting.dropFromList(
        "part-a",
        { x: 90, y: 40 },
        { x: 90, y: 40 },
      );
      expect(placed).toBe(true);
    });

    expect(result.current.parts.filter(isPlaced)).toHaveLength(2);
    expect(result.current.nesting.isStickyPlacementActive).toBe(true);
    expect(result.current.nesting.stickyRemainingCount).toBe(1);
    expect(result.current.nesting.dragPreview?.isCopyPreview).toBe(false);

    act(() => {
      const placed = result.current.nesting.dropFromList(
        "part-a",
        { x: 130, y: 40 },
        { x: 130, y: 40 },
      );
      expect(placed).toBe(true);
    });

    expect(result.current.parts.filter(isPlaced)).toHaveLength(3);
    expect(result.current.nesting.isStickyPlacementActive).toBe(false);
    expect(result.current.nesting.stickySourcePartId).toBeNull();
  });

  test("invalid drop does not consume quantity and keeps sticky preview", () => {
    const { result } = renderPartNestingHook([
      createPart({ id: "part-a", sourcePartId: "part-a" }),
    ]);

    act(() => {
      const placed = result.current.nesting.dropFromList(
        "part-a",
        { x: 500, y: 500 },
        { x: 500, y: 500 },
      );
      expect(placed).toBe(false);
    });

    expect(result.current.parts.filter(isPlaced)).toHaveLength(0);
    expect(result.current.parts.filter((part) => !isPlaced(part))).toHaveLength(1);
    expect(result.current.nesting.isStickyPlacementActive).toBe(true);
    expect(result.current.nesting.stickySourcePartId).toBe("part-a");

    act(() => {
      const placed = result.current.nesting.dropFromList(
        "part-a",
        { x: 40, y: 40 },
        { x: 40, y: 40 },
      );
      expect(placed).toBe(true);
    });

    expect(result.current.parts.filter(isPlaced)).toHaveLength(1);
    expect(result.current.nesting.isStickyPlacementActive).toBe(false);
  });

  test("cancelStickyPlacement ends sticky session without rolling back placed parts", () => {
    const { result } = renderPartNestingHook([
      createPart({ id: "part-a", sourcePartId: "part-a" }),
      createPart({ id: "part-a__copy-2", sourcePartId: "part-a" }),
    ]);

    act(() => {
      const placed = result.current.nesting.dropFromList(
        "part-a",
        { x: 40, y: 40 },
        { x: 40, y: 40 },
      );
      expect(placed).toBe(true);
    });

    expect(result.current.nesting.isStickyPlacementActive).toBe(true);
    expect(result.current.parts.filter(isPlaced)).toHaveLength(1);

    act(() => {
      result.current.nesting.cancelStickyPlacement();
    });

    expect(result.current.nesting.isStickyPlacementActive).toBe(false);
    expect(result.current.nesting.dragPreview).toBeNull();
    expect(result.current.parts.filter(isPlaced)).toHaveLength(1);
  });
});
