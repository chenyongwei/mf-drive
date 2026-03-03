import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { useAppStore } from '../store';

// Custom hooks
import { useEntityLoader } from '../lib/webcad/hooks/useEntityLoader';
import { useAutoFit } from '../lib/webcad/hooks/useAutoFit';
import { useStageSize } from '../lib/webcad/hooks/useStageSize';

// Renderers
import { EntityRenderer } from '../lib/webcad/renderers/EntityRenderer';
import { PreviewLayer } from '../lib/webcad/renderers/PreviewLayer';
import NestingLayoutRenderer from '../lib/webcad/renderers/NestingLayoutRenderer';

// Controls
import { ZoomControls } from '../lib/webcad/controls/ZoomControls';
import { CoordinateInfo } from '../lib/webcad/controls/CoordinateInfo';
import { LayerLegend } from '../lib/webcad/controls/LayerLegend';
import { DebugInfo } from '../lib/webcad/controls/DebugInfo';
import { LoadingState } from '../lib/webcad/controls/LoadingState';
import { EmptyState } from '../lib/webcad/controls/EmptyState';

const WebCAD: React.FC = () => {
  const { getActiveFile, view, setView, selection, setSelection, previewMode, previewData, selectedLayout, activePartId, setShowNestingView, nestingMaterial } = useAppStore();
  const stageRef = useRef<Konva.Stage>(null);
  const currentFile = getActiveFile();

  // Use custom hooks
  const stageSize = useStageSize();

  // Auto-fit based on mode
  useAutoFit({ currentFile, stageSize, selectedLayout });
  const { entities } = useEntityLoader({ currentFile, view, stageSize });

  // Handle wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = view.zoom;
    const oldPan = view.pan;
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - oldPan.x) / oldScale,
      y: (pointer.y - oldPan.y) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setView({ zoom: newScale, pan: newPos });
  };

  const handleStageClick = () => {
    setSelection({ parts: [], entities: [] });
  };

  // Show nesting view when layout is selected
  useEffect(() => {
    setShowNestingView(!!selectedLayout);
  }, [selectedLayout]);

  const handlePartClick = (partId: string) => {
    setSelection({ parts: [partId], entities: [] });
  };

  // Material dimensions from layout (if available)
  const materialWidth = selectedLayout && nestingMaterial ? nestingMaterial.width : 0;
  const materialHeight = selectedLayout && nestingMaterial ? nestingMaterial.height : 0;

  // Empty state
  if (!currentFile) {
    return <EmptyState />;
  }

  // Loading state
  if (currentFile.status !== 'ready') {
    return <LoadingState currentFile={currentFile} />;
  }

  return (
    <div className="h-full w-full relative bg-black">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        onClick={handleStageClick}
        scaleX={view.zoom}
        scaleY={view.zoom}
        x={view.pan.x}
        y={view.pan.y}
        draggable
      >
        <Layer>
          {/* Black background rectangle */}
          <Rect
            x={-100000}
            y={-100000}
            width={200000}
            height={200000}
            fill="black"
          />
          {/* Render nesting layout or regular entities */}
          {selectedLayout ? (
            <NestingLayoutRenderer
              layout={selectedLayout}
              materialWidth={materialWidth}
              materialHeight={materialHeight}
              selectedPartId={activePartId}
              onPartClick={handlePartClick}
            />
          ) : (
            /* Render entities */
            entities.map((entity) => (
              <EntityRenderer key={entity.id} entity={entity} viewZoom={view.zoom} />
            ))
          )}
          {/* Preview overlay layer (only in non-nesting mode) */}
          {!selectedLayout && previewMode && previewData && (
            <PreviewLayer
              duplicates={previewData.duplicates}
              merges={previewData.merges}
              closures={previewData.closures}
              viewZoom={view.zoom}
            />
          )}
        </Layer>
      </Stage>

      {/* Controls */}
      <ZoomControls currentFile={currentFile} stageSize={stageSize} />
      <CoordinateInfo entitiesCount={entities.length} />
      <LayerLegend />
      <DebugInfo currentFile={currentFile} entities={entities} />
    </div>
  );
};

export default WebCAD;
