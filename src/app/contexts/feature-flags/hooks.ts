import { useContext } from 'react';

import {
  CommonFeature,
  DrawingFeature,
  FeaturePackage,
  NestingFeature,
  PartFeature,
  UIElement,
} from '@dxf-fix/shared';

import { FeatureFlagContext } from './context';
import type { FeatureFlagContextValue, FeatureKey } from './types';

export const useFeatureFlags = (): FeatureFlagContextValue => {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error(
      'useFeatureFlags must be used within a FeatureFlagProvider. ' +
        'Wrap your component tree with <FeatureFlagProvider>.'
    );
  }

  return context;
};

export const useDrawingFeature = (feature: DrawingFeature): boolean => {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(FeaturePackage.DRAWING, feature);
};

export const usePartFeature = (feature: PartFeature): boolean => {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(FeaturePackage.PART, feature);
};

export const useNestingFeature = (feature: NestingFeature): boolean => {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(FeaturePackage.NESTING, feature);
};

export const useCommonFeature = (feature: CommonFeature): boolean => {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(FeaturePackage.COMMON, feature);
};

export const useSafeCommonFeature = (
  feature: CommonFeature,
  defaultValue = true
): boolean => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    return defaultValue;
  }
  return context.isFeatureEnabled(FeaturePackage.COMMON, feature);
};

export const useUIElement = (
  packageKey: FeaturePackage,
  featureKey: FeatureKey,
  elementKey: UIElement
): boolean => {
  const { isUIElementEnabled } = useFeatureFlags();
  return isUIElementEnabled(packageKey, featureKey, elementKey);
};
