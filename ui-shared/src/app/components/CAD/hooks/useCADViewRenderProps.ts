import type { ComponentProps, MouseEvent, WheelEvent } from "react";
import type { CADToolType } from "../CADToolPanel";
import { CADViewCanvasLayer } from "../components/CADViewCanvasLayer";
import { CADViewOverlayUI } from "../components/CADViewOverlayUI";

type CanvasProps = ComponentProps<typeof CADViewCanvasLayer>;
type OverlayProps = ComponentProps<typeof CADViewOverlayUI>;

interface CADViewRenderContext {
  containerRef: CanvasProps["containerRef"];
  canvasRef: CanvasProps["canvasRef"];
  textEditorRef: CanvasProps["textEditorRef"];
  containerSize: CanvasProps["containerSize"];
  isNestingMode: boolean;
  backgroundColor: string;
  activeViewport: CanvasProps["activeViewport"];
  theme: CanvasProps["theme"];
  alignmentGuides: CanvasProps["alignmentGuides"];
  partNesting: any;
  effectiveParts: CanvasProps["effectiveParts"];
  partSpacing: number;
  toolpathOverlaySegments: CanvasProps["toolpathOverlaySegments"];
  arrowMarkerCut: CanvasProps["arrowMarkerCut"];
  arrowMarkerAux: CanvasProps["arrowMarkerAux"];
  arrowLod: CanvasProps["arrowLod"];
  segmentArrowPointsById: CanvasProps["segmentArrowPointsById"];
  cutStrokeWidth: number;
  auxStrokeWidth: number;
  showDimensions: boolean;
  selectedPartIds: CanvasProps["selectedPartIds"];
  previewEntity: any;
  effectiveEntities: CanvasProps["entitiesForDimensions"];
  selectedEntitySet: CanvasProps["selectedEntityIds"];
  hoveredEntityId: string | null;
  activeTool: CADToolType;
  textInputScreenPoint: CanvasProps["textInputScreenPoint"];
  textDraftContent: string;
  updateTextDraft: CanvasProps["updateTextDraft"];
  commitTextDraft: CanvasProps["commitTextDraft"];
  cancelDrawing: CanvasProps["cancelDrawing"];
  handleToolSelect: (tool: CADToolType) => void;
  handleMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (event: MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: (event: MouseEvent<HTMLDivElement>) => void;
  handleMouseLeave: (event: MouseEvent<HTMLDivElement>) => void;
  handleWheel: (event: WheelEvent<HTMLDivElement>) => void;
  handleDragOver: CanvasProps["handleDragOver"];
  handleDrop: CanvasProps["handleDrop"];
  finishDrawing: () => void;
}

interface CADViewOverlayContext {
  activeTool: CADToolType;
  handleToolSelect: (tool: CADToolType) => void;
  isEditMode: boolean;
  isNestingMode: boolean;
  isScaleMode: boolean;
  selectionBBox: OverlayProps["selectionBBox"];
  selectedEntityIds: OverlayProps["selectedEntityIds"];
  hasEditableEntities: OverlayProps["hasEditableEntities"];
  editToolsEnabled: OverlayProps["editToolsEnabled"];
  canUndo: OverlayProps["canUndo"];
  canRedo: OverlayProps["canRedo"];
  onUndo?: OverlayProps["onUndo"];
  onRedo?: OverlayProps["onRedo"];
  onDelete?: OverlayProps["onDelete"];
  onTrim?: OverlayProps["onTrim"];
  onExtend?: OverlayProps["onExtend"];
  onExplode?: OverlayProps["onExplode"];
  zoomIn: () => void;
  zoomOut: () => void;
  contentBox: any;
  fitToView: (contentBox: any, containerSize: { width: number; height: number }) => void;
  containerSize: { width: number; height: number };
  showDimensions: boolean;
  theme: OverlayProps["theme"];
  snapPoint: OverlayProps["snapPoint"];
  activeViewport: OverlayProps["viewport"];
  fileBoxes: OverlayProps["fileBoxes"];
  labels: OverlayProps["labels"];
  boxSelection: {
    isSelecting: boolean;
    currentRect: OverlayProps["currentRect"];
    selectionMode: OverlayProps["selectionMode"];
    selectionCount: number;
  };
  explodeAnimationPoints?: OverlayProps["explodeAnimationPoints"];
  interactiveScale: any;
  plates: OverlayProps["plates"];
  stats: OverlayProps["stats"];
  entitiesCount: number;
  fineRotationStep: number;
  onFineRotationStepChange?: (value: number) => void;
  stickToEdge: boolean;
  partNesting: {
    getUtilization: () => number;
    dragPreview?: {
      targetPlateId?: string | null;
    } | null;
  };
  layoutViewMode?: OverlayProps["layoutViewMode"];
  remainingPartSummary?: OverlayProps["remainingPartSummary"];
}

interface UseCADViewRenderPropsOptions {
  canvas: CADViewRenderContext;
  overlay: CADViewOverlayContext;
}

export function useCADViewRenderProps({ canvas, overlay }: UseCADViewRenderPropsOptions) {
  const nestingTransparentBackground =
    canvas.theme === "light" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0)";
  const canvasLayerProps: CanvasProps = {
    containerRef: canvas.containerRef,
    canvasRef: canvas.canvasRef,
    containerSize: canvas.containerSize,
    rendererBackgroundColor: canvas.isNestingMode
      ? nestingTransparentBackground
      : canvas.backgroundColor,
    backgroundColor: canvas.backgroundColor,
    activeViewport: canvas.activeViewport,
    theme: canvas.theme,
    isNestingMode: canvas.isNestingMode,
    alignmentGuides: canvas.alignmentGuides,
    draggingPartId: canvas.partNesting.draggingPartId,
    currentSnap: canvas.partNesting.currentSnap,
    effectiveParts: canvas.effectiveParts,
    partSpacing: canvas.partSpacing,
    dragPreviewFlags: {
      isValid: canvas.partNesting.dragPreview?.isValid ?? true,
      hasCollision: canvas.partNesting.dragPreview?.hasCollision ?? false,
      hasSpacingInterference: canvas.partNesting.dragPreview?.hasSpacingInterference ?? false,
      hasBoundaryInterference:
        canvas.partNesting.dragPreview?.hasBoundaryInterference ?? false,
      hasMarginInterference:
        canvas.partNesting.dragPreview?.hasMarginInterference ?? false,
      boundaryState:
        canvas.partNesting.dragPreview?.boundaryState ?? "outside_plate",
      boundaryReason:
        canvas.partNesting.dragPreview?.boundaryReason ?? "none",
      targetPlateId: canvas.partNesting.dragPreview?.targetPlateId ?? null,
      isCopyPreview: canvas.partNesting.dragPreview?.isCopyPreview ?? false,
      copyRemainingCount:
        canvas.partNesting.dragPreview?.remainingCount ??
        canvas.partNesting.stickyRemainingCount ??
        0,
    },
    lastValidDragPosition: canvas.partNesting.lastValidDragPosition,
    toolpathOverlaySegments: canvas.toolpathOverlaySegments,
    arrowMarkerCut: canvas.arrowMarkerCut,
    arrowMarkerAux: canvas.arrowMarkerAux,
    arrowLod: canvas.arrowLod,
    segmentArrowPointsById: canvas.segmentArrowPointsById,
    cutStrokeWidth: canvas.cutStrokeWidth,
    auxStrokeWidth: canvas.auxStrokeWidth,
    showDimensions: canvas.showDimensions,
    selectedPartIds: canvas.selectedPartIds,
    entitiesForDimensions: canvas.previewEntity
      ? [...canvas.effectiveEntities, canvas.previewEntity]
      : canvas.effectiveEntities,
    textOverlayEntities: canvas.effectiveEntities,
    selectedEntityIds: canvas.selectedEntitySet,
    hoveredEntityId: canvas.hoveredEntityId,
    activeTool: canvas.activeTool,
    textInputScreenPoint: canvas.textInputScreenPoint,
    textDraftContent: canvas.textDraftContent,
    textEditorRef: canvas.textEditorRef,
    updateTextDraft: canvas.updateTextDraft,
    commitTextDraft: canvas.commitTextDraft,
    cancelDrawing: canvas.cancelDrawing,
    handleToolSelect: canvas.handleToolSelect,
    handleContextMenu: (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    },
    handleMouseDown: canvas.handleMouseDown,
    handleMouseMove: canvas.handleMouseMove,
    handleMouseUp: canvas.handleMouseUp,
    handleMouseLeave: canvas.handleMouseLeave,
    handleDoubleClick: (event) => {
      event.preventDefault();
      canvas.finishDrawing();
    },
    handleWheel: canvas.handleWheel,
    handleDragOver: canvas.handleDragOver,
    handleDrop: canvas.handleDrop,
  };

