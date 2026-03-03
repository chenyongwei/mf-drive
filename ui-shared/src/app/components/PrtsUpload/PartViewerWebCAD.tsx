/**
 * PartViewerWebCAD - WebCAD-based part viewer with fill rendering
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DefaultWebGPUViewer } from '../common/DefaultWebGPUViewer';
import { ViewerErrorState, ViewerLoadingState } from '../common/ViewerStates';
import { useContainerSize } from '../common/useContainerSize';
import { CollisionDetectionEngine, Point, BoundingBox } from '../../lib/webgpu/CollisionDetectionEngine';
import { PART_EXPANSION } from '../../constants/layoutConstants';
import { buildRenderData } from './PartViewerWebCAD.entities';
import { calculateLayout, convertToCollisionPart } from './PartViewerWebCAD.layout';
import { loadParts } from './PartViewerWebCAD.loader';
import type { LoadedPart, PartViewerWebCADProps, Viewport } from './PartViewerWebCAD.types';

const PartViewerWebCAD: React.FC<PartViewerWebCADProps> = ({ parts }) => {
  const [loadedParts, setLoadedParts] = useState<LoadedPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalContentBox, setGlobalContentBox] = useState<BoundingBox | null>(null);
  const { containerRef, containerSize } = useContainerSize<HTMLDivElement>();

  const collisionEngineRef = useRef<CollisionDetectionEngine | null>(null);
  const viewportRef = useRef<Viewport>({ zoom: 1, pan: { x: 0, y: 0 } });
  const [draggingPartId, setDraggingPartId] = useState<string | null>(null);
  const dragStartPositionRef = useRef<{
    partId: string;
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
  } | null>(null);

  useEffect(() => {
    const loadAllParts = async () => {
      setLoading(true);
      setError(null);

      try {
        const partsData = await loadParts(parts);
        const layoutResult = calculateLayout(partsData);
        setLoadedParts(layoutResult.parts);
        setGlobalContentBox(layoutResult.globalBox);

        if (!collisionEngineRef.current && layoutResult.globalBox) {
          const engine = new CollisionDetectionEngine({
            width: layoutResult.globalBox.maxX - layoutResult.globalBox.minX + 1000,
            height: layoutResult.globalBox.maxY - layoutResult.globalBox.minY + 1000,
          });
          layoutResult.parts.forEach((part) => {
            engine.addPart(convertToCollisionPart(part));
          });
          collisionEngineRef.current = engine;
        }
      } catch (err) {
        console.error('Error loading parts:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (parts.length > 0) {
      void loadAllParts();
    }

    return () => {
      collisionEngineRef.current = null;
    };
  }, [parts]);

  const handleDragStart = useCallback(
    (partId: string, screenX: number, screenY: number) => {
      const part = loadedParts.find((candidate) => candidate.partId === partId);
      if (!part) {
        return;
      }

      dragStartPositionRef.current = {
        partId,
        startX: screenX,
        startY: screenY,
        initialOffsetX: part.offsetX,
        initialOffsetY: part.offsetY,
      };
      setDraggingPartId(partId);
    },
    [loadedParts],
  );

  const handleDragMove = useCallback(
    (screenX: number, screenY: number) => {
      if (!draggingPartId || !dragStartPositionRef.current || !collisionEngineRef.current) {
        return;
      }

      const { startX, startY, initialOffsetX, initialOffsetY, partId } = dragStartPositionRef.current;
      const deltaX = (screenX - startX) / viewportRef.current.zoom;
      const deltaY = (screenY - startY) / viewportRef.current.zoom;
      const newOffsetX = initialOffsetX + deltaX;
      const newOffsetY = initialOffsetY + deltaY;
      const newPosition: Point = { x: newOffsetX, y: newOffsetY };

      const collisionResult = collisionEngineRef.current.checkRectangleCollision(partId, newPosition, [partId]);
      if (collisionResult.hasCollision) {
        return;
      }

      setLoadedParts((prevParts) =>
        prevParts.map((part) =>
          part.partId === partId ? { ...part, offsetX: newOffsetX, offsetY: newOffsetY } : part,
        ),
      );
      collisionEngineRef.current.updatePartTransform(partId, newPosition, 0);
    },
    [draggingPartId],
  );

  const handleDragEnd = useCallback(() => {
    dragStartPositionRef.current = null;
    setDraggingPartId(null);
  }, []);

  const handleViewportChange = useCallback((newViewport: Viewport) => {
    viewportRef.current = newViewport;
  }, []);

  const { allEntities, partsForFilling } = useMemo(() => buildRenderData(loadedParts), [loadedParts]);

  if (loading) {
    return <ViewerLoadingState />;
  }

  if (error) {
    return <ViewerErrorState error={error} />;
  }

  if (!globalContentBox || loadedParts.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="h-full w-full" onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)} onMouseUp={handleDragEnd}>
      <DefaultWebGPUViewer
        width={containerSize.width}
        height={containerSize.height}
        entities={allEntities}
        partsForFilling={partsForFilling}
        contentBox={globalContentBox || undefined}
        onViewportChange={handleViewportChange}
      >
        {loadedParts.map((part) => {
          const labelWorldX = part.offsetX + part.geometry.boundingBox.minX - PART_EXPANSION;
          const labelWorldY = part.offsetY + part.geometry.boundingBox.minY - PART_EXPANSION;

          const RULER_SIZE = { width: 15, height: 15 };
          const screenX = labelWorldX * viewportRef.current.zoom + viewportRef.current.pan.x + RULER_SIZE.width;
          const screenY = labelWorldY * viewportRef.current.zoom + viewportRef.current.pan.y + RULER_SIZE.height;

          return (
            <div
              key={`${part.partId}-label`}
              className="absolute text-xs text-white bg-black/70 px-2 py-1 rounded pointer-events-none whitespace-nowrap"
              style={{ left: screenX, top: screenY, transform: 'translate(4px, 4px)' }}
              onMouseDown={(event) => {
                event.stopPropagation();
                handleDragStart(part.partId, event.clientX, event.clientY);
              }}
            >
              {part.originalFilename || part.partId}
            </div>
          );
        })}
      </DefaultWebGPUViewer>
    </div>
  );
};

export default PartViewerWebCAD;
