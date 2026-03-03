/**
 * Feature-Aware Button Components
 *
 * Button components that respect feature flags.
 * Automatically hide or disable buttons based on feature availability.
 */

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
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
// Feature Aware Button
// ============================================================================

interface FeatureAwareButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Feature package category */
  packageKey: FeaturePackage;
  /** Feature within the package */
  featureKey: DrawingFeature | PartFeature | NestingFeature | CommonFeature;
  /** Optional: Specific UI element within the feature */
  elementKey?: UIElement;
  /** Button content */
  children: ReactNode;
  /** Optional: Content to render when feature is disabled */
  fallback?: ReactNode;
  /** Optional: Disable button instead of hiding when feature is disabled */
  disableInsteadOfHide?: boolean;
  /** Optional: Tooltip to show when disabled */
  disabledTooltip?: string;
}

/**
 * Feature Aware Button
 *
 * Button component that respects feature flags.
 * Can either hide or disable the button when the feature is not available.
 *
 * @example
 * ```tsx
 * // Hide button when feature is disabled
 * <FeatureAwareButton
 *   packageKey={FeaturePackage.DRAWING}
 *   featureKey={DrawingFeature.OPTIMIZATION}
 *   elementKey={UIElement.MERGE_LINES}
 *   onClick={handleMergeLines}
 * >
 *   合并相连线
 * </FeatureAwareButton>
 *
 * // Disable button with tooltip when feature is disabled
 * <FeatureAwareButton
 *   packageKey={FeaturePackage.PART}
 *   featureKey={PartFeature.PROCESS}
 *   elementKey={UIElement.MICRO_CONNECTION}
 *   disableInsteadOfHide
 *   disabledTooltip="此功能需要升级到专业版"
 *   onClick={handleMicroConnection}
 * >
 *   微连
 * </FeatureAwareButton>
 * ```
 */
export const FeatureAwareButton: React.FC<FeatureAwareButtonProps> = ({
  packageKey,
  featureKey,
  elementKey,
  children,
  fallback = null,
  disableInsteadOfHide = false,
  disabledTooltip,
  onClick,
  disabled,
  className = '',
  ...props
}) => {
  const { isFeatureEnabled, isUIElementEnabled } = useFeatureFlags();

  const isEnabled = elementKey
    ? isUIElementEnabled(packageKey, featureKey, elementKey)
    : isFeatureEnabled(packageKey, featureKey);

  // Feature is disabled and we should hide the button
  if (!isEnabled && !disableInsteadOfHide) {
    return <>{fallback}</>;
  }

  // Feature is disabled but we should show a disabled button
  const isActuallyDisabled = disabled || !isEnabled;

  return (
    <button
      onClick={onClick}
      disabled={isActuallyDisabled}
      className={className}
      title={isActuallyDisabled ? disabledTooltip : props.title}
      {...props}
    >
      {children}
    </button>
  );
};

// ============================================================================
// Feature Aware Button Group
// ============================================================================

interface FeatureButton {
  id: string;
  packageKey: FeaturePackage;
  featureKey: DrawingFeature | PartFeature | NestingFeature | CommonFeature;
  elementKey?: UIElement;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
}

interface FeatureAwareButtonGroupProps {
  buttons: FeatureButton[];
  /** Layout direction */
  direction?: 'row' | 'column';
  /** Additional CSS class name */
  className?: string;
  /** Optional: Disable buttons instead of hiding */
  disableInsteadOfHide?: boolean;
  /** Optional: Tooltip for disabled buttons */
  disabledTooltip?: string;
}

/**
 * Feature Aware Button Group
 *
 * Renders a group of buttons based on feature flags.
 * Automatically filters out disabled features.
 *
 * @example
 * ```tsx
 * const optimizationButtons = [
 *   {
 *     id: 'merge',
 *     packageKey: FeaturePackage.DRAWING,
 *     featureKey: DrawingFeature.OPTIMIZATION,
 *     elementKey: UIElement.MERGE_LINES,
 *     label: '合并相连线',
 *     onClick: handleMerge
 *   },
 *   {
 *     id: 'removeDuplicates',
 *     packageKey: FeaturePackage.DRAWING,
 *     featureKey: DrawingFeature.OPTIMIZATION,
 *     elementKey: UIElement.REMOVE_DUPLICATES,
 *     label: '去除重复线',
 *     onClick: handleRemoveDuplicates
 *   }
 * ];
 *
 * <FeatureAwareButtonGroup
 *   buttons={optimizationButtons}
 *   direction="row"
 * />
 * ```
 */
export const FeatureAwareButtonGroup: React.FC<FeatureAwareButtonGroupProps> = ({
  buttons,
  direction = 'row',
  className = '',
  disableInsteadOfHide = false,
  disabledTooltip
}) => {
  const { isFeatureEnabled, isUIElementEnabled } = useFeatureFlags();

  const enabledButtons = buttons.filter(btn => {
    const isEnabled = btn.elementKey
      ? isUIElementEnabled(btn.packageKey, btn.featureKey, btn.elementKey)
      : isFeatureEnabled(btn.packageKey, btn.featureKey);

    return disableInsteadOfHide || isEnabled;
  });

  if (enabledButtons.length === 0) {
    return null;
  }

  const groupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    gap: direction === 'row' ? '8px' : '4px'
  };

  return (
    <div className={className} style={groupStyle}>
      {enabledButtons.map(btn => {
        const isEnabled = btn.elementKey
          ? isUIElementEnabled(btn.packageKey, btn.featureKey, btn.elementKey)
          : isFeatureEnabled(btn.packageKey, btn.featureKey);

        return (
          <button
            key={btn.id}
            onClick={btn.onClick}
            disabled={btn.disabled || (disableInsteadOfHide ? !isEnabled : false)}
            title={btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label}
          >
            {btn.icon && <span className="button-icon">{btn.icon}</span>}
            <span className="button-label">{btn.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// Feature Toggle Button (with visual state)
// ============================================================================

interface FeatureToggleButtonProps {
  packageKey: FeaturePackage;
  featureKey: DrawingFeature | PartFeature | NestingFeature | CommonFeature;
  elementKey?: UIElement;
  /** Current toggle state */
  isActive: boolean;
  /** Toggle handler */
  onToggle: (active: boolean) => void;
  /** Button content */
  children: ReactNode;
  /** Optional: Fallback when feature disabled */
  fallback?: ReactNode;
}

/**
 * Feature Toggle Button
 *
 * A toggle button that respects feature flags.
 * Shows active/inactive state when feature is enabled.
 *
 * @example
 * ```tsx
 * const [showBoundingBox, setShowBoundingBox] = useState(true);
 *
 * <FeatureToggleButton
 *   packageKey={FeaturePackage.COMMON}
 *   featureKey={CommonFeature.BOUNDING_BOX}
 *   isActive={showBoundingBox}
 *   onToggle={setShowBoundingBox}
 * >
 *   边框显示
 * </FeatureToggleButton>
 * ```
 */
export const FeatureToggleButton: React.FC<FeatureToggleButtonProps> = ({
  packageKey,
  featureKey,
  elementKey,
  isActive,
  onToggle,
  children,
  fallback = null
}) => {
  const { isFeatureEnabled, isUIElementEnabled } = useFeatureFlags();

  const isEnabled = elementKey
    ? isUIElementEnabled(packageKey, featureKey, elementKey)
    : isFeatureEnabled(packageKey, featureKey);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return (
    <button
      onClick={() => onToggle(!isActive)}
      className={isActive ? 'active' : ''}
      aria-pressed={isActive}
    >
      {children}
    </button>
  );
};
