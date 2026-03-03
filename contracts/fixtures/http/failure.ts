import type { HttpFixtureSet } from './types';

export const failureHttpFixture: HttpFixtureSet = {
  drawingFilesResponse: {
    files: [{ id: 'drawing-file-failure-001', name: 'broken_file.dxf', status: 'error', createdAt: '2026-02-10T06:30:00Z' }],
    total: 1,
  },
  drawingFileStatusResponse: {
    id: 'file-1',
    name: 'sample-frame.dxf',
    status: 'error',
    entityCount: 1,
    partCount: 2,
    entities: [{ id: 'ent-1', type: 'LINE', layer: 'CUT', geometry: { start: { x: 0, y: 0 }, end: { x: 100, y: 0 } } }],
  },
  drawingPdfExtractResponse: {
    jobId: 'pdfext-failure-001',
    summary: {
      totalFiles: 1,
      succeeded: 0,
      failed: 1,
      ocrUsedFiles: 0,
      durationMs: 88,
    },
    results: [],
    errors: [
      {
        fileName: 'broken.pdf',
        code: 'PDF_PARSE_FAILED',
        message: 'failed to parse pdf',
        detail: 'invalid xref table',
      },
    ],
  },
  nestingJobsResponse: {
    jobs: [{ id: 'nest-job-failure-001', status: 'failed', progress: 30, utilization: 0.2, createdAt: '2026-02-10T10:06:00Z' }],
    total: 1,
  },
  nestStartResponse: {
    id: 'nest-11',
    nestingId: 'nest-11',
    status: 'running',
    progress: 5,
    currentUtilization: 0.1,
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
  orderingOrdersResponse: {
    orders: [{ id: 'order-failure-001', status: 'blocked', amount: 900, createdAt: '2026-02-10T05:45:00Z' }],
    total: 1,
  },
  orderingAdminSummaryResponse: { activeUsers: 1, openOrders: 5, overdueOrders: 4 },
  identityLoginResponse: {
    token: 'mock-token-failure',
    expiresAt: '2026-02-10T10:08:00Z',
    user: { id: 'user-failure-001', email: 'locked@example.com', role: 'locked' },
  },
  workspaceCurrentResponse: {
    type: 'team',
    team: { id: 99, name: 'Failure Team', teamCode: 'FAIL', role: 'member' },
  },
  teamMemberPermissionsResponse: {
    memberId: 2,
    role: 'member',
    permissions: ['VIEW_PARTS'],
  },
};
