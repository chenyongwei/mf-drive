import type { InspectionResult } from "@dxf-fix/shared/types/inspection";

export type DimensionAction =
  | "scale-100mm"
  | "scale-200mm"
  | "scale-0.5x"
  | "scale-2x"
  | "scale-4x"
  | "scale-8x"
  | "scale-10x"
  | "scale-interactive";

export type TransformAction =
  | "translate"
  | "scale-interactive"
  | "align"
  | "align-left"
  | "align-right"
  | "align-center-h"
  | "align-top"
  | "align-bottom"
  | "align-center-v"
  | "align-center"
  | "mirror-horizontal"
  | "mirror-vertical"
  | "mirror-arbitrary"
  | "rotate-ccw-90"
  | "rotate-cw-90"
  | "rotate-180"
  | "rotate-arbitrary";

export type SelectAction =
  | "select-all"
  | "select-invert"
  | "deselect"
  | "select-open"
  | "select-type-line"
  | "select-type-circle"
  | "select-type-polyline"
  | "select-type-text";

export type OptimizeAction =
  | "curve-smooth"
  | "curve-split"
  | "remove-duplicates"
  | "remove-small"
  | "merge-connected";

export type OpenRibbonMenu =
  | "dimension"
  | "transform"
  | "select"
  | "optimize"
  | null;

export interface RibbonMenuProps {
  onDimensionAction?: (action: DimensionAction) => void;
  onTransformAction?: (action: TransformAction) => void;
  onSelectAction?: (action: SelectAction) => void;
  onOptimizeAction?: (action: OptimizeAction) => void;
  onRunInspection?: () => void;
  onFixAll?: () => void;
  inspectionResult?: InspectionResult | null;
  hasSelection?: boolean;
  isDrawingMode?: boolean;
  theme?: "dark" | "light";
  onThemeToggle?: () => void;
  onLanguageChange?: (lang: "en" | "ja" | "zh-TW" | "zh-CN") => void;
  currentLanguage?: "en" | "ja" | "zh-TW" | "zh-CN";
  isNestingMode?: boolean;
  onNestingModeToggle?: () => void;
  partSpacing?: number;
  onPartSpacingChange?: (value: number) => void;
  fineRotationStep?: number;
  onFineRotationStepChange?: (value: number) => void;
  stickToEdge?: boolean;
  onStickToEdgeChange?: (value: boolean) => void;
  penetrationMode?: boolean;
  onPenetrationModeChange?: (value: boolean) => void;
}

export interface RibbonItem<TAction extends string> {
  id: TAction;
  label: string;
  icon?: string;
}
