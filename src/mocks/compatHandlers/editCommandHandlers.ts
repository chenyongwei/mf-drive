import { http, HttpResponse, passthrough } from 'msw';
import { recordActivity } from '../compatState';
import {
  json,
  mockAlgoMode,
  parseUrl,
  shouldPassthroughEditCommand,
} from './commonResponseBuilders';

export const editCommandHandlers = [
  http.post('/api/files/:fileId/edit', async ({ params, request }) => {
    const body = (await request.json()) as { command?: string; params?: unknown };
    if (shouldPassthroughEditCommand(body.command)) {
      return passthrough();
    }

    recordActivity('EDIT_FILE', 'file', String(params.fileId ?? 'unknown'));
    return HttpResponse.json(
      {
        success: true,
        message: `command ${String(body.command ?? 'unknown')} applied`,
        updatedEntities: [],
        deletedEntityIds: [],
        affectedEntityIds: [],
      },
      {
        status: 200,
        headers: {
          'x-mock-edit-source': 'msw',
        },
      },
    );
  }),
  http.post('/api/drawing/files/:fileId/edit', async ({ params, request }) => {
    const body = (await request.json()) as { command?: string; params?: unknown };
    if (shouldPassthroughEditCommand(body.command)) {
      return passthrough();
    }

    recordActivity('EDIT_FILE', 'file', String(params.fileId ?? 'unknown'));
    return HttpResponse.json(
      {
        success: true,
        message: `command ${String(body.command ?? 'unknown')} applied`,
        updatedEntities: [],
        deletedEntityIds: [],
        affectedEntityIds: [],
      },
      {
        status: 200,
        headers: {
          'x-mock-edit-source': 'msw',
        },
      },
    );
  }),

  http.get('/api/drawings/:fileId/document', () => passthrough()),
  http.get('/api/drawings/:fileId/operations', () => passthrough()),
  http.post('/api/drawings/:fileId/operations', () => passthrough()),
  http.get('/api/drawing/documents/:fileId/document', () => passthrough()),
  http.get('/api/drawing/documents/:fileId/operations', () => passthrough()),
  http.post('/api/drawing/documents/:fileId/operations', () => passthrough()),

  http.all(/\/api\/history\/.*/, ({ request }) => {
    if (mockAlgoMode() === 'backend') {
      return passthrough();
    }

    const url = parseUrl(request);
    if (url.pathname.endsWith('/state')) {
      return json({
        success: true,
        data: {
          currentVersion: 0,
          operations: [],
          canUndo: false,
          canRedo: false,
        },
      });
    }

    if (url.pathname.includes('/preview/')) {
      return json({
        success: true,
        data: {
          version: 0,
          operations: [],
        },
      });
    }

    if (url.pathname.endsWith('/transform')) {
      return json({
        success: true,
        data: {
          transformedOperation: {
            fileId: url.pathname.split('/')[3] ?? 'mock-file',
            operationType: 'move',
            operationData: {},
            userId: 'mock-user',
            username: 'mock-user',
            timestamp: Date.now(),
            version: 1,
            transformedAt: new Date().toISOString(),
          },
        },
      });
    }

    return json({
      success: true,
      data: {
        operation: null,
        currentVersion: 0,
        operations: [],
        canUndo: false,
        canRedo: false,
      },
    });
  }),
  http.all(/\/api\/drawing\/history\/.*/, ({ request }) => {
    if (mockAlgoMode() === 'backend') {
      return passthrough();
    }

    const url = parseUrl(request);
    if (url.pathname.endsWith('/state')) {
      return json({
        success: true,
        data: {
          currentVersion: 0,
          operations: [],
          canUndo: false,
          canRedo: false,
        },
      });
    }

    if (url.pathname.includes('/preview/')) {
      return json({
        success: true,
        data: {
          version: 0,
          operations: [],
        },
      });
    }

    if (url.pathname.endsWith('/transform')) {
      return json({
        success: true,
        data: {
          transformedOperation: {
            fileId: url.pathname.split('/')[4] ?? 'mock-file',
            operationType: 'move',
            operationData: {},
            userId: 'mock-user',
            username: 'mock-user',
            timestamp: Date.now(),
            version: 1,
            transformedAt: new Date().toISOString(),
          },
        },
      });
    }

    return json({
      success: true,
      data: {
        operation: null,
        currentVersion: 0,
        operations: [],
        canUndo: false,
        canRedo: false,
      },
    });
  }),
];
