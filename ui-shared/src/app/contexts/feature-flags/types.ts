import type { ReactNode } from 'react';
import type {
  CommonFeature,
  DrawingFeature,
  FeatureFlagConfig,
  FeatureFlags,
  FeaturePackage,
  NestingFeature,
  PartFeature,
  UIElement,
} from '@dxf-fix/shared';

export type FeatureKey =
  | DrawingFeature
  | PartFeature
  | NestingFeature
  | CommonFeature;

export interface FeatureFlagContextValue {
  flags: FeatureFlags;
  isPackageEnabled: (packageKey: FeaturePackage) => boolean;
  isFeatureEnabled: (packageKey: FeaturePackage, featureKey: FeatureKey) => boolean;
  isUIElementEnabled: (
    packageKey: FeaturePackage,
    featureKey: FeatureKey,
    elementKey: UIElement
  ) => boolean;
  getFeatureConfig: (
    packageKey: FeaturePackage,
    featureKey: FeatureKey
  ) => FeatureFlagConfig | undefined;
  toggleFeature: (packageKey: FeaturePackage, featureKey: FeatureKey) => void;
  resetToDefaults: () => void;
  hasUserOverrides: boolean;
}

export interface FeatureFlagProviderProps {
  children: ReactNode;
  customFlags?: FeatureFlags;
}

export const STORAGE_KEY = 'dxf-fix-feature-flags';
