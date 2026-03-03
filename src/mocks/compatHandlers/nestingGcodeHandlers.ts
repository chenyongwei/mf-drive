import { http, HttpResponse } from 'msw';
import {
  compatState,
  createMockLayout,
  nextId,
  recordActivity,
} from '../compatState';
import { json } from './commonResponseBuilders';

export const nestingGcodeHandlers = [
  http.post('/api/nest/start', async ({ request }) => {
    const body = (await request.json()) as { material?: { width?: number; height?: number } };
    const id = `nest-${nextId('nesting')}`;
    const layout = createMockLayout(id);
    const job = {
      nestingId: id,
      status: 'running' as const,
      progress: 15,
      currentUtilization: 0.24,
      currentLayout: {
        ...layout,
        material: {
          width: body.material?.width ?? 2000,
          height: body.material?.height ?? 1000,
        },
      },
    };
    compatState.nestingJobs.unshift(job);
    recordActivity('START_NESTING', 'nesting', id);
    return json({
      nestingId: id,
      status: 'started',
      progress: job.progress,
      currentUtilization: job.currentUtilization,
      currentLayout: job.currentLayout,
    });
  }),

  http.get('/api/nest/status/:nestingId', ({ params }) => {
    const job = compatState.nestingJobs.find((item) => item.nestingId === params.nestingId);
    if (!job) return json({ error: 'nesting not found' }, 404);

    if (job.status === 'running') {
      job.progress = Math.min(100, job.progress + 20);
      job.currentUtilization = Math.min(0.91, job.currentUtilization + 0.12);
      if (job.progress >= 100) {
        job.status = 'completed';
        job.currentLayout = createMockLayout(job.nestingId);
      }
    }

    return json(job);
  }),

  http.post('/api/nest/stop/:nestingId', ({ params }) => {
    const job = compatState.nestingJobs.find((item) => item.nestingId === params.nestingId);
    if (!job) return json({ error: 'nesting not found' }, 404);
    job.status = 'stopped';
    return json({ nestingId: job.nestingId, status: 'stopped' });
  }),

  http.get('/api/nest/result/:nestingId', ({ params }) => {
    const job = compatState.nestingJobs.find((item) => item.nestingId === params.nestingId);
    if (!job) return json({ error: 'nesting not found' }, 404);

    return json({
      nestingId: job.nestingId,
      status: job.status,
      progress: job.progress,
      layouts: [job.currentLayout ?? createMockLayout(job.nestingId)],
      bestLayout: job.currentLayout ?? createMockLayout(job.nestingId),
      utilization: job.currentUtilization,
    });
  }),

  http.get('/api/nest/layout/:nestingId/:layoutId', ({ params }) =>
    json({
      nestingId: params.nestingId,
      layoutId: params.layoutId,
      ...createMockLayout(String(params.nestingId)),
    })),

  http.get('/api/gcode/presets', () => json({ data: compatState.gcodeConfigs })),

  http.get('/api/gcode/presets/:deviceType', ({ params }) =>
    json({ data: compatState.gcodeConfigs.filter((cfg) => String(cfg.deviceType) === String(params.deviceType)) })),

  http.get('/api/gcode/configs', () => json({ data: compatState.gcodeConfigs })),

  http.get('/api/gcode/configs/:configId', ({ params }) => {
    const config = compatState.gcodeConfigs.find((item) => item.id === params.configId);
    if (!config) return json({ error: 'config not found' }, 404);
    return json({ data: config });
  }),

  http.post('/api/gcode/configs', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const config = {
      ...body,
      id: `cfg-${nextId('gcode')}`,
      name: String(body.name ?? 'Custom Config'),
    };
    compatState.gcodeConfigs.unshift(config);
    return json({ data: config });
  }),

  http.put('/api/gcode/configs/:configId', async ({ params, request }) => {
    const config = compatState.gcodeConfigs.find((item) => item.id === params.configId);
    if (!config) return json({ error: 'config not found' }, 404);

    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(config, body);
    return json({ data: config });
  }),

  http.delete('/api/gcode/configs/:configId', ({ params }) => {
    compatState.gcodeConfigs = compatState.gcodeConfigs.filter((item) => item.id !== params.configId);
    return json({ success: true });
  }),

  http.post('/api/gcode/configs/:configId/duplicate', async ({ params, request }) => {
    const source = compatState.gcodeConfigs.find((item) => item.id === params.configId);
    if (!source) return json({ error: 'config not found' }, 404);

    const body = (await request.json()) as { name?: string };
    const duplicated = {
      ...source,
      id: `cfg-${nextId('gcode')}`,
      name: String(body.name ?? `${source.name}-copy`),
    };
    compatState.gcodeConfigs.unshift(duplicated);
    return json({ data: duplicated });
  }),

  http.post('/api/gcode/preview', () =>
    json({
      data: {
        gcode: 'G21\nG90\nM3 S1000\nG1 X10 Y10 F1200\nG1 X50 Y10\nM5\n',
      },
    })),

  http.post('/api/gcode/files/:fileId/export/gcode', () =>
    new HttpResponse('G21\nG90\nM3 S1000\nG1 X0 Y0 F1200\nM5\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })),

  http.post('/api/export/:fileId', ({ params }) =>
    json({
      success: true,
      fileId: params.fileId,
      downloadUrl: `/mock-downloads/${params.fileId}.zip`,
    })),

  // Canonical nesting namespace aliases
  http.post('/api/nesting/start', async ({ request }) => {
    const body = (await request.json()) as { material?: { width?: number; height?: number } };
    const id = `nest-${nextId('nesting')}`;
    const layout = createMockLayout(id);
    const job = {
      nestingId: id,
      status: 'running' as const,
      progress: 15,
      currentUtilization: 0.24,
      currentLayout: {
        ...layout,
        material: {
          width: body.material?.width ?? 2000,
          height: body.material?.height ?? 1000,
        },
      },
    };
    compatState.nestingJobs.unshift(job);
    recordActivity('START_NESTING', 'nesting', id);
    return json({
      nestingId: id,
      status: 'started',
      progress: job.progress,
      currentUtilization: job.currentUtilization,
      currentLayout: job.currentLayout,
    });
  }),

  http.get('/api/nesting/status/:nestingId', ({ params }) => {
    const job = compatState.nestingJobs.find((item) => item.nestingId === params.nestingId);
    if (!job) return json({ error: 'nesting not found' }, 404);

    if (job.status === 'running') {
      job.progress = Math.min(100, job.progress + 20);
      job.currentUtilization = Math.min(0.91, job.currentUtilization + 0.12);
      if (job.progress >= 100) {
        job.status = 'completed';
        job.currentLayout = createMockLayout(job.nestingId);
      }
    }

    return json(job);
  }),

  http.post('/api/nesting/stop/:nestingId', ({ params }) => {
    const job = compatState.nestingJobs.find((item) => item.nestingId === params.nestingId);
    if (!job) return json({ error: 'nesting not found' }, 404);
    job.status = 'stopped';
    return json({ nestingId: job.nestingId, status: 'stopped' });
  }),

  http.get('/api/nesting/result/:nestingId', ({ params }) => {
    const job = compatState.nestingJobs.find((item) => item.nestingId === params.nestingId);
    if (!job) return json({ error: 'nesting not found' }, 404);

    return json({
      nestingId: job.nestingId,
      status: job.status,
      progress: job.progress,
      layouts: [job.currentLayout ?? createMockLayout(job.nestingId)],
      bestLayout: job.currentLayout ?? createMockLayout(job.nestingId),
      utilization: job.currentUtilization,
    });
  }),

  http.get('/api/nesting/layout/:nestingId/:layoutId', ({ params }) =>
    json({
      nestingId: params.nestingId,
      layoutId: params.layoutId,
      ...createMockLayout(String(params.nestingId)),
    })),

  http.get('/api/nesting/gcode/presets', () => json({ data: compatState.gcodeConfigs })),

  http.get('/api/nesting/gcode/presets/:deviceType', ({ params }) =>
    json({ data: compatState.gcodeConfigs.filter((cfg) => String(cfg.deviceType) === String(params.deviceType)) })),

  http.get('/api/nesting/gcode/configs', () => json({ data: compatState.gcodeConfigs })),

  http.get('/api/nesting/gcode/configs/:configId', ({ params }) => {
    const config = compatState.gcodeConfigs.find((item) => item.id === params.configId);
    if (!config) return json({ error: 'config not found' }, 404);
    return json({ data: config });
  }),

  http.post('/api/nesting/gcode/configs', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const config = {
      ...body,
      id: `cfg-${nextId('gcode')}`,
      name: String(body.name ?? 'Custom Config'),
    };
    compatState.gcodeConfigs.unshift(config);
    return json({ data: config });
  }),

  http.put('/api/nesting/gcode/configs/:configId', async ({ params, request }) => {
    const config = compatState.gcodeConfigs.find((item) => item.id === params.configId);
    if (!config) return json({ error: 'config not found' }, 404);

    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(config, body);
    return json({ data: config });
  }),

  http.delete('/api/nesting/gcode/configs/:configId', ({ params }) => {
    compatState.gcodeConfigs = compatState.gcodeConfigs.filter((item) => item.id !== params.configId);
    return json({ success: true });
  }),

  http.post('/api/nesting/gcode/configs/:configId/duplicate', async ({ params, request }) => {
    const source = compatState.gcodeConfigs.find((item) => item.id === params.configId);
    if (!source) return json({ error: 'config not found' }, 404);

    const body = (await request.json()) as { name?: string };
    const duplicated = {
      ...source,
      id: `cfg-${nextId('gcode')}`,
      name: String(body.name ?? `${source.name}-copy`),
    };
    compatState.gcodeConfigs.unshift(duplicated);
    return json({ data: duplicated });
  }),

  http.post('/api/nesting/gcode/preview', () =>
    json({
      data: {
        gcode: 'G21\\nG90\\nM3 S1000\\nG1 X10 Y10 F1200\\nG1 X50 Y10\\nM5\\n',
      },
    })),

  http.post('/api/nesting/gcode/files/:fileId/export/gcode', () =>
    new HttpResponse('G21\\nG90\\nM3 S1000\\nG1 X0 Y0 F1200\\nM5\\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })),

  http.post('/api/nesting/export/:fileId', ({ params }) =>
    json({
      success: true,
      fileId: params.fileId,
      downloadUrl: `/mock-downloads/${params.fileId}.zip`,
    })),
];
