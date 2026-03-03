import type { CADToolType } from "../../components/CAD/CADToolPanel";
import type {
  NestingConfiguration,
  NestingProcessOperation,
  NestingProcessToolbarPrefs,
} from "../../components/CAD/types/NestingTypes";
import {
  isNestingProcessActionExecutable,
  type NestingProcessActionDef,
  type NestingProcessCapabilityMap,
  type SortingModeId,
} from "../../components/CAD/components/RibbonDropdowns";
import {
  normalizeDistanceGuideMaxDistance,
  normalizeSnapTolerance,
} from "./CADPageLayout.behavior";

type ToolpathMode = "AUTO" | "MANUAL";

interface DispatchRibbonActionOptions {
  action: string;
  isNestingMode: boolean;
  defsById: Record<string, NestingProcessActionDef>;
  nestingProcessCapabilityMap: NestingProcessCapabilityMap;
  handleDimensionAction: (action: string) => void;
  handleTransformAction: (action: string) => void;
  handleSelectAction: (action: string) => void;
  handleTrimToolAction: () => void;
  handleExtendToolAction: () => void;
  handleOptimizeAction: (action: string) => void;
  handleFixAll: () => void;
  handleTriggerInspection: () => void;
  handleIdentifyPart: () => Promise<void>;
  handleForceSetPart: () => Promise<void>;
  handleCancelPart: () => Promise<void>;
  setActiveTool: (tool: CADToolType) => void;
  setPendingCadAction: (value: "explode" | "delete" | null) => void;
  setPendingTrimExtend: (value: null) => void;
  setActivePanel: (panel: "text" | "history" | "layouts" | null) => void;
  showPartActionToast: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
  ) => void;
  showDimensionsDrawing: boolean;
  showDimensionsNesting: boolean;
  setShowDimensionsDrawing: (value: boolean) => void;
  setShowDimensionsNesting: (value: boolean) => void;
  handleToggleShowDimensions: () => void;
  setNestingConfig: (
    updater: (prev: NestingConfiguration) => NestingConfiguration,
  ) => void;
  requestToolpathPlan: (
    mode: ToolpathMode,
    overrideSortMode?: SortingModeId,
  ) => Promise<void>;
  requestToolpathCheck: () => Promise<void>;
  setToolpathOverrides: (
    value: {
      startPointOverrides: Array<{ contourId: string; startPointParam: number; direction?: "CW" | "CCW" }>;
      leadOverrides: Array<{
        contourId: string;
        leadIn?: { enabled: boolean; length: number; angleDeg: number };
        leadOut?: { enabled: boolean; length: number; angleDeg: number };
      }>;
      sequenceOverrides: Array<{ contourId: string; order: number }>;
    },
  ) => void;
  setToolpathPlan: (value: null) => void;
  setShowToolpathOverlay: (updater: (prev: boolean) => boolean) => void;
  applyStartPointOverride: () => void;
  applyLeadOverride: () => void;
  applySequenceOverride: () => void;
  exportToolpathByPlan: () => Promise<void>;
  setNestingProcessToolbarPrefs: (
    updater: (prev: NestingProcessToolbarPrefs) => NestingProcessToolbarPrefs,
  ) => void;
}

export type DispatchRibbonActionContext = Omit<
  DispatchRibbonActionOptions,
  "action" | "isNestingMode" | "defsById" | "nestingProcessCapabilityMap"
>;

