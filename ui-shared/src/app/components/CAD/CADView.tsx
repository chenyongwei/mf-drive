import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Entity } from "../../lib/webgpu/EntityToVertices";
import { useViewport } from "../../contexts/ViewportContext";
import { useSmartBoxSelection } from "./hooks/useSmartBoxSelection";
import { usePartNesting } from "./hooks/usePartNesting";
import { useMultiSelectParts } from "./hooks/useMultiSelectParts";
import { NestingPart } from "./types/NestingTypes";
import { useSnapping } from "./hooks/useSnapping";
import { useCADDrawing } from "./hooks/useCADDrawing";
import { useFileLabels } from "./hooks/useFileLabels";
import { useMouseHandlers } from "./hooks/useMouseHandlers";
import { useInteractiveScale } from "./hooks/useInteractiveScale";
import type { AlignmentGuide } from "./components/AlignmentGuides";
import {
  CADCanvasProps,
  PART_SOURCE_DRAG_MIME,
  type PartDragSourcePayload,
} from "./types/CADCanvasTypes";
import type { CADToolType } from "./CADToolPanel";
import {
  getEffectiveEntities,
  getEffectiveToolpathOverlaySegments,
  mergePartsWithDragPreview,
} from "./utils/cadViewUtils";
import { useCADViewRenderer } from "./hooks/useCADViewRenderer";
import { useCADViewKeyboard } from "./hooks/useCADViewKeyboard";
import { useCADViewPartHitTest } from "./hooks/useCADViewPartHitTest";
import { useCADViewToolpathArrows } from "./hooks/useCADViewToolpathArrows";
import { useCADViewAlignmentGuides } from "./hooks/useCADViewAlignmentGuides";
import { useCADViewScaleDrag } from "./hooks/useCADViewScaleDrag";
import { useCADViewEntityLookup } from "./hooks/useCADViewEntityLookup";
import { useCADViewVisibility } from "./hooks/useCADViewVisibility";
import { useCADViewTextDraft } from "./hooks/useCADViewTextDraft";
import { useCADViewRenderProps } from "./hooks/useCADViewRenderProps";
import { CADViewRender } from "./components/CADViewRender";

function parsePartDragPayload(dataTransfer: DataTransfer | null): PartDragSourcePayload | null {
  if (!dataTransfer) return null;
  const rawPayload = dataTransfer.getData(PART_SOURCE_DRAG_MIME);
  if (!rawPayload) return null;

  try {
    const parsed = JSON.parse(rawPayload) as Partial<PartDragSourcePayload>;
    const sourcePartId = String(parsed.sourcePartId ?? "").trim();
    const fileId = String(parsed.fileId ?? "").trim();
    const name = String(parsed.name ?? sourcePartId).trim() || sourcePartId;
    if (!sourcePartId || !fileId) return null;
    return { sourcePartId, fileId, name };
  } catch {
    return null;
  }
}

