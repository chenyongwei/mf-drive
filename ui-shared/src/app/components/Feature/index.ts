/**
 * Feature Flag Components
 *
 * Export all feature flag related components and utilities.
 */

// Re-export enums and types from shared package for convenience
export {
  FeaturePackage,
  DrawingFeature,
  PartFeature,
  NestingFeature,
  CommonFeature,
  UIElement
} from '@dxf-fix/shared';

export type {
  FeatureFlagConfig,
  FeatureFlags,
  FeatureIdentifier,
  UIElementIdentifier
} from '@dxf-fix/shared';

export {
  FeatureGuard,
  PackageGuard,
  FeatureDisabled,
  useFeatureGuard
} from './FeatureGuard';

export {
  FeatureAwareButton,
  FeatureAwareButtonGroup,
  FeatureToggleButton
} from './FeatureAwareButton';