export function dispatchRibbonAction({
  action,
  isNestingMode,
  defsById,
  nestingProcessCapabilityMap,
  handleDimensionAction,
  handleTransformAction,
  handleSelectAction,
  handleTrimToolAction,
  handleExtendToolAction,
  handleOptimizeAction,
  handleFixAll,
  handleTriggerInspection,
  handleIdentifyPart,
  handleForceSetPart,
  handleCancelPart,
  setActiveTool,
  setPendingCadAction,
  setPendingTrimExtend,
  setActivePanel,
  showPartActionToast,
  showDimensionsDrawing,
  showDimensionsNesting,
  setShowDimensionsDrawing,
  setShowDimensionsNesting,
  handleToggleShowDimensions,
  setNestingConfig,
  requestToolpathPlan,
  requestToolpathCheck,
  setToolpathOverrides,
  setToolpathPlan,
  setShowToolpathOverlay,
  applyStartPointOverride,
  applyLeadOverride,
  applySequenceOverride,
  exportToolpathByPlan,
  setNestingProcessToolbarPrefs,
}: DispatchRibbonActionOptions): void {
  if (action.startsWith("scale-")) {
    handleDimensionAction(action);
    return;
  }
  if (["translate", "align", "mirror", "rotate"].some((prefix) => action.startsWith(prefix))) {
    handleTransformAction(action);
    return;
  }
  if (action.startsWith("select-")) {
    handleSelectAction(action);
    return;
  }

  const processActionDef = isNestingMode ? defsById[action] : undefined;
  if (processActionDef) {
    const executable = isNestingProcessActionExecutable(
      processActionDef.id,
      nestingProcessCapabilityMap,
    );
    const now = Date.now();
    setNestingProcessToolbarPrefs((prev) => {
      const previousStat = prev.usageStats[processActionDef.id] ?? {
        count: 0,
        lastUsedAt: 0,
      };
      return {
        ...prev,
        primaryActionByOperation: {
          ...prev.primaryActionByOperation,
          [processActionDef.operation]: processActionDef.id,
        },
        usageStats: {
          ...prev.usageStats,
          [processActionDef.id]: {
            count: previousStat.count + 1,
            lastUsedAt: now,
          },
        },
      };
    });
    if (!executable) {
      showPartActionToast(`${processActionDef.label}（开发中）`, "info");
      return;
    }
  }

  if (action === "trim" || action === "extend") {
    if (action === "trim") handleTrimToolAction();
    else handleExtendToolAction();
    return;
  }

  if (["split", "simplify", "chamfer", "bridge", "text-explode"].includes(action)) {
    handleOptimizeAction(action);
    return;
  }
  if (action === "fix-all") return handleFixAll();
  if (action === "inspection") return handleTriggerInspection();
  if (action === "identify-part") return void handleIdentifyPart();
  if (action === "set-as-part") return void handleForceSetPart();
  if (action === "cancel-part") return void handleCancelPart();

  if (action === "draw-dimension") {
    setActiveTool("draw-dimension");
    if (isNestingMode && !showDimensionsNesting) setShowDimensionsNesting(true);
    else if (!isNestingMode && !showDimensionsDrawing) setShowDimensionsDrawing(true);
    return;
  }

  if (action === "text-edit") {
    setActiveTool("draw-text");
    setPendingCadAction(null);
    setPendingTrimExtend(null);
    if (!isNestingMode) setActivePanel("text");
    showPartActionToast("文字工具：点击画布放置后输入文字", "info");
    return;
  }
  if (action === "show-dimensions") return handleToggleShowDimensions();
  if (action === "enable-common-edge") return setNestingConfig((prev) => ({ ...prev, commonEdgeEnabled: !prev.commonEdgeEnabled }));
  if (action === "enable-stick-edge") return setNestingConfig((prev) => ({ ...prev, stickToEdge: !prev.stickToEdge }));
  if (action === "enable-snapping") return setNestingConfig((prev) => ({ ...prev, snappingEnabled: !prev.snappingEnabled }));

  if (action.startsWith("set-snap-tolerance:")) {
    const rawValue = Number.parseFloat(action.replace("set-snap-tolerance:", ""));
    if (Number.isFinite(rawValue)) {
      setNestingConfig((prev) => ({ ...prev, snapTolerance: normalizeSnapTolerance(rawValue) }));
    }
    return;
  }
  if (action === "show-distance-guides") {
    setNestingConfig((prev) => ({ ...prev, showDistanceGuides: !prev.showDistanceGuides }));
    return;
  }
  if (action.startsWith("set-distance-guide-max:") || action.startsWith("distance-guide-max-")) {
    const rawValue = Number.parseFloat(action.replace("set-distance-guide-max:", "").replace("distance-guide-max-", ""));
    if (Number.isFinite(rawValue)) {
      setNestingConfig((prev) => ({ ...prev, distanceGuideMaxDistance: normalizeDistanceGuideMaxDistance(rawValue) }));
    }
    return;
  }

  if (action === "nest-auto") {
    setToolpathOverrides({ startPointOverrides: [], leadOverrides: [], sequenceOverrides: [] });
    void requestToolpathPlan("AUTO");
    return;
  }
  if (action === "sort-check") return void requestToolpathCheck();
  if (action === "sort-clear-check") return setToolpathPlan(null);
  if (action === "show-path") return setShowToolpathOverlay((prev) => !prev);
  if (action === "check-leads-current") return applyStartPointOverride();
  if (action === "micro-edit") return applyLeadOverride();
  if (action === "sort-part" || action === "sort-inner") return applySequenceOverride();
  if (action === "sort-inner-outer") return void requestToolpathPlan("AUTO", "sort-inner-outer");
  if (action === "sort-left-right") return void requestToolpathPlan("AUTO", "sort-left-right");
  if (action === "sort-top-bottom") return void requestToolpathPlan("AUTO", "sort-top-bottom");
  if (action === "sort-bottom-top") return void requestToolpathPlan("AUTO", "sort-bottom-top");
  if (action === "export-top-dxf" || action === "export-top-pdf") return void exportToolpathByPlan();
  if (processActionDef) return;

  console.log("[Ribbon Action] Unhandled:", action);
}
