import React from 'react';
import { useAppStore } from '../../../store';

interface CoordinateInfoProps {
  entitiesCount: number;
}

export function CoordinateInfo({ entitiesCount }: CoordinateInfoProps) {
  const { view } = useAppStore();

  return (
    <div className="absolute bottom-4 left-4 bg-gray-800 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-300">
      <div>缩放: {view.zoom.toFixed(2)}x</div>
      <div>实体: {entitiesCount}</div>
      <div className="text-xs mt-1">
        视口: [
          {view.viewport?.minX?.toFixed(0) || 'N/A'}, {view.viewport?.minY?.toFixed(0) || 'N/A'}
        ] - [
          {view.viewport?.maxX?.toFixed(0) || 'N/A'}, {view.viewport?.maxY?.toFixed(0) || 'N/A'}
        ]
      </div>
    </div>
  );
}
