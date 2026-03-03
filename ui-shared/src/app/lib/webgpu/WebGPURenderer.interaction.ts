import { useCallback, useRef } from "react";
import type React from "react";
import type { Entity } from "./EntityToVertices";
import { findEntityAtPosition } from "./WebGPURenderer.hitTest";
import { findMarkerAtPosition } from "./WebGPURenderer.markers";
import type { InspectionMarker, Viewport } from "./WebGPURenderer.types";

interface UseWebGPURendererInteractionParams {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  viewport: Viewport;
  entities: Entity[];
  inspectionMarkers: InspectionMarker[];
  onMarkerClick?: (markerId: string) => void;
  onMarkerHover?: (markerId: string | null) => void;
  onEntityClick?: (entityId: string) => void;
  onEntityHover?: (entityId: string | null) => void;
  onWheel?: (e: WheelEvent) => void;
  onDragEnd?: (pan: { x: number; y: number }) => void;
  disablePan: boolean;
}

export function useWebGPURendererInteraction({
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
}: UseWebGPURendererInteractionParams) {
  const touchStateRef = useRef<{
    initialDistance: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    lastTouchCenter: { x: number; y: number };
  } | null>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialPan: { x: number; y: number };
  } | null>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const worldX = (e.clientX - rect.left - viewport.pan.x) / viewport.zoom;
    const worldY = (e.clientY - rect.top - viewport.pan.y) / viewport.zoom;

    if (onMarkerClick && inspectionMarkers.length > 0) {
      const markerId = findMarkerAtPosition(worldX, worldY, inspectionMarkers, viewport);
      if (markerId) {
        onMarkerClick(markerId);
        return;
      }
    }

    if (!onEntityClick) return;
    const threshold = 5 / viewport.zoom;
    const clickedEntityId = findEntityAtPosition(worldX, worldY, entities, threshold);
    if (clickedEntityId) {
      onEntityClick(clickedEntityId);
    }
  }, [canvasRef, viewport, entities, inspectionMarkers, onMarkerClick, onEntityClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const worldX = (e.clientX - rect.left - viewport.pan.x) / viewport.zoom;
    const worldY = (e.clientY - rect.top - viewport.pan.y) / viewport.zoom;

    if (onMarkerHover && inspectionMarkers.length > 0) {
      const markerId = findMarkerAtPosition(worldX, worldY, inspectionMarkers, viewport);
      onMarkerHover(markerId);
      if (markerId) return;
    }

    if (!onEntityHover) return;
    const threshold = 5 / viewport.zoom;
    const hoveredEntityId = findEntityAtPosition(worldX, worldY, entities, threshold);
    onEntityHover(hoveredEntityId);
  }, [canvasRef, viewport, entities, inspectionMarkers, onMarkerHover, onEntityHover]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!onWheel) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    onWheel({ ...e, clientX: e.clientX - rect.left, clientY: e.clientY - rect.top } as any);
  }, [canvasRef, onWheel]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 2) return;

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
    const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

    touchStateRef.current = {
      initialDistance: distance,
      initialZoom: viewport.zoom,
      initialPan: { ...viewport.pan },
      lastTouchCenter: { x: centerX, y: centerY },
    };
  }, [canvasRef, viewport.zoom, viewport.pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 2 || !touchStateRef.current || disablePan) return;

    e.preventDefault();
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
    const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

    const { initialDistance, initialZoom, initialPan, lastTouchCenter } = touchStateRef.current;
    const newZoom = initialZoom * (distance / initialDistance);
    const deltaX = centerX - lastTouchCenter.x;
    const deltaY = centerY - lastTouchCenter.y;

    if (onDragEnd) {
      onDragEnd({ x: initialPan.x + deltaX, y: initialPan.y + deltaY });
    }

    if (onWheel) {
      onWheel({
        clientX: centerX,
        clientY: centerY,
        deltaY: (initialZoom - newZoom) * 100,
        deltaMode: 0,
        preventDefault: () => {},
        stopPropagation: () => {},
      } as any);
    }

    touchStateRef.current.lastTouchCenter = { x: centerX, y: centerY };
  }, [canvasRef, onWheel, onDragEnd, disablePan]);

  const handleTouchEnd = useCallback(() => {
    touchStateRef.current = null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onDragEnd || disablePan || e.shiftKey) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      initialPan: { ...viewport.pan },
    };

    const onWindowMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStateRef.current?.isDragging) return;

      const currentRect = canvasRef.current?.getBoundingClientRect();
      if (!currentRect) return;

      const currentX = moveEvent.clientX - currentRect.left;
      const currentY = moveEvent.clientY - currentRect.top;
      const deltaX = currentX - dragStateRef.current.startX;
      const deltaY = currentY - dragStateRef.current.startY;

      onDragEnd({
        x: dragStateRef.current.initialPan.x + deltaX,
        y: dragStateRef.current.initialPan.y + deltaY,
      });
    };

    const onWindowMouseUp = () => {
      dragStateRef.current = null;
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };

    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
  }, [canvasRef, viewport.pan, onDragEnd, disablePan]);

  return {
    handleCanvasClick,
    handleMouseMove,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
  };
}
