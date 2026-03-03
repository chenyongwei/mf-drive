import { act, renderHook } from "@testing-library/react";
import type { Entity } from "../../../../lib/webgpu/EntityToVertices";
import type { FileData } from "../../CADPageLayout.file-utils";
import { useCadFileUploadActions } from "../useCadFileUploadActions";

function toFileList(files: File[]): FileList {
  const list: Record<number, File> & {
    length: number;
    item: (index: number) => File | null;
  } = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
  };
  files.forEach((file, index) => {
    list[index] = file;
  });
  return list as unknown as FileList;
}

function createExtractResponse(inputKind: "pdf" | "image", fileName: string) {
  return {
    jobId: "pdf-job-1",
    summary: {
      totalFiles: 1,
      succeeded: 1,
      failed: 0,
      ocrUsedFiles: 0,
      durationMs: 30,
    },
    results: [
      {
        fileName,
        inputKind,
        source: "text",
        confidence: 0.91,
        table: {
          strategyUsed: ["anchor-kv"],
          titleBlock: {
            partName: "支架",
            drawingNo: "DRW-001",
          },
          attributes: [
            { key: "图号", value: "DRW-001", confidence: 0.7, source: "text" },
            { key: "图号", value: "DRW-001-NEW", confidence: 0.9, source: "text" },
          ],
          bomRows: [],
          fieldConfidence: {},
        },
        cad: {
          entities: [
            {
              id: "line-1",
              type: "LINE",
              geometry: {
                start: { x: 0, y: 0 },
                end: { x: 100, y: 0 },
              },
            },
            {
              id: "poly-1",
              type: "POLYLINE",
              geometry: {
                points: [
                  { x: 0, y: 0 },
                  { x: 10, y: 0 },
                  { x: 10, y: 10 },
                ],
                closed: false,
              },
            },
            {
              id: "arc-1",
              type: "ARC",
              geometry: {
                points: [
                  { x: 1, y: 1 },
                  { x: 2, y: 2 },
                  { x: 3, y: 3 },
                ],
              },
            },
          ],
          contours: [],
          stats: {
            entityCount: 3,
            lineCount: 1,
            polylineCount: 1,
            arcCount: 1,
            closedContourCount: 0,
            openContourCount: 0,
          },
          truncated: false,
          page: { width: 1200, height: 800 },
        },
        warnings: ["TITLE_BLOCK_INCOMPLETE"],
        errors: [],
      },
    ],
    errors: [],
  };
}

function parseRequestBody(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0) {
  const call = fetchMock.mock.calls[callIndex];
  const init = call?.[1] as RequestInit | undefined;
  const body = init?.body;
  if (typeof body !== "string") {
    return {};
  }
  return JSON.parse(body) as Record<string, unknown>;
}

