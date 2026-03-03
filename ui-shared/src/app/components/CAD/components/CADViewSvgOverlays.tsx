import React from "react";
import { Entity } from "../../../lib/webgpu/EntityToVertices";
import { DimensionOverlay } from "./DimensionOverlay";
import { PartDimensionsOverlay } from "./PartDimensionsOverlay";
import { NestingSnapIndicator } from "./NestingSnapIndicator";
import { AlignmentGuides, AlignmentGuide } from "./AlignmentGuides";
import { ParallelEdgeHighlight } from "./ParallelEdgeHighlight";
import { NestingPart } from "../types/NestingTypes";
import { Viewport } from "../types/CADCanvasTypes";

interface CADViewSvgOverlaysProps {
  width: number;
  height: number;
  theme: "dark" | "light";
  viewport: Viewport;
  isNestingMode: boolean;
  showDimensions: boolean;
  guides: AlignmentGuide[];
  draggingPartId: string | null;
  parts: NestingPart[];
  partSpacing: number;
  dragPreviewValid: boolean;
  currentSnap: any | null;
  entities: Entity[];
}

export function CADViewSvgOverlays({
  width,
  height,
  theme,
  viewport,
  isNestingMode,
  showDimensions,
  guides,
  draggingPartId,
  parts,
  partSpacing,
  dragPreviewValid,
  currentSnap,
  entities,
}: CADViewSvgOverlaysProps) {
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <AlignmentGuides
        guides={guides}
        visible={isNestingMode && draggingPartId !== null}
        scale={viewport.zoom}
        canvasWidth={width}
        canvasHeight={height}
        theme={theme}
      />

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
            visible
            scale={viewport.zoom}
          />
        )}

      {isNestingMode && (
        <g
          transform={`translate(${viewport.pan.x}, ${viewport.pan.y}) scale(${viewport.zoom})`}
        >
          <ParallelEdgeHighlight
            draggedPartId={draggingPartId}
            parts={parts}
            spacing={partSpacing}
            isValidPosition={dragPreviewValid}
            theme={theme}
          />
        </g>
      )}

      {showDimensions && (
        <DimensionOverlay
          entities={entities}
          viewport={viewport}
          theme={theme}
        />
      )}
      {isNestingMode && showDimensions && (
        <PartDimensionsOverlay
          parts={parts}
          viewport={viewport}
          theme={theme}
        />
      )}
    </svg>
  );
}
