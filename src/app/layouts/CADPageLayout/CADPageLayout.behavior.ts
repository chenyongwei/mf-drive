import type { NestingProcessOperation, NestingProcessToolbarPrefs } from "../../components/CAD/types/NestingTypes";
import { MAX_PINNED_PROCESS_FAVORITES } from "../../components/CAD/components/RibbonDropdowns";
import { shouldIgnoreCadShortcut } from "../../components/CAD/CADView.shortcuts";

export const DEFAULT_DISTANCE_GUIDE_MAX = 40;
export const MIN_DISTANCE_GUIDE_MAX = 0;
export const MAX_DISTANCE_GUIDE_MAX = 1000;
export const DEFAULT_SNAP_TOLERANCE = 15;
export const MIN_SNAP_TOLERANCE = 0;
export const MAX_SNAP_TOLERANCE = 1000;
export const NESTING_PROCESS_TOOLBAR_PREFS_KEY = "dxf-fix-nesting-process-toolbar-v1";

export const DEFAULT_NESTING_PROCESS_TOOLBAR_PREFS: NestingProcessToolbarPrefs = {
  primaryActionByOperation: {},
  favorites: [],
  usageStats: {},
};

export function normalizeDistanceGuideMaxDistance(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_DISTANCE_GUIDE_MAX;
  }
  const clamped = Math.max(
    MIN_DISTANCE_GUIDE_MAX,
    Math.min(MAX_DISTANCE_GUIDE_MAX, numeric),
  );
  return Number(clamped.toFixed(2));
}

export function normalizeSnapTolerance(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_SNAP_TOLERANCE;
  }
  const clamped = Math.max(
    MIN_SNAP_TOLERANCE,
    Math.min(MAX_SNAP_TOLERANCE, numeric),
  );
  return Number(clamped.toFixed(2));
}

export function shouldIgnoreGlobalCadShortcut(event: KeyboardEvent): boolean {
  return shouldIgnoreCadShortcut(event);
}

export function normalizeNestingProcessToolbarPrefs(
  value: unknown,
): NestingProcessToolbarPrefs {
  if (!value || typeof value !== "object") {
    return {
      ...DEFAULT_NESTING_PROCESS_TOOLBAR_PREFS,
      primaryActionByOperation: {},
      favorites: [],
      usageStats: {},
    };
  }

  const raw = value as Partial<NestingProcessToolbarPrefs>;
  const nextPrimary: Partial<Record<NestingProcessOperation, string>> = {};
  const rawPrimary = raw.primaryActionByOperation;
  if (rawPrimary && typeof rawPrimary === "object") {
    const add = rawPrimary.add;
    const remove = rawPrimary.delete;
    if (typeof add === "string" && add.trim()) {
      nextPrimary.add = add.trim();
    }
    if (typeof remove === "string" && remove.trim()) {
      nextPrimary.delete = remove.trim();
    }
  }

  const nextFavorites = Array.isArray(raw.favorites)
    ? Array.from(
        new Set(
          raw.favorites
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        ),
      ).slice(0, MAX_PINNED_PROCESS_FAVORITES)
    : [];

  const nextUsageStats: NestingProcessToolbarPrefs["usageStats"] = {};
  const rawStats = raw.usageStats;
  if (rawStats && typeof rawStats === "object") {
    Object.entries(rawStats).forEach(([actionId, stat]) => {
      if (!actionId || !stat || typeof stat !== "object") {
        return;
      }
      const countRaw = Number((stat as { count?: unknown }).count);
      const lastUsedAtRaw = Number((stat as { lastUsedAt?: unknown }).lastUsedAt);
      nextUsageStats[actionId] = {
        count: Number.isFinite(countRaw) ? Math.max(0, Math.floor(countRaw)) : 0,
        lastUsedAt: Number.isFinite(lastUsedAtRaw)
          ? Math.max(0, Math.floor(lastUsedAtRaw))
          : 0,
      };
    });
  }

  return {
    primaryActionByOperation: nextPrimary,
    favorites: nextFavorites,
    usageStats: nextUsageStats,
  };
}
