import { useCallback } from "react";
import type {
  DrawingPdfCadEntity,
  DrawingPdfExtractResult,
  DrawingPdfTableAttribute,
  DrawingPdfTitleBlock,
} from "@platform/contracts/generated/http";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import {
  extractPdfDrawing,
  isSupportedDrawingDocument,
} from "../../../services/api/pdf-extract";
import {
  asNonEmptyString,
  normalizeDxfFileData,
  normalizePrtsFileData,
  toContourPoints,
  toFileStatus,
  toFiniteNumber,
  toPoint2D,
  toRecord,
  type FileData,
  type FileExtendedAttribute,
} from "../CADPageLayout.file-utils";

interface UseCadFileUploadActionsOptions {
  allowedFileTypes: ("DXF" | "PRTS" | "PDF")[];
  getTestModeParams: () => string;
  waitForDxfFileReady: (fileId: string, maxAttempts?: number, intervalMs?: number) => Promise<boolean>;
  refreshFileEntities: (fileId: string, fileOverride?: FileData) => Promise<void>;
  setFiles: (updater: (prev: FileData[]) => FileData[]) => void;
  setCheckedFileIds: (updater: (prev: Set<string>) => Set<string>) => void;
  setEntitiesMap: (updater: (prev: Record<string, Entity[]>) => Record<string, Entity[]>) => void;
  setSelectedFileId: (value: string | null) => void;
  setPreferredLayoutAnchorFileId: (value: string | null) => void;
}

