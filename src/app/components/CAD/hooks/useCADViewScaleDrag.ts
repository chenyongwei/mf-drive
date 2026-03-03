import { useEffect } from "react";
import type { RefObject } from "react";
import type { Viewport } from "../types/CADCanvasTypes";

interface UseCADViewScaleDragOptions {
  isScaleMode: boolean;
  isScaling: boolean;
  containerRef: RefObject<HTMLDivElement>;
  viewport: Viewport;
  updateScaling: (point: { x: number; y: number }) => void;
  completeScaling: () => void;
}

export function useCADViewScaleDrag({
  isScaleMode,
  isScaling,
  containerRef,
  viewport,
  updateScaling,
  completeScaling,
}: UseCADViewScaleDragOptions) {
  useEffect(() => {
    if (!isScaleMode || !isScaling) {
      return;
    }

    const handleGlobalMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const worldPoint = {
        x: (event.clientX - rect.left - viewport.pan.x) / viewport.zoom,
        y: (event.clientY - rect.top - viewport.pan.y) / viewport.zoom,
      };
      updateScaling(worldPoint);
    };

    const handleGlobalMouseUp = () => {
      completeScaling();
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    isScaleMode,
    isScaling,
    containerRef,
    viewport,
    updateScaling,
    completeScaling,
  ]);
}
