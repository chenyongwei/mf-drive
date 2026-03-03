import React from "react";
import WebGPURuler from "../../common/WebGPUCADView/WebGPURuler";
import { AlignmentGuides } from "./AlignmentGuides";
import TextOverlay from "./TextOverlay";
import { NestingSnapIndicator } from "./NestingSnapIndicator";
import { ParallelEdgeHighlight } from "./ParallelEdgeHighlight";
import { DimensionOverlay } from "./DimensionOverlay";
import { PartDimensionsOverlay } from "./PartDimensionsOverlay";
import { SelectedPartHatchOverlay } from "./SelectedPartHatchOverlay";
import type { CADViewSceneProps } from "./CADViewOverlay.types";

export function CADViewSvgScene({
  containerSize,
  activeViewport,
  theme,
  isNestingMode,
  alignmentGuides,
  draggingPartId,
  currentSnap,
  effectiveParts,
  partSpacing,
  dragPreviewFlags,
  lastValidDragPosition,
  toolpathOverlaySegments,
  arrowMarkerCut,
  arrowMarkerAux,
  arrowLod,
  segmentArrowPointsById,
  cutStrokeWidth,
  auxStrokeWidth,
  showDimensions,
  entitiesForDimensions,
  textOverlayEntities,
  selectedPartIds,
  selectedEntityIds,
  hoveredEntityId,
}: CADViewSceneProps) {
  return (
    <>
      <WebGPURuler
        width={containerSize.width}
        height={containerSize.height}
        zoom={activeViewport.zoom}
        pan={activeViewport.pan}
        rulerSize={{ width: 20, height: 20 }}
        theme={theme}
      />
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 15,
        }}
        viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
      >
        <AlignmentGuides
          guides={alignmentGuides}
          visible={isNestingMode && draggingPartId !== null}
          scale={1}
          canvasWidth={containerSize.width}
          canvasHeight={containerSize.height}
          zoom={activeViewport.zoom}
          pan={activeViewport.pan}
          theme={theme}
        />

        {!isNestingMode && (
          <TextOverlay
            entities={textOverlayEntities}
            viewport={activeViewport}
            selectedEntityIds={selectedEntityIds}
            hoveredEntityId={hoveredEntityId}
            theme={theme}
          />
        )}

        {currentSnap?.snapped &&
          currentSnap.snapPoint &&
          currentSnap.targetPoint &&
          !["center-to-center", "horizontal-center", "vertical-center"].includes(
            currentSnap.snapType || "",
          ) && (
            <NestingSnapIndicator
              snapPoint={currentSnap.snapPoint}
              targetPoint={currentSnap.targetPoint}
              snapType={currentSnap.snapType || ""}
              visible={true}
              scale={activeViewport.zoom}
            />
          )}

        {isNestingMode && (
          <g
            transform={`translate(${activeViewport.pan.x}, ${activeViewport.pan.y}) scale(${activeViewport.zoom})`}
          >
            <SelectedPartHatchOverlay
              parts={effectiveParts}
              selectedPartIds={selectedPartIds}
              theme={theme}
            />
            <ParallelEdgeHighlight
              draggedPartId={draggingPartId}
              parts={effectiveParts}
              spacing={partSpacing}
              isValidPosition={dragPreviewFlags.isValid}
              hasCollision={dragPreviewFlags.hasCollision}
              hasSpacingInterference={dragPreviewFlags.hasSpacingInterference}
              fallbackPosition={lastValidDragPosition}
              theme={theme}
            />
          </g>
        )}

        {isNestingMode && toolpathOverlaySegments.length > 0 && (
          <g
            transform={`translate(${activeViewport.pan.x}, ${activeViewport.pan.y}) scale(${activeViewport.zoom})`}
            opacity={0.9}
          >
            <defs>
              <marker id="tp-arrow-cut" viewBox={arrowMarkerCut.viewBox} markerWidth={arrowMarkerCut.markerWidth} markerHeight={arrowMarkerCut.markerHeight} refX={arrowMarkerCut.refX} refY={arrowMarkerCut.refY} orient="auto" markerUnits="strokeWidth"><path d={arrowMarkerCut.path} fill="#22c55e" /></marker>
              <marker id="tp-arrow-cut-preserve" viewBox={arrowMarkerCut.viewBox} markerWidth={arrowMarkerCut.markerWidth} markerHeight={arrowMarkerCut.markerHeight} refX={arrowMarkerCut.refX} refY={arrowMarkerCut.refY} orient="auto" markerUnits="strokeWidth"><path d={arrowMarkerCut.path} fill="#22c55e" /></marker>
              <marker id="tp-arrow-rapid" viewBox={arrowMarkerAux.viewBox} markerWidth={arrowMarkerAux.markerWidth} markerHeight={arrowMarkerAux.markerHeight} refX={arrowMarkerAux.refX} refY={arrowMarkerAux.refY} orient="auto" markerUnits="strokeWidth"><path d={arrowMarkerAux.path} fill="#facc15" /></marker>
              <marker id="tp-arrow-lead" viewBox={arrowMarkerAux.viewBox} markerWidth={arrowMarkerAux.markerWidth} markerHeight={arrowMarkerAux.markerHeight} refX={arrowMarkerAux.refX} refY={arrowMarkerAux.refY} orient="auto" markerUnits="strokeWidth"><path d={arrowMarkerAux.path} fill="#facc15" /></marker>
            </defs>
            {toolpathOverlaySegments.map((segment) => {
              const stroke = segment.kind === "CUT" ? "#22c55e" : "#facc15";
              const dash = segment.kind === "RAPID" ? "4 3" : segment.kind === "LEAD_IN" || segment.kind === "LEAD_OUT" ? "2 2" : undefined;
              const markerId =
                segment.kind === "CUT"
                  ? segment.preserve
                    ? "tp-arrow-cut-preserve"
                    : "tp-arrow-cut"
                  : segment.kind === "RAPID"
                    ? "tp-arrow-rapid"
                    : "tp-arrow-lead";

              const allowArrowsForSegment = segment.kind === "CUT" || arrowLod.showAuxArrows;
              const arrowPoints = allowArrowsForSegment ? segmentArrowPointsById.get(segment.segmentId) ?? [] : [];
              const markerPolylinePoints =
                arrowPoints.length > 0
                  ? [
                      `${segment.from.x},${segment.from.y}`,
                      ...arrowPoints.map((point) => `${point.x},${point.y}`),
                      `${segment.to.x},${segment.to.y}`,
                    ].join(" ")
                  : "";

              return (
                <React.Fragment key={segment.segmentId}>
                  <line x1={segment.from.x} y1={segment.from.y} x2={segment.to.x} y2={segment.to.y} stroke={stroke} strokeWidth={segment.kind === "CUT" ? cutStrokeWidth : auxStrokeWidth} strokeDasharray={dash} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  {markerPolylinePoints && (
                    <polyline points={markerPolylinePoints} fill="none" stroke="transparent" strokeWidth={segment.kind === "CUT" ? cutStrokeWidth : auxStrokeWidth} markerMid={`url(#${markerId})`} vectorEffect="non-scaling-stroke" />
                  )}
                </React.Fragment>
              );
            })}
          </g>
        )}

        {showDimensions && (
          <DimensionOverlay
            entities={entitiesForDimensions}
            viewport={activeViewport}
            theme={theme}
          />
        )}

        {isNestingMode && showDimensions && (
          <PartDimensionsOverlay
            parts={effectiveParts}
            viewport={activeViewport}
            theme={theme}
          />
        )}
      </svg>
    </>
  );
}
