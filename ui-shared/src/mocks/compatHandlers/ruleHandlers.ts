import { http } from 'msw';
import { json } from './commonResponseBuilders';

export const ruleHandlers = [
  http.post('/api/rules/apply', async ({ request }) => {
    const body = (await request.json()) as { fileId?: string; rules?: Record<string, unknown> };
    return json({ success: true, fileId: body.fileId, rules: body.rules ?? {} });
  }),

  http.post('/api/rules/preview', async ({ request }) => {
    const body = (await request.json()) as { fileId?: string };
    return json({
      fileId: body.fileId,
      summary: {
        mergedLines: 4,
        removedDuplicates: 2,
        closedContours: 1,
      },
      entities: [],
    });
  }),

  http.get('/api/rules/templates', () =>
    json({
      templates: [
        {
          id: 'default',
          name: 'Default',
          tolerance: 0.01,
          autoMergeLines: true,
          removeDuplicates: true,
          autoCloseContours: true,
        },
      ],
    })),

  http.post('/api/drawing/rules/apply', async ({ request }) => {
    const body = (await request.json()) as { fileId?: string; rules?: Record<string, unknown> };
    return json({ success: true, fileId: body.fileId, rules: body.rules ?? {} });
  }),

  http.post('/api/drawing/rules/preview', async ({ request }) => {
    const body = (await request.json()) as { fileId?: string };
    return json({
      fileId: body.fileId,
      summary: {
        mergedLines: 4,
        removedDuplicates: 2,
        closedContours: 1,
      },
      entities: [],
    });
  }),

  http.get('/api/drawing/rules/templates', () =>
    json({
      templates: [
        {
          id: 'default',
          name: 'Default',
          tolerance: 0.01,
          autoMergeLines: true,
          removeDuplicates: true,
          autoCloseContours: true,
        },
      ],
    })),
];
