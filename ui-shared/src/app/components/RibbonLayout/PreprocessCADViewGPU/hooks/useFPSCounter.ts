import { useEffect, useRef } from 'react';

/**
 * Custom hook for FPS counter display
 */
export const useFPSCounter = () => {
  const fpsDisplayRef = useRef<HTMLDivElement>(null);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animationFrameId: number;

    const updateFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      // Update FPS every 500ms
      if (delta >= 500) {
        const currentFps = Math.round((frameCountRef.current * 1000) / delta);
        const display = fpsDisplayRef.current;
        if (display) {
          display.textContent = currentFps.toString();
          // Update color based on FPS
          display.className = `font-bold ${
            currentFps >= 55 ? 'text-green-600' : currentFps >= 30 ? 'text-yellow-600' : 'text-red-600'
          }`;
        }
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameId = requestAnimationFrame(updateFPS);
    };

    animationFrameId = requestAnimationFrame(updateFPS);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return fpsDisplayRef;
};
