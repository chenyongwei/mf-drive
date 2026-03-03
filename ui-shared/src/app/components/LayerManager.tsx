import React, { useState } from 'react';
import { useAppStore } from '../store';
import { useLayerLoader } from '../layerManager/hooks/useLayerLoader';
import { useLayerGrouper } from '../layerManager/hooks/useLayerGrouper';
import { useLayerActions } from '../layerManager/hooks/useLayerActions';
import { SuggestionBanner } from '../layerManager/SuggestionBanner';
import { LayerToolbar } from '../layerManager/LayerToolbar';
import { LayerGroup } from '../layerManager/LayerGroup';
import { LayerLegend } from '../layerManager/LayerLegend';

type GroupType = 'none' | 'color' | 'name';

const LayerManager: React.FC = () => {
  const { getActiveFile, getActiveFileLayers, setLayers } = useAppStore();
  const [groupType, setGroupType] = useState<GroupType>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const layers = getActiveFileLayers();
  const currentFile = getActiveFile();

  // Load layers when file is ready
  useLayerLoader({ currentFile, layers, setLayers });

  // Group layers by color or name
  const groupedLayers = useLayerGrouper({ layers, groupType });

  // Layer actions
  const {
    applyAllSuggestions,
    handleExport,
    handleImport,
    handleBatchSet,
    getProcessTypeColor,
    getProcessTypeText,
  } = useLayerActions();

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  if (layers.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>暂无图层数据</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Smart Suggestion Banner */}
      <SuggestionBanner
        onApplyAll={() => applyAllSuggestions(layers)}
      />

      {/* Toolbar */}
      <LayerToolbar
        groupType={groupType}
        onGroupTypeChange={(type) => {
          setGroupType(type);
          setExpandedGroups(new Set());
        }}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Layer Groups */}
      <div className="space-y-2">
        {groupedLayers.map((group) => (
          <LayerGroup
            key={group.key}
            group={group}
            isExpanded={expandedGroups.has(group.key)}
            onToggle={() => toggleGroup(group.key)}
            getProcessTypeColor={getProcessTypeColor}
            getProcessTypeText={getProcessTypeText}
            onBatchSet={handleBatchSet}
          />
        ))}
      </div>

      {/* Legend */}
      <LayerLegend />
    </div>
  );
};

export default LayerManager;
