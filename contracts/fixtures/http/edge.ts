import type { HttpFixtureSet } from './types';

export const edgeHttpFixture: HttpFixtureSet = {
  drawingFilesResponse: { files: [], total: 0 },
  drawingFileStatusResponse: {
    id: 'file-1',
    name: 'sample-frame.dxf',
    status: 'parsing',
    entityCount: 0,
    partCount: 2,
    entities: [{ id: 'ent-1', type: 'LINE', layer: 'CUT', geometry: { start: { x: 0, y: 0 }, end: { x: 100, y: 0 } } }],
  },
  drawingPdfExtractResponse: {
    jobId: 'pdfext-edge-001',
    summary: {
      totalFiles: 1,
      succeeded: 1,
      failed: 0,
      ocrUsedFiles: 1,
      durationMs: 210,
    },
    results: [
      {
        fileName: 'edge-empty.png',
        inputKind: 'image',
        source: 'ocr',
        confidence: 0.42,
        table: {
          strategyUsed: ['layout-profiler', 'fusion'],
          titleBlock: {},
          attributes: [],
          bomRows: [],
          fieldConfidence: {},
        },
        cad: {
          approximate: true,
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
          page: { width: 0, height: 0 },
        },
        warnings: ['NO_TABLE_DATA', 'CAD_APPROX_FROM_IMAGE', 'IMAGE_CONTOUR_EMPTY'],
        errors: [],
      },
    ],
    errors: [],
  },
  nestingJobsResponse: {
    jobs: [{ id: 'nest-job-edge-001', status: 'queued', progress: 0, utilization: 0, createdAt: '2026-02-10T10:05:00Z' }],
    total: 1,
  },
  nestStartResponse: {
    id: 'nest-11',
    nestingId: 'nest-11',
    status: 'queued',
    progress: 0,
    currentUtilization: 0,
    currentLayout: {
      id: 'layout-nest-11',
      utilization: 0.78,
      parts: [
        {
          partId: 'part-1',
          partName: 'Plate-01',
          position: { x: 120, y: 120 },
          rotation: 0,
          bbox: { minX: 120, minY: 120, maxX: 340, maxY: 240 },
        },
      ],
      placedParts: [{ partId: 'part-1', x: 120, y: 120, rotation: 0 }],
      material: { width: 2000, height: 1000, thickness: 6 },
    },
    material: { width: 2000, height: 1000, thickness: 6 },
  },
  gcodeConfigsResponse: {
    data: [
      {
        id: 'cfg-1',
        name: 'Default Laser',
        deviceType: 'LASER',
        controlSystem: 'NC_STANDARD',
        feedRate: 1200,
        rapidRate: 3000,
        leadIn: { enabled: true, type: 'LINEAR', length: 4, angle: 45 },
        leadOut: { enabled: true, type: 'LINEAR', length: 3, angle: 30 },
        microJoint: { enabled: false, type: 'NONE', width: 0.8, depth: 0.2, count: 2, distribution: 'EVEN' },
      },
    ],
  },
  orderingOrdersResponse: { orders: [], total: 0 },
  orderingAdminSummaryResponse: { activeUsers: 0, openOrders: 0, overdueOrders: 0 },
  identityLoginResponse: {
    token: 'mock-token-edge',
    expiresAt: '2026-02-10T10:10:00Z',
    user: { id: 'user-edge-001', email: 'viewer@example.com', role: 'viewer' },
  },
  workspaceCurrentResponse: {
    type: 'personal',
  },
  teamMemberPermissionsResponse: {
    memberId: 2,
    role: 'member',
    permissions: [],
  },
};
