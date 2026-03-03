/**
 * WebGPUCADView - Unified WebGPU-based CAD view component.
 */

import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import WebGPURenderer from '../../../lib/webgpu/WebGPURenderer';
import { TextLabel } from '../../../lib/webgpu/TextRenderingManager';
import { useViewport } from '../../../contexts/ViewportContext';
import { useSafeCommonFeature } from '../../../contexts/FeatureFlagContext';
import { CommonFeature } from '@dxf-fix/shared';
import WebGPURuler from './WebGPURuler';
import WebGPUZoomControls from './WebGPUZoomControls';
import WebGPUFPSDisplay from './WebGPUFPSDisplay';
import UndoRedoOverlay from './UndoRedoOverlay';
import {
  calculateEntitiesBoundingBox,
  EMPTY_ARRAY,
  RULER_SIZE,
} from './WebGPUCADView.helpers';
import { useWebGPUCADViewInteractions } from './useWebGPUCADViewInteractions';
import type {
  InspectionMarker,
  PartFillData,
  Viewport,
  WebGPUCADViewProps,
  WebGPUCADViewRef,
} from './WebGPUCADView.types';

export type {
  BoundingBox,
  InspectionMarker,
  PartFillData,
  Viewport,
  WebGPUCADViewProps,
  WebGPUCADViewRef,
} from './WebGPUCADView.types';

const WebGPUCADView = forwardRef<WebGPUCADViewRef, WebGPUCADViewProps>(({
  width,
  height,
  entities,
  partsForFilling = [],
  enableFillRendering = false,
  explodingEntityIds = [],
  files,
  collabInfo,
  inspectionMarkers = [],
  textLabels = [],
  selectedEntityIds,
  hoveredEntityId,
  onEntityClick,
  onEntityHover,
  onMarkerClick,
  onMarkerHover,
  autoFitOnMount = false,
  contentBox,
  showRuler = true,
  showZoomControls = true,
  showFPS = true,
  backgroundColor = 'black',
  zoomControlsPosition = 'bottom-right',
  fpsPosition = 'top-right',
  showFitToView = true,
  children,
  fps,
  fillVertexCount = 0,
  disablePan = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  showUndoRedo = true,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width, height });
  const [localFPS, setLocalFPS] = useState<number | undefined>(fps);
  const currentFPS = localFPS ?? fps;

  const { viewport, fitToView, zoomIn, zoomOut, setViewport } = useViewport();
  const operationHistoryEnabled = useSafeCommonFeature(CommonFeature.OPERATION_HISTORY, true);
  const effectiveShowUndoRedo = showUndoRedo && operationHistoryEnabled;

  const stablePartsForFilling = partsForFilling ?? (EMPTY_ARRAY as PartFillData[]);
  const stableInspectionMarkers = inspectionMarkers ?? (EMPTY_ARRAY as InspectionMarker[]);
  const stableTextLabels = textLabels ?? (EMPTY_ARRAY as TextLabel[]);

  const effectiveContentBox = useMemo(() => {
    if (contentBox) return contentBox;
    return calculateEntitiesBoundingBox(
      entities,
      stableInspectionMarkers,
      stableTextLabels,
      stablePartsForFilling,
    );
  }, [contentBox, entities, stableInspectionMarkers, stableTextLabels, stablePartsForFilling]);

  useImperativeHandle(ref, () => ({
    fitToView: () => {
      if (effectiveContentBox) {
        fitToView(effectiveContentBox, containerSize);
      }
    },
    zoomIn,
    zoomOut,
    getViewport: () => viewport,
    setViewport,
  }));

  useEffect(() => {
    if (autoFitOnMount && effectiveContentBox) {
      fitToView(effectiveContentBox, containerSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      setContainerSize(prev => {
        if (prev.width === newWidth && prev.height === newHeight) {
          return prev;
        }
        return { width: newWidth, height: newHeight };
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    return () => resizeObserver.disconnect();
  }, []);

  const effectiveWidth = containerSize.width - (showRuler ? RULER_SIZE.width : 0);
  const effectiveHeight = containerSize.height - (showRuler ? RULER_SIZE.height : 0);

  const effectiveViewport = useMemo((): Viewport => {
    if (!showRuler) return viewport;
    return {
      zoom: viewport.zoom,
      pan: {
        x: viewport.pan.x - RULER_SIZE.width,
        y: viewport.pan.y - RULER_SIZE.height,
      },
    };
  }, [showRuler, viewport]);

  const {
    handleDragEnd,
    handleWheel,
    handleMouseDown,
  } = useWebGPUCADViewInteractions({
    containerRef,
    viewport,
    showRuler,
    disablePan,
    setViewport,
  });

  const handleFPSUpdate = React.useCallback((fpsValue: number) => {
    setLocalFPS(fpsValue);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo && onUndo) {
          onUndo();
        }
      } else if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        if (canRedo && onRedo) {
          onRedo();
        }
      }
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ width, height, outline: 'none' }}
      onMouseDown={handleMouseDown}
      tabIndex={0}
    >
      {showRuler && (
        <WebGPURuler
          width={containerSize.width}
          height={containerSize.height}
          zoom={viewport.zoom}
          pan={viewport.pan}
          rulerSize={RULER_SIZE}
        />
      )}

      {effectiveWidth > 0 && effectiveHeight > 0 && (
        <WebGPURenderer
          width={effectiveWidth}
          height={effectiveHeight}
          viewport={effectiveViewport}
          entities={entities}
          partsForFilling={stablePartsForFilling}
          enableFillRendering={enableFillRendering}
          explodingEntityIds={explodingEntityIds}
          files={files}
          collabInfo={collabInfo}
          selectedEntityIds={selectedEntityIds}
          hoveredEntityId={hoveredEntityId}
          inspectionMarkers={stableInspectionMarkers}
          onMarkerClick={onMarkerClick}
          onMarkerHover={onMarkerHover}
          onEntityClick={onEntityClick}
          onEntityHover={onEntityHover}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          backgroundColor={backgroundColor}
          onFPSUpdate={handleFPSUpdate}
          textLabels={stableTextLabels}
          disablePan={disablePan}
        />
      )}

      {showZoomControls && (
        <WebGPUZoomControls
          zoom={viewport.zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitToView={showFitToView ? () => {
            if (effectiveContentBox) {
              fitToView(effectiveContentBox, containerSize);
            }
          } : undefined}
          showFitToView={showFitToView}
          position={zoomControlsPosition}
        />
      )}

      {showFPS && (
        <WebGPUFPSDisplay
          fps={currentFPS}
          entityCount={entities.length}
          fillVertexCount={fillVertexCount}
          position={fpsPosition}
          showDetails={true}
        />
      )}

      {effectiveShowUndoRedo && (
        <UndoRedoOverlay
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          position="top-left"
        />
      )}

      {children}
    </div>
  );
});

WebGPUCADView.displayName = 'WebGPUCADView';

export default WebGPUCADView;
