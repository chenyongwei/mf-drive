import React from 'react';
import { useAppStore } from '../store';
import { getAutocadColor, suggestProcessType, getSuggestionExplanation } from './utils/mappingPatterns';
import { LayerItem } from './LayerItem';
import type { LayerGroup } from '../store';

interface LayerGroupProps {
  group: LayerGroup;
  isExpanded: boolean;
  onToggle: () => void;
  getProcessTypeColor: (type: string) => string;
  getProcessTypeText: (type: string) => string;
  onBatchSet: (group: LayerGroup, processType: 'CUT' | 'MARK' | 'NONE') => void;
}

export function LayerGroup({
  group,
  isExpanded,
  onToggle,
  getProcessTypeColor,
  getProcessTypeText,
  onBatchSet,
}: LayerGroupProps) {
  const { getLayerMapping, setLayerMapping } = useAppStore();
  const groupColor = group.layers[0]?.color || 7;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Group Header */}
      <div
        className="p-2.5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Group Label */}
          <span className="text-sm font-medium text-slate-900 truncate">
            {group.label}
          </span>
          <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
            {group.layers.length}
          </span>

          {/* Color preview (only for color grouping) */}
          {group.type === 'color' && (
            <div
              className="w-3 h-3 rounded border border-slate-300 flex-shrink-0"
              style={{ backgroundColor: getAutocadColor(groupColor) }}
            />
          )}
        </div>

        {/* Batch Actions */}
        {isExpanded && (
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBatchSet(group, 'CUT');
              }}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              title="全部设置为切割"
            >
              全切
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBatchSet(group, 'MARK');
              }}
              className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded-md hover:bg-cyan-200 transition-colors"
              title="全部设置为打标"
            >
              全标
            </button>
          </div>
        )}
      </div>

      {/* Layer List (Expanded) */}
      {isExpanded && (
        <div className="p-2 space-y-1 bg-white max-h-80 overflow-y-auto">
          {group.layers.map((layer) => {
            const processType = getLayerMapping(layer.name);
            const suggestedProcessType = suggestProcessType(layer.name);
            const suggestionExplanation = getSuggestionExplanation(layer.name);
            const isUsingSuggestion = processType === suggestedProcessType;

            return (
              <LayerItem
                key={layer.name}
                layer={layer}
                processType={processType}
                suggestedProcessType={suggestedProcessType}
                suggestionExplanation={suggestionExplanation}
                isUsingSuggestion={isUsingSuggestion}
                getProcessTypeColor={getProcessTypeColor}
                getProcessTypeText={getProcessTypeText}
                setLayerMapping={setLayerMapping}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
