import { HttpResponse, passthrough } from 'msw';
import { compatState } from '../compatState';

export function json<T>(body: T, status = 200): HttpResponse {
  return HttpResponse.json(body, { status });
}

export function getPagination(total: number, page: number, limit: number) {
  const safeLimit = Math.max(1, limit);
  const safePage = Math.max(1, page);
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export function parseUrl(request: Request): URL {
  return new URL(request.url);
}

const BACKEND_EDIT_COMMANDS = new Set([
  'trim',
  'extend',
  'delete',
  'explode',
  'create',
  'move',
  'update-text',
]);

const ALWAYS_BACKEND_EDIT_COMMANDS = new Set([
  'explode',
  'trim',
  'extend',
  'create',
  'delete',
  'move',
  'update-text',
]);

export function mockAlgoMode(): 'msw' | 'backend' {
  return import.meta.env.VITE_MOCK_ALGO_MODE === 'backend' ? 'backend' : 'msw';
}

export function shouldPassthroughEditCommand(command: unknown): boolean {
  if (typeof command !== 'string') return false;
  const normalized = command.trim().toLowerCase();
  if (ALWAYS_BACKEND_EDIT_COMMANDS.has(normalized)) {
    return true;
  }
  if (mockAlgoMode() !== 'backend') return false;
  return BACKEND_EDIT_COMMANDS.has(normalized);
}

export function toNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

type CompatPoint = { x: number; y: number };
type CompatBoundingBox = { minX: number; minY: number; maxX: number; maxY: number };
type ProcessCode = 'NO_PROCESS' | 'CUT_NORMAL' | 'CUT_SLOW' | 'MARK';

type CompatPartRecord = (typeof compatState.parts)[number] & {
  partId?: string;
  originalName?: string;
  originalFilename?: string;
  processCode?: string;
  quantity?: number;
  entityCount?: number;
  createdAt?: string;
  bbox?: CompatBoundingBox;
  geometry?: {
    boundingBox?: CompatBoundingBox;
    area?: number;
  };
  entities?: Array<Record<string, unknown>>;
};

function normalizeProcessCode(value: unknown): ProcessCode | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized === 'NO_PROCESS') return 'NO_PROCESS';
  if (normalized === 'CUT_NORMAL') return 'CUT_NORMAL';
  if (normalized === 'CUT_SLOW') return 'CUT_SLOW';
  if (normalized === 'MARK') return 'MARK';
  return null;
}

function resolvePartProcessCode(part: CompatPartRecord): ProcessCode {
  return normalizeProcessCode(part.processCode) ?? 'CUT_NORMAL';
}

function resolvePartQuantity(part: CompatPartRecord): number {
  const raw = Number(part.quantity);
  if (!Number.isFinite(raw)) return 1;
  const integer = Math.floor(raw);
  if (integer < 1) return 1;
  if (integer > 9999) return 9999;
  return integer;
}

function toPoint(value: unknown): CompatPoint | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { x?: unknown; y?: unknown };
  const x = Number(candidate.x);
  const y = Number(candidate.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function normalizeContour(value: unknown): CompatPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((point) => toPoint(point))
    .filter((point): point is CompatPoint => Boolean(point));
}

function isValidBoundingBox(value: unknown): value is CompatBoundingBox {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CompatBoundingBox>;
  return (
    Number.isFinite(candidate.minX) &&
    Number.isFinite(candidate.minY) &&
    Number.isFinite(candidate.maxX) &&
    Number.isFinite(candidate.maxY)
  );
}

