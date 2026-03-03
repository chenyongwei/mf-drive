import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useImperativeHandle,
} from "react";
import { convertEntitiesToVertices } from "./EntityToVertices";
import { useWebGPUEngine } from "./WebGPURenderer.engine";
import { useWebGPURendering } from "./WebGPURenderer.rendering";
import { useWebGPURendererInteraction } from "./WebGPURenderer.interaction";
import {
  DrawingBorderOverlays,
  ExplosionOverlay,
} from "./WebGPURenderer.overlays";
import type {
  WebGPURendererProps,
  WebGPURendererRef,
} from "./WebGPURenderer.types";
import type { Entity } from "./EntityToVertices";

export type { Entity };

const WebGPURenderer = React.forwardRef<WebGPURendererRef, WebGPURendererProps>(
  (
    {
      width,
      height,
      viewport,
      entities,
      selectedEntityIds,
      hoveredEntityId,
      onEntityClick,
      onEntityHover,
      onWheel,
      onDragEnd,
      disablePan = false,
      backgroundColor = "black",
      partsForFilling,
      enableFillRendering = false,
      inspectionMarkers = [],
      textLabels = [],
      onMarkerClick,
      onMarkerHover,
      explodingEntityIds = [],
      onFPSUpdate,
      files = [],
      collabInfo,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { engineRef, textRenderingManagerRef, isSupported, error, isInitialized } =
      useWebGPUEngine(canvasRef);

    const entitiesWithState = useMemo(() => {
      if (!entities || entities.length === 0) {
        return entities;
      }

      return entities.map((entity) => {
        const isSelected = selectedEntityIds?.has(entity.id) || false;
        const isHovered = hoveredEntityId === entity.id;

        if (
          entity.isSelected === isSelected &&
          entity.isHovered === isHovered
        ) {
          return entity;
        }

        return {
          ...entity,
          isSelected,
          isHovered,
        };
      });
    }, [entities, selectedEntityIds, hoveredEntityId]);

    useWebGPURendering({
      engineRef,
      textRenderingManagerRef,
      entitiesWithState,
      inspectionMarkers,
      partsForFilling,
      enableFillRendering,
      textLabels,
      viewport,
      width,
      height,
      isInitialized,
      isSupported,
      onFPSUpdate,
    });

    const {
      handleCanvasClick,
      handleMouseMove,
      handleWheel,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseDown,
    } = useWebGPURendererInteraction({
      canvasRef,
      viewport,
      entities,
      inspectionMarkers,
      onMarkerClick,
      onMarkerHover,
      onEntityClick,
      onEntityHover,
      onWheel,
      onDragEnd,
      disablePan,
    });

    useImperativeHandle(ref, () => ({
      canvasRef,
    }));

    const [explosionVertices, setExplosionVertices] = useState(
      [] as ReturnType<typeof convertEntitiesToVertices>,
    );

    useEffect(() => {
      if (explodingEntityIds.length === 0) {
        setExplosionVertices([]);
        return;
      }

      const targetEntities = entities.filter((entity) =>
        explodingEntityIds.includes(entity.id),
      );
      setExplosionVertices(convertEntitiesToVertices(targetEntities));
    }, [explodingEntityIds, entities]);

    if (!isSupported) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <p className="text-xl mb-2">WebGPU Not Supported</p>
            <p className="text-sm text-gray-400">{error}</p>
            <p className="text-xs text-gray-500 mt-2">
              Please use a browser with WebGPU support (Chrome 113+)
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          backgroundColor,
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ display: "block" }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        <ExplosionOverlay
          explosionVertices={explosionVertices}
          viewport={viewport}
        />

        <DrawingBorderOverlays
          files={files}
          entities={entities}
          viewport={viewport}
          collabInfo={collabInfo}
        />
      </div>
    );
  },
);

WebGPURenderer.displayName = "WebGPURenderer";

export default WebGPURenderer;
