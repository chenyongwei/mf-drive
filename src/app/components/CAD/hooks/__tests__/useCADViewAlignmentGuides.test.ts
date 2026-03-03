import type { NestingPart } from "../../types/NestingTypes";
import { getAlignmentGuideCandidates } from "../useCADViewAlignmentGuides";

function createPart(
  id: string,
  plateId: string | null,
  x: number,
  y: number,
): NestingPart {
  return {
    id,
    position: { x, y },
    rotation: 0,
    mirroredX: false,
    mirroredY: false,
    boundingBox: { minX: 0, minY: 0, maxX: 40, maxY: 40 },
    entities: [],
    status: plateId ? "placed" : "unplaced",
    plateId,
  };
}

describe("getAlignmentGuideCandidates", () => {
  const draggedPart = createPart("dragged", "plate-a", 100, 100);
  const sourcePlatePart = createPart("source", "plate-a", 200, 100);
  const targetPlatePart = createPart("target", "plate-b", 300, 100);
  const unplacedPart = createPart("unplaced", null, 400, 100);

  it("keeps legacy behavior when target plate is not provided", () => {
    const candidates = getAlignmentGuideCandidates(
      draggedPart,
      [sourcePlatePart, targetPlatePart, unplacedPart],
      undefined,
    );

    expect(candidates.map((part) => part.id)).toEqual([
      "dragged",
      "source",
      "target",
      "unplaced",
    ]);
  });

  it("keeps only dragged + target-plate parts when target plate exists", () => {
    const candidates = getAlignmentGuideCandidates(
      draggedPart,
      [sourcePlatePart, targetPlatePart, unplacedPart],
      "plate-b",
    );

    expect(candidates.map((part) => part.id)).toEqual(["dragged", "target"]);
  });

  it("keeps only dragged + unplaced parts when target plate is null", () => {
    const candidates = getAlignmentGuideCandidates(
      draggedPart,
      [sourcePlatePart, targetPlatePart, unplacedPart],
      null,
    );

    expect(candidates.map((part) => part.id)).toEqual(["dragged", "unplaced"]);
  });
});
