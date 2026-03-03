import React from "react";
import type { RefObject } from "react";
import { CADViewSvgScene } from "./CADViewSvgScene";
import { CADViewTextDraftEditor } from "./CADViewTextDraftEditor";
import { NestingPlacementStatusOverlay } from "./NestingPlacementStatusOverlay";
import type { CADViewSceneProps } from "./CADViewOverlay.types";

interface CADViewCanvasLayerProps extends CADViewSceneProps {
  containerRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  rendererBackgroundColor: string;
  backgroundColor: string;
  activeTool: string;
  textInputScreenPoint: { x: number; y: number } | null;
  textDraftContent: string;
  textEditorRef: RefObject<HTMLTextAreaElement | null>;
  updateTextDraft: (value: string) => void;
  commitTextDraft: (value?: string) => boolean;
  cancelDrawing: () => void;
  handleToolSelect: (tool: any) => void;
  handleContextMenu: (event: React.MouseEvent) => void;
  handleMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseLeave: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function CADViewCanvasLayer(props: CADViewCanvasLayerProps) {
  const {
    containerRef,
    canvasRef,
    rendererBackgroundColor,
    backgroundColor,
    activeTool,
    textInputScreenPoint,
    textDraftContent,
    textEditorRef,
    updateTextDraft,
    commitTextDraft,
    cancelDrawing,
    handleToolSelect,
    handleContextMenu,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleDoubleClick,
    handleWheel,
    handleDragOver,
    handleDrop,
    ...sceneProps
  } = props;
  const { containerSize, dragPreviewFlags, draggingPartId, isNestingMode, theme } = sceneProps;

  return (
    <div
      ref={containerRef}
      data-testid="cad-canvas-container"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        touchAction: "none",
        overflow: "hidden",
        backgroundColor,
      }}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {containerSize.width > 0 && containerSize.height > 0 && (
        <>
          <canvas
            ref={canvasRef}
            data-testid="main-canvas"
            width={containerSize.width}
            height={containerSize.height}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 2,
              backgroundColor: rendererBackgroundColor,
            }}
          />

          <CADViewSvgScene {...sceneProps} />
        </>
      )}

      <NestingPlacementStatusOverlay
        visible={isNestingMode && draggingPartId !== null}
        theme={theme}
        boundaryState={dragPreviewFlags.boundaryState}
        hasCollision={
          dragPreviewFlags.hasCollision || dragPreviewFlags.hasBoundaryInterference
        }
        hasSpacingInterference={dragPreviewFlags.hasSpacingInterference}
        isCopyPreview={dragPreviewFlags.isCopyPreview}
        copyRemainingCount={dragPreviewFlags.copyRemainingCount}
      />

      {activeTool === "draw-text" && textInputScreenPoint && (
        <CADViewTextDraftEditor
          theme={theme}
          screenPoint={textInputScreenPoint}
          value={textDraftContent}
          textEditorRef={textEditorRef}
          onChange={updateTextDraft}
          onCommit={(value) => {
            if (commitTextDraft(value)) {
              updateTextDraft("");
            }
          }}
          onCancel={cancelDrawing}
          onSelectTool={handleToolSelect}
        />
      )}
    </div>
  );
}
