import React from 'react';
import { useAppStore } from '../../../store';
import { calculateViewport } from '../../../utils/viewport';

interface ZoomControlsProps {
  currentFile: any;
  stageSize: { width: number; height: number };
}

export function ZoomControls({ currentFile, stageSize }: ZoomControlsProps) {
  const { view, setView } = useAppStore();

  const handleZoomIn = () => {
    const newZoom = view.zoom * 1.2;
    setView({ zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = view.zoom / 1.2;
    setView({ zoom: newZoom });
  };

  const handleFitView = () => {
    if (!currentFile?.bbox) return;
    const bbox = currentFile.bbox;
    const scaleX = stageSize.width / (bbox.maxX - bbox.minX);
    const scaleY = stageSize.height / (bbox.maxY - bbox.minY);
    const newZoom = Math.min(scaleX, scaleY) * 0.9;
    const newPan = {
      x: -bbox.minX * newZoom + 20,
      y: bbox.maxY * newZoom + 20,
    };
    setView({
      zoom: newZoom,
      pan: newPan,
      viewport: calculateViewport(newPan, newZoom, stageSize),
    });
  };

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-gray-800 rounded-lg shadow-lg p-2">
      <button
        className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded"
        onClick={handleZoomIn}
      >
        <span className="text-white text-lg">+</span>
      </button>
      <button
        className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded"
        onClick={handleZoomOut}
      >
        <span className="text-white text-lg">−</span>
      </button>
      <button
        className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
        onClick={handleFitView}
      >
        Fit
      </button>
    </div>
  );
}
