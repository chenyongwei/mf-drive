import { useEffect, useState } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import type {
  NestingConfiguration,
  NestingLayoutViewMode,
  NestingPart,
  NestingProcessToolbarPrefs,
  Plate,
} from "../../../components/CAD/types/NestingTypes";
import type { InspectionLevel, InspectionResult } from "@dxf-fix/shared/types/inspection";
import {
  DEFAULT_DISTANCE_GUIDE_MAX,
  DEFAULT_NESTING_PROCESS_TOOLBAR_PREFS,
  DEFAULT_SNAP_TOLERANCE,
  NESTING_PROCESS_TOOLBAR_PREFS_KEY,
  normalizeDistanceGuideMaxDistance,
  normalizeNestingProcessToolbarPrefs,
  normalizeSnapTolerance,
} from "../CADPageLayout.behavior";
import type { FileData } from "../CADPageLayout.file-utils";

type ActivePanel = "history" | "layouts" | "text" | null;
type InspectionCoordinateSpace = "local" | "world";
type CadTheme = "dark" | "light";

interface UseCadPageStateOptions {
  initialMode: "drawing" | "nesting";
  isNestingModeByFlag: boolean;
}

const MOCK_DEFAULT_PLATE_SPECS: Array<{ width: number; height: number }> = [
  { width: 4000, height: 2000 },
  { width: 6000, height: 2000 },
  { width: 8000, height: 2000 },
  { width: 4000, height: 3000 },
  { width: 4000, height: 1500 },
];

export function createDefaultPlates(isMockMode: boolean): Plate[] {
  if (!isMockMode) {
    return [
      {
        id: "plate-1",
        name: "Plate 1",
        width: 2000,
        height: 1000,
        margin: 10,
        position: { x: 0, y: 0 },
      },
    ];
  }

  let currentY = 0;
  return MOCK_DEFAULT_PLATE_SPECS.map((spec, index) => {
    const plate: Plate = {
      id: `plate-${index + 1}`,
      name: `Plate ${index + 1}`,
      width: spec.width,
      height: spec.height,
      margin: 10,
      position: { x: 0, y: currentY },
    };
    currentY += spec.height + 50;
    return plate;
  });
}

function normalizeCadTheme(value: string | null | undefined): CadTheme | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "dark" || normalized === "night") {
    return "dark";
  }
  if (normalized === "light" || normalized === "day") {
    return "light";
  }
  return null;
}

function resolveCadThemeFromDom(): CadTheme | null {
  if (typeof document === "undefined") {
    return null;
  }
  const root = document.documentElement;
  const body = document.body;
  const candidates = [
    root.getAttribute("data-foundation-theme"),
    root.getAttribute("data-foundation-color-mode"),
    root.getAttribute("data-theme"),
    root.getAttribute("data-color-mode"),
    body?.getAttribute("data-theme"),
    body?.getAttribute("data-color-mode"),
  ];
  for (const candidate of candidates) {
    const resolved = normalizeCadTheme(candidate);
    if (resolved) {
      return resolved;
    }
  }
  if (root.classList.contains("dark") || body?.classList.contains("dark")) {
    return "dark";
  }
  return null;
}

function resolveCadThemeFromStorage(): CadTheme | null {
  if (typeof window === "undefined") {
    return null;
  }
  const keys = [
    "foundation-theme",
    "foundation.theme",
    "foundation_ui_theme",
    "mf-theme",
    "mf.theme",
    "theme",
  ];
  for (const key of keys) {
    try {
      const resolved = normalizeCadTheme(window.localStorage.getItem(key));
      if (resolved) {
        return resolved;
      }
    } catch {
      // ignore storage failures
    }
  }
  return null;
}

