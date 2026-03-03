// ==================== 验证类型 ====================

export type ValidationIssueType =
  | "OPEN_CONTOUR"
  | "DUPLICATE_LINES"
  | "SELF_INTERSECTION"
  | "INVALID_ENTITY";

export type IssueSeverity = "ERROR" | "WARNING" | "INFO";

export interface ValidationIssue {
  type: ValidationIssueType;
  severity: IssueSeverity;
  partId?: string;
  contourId?: string;
  entityId?: string;
  message: string;
  count?: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}
