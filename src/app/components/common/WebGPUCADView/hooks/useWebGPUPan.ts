/**
 * useWebGPUPan - Pan logic hook
 *
 * Handles drag-to-pan interaction
 * Supports mouse and touch events
 * Optional bounds constraints
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { Viewport } from './useWebGPUViewport';

export interface Bounds {
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
}

export interface UseWebGPUPanProps {
  viewport: Viewport;
  onUpdateViewport: (viewport: Viewport) => void;
  bounds?: Bounds;
  disabled?: boolean;
}

export function useWebGPUPan(props: UseWebGPUPanProps) {
  const {
    viewport,
    onUpdateViewport,
    bounds,
    disabled = false,
  } = props;

  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    initialPan: { x: number; y: number };
  } | null>(null);

  /**
   * Handle mouse down - start drag
   */
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    // Don't start pan if Shift key is pressed (used for box selection)
    if (e.shiftKey) return;

    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPan: { ...viewport.pan },
    };
    setIsDragging(true);
  }, [disabled, viewport.pan]);

  /**
   * Handle mouse move - update pan during drag
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStateRef.current) return;

    const deltaX = e.clientX - dragStateRef.current.startX;
    const deltaY = e.clientY - dragStateRef.current.startY;

    let newPanX = dragStateRef.current.initialPan.x + deltaX;
    let newPanY = dragStateRef.current.initialPan.y + deltaY;

    // Apply bounds if specified
    if (bounds) {
      if (bounds.minX !== undefined) newPanX = Math.max(bounds.minX, newPanX);
      if (bounds.maxX !== undefined) newPanX = Math.min(bounds.maxX, newPanX);
      if (bounds.minY !== undefined) newPanY = Math.max(bounds.minY, newPanY);
      if (bounds.maxY !== undefined) newPanY = Math.min(bounds.maxY, newPanY);
    }

    onUpdateViewport({
      zoom: viewport.zoom,
      pan: { x: newPanX, y: newPanY },
    });
  }, [isDragging, viewport.zoom, onUpdateViewport, bounds]);

  /**
   * Handle mouse up - end drag
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStateRef.current = null;
  }, []);

  // Register global mouse event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  /**
   * Handle drag end callback (for WebGPURenderer compatibility)
   */
  const handleDragEnd = useCallback((newPan: { x: number; y: number }) => {
    onUpdateViewport({
      zoom: viewport.zoom,
      pan: newPan,
    });
  }, [viewport.zoom, onUpdateViewport]);

  return {
    isDragging,
    handleMouseDown,
    handleDragEnd,
  };
}
