import type { FileInfo, OptimizationRules, Part } from '@dxf-fix/shared';

import type { LayerInfo } from '../../store';

import api from './client';

export const uploadFile = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<FileInfo> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/drawing/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
    onUploadProgress: (progressEvent) => {
      const progress = Math.round(
        ((progressEvent.loaded || 0) / (progressEvent.total || 1)) * 100
      );
      if (onProgress) {
        onProgress(progress);
      }
    },
  });

  return response.data;
};

export const getFileStatus = async (fileId: string): Promise<FileInfo> => {
  const response = await api.get(`/drawing/files/${fileId}/status`);
  return response.data;
};

export const getLayers = async (fileId: string): Promise<{ layers: LayerInfo[] }> => {
  const response = await api.get(`/drawing/files/${fileId}/layers`);
  return response.data;
};

export const getParts = async (
  fileId: string,
  offset = 0,
  limit = 100
): Promise<{ total: number; parts: Part[] }> => {
  const response = await api.get(`/drawing/files/${fileId}/parts`, { params: { offset, limit } });
  return response.data;
};

export const getPart = async (fileId: string, partId: string): Promise<Part> => {
  const response = await api.get(`/drawing/files/${fileId}/parts/${partId}`);
  return response.data;
};

export const getTiles = async (
  fileId: string,
  viewport: { xMin: number; yMin: number; xMax: number; yMax: number },
  zoomLevel: number
) => {
  const response = await api.get(`/drawing/files/${fileId}/tiles`, {
    params: {
      zoomLevel,
      xMin: viewport.xMin,
      yMin: viewport.yMin,
      xMax: viewport.xMax,
      yMax: viewport.yMax,
    },
  });
  return response.data;
};

export const getEntities = async (fileId: string, entityIds: string[]) => {
  const response = await api.post(`/drawing/files/${fileId}/entities`, { entityIds });
  return response.data;
};

export const applyRules = async (fileId: string, rules: OptimizationRules) => {
  const response = await api.post('/drawing/rules/apply', { fileId, rules });
  return response.data;
};

export const previewRules = async (fileId: string, rules: OptimizationRules) => {
  const response = await api.post('/drawing/rules/preview', { fileId, rules });
  return response.data;
};

export const getRuleTemplates = async () => {
  const response = await api.get('/drawing/rules/templates');
  return response.data;
};

export const exportFile = async (
  fileId: string,
  format: 'DXF' | 'GCODE' | 'PDF',
  partIds?: string[]
) => {
  const response = await api.post(`/nesting/export/${fileId}`, {
    format,
    partIds,
    options: { unit: 'mm', includeLayers: true },
  });
  return response.data;
};