  const overlayProps: OverlayProps = {
    activeTool: overlay.activeTool,
    onToolSelect: overlay.handleToolSelect,
    isEditMode: overlay.isEditMode,
    isNestingMode: overlay.isNestingMode,
    isScaleMode: overlay.isScaleMode,
    selectionBBox: overlay.selectionBBox,
    selectedEntityIds: overlay.selectedEntityIds,
    hasEditableEntities: overlay.hasEditableEntities,
    editToolsEnabled: overlay.editToolsEnabled,
    canUndo: overlay.canUndo,
    canRedo: overlay.canRedo,
    onUndo: overlay.onUndo,
    onRedo: overlay.onRedo,
    onDelete: overlay.onDelete,
    onTrim: overlay.onTrim,
    onExtend: overlay.onExtend,
    onExplode: overlay.onExplode,
    zoomIn: overlay.zoomIn,
    zoomOut: overlay.zoomOut,
    onFitView: () => {
      if (overlay.contentBox) {
        overlay.fitToView(overlay.contentBox, overlay.containerSize);
      }
    },
    showDimensions: overlay.showDimensions,
    theme: overlay.theme,
    snapPoint: overlay.snapPoint,
    viewport: overlay.activeViewport,
    fileBoxes: overlay.fileBoxes,
    labels: overlay.labels,
    isSelecting: overlay.boxSelection.isSelecting,
    currentRect: overlay.boxSelection.currentRect,
    selectionMode: overlay.boxSelection.selectionMode,
    selectionCount: overlay.boxSelection.selectionCount,
    explodeAnimationPoints: overlay.explodeAnimationPoints,
    onScaleHandleMouseDown: (handleType, worldPoint) => {
      overlay.interactiveScale.startScaling(handleType as any, worldPoint);
    },
    isScaling: overlay.interactiveScale.isScaling,
    scaleX: overlay.interactiveScale.dragState.scaleX,
    scaleY: overlay.interactiveScale.dragState.scaleY,
    scalePercentage: overlay.interactiveScale.scalePercentage,
    plates: overlay.plates,
    stickToEdge: overlay.stickToEdge,
    activePlateId: overlay.isNestingMode
      ? overlay.partNesting?.dragPreview?.targetPlateId ?? null
      : null,
    stats: overlay.stats,
    entitiesCount: overlay.entitiesCount,
    fineRotationStep: overlay.fineRotationStep,
    onFineRotationStepChange: overlay.onFineRotationStepChange,
    utilization: overlay.isNestingMode ? overlay.partNesting.getUtilization() : undefined,
    layoutViewMode: overlay.layoutViewMode,
    remainingPartSummary: overlay.remainingPartSummary,
  };

  return { canvasLayerProps, overlayProps };
}
