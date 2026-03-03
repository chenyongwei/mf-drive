import type { Entity } from "../../lib/webgpu/EntityToVertices";

export type CadFileType = "DXF" | "PRTS";
export type CadFileDisplayType = CadFileType | "PDF";
export type CadFileSourceKind = "upload-dxf" | "upload-prts" | "pdf-extract";
export type FileExtendedAttribute = {
  key: string;
  value: string;
  confidence?: number;
  source?: "text" | "ocr" | "mixed";
};
export type FileExtractionMeta = {
  inputKind?: "pdf" | "image";
  confidence?: number;
  warnings?: string[];
};

export interface FileData {
  id: string;
  name: string;
  type: CadFileType;
  displayType?: CadFileDisplayType;
  sourceKind?: CadFileSourceKind;
  extendedAttributes?: FileExtendedAttribute[];
  extractionMeta?: FileExtractionMeta;
  fileId?: string;
  partId?: string;
  quantity?: number;
  contour?: Point2D[];
  bbox?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  createdAt?: string;
  status?: "uploading" | "parsing" | "ready" | "error";
}

export type Point2D = { x: number; y: number };
export type ProcessCode = "NO_PROCESS" | "CUT_NORMAL" | "CUT_SLOW" | "MARK";

const FILE_STATUSES: FileData["status"][] = [
  "uploading",
  "parsing",
  "ready",
  "error",
];

const PROCESS_STROKE_BY_CODE: Record<ProcessCode, string> = {
  NO_PROCESS: "#ffffff",
  CUT_NORMAL: "#22c55e",
  CUT_SLOW: "#facc15",
  MARK: "#22d3ee",
};

export function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

export function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toFileStatus(value: unknown): FileData["status"] | undefined {
  if (typeof value !== "string") return undefined;
  return FILE_STATUSES.find((status) => status === value);
}

export function toFiniteNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function toPoint2D(value: unknown): Point2D | null {
  const record = toRecord(value);
  if (!record) return null;
  const x = toFiniteNumber(record.x);
  const y = toFiniteNumber(record.y);
  if (x === null || y === null) return null;
  return { x, y };
}

function toBoundingBox(
  value: unknown,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const record = toRecord(value);
  if (!record) return null;
  const minX = toFiniteNumber(record.minX);
  const minY = toFiniteNumber(record.minY);
  const maxX = toFiniteNumber(record.maxX);
  const maxY = toFiniteNumber(record.maxY);
  if (minX === null || minY === null || maxX === null || maxY === null) return null;
  return { minX, minY, maxX, maxY };
}

export function toContourPoints(value: unknown): Point2D[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((point) => toPoint2D(point))
    .filter((point): point is Point2D => Boolean(point));
}

function normalizeProcessCode(value: unknown): ProcessCode | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (!normalized) return null;
  if (normalized === "NO_PROCESS") return "NO_PROCESS";
  if (normalized === "CUT_NORMAL") return "CUT_NORMAL";
  if (normalized === "CUT_SLOW") return "CUT_SLOW";
  if (normalized === "MARK") return "MARK";
  return null;
}

function extractRecordProcessCode(record: Record<string, unknown> | null): ProcessCode | null {
  if (!record) return null;
  const propertiesRecord = toRecord(record.properties);
  return (
    normalizeProcessCode(record.processCode) ??
    normalizeProcessCode(propertiesRecord?.processCode) ??
    null
  );
}

function resolveProcessCodeFromRecord(
  record: Record<string, unknown> | null | undefined,
): ProcessCode | null {
  const safeRecord = record ?? null;
  return extractRecordProcessCode(safeRecord);
}

export function resolveProcessCode(
  source: Record<string, unknown> | null | undefined,
  fallbackSource?: Record<string, unknown> | null | undefined,
): ProcessCode {
  return (
    resolveProcessCodeFromRecord(source) ??
    resolveProcessCodeFromRecord(fallbackSource) ??
    "CUT_NORMAL"
  );
}

