export interface GeometryOptimizationOptions {
  tolerance: number;
  closeGapThreshold: number;
  angleTolerance: number;
  simplifyThreshold: number;
  enableGapClosing: boolean;
  enableDuplicateRemoval: boolean;
  enableSimplification: boolean;
  enableConnection: boolean;
  enableRectangularization: boolean;
}

export interface OptimisationOperation {
  type:
    | 'CLOSE_GAP'
    | 'REMOVE_DUPLICATE'
    | 'SIMPLIFY'
    | 'CONNECT'
    | 'RECTANGULARIZE';
  description: string;
  affectedEntities: string[];
  details?: any;
}

export interface OptimizationSummary {
  gapsClosed: number;
  duplicatesRemoved: number;
  pointsSimplified: number;
  segmentsConnected: number;
  contoursRectangularized: number;
  estimatedImprovement: number;
}

export interface GeometryOptimizationResult {
  success: boolean;
  operations: OptimisationOperation[];
  summary: OptimizationSummary;
  error?: string;
}
