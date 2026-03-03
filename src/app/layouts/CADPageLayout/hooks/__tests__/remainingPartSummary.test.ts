import type { NestingPart } from "../../../../components/CAD/types/NestingTypes";
import type { FileData } from "../../CADPageLayout.file-utils";
import {
  buildRemainingPartSummary,
  isNestingPartPlaced,
  resolveNestingPartSourceId,
} from "../remainingPartSummary";

function createPart(partial: Partial<NestingPart>): NestingPart {
  return {
    id: "part",
    sourcePartId: "part",
    entities: [],
    boundingBox: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    status: "unplaced",
    plateId: null,
    position: { x: 0, y: 0 },
    rotation: 0,
    ...partial,
  };
}

describe("remainingPartSummary", () => {
  test("groups by sourcePartId and keeps only unplaced items from checked PRTS", () => {
    const files: FileData[] = [
      { id: "file-a", name: "A件", type: "PRTS", partId: "part-a" },
      { id: "file-b", name: "B件", type: "PRTS", partId: "part-b" },
      { id: "file-c", name: "C件", type: "PRTS", partId: "part-c" },
    ];
    const nestingParts: NestingPart[] = [
      createPart({ id: "part-a", sourcePartId: "part-a", status: "placed", plateId: "plate-1" }),
      createPart({ id: "part-a__copy-2", sourcePartId: "part-a", status: "unplaced", plateId: null }),
      createPart({ id: "part-b", sourcePartId: "part-b", status: "placed", plateId: "plate-1" }),
      createPart({ id: "part-b__copy-2", sourcePartId: "part-b", status: "placed", plateId: "plate-2" }),
      createPart({ id: "part-c", sourcePartId: "part-c", status: "unplaced", plateId: null }),
    ];

    const summary = buildRemainingPartSummary({
      files,
      checkedFileIds: new Set(["file-a", "file-b"]),
      nestingParts,
      isNestingMode: true,
      layoutViewMode: "multi",
    });

    expect(summary).toEqual([
      {
        sourcePartId: "part-a",
        fileId: "file-a",
        name: "A件",
        total: 2,
        placed: 1,
        unplaced: 1,
      },
    ]);
  });

  test("returns empty list outside nesting multi mode", () => {
    const files: FileData[] = [{ id: "file-a", name: "A件", type: "PRTS", partId: "part-a" }];
    const nestingParts: NestingPart[] = [createPart({ id: "part-a", sourcePartId: "part-a" })];

    expect(
      buildRemainingPartSummary({
        files,
        checkedFileIds: new Set(["file-a"]),
        nestingParts,
        isNestingMode: false,
        layoutViewMode: "multi",
      }),
    ).toEqual([]);

    expect(
      buildRemainingPartSummary({
        files,
        checkedFileIds: new Set(["file-a"]),
        nestingParts,
        isNestingMode: true,
        layoutViewMode: "single",
      }),
    ).toEqual([]);
  });

  test("resolves source id from copy suffix when sourcePartId is absent", () => {
    const part = createPart({ id: "part-a__copy-3", sourcePartId: undefined });
    expect(resolveNestingPartSourceId(part)).toBe("part-a");
  });

  test("treats any part with plateId as placed regardless of status value", () => {
    const partMarkedUnplacedButOnPlate = createPart({
      status: "unplaced",
      plateId: "plate-1",
    });
    const partMarkedPlacedButNoPlate = createPart({
      status: "placed",
      plateId: null,
    });

    expect(isNestingPartPlaced(partMarkedUnplacedButOnPlate)).toBe(true);
    expect(isNestingPartPlaced(partMarkedPlacedButNoPlate)).toBe(false);
  });
});
