import {
  applyPlateSelectionFromEvent,
  computeNextPlateSelection,
  getPlatePartsWithFallback,
} from "../nestingLayoutSelection";
import type { NestingPart, Plate } from "../../types/NestingTypes";
import { vi } from "vitest";

const plates: Plate[] = [
  { id: "plate-1", name: "Plate 1", width: 2000, height: 1000, margin: 10, position: { x: 0, y: 0 } },
  { id: "plate-2", name: "Plate 2", width: 2000, height: 1000, margin: 10, position: { x: 0, y: 1200 } },
  { id: "plate-3", name: "Plate 3", width: 2000, height: 1000, margin: 10, position: { x: 0, y: 2400 } },
];

describe("nestingLayoutSelection", () => {
  it("single mode always returns only clicked plate", () => {
    const next = computeNextPlateSelection(
      { ctrlKey: true, metaKey: false, shiftKey: true },
      "plate-2",
      ["plate-1", "plate-3"],
      plates,
      "single",
    );

    expect(next).toEqual(["plate-2"]);
  });

  it("multi mode supports ctrl toggle and shift range", () => {
    const ctrlAdded = computeNextPlateSelection(
      { ctrlKey: true, metaKey: false, shiftKey: false },
      "plate-2",
      ["plate-1"],
      plates,
      "multi",
    );
    expect(ctrlAdded).toEqual(["plate-1", "plate-2"]);

    const shiftRange = computeNextPlateSelection(
      { ctrlKey: false, metaKey: false, shiftKey: true },
      "plate-3",
      ["plate-1"],
      plates,
      "multi",
    );
    expect(shiftRange).toEqual(["plate-1", "plate-2", "plate-3"]);
  });

  it("applyPlateSelectionFromEvent stops propagation and applies mode rules", () => {
    const stopPropagation = vi.fn();
    const event = {
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      stopPropagation,
    };

    const next = applyPlateSelectionFromEvent(
      event,
      "plate-3",
      ["plate-1", "plate-2"],
      plates,
      "single",
    );

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(next).toEqual(["plate-3"]);
  });

  it("fallback plate matching includes parts whose plateId is missing but bbox overlaps plate", () => {
    const parts: NestingPart[] = [
      {
        id: "part-a",
        entities: [],
        boundingBox: { minX: 10, minY: 20, maxX: 80, maxY: 90 },
        status: "unplaced",
        plateId: null,
        position: { x: 0, y: 0 },
        rotation: 0,
      },
      {
        id: "part-b",
        entities: [],
        boundingBox: { minX: 10, minY: 20, maxX: 80, maxY: 90 },
        status: "placed",
        plateId: "plate-2",
        position: { x: 0, y: 0 },
        rotation: 0,
      },
    ];

    const plate1Parts = getPlatePartsWithFallback(parts, plates[0], plates);
    const plate2Parts = getPlatePartsWithFallback(parts, plates[1], plates);

    expect(plate1Parts.map((part) => part.id)).toContain("part-a");
    expect(plate2Parts.map((part) => part.id)).toContain("part-b");
  });
});
