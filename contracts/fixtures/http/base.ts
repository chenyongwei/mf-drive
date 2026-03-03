import type { HttpFixtureSet } from './types';

export const baseHttpFixture: HttpFixtureSet = {
  drawingFilesResponse: {
    files: [
      { id: 'drawing-file-001', name: 'plate_a.dxf', status: 'ready', createdAt: '2026-02-10T09:00:00Z' },
      { id: 'drawing-file-002', name: 'plate_b.dxf', status: 'processing', createdAt: '2026-02-10T09:20:00Z' },
    ],
    total: 2,
  },
  drawingFileStatusResponse: {
    id: 'file-1',
    name: 'sample-frame.dxf',
    status: 'ready',
    entityCount: 2,
    partCount: 2,
    entities: [{ id: 'ent-1', type: 'LINE', layer: 'CUT', geometry: { start: { x: 0, y: 0 }, end: { x: 100, y: 0 } } }],
  },
  drawingPdfExtractResponse: {
    jobId: 'pdfext-base-001',
    summary: {
      totalFiles: 1,
      succeeded: 1,
      failed: 0,
      ocrUsedFiles: 0,
      durationMs: 842,
    },
    results: [
      {
        fileName: 'QEV01-01-0102-011A 扫码枪固定底座防护罩.pdf',
        inputKind: 'pdf',
        source: 'text',
        confidence: 0.95,
        table: {
          strategyUsed: ['layout-profiler', 'anchor-kv', 'unruled-table', 'fusion'],
          titleBlock: {
            drawingNo: 'QEV01-01-0102-011A',
            partName: '扫码枪固定底座防护罩',
            projectName: '粘贴IMEI标签',
            material: 'SPCC',
            surfaceTreatment: '烤漆RAL9016桔纹(白)',
            quantity: '1',
            revision: 'A',
            date: '2026/2/20',
          },
          attributes: [
            { key: '图号', value: 'QEV01-01-0102-011A', confidence: 0.99, source: 'text' },
            { key: '零件名称', value: '扫码枪固定底座防护罩', confidence: 0.98, source: 'text' },
            { key: '项目名称', value: '粘贴IMEI标签', confidence: 0.92, source: 'text' },
            { key: '材料', value: 'SPCC', confidence: 0.96, source: 'text' },
            { key: '表面处理', value: '烤漆RAL9016桔纹(白)', confidence: 0.95, source: 'text' },
            { key: '数量', value: '1', confidence: 0.9, source: 'text' },
            { key: '版本', value: 'A', confidence: 0.92, source: 'text' },
            { key: '日期', value: '2026/2/20', confidence: 0.91, source: 'text' },
          ],
          bomRows: [
            {
              rowIndex: 1,
              itemNo: '1',
              partNo: 'QEV01-01-0102-011A',
              partName: '扫码枪固定底座防护罩',
              quantity: '1',
            },
          ],
          fieldConfidence: {
            drawingNo: 0.99,
            partName: 0.98,
            material: 0.96,
            surfaceTreatment: 0.95,
            quantity: 0.9,
            revision: 0.92,
            date: 0.91,
          },
        },
        cad: {
          approximate: false,
          entities: [
            {
              id: 'cad-line-1',
              type: 'LINE',
              geometry: {
                start: { x: 0, y: 0 },
                end: { x: 100, y: 0 },
              },
              bbox: { minX: 0, minY: 0, maxX: 100, maxY: 0 },
            },
          ],
          contours: [
            {
              id: 'contour-1',
              closed: false,
              length: 100,
              bbox: { minX: 0, minY: 0, maxX: 100, maxY: 0 },
              entityIds: ['cad-line-1'],
            },
          ],
          stats: {
            entityCount: 1,
            lineCount: 1,
            polylineCount: 0,
            arcCount: 0,
            closedContourCount: 0,
            openContourCount: 1,
          },
          truncated: false,
          page: {
            width: 841.89,
            height: 595.28,
          },
        },
        warnings: [],
        errors: [],
      },
    ],
    errors: [],
  },
  nestingJobsResponse: {
    jobs: [
      { id: 'nest-job-001', status: 'running', progress: 62, utilization: 0.74, createdAt: '2026-02-10T10:00:00Z' },
      { id: 'nest-job-002', status: 'completed', progress: 100, utilization: 0.81, createdAt: '2026-02-10T09:30:00Z' },
    ],
    total: 2,
  },
  nestStartResponse: {
    id: 'nest-11',
    nestingId: 'nest-11',
    status: 'running',
    progress: 15,
    currentUtilization: 0.24,
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
      { id: 'order-001', status: 'open', amount: 2400, createdAt: '2026-02-10T08:00:00Z' },
      { id: 'order-002', status: 'in_production', amount: 1680, createdAt: '2026-02-10T08:30:00Z' },
    ],
    total: 2,
  },
  orderingAdminSummaryResponse: { activeUsers: 18, openOrders: 7, overdueOrders: 1 },
  identityLoginResponse: {
    token: 'mock-token-base',
    expiresAt: '2026-02-11T10:00:00Z',
    user: { id: 'user-001', email: 'operator@example.com', role: 'admin' },
  },
  workspaceCurrentResponse: {
    type: 'team',
    team: { id: 1, name: 'Factory Alpha', teamCode: 'ALPHA', role: 'owner' },
  },
  teamMemberPermissionsResponse: {
    memberId: 2,
    role: 'admin',
    permissions: ['VIEW_PARTS', 'RUN_NESTING', 'EDIT_DRAWINGS'],
  },
};
