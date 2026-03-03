import React from 'react';
import { useAppStore } from '../../../store';

interface DebugInfoProps {
  currentFile: any;
  entities: any[];
}

export function DebugInfo({ currentFile, entities }: DebugInfoProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { view } = useAppStore();

  return (
    <div className="absolute top-4 left-4 bg-gray-800 rounded-lg shadow-lg px-3 py-2 text-xs text-gray-300 max-w-md overflow-auto max-h-64">
      <div className="font-bold mb-2">Debug Info:</div>
      <div>File ID: {currentFile?.id || 'N/A'}</div>
      <div>Status: {currentFile?.status || 'N/A'}</div>
      <div>BBox: {currentFile?.bbox ? JSON.stringify(currentFile.bbox) : 'N/A'}</div>
      <div>Zoom: {view.zoom.toFixed(4)}</div>
      <div>Pan: ({view.pan.x.toFixed(2)}, {view.pan.y.toFixed(2)})</div>
      <div>Entities: {entities.length}</div>
      <div>Viewport: {view.viewport ? JSON.stringify(view.viewport) : 'undefined'}</div>
      <div className="mt-2">
        <div className="font-semibold">First 3 entities:</div>
        {entities.length > 0 ? (
          entities.slice(0, 3).map((e, i) => (
            <div key={i} className="text-xs">
              {e.type}: {JSON.stringify(e.geometry).substring(0, 50)}
            </div>
          ))
        ) : (
          <div className="text-red-500">No entities loaded!</div>
        )}
      </div>
    </div>
  );
}
