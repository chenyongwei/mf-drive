import type { ParameterExtraction, PlanePart } from './common';
import type { GeometryOptimizationResult } from './optimization';

import type { Point } from '../index';

export interface RecognitionSummary {
  totalParts: number;
  regularParts: number;
  irregularParts: number;
  totalArea: number;
  avgConfidence: number;
  processingTime: number;
}

export interface PartRecognitionResult {
  fileId: string;
  fileName: string;
  parts: PlanePart[];
  parameters: ParameterExtraction;
  optimization?: GeometryOptimizationResult;
  summary: RecognitionSummary;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  error?: string;
  createdAt: string;
}

export interface PartAnnotation {
  partId: string;
  partNumber: string;
  label: string;
  position: Point;
  showDetails: boolean;
}
