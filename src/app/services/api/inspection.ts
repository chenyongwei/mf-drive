import type {
  InspectionResult,
  InspectionStatus,
} from '@dxf-fix/shared/types/inspection';

import api from './client';

export const inspectDrawing = async (
  fileId: string,
  tolerance = 0.5
): Promise<InspectionResult> => {
  const response = await api.get(`/drawing/files/${fileId}/inspect`, {
    params: { tolerance },
  });
  return response.data;
};

export const getInspectionStatus = async (
  fileId: string
): Promise<InspectionStatus> => {
  const response = await api.get(`/drawing/files/${fileId}/inspect/status`);
  return response.data;
};

export const inspectBatch = async (
  fileIds: string[],
  entityIds?: string[],
  tolerance = 0.5
): Promise<InspectionResult> => {
  const response = await api.post('/drawing/files/inspect-batch', {
    fileIds,
    entityIds,
    tolerance,
  });
  return response.data;
};
