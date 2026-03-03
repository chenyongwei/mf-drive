import type {
  DrawingPartsReady,
  NestingJobCompleted,
  OrderingOrderUpdated,
} from '../generated/types/index';
import type { MockScenario } from './http';

interface EventFixtureSet {
  drawingPartsReady: DrawingPartsReady;
  nestingJobCompleted: NestingJobCompleted;
  orderingOrderUpdated: OrderingOrderUpdated;
}

export const eventFixtures: Record<MockScenario, EventFixtureSet> = {
  base: {
    drawingPartsReady: {
      eventId: 'evt-drawing-base-001',
      eventType: 'drawing.parts.ready',
      occurredAt: '2026-02-10T10:00:00Z',
      producer: 'drawing-api',
      workspaceId: 'workspace-001',
      payloadVersion: '2.0.0',
      payload: {
        fileId: 'drawing-file-001',
        partsCount: 2,
        parts: [
          {
            partId: 'part-001',
            outerContour: {
              contourId: 'part-001-outer',
              closed: true,
              points: [
                { x: 0, y: 0 },
                { x: 120, y: 0 },
                { x: 120, y: 80 },
                { x: 0, y: 80 },
              ],
            },
            innerContours: [
              {
                contourId: 'part-001-inner-1',
                closed: true,
                points: [
                  { x: 30, y: 20 },
                  { x: 90, y: 20 },
                  { x: 90, y: 60 },
                  { x: 30, y: 60 },
                ],
              },
            ],
            sourceEntityIds: ['ent-001-outer', 'ent-001-inner-1'],
            bbox: { minX: 0, minY: 0, maxX: 120, maxY: 80 },
            geometryVersion: 'geom-v2-001',
          },
          {
            partId: 'part-002',
            outerContour: {
              contourId: 'part-002-outer',
              closed: true,
              points: [
                { x: 140, y: 0 },
                { x: 260, y: 0 },
                { x: 260, y: 70 },
                { x: 140, y: 70 },
              ],
            },
            innerContours: [],
            sourceEntityIds: ['ent-002-outer'],
            bbox: { minX: 140, minY: 0, maxX: 260, maxY: 70 },
            geometryVersion: 'geom-v2-002',
          },
        ],
      },
    },
    nestingJobCompleted: {
      eventId: 'evt-nesting-base-001',
      eventType: 'nesting.job.completed',
      occurredAt: '2026-02-10T10:10:00Z',
      producer: 'nesting-api',
      workspaceId: 'workspace-001',
      payloadVersion: '1.0.0',
      payload: { jobId: 'nest-job-002', utilization: 0.81 },
    },
    orderingOrderUpdated: {
      eventId: 'evt-ordering-base-001',
      eventType: 'ordering.order.updated',
      occurredAt: '2026-02-10T10:20:00Z',
      producer: 'ordering-api',
      workspaceId: 'workspace-001',
      payloadVersion: '1.0.0',
      payload: { orderId: 'order-001', status: 'in_production' },
    },
  },
  demo: {
    drawingPartsReady: {
      eventId: 'evt-drawing-demo-001',
      eventType: 'drawing.parts.ready',
      occurredAt: '2026-02-10T10:01:00Z',
      producer: 'drawing-api',
      workspaceId: 'workspace-demo',
      payloadVersion: '2.0.0',
      payload: {
        fileId: 'drawing-file-demo-001',
        partsCount: 1,
        parts: [
          {
            partId: 'part-demo-001',
            outerContour: {
              contourId: 'part-demo-001-outer',
              closed: true,
              points: [
                { x: 0, y: 0 },
                { x: 180, y: 0 },
                { x: 180, y: 90 },
                { x: 0, y: 90 },
              ],
            },
            innerContours: [
              {
                contourId: 'part-demo-001-inner-1',
                closed: true,
                points: [
                  { x: 60, y: 25 },
                  { x: 120, y: 25 },
                  { x: 120, y: 65 },
                  { x: 60, y: 65 },
                ],
              },
            ],
            sourceEntityIds: ['ent-demo-001-outer', 'ent-demo-001-inner-1'],
            bbox: { minX: 0, minY: 0, maxX: 180, maxY: 90 },
            geometryVersion: 'geom-v2-demo-001',
          },
        ],
      },
    },
    nestingJobCompleted: {
      eventId: 'evt-nesting-demo-001',
      eventType: 'nesting.job.completed',
      occurredAt: '2026-02-10T10:11:00Z',
      producer: 'nesting-api',
      workspaceId: 'workspace-demo',
      payloadVersion: '1.0.0',
      payload: { jobId: 'nest-job-demo-001', utilization: 0.9 },
    },
    orderingOrderUpdated: {
      eventId: 'evt-ordering-demo-001',
      eventType: 'ordering.order.updated',
      occurredAt: '2026-02-10T10:21:00Z',
      producer: 'ordering-api',
      workspaceId: 'workspace-demo',
      payloadVersion: '1.0.0',
      payload: { orderId: 'order-demo-001', status: 'done' },
    },
  },
  edge: {
    drawingPartsReady: {
      eventId: 'evt-drawing-edge-001',
      eventType: 'drawing.parts.ready',
      occurredAt: '2026-02-10T10:02:00Z',
      producer: 'drawing-api',
      workspaceId: 'workspace-edge',
      payloadVersion: '2.0.0',
      payload: { fileId: 'drawing-file-edge-001', partsCount: 0, parts: [] },
    },
    nestingJobCompleted: {
      eventId: 'evt-nesting-edge-001',
      eventType: 'nesting.job.completed',
      occurredAt: '2026-02-10T10:12:00Z',
      producer: 'nesting-api',
      workspaceId: 'workspace-edge',
      payloadVersion: '1.0.0',
      payload: { jobId: 'nest-job-edge-001', utilization: 0 },
    },
    orderingOrderUpdated: {
      eventId: 'evt-ordering-edge-001',
      eventType: 'ordering.order.updated',
      occurredAt: '2026-02-10T10:22:00Z',
      producer: 'ordering-api',
      workspaceId: 'workspace-edge',
      payloadVersion: '1.0.0',
      payload: { orderId: 'order-edge-001', status: 'open' },
    },
  },
  failure: {
    drawingPartsReady: {
      eventId: 'evt-drawing-failure-001',
      eventType: 'drawing.parts.ready',
      occurredAt: '2026-02-10T10:03:00Z',
      producer: 'drawing-api',
      workspaceId: 'workspace-failure',
      payloadVersion: '2.0.0',
      payload: {
        fileId: 'drawing-file-failure-001',
        partsCount: 1,
        parts: [
          {
            partId: 'part-failure-001',
            outerContour: {
              contourId: 'part-failure-001-outer',
              closed: true,
              points: [
                { x: 0, y: 0 },
                { x: 80, y: 0 },
                { x: 80, y: 40 },
                { x: 0, y: 40 },
              ],
            },
            innerContours: [],
            sourceEntityIds: ['ent-failure-001-outer'],
            bbox: { minX: 0, minY: 0, maxX: 80, maxY: 40 },
            geometryVersion: 'geom-v2-failure-001',
          },
        ],
      },
    },
    nestingJobCompleted: {
      eventId: 'evt-nesting-failure-001',
      eventType: 'nesting.job.completed',
      occurredAt: '2026-02-10T10:13:00Z',
      producer: 'nesting-api',
      workspaceId: 'workspace-failure',
      payloadVersion: '1.0.0',
      payload: { jobId: 'nest-job-failure-001', utilization: 0.2 },
    },
    orderingOrderUpdated: {
      eventId: 'evt-ordering-failure-001',
      eventType: 'ordering.order.updated',
      occurredAt: '2026-02-10T10:23:00Z',
      producer: 'ordering-api',
      workspaceId: 'workspace-failure',
      payloadVersion: '1.0.0',
      payload: { orderId: 'order-failure-001', status: 'blocked' },
    },
  },
};
