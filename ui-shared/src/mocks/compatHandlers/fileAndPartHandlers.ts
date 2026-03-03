import { http } from 'msw';
import {
  compatState,
  nextId,
  recordActivity,
} from '../compatState';
import {
  json,
  parseUrl,
  toNumber,
  toPartDetail,
  toPartSummary,
} from './commonResponseBuilders';

type CompatPoint = { x: number; y: number };
type CompatPartRecord = (typeof compatState.parts)[number] & {
  partId?: string;
  originalName?: string;
  originalFilename?: string;
  processCode?: string;
  quantity?: number;
  entityCount?: number;
  createdAt?: string;
  bbox?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  geometry?: {
    boundingBox?: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    };
    area?: number;
  };
  entities?: Array<Record<string, unknown>>;
  contour?: CompatPoint[];
};

const MIN_PART_QUANTITY = 1;
const MAX_PART_QUANTITY = 9999;

function clampQuantity(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return MIN_PART_QUANTITY;
  const integer = Math.floor(parsed);
  if (integer < MIN_PART_QUANTITY) return MIN_PART_QUANTITY;
  if (integer > MAX_PART_QUANTITY) return MAX_PART_QUANTITY;
  return integer;
}

function resolvePartId(part: CompatPartRecord): string {
  return String(part.partId ?? part.id);
}

function findCompatPartById(partId: string): CompatPartRecord | undefined {
  return compatState.parts.find((item) => {
    const candidate = item as CompatPartRecord;
    return resolvePartId(candidate) === partId || String(candidate.id) === partId;
  }) as CompatPartRecord | undefined;
}