export function resolveProcessStrokeColor(processCode: ProcessCode): string {
  return PROCESS_STROKE_BY_CODE[processCode] ?? PROCESS_STROKE_BY_CODE.CUT_NORMAL;
}

export function resolvePrtsPrimaryId(value: unknown): string | null {
  const record = toRecord(value);
  if (!record) return null;
  return (
    asNonEmptyString(record.partId) ||
    asNonEmptyString(record.id) ||
    asNonEmptyString(record.fileId)
  );
}

export function normalizeDxfFileData(value: unknown): FileData | null {
  const record = toRecord(value);
  if (!record) return null;
  const id = asNonEmptyString(record.id) || asNonEmptyString(record.fileId);
  if (!id) return null;
  return {
    id,
    name: asNonEmptyString(record.originalName) || asNonEmptyString(record.name) || id,
    type: "DXF",
    fileId: asNonEmptyString(record.fileId) || id,
    createdAt: asNonEmptyString(record.createdAt) || undefined,
    status: toFileStatus(record.status),
  };
}

export function normalizePrtsFileData(value: unknown): FileData | null {
  const record = toRecord(value);
  if (!record) return null;
  const id = resolvePrtsPrimaryId(record);
  if (!id) return null;
  const quantityRaw = toFiniteNumber(record.quantity);
  const quantity =
    quantityRaw !== null && quantityRaw > 0
      ? Math.max(1, Math.min(9999, Math.floor(quantityRaw)))
      : 1;
  const contour = toContourPoints(record.contour);
  const bbox =
    toBoundingBox(record.bbox) ??
    toBoundingBox(record.boundingBox) ??
    toBoundingBox(toRecord(record.geometry)?.boundingBox);
  return {
    id,
    name:
      asNonEmptyString(record.originalName) ||
      asNonEmptyString(record.name) ||
      asNonEmptyString(record.partId) ||
      id,
    type: "PRTS",
    fileId: asNonEmptyString(record.fileId) || asNonEmptyString(record.id) || id,
    partId: asNonEmptyString(record.partId) || asNonEmptyString(record.id) || id,
    quantity,
    contour: contour.length > 0 ? contour : undefined,
    bbox: bbox ?? undefined,
    createdAt: asNonEmptyString(record.createdAt) || undefined,
    status: toFileStatus(record.status) || "ready",
  };
}

function prtsEntityToCadEntity(
  value: unknown,
  fallbackPartId: string,
  index: number,
  partRecord: Record<string, unknown>,
): Entity | null {
  const record = toRecord(value);
  if (!record) return null;

  const type = asNonEmptyString(record.type)?.toLowerCase();
  if (!type) return null;

  const entityId = asNonEmptyString(record.id) || `${fallbackPartId}-entity-${index + 1}`;
  const geometry = toRecord(record.geometry);
  const processCode = resolveProcessCode(record, partRecord);
  const partColor = resolveProcessStrokeColor(processCode);
  const isInnerContour = Boolean(record.isInnerContour);
  const baseEntity: Pick<
    Entity,
    "color" | "isPart" | "partIds" | "layer" | "processCode" | "partColor"
  > = {
    color: 3,
    isPart: true,
    partIds: [fallbackPartId],
    layer: "0",
    processCode,
    partColor,
  };

  if (type === "lwpolyline" || type === "polyline") {
    const points = toContourPoints(record.points ?? geometry?.points);
    if (points.length < 2) return null;
    const closed = Number(record.polyflag) === 1 || Boolean(geometry?.closed);
    return {
      id: entityId,
      type: "LWPOLYLINE",
      ...baseEntity,
      isInnerContour,
      geometry: { points, closed },
    };
  }

  if (type === "line") {
    const start = toPoint2D(record.start ?? geometry?.start);
    const end = toPoint2D(record.end ?? geometry?.end);
    if (!start || !end) return null;
    return {
      id: entityId,
      type: "LINE",
      ...baseEntity,
      isInnerContour,
      geometry: { start, end },
    };
  }

  if (type === "circle") {
    const center = toPoint2D(record.center ?? geometry?.center);
    const radius = toFiniteNumber(record.radius ?? geometry?.radius);
    if (!center || radius === null || radius <= 0) return null;
    return {
      id: entityId,
      type: "CIRCLE",
      ...baseEntity,
      isInnerContour,
      geometry: { center, radius, closed: true },
    };
  }

  if (type === "arc") {
    const center = toPoint2D(record.center ?? geometry?.center);
    const radius = toFiniteNumber(record.radius ?? geometry?.radius);
    if (!center || radius === null || radius <= 0) return null;
    const startAngle = toFiniteNumber(record.startangle ?? geometry?.startAngle) ?? 0;
    const anglesweep = toFiniteNumber(record.anglesweep);
    const endAngle =
      toFiniteNumber(record.endangle ?? geometry?.endAngle) ??
      startAngle +
        (anglesweep !== null ? anglesweep : 2 * Math.PI);
    return {
      id: entityId,
      type: "ARC",
      ...baseEntity,
      isInnerContour,
      geometry: { center, radius, startAngle, endAngle },
    };
  }

  return null;
}

