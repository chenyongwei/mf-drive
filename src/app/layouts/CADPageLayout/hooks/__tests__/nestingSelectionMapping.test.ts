import type { NestingPart } from "../../../../components/CAD/types/NestingTypes";
import {
  buildFileToPartIds,
  buildPartToFileId,
  mapFileSelectionToPartIds,
  mapPartSelectionToFileIds,
  toggleListFileSelection,
} from "../nestingSelectionMapping";

function createPart(partial: Partial<NestingPart>): NestingPart {
  return {
    id: "part",
    entities: [],
    boundingBox: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    status: "unplaced",
    plateId: null,
    position: { x: 0, y: 0 },
    rotation: 0,
    ...partial,
  };
}

describe("nestingSelectionMapping", () => {
  test("maps one file to multiple part instances", () => {
    const parts: NestingPart[] = [
      createPart({ id: "part-a", fileId: "file-1" }),
      createPart({ id: "part-a__copy-2", fileId: "file-1" }),
      createPart({ id: "part-b", fileId: "file-2" }),
    ];

    const fileToPartIds = buildFileToPartIds(parts);
    expect(fileToPartIds.get("file-1")).toEqual(["part-a", "part-a__copy-2"]);
    expect(fileToPartIds.get("file-2")).toEqual(["part-b"]);
  });

  test("maps selected files to selected part ids", () => {
    const fileToPartIds = new Map<string, string[]>([
      ["file-1", ["part-a", "part-a__copy-2"]],
      ["file-2", ["part-b"]],
    ]);

    expect(
      mapFileSelectionToPartIds(new Set(["file-1", "file-2"]), fileToPartIds),
    ).toEqual(["part-a", "part-a__copy-2", "part-b"]);
  });

  test("maps selected part ids back to file ids", () => {
    const partToFileId = buildPartToFileId([
      createPart({ id: "part-a", fileId: "file-1" }),
      createPart({ id: "part-a__copy-2", fileId: "file-1" }),
      createPart({ id: "part-b", fileId: "file-2" }),
    ]);

    expect(
      Array.from(
        mapPartSelectionToFileIds(["part-a__copy-2", "part-b"], partToFileId),
      ),
    ).toEqual(["file-1", "file-2"]);
  });

  test("supports single-select and ctrl/cmd additive toggling", () => {
    const single = toggleListFileSelection(new Set(["file-2"]), "file-1", false);
    expect(Array.from(single)).toEqual(["file-1"]);

    const additive = toggleListFileSelection(new Set(["file-1"]), "file-2", true);
    expect(Array.from(additive)).toEqual(["file-1", "file-2"]);

    const additiveRemove = toggleListFileSelection(additive, "file-1", true);
    expect(Array.from(additiveRemove)).toEqual(["file-2"]);
  });
});
