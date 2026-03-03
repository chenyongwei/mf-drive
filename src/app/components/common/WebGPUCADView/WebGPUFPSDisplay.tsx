/**
 * WebGPUFPSDisplay - FPS display component
 *
 * Real-time FPS counter with color coding:
 * - Green: ≥55 FPS
 * - Yellow: ≥30 FPS
 * - Red: <30 FPS
 */

import React, { useRef, useEffect } from 'react';

export type FPSDisplayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface WebGPUFPSDisplayProps {
  fps?: number;
  entityCount?: number;
  fillVertexCount?: number;
  position?: FPSDisplayPosition;
  showDetails?: boolean;
}

const WebGPUFPSDisplay: React.FC<WebGPUFPSDisplayProps> = ({
  fps,
  entityCount = 0,
  fillVertexCount = 0,
  position = 'top-right',
  showDetails = true,
}) => {
  const fpsRef = useRef<HTMLSpanElement>(null);

  // Update FPS display with color coding
  useEffect(() => {
    if (fpsRef.current && fps !== undefined) {
      fpsRef.current.textContent = fps.toFixed(0);

      // Color coding
      if (fps >= 55) {
        fpsRef.current.className = 'font-bold text-green-600';
      } else if (fps >= 30) {
        fpsRef.current.className = 'font-bold text-yellow-600';
      } else {
        fpsRef.current.className = 'font-bold text-red-600';
      }
    }
  }, [fps]);

  // Calculate position classes
  const getPositionClasses = (): string => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
    }
  };

  return (
    <div className={`absolute ${getPositionClasses()} bg-white/90 backdrop-blur rounded-lg shadow-lg px-4 py-2 text-sm text-slate-600`}>
      {showDetails && (
        <>
          <div>实体数: {entityCount}</div>
          {fillVertexCount > 0 && <div>填充顶点: {fillVertexCount}</div>}
        </>
      )}
      <div>
        WebGPU FPS: <span ref={fpsRef}>--</span>
      </div>
    </div>
  );
};

export default WebGPUFPSDisplay;
