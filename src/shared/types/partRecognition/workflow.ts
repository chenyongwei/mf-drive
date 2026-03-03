import type { BoundingBox } from '../index';

export type PartRecognitionSource = 'AUTO_RECOGNIZED' | 'FORCED_BY_USER';

export type PartRecognitionValidationStatus =
  | 'PASS'
  | 'HAS_ISSUES'
  | 'NOT_CHECKED';

export type PartRecognitionRiskLevel =
  | 'SAFE_AUTO'
  | 'CONFIRM_AUTO'
  | 'MANUAL_REQUIRED';

export interface PartRecognitionIssue {
  issueId: string;
  type:
    | 'OPEN_CONTOUR'
    | 'DUPLICATE_GEOMETRY'
    | 'OVERLAPPING_GEOMETRY'
    | 'SELF_INTERSECTION'
    | 'SMALL_FRAGMENT'
    | 'UNKNOWN';
  riskLevel: PartRecognitionRiskLevel;
  severity: 'warning' | 'error';
  message: string;
  entityIds?: string[];
  contourId?: string;
  gapDistance?: number;
  metadata?: Record<string, unknown>;
}

export interface PartMetadata {
  source: PartRecognitionSource;
  forced: boolean;
  forcedBy?: string;
  forcedAt?: string;
  originalFileId: string;
  selectionEntityIds?: string[];
  validationStatus: PartRecognitionValidationStatus;
  validationIssues?: PartRecognitionIssue[];
}

export interface RecognizedPart {
  partId: string;
  name: string;
  entityIds: string[];
  contourCount: number;
  holeCount: number;
  area: number;
  bbox: BoundingBox;
  metadata: PartMetadata;
  storagePath: string;
}

export interface PartRecognitionAnalyzeRequest {
  fileVersion: number;
  entityIds?: string[];
  tolerance?: number;
  closeGapThreshold?: number;
}

export interface PartRecognitionAnalyzeResponse {
  fileId: string;
  fileVersion: number;
  summary: {
    totalIssues: number;
    safeAutoCount: number;
    confirmAutoCount: number;
    manualCount: number;
  };
  issues: PartRecognitionIssue[];
  recommendedActions: {
    safeAutoFixIssueIds: string[];
    confirmIssueIds: string[];
    manualIssueIds: string[];
  };
}

export interface PartRecognitionFixRequest {
  fileVersion: number;
  safeAuto: boolean;
  confirmIssueIds?: string[];
  options?: {
    tolerance?: number;
    closeGapThreshold?: number;
  };
}

export interface PartRecognitionRecognizeRequest {
  fileVersion: number;
  entityIds?: string[];
  skipIfHasIssues?: boolean;
  idempotencyKey?: string;
}

export interface PartRecognitionForceSetRequest {
  fileVersion: number;
  entityIds: string[];
  operator?: {
    userId: string;
    name?: string;
  };
  idempotencyKey?: string;
}

export interface PartRecognitionUnsetRequest {
  fileVersion: number;
  partIds: string[];
  removeArtifacts?: boolean;
}