const CADView: React.FC<CADCanvasProps> = ({
  entities = [],
  selectedFileId,
  selectedEntityIds = [],
  onEntityClick,
  onEntityHover,
  onSelectionChange,
  contentBox,
  isNestingMode,
  isEditMode,
  isScaleMode = false,
  selectionBBox,
  onScale,
  editToolsEnabled = true,
  hoveredEntityId,
  partsForFilling = [],
  selectedPartIds: selectedPartIdsProp,
  onPartSelectionChange,
  layoutViewMode = "multi",
  remainingPartSummary = [],
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onDelete,
  onTrim,
  onExtend,
  files = [],
  onExplode,
  hasEditableEntities: hasEditableEntitiesProp,
  onEntityCreate,
  onStatsUpdate,
  backgroundColor = "#000000",
  theme = "dark",
  explodeAnimationPoints,
  onEntityDragStart,
  onEntityDrag,
  onEntityDragEnd,
  onEntityDragCancel,
  draggedEntityInfo,
  plates = [],
  onPartsChange,
  collisionEngine,
  partSpacing = 5,
  showDistanceGuides = true,
  distanceGuideMaxDistance = 40,
  snappingEnabled = true,
  snapTolerance = 15,
  fineRotationStep = 1,
  onFineRotationStepChange,
  stickToEdge = false,
  penetrationMode = false,
  activeTool: activeToolProp,
  onToolSelect,
  showDimensions = false,
  toolpathOverlaySegments = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [activeTool, setActiveTool] = useState<CADToolType>(activeToolProp || "select");
  const [internalParts, setInternalParts] = useState<NestingPart[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  useEffect(() => {
    if (activeToolProp && activeToolProp !== activeTool) {
      setActiveTool(activeToolProp);
    }
  }, [activeToolProp, activeTool]);

  const { viewport, setViewport, zoomIn, zoomOut, fitToView, updateContainerSize } = useViewport();
  const activeViewport = viewport || { zoom: 1, pan: { x: 0, y: 0 } };
  const parts = partsForFilling.length > 0 ? (partsForFilling as unknown as NestingPart[]) : internalParts;
  const setParts = onPartsChange ? onPartsChange : setInternalParts;

  const selectedEntitySet = useMemo(() => new Set(selectedEntityIds), [selectedEntityIds]);

  const hasEditableEntities = useMemo(() => {
    if (typeof hasEditableEntitiesProp === "boolean") return hasEditableEntitiesProp;
    return entities.some((entity) => !entity.isPart && !(Array.isArray(entity.partIds) && entity.partIds.length > 0));
  }, [hasEditableEntitiesProp, entities]);

  const { findEntityAtPosition } = useCADViewEntityLookup({ entities, zoom: activeViewport.zoom });

  const { previewEntity, textDraft, handleDrawingClick, handleDrawingMove, cancelDrawing, finishDrawing, updateTextDraft, commitTextDraft } = useCADDrawing({
    activeTool,
    isDrawing,
    setIsDrawing,
    onEntityCreate: (entity) => onEntityCreate?.(entity),
    selectedFileId,
    isNestingMode,
  });

  const multiSelect = useMultiSelectParts({
    parts,
    selectedPartIds: selectedPartIdsProp,
    onSelectionChange: onPartSelectionChange,
  });
  const selectedPartId = multiSelect.selectedPartIds[0] ?? null;

  const boxSelection = useSmartBoxSelection({
    entities,
    viewport: activeViewport,
    onSelectionChange: onSelectionChange || (() => {}),
    selectedEntityIds,
    onEntityClick,
    findEntityAtPosition,
    onEntityDragStart,
    onEntityDrag,
    onEntityDragEnd,
    onEntityDragCancel,
    containerRef,
  });

  const visiblePartsForSnapping = useCADViewVisibility({ parts, viewport: activeViewport, containerSize });

  const partNesting = usePartNesting({
    parts,
    snappingParts: visiblePartsForSnapping,
    onPartsChange: setParts,
    plates,
    zoom: activeViewport.zoom,
    collisionEngine,
    partSpacing,
    snappingEnabled,
    snapTolerance,
    stickToEdge,
    penetrationMode,
    selectedPartIds: multiSelect.selectedPartIds,
  });

  const effectiveEntities = useMemo(() => getEffectiveEntities(entities, draggedEntityInfo, isNestingMode, partNesting.dragPreview, parts), [entities, draggedEntityInfo, isNestingMode, partNesting.dragPreview, parts]);
  const effectiveParts = useMemo(() => mergePartsWithDragPreview(parts, partNesting.dragPreview), [parts, partNesting.dragPreview]);
  const visibleEffectiveParts = useCADViewVisibility({
    parts: effectiveParts,
    viewport: activeViewport,
    containerSize,
  });

  const effectivePartsForFilling = useMemo(() => {
    if (!partNesting.dragPreview || partsForFilling.length === 0) return partsForFilling;
    return partsForFilling.map((part: any) => part.id === partNesting.dragPreview!.partId ? { ...part, position: partNesting.dragPreview!.position } : part);
  }, [partsForFilling, partNesting.dragPreview]);
  const effectiveToolpathOverlaySegments = useMemo(
    () =>
      getEffectiveToolpathOverlaySegments(
        toolpathOverlaySegments,
        partNesting.dragPreview as any,
        parts,
      ),
    [toolpathOverlaySegments, partNesting.dragPreview, parts],
  );

  const { snapPoint, findNearestSnapPoint } = useSnapping({ entities: effectiveEntities, viewport: activeViewport });
  const findPartAtPosition = useCADViewPartHitTest({ effectiveParts, selectedPartIds: multiSelect.selectedPartIds });
  const nestingTransparentBackground =
    theme === "light" ? "rgba(255, 255, 255, 0)" : "rgba(0, 0, 0, 0)";

  const { rendererRef, stats } = useCADViewRenderer({
    canvasRef,
    containerRef,
    entities: effectiveEntities,
    previewEntity: isNestingMode ? null : previewEntity,
    selectedEntityIds: selectedEntitySet,
    hoveredEntityId: hoveredEntityId || null,
    partsForFilling: effectivePartsForFilling as any,
    selectedPartIds: multiSelect.selectedPartIds,
    selectedPartId,
    dragPreview: partNesting.dragPreview as any,
    parts,
    theme,
    backgroundColor: isNestingMode ? nestingTransparentBackground : backgroundColor,
    viewport: activeViewport,
    onContainerResize: (width, height) => {
      setContainerSize({ width, height });
      updateContainerSize(width, height);
    },
    onStatsUpdate,
  });

  const { fileBoxes, labels } = useFileLabels({ files, entities: effectiveEntities, viewport: activeViewport });
  const interactiveScale = useInteractiveScale({ selectionBBox: selectionBBox || null, onScaleComplete: (sx, sy, origin) => onScale?.(sx, sy, origin) });

  const { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleMouseLeave, screenToWorld } = useMouseHandlers({
    viewport: activeViewport,
    setViewport,
    activeTool,
    canvasRef,
    containerRef,
    isNestingMode,
    snapPoint,
    findNearestSnapPoint,
    handleDrawingClick,
    handleDrawingMove,
    boxSelection,
    findEntityAtPosition,
    hoveredEntityId: hoveredEntityId || null,
    onEntityHover,
    findPartAtPosition,
    onPartClick: (partId, isCtrlPressed) => {
      if (partId) multiSelect.togglePartSelection(partId, isCtrlPressed);
      else multiSelect.clearSelection();
    },
    onPartDragStart: (event, id) => {
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      if (isCtrlPressed && !multiSelect.selectedPartIds.includes(id)) {
        multiSelect.togglePartSelection(id, true);
      }
      partNesting.handleDragStart(event, id);
    },
    onPartDragMove: partNesting.handleDragMove,
    onPartDragEnd: partNesting.handleDragEnd,
    isStickyPlacementActive: partNesting.isStickyPlacementActive,
    onStickyPlacementMove: ({ worldPoint }) => {
      partNesting.updateStickyPointer(worldPoint);
    },
    onStickyPlacementCommit: ({ clientPoint, worldPoint }) => {
      if (!partNesting.stickySourcePartId) return false;
      return partNesting.dropFromList(partNesting.stickySourcePartId, clientPoint, worldPoint);
    },
  });

  const handleCanvasDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!isNestingMode) return;
    if (!parsePartDragPayload(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, [isNestingMode]);

  const handleCanvasDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!isNestingMode) return;

    const payload = parsePartDragPayload(event.dataTransfer);
    if (!payload) return;

    event.preventDefault();
    event.stopPropagation();

    const worldPoint = screenToWorld(event.clientX, event.clientY);
    if (!worldPoint) return;

    partNesting.dropFromList(
      payload.sourcePartId,
      { x: event.clientX, y: event.clientY },
      worldPoint,
    );
  }, [isNestingMode, partNesting, screenToWorld]);

  const handleToolSelect = useCallback((tool: CADToolType) => {
    setActiveTool(tool);
    onToolSelect?.(tool);
    if (isDrawing) cancelDrawing();
  }, [onToolSelect, isDrawing, cancelDrawing]);

  useCADViewKeyboard({
    isNestingMode,
    isEditMode,
    fineRotationStep,
    selectedPartIds: multiSelect.selectedPartIds,
    selectedPartId,
    rotatePart: partNesting.rotatePart,
    clearPartSelection: multiSelect.clearSelection,
    onNestingEscape: partNesting.cancelStickyPlacement,
    cancelDrawing,
    handleToolSelect,
  });

  useCADViewAlignmentGuides({
    isNestingMode,
    draggingPartId: partNesting.draggingPartId,
    effectiveParts,
    visibleEffectiveParts,
    targetPlateId: partNesting.dragPreview?.targetPlateId,
    hasCollision: Boolean(
      partNesting.dragPreview?.hasCollision ||
      partNesting.dragPreview?.hasBoundaryInterference ||
      partNesting.dragPreview?.hasMarginInterference,
    ),
    showDistanceGuides,
    distanceGuideMaxDistance,
    onGuidesChange: setAlignmentGuides,
  });

  useCADViewScaleDrag({
    isScaleMode,
    isScaling: interactiveScale.isScaling,
    containerRef,
    viewport: activeViewport,
    updateScaling: interactiveScale.updateScaling,
    completeScaling: interactiveScale.completeScaling,
  });

  const { textInputScreenPoint } = useCADViewTextDraft({
    activeTool,
    textDraft,
    textEditorRef,
    viewport: activeViewport,
  });

  const { arrowLod, arrowMarkerCut, arrowMarkerAux, segmentArrowPointsById, cutStrokeWidth, auxStrokeWidth } = useCADViewToolpathArrows({ viewport: activeViewport, containerSize, toolpathOverlaySegments: effectiveToolpathOverlaySegments });

  const { canvasLayerProps, overlayProps } = useCADViewRenderProps({
    canvas: {
      containerRef, canvasRef, textEditorRef, containerSize, isNestingMode, backgroundColor, activeViewport, theme, alignmentGuides,
      partNesting, effectiveParts, partSpacing, toolpathOverlaySegments: effectiveToolpathOverlaySegments, arrowMarkerCut, arrowMarkerAux, arrowLod, segmentArrowPointsById,
      cutStrokeWidth, auxStrokeWidth, showDimensions, selectedPartIds: multiSelect.selectedPartIds, previewEntity, effectiveEntities, selectedEntitySet, hoveredEntityId: hoveredEntityId || null,
      activeTool, textInputScreenPoint, textDraftContent: textDraft?.content ?? "", updateTextDraft, commitTextDraft, cancelDrawing, handleToolSelect,
      handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel,
      handleDragOver: handleCanvasDragOver,
      handleDrop: handleCanvasDrop,
      finishDrawing,
    },
    overlay: {
      activeTool, handleToolSelect, isEditMode, isNestingMode, isScaleMode, selectionBBox: selectionBBox || null, selectedEntityIds, hasEditableEntities,
      editToolsEnabled, canUndo, canRedo, onUndo, onRedo, onDelete, onTrim, onExtend, onExplode, zoomIn, zoomOut, contentBox, fitToView,
      containerSize, showDimensions, theme, snapPoint, activeViewport, fileBoxes: fileBoxes as any, labels: labels as any,
      boxSelection: { isSelecting: boxSelection.isSelecting, currentRect: boxSelection.currentRect as any, selectionMode: boxSelection.selectionMode, selectionCount: boxSelection.selectionCount },
      explodeAnimationPoints, interactiveScale, plates, stickToEdge, stats, entitiesCount: entities.length, fineRotationStep, onFineRotationStepChange, partNesting,
      layoutViewMode,
      remainingPartSummary,
    },
  });

  return <CADViewRender canvasLayerProps={canvasLayerProps} overlayProps={overlayProps} />;
};

export default CADView;