describe("useCadFileUploadActions document branch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("uploads pdf via extract api and prepends virtual PDF file into queue", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/drawing/pdf/extract")) {
        return new Response(JSON.stringify(createExtractResponse("pdf", "demo.pdf")), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    let filesState: FileData[] = [];
    let checkedState = new Set<string>();
    let entitiesState: Record<string, Entity[]> = {};
    let selectedFileIdState: string | null = null;
    let preferredAnchorState: string | null = null;

    const refreshFileEntities = vi.fn(async () => undefined);
    const setFiles = vi.fn((updater: (prev: FileData[]) => FileData[]) => {
      filesState = updater(filesState);
    });
    const setCheckedFileIds = vi.fn((updater: (prev: Set<string>) => Set<string>) => {
      checkedState = updater(checkedState);
    });
    const setEntitiesMap = vi.fn((updater: (prev: Record<string, Entity[]>) => Record<string, Entity[]>) => {
      entitiesState = updater(entitiesState);
    });
    const setSelectedFileId = vi.fn((value: string | null) => {
      selectedFileIdState = value;
    });
    const setPreferredLayoutAnchorFileId = vi.fn((value: string | null) => {
      preferredAnchorState = value;
    });

    const { result } = renderHook(() =>
      useCadFileUploadActions({
        allowedFileTypes: ["DXF", "PDF"],
        getTestModeParams: () => "",
        waitForDxfFileReady: async () => true,
        refreshFileEntities,
        setFiles,
        setCheckedFileIds,
        setEntitiesMap,
        setSelectedFileId,
        setPreferredLayoutAnchorFileId,
      }),
    );

    const pdfFile = new File(["fake-pdf-binary"], "demo.pdf", { type: "application/pdf" });
    await act(async () => {
      await result.current.handleFileUpload(toFileList([pdfFile]));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/drawing/pdf/extract",
      expect.objectContaining({ method: "POST" }),
    );
    const payload = parseRequestBody(fetchMock);
    expect((payload.files as Array<Record<string, unknown>>)[0]?.mimeType).toBe("application/pdf");
    expect(filesState[0]?.displayType).toBe("PDF");
    expect(filesState[0]?.sourceKind).toBe("pdf-extract");
    expect(filesState[0]?.name).toBe("支架");
    expect(filesState[0]?.extendedAttributes).toEqual([
      expect.objectContaining({ key: "图号", value: "DRW-001-NEW", confidence: 0.9 }),
    ]);

    expect(selectedFileIdState).toBe(filesState[0]?.id);
    expect(preferredAnchorState).toBe(filesState[0]?.id);
    expect(checkedState.has(filesState[0]!.id)).toBe(true);
    expect(refreshFileEntities).not.toHaveBeenCalled();

    const mapped = entitiesState[filesState[0]!.id] ?? [];
    expect(mapped.some((entity) => entity.type === "LINE")).toBe(true);
    expect(mapped.some((entity) => entity.type === "LWPOLYLINE")).toBe(true);
  });

  test("uploads png via extract api and sends image mime type", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/drawing/pdf/extract")) {
        return new Response(JSON.stringify(createExtractResponse("image", "image.png")), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    let filesState: FileData[] = [];
    let entitiesState: Record<string, Entity[]> = {};

    const { result } = renderHook(() =>
      useCadFileUploadActions({
        allowedFileTypes: ["DXF", "PDF"],
        getTestModeParams: () => "",
        waitForDxfFileReady: async () => true,
        refreshFileEntities: async () => undefined,
        setFiles: (updater) => {
          filesState = updater(filesState);
        },
        setCheckedFileIds: () => undefined,
        setEntitiesMap: (updater) => {
          entitiesState = updater(entitiesState);
        },
        setSelectedFileId: () => undefined,
        setPreferredLayoutAnchorFileId: () => undefined,
      }),
    );

    const pngFile = new File(["fake-image-binary"], "demo.png", { type: "image/png" });
    await act(async () => {
      await result.current.handleFileUpload(toFileList([pngFile]));
    });

    const payload = parseRequestBody(fetchMock);
    expect((payload.files as Array<Record<string, unknown>>)[0]?.mimeType).toBe("image/png");
    expect(filesState[0]?.displayType).toBe("PDF");
    expect(filesState[0]?.extractionMeta?.inputKind).toBe("image");
    expect(Object.values(entitiesState).flat().length).toBeGreaterThan(0);
  });

  test("adds page-frame fallback entity when extracted document has no cad entities", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/drawing/pdf/extract")) {
        return new Response(
          JSON.stringify({
            ...createExtractResponse("pdf", "empty.pdf"),
            results: [
              {
                ...createExtractResponse("pdf", "empty.pdf").results[0],
                cad: {
                  entities: [],
                  contours: [],
                  stats: {
                    entityCount: 0,
                    lineCount: 0,
                    polylineCount: 0,
                    arcCount: 0,
                    closedContourCount: 0,
                    openContourCount: 0,
                  },
                  truncated: false,
                  page: { width: 1000, height: 500 },
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    let filesState: FileData[] = [];
    let entitiesState: Record<string, Entity[]> = {};

    const { result } = renderHook(() =>
      useCadFileUploadActions({
        allowedFileTypes: ["DXF", "PDF"],
        getTestModeParams: () => "",
        waitForDxfFileReady: async () => true,
        refreshFileEntities: async () => undefined,
        setFiles: (updater) => {
          filesState = updater(filesState);
        },
        setCheckedFileIds: () => undefined,
        setEntitiesMap: (updater) => {
          entitiesState = updater(entitiesState);
        },
        setSelectedFileId: () => undefined,
        setPreferredLayoutAnchorFileId: () => undefined,
      }),
    );

    const pdfFile = new File(["empty"], "empty.pdf", { type: "application/pdf" });
    await act(async () => {
      await result.current.handleFileUpload(toFileList([pdfFile]));
    });

    const mapped = entitiesState[filesState[0]?.id ?? ""] ?? [];
    expect(mapped).toHaveLength(1);
    expect(mapped[0]?.type).toBe("LWPOLYLINE");
    expect(mapped[0]?.geometry).toEqual(
      expect.objectContaining({
        closed: true,
        points: [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
          { x: 1000, y: 500 },
          { x: 0, y: 500 },
        ],
      }),
    );
  });

  test("document extract failure does not block normal dxf upload flow", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/drawing/pdf/extract")) {
        return new Response(
          JSON.stringify({ error: "PDF_EXTRACT_FAILED", message: "failed to parse pdf" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("/api/drawing/files/upload")) {
        return new Response(
          JSON.stringify({
            id: "file-123",
            fileId: "file-123",
            originalName: "part.dxf",
            status: "ready",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    let filesState: FileData[] = [];
    let checkedState = new Set<string>();
    const refreshFileEntities = vi.fn(async () => undefined);

    const { result } = renderHook(() =>
      useCadFileUploadActions({
        allowedFileTypes: ["DXF", "PDF"],
        getTestModeParams: () => "",
        waitForDxfFileReady: async () => true,
        refreshFileEntities,
        setFiles: (updater) => {
          filesState = updater(filesState);
        },
        setCheckedFileIds: (updater) => {
          checkedState = updater(checkedState);
        },
        setEntitiesMap: () => undefined,
        setSelectedFileId: () => undefined,
        setPreferredLayoutAnchorFileId: () => undefined,
      }),
    );

    const pdfFile = new File(["broken-pdf"], "broken.pdf", { type: "application/pdf" });
    const dxfFile = new File(["dxf"], "part.dxf", { type: "application/dxf" });
    await act(async () => {
      await result.current.handleFileUpload(toFileList([pdfFile, dxfFile]));
    });

    expect(filesState).toHaveLength(1);
    expect(filesState[0].type).toBe("DXF");
    expect(filesState[0].displayType).toBe("DXF");
    expect(filesState[0].sourceKind).toBe("upload-dxf");
    expect(checkedState.has(filesState[0].id)).toBe(true);
    expect(refreshFileEntities).toHaveBeenCalledWith("file-123", expect.any(Object));
  });
});