function resolveInitialCadTheme(): CadTheme {
  const domTheme = resolveCadThemeFromDom();
  if (domTheme) {
    return domTheme;
  }
  const storageTheme = resolveCadThemeFromStorage();
  if (storageTheme) {
    return storageTheme;
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export const useCadPageState = ({
  initialMode,
  isNestingModeByFlag,
}: UseCadPageStateOptions) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedListFileIds, setSelectedListFileIds] = useState<Set<string>>(new Set());
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [checkedFileIds, setCheckedFileIds] = useState<Set<string>>(new Set());
  const [entitiesMap, setEntitiesMap] = useState<Record<string, Entity[]>>({});
  const [isNestingMode, setIsNestingMode] = useState(initialMode === "nesting" || isNestingModeByFlag);
  const [isEditMode, setIsEditMode] = useState(true);
  const [activeTab, setActiveTab] = useState<"DXF" | "PRTS" | "PDF">(
    initialMode === "nesting" || isNestingModeByFlag ? "PRTS" : "DXF",
  );
  const isMockMode = import.meta.env.VITE_API_MODE === "mock";
  const shouldPreloadMockPrts =
    import.meta.env.VITE_API_MODE === "mock" && (initialMode === "nesting" || isNestingModeByFlag);
  const [theme, setTheme] = useState<"dark" | "light">(() => resolveInitialCadTheme());
  const [explodeAnimationPoints, setExplodeAnimationPoints] = useState<Array<{ x: number; y: number }> | null>(null);
  const [draggedEntityInfo, setDraggedEntityInfo] = useState<{ id: string; offset: { x: number; y: number } } | null>(null);
  const [isScaleMode, setIsScaleMode] = useState(false);
  const [preferredLayoutAnchorFileId, setPreferredLayoutAnchorFileId] = useState<string | null>(null);
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);
  const [inspectionCoordinateSpace, setInspectionCoordinateSpace] = useState<InspectionCoordinateSpace>("local");
  const [highlightedIssueId, setHighlightedIssueId] = useState<string | null>(null);
  const [showOnlyLevel, setShowOnlyLevel] = useState<InspectionLevel | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [shouldFitToView, setShouldFitToView] = useState(false);
  const [isPlatesModalOpen, setIsPlatesModalOpen] = useState(false);
  const [plates, setPlates] = useState<Plate[]>(() => createDefaultPlates(isMockMode));
  const [layoutViewMode, setLayoutViewMode] = useState<NestingLayoutViewMode>("multi");
  const [selectedPlateIds, setSelectedPlateIds] = useState<string[]>([]);
  const [lastSinglePlateId, setLastSinglePlateId] = useState<string | null>(null);
  const [nestingConfig, setNestingConfig] = useState<NestingConfiguration>(() => {
    try {
      const stored = localStorage.getItem("dxf-fix-nesting-config");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          partSpacing: parsed.partSpacing ?? 5,
          rotationStep: parsed.rotationStep ?? 90,
          fineRotationStep: parsed.fineRotationStep ?? 1,
          snappingEnabled: parsed.snappingEnabled ?? true,
          snapTolerance: normalizeSnapTolerance(parsed.snapTolerance),
          showDistanceGuides: typeof parsed.showDistanceGuides === "boolean" ? parsed.showDistanceGuides : true,
          distanceGuideMaxDistance: normalizeDistanceGuideMaxDistance(parsed.distanceGuideMaxDistance),
          commonEdgeEnabled: typeof parsed.commonEdgeEnabled === "boolean" ? parsed.commonEdgeEnabled : true,
          stickToEdge: parsed.stickToEdge ?? false,
          penetrationMode: parsed.penetrationMode ?? false,
        };
      }
    } catch (error) {
      console.error("Failed to load nesting config", error);
    }
    return {
      partSpacing: 5,
      rotationStep: 90,
      fineRotationStep: 1,
      snappingEnabled: true,
      snapTolerance: DEFAULT_SNAP_TOLERANCE,
      showDistanceGuides: true,
      distanceGuideMaxDistance: DEFAULT_DISTANCE_GUIDE_MAX,
      commonEdgeEnabled: true,
      stickToEdge: false,
      penetrationMode: false,
    };
  });
  const [nestingProcessToolbarPrefs, setNestingProcessToolbarPrefs] = useState<NestingProcessToolbarPrefs>(() => {
    try {
      const stored = localStorage.getItem(NESTING_PROCESS_TOOLBAR_PREFS_KEY);
      if (!stored) {
        return { ...DEFAULT_NESTING_PROCESS_TOOLBAR_PREFS, primaryActionByOperation: {}, favorites: [], usageStats: {} };
      }
      return normalizeNestingProcessToolbarPrefs(JSON.parse(stored));
    } catch (error) {
      console.error("Failed to load nesting process toolbar prefs", error);
      return { ...DEFAULT_NESTING_PROCESS_TOOLBAR_PREFS, primaryActionByOperation: {}, favorites: [], usageStats: {} };
    }
  });
  const [nestingParts, setNestingParts] = useState<NestingPart[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>("layouts");
  const [historyPanelWidth, setHistoryPanelWidth] = useState(308);
  const [layoutsPanelWidth, setLayoutsPanelWidth] = useState(250);
  const [textPanelWidth, setTextPanelWidth] = useState(320);

  useEffect(() => {
    try {
      localStorage.setItem("dxf-fix-nesting-config", JSON.stringify(nestingConfig));
    } catch {
      // ignore storage failures
    }
  }, [nestingConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(NESTING_PROCESS_TOOLBAR_PREFS_KEY, JSON.stringify(nestingProcessToolbarPrefs));
    } catch {
      // ignore storage failures
    }
  }, [nestingProcessToolbarPrefs]);

  useEffect(() => {
    setActivePanel(isNestingMode ? "layouts" : null);
  }, [isNestingMode]);

  useEffect(() => {
    try {
      localStorage.setItem("foundation-theme", theme);
    } catch {
      // ignore storage failures
    }
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-foundation-theme", theme);
      document.documentElement.setAttribute("data-foundation-color-mode", theme);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("foundation-theme-change", { detail: { theme } }));
      }
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const resolveTheme = (): CadTheme => {
      return resolveCadThemeFromDom()
        ?? resolveCadThemeFromStorage()
        ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    };
    const syncTheme = () => {
      const nextTheme = resolveTheme();
      setTheme((previous) => (previous === nextTheme ? previous : nextTheme));
    };

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: [
        "class",
        "data-theme",
        "data-color-mode",
        "data-foundation-theme",
        "data-foundation-color-mode",
      ],
    });
    observer.observe(body, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-color-mode"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", syncTheme);
    window.addEventListener("storage", syncTheme);
    window.addEventListener("foundation-theme-change", syncTheme);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("foundation-theme-change", syncTheme);
    };
  }, []);

  return {
    files, setFiles, selectedFileId, setSelectedFileId,
    selectedListFileIds, setSelectedListFileIds, selectedPartIds, setSelectedPartIds,
    checkedFileIds, setCheckedFileIds,
    entitiesMap, setEntitiesMap, isNestingMode, setIsNestingMode, isEditMode, setIsEditMode,
    activeTab, setActiveTab, shouldPreloadMockPrts, theme, setTheme, explodeAnimationPoints,
    setExplodeAnimationPoints, draggedEntityInfo, setDraggedEntityInfo, isScaleMode,
    setIsScaleMode, preferredLayoutAnchorFileId, setPreferredLayoutAnchorFileId, inspectionResult,
    setInspectionResult, inspectionCoordinateSpace, setInspectionCoordinateSpace, highlightedIssueId,
    setHighlightedIssueId, showOnlyLevel, setShowOnlyLevel, isInspecting, setIsInspecting,
    shouldFitToView, setShouldFitToView, isPlatesModalOpen, setIsPlatesModalOpen, plates,
    setPlates, layoutViewMode, setLayoutViewMode, selectedPlateIds, setSelectedPlateIds,
    lastSinglePlateId, setLastSinglePlateId, nestingConfig, setNestingConfig,
    nestingProcessToolbarPrefs, setNestingProcessToolbarPrefs, nestingParts, setNestingParts,
    activePanel, setActivePanel, historyPanelWidth, setHistoryPanelWidth, layoutsPanelWidth,
    setLayoutsPanelWidth, textPanelWidth, setTextPanelWidth,
  };
};
