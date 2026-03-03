import type { GCodeConfig, GCodeDeviceType } from '@dxf-fix/shared';

import api from './client';

export const getGCodePresets = async (): Promise<GCodeConfig[]> => {
  const response = await api.get('/nesting/gcode/presets');
  return response.data.data;
};

export const getGCodePresetsByDevice = async (
  deviceType: GCodeDeviceType
): Promise<GCodeConfig[]> => {
  const response = await api.get(`/nesting/gcode/presets/${deviceType}`);
  return response.data.data;
};

export const getGCodeConfigs = async (): Promise<GCodeConfig[]> => {
  const response = await api.get('/nesting/gcode/configs');
  return response.data.data;
};

export const getGCodeConfig = async (configId: string): Promise<GCodeConfig> => {
  const response = await api.get(`/nesting/gcode/configs/${configId}`);
  return response.data.data;
};

export const createGCodeConfig = async (config: GCodeConfig): Promise<GCodeConfig> => {
  const response = await api.post('/nesting/gcode/configs', config);
  return response.data.data;
};

export const updateGCodeConfig = async (
  configId: string,
  config: Partial<GCodeConfig>
): Promise<GCodeConfig> => {
  const response = await api.put(`/nesting/gcode/configs/${configId}`, config);
  return response.data.data;
};

export const deleteGCodeConfig = async (configId: string): Promise<void> => {
  await api.delete(`/nesting/gcode/configs/${configId}`);
};

export const duplicateGCodeConfig = async (
  configId: string,
  newName: string
): Promise<GCodeConfig> => {
  const response = await api.post(`/nesting/gcode/configs/${configId}/duplicate`, {
    name: newName,
  });
  return response.data.data;
};

export const previewGCode = async (fileId: string, partIds: string[]): Promise<string> => {
  const response = await api.post('/nesting/gcode/preview', { fileId, partIds });
  return response.data.data.gcode;
};

export const exportGCode = async (
  fileId: string,
  configId: string,
  partIds: string[],
  fileName?: string
): Promise<string> => {
  const response = await api.post(
    `/nesting/gcode/files/${fileId}/export/gcode`,
    {
      configId,
      partIds,
      fileName,
    },
    {
      responseType: 'text',
    }
  );
  return response.data;
};
