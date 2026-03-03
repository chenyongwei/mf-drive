import React from 'react';
import { RULER_SIZE } from './WebGPUCADView.helpers';
import type { Viewport } from './WebGPUCADView.types';

type Pan = Viewport['pan'];

interface UseWebGPUCADViewInteractionsParams {
  containerRef: React.RefObject<HTMLDivElement>;
  viewport: Viewport;
  showRuler: boolean;
  disablePan: boolean;
  setViewport: (viewport: Viewport) => void;
}

export const useWebGPUCADViewInteractions = ({
  containerRef,
  viewport,
  showRuler,
  disablePan,
  setViewport,
}: UseWebGPUCADViewInteractionsParams) => {
  const handleDragEnd = React.useCallback((newPan: Pan) => {
    setViewport({
      zoom: viewport.zoom,
      pan: showRuler
        ? {
          x: newPan.x + RULER_SIZE.width,
          y: newPan.y + RULER_SIZE.height,
        }
        : newPan,
    });
  }, [viewport.zoom, showRuler, setViewport]);

  const handleWheel = React.useCallback((e: WheelEvent) => {
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = viewport.zoom * zoomFactor;

    setViewport({
      zoom: newZoom,
      pan: viewport.pan,
    });
  }, [viewport, setViewport]);

  const handleMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disablePan) return;

    const container = containerRef.current;
    if (!container) return;
    if (e.shiftKey) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startPan = { ...viewport.pan };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newPan = {
        x: startPan.x + deltaX,
        y: startPan.y + deltaY,
      };

      const adjustedPan = showRuler
        ? {
          x: newPan.x - RULER_SIZE.width,
          y: newPan.y - RULER_SIZE.height,
        }
        : newPan;

      handleDragEnd(adjustedPan);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [containerRef, viewport.pan, showRuler, handleDragEnd, disablePan]);

  return {
    handleDragEnd,
    handleWheel,
    handleMouseDown,
  };
};
