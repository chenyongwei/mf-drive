import React from "react";
import CADToolPanel, { CADToolType } from "../CADToolPanel";
import DraggablePanel from "./DraggablePanel";
import CollaborationOverlay from "./CollaborationOverlay";
import StatsOverlay from "./StatsOverlay";
import SnapIndicator from "./SnapIndicator";
import FileBoundingBoxOverlay from "./FileBoundingBoxOverlay";
import { SelectionRectOverlay } from "./SelectionRectOverlay";
import ExplodeAnimation from "./ExplodeAnimation";
import PlatesOverlay from "./PlatesOverlay";
import ScaleHandles from "./ScaleHandles";
import { ShortcutBar } from "./NestingHelpOverlay";
import type { BoundingBox } from "../types/BoundingBox";
import type { NestingLayoutViewMode, Plate } from "../types/NestingTypes";
import type { RemainingPartSummaryItem, Viewport } from "../types/CADCanvasTypes";
import type { SnapPoint } from "../hooks/useSnapping";

interface CADViewOverlayUIProps {
  activeTool: CADToolType;
  onToolSelect: (tool: CADToolType) => void;
  isEditMode: boolean;
  isNestingMode: boolean;
  isScaleMode: boolean;
  selectionBBox: BoundingBox | null;
  selectedEntityIds: string[];
  hasEditableEntities: boolean;
  editToolsEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onTrim?: () => void;
  onExtend?: () => void;
  onExplode?: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  onFitView: () => void;
  showDimensions: boolean;
  theme: "dark" | "light";
  snapPoint: SnapPoint | null;
  viewport: Viewport;
  fileBoxes: Array<{ fileId: string; minX: number; minY: number; maxX: number; maxY: number }>;
  labels: Array<{ fileId: string; text: string; x: number; y: number }>;
  isSelecting: boolean;
  currentRect: { x: number; y: number; width: number; height: number } | null;
  selectionMode: "window" | "crossing";
  selectionCount: number;
  explodeAnimationPoints?: Array<{ x: number; y: number }> | null;
  onScaleHandleMouseDown: (handleType: string, worldPoint: { x: number; y: number }) => void;
  isScaling: boolean;
  scaleX: number;
  scaleY: number;
  scalePercentage: number;
  plates: Plate[];
  stickToEdge: boolean;
  activePlateId?: string | null;
  stats: { rendererType: string; fps: number } | null;
  entitiesCount: number;
  fineRotationStep: number;
  onFineRotationStepChange?: (value: number) => void;
  utilization?: number;
  layoutViewMode?: NestingLayoutViewMode;
  remainingPartSummary?: RemainingPartSummaryItem[];
}

export function CADViewOverlayUI({
  activeTool,
  onToolSelect,
  isEditMode,
  isNestingMode,
  isScaleMode,
  selectionBBox,
  selectedEntityIds,
  hasEditableEntities,
  editToolsEnabled,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDelete,
  onTrim,
  onExtend,
  onExplode,
  zoomIn,
  zoomOut,
  onFitView,
  showDimensions,
  theme,
  snapPoint,
  viewport,
  fileBoxes,
  labels,
  isSelecting,
  currentRect,
  selectionMode,
  selectionCount,
  explodeAnimationPoints,
  onScaleHandleMouseDown,
  isScaling,
  scaleX,
  scaleY,
  scalePercentage,
  plates,
  stickToEdge,
  activePlateId = null,
  stats,
  entitiesCount,
  fineRotationStep,
  onFineRotationStepChange,
  utilization,
}: CADViewOverlayUIProps) {
  return (
    <>
      <SnapIndicator snapPoint={snapPoint} viewport={viewport} isActive={activeTool.startsWith("draw-")} />

      <FileBoundingBoxOverlay fileBoxes={fileBoxes} labels={labels} viewport={viewport} theme={theme} />

      {isSelecting && (
        <SelectionRectOverlay
          currentRect={currentRect}
          selectionMode={selectionMode}
          selectedCount={selectionCount}
        />
      )}

      {explodeAnimationPoints && explodeAnimationPoints.length > 0 && (
        <ExplodeAnimation
          screenPoints={explodeAnimationPoints.map((point) => ({
            x: point.x * viewport.zoom + viewport.pan.x,
            y: point.y * viewport.zoom + viewport.pan.y,
          }))}
        />
      )}

      {(isEditMode || isNestingMode) && (
        <DraggablePanel
          initialPosition={isNestingMode ? "center" : { x: 20, y: 100 }}
          theme={theme}
          rulerSize={{ width: 20, height: 20 }}
        >
          <CADToolPanel
            activeTool={activeTool}
            onToolSelect={onToolSelect}
            showDrawTools={!isNestingMode}
            theme={theme}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onFitView={onFitView}
            onUndo={onUndo}
            onRedo={onRedo}
            onDelete={onDelete}
            onTrim={onTrim}
            onExtend={onExtend}
            onExplode={onExplode}
            canUndo={canUndo}
            canRedo={canRedo}
            hasSelection={selectedEntityIds.length > 0}
            hasSingleSelection={selectedEntityIds.length === 1}
            hasEditableEntities={hasEditableEntities}
            editToolsEnabled={editToolsEnabled}
            style={{ position: "static", transform: "none", boxShadow: "none", border: "none" }}
          />
        </DraggablePanel>
      )}

      {isNestingMode && (
        <PlatesOverlay
          plates={plates}
          viewport={viewport}
          theme={theme}
          stickToEdge={stickToEdge}
          activePlateId={activePlateId}
        />
      )}

      {isScaleMode && selectionBBox && selectedEntityIds.length > 0 && (
        <ScaleHandles
          selectionBBox={selectionBBox}
          viewport={viewport}
          isScaling={isScaling}
          scaleX={scaleX}
          scaleY={scaleY}
          scalePercentage={scalePercentage}
          onHandleMouseDown={onScaleHandleMouseDown}
          theme={theme}
        />
      )}

      <CollaborationOverlay theme={theme} />

      {stats && (
        <StatsOverlay
          rendererType={stats.rendererType}
          fps={stats.fps}
          entitiesCount={entitiesCount}
          selectedCount={selectedEntityIds.length}
          theme={theme}
          utilization={utilization}
        />
      )}

      {isNestingMode && (
        <ShortcutBar
          visible={true}
          theme={theme}
          rotationStep={fineRotationStep}
          onRotationStepChange={onFineRotationStepChange}
        />
      )}
    </>
  );
}
