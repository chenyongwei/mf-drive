import { useCallback, useState } from 'react';

import type {
  FeatureFlags,
  FeaturePackage,
  UIElement,
} from '@dxf-fix/shared';
import { defaultFeatureFlags, deepMerge } from '../../config/featureFlags.config';

import { FeatureFlagContext } from './context';
import type {
  FeatureFlagContextValue,
  FeatureFlagProviderProps,
  FeatureKey,
} from './types';
import { STORAGE_KEY } from './types';

export function FeatureFlagProvider({
  children,
  customFlags,
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    if (customFlags) return customFlags;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return deepMerge(defaultFeatureFlags, JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
    }
    return defaultFeatureFlags;
  });

  const [hasUserOverrides, setHasUserOverrides] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  });

  const saveToStorage = useCallback((newFlags: FeatureFlags) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFlags));
      setHasUserOverrides(true);
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }, []);

  const isPackageEnabled = useCallback(
    (packageKey: FeaturePackage): boolean => {
      const pkg = flags[packageKey];
      if (!pkg) return false;
      return Object.values(pkg).some((feature) => feature?.enabled === true);
    },
    [flags]
  );

  const isFeatureEnabled = useCallback(
    (packageKey: FeaturePackage, featureKey: FeatureKey): boolean => {
      const pkg = flags[packageKey];
      if (!pkg) return false;
      const feature = pkg[featureKey];
      return feature?.enabled ?? false;
    },
    [flags]
  );

  const isUIElementEnabled = useCallback(
    (
      packageKey: FeaturePackage,
      featureKey: FeatureKey,
      elementKey: UIElement
    ): boolean => {
      const pkg = flags[packageKey];
      if (!pkg) return false;
      const feature = pkg[featureKey];
      if (!feature?.enabled) return false;
      const element = feature.children?.[elementKey];
      return element?.enabled ?? false;
    },
    [flags]
  );

  const getFeatureConfig = useCallback(
    (packageKey: FeaturePackage, featureKey: FeatureKey) => {
      const pkg = flags[packageKey];
      if (!pkg) return undefined;
      return pkg[featureKey];
    },
    [flags]
  );

  const toggleFeature = useCallback(
    (packageKey: FeaturePackage, featureKey: FeatureKey): void => {
      setFlags((prevFlags) => {
        const pkg = prevFlags[packageKey];
        if (!pkg) return prevFlags;

        const feature = pkg[featureKey];
        const newFlags = {
          ...prevFlags,
          [packageKey]: {
            ...pkg,
            [featureKey]: {
              ...feature,
              enabled: !feature?.enabled,
            },
          },
        };
        saveToStorage(newFlags);
        return newFlags;
      });
    },
    [saveToStorage]
  );

  const resetToDefaults = useCallback((): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasUserOverrides(false);
    } catch (error) {
      console.warn('Failed to clear feature flags from storage:', error);
    }
    setFlags(defaultFeatureFlags);
  }, []);

  const contextValue: FeatureFlagContextValue = {
    flags,
    isPackageEnabled,
    isFeatureEnabled,
    isUIElementEnabled,
    getFeatureConfig,
    toggleFeature,
    resetToDefaults,
    hasUserOverrides,
  };

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
}
