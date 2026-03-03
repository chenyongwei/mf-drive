import type { GraphicDocument, GraphicManifest, GraphicOperation } from '@dxf-fix/shared';
import { apiClient } from './api';

type Unit = 'mm' | 'cm' | 'inch' | 'mil';

export interface DrawingDocumentResponse {
  manifest: GraphicManifest;
  document: GraphicDocument;
  operations: GraphicOperation[];
  lastOpSeq: number;
}

export const getDrawingDocument = async (
  fileId: string,
  options: { sinceOp?: number; unitOverride?: Unit } = {}
): Promise<DrawingDocumentResponse> => {
  const response = await apiClient.get(`/drawings/${fileId}/document`, {
    params: {
      sinceOp: options.sinceOp,
      unitOverride: options.unitOverride,
    },
  });
  return response.data;
};

export const getDrawingOperations = async (
  fileId: string,
  options: { after?: number; limit?: number } = {}
): Promise<{ operations: GraphicOperation[] }> => {
  const response = await apiClient.get(`/drawings/${fileId}/operations`, {
    params: {
      after: options.after,
      limit: options.limit,
    },
  });
  return response.data;
};

export interface AppendOperationsRequest {
  clientUnit: Unit;
  origin?: 'API' | 'SYSTEM' | 'ADAPTER';
  operations: GraphicOperation[];
}

export const appendDrawingOperations = async (
  fileId: string,
  payload: AppendOperationsRequest
): Promise<{ operations: GraphicOperation[]; lastOpSeq: number | null }> => {
  const response = await apiClient.post(`/drawings/${fileId}/operations`, payload);
  return response.data;
};

export const convertDrawingToParts = async (
  fileId: string,
  options: { outputUnit?: Unit } = {}
): Promise<{ target: 'parts'; parts: any[] }> => {
  const response = await apiClient.post(`/drawings/${fileId}/convert`, {
    target: 'parts',
    outputUnit: options.outputUnit,
  });
  return response.data;
};

export const compactDrawingDocument = async (fileId: string) => {
  const response = await apiClient.post(`/drawings/${fileId}/compact`);
  return response.data;
};
