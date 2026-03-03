/**
 * Feature Guard Components
 *
 * Conditional rendering components based on feature flags.
 * Provides three levels of control:
 * 1. Feature Package level
 * 2. Feature level
 * 3. UI Element level
 */

import React from 'react';
import {
  FeaturePackage,
  DrawingFeature,
  PartFeature,
  NestingFeature,
  CommonFeature,
  UIElement
} from '@dxf-fix/shared';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';

// ============================================================================
// Feature Guard Component
// ============================================================================

interface FeatureGuardProps {
  /** Feature package category */
  packageKey: FeaturePackage;
  /** Feature within the package */
  featureKey: DrawingFeature | PartFeature | NestingFeature | CommonFeature;
  /** Optional: Specific UI element within the feature */
  elementKey?: UIElement;
  /** Content to render if feature is enabled */
  children: React.ReactNode;
  /** Optional: Fallback content to render if feature is disabled */
  fallback?: React.ReactNode;
  /** Optional: Render null instead of fallback when disabled */
  renderNull?: boolean;
}

/**
 * Feature Guard Component
 *
 * Conditionally renders children based on feature flag status.
 *
 * @example
 * ```tsx
 * // Feature level control
 * <FeatureGuard
 *   packageKey={FeaturePackage.PART}
 *   featureKey={PartFeature.LAYER_EDIT}
 * >
 *   <LayerEditPanel />
 * </FeatureGuard>
 *
 * // UI Element level control
 * <FeatureGuard
 *   packageKey={FeaturePackage.DRAWING}
 *   featureKey={DrawingFeature.OPTIMIZATION}
 *   elementKey={UIElement.MERGE_LINES}
 * >
 *   <MergeLinesButton />
 * </FeatureGuard>
 *
 * // With fallback
 * <FeatureGuard
 *   packageKey={FeaturePackage.PART}
 *   featureKey={PartFeature.FILL_COLOR}
 *   fallback={<div>Feature not available</div>}
 * >
 *   <FillColorPicker />
 * </FeatureGuard>
 * ```
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  packageKey,
  featureKey,
  elementKey,
  children,
  fallback = null,
  renderNull = false
}) => {
  const { isFeatureEnabled, isUIElementEnabled } = useFeatureFlags();

  const isEnabled = elementKey
    ? isUIElementEnabled(packageKey, featureKey, elementKey)
    : isFeatureEnabled(packageKey, featureKey);

  if (!isEnabled) {
    return renderNull ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// Package Guard Component
// ============================================================================

interface PackageGuardProps {
  /** Feature package category */
  packageKey: FeaturePackage;
  /** Content to render if package has any enabled features */
  children: React.ReactNode;
  /** Optional: Fallback content */
  fallback?: React.ReactNode;
}

/**
 * Package Guard Component
 *
 * Conditionally renders children based on whether a feature package has any enabled features.
 *
 * @example
 * ```tsx
 * <PackageGuard packageKey={FeaturePackage.DRAWING}>
 *   <DrawingToolsPanel />
 * </PackageGuard>
 * ```
 */
export const PackageGuard: React.FC<PackageGuardProps> = ({
  packageKey,
  children,
  fallback = null
}) => {
  const { isPackageEnabled } = useFeatureFlags();

  if (!isPackageEnabled(packageKey)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// Feature Guard Hook (Alternative to Component)
// ============================================================================

/**
 * useFeatureGuard Hook
 *
 * Returns a boolean indicating whether a feature is enabled.
 * Useful for conditional logic outside of JSX.
 *
 * @example
 * ```tsx
 * const showCutting = useFeatureGuard(
 *   FeaturePackage.PART,
 *   PartFeature.LAYER_EDIT
 * );
 *
 * if (showCutting) {
 *   // Enable cutting logic
 * }
 * ```
 */
export const useFeatureGuard = (
  packageKey: FeaturePackage,
  featureKey: DrawingFeature | PartFeature | NestingFeature | CommonFeature,
  elementKey?: UIElement
): boolean => {
  const { isFeatureEnabled, isUIElementEnabled } = useFeatureFlags();

  return elementKey
    ? isUIElementEnabled(packageKey, featureKey, elementKey)
    : isFeatureEnabled(packageKey, featureKey);
};

// ============================================================================
// Inverse Feature Guard (Show when disabled)
// ============================================================================

interface FeatureDisabledProps {
  packageKey: FeaturePackage;
  featureKey: DrawingFeature | PartFeature | NestingFeature | CommonFeature;
  elementKey?: UIElement;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Feature Disabled Component
 *
 * Renders children only when the feature is DISABLED.
 * Useful for showing upgrade prompts or alternative UI.
 *
 * @example
 * ```tsx
 * <FeatureDisabled
 *   packageKey={FeaturePackage.PART}
 *   featureKey={PartFeature.PROCESS}
 *   elementKey={UIElement.MICRO_CONNECTION}
 * >
 *   <UpgradePrompt message="Upgrade to enable micro-connections" />
 * </FeatureDisabled>
 * ```
 */
export const FeatureDisabled: React.FC<FeatureDisabledProps> = ({
  packageKey,
  featureKey,
  elementKey,
  children,
  fallback = null
}) => {
  const isEnabled = useFeatureGuard(packageKey, featureKey, elementKey);

  if (isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