function boundingBoxFromContour(contour: CompatPoint[]): CompatBoundingBox {
  if (contour.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  contour.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  return { minX, minY, maxX, maxY };
}

function areaFromContour(contour: CompatPoint[]): number {
  if (contour.length < 3) return 0;
  let sum = 0;
  for (let index = 0; index < contour.length; index += 1) {
    const current = contour[index];
    const next = contour[(index + 1) % contour.length];
    sum += current.x * next.y - next.x * current.y;
  }
  return Math.abs(sum) / 2;
}

function buildPartEntitiesFromContour(
  partId: string,
  contour: CompatPoint[],
  processCode: ProcessCode,
) {
  if (contour.length < 3) return [];
  return [
    {
      id: `${partId}-outer`,
      type: 'lwpolyline',
      points: contour,
      polyflag: 1,
      processCode,
    },
  ];
}

function normalizePartEntities(
  entitiesInput: unknown,
  contour: CompatPoint[],
  partId: string,
  partProcessCode: ProcessCode,
): Array<Record<string, unknown>> {
  if (!Array.isArray(entitiesInput) || entitiesInput.length === 0) {
    return buildPartEntitiesFromContour(partId, contour, partProcessCode);
  }

  const entities = entitiesInput
    .map((rawEntity, index) => {
      if (!rawEntity || typeof rawEntity !== 'object') return null;
      const entity = rawEntity as Record<string, unknown>;
      const type = String(entity.type ?? '').toLowerCase();
      const id = String(entity.id ?? `${partId}-entity-${index + 1}`);
      const processCode = normalizeProcessCode(entity.processCode) ?? partProcessCode;

      if (type === 'lwpolyline' || type === 'polyline') {
        const points = normalizeContour(
          entity.points ?? (entity.geometry as { points?: unknown } | undefined)?.points,
        );
        if (points.length < 2) return null;
        const closed =
          Number(entity.polyflag) === 1 ||
          Boolean((entity.geometry as { closed?: unknown } | undefined)?.closed);
        return {
          id,
          type: 'lwpolyline',
          points,
          polyflag: closed ? 1 : 0,
          processCode,
          ...(entity.isInnerContour ? { isInnerContour: true } : {}),
        };
      }

      if (type === 'line') {
        const start = toPoint(entity.start ?? (entity.geometry as { start?: unknown } | undefined)?.start);
        const end = toPoint(entity.end ?? (entity.geometry as { end?: unknown } | undefined)?.end);
        if (!start || !end) return null;
        return { id, type: 'line', start, end, processCode };
      }

      if (type === 'circle') {
        const center = toPoint(entity.center ?? (entity.geometry as { center?: unknown } | undefined)?.center);
        const radius = Number(entity.radius ?? (entity.geometry as { radius?: unknown } | undefined)?.radius);
        if (!center || !Number.isFinite(radius) || radius <= 0) return null;
        return { id, type: 'circle', center, radius, processCode };
      }

      if (type === 'arc') {
        const center = toPoint(entity.center ?? (entity.geometry as { center?: unknown } | undefined)?.center);
        const radius = Number(entity.radius ?? (entity.geometry as { radius?: unknown } | undefined)?.radius);
        if (!center || !Number.isFinite(radius) || radius <= 0) return null;
        const startangle = Number(
          entity.startangle ?? (entity.geometry as { startAngle?: unknown } | undefined)?.startAngle ?? 0,
        );
        const endAngle = Number(entity.endangle ?? (entity.geometry as { endAngle?: unknown } | undefined)?.endAngle);
        const anglesweep = Number.isFinite(endAngle) ? endAngle - startangle : Number(entity.anglesweep ?? 0);
        return { id, type: 'arc', center, radius, startangle, anglesweep, processCode };
      }

      return null;
    })
    .filter((value): value is Record<string, unknown> => Boolean(value));

  if (entities.length > 0) return entities;
  return buildPartEntitiesFromContour(partId, contour, partProcessCode);
}

function resolvePartBoundingBox(part: CompatPartRecord, contour: CompatPoint[]): CompatBoundingBox {
  if (isValidBoundingBox(part.bbox)) return part.bbox;
  if (isValidBoundingBox(part.geometry?.boundingBox)) return part.geometry.boundingBox;
  return boundingBoxFromContour(contour);
}

function resolvePartArea(part: CompatPartRecord, contour: CompatPoint[], bbox: CompatBoundingBox): number {
  const area = Number(part.area);
  if (Number.isFinite(area) && area > 0) return area;

  const geometryArea = Number(part.geometry?.area);
  if (Number.isFinite(geometryArea) && geometryArea > 0) return geometryArea;

  const contourArea = areaFromContour(contour);
  if (contourArea > 0) return contourArea;

  return Math.max(0, bbox.maxX - bbox.minX) * Math.max(0, bbox.maxY - bbox.minY);
}

export function toPartSummary(part: CompatPartRecord) {
  const partId = String(part.partId ?? part.id);
  const contour = normalizeContour(part.contour);
  const bbox = resolvePartBoundingBox(part, contour);
  const area = resolvePartArea(part, contour, bbox);
  const processCode = resolvePartProcessCode(part);
  const entities = normalizePartEntities(part.entities, contour, partId, processCode);
  const createdAt =
    typeof part.createdAt === 'string'
      ? part.createdAt
      : compatState.files.find((file) => file.id === String(part.fileId))?.createdAt ??
        new Date().toISOString();
  const originalName = String(part.originalName ?? part.originalFilename ?? part.name ?? `${partId}.prts`);
  const fileId = String(part.fileId ?? `standalone-${partId}`);

  return {
    id: String(part.id ?? partId),
    partId,
    fileId,
    name: String(part.name ?? originalName),
    originalName,
    originalFilename: originalName,
    processCode,
    area,
    quantity: resolvePartQuantity(part),
    entityCount: Number.isFinite(Number(part.entityCount)) ? Number(part.entityCount) : entities.length,
    createdAt,
    geometry: part.geometry ?? {
      boundingBox: bbox,
      area,
    },
    bbox,
    contour,
  };
}

export function toPartDetail(part: CompatPartRecord) {
  const summary = toPartSummary(part);
  return {
    ...summary,
    entities: normalizePartEntities(part.entities, summary.contour, summary.partId, summary.processCode),
  };
}

export function passthroughResponse() {
  return passthrough();
}
