export * from './base';
export * from './auth';
export * from './dxf';
export * from './graphic';
export * from './parts';
export * from './rules';
export * from './optimization';
export * from './tile';
export * from './edit';
export * from './validation';
export * from './file';
export * from './exporting';
export * from './gcode';
export * from './view';
export * from './nesting';

// 导出零件识别相关类型
export type {
  PlanePartType,
  PlanePart,
  ContourDetail,
  ContourOptimization,
  TextInfo,
  ParameterExtraction,
  GeometryOptimizationOptions,
  GeometryOptimizationResult,
  OptimisationOperation,
  OptimizationSummary,
  PartRecognitionResult,
  RecognitionSummary,
  PartAnnotation,
  PartRecognitionSource,
  PartRecognitionValidationStatus,
  PartRecognitionRiskLevel,
  PartRecognitionIssue,
  PartMetadata,
  RecognizedPart,
  PartRecognitionAnalyzeRequest,
  PartRecognitionAnalyzeResponse,
  PartRecognitionFixRequest,
  PartRecognitionRecognizeRequest,
  PartRecognitionForceSetRequest,
  PartRecognitionUnsetRequest,
} from './partRecognition';

// 导出检查相关类型
export type {
  InspectionIssue,
  InspectionSummary,
  InspectionResult,
  InspectionStatus,
} from './inspection';

export { InspectionLevel, IssueType } from './inspection';

// Export feature flags (enums and types)
export type {
  FeatureFlagConfig,
  FeatureFlags,
  FeatureIdentifier,
  UIElementIdentifier,
} from '../src/features/featureFlags';

export {
  FeaturePackage,
  DrawingFeature,
  PartFeature,
  NestingFeature,
  CommonFeature,
  UIElement,
} from '../src/features/featureFlags';
