import { http, passthrough } from 'msw';
import { json } from './commonResponseBuilders';

export const partRecognitionHandlers = [
  http.get('/api/files/:fileId/inspect', () => passthrough()),
  http.get('/api/drawing/files/:fileId/inspect', () => passthrough()),

  http.get('/api/files/:fileId/inspect/status', () =>
    json({
      status: 'completed',
      progress: 100,
      message: 'inspection done',
    })),
  http.get('/api/drawing/files/:fileId/inspect/status', () =>
    json({
      status: 'completed',
      progress: 100,
      message: 'inspection done',
    })),

  http.post('/api/files/inspect-batch', () => passthrough()),
  http.post('/api/drawing/files/inspect-batch', () => passthrough()),

  http.post('/api/files/:fileId/part-recognition/analyze', () => passthrough()),
  http.post('/api/files/:fileId/part-recognition/recognize', () => passthrough()),
  http.post('/api/files/:fileId/part-recognition/force-set', () => passthrough()),
  http.post('/api/files/:fileId/part-recognition/unset', () => passthrough()),
  http.get('/api/files/:fileId/part-recognition/parts', () => passthrough()),
  http.post('/api/drawing/files/:fileId/part-recognition/analyze', () => passthrough()),
  http.post('/api/drawing/files/:fileId/part-recognition/recognize', () => passthrough()),
  http.post('/api/drawing/files/:fileId/part-recognition/force-set', () => passthrough()),
  http.post('/api/drawing/files/:fileId/part-recognition/unset', () => passthrough()),
  http.get('/api/drawing/files/:fileId/part-recognition/parts', () => passthrough()),
  http.post('/api/part-recognition/recognize', () => passthrough()),
  http.post('/api/drawing/part-recognition/recognize', () => passthrough()),
];
