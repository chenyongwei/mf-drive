import type { Plate } from "../../../../components/CAD/types/NestingTypes";
import {
  computePanToCenterBoundingBox,
  getPlateBoundingBox,
  getPlatesBoundingBox,
  mergeFocusBoundingBoxes,
  resolveFocusStrategy,
} from "../nestingViewportFocus";
import { toWorldBoundingBoxFromPart } from "../../../../components/CAD/hooks/usePartNesting.placement.bounds";

describe("nestingViewportFocus", () => {
  const plateA: Plate = {
    id: "plate-a",
    name: "Plate A",
    width: 1000,
    height: 500,
    margin: 10,
    position: { x: 0, y: 0 },
  };

  const plateB: Plate = {
    id: "plate-b",
    name: "Plate B",
    width: 1200,
    height: 700,
    margin: 10,
    position: { x: 1500, y: 200 },
  };

  it("merges all plates into one world bounding box", () => {
    expect(getPlatesBoundingBox([plateA, plateB])).toEqual({
      minX: 0,
      minY: 0,
      maxX: 2700,
      maxY: 900,
    });
    expect(getPlatesBoundingBox([])).toBeNull();
  });

  it("returns pan strategy when target box is already fully visible", () => {
    const box = getPlateBoundingBox(plateA);
    const strategy = resolveFocusStrategy(
      box,
      { zoom: 0.5, pan: { x: 20, y: 20 } },
      { width: 1200, height: 700 },
    );
    expect(strategy).toBe("pan");
  });

  it("returns fit strategy when target box exceeds viewport bounds", () => {
    const box = getPlateBoundingBox(plateB);
    const strategy = resolveFocusStrategy(
      box,
      { zoom: 1, pan: { x: -200, y: 0 } },
      { width: 900, height: 600 },
    );
    expect(strategy).toBe("fit");
  });

  it("computes centered pan without changing zoom", () => {
    const box = getPlateBoundingBox(plateA);
    const pan = computePanToCenterBoundingBox(
      box,
      { zoom: 1, pan: { x: 0, y: 0 } },
      { width: 1200, height: 800 },
    );

    expect(pan).toEqual({
      x: 100,
      y: 150,
    });
  });

  it("merges multiple focus boxes for multi-selection", () => {
    expect(
      mergeFocusBoundingBoxes([
        { minX: 10, minY: 20, maxX: 50, maxY: 60 },
        { minX: -30, minY: 5, maxX: 15, maxY: 100 },
      ]),
    ).toEqual({
      minX: -30,
      minY: 5,
      maxX: 50,
      maxY: 100,
    });
    expect(mergeFocusBoundingBoxes([])).toBeNull();
  });

  it("computes world bbox for rotated and mirrored part bounds", () => {
    const worldBox = toWorldBoundingBoxFromPart({
      boundingBox: { minX: 0, minY: 0, maxX: 100, maxY: 60 },
      position: { x: 120, y: 40 },
      rotation: 90,
      mirroredX: true,
      mirroredY: false,
    });

    expect(worldBox.maxX).toBeGreaterThan(worldBox.minX);
    expect(worldBox.maxY).toBeGreaterThan(worldBox.minY);
  });
});
