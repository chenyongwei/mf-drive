import { http, passthrough } from 'msw';

export const fontHandlers = [
  http.get('/api/fonts', () => passthrough()),
  http.post('/api/fonts/upload', () => passthrough()),
  http.delete('/api/fonts/:fontId', () => passthrough()),
  http.get('/api/drawing/fonts', () => passthrough()),
  http.post('/api/drawing/fonts/upload', () => passthrough()),
  http.delete('/api/drawing/fonts/:fontId', () => passthrough()),
];
