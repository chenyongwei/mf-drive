/**
 * useWebGPUZoom - Zoom logic hook
 *
 * Handles mouse wheel zoom centered on cursor position
 * Supports min/max bounds and provides programmatic zoom controls
 */

import { useCallback, RefObject } from 'react';
import { Viewport } from './useWebGPUViewport';

export interface UseWebGPUZoomProps {
  viewport: Viewport;
  onUpdateViewport: (viewport: Viewport) => void;
  minZoom?: number;
  maxZoom?: number;
  scaleBy?: number;
}

export function useWebGPUZoom(props: UseWebGPUZoomProps) {
  const {
    viewport,
    onUpdateViewport,
    minZoom,
    maxZoom,
    scaleBy = 1.1,
  } = props;

  /**
   * Handle wheel zoom event
   * Zooms centered on the mouse cursor position
   */
  const handleWheel = useCallback((e: WheelEvent) => {
    // Don't call preventDefault - React 18 uses passive event listeners

    const oldScale = viewport.zoom;
    const oldPan = viewport.pan;

    // Calculate new zoom level
    const newScale = e.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // Only clamp if limits are provided
    const clampedScale = minZoom !== undefined && maxZoom !== undefined
      ? Math.max(minZoom, Math.min(maxZoom, newScale))
      : maxZoom !== undefined
        ? Math.min(maxZoom, newScale)
        : minZoom !== undefined
          ? Math.max(minZoom, newScale)
          : newScale;

    // Calculate mouse position relative to canvas
    // Note: e.clientX and e.clientY are screen coordinates
    // We'll need the canvas rect in the component to convert to canvas coordinates
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate point in world coordinates before zoom
    const mousePointTo = {
      x: (x - oldPan.x) / oldScale,
      y: (y - oldPan.y) / oldScale,
    };

    // Calculate new pan to keep mouse point at same world position
    const newPos = {
      x: x - mousePointTo.x * clampedScale,
      y: y - mousePointTo.y * clampedScale,
    };

    onUpdateViewport({ zoom: clampedScale, pan: newPos });
  }, [viewport, onUpdateViewport, minZoom, maxZoom, scaleBy]);

  /**
   * Zoom in by scale factor
   */
  const zoomIn = useCallback(() => {
    const newZoom = maxZoom !== undefined ? Math.min(viewport.zoom * scaleBy, maxZoom) : viewport.zoom * scaleBy;
    onUpdateViewport({ zoom: newZoom, pan: viewport.pan });
  }, [viewport.zoom, viewport.pan, onUpdateViewport, maxZoom, scaleBy]);

  /**
   * Zoom out by scale factor
   */
  const zoomOut = useCallback(() => {
    const newZoom = minZoom !== undefined ? Math.max(viewport.zoom / scaleBy, minZoom) : viewport.zoom / scaleBy;
    onUpdateViewport({ zoom: newZoom, pan: viewport.pan });
  }, [viewport.zoom, viewport.pan, onUpdateViewport, minZoom, scaleBy]);

  /**
   * Zoom to specific level
   */
  const zoomTo = useCallback((zoom: number) => {
    const clampedZoom = minZoom !== undefined && maxZoom !== undefined
      ? Math.max(minZoom, Math.min(maxZoom, zoom))
      : maxZoom !== undefined
        ? Math.min(maxZoom, zoom)
        : minZoom !== undefined
          ? Math.max(minZoom, zoom)
          : zoom;
    onUpdateViewport({ zoom: clampedZoom, pan: viewport.pan });
  }, [viewport.pan, onUpdateViewport, minZoom, maxZoom]);

  return {
    handleWheel,
    zoomIn,
    zoomOut,
    zoomTo,
  };
}
