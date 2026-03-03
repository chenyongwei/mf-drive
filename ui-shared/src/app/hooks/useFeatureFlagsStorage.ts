/**
 * useFeatureFlagsStorage Hook
 * 
 * Manages feature flags state with localStorage persistence.
 * - Loads saved flags from localStorage on init
 * - Merges with default config (defaults as base)
 * - Provides methods to toggle, save, and reset flags
 */

import { useState, useEffect, useCallback } from 'react';
import { FeatureFlags } from '@dxf-fix/shared';
import { defaultFeatureFlags, deepMerge } from '../config/featureFlags.config';

const STORAGE_KEY = 'dxf-fix-feature-flags';

/**
 * Load saved feature flags from localStorage
 */
function loadFromStorage(): Partial<FeatureFlags> | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Failed to load feature flags from storage:', e);
    }
    return null;
}

/**
 * Save feature flags to localStorage
 */
function saveToStorage(flags: Partial<FeatureFlags>): boolean {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
        return true;
    } catch (e) {
        console.warn('Failed to save feature flags to storage:', e);
        return false;
    }
}

/**
 * Clear saved feature flags from localStorage
 */
function clearStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn('Failed to clear feature flags from storage:', e);
    }
}

export interface UseFeatureFlagsStorageResult {
    /** Current merged flags (defaults + user overrides) */
    flags: FeatureFlags;
    /** User-modified overrides only */
    userOverrides: Partial<FeatureFlags>;
    /** Whether there are unsaved changes */
    hasChanges: boolean;
    /** Update flags and save to storage */
    updateFlags: (newFlags: FeatureFlags) => void;
    /** Reset to default configuration */
    resetToDefaults: () => void;
    /** Check if user has any saved overrides */
    hasUserOverrides: boolean;
}

/**
 * Hook for managing feature flags with localStorage persistence
 */
export function useFeatureFlagsStorage(): UseFeatureFlagsStorageResult {
    // User overrides (only the differences from defaults)
    const [userOverrides, setUserOverrides] = useState<Partial<FeatureFlags>>({});

    // Computed merged flags
    const [flags, setFlags] = useState<FeatureFlags>(defaultFeatureFlags);

    // Track if there are unsaved changes
    const [hasChanges, setHasChanges] = useState(false);

    // Load from storage on mount
    useEffect(() => {
        const saved = loadFromStorage();
        if (saved) {
            setUserOverrides(saved);
            setFlags(deepMerge(defaultFeatureFlags, saved));
        }
    }, []);

    // Update flags and persist to storage
    const updateFlags = useCallback((newFlags: FeatureFlags) => {
        // Calculate what's different from defaults
        const overrides = calculateOverrides(defaultFeatureFlags, newFlags);
        setUserOverrides(overrides);
        setFlags(newFlags);
        saveToStorage(overrides);
        setHasChanges(false);
    }, []);

    // Reset to defaults
    const resetToDefaults = useCallback(() => {
        clearStorage();
        setUserOverrides({});
        setFlags(defaultFeatureFlags);
        setHasChanges(false);
    }, []);

    return {
        flags,
        userOverrides,
        hasChanges,
        updateFlags,
        resetToDefaults,
        hasUserOverrides: Object.keys(userOverrides).length > 0
    };
}

/**
 * Calculate the difference between default and current flags
 * Only stores the overrides to minimize storage usage
 */
function calculateOverrides(
    defaults: FeatureFlags,
    current: FeatureFlags
): Partial<FeatureFlags> {
    const overrides: Partial<FeatureFlags> = {};

    for (const pkgKey of Object.keys(current) as (keyof FeatureFlags)[]) {
        const defaultPkg = defaults[pkgKey];
        const currentPkg = current[pkgKey];

        if (!currentPkg) continue;

        const pkgOverrides: Record<string, unknown> = {};
        let hasPkgDiff = false;

        for (const featureKey of Object.keys(currentPkg)) {
            const defaultFeature = defaultPkg?.[featureKey as keyof typeof defaultPkg];
            const currentFeature = currentPkg[featureKey as keyof typeof currentPkg];

            if (!currentFeature) continue;

            // Compare enabled status
            if (currentFeature.enabled !== defaultFeature?.enabled) {
                pkgOverrides[featureKey] = {
                    enabled: currentFeature.enabled,
                    ...(currentFeature.children ? { children: currentFeature.children } : {})
                };
                hasPkgDiff = true;
            } else if (currentFeature.children && defaultFeature?.children) {
                // Deep compare children
                const childOverrides = calculateChildOverrides(
                    defaultFeature.children,
                    currentFeature.children
                );
                if (Object.keys(childOverrides).length > 0) {
                    pkgOverrides[featureKey] = {
                        enabled: currentFeature.enabled,
                        children: childOverrides
                    };
                    hasPkgDiff = true;
                }
            }
        }

        if (hasPkgDiff) {
            (overrides as Record<string, unknown>)[pkgKey] = pkgOverrides;
        }
    }

    return overrides;
}

/**
 * Calculate child-level overrides
 */
function calculateChildOverrides(
    defaults: Record<string, { enabled: boolean }>,
    current: Record<string, { enabled: boolean }>
): Record<string, { enabled: boolean }> {
    const overrides: Record<string, { enabled: boolean }> = {};

    for (const key of Object.keys(current)) {
        if (current[key]?.enabled !== defaults[key]?.enabled) {
            overrides[key] = { enabled: current[key].enabled };
        }
    }

    return overrides;
}