function contourFallbackEntity(
  partRecord: Record<string, unknown>,
  fallbackPartId: string,
): Entity | null {
  const contour = toContourPoints(partRecord.contour);
  if (contour.length < 3) return null;
  const processCode = resolveProcessCode(partRecord, null);
  return {
    id: `${fallbackPartId}-contour`,
    type: "LWPOLYLINE",
    color: 3,
    isPart: true,
    partIds: [fallbackPartId],
    processCode,
    partColor: resolveProcessStrokeColor(processCode),
    layer: "0",
    geometry: {
      points: contour,
      closed: true,
    },
  };
}

export function toCadEntitiesFromPrtsPart(
  value: unknown,
  fallbackPartId: string,
): Entity[] {
  const partRecord = toRecord(value);
  if (!partRecord) return [];

  const partId = resolvePrtsPrimaryId(partRecord) || fallbackPartId;
  const entities = Array.isArray(partRecord.entities)
    ? partRecord.entities
        .map((entity, index) => prtsEntityToCadEntity(entity, partId, index, partRecord))
        .filter((entity): entity is Entity => Boolean(entity))
    : [];
  if (entities.length > 0) return entities;

  const fallback = contourFallbackEntity(partRecord, partId);
  return fallback ? [fallback] : [];
}

export function upsertByContourId<T extends { contourId: string }>(
  collection: T[],
  value: T,
): T[] {
  const index = collection.findIndex((item) => item.contourId === value.contourId);
  if (index < 0) {
    return [...collection, value];
  }
  const next = collection.slice();
  next[index] = value;
  return next;
}

export function contourCenter(points: Point2D[]): Point2D {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

const POINT_DEDUP_TOLERANCE = 1e-4;

function pointsCloseLocal(a: Point2D, b: Point2D, tolerance = POINT_DEDUP_TOLERANCE): boolean {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

export function uniquePoints(points: Point2D[]): Point2D[] {
  const deduped: Point2D[] = [];
  points.forEach((point) => {
    if (!deduped.some((candidate) => pointsCloseLocal(candidate, point))) {
      deduped.push(point);
    }
  });
  return deduped;
}

export function isNonPartGraphicEntityCandidate(entity: Entity): boolean {
  const hasPartIds = Array.isArray(entity.partIds) && entity.partIds.length > 0;
  return !entity.isPart && !hasPartIds;
}

export function isTextCadEntity(entity: Entity): boolean {
  const normalizedType = String(entity.type ?? "").toUpperCase();
  return normalizedType === "TEXT" || normalizedType === "MTEXT";
}
