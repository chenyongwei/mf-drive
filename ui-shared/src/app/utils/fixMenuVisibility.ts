export interface InspectionSummaryLike {
  error?: number | null;
  warning?: number | null;
}

export interface InspectionResultLike {
  summary?: InspectionSummaryLike | null;
}

export function shouldShowFixMenu(inspectionResult: InspectionResultLike | null | undefined): boolean {
  const errorCount = Number(inspectionResult?.summary?.error ?? 0);
  const warningCount = Number(inspectionResult?.summary?.warning ?? 0);
  return errorCount > 0 || warningCount > 0;
}