function normalizedText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumberOrUndefined(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function dedupeAttributes(attributes: FileExtendedAttribute[]): FileExtendedAttribute[] {
  const indexByKey = new Map<string, number>();
  const result: FileExtendedAttribute[] = [];

  attributes.forEach((attribute) => {
    const key = normalizedText(attribute.key);
    const value = normalizedText(attribute.value);
    if (!key || !value) return;

    const normalizedKey = key.toLowerCase();
    const incomingConfidence = Number.isFinite(Number(attribute.confidence))
      ? Number(attribute.confidence)
      : -1;
    const currentIndex = indexByKey.get(normalizedKey);
    if (currentIndex === undefined) {
      indexByKey.set(normalizedKey, result.length);
      result.push({
        key,
        value,
        ...(Number.isFinite(incomingConfidence) && incomingConfidence >= 0 ? { confidence: incomingConfidence } : {}),
        ...(attribute.source ? { source: attribute.source } : {}),
      });
      return;
    }

    const existing = result[currentIndex];
    const existingConfidence = Number.isFinite(Number(existing.confidence))
      ? Number(existing.confidence)
      : -1;
    if (incomingConfidence > existingConfidence) {
      result[currentIndex] = {
        key,
        value,
        ...(Number.isFinite(incomingConfidence) && incomingConfidence >= 0 ? { confidence: incomingConfidence } : {}),
        ...(attribute.source ? { source: attribute.source } : {}),
      };
    }
  });

  return result;
}

function normalizeTableAttributes(attributes: DrawingPdfTableAttribute[]): FileExtendedAttribute[] {
  return attributes
    .map((attribute) => {
      const key = normalizedText(attribute.key);
      const value = normalizedText(attribute.value);
      if (!key || !value) return null;
      return {
        key,
        value,
        ...(Number.isFinite(Number(attribute.confidence))
          ? { confidence: Number(attribute.confidence) }
          : {}),
        ...(attribute.source ? { source: attribute.source } : {}),
      } satisfies FileExtendedAttribute;
    })
    .filter((attribute): attribute is FileExtendedAttribute => Boolean(attribute));
}

const TITLE_BLOCK_FALLBACK_KEYS: Array<{ field: keyof DrawingPdfTitleBlock; key: string }> = [
  { field: "drawingNo", key: "图号" },
  { field: "partName", key: "零件名称" },
  { field: "projectName", key: "项目名称" },
  { field: "material", key: "材料" },
  { field: "surfaceTreatment", key: "表面处理" },
  { field: "quantity", key: "数量" },
  { field: "revision", key: "版本" },
  { field: "date", key: "日期" },
];

function fallbackAttributesFromTitleBlock(
  titleBlock: DrawingPdfTitleBlock,
  source: "text" | "ocr" | "mixed",
  fieldConfidence: Record<string, unknown>,
): FileExtendedAttribute[] {
  return TITLE_BLOCK_FALLBACK_KEYS
    .map(({ field, key }) => {
      const value = normalizedText(titleBlock[field]);
      if (!value) return null;
      const confidence = toNumberOrUndefined(fieldConfidence[field]);
      return {
        key,
        value,
        ...(confidence !== undefined ? { confidence } : {}),
        source,
      } satisfies FileExtendedAttribute;
    })
    .filter((attribute): attribute is FileExtendedAttribute => Boolean(attribute));
}

function resolveExtendedAttributes(result: DrawingPdfExtractResult): FileExtendedAttribute[] {
  const tableAttributes = Array.isArray(result.table?.attributes)
    ? normalizeTableAttributes(result.table.attributes)
    : [];
  if (tableAttributes.length > 0) {
    return dedupeAttributes(tableAttributes);
  }
  const titleBlock = toRecord(result.table?.titleBlock) as DrawingPdfTitleBlock | null;
  const fieldConfidence = toRecord(result.table?.fieldConfidence) ?? {};
  if (!titleBlock) return [];
  return dedupeAttributes(
    fallbackAttributesFromTitleBlock(titleBlock, result.source, fieldConfidence),
  );
}

function mapPdfCadEntity(
  fileId: string,
  candidate: DrawingPdfCadEntity,
  index: number,
): Entity | null {
  const entityId = normalizedText(candidate.id) || `${fileId}-entity-${index + 1}`;
  const geometry = toRecord(candidate.geometry);
  if (!geometry) return null;
  const type = normalizedText(candidate.type).toUpperCase();

  if (type === "LINE") {
    const start = toPoint2D(geometry.start);
    const end = toPoint2D(geometry.end);
    if (!start || !end) return null;
    return {
      id: entityId,
      type: "LINE",
      fileId,
      layer: "0",
      color: 3,
      geometry: { start, end },
    };
  }

  if (type === "ARC") {
    const center = toPoint2D(geometry.center);
    const radius = toFiniteNumber(geometry.radius);
    if (center && radius !== null && radius > 0) {
      const startAngle = toFiniteNumber(geometry.startAngle) ?? 0;
      const endAngle = toFiniteNumber(geometry.endAngle) ?? 2 * Math.PI;
      return {
        id: entityId,
        type: "ARC",
        fileId,
        layer: "0",
        color: 3,
        geometry: { center, radius, startAngle, endAngle },
      };
    }

    const sampledPoints = toContourPoints(geometry.points);
    if (sampledPoints.length < 2) return null;
    return {
      id: entityId,
      type: "LWPOLYLINE",
      fileId,
      layer: "0",
      color: 3,
      geometry: {
        points: sampledPoints,
        closed: Boolean(geometry.closed ?? candidate.closed),
      },
    };
  }

  if (type === "POLYLINE" || type === "LWPOLYLINE") {
    const points = toContourPoints(geometry.points);
    if (points.length < 2) return null;
    return {
      id: entityId,
      type: "LWPOLYLINE",
      fileId,
      layer: "0",
      color: 3,
      geometry: {
        points,
        closed: Boolean(geometry.closed ?? candidate.closed),
      },
    };
  }

  return null;
}

function mapPdfCadEntities(fileId: string, result: DrawingPdfExtractResult): Entity[] {
  const sourceEntities = Array.isArray(result.cad?.entities) ? result.cad.entities : [];
  const mappedEntities = sourceEntities
    .map((candidate, index) => mapPdfCadEntity(fileId, candidate, index))
    .filter((entity): entity is Entity => Boolean(entity));

  if (mappedEntities.length > 0) {
    return mappedEntities;
  }

  const pageRecord = toRecord(result.cad?.page);
  const width = toFiniteNumber(pageRecord?.width);
  const height = toFiniteNumber(pageRecord?.height);
  if (width === null || height === null || width <= 0 || height <= 0) {
    return mappedEntities;
  }

  // Fallback: preserve visual presence for CAD-empty extracted documents.
  return [
    {
      id: `${fileId}-page-frame`,
      type: "LWPOLYLINE",
      fileId,
      layer: "0",
      color: 3,
      geometry: {
        points: [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ],
        closed: true,
      },
    },
  ];
}

function resolvePdfFileName(sourceFile: File, result: DrawingPdfExtractResult): string {
  const titleBlock = toRecord(result.table?.titleBlock) as DrawingPdfTitleBlock | null;
  if (!titleBlock) return sourceFile.name;
  return (
    normalizedText(titleBlock.partName) ||
    normalizedText(titleBlock.drawingNo) ||
    sourceFile.name
  );
}

function toVirtualPdfFile(
  sourceFile: File,
  fileId: string,
  result: DrawingPdfExtractResult,
): FileData {
  const extendedAttributes = resolveExtendedAttributes(result);
  const warnings = Array.isArray(result.warnings)
    ? result.warnings.map((item) => String(item)).filter(Boolean)
    : [];
  const confidence = Number.isFinite(Number(result.confidence))
    ? Number(result.confidence)
    : undefined;

  return {
    id: fileId,
    fileId,
    type: "DXF",
    displayType: "PDF",
    sourceKind: "pdf-extract",
    name: resolvePdfFileName(sourceFile, result),
    createdAt: new Date().toISOString(),
    status: "ready",
    ...(extendedAttributes.length > 0 ? { extendedAttributes } : {}),
    extractionMeta: {
      ...(result.inputKind ? { inputKind: result.inputKind } : {}),
      ...(confidence !== undefined ? { confidence } : {}),
      ...(warnings.length > 0 ? { warnings } : {}),
    },
  };
}

function buildVirtualPdfFileId(fileName: string): string {
  const normalizedName = fileName
    .toLowerCase()
    .replace(/\.(pdf|png|jpe?g|webp|bmp|tiff?)$/u, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `doc-${normalizedName || "extract"}-${suffix}`;
}

export function useCadFileUploadActions({
  allowedFileTypes,
  getTestModeParams,
  waitForDxfFileReady,
  refreshFileEntities,
  setFiles,
  setCheckedFileIds,
  setEntitiesMap,
  setSelectedFileId,
  setPreferredLayoutAnchorFileId,
}: UseCadFileUploadActionsOptions) {
  const handleFileUpload = useCallback(
    async (uploadedFiles: FileList) => {
      const newFiles: FileData[] = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const lowerName = file.name.toLowerCase();
        const isDXF = lowerName.endsWith(".dxf");
        const isPRTS = lowerName.endsWith(".prts");
        const isDrawingDocument = isSupportedDrawingDocument(file);
        const isExtractDocument = !isDXF && !isPRTS && isDrawingDocument;
        if (
          (isDXF && !allowedFileTypes.includes("DXF")) ||
          (isPRTS && !allowedFileTypes.includes("PRTS")) ||
          (isExtractDocument && !allowedFileTypes.includes("PDF")) ||
          (!isDXF && !isPRTS && !isExtractDocument)
        ) {
          continue;
        }

        try {
          const testParams = getTestModeParams();
          if (isExtractDocument) {
            const extractResult = await extractPdfDrawing(file, testParams);
            const firstResult = Array.isArray(extractResult.results)
              ? extractResult.results[0]
              : undefined;
            if (!firstResult) {
              console.error("[CADPageLayout] empty drawing extract result:", extractResult);
              continue;
            }

            const pdfFileId = buildVirtualPdfFileId(file.name);
            const uploaded = toVirtualPdfFile(file, pdfFileId, firstResult);
            const mappedEntities = mapPdfCadEntities(uploaded.id, firstResult);
            newFiles.push(uploaded);
            setCheckedFileIds((prev) => new Set(prev).add(uploaded.id));
            setEntitiesMap((prev) => ({
              ...prev,
              [uploaded.id]: mappedEntities,
            }));
            continue;
          }

          const formData = new FormData();
          formData.append("file", file);
          const uploadEndpoint = `${isDXF ? "/api/drawing/files/upload" : "/api/drawing/files/prts-upload"}${testParams}`;
          const response = await fetch(uploadEndpoint, { method: "POST", body: formData });
          if (!response.ok) {
            console.error("[CADPageLayout] upload failed:", response.status, response.statusText);
            continue;
          }

          const result = await response.json();
          const resultRecord = toRecord(result);
          const normalized = isDXF
            ? normalizeDxfFileData(resultRecord ?? result)
            : normalizePrtsFileData(resultRecord ?? result);
          if (!normalized) {
            const responsePartId = asNonEmptyString(resultRecord?.partId);
            const responseId = asNonEmptyString(resultRecord?.id);
            const responseFileId = asNonEmptyString(resultRecord?.fileId);
            const normalizedId = isDXF
              ? responseFileId || responseId
              : responsePartId || responseId || responseFileId;
            if (!normalizedId) {
              console.error("[CADPageLayout] invalid upload response:", result);
              continue;
            }
            newFiles.push({
              id: normalizedId,
              name: asNonEmptyString(resultRecord?.originalName) || file.name,
              type: isDXF ? "DXF" : "PRTS",
              displayType: isDXF ? "DXF" : "PRTS",
              sourceKind: isDXF ? "upload-dxf" : "upload-prts",
              fileId: responseFileId || normalizedId,
              partId: isDXF ? undefined : responsePartId || responseId || responseFileId || normalizedId,
              quantity: isDXF ? undefined : 1,
              createdAt: asNonEmptyString(resultRecord?.createdAt) || new Date().toISOString(),
              status: toFileStatus(resultRecord?.status),
            });
          } else {
            newFiles.push({
              ...normalized,
              displayType: normalized.type,
              sourceKind: normalized.type === "DXF" ? "upload-dxf" : "upload-prts",
              quantity:
                normalized.type === "PRTS"
                  ? Number.isFinite(Number(normalized.quantity))
                    ? Math.max(1, Math.min(9999, Math.floor(Number(normalized.quantity))))
                    : 1
                  : normalized.quantity,
              name: normalized.name || file.name,
              createdAt: normalized.createdAt || new Date().toISOString(),
              status: normalized.status || toFileStatus(resultRecord?.status),
            });
          }

          const uploaded = newFiles[newFiles.length - 1];
          setCheckedFileIds((prev) => new Set(prev).add(uploaded.id));

          if (uploaded.type === "DXF") {
            const isReady = uploaded.status === "ready" || (await waitForDxfFileReady(uploaded.id));
            if (!isReady) {
              console.warn(`[CADPageLayout] Uploaded DXF not ready in time: ${uploaded.id}`);
            }
          }
          await refreshFileEntities(uploaded.id, uploaded);
        } catch (error) {
          console.error("[CADPageLayout] failed to upload file:", error);
        }
      }

      setFiles((prev) => {
        const updated = [...newFiles, ...prev];
        return updated.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
      });
      if (newFiles.length > 0) {
        setSelectedFileId(newFiles[0].id);
        setPreferredLayoutAnchorFileId(newFiles[0].id);
      }
    },
    [
      allowedFileTypes,
      getTestModeParams,
      waitForDxfFileReady,
      refreshFileEntities,
      setFiles,
      setCheckedFileIds,
      setEntitiesMap,
      setSelectedFileId,
      setPreferredLayoutAnchorFileId,
    ],
  );

  return {
    handleFileUpload,
  };
}
