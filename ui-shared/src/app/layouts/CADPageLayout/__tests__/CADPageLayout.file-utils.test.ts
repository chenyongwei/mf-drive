import {
  resolveProcessCode,
  resolveProcessStrokeColor,
  toCadEntitiesFromPrtsPart,
} from "../CADPageLayout.file-utils";

describe("CADPageLayout.file-utils process normalization", () => {
  test("maps processCode values to the 4 process classes", () => {
    expect(resolveProcessCode({ processCode: "NO_PROCESS" } as Record<string, unknown>)).toBe(
      "NO_PROCESS",
    );
    expect(resolveProcessCode({ processCode: "CUT_NORMAL" } as Record<string, unknown>)).toBe(
      "CUT_NORMAL",
    );
    expect(resolveProcessCode({ processCode: "cut_slow" } as Record<string, unknown>)).toBe(
      "CUT_SLOW",
    );
    expect(resolveProcessCode({ processCode: "MARK" } as Record<string, unknown>)).toBe("MARK");
  });

  test("prefers entity-level process over part-level fallback", () => {
    expect(
      resolveProcessCode(
        { processCode: "NO_PROCESS" } as Record<string, unknown>,
        { processCode: "CUT_NORMAL" } as Record<string, unknown>,
      ),
    ).toBe("NO_PROCESS");
  });

  test("defaults to CUT_NORMAL when processCode is missing or invalid", () => {
    expect(resolveProcessCode({ processCode: "UNKNOWN_CODE" } as Record<string, unknown>)).toBe(
      "CUT_NORMAL",
    );
    expect(resolveProcessCode({} as Record<string, unknown>)).toBe("CUT_NORMAL");
  });

  test("does not read removed legacy fields processType/channelport", () => {
    expect(
      resolveProcessCode({ processType: "MARK", channelport: 3 } as Record<string, unknown>),
    ).toBe("CUT_NORMAL");
    expect(
      resolveProcessCode(
        {} as Record<string, unknown>,
        { processType: "NO_PROCESS", channelport: 0 } as Record<string, unknown>,
      ),
    ).toBe("CUT_NORMAL");
  });

  test("maps process colors for all four classes", () => {
    expect(resolveProcessStrokeColor("NO_PROCESS")).toBe("#ffffff");
    expect(resolveProcessStrokeColor("CUT_NORMAL")).toBe("#22c55e");
    expect(resolveProcessStrokeColor("CUT_SLOW")).toBe("#facc15");
    expect(resolveProcessStrokeColor("MARK")).toBe("#22d3ee");
  });
});

describe("toCadEntitiesFromPrtsPart", () => {
  test("injects processCode and partColor from part-level processCode", () => {
    const entities = toCadEntitiesFromPrtsPart(
      {
        id: "part-A",
        processCode: "MARK",
        entities: [
          {
            id: "ent-1",
            type: "line",
            start: { x: 0, y: 0 },
            end: { x: 10, y: 0 },
          },
        ],
      },
      "part-A",
    );

    expect(entities).toHaveLength(1);
    expect(entities[0].processCode).toBe("MARK");
    expect(entities[0].partColor).toBe("#22d3ee");
  });

  test("entity-level processCode overrides part-level processCode", () => {
    const entities = toCadEntitiesFromPrtsPart(
      {
        id: "part-B",
        processCode: "MARK",
        entities: [
          {
            id: "ent-2",
            type: "lwpolyline",
            processCode: "CUT_NORMAL",
            points: [
              { x: 0, y: 0 },
              { x: 20, y: 0 },
              { x: 20, y: 10 },
            ],
            polyflag: 1,
          },
        ],
      },
      "part-B",
    );

    expect(entities).toHaveLength(1);
    expect(entities[0].processCode).toBe("CUT_NORMAL");
    expect(entities[0].partColor).toBe("#22c55e");
  });

  test("fallback contour inherits part-level no-process semantics", () => {
    const entities = toCadEntitiesFromPrtsPart(
      {
        id: "part-C",
        processCode: "NO_PROCESS",
        contour: [
          { x: 0, y: 0 },
          { x: 30, y: 0 },
          { x: 30, y: 20 },
          { x: 0, y: 20 },
        ],
      },
      "part-C",
    );

    expect(entities).toHaveLength(1);
    expect(entities[0].processCode).toBe("NO_PROCESS");
    expect(entities[0].partColor).toBe("#ffffff");
  });
});
