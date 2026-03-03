/**
 * WebGPUZoomControls - Zoom control buttons component
 *
 * Displays zoom in/out buttons, percentage display, and fit-to-view button
 */

import React from 'react';

export type ZoomControlsPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface WebGPUZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView?: () => void;
  showFitToView?: boolean;
  position?: ZoomControlsPosition;
}

const WebGPUZoomControls: React.FC<WebGPUZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToView,
  showFitToView = true,
  position = 'bottom-right',
}) => {
  // Calculate position classes
  const getPositionClasses = (): string => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <div className={`absolute ${getPositionClasses()} flex items-center gap-2 bg-white/90 backdrop-blur rounded-lg shadow-lg px-3 py-2`}>
      <button
        onClick={onZoomIn}
        className="px-3 py-1 text-sm hover:bg-slate-100 rounded"
        title="放大"
      >
        🔍+
      </button>
      <span className="text-sm text-slate-600 w-16 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={onZoomOut}
        className="px-3 py-1 text-sm hover:bg-slate-100 rounded"
        title="缩小"
      >
        🔍-
      </button>
      {showFitToView && onFitToView && (
        <button
          onClick={onFitToView}
          className="px-3 py-1 text-sm hover:bg-slate-100 rounded border-l border-slate-300 pl-3"
          title="适应窗口"
        >
          ⛶
        </button>
      )}
    </div>
  );
};

export default WebGPUZoomControls;