export const fileAndPartHandlers = [
  http.get('/api/files', () => {
    const files = compatState.files.map((file) => ({
      id: file.id,
      fileId: file.id,
      name: file.name,
      originalName: file.name,
      status: file.status,
      progress: file.progress,
      entityCount: file.entityCount,
      partCount: file.partCount,
      parts: file.parts.map((part) => toPartSummary(part as CompatPartRecord)),
      expanded: file.expanded ?? true,
      createdAt: file.createdAt,
    }));
    return json(files);
  }),

  http.get('/api/parts', ({ request }) => {
    const url = parseUrl(request);
    const offset = Math.max(0, toNumber(url.searchParams.get('offset'), 0));
    const limit = Math.max(1, toNumber(url.searchParams.get('limit'), 200));
    const parts = compatState.parts
      .slice(offset, offset + limit)
      .map((part) => toPartSummary(part as CompatPartRecord));
    return json(parts);
  }),

  http.get('/api/parts/:partId', ({ params }) => {
    const part = findCompatPartById(String(params.partId));
    if (!part) return json({ error: 'part not found' }, 404);
    return json(toPartDetail(part as CompatPartRecord));
  }),

  http.get('/api/nesting/parts', ({ request }) => {
    const url = parseUrl(request);
    const offset = Math.max(0, toNumber(url.searchParams.get('offset'), 0));
    const limit = Math.max(1, toNumber(url.searchParams.get('limit'), 200));
    const parts = compatState.parts
      .slice(offset, offset + limit)
      .map((part) => toPartSummary(part as CompatPartRecord));
    return json(parts);
  }),

  http.get('/api/nesting/parts/:partId', ({ params }) => {
    const part = findCompatPartById(String(params.partId));
    if (!part) return json({ error: 'part not found' }, 404);
    return json(toPartDetail(part as CompatPartRecord));
  }),

  http.get('/api/nesting/parts/quantities', () => {
    const items = compatState.parts.map((item) => {
      const part = item as CompatPartRecord;
      return {
        partId: resolvePartId(part),
        quantity: clampQuantity(part.quantity),
      };
    });

    return json({
      items,
      total: items.length,
    });
  }),

  http.put('/api/nesting/parts/:partId/quantity', async ({ params, request }) => {
    const partId = String(params.partId ?? '').trim();
    if (!partId) return json({ error: 'part not found' }, 404);

    const target = findCompatPartById(partId);
    if (!target) return json({ error: 'part not found' }, 404);

    const body = await request.json().catch(() => null);
    const rawQuantity = Number((body as { quantity?: unknown } | null)?.quantity);
    if (!Number.isFinite(rawQuantity)) {
      return json({ error: 'quantity must be a finite number' }, 400);
    }
    const quantity = clampQuantity(rawQuantity);
    target.quantity = quantity;

    return json({
      partId: resolvePartId(target),
      quantity,
      mode: 'mock',
      persisted: false,
    });
  }),

  http.post('/api/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileName = file?.name ?? `upload-${Date.now()}.dxf`;
    const id = `file-${nextId('file')}`;

    const parts: CompatPartRecord[] = [
      {
        id: `${id}-part-1`,
        partId: `${id}-part-1`,
        fileId: id,
        name: `${fileName}-part-A`,
        originalName: `${fileName}-part-A`,
        originalFilename: `${fileName}-part-A`,
        processCode: 'CUT_NORMAL',
        area: 21000,
        quantity: 1,
        contour: [
          { x: 0, y: 0 },
          { x: 210, y: 0 },
          { x: 210, y: 100 },
          { x: 0, y: 100 },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: `${id}-part-2`,
        partId: `${id}-part-2`,
        fileId: id,
        name: `${fileName}-part-B`,
        originalName: `${fileName}-part-B`,
        originalFilename: `${fileName}-part-B`,
        processCode: 'MARK',
        area: 16400,
        quantity: 1,
        contour: [
          { x: 0, y: 0 },
          { x: 160, y: 0 },
          { x: 160, y: 102 },
          { x: 0, y: 102 },
        ],
        createdAt: new Date().toISOString(),
      },
    ];

    parts.forEach((part) => {
      const summary = toPartSummary(part);
      const detail = toPartDetail(part);
      part.entityCount = summary.entityCount;
      part.bbox = summary.bbox;
      part.geometry = summary.geometry;
      part.entities = detail.entities;
    });

    const entry = {
      id,
      name: fileName,
      status: 'ready' as const,
      progress: 100,
      entityCount: 160,
      partCount: parts.length,
      parts,
      expanded: true,
      createdAt: new Date().toISOString(),
    };

    compatState.parts.push(...parts);
    compatState.files.unshift(entry);
    recordActivity('UPLOAD_FILE', 'file', id);

    return json(entry);
  }),

  http.post('/api/prts-upload', async ({ request }) => {
    const formData = await request.formData();
    const uploaded = formData.get('file');
    const uploadedName =
      uploaded && typeof uploaded === 'object' && 'name' in uploaded
        ? String((uploaded as { name?: unknown }).name ?? '').trim()
        : '';
    const fileName = uploadedName || `upload-${Date.now()}.prts`;

    const seq = nextId('file');
    const partId = `part-${seq}`;
    const width = 120 + (seq % 7) * 12;
    const height = 80 + (seq % 7) * 9;
    const contour: CompatPoint[] = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];
    const createdAt = new Date().toISOString();

    const part: CompatPartRecord = {
      id: partId,
      partId,
      fileId: `standalone-${partId}`,
      name: fileName,
      originalName: fileName,
      originalFilename: fileName,
      processCode: seq % 2 === 0 ? 'CUT_NORMAL' : 'MARK',
      area: width * height,
      quantity: 1,
      contour,
      createdAt,
    };

    const summary = toPartSummary(part);
    const detail = toPartDetail(part);
    part.entityCount = summary.entityCount;
    part.bbox = summary.bbox;
    part.geometry = summary.geometry;
    part.entities = detail.entities;

    compatState.parts.unshift(part);
    recordActivity('UPLOAD_FILE', 'part', partId);

    return json({
      id: summary.id,
      partId: summary.partId,
      fileId: summary.fileId,
      originalName: summary.originalName,
      quantity: summary.quantity,
      status: 'ready',
      entityCount: summary.entityCount,
      createdAt: summary.createdAt,
      geometry: summary.geometry,
      bbox: summary.bbox,
    });
  }),

  http.get('/api/files/:fileId/status', ({ params }) => {
    const file = compatState.files.find((item) => item.id === params.fileId);
    if (!file) return json({ error: 'file not found' }, 404);
    return json(file);
  }),

  http.get('/api/files/:fileId/layers', ({ params }) => {
    const file = compatState.files.find((item) => item.id === params.fileId);
    if (!file) return json({ layers: [] });

    return json({
      layers: [
        { name: 'CUT', color: 1, entityCount: Math.max(1, Math.round(file.entityCount * 0.7)), entities: [] },
        { name: 'MARK', color: 2, entityCount: Math.max(1, Math.round(file.entityCount * 0.3)), entities: [] },
      ],
    });
  }),

  http.get('/api/files/:fileId/parts', ({ params, request }) => {
    const file = compatState.files.find((item) => item.id === params.fileId);
    if (!file) return json({ total: 0, parts: [] });

    const url = parseUrl(request);
    const offset = toNumber(url.searchParams.get('offset'), 0);
    const limit = toNumber(url.searchParams.get('limit'), 100);
    const parts = file.parts
      .slice(offset, offset + limit)
      .map((part) => toPartSummary(part as CompatPartRecord));
    return json({ total: file.parts.length, parts });
  }),

  http.get('/api/files/:fileId/parts/:partId', ({ params }) => {
    const file = compatState.files.find((item) => item.id === params.fileId);
    const part = file?.parts.find((candidate) => candidate.id === params.partId);
    if (!part) return json({ error: 'part not found' }, 404);
    return json(toPartDetail(part as CompatPartRecord));
  }),

  http.get('/api/files/:fileId/tiles', () => json({ tiles: [] })),

  http.post('/api/files/:fileId/entities', async ({ request }) => {
    const body = (await request.json()) as { entityIds?: string[] };
    const ids = body.entityIds ?? [];
    return json({
      entities: ids.map((id, idx) => ({
        id,
        type: 'LINE',
        start: { x: idx * 10, y: idx * 10 },
        end: { x: idx * 10 + 20, y: idx * 10 + 5 },
      })),
    });
  }),

  http.post('/api/drawings/:fileId/convert', ({ params }) => {
    const file = compatState.files.find((item) => item.id === params.fileId) ?? compatState.files[0];
    return json({ target: 'parts', parts: file.parts });
  }),

  http.post('/api/drawings/:fileId/compact', () => json({ success: true })),

  http.get('/api/prts/all', () =>
    json({
      parts: compatState.parts.map((part) => toPartSummary(part as CompatPartRecord)),
      total: compatState.parts.length,
    })),

  http.get('/api/prts/:partId', ({ params }) => {
    const part = findCompatPartById(String(params.partId));
    if (!part) return json({ error: 'part not found' }, 404);
    return json(toPartDetail(part as CompatPartRecord));
  }),

  http.get('/api/nesting/prts/all', () =>
    json({
      parts: compatState.parts.map((part) => toPartSummary(part as CompatPartRecord)),
      total: compatState.parts.length,
    })),

  http.get('/api/nesting/prts/:partId', ({ params }) => {
    const part = findCompatPartById(String(params.partId));
    if (!part) return json({ error: 'part not found' }, 404);
    return json(toPartDetail(part as CompatPartRecord));
  }),

  // Canonical drawing namespace aliases
  http.get('/api/drawing/files', () => {
    const files = compatState.files.map((file) => ({
      id: file.id,
      fileId: file.id,
      name: file.name,
      originalName: file.name,
      status: file.status,
      progress: file.progress,
      entityCount: file.entityCount,
      partCount: file.partCount,
      parts: file.parts.map((part) => toPartSummary(part as CompatPartRecord)),
      expanded: file.expanded ?? true,
      createdAt: file.createdAt,
    }));
    return json(files);
  }),

  http.post('/api/drawing/files/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileName = file?.name ?? `upload-${Date.now()}.dxf`;
    const id = `file-${nextId('file')}`;

    const parts: CompatPartRecord[] = [
      {
        id: `${id}-part-1`,
        partId: `${id}-part-1`,
        fileId: id,
        name: `${fileName}-part-A`,
        originalName: `${fileName}-part-A`,
        originalFilename: `${fileName}-part-A`,
        processType: 'CUT',
        area: 21000,
        contour: [
          { x: 0, y: 0 },
          { x: 210, y: 0 },
          { x: 210, y: 100 },
          { x: 0, y: 100 },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: `${id}-part-2`,
        partId: `${id}-part-2`,
        fileId: id,
        name: `${fileName}-part-B`,
        originalName: `${fileName}-part-B`,
        originalFilename: `${fileName}-part-B`,
        processType: 'MARK',
        area: 16400,
        contour: [
          { x: 0, y: 0 },
          { x: 160, y: 0 },
          { x: 160, y: 102 },
          { x: 0, y: 102 },
        ],
        createdAt: new Date().toISOString(),
      },
    ];

    parts.forEach((part) => {
      const summary = toPartSummary(part);
      const detail = toPartDetail(part);
      part.entityCount = summary.entityCount;
      part.bbox = summary.bbox;
      part.geometry = summary.geometry;
      part.entities = detail.entities;
    });

    const entry = {
      id,
      name: fileName,
      status: 'ready' as const,
      progress: 100,
      entityCount: 160,
      partCount: parts.length,
      parts,
      expanded: true,
      createdAt: new Date().toISOString(),
    };

    compatState.parts.push(...parts);
    compatState.files.unshift(entry);
    recordActivity('UPLOAD_FILE', 'file', id);

    return json(entry);
  }),

  http.post('/api/drawing/files/prts-upload', async ({ request }) => {
    const formData = await request.formData();
    const uploaded = formData.get('file');
    const uploadedName =
      uploaded && typeof uploaded === 'object' && 'name' in uploaded
        ? String((uploaded as { name?: unknown }).name ?? '').trim()
        : '';
    const fileName = uploadedName || `upload-${Date.now()}.prts`;

    const seq = nextId('file');
    const partId = `part-${seq}`;
    const width = 120 + (seq % 7) * 12;
    const height = 80 + (seq % 7) * 9;
    const contour: CompatPoint[] = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];
    const createdAt = new Date().toISOString();

    const part: CompatPartRecord = {
      id: partId,
      partId,
      fileId: `standalone-${partId}`,
      name: fileName,
      originalName: fileName,
      originalFilename: fileName,
      processType: seq % 2 === 0 ? 'CUT' : 'MARK',
      area: width * height,
      contour,
      createdAt,
    };

    const summary = toPartSummary(part);
    const detail = toPartDetail(part);
    part.entityCount = summary.entityCount;
    part.bbox = summary.bbox;
    part.geometry = summary.geometry;
    part.entities = detail.entities;

    compatState.parts.unshift(part);
    recordActivity('UPLOAD_FILE', 'part', partId);

    return json({
      id: summary.id,
      partId: summary.partId,
      fileId: summary.fileId,
      originalName: summary.originalName,
      status: 'ready',
      entityCount: summary.entityCount,
      createdAt: summary.createdAt,
      geometry: summary.geometry,
      bbox: summary.bbox,
    });
  }),

  http.get('/api/drawing/files/:fileId/status', ({ params }) => {
    const file = compatState.files.find((item) => item.id === params.fileId);
    if (!file) return json({ error: 'file not found' }, 404);
    return json(file);
  }),

  http.get('/api/drawing/files/:fileId/layers', ({ params }) => {
    const file = compatState.files.find((item) => item.id === params.fileId);
    if (!file) return json({ layers: [] });

    return json({
      layers: [
        { name: 'CUT', color: 1, entityCount: Math.max(1, Math.round(file.entityCount * 0.7)), entities: [] },
        { name: 'MARK', color: 2, entityCount: Math.max(1, Math.round(file.entityCount * 0.3)), entities: [] },
      ],
    });
  }),

  http.get('/api/drawing/files/:fileId/parts', ({ params, request }) => {
    const file = compatState.files.find((item) => item.id === params.fileId);
    if (!file) return json({ total: 0, parts: [] });

    const url = parseUrl(request);
    const offset = toNumber(url.searchParams.get('offset'), 0);
    const limit = toNumber(url.searchParams.get('limit'), 100);
    const parts = file.parts
      .slice(offset, offset + limit)
      .map((part) => toPartSummary(part as CompatPartRecord));
    return json({ total: file.parts.length, parts });
  }),

  http.get('/api/drawing/files/:fileId/parts/:partId', ({ params }) => {
    const file = compatState.files.find((item) => item.id === params.fileId);
    const part = file?.parts.find((candidate) => candidate.id === params.partId);
    if (!part) return json({ error: 'part not found' }, 404);
    return json(toPartDetail(part as CompatPartRecord));
  }),

  http.get('/api/drawing/files/:fileId/tiles', () => json({ tiles: [] })),

  http.post('/api/drawing/files/:fileId/entities', async ({ request }) => {
    const body = (await request.json()) as { entityIds?: string[] };
    const ids = body.entityIds ?? [];
    return json({
      entities: ids.map((id, idx) => ({
        id,
        type: 'LINE',
        start: { x: idx * 10, y: idx * 10 },
        end: { x: idx * 10 + 20, y: idx * 10 + 5 },
      })),
    });
  }),

  http.get('/api/drawing/files/:fileId/thumbnail', ({ params }) => {
    const file = compatState.files.find((item) => item.id === params.fileId);
    if (!file) return json({ error: 'file not found' }, 404);
    return json({ thumbnailUrl: `/mock-thumbnails/${file.id}.svg` });
  }),

  http.get('/api/drawing/files/:fileId/parts/:partId/thumbnail', ({ params }) => {
    const file = compatState.files.find((item) => item.id === params.fileId);
    const part = file?.parts.find((candidate) => candidate.id === params.partId);
    if (!part) return json({ error: 'part not found' }, 404);
    return json({ thumbnailUrl: `/mock-thumbnails/${part.id}.svg` });
  }),

  http.post('/api/drawing/files/:fileId/fix-all', async ({ request, params }) => {
    const body = (await request.json()) as { strategy?: string };
    return json({
      success: true,
      fileId: params.fileId,
      fixedIssues: 0,
      remainingIssues: 0,
      strategy: body.strategy ?? 'default',
    });
  }),

  http.get('/api/drawing/parts', ({ request }) => {
    const url = parseUrl(request);
    const offset = Math.max(0, toNumber(url.searchParams.get('offset'), 0));
    const limit = Math.max(1, toNumber(url.searchParams.get('limit'), 200));
    const parts = compatState.parts
      .slice(offset, offset + limit)
      .map((part) => toPartSummary(part as CompatPartRecord));
    return json(parts);
  }),

  http.get('/api/drawing/parts/:partId', ({ params }) => {
    const part = compatState.parts.find((item) => {
      const candidate = item as CompatPartRecord;
      return String(candidate.partId ?? candidate.id) === params.partId || String(candidate.id) === params.partId;
    });
    if (!part) return json({ error: 'part not found' }, 404);
    return json(toPartDetail(part as CompatPartRecord));
  }),
];
