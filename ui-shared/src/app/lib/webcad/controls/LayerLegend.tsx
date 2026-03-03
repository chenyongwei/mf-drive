import React from 'react';

export function LayerLegend() {
  return (
    <div className="absolute top-24 right-4 bg-gray-800 rounded-lg shadow-lg px-3 py-2">
      <h4 className="text-xs font-medium text-gray-400 mb-2">图层图例</h4>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-12 h-0.5 bg-green-500"></div>
          <span className="text-xs text-gray-300">切割</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-0.5 bg-cyan-400 border-dashed border-t-2 border-cyan-400"></div>
          <span className="text-xs text-gray-300">打标</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-0.5 bg-gray-200"></div>
          <span className="text-xs text-gray-300">不加工</span>
        </div>
      </div>
    </div>
  );
}
