import type { TFunction } from "i18next";
import type {
  DimensionAction,
  OptimizeAction,
  RibbonItem,
  SelectAction,
  TransformAction,
} from "./RibbonMenu.types";

export interface TransformItem extends RibbonItem<TransformAction> {
  children?: Array<RibbonItem<TransformAction>>;
}

export interface SelectItem extends RibbonItem<SelectAction> {
  shortcut?: string;
}

export const buildDimensionItems = (
  t: TFunction,
): Array<RibbonItem<DimensionAction>> => [
  { id: "scale-100mm", label: t("dimension.100mm") },
  { id: "scale-200mm", label: t("dimension.200mm") },
  { id: "scale-0.5x", label: t("dimension.0_5x") },
  { id: "scale-2x", label: t("dimension.2x") },
  { id: "scale-4x", label: t("dimension.4x") },
  { id: "scale-8x", label: t("dimension.8x") },
  { id: "scale-10x", label: t("dimension.10x") },
  { id: "scale-interactive", label: t("dimension.interactive"), icon: "📐" },
];

export const buildTransformItems = (t: TFunction): TransformItem[] => [
  { id: "translate", label: t("transform.translate"), icon: "✥" },
  { id: "scale-interactive", label: t("transform.interactiveScale"), icon: "⊡" },
  {
    id: "align",
    label: t("transform.align"),
    icon: "⬚",
    children: [
      { id: "align-left", label: t("transform.alignLeft"), icon: "⫷" },
      { id: "align-right", label: t("transform.alignRight"), icon: "⫸" },
      { id: "align-center-h", label: t("transform.alignCenterH"), icon: "⫹" },
      { id: "align-top", label: t("transform.alignTop"), icon: "⫺" },
      { id: "align-bottom", label: t("transform.alignBottom"), icon: "⫼" },
      { id: "align-center-v", label: t("transform.alignCenterV"), icon: "⫻" },
      { id: "align-center", label: t("transform.alignCenter"), icon: "⨁" },
    ],
  },
  { id: "mirror-horizontal", label: t("transform.mirrorH"), icon: "⬌" },
  { id: "mirror-vertical", label: t("transform.mirrorV"), icon: "⇅" },
  { id: "mirror-arbitrary", label: t("transform.mirrorArbitrary"), icon: "↗" },
  { id: "rotate-ccw-90", label: t("transform.rotateCCW90"), icon: "↺" },
  { id: "rotate-cw-90", label: t("transform.rotateCW90"), icon: "↻" },
  { id: "rotate-180", label: t("transform.rotate180"), icon: "⟳" },
  { id: "rotate-arbitrary", label: t("transform.rotateArbitrary"), icon: "⟲" },
];

export const buildSelectItems = (t: TFunction): SelectItem[] => [
  { id: "select-all", label: t("select.all"), shortcut: "Ctrl+A", icon: "☑" },
  { id: "select-invert", label: t("select.invert"), shortcut: "Ctrl+I", icon: "☒" },
  { id: "deselect", label: t("select.none"), shortcut: "Esc", icon: "☐" },
  { id: "select-open", label: t("select.open"), icon: "∩" },
  { id: "select-type-line", label: t("select.lines"), icon: "—" },
  { id: "select-type-polyline", label: t("select.polylines"), icon: "⌇" },
  { id: "select-type-circle", label: t("select.circles"), icon: "○" },
  { id: "select-type-text", label: t("select.text"), icon: "T", shortcut: "Alt+T" },
];

export const buildOptimizeItems = (
  t: TFunction,
): Array<RibbonItem<OptimizeAction>> => [
  { id: "curve-smooth", label: t("optimize.smooth"), icon: "∿" },
  { id: "curve-split", label: t("optimize.split"), icon: "➗" },
  { id: "remove-duplicates", label: t("optimize.removeDuplicates") },
  { id: "remove-small", label: t("optimize.removeSmall") },
  { id: "merge-connected", label: t("optimize.mergeConnected") },
];
