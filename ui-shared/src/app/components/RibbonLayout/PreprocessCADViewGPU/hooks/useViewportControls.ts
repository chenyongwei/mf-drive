import { useCallback, useState } from 'react';

/**
 * Custom hook for viewport controls (zoom, pan)
 */
export const useViewportControls = (initialPan = { x: 100, y: 100 }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(initialPan);

  const handleWheel = useCallback(
    (e: WheelEvent, canvasRef: React.RefObject<HTMLCanvasElement>) => {
      const scaleBy = 1.1;
      const oldScale = zoom;
      const oldPan = pan;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const mousePointTo = {
        x: (x - oldPan.x) / oldScale,
        y: (y - oldPan.y) / oldScale,
      };

      const newScale = e.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const newPos = {
        x: x - mousePointTo.x * newScale,
        y: y - mousePointTo.y * newScale,
      };

      setZoom(newScale);
      setPan(newPos);
    },
    [zoom, pan]
  );

  const handleDragEnd = useCallback(
    (newPan: { x: number; y: number }, rulerSize: { width: number; height: number }) => {
      // Adjust for ruler offset
      setPan({
        x: newPan.x + rulerSize.width,
        y: newPan.y + rulerSize.height,
      });
    },
    []
  );

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    handleWheel,
    handleDragEnd,
  };
};
