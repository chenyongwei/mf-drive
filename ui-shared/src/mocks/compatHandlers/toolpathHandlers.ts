import { http, passthrough } from 'msw';
import { json } from './commonResponseBuilders';

export const toolpathHandlers = [
  http.post('/api/nest/toolpath/plan', () => passthrough()),
  http.get('/api/nest/toolpath/plan/:planId', () => passthrough()),
  http.post('/api/nest/toolpath/check', () => passthrough()),
  http.post('/api/nesting/toolpath/plan', () => passthrough()),
  http.get('/api/nesting/toolpath/plan/:planId', () => passthrough()),
  http.post('/api/nesting/toolpath/check', () => passthrough()),

  http.post('/api/nest/export/gcode', async ({ request }) => {
    const body = (await request.json()) as { layoutId?: string; fileName?: string; planId?: string };
    if (body.planId) {
      return passthrough();
    }
    return json({
      downloadUrl: `/mock-downloads/${body.layoutId ?? 'layout'}.nc`,
      fileName: body.fileName ?? 'nesting-result.nc',
    });
  }),

  http.post('/api/nesting/export/gcode', async ({ request }) => {
    const body = (await request.json()) as { layoutId?: string; fileName?: string; planId?: string };
    if (body.planId) {
      return passthrough();
    }
    return json({
      downloadUrl: `/mock-downloads/${body.layoutId ?? 'layout'}.nc`,
      fileName: body.fileName ?? 'nesting-result.nc',
    });
  }),
];
