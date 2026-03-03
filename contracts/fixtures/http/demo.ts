import type { HttpFixtureSet } from './types';

export const demoHttpFixture: HttpFixtureSet = {
  drawingFilesResponse: {
    files: [{ id: 'drawing-file-demo-001', name: 'demo_assembly.dxf', status: 'ready', createdAt: '2026-02-10T06:00:00Z' }],
    total: 1,
  },
  drawingFileStatusResponse: {
    id: 'file-1',
    name: 'sample-frame.dxf',
    status: 'ready',
    entityCount: 4,
    partCount: 2,
    entities: [{ id: 'ent-1', type: 'LINE', layer: 'CUT', geometry: { start: { x: 0, y: 0 }, end: { x: 100, y: 0 } } }],
  },
  drawingPdfExtractResponse: {
    jobId: 'pdfext-demo-001',
    summary: {
      totalFiles: 2,
      succeeded: 2,
      failed: 0,
      ocrUsedFiles: 2,
      durationMs: 1260,
    },
    results: [
      {
        fileName: 'demo-a.pdf',
        inputKind: 'pdf',
        source: 'mixed',
        confidence: 0.88,
        table: {
          strategyUsed: ['layout-profiler', 'anchor-kv', 'ruled-table', 'ocr-fallback', 'fusion'],
          titleBlock: {
            drawingNo: 'DEMO-001',
            partName: '演示件A',
            material: 'Q235',
            quantity: '2',
            revision: 'B',
          },
          attributes: [
            { key: '图号', value: 'DEMO-001', confidence: 0.93, source: 'mixed' },
            { key: '零件名称', value: '演示件A', confidence: 0.9, source: 'mixed' },
            { key: '材料', value: 'Q235', confidence: 0.86, source: 'mixed' },
            { key: '数量', value: '2', confidence: 0.85, source: 'mixed' },
            { key: '版本', value: 'B', confidence: 0.82, source: 'mixed' },
          ],
          bomRows: [
            { rowIndex: 1, itemNo: '1', partNo: 'DEMO-001-A', partName: '演示子件A', quantity: '1' },
            { rowIndex: 2, itemNo: '2', partNo: 'DEMO-001-B', partName: '演示子件B', quantity: '1' },
          ],
          fieldConfidence: {
            drawingNo: 0.93,
            partName: 0.9,
            material: 0.86,
            quantity: 0.85,
            revision: 0.82,
          },
        },
        cad: {
          approximate: false,
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
          page: { width: 595, height: 842 },
        },
        warnings: ['OCR_USED_FOR_LOW_TEXT'],
        errors: [],
      },
      {
        fileName: 'demo-b.jpg',
        inputKind: 'image',
        source: 'ocr',
        confidence: 0.83,
        table: {
          strategyUsed: ['layout-profiler', 'anchor-kv', 'unruled-table', 'fusion'],
          titleBlock: {
            drawingNo: 'DEMO-IMG-002',
            partName: '演示件B-图片',
          },
          attributes: [
            { key: '图号', value: 'DEMO-IMG-002', confidence: 0.86, source: 'ocr' },
            { key: '零件名称', value: '演示件B-图片', confidence: 0.8, source: 'ocr' },
          ],
          bomRows: [],
          fieldConfidence: {
            drawingNo: 0.86,
            partName: 0.8,
          },
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
          page: { width: 595, height: 842 },
        },
        warnings: ['CAD_APPROX_FROM_IMAGE', 'IMAGE_LOW_CONTRAST'],
        errors: [],
      },
    ],
    errors: [],
  },
  nestingJobsResponse: {
    jobs: [{ id: 'nest-job-demo-001', status: 'completed', progress: 100, utilization: 0.88, createdAt: '2026-02-10T07:00:00Z' }],
    total: 1,
  },
  nestStartResponse: {
    id: 'nest-11',
    nestingId: 'nest-11',
    status: 'running',
    progress: 40,
    currentUtilization: 0.51,
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
    orders: [
      { id: 'order-demo-001', status: 'done', amount: 3200, createdAt: '2026-02-10T05:00:00Z' },
      { id: 'order-demo-002', status: 'open', amount: 1200, createdAt: '2026-02-10T05:30:00Z' },
    ],
    total: 2,
  },
  orderingAdminSummaryResponse: { activeUsers: 26, openOrders: 12, overdueOrders: 0 },
  identityLoginResponse: {
    token: 'mock-token-demo',
    expiresAt: '2026-02-12T10:00:00Z',
    user: { id: 'user-demo-001', email: 'demo-admin@example.com', role: 'super_admin' },
  },
  workspaceCurrentResponse: {
    type: 'team',
    team: { id: 2, name: 'Demo Team', teamCode: 'DEMO', role: 'admin' },
  },
  teamMemberPermissionsResponse: {
    memberId: 2,
    role: 'member',
    permissions: ['VIEW_PARTS', 'RUN_NESTING'],
  },
};
