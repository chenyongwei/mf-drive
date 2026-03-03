import { renderHook } from "@testing-library/react";
import type { NestingPart, Plate } from "../../../../components/CAD/types/NestingTypes";
import { useNestingVisibility } from "../useNestingVisibility";
import { vi } from "vitest";

const plates: Plate[] = [
  { id: "plate-1", name: "Plate 1", width: 1000, height: 500, margin: 10, position: { x: 0, y: 0 } },
  { id: "plate-2", name: "Plate 2", width: 800, height: 400, margin: 10, position: { x: 1200, y: 200 } },
];

const parts: NestingPart[] = [
  {
    id: "part-1",
    entities: [],
    boundingBox: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    status: "placed",
    plateId: "plate-1",
    position: { x: 100, y: 100 },
    rotation: 0,
  },
  {
    id: "part-2",
    entities: [],
    boundingBox: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    status: "placed",
    plateId: "plate-2",
    position: { x: 1300, y: 300 },
    rotation: 0,
  },
  {
    id: "part-3",
    entities: [],
    boundingBox: { minX: 0, minY: 0, maxX: 80, maxY: 80 },
    status: "unplaced",
    plateId: null,
    position: { x: -200, y: -100 },
    rotation: 0,
  },
];

describe("useNestingVisibility", () => {
  it("multi mode shows all plates and all parts", () => {
    const { result } = renderHook(() =>
      useNestingVisibility({
        isNestingMode: true,
        layoutViewMode: "multi",
        layoutContentBox: null,
        plates,
        selectedPlateIds: [],
        nestingParts: parts,
        onRequestFitView: vi.fn(),
      }),
    );

    expect(result.current.visiblePlates.map((plate) => plate.id)).toEqual(["plate-1", "plate-2"]);
    expect(result.current.visibleParts.map((part) => part.id)).toEqual(["part-1", "part-2", "part-3"]);
    expect(result.current.visibleContentBox).toEqual({
      minX: 0,
      minY: 0,
      maxX: 2000,
      maxY: 600,
    });
  });

  it("single mode shows only current plate and its parts plus unplaced parts", () => {
    const { result } = renderHook(() =>
      useNestingVisibility({
        isNestingMode: true,
        layoutViewMode: "single",
        layoutContentBox: null,
        plates,
        selectedPlateIds: ["plate-2"],
        nestingParts: parts,
        onRequestFitView: vi.fn(),
      }),
    );

    expect(result.current.visiblePlates.map((plate) => plate.id)).toEqual(["plate-2"]);
    expect(result.current.visibleParts.map((part) => part.id)).toEqual(["part-2", "part-3"]);
    expect(result.current.visibleContentBox).toEqual({
      minX: 1200,
      minY: 200,
      maxX: 2000,
      maxY: 600,
    });
  });

  it("single mode with no selection falls back to layout content box", () => {
    const { result } = renderHook(() =>
      useNestingVisibility({
        isNestingMode: true,
        layoutViewMode: "single",
        layoutContentBox: { minX: -10, minY: -20, maxX: 300, maxY: 400 },
        plates,
        selectedPlateIds: [],
        nestingParts: parts,
        onRequestFitView: vi.fn(),
      }),
    );

    expect(result.current.visiblePlates).toEqual([]);
    expect(result.current.visibleContentBox).toEqual({
      minX: -10,
      minY: -20,
      maxX: 300,
      maxY: 400,
    });
  });
});
