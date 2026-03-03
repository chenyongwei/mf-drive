import api from './client';

export const startNesting = async (request: {
  fileId?: string;
  partIds?: string[];
  material: { width: number; height: number; thickness?: number };
  options?: {
    rotationStep?: number;
    spacing?: number;
    nestingTime?: number;
    algorithms?: string[];
  };
}): Promise<any> => {
  const response = await api.post('/nesting/start', request);
  return response.data;
};

export const getNestingProgress = async (nestingId: string): Promise<{
  nestingId: string;
  status: string;
  progress: number;
  currentUtilization: number;
  currentLayout?: any;
}> => {
  const response = await api.get(`/nesting/status/${nestingId}`);
  return response.data;
};

export const stopNesting = async (nestingId: string): Promise<any> => {
  const response = await api.post(`/nesting/stop/${nestingId}`);
  return response.data;
};

export const getNestingResult = async (nestingId: string): Promise<any> => {
  const response = await api.get(`/nesting/result/${nestingId}`);
  return response.data;
};

export const getNestingLayout = async (
  nestingId: string,
  layoutId: string
): Promise<any> => {
  const response = await api.get(`/nesting/layout/${nestingId}/${layoutId}`);
  return response.data;
};

export const exportNestingGCode = async (options: {
  layoutId: string;
  configId: string;
  fileName?: string;
}): Promise<{ downloadUrl: string; fileName: string }> => {
  const response = await api.post('/nesting/export/gcode', options);
  return response.data;
};
