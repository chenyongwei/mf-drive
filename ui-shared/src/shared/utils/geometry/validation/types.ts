export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const DEFAULT_TOLERANCE = 1e-6;
