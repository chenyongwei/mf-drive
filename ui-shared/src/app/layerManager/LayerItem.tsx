import React from 'react';
import { getAutocadColor } from './utils/mappingPatterns';
import type { LayerInfo } from '../store';

interface LayerItemProps {
  layer: LayerInfo;
  processType: string;
  suggestedProcessType: string;
  suggestionExplanation: string | null;
  isUsingSuggestion: boolean;
  getProcessTypeColor: (type: string) => string;
  getProcessTypeText: (type: string) => string;
  setLayerMapping: (layerName: string, processType: string) => void;
}

export function LayerItem({
  layer,
  processType,
  suggestedProcessType,
  suggestionExplanation,
  isUsingSuggestion,
  getProcessTypeColor,
  getProcessTypeText,
  setLayerMapping,
}: LayerItemProps) {
  const layerColor = getAutocadColor(layer.color);

  return (
    <div className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Color preview */}
          <div
            className="w-3 h-3 rounded border border-slate-300 flex-shrink-0"
            style={{ backgroundColor: layerColor }}
            title={`AutoCAD颜色索引: ${layer.color}`}
          />
          {/* Layer name */}
          <span className="text-sm text-slate-900 truncate">
            {layer.name}
          </span>
        </div>

        {/* Process type selector */}
        <select
          value={processType}
          onChange={(e) => setLayerMapping(layer.name, e.target.value)}
          className="text-xs px-2 py-1 rounded-md border border-slate-300 bg-white cursor-pointer hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="NONE">不加工</option>
          <option value="CUT">切割</option>
          <option value="MARK">打标</option>
        </select>
      </div>

      {/* Entity count and current process type */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{layer.entityCount} 实体</span>
        <span className={`px-2 py-0.5 rounded-full ${getProcessTypeColor(processType)}`}>
          {getProcessTypeText(processType)}
        </span>
      </div>

      {/* Smart suggestion indicator */}
      {!isUsingSuggestion && suggestionExplanation && (
        <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-md text-xs text-indigo-700">
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5-1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5-1.253" />
            </svg>
            <span className="flex-1">{suggestionExplanation}</span>
            <button
              onClick={() => setLayerMapping(layer.name, suggestedProcessType)}
              className="text-indigo-600 hover:text-indigo-800 flex-shrink-0 font-medium"
            >
              应用
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
